import { useEffect, useState } from 'react';

// Placeholder hook for Step 5.6 WebSocket implementation
export function useWebSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Scaffolded for later wiring
    // if (!token) return;
    // const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL + '/ws/' + token);
    // ws.onopen = () => setIsConnected(true);
    // ws.onclose = () => setIsConnected(false);
    // return () => ws.close();
  }, [token]);

  return {
    isConnected,
  };
}
