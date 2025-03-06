import { HeyGenResponse, VideoStatus, CreateVideoParams } from '../types/heygen';
import { useAuthStore } from '../store/authStore';

const HEYGEN_API_URL = 'https://api.heygen.com';


export function createVideo({
  templateId,
  script,
  title,
  audioUrl
}: Omit<CreateVideoParams, 'apiKey'> & { audioUrl: string }): Promise<string> {
  const user = useAuthStore.getState().currentUser;
  if (!user?.heygenApiKey) {
    throw new Error('HeyGen API key not found');
  }

  console.log(script, templateId,title,audioUrl);

  return fetch(`${HEYGEN_API_URL}/v2/video/generate`, {
    method: 'POST',
    headers: {
      'X-Api-Key': user.heygenApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      test: false,
      caption: false,
      title: title,
      video_inputs: [
        {
          character: {
            type: "talking_photo",
            talking_photo_id: templateId
          },
          voice: {
            type: "audio",
            audio_url: audioUrl // ✅ Corrected field name
          }
        }
      ],
      dimension: {
        width: 1280,
        height: 720
      }
    }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.message || 'Failed to create video');
        });
      }
      return response.json();
    })
    .then(data => {
      if (!data.data?.video_id) {
        throw new Error('No video ID received from HeyGen API');
      }
      return data.data.video_id;
    })
    .catch(error => {
      console.error('HeyGen API Error:', error);
      throw error;
    });
}


export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const user = useAuthStore.getState().currentUser;
  if (!user?.heygenApiKey) {
    throw new Error('HeyGen API key not found');
  }

  try {
    const response = await fetch(`${HEYGEN_API_URL}/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': user.heygenApiKey,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get video status');
    }

    return {
      status: data.data.status.toLowerCase(),
      url: data.data.video_url,
      error: data.data.error
    };
  } catch (error) {
    console.error('HeyGen Status Error:', error);
    throw error;
  }
}