// Environment variables with type safety
interface Env {
    AI_CLONE_BACKEND_PROXY: string;
  }
  
  export const env: Env = {
    AI_CLONE_BACKEND_PROXY: import.meta.env.VITE_AI_CLONE_BACKEND_PROXY || '',
  };