// features/chat/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Id, WSStatus, WS_BASE } from './chatTypes';

export function useWebSocket(
  targetRoomId: Id | null,
  token: string | null,
  onEvent: (event: string, payload: unknown, roomId: Id) => void,
) {
  const onEvRef = useRef(onEvent);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  onEvRef.current = onEvent;

  const send = useCallback((data: unknown) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(data));
    return true;
  }, []);

  useEffect(() => {
    if (!targetRoomId || !token) {
      if (wsRef.current) {
        wsRef.current.onopen = wsRef.current.onmessage =
          wsRef.current.onclose = wsRef.current.onerror = null;
        try { wsRef.current.close(1000, 'No room'); } catch { }
        wsRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    mountedRef.current = true;
    retryCountRef.current = 0;

    const connect = () => {
      if (!mountedRef.current) return;
      if (wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)) return;

      setStatus('connecting');
      try {
        const ws = new WebSocket(`${WS_BASE}/${targetRoomId}/?token=${token}`);
        wsRef.current = ws;
        const connTimeout = setTimeout(() => { if (ws.readyState !== WebSocket.OPEN) ws.close(); }, 10000);

        ws.onopen = () => {
          clearTimeout(connTimeout);
          if (!mountedRef.current || ws !== wsRef.current) { ws.close(1000, 'Stale'); return; }
          retryCountRef.current = 0;
          setStatus('connected');
        };

        ws.onmessage = (e) => {
          if (ws !== wsRef.current) return;
          try {
            const d = JSON.parse(e.data);
            onEvRef.current(d.event || d.type || 'unknown', d.payload ?? d, targetRoomId);
          } catch { }
        };

        ws.onclose = (ev) => {
          clearTimeout(connTimeout);
          if (ws !== wsRef.current) return;
          wsRef.current = null;
          if (!mountedRef.current) return;
          setStatus('disconnected');
          if (ev.code !== 1000 && ev.code !== 1001) {
            retryCountRef.current++;
            if (retryCountRef.current <= 8) {
              const delay = Math.min(500 * Math.pow(1.5, retryCountRef.current - 1), 30000);
              retryTimerRef.current = setTimeout(connect, delay);
            }
          }
        };

        ws.onerror = () => { if (ws === wsRef.current) setStatus('error'); };
      } catch { setStatus('error'); }
    };

    const initTimer = setTimeout(connect, 200);
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
        try { ws.close(1000, 'Cleanup'); } catch { }
      }
    };
  }, [targetRoomId, token]);

  return { status, send };
}