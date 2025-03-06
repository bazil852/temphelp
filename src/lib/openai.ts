import OpenAI from 'openai';
import { useAuthStore } from '../store/authStore';

export const generateAIScript = async (prompt: string): Promise<string> => {
  const user = useAuthStore.getState().currentUser;
  if (!user?.openaiApiKey) {
    throw new Error('OpenAI API key not found');
  }

  try {
    const openai = new OpenAI({
      apiKey: user.openaiApiKey,
      dangerouslyAllowBrowser: true
    });

    const systemPrompt = `You are a professional script writer. Write word-for-word what should be said, without any formatting or emojis. Use ⏱️ to indicate a natural pause in speech. Keep the tone conversational and authentic.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI Script Generation Error:', error);
    throw new Error('Failed to generate script');
  }
};