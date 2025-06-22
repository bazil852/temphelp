// Shared token store for webhook testing
// In production, this would be replaced with Redis or another persistent store

interface TokenData {
  workflowId: string;
  nodeId: string;
  expires: number;
}

// Global token store
const tokenStore = new Map<string, TokenData>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (now > value.expires) {
      tokenStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export const setToken = (token: string, data: TokenData): void => {
  tokenStore.set(`capture:${token}`, data);
};

export const getToken = (token: string): TokenData | null => {
  const data = tokenStore.get(`capture:${token}`);
  
  if (!data) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > data.expires) {
    tokenStore.delete(`capture:${token}`);
    return null;
  }
  
  return data;
};

export const deleteToken = (token: string): void => {
  tokenStore.delete(`capture:${token}`);
};

export const getTokenStoreSize = (): number => {
  return tokenStore.size;
}; 