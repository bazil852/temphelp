// Environment variables with type safety
interface Env {
    AI_CLONE_BACKEND_PROXY: string;
    API_TESTURL: string;
  }
  
  export const env: Env = {
    AI_CLONE_BACKEND_PROXY: import.meta.env.VITE_AI_CLONE_BACKEND_PROXY || '',
    API_TESTURL: import.meta.env.VITE_API_TESTURL || '',
  };