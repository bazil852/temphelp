import { Content, Webhook } from '../types';
import { useAuthStore } from '../store/authStore';
import { useInfluencerStore } from '../store/influencerStore';
import { useContentStore } from '../store/contentStore';

export async function sendWebhookNotification(webhook: Webhook, content: Content) {
  try {
    const influencer = useInfluencerStore.getState().influencers
      .find(inf => inf.id === content.influencerId);

    if (!influencer || !webhook.active) return;

    const payload = {
      event: webhook.event,
      content: {
        title: content.title,
        script: content.script,
        influencerName: influencer.name,
        video_url: content.video_url,
        status: content.status,
        error: content.error
      }
    };

    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send webhook notification:', error);
  }
}

export async function handleIncomingWebhook(webhookId: string, data: any) {
  try {
    const webhook = useWebhookStore.getState().webhooks
      .find(w => w.id === webhookId);

    if (!webhook || !webhook.active) {
      throw new Error('Webhook not found or not active');
    }

    const { title, script } = data;
    if (!title || !script) {
      throw new Error('Missing required fields: title and script');
    }

    const user = useAuthStore.getState().currentUser;
    if (!user) throw new Error('No user authenticated');

    if (!webhook.influencerIds?.length) {
      throw new Error('No influencers configured for webhook');
    }

    // Generate video for each configured influencer
    for (const influencerId of webhook.influencerIds) {
      const influencer = useInfluencerStore.getState().influencers
        .find(inf => inf.id === influencerId);
      
      if (influencer) {
        await useContentStore.getState().generateVideo({
          influencerId,
          templateId: influencer.templateId,
          script,
          title
        });
      }
    }
  } catch (error) {
    console.error('Failed to handle incoming webhook:', error);
    throw error;
  }
}