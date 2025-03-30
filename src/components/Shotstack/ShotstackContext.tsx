import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
  } from 'react';
  
  interface Shotstack {
    create: (...args: any[]) => void;
    load: (target: string, json: any, callback?: Function) => void;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
  }
  
  const ShotstackContext = createContext<Shotstack | null>(null);
  
  // ✅ Export hook first (this is okay)
  export const useShotstack = () => {
    return useContext(ShotstackContext);
  };
  
  // ✅ Use a named function + default export
  function ShotstackProvider({ children }: { children: ReactNode }) {
    const [shotstack, setShotstack] = useState<Shotstack | null>(null);
  
    useEffect(() => {
      const script = document.createElement('script');
      script.src = 'https://js.shotstack.io/studio/0.5.6/shotstack.min.js';
      script.async = true;
      script.onload = () => {
        console.log('[Shotstack] SDK loaded');
        if ((window as any).shotstack) {
          const sdk = (window as any).shotstack;
          setShotstack({
            ...sdk,
            load: (json: any, callback?: Function) =>
              sdk.load('studio-sdk-editor', json, callback),
          });
        }
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }, []);
  
    return (
      <ShotstackContext.Provider value={shotstack}>
        {children}
      </ShotstackContext.Provider>
    );
  }
  
  // ✅ default export for provider
  export default ShotstackProvider;
  