import { useEffect, useState, useRef, useCallback } from 'react';
import type { Message } from '@/types';

interface UseWebSocketProps {
  token: string | null;
  onNewMessage?: (message: Message) => void;
  onTyping?: (conversationId: number, userId: number) => void;
  onReadReceipt?: (messageId: number, userId: number, status: string, conversationId: number) => void;
  onRemovedFromGroup?: (conversationId: number) => void;
}

export function useWebSocket({ token, onNewMessage, onTyping, onReadReceipt, onRemovedFromGroup }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<string[]>([]);

  const callbacksRef = useRef({ onNewMessage, onTyping, onReadReceipt, onRemovedFromGroup });
  useEffect(() => {
    callbacksRef.current = { onNewMessage, onTyping, onReadReceipt, onRemovedFromGroup };
  }, [onNewMessage, onTyping, onReadReceipt, onRemovedFromGroup]);

  useEffect(() => {
    if (!token) return;

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      ws = new WebSocket(`${wsUrl}/ws/${token}`);
      wsRef.current = ws; // Set ref immediately so we can check CONNECTING state

      ws.onopen = () => {
        setIsConnected(true);
        // Flush queue
        while (messageQueueRef.current.length > 0) {
          const payload = messageQueueRef.current.shift();
          if (payload && ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const cbs = callbacksRef.current;

          if (data.type === 'new_message' && cbs.onNewMessage) {
            cbs.onNewMessage(data.message);
          } else if (data.type === 'typing' && cbs.onTyping) {
            cbs.onTyping(data.conversation_id, data.user_id);
          } else if (data.type === 'read_receipt' && cbs.onReadReceipt) {
            cbs.onReadReceipt(data.message_id, data.user_id, data.status, data.conversation_id);
          } else if (data.type === 'removed_from_group' && cbs.onRemovedFromGroup) {
            cbs.onRemovedFromGroup(data.conversation_id);
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS error', err);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }
    };
  }, [token]);

  const sendMessageViaWs = useCallback((conversationId: number, content: string) => {
    const payload = JSON.stringify({
      type: 'send_message',
      conversation_id: conversationId,
      content
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
      return true;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      messageQueueRef.current.push(payload);
      return true; // Pretend we sent it, it's queued
    }
    return false;
  }, []);

  const sendTypingViaWs = useCallback((conversationId: number) => {
    const payload = JSON.stringify({
      type: 'typing',
      conversation_id: conversationId
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    }
  }, []);

  const sendMarkReadViaWs = useCallback((messageId: number) => {
    const payload = JSON.stringify({
      type: 'mark_read',
      message_id: messageId
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    }
  }, []);

  return {
    isConnected,
    sendMessageViaWs,
    sendTypingViaWs,
    sendMarkReadViaWs
  };
}
