// features/chat/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Id, WSStatus, WS_BASE } from "./chatTypes";

const buildChatWsUrl = (roomId: Id, token: string) => {
  const base = WS_BASE.replace(/\/+$/, ""); // remove trailing slash if any
  return `${base}/ws/chat/${roomId}/?token=${encodeURIComponent(token)}`;
};

export function useWebSocket(
  targetRoomId: Id | null,
  token: string | null,
  onEvent: (event: string, payload: unknown, roomId: Id) => void,
) {
  const onEvRef = useRef(onEvent);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const pendingQueueRef = useRef<unknown[]>([]);

  onEvRef.current = onEvent;

  const send = useCallback(
    (data: unknown) => {
      const ws = wsRef.current;

      console.log("[WSDebug] send() called", {
        hasWs: !!ws,
        readyState: ws?.readyState,
        targetRoomId,
        status,
        data,
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify(data);
        console.log("[WSDebug] sending now:", payload);
        ws.send(payload);
        return true;
      }

      const isConnecting = ws && ws.readyState === WebSocket.CONNECTING;
      const isInitializing = !ws && targetRoomId != null;

      if (isConnecting || isInitializing) {
        console.log("[WSDebug] socket not ready yet, queueing message");
        pendingQueueRef.current.push(data);
        return true;
      }

      console.warn("[WSDebug] send() failed: socket is not open");
      return false;
    },
    [targetRoomId, status],
  );

  useEffect(() => {
    console.log("[WSDebug] useWebSocket effect fired", {
      targetRoomId,
      hasToken: !!token,
      wsBase: WS_BASE,
    });

    if (!targetRoomId || !token) {
      console.log("[WSDebug] no room/token, closing socket if any");

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try {
          wsRef.current.close(1000, "No room or token");
        } catch {}
        wsRef.current = null;
      }

      pendingQueueRef.current = [];
      setStatus("disconnected");
      return;
    }

    mountedRef.current = true;
    retryCountRef.current = 0;
    pendingQueueRef.current = [];

    const connect = () => {
      if (!mountedRef.current) return;

      const existing = wsRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN ||
          existing.readyState === WebSocket.CONNECTING)
      ) {
        console.log("[WSDebug] socket already open/connecting, skipping connect");
        return;
      }

      setStatus("connecting");

      const wsUrl = buildChatWsUrl(targetRoomId, token);

      console.log("[WSDebug] connecting to WebSocket", {
        roomId: targetRoomId,
        url: wsUrl,
      });

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const connTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn("[WSDebug] connection timeout, closing socket", wsUrl);
            try {
              ws.close(1000, "Connection timeout");
            } catch {}
          }
        }, 10000);

        ws.onopen = () => {
          clearTimeout(connTimeout);

          if (!mountedRef.current || ws !== wsRef.current) {
            console.log("[WSDebug] stale socket opened, closing it");
            try {
              ws.close(1000, "Stale socket");
            } catch {}
            return;
          }

          console.log("[WSDebug] WebSocket OPENED", {
            roomId: targetRoomId,
            url: wsUrl,
          });

          retryCountRef.current = 0;
          setStatus("connected");

          const queue = pendingQueueRef.current;
          pendingQueueRef.current = [];

          console.log("[WSDebug] flushing queued messages", {
            count: queue.length,
          });

          queue.forEach((msg, index) => {
            try {
              const payload = JSON.stringify(msg);
              console.log(`[WSDebug] flush[${index}]`, payload);
              ws.send(payload);
            } catch (e) {
              console.warn("[WSDebug] failed to flush queued message", e);
            }
          });
        };

        ws.onmessage = (e) => {
          if (ws !== wsRef.current) return;

          console.log("[WSDebug] incoming raw message:", e.data);

          try {
            const parsed = JSON.parse(e.data);
            console.log("[WSDebug] incoming parsed message:", parsed);

            onEvRef.current(
              parsed.event || parsed.type || "unknown",
              parsed.payload ?? parsed,
              targetRoomId,
            );
          } catch (err) {
            console.warn("[WSDebug] failed to parse incoming message", err);
          }
        };

        ws.onclose = (ev) => {
          clearTimeout(connTimeout);

          console.log("[WSDebug] WebSocket CLOSED", {
            roomId: targetRoomId,
            code: ev.code,
            reason: ev.reason,
            wasClean: ev.wasClean,
            url: wsUrl,
          });

          if (ws !== wsRef.current) return;

          wsRef.current = null;

          if (!mountedRef.current) return;

          setStatus("disconnected");

          if (ev.code !== 1000 && ev.code !== 1001) {
            retryCountRef.current += 1;

            if (retryCountRef.current <= 8) {
              const delay = Math.min(
                500 * Math.pow(1.5, retryCountRef.current - 1),
                30000,
              );

              console.log("[WSDebug] scheduling reconnect", {
                attempt: retryCountRef.current,
                delay,
              });

              retryTimerRef.current = setTimeout(connect, delay);
            } else {
              console.warn("[WSDebug] max reconnect attempts reached");
            }
          }
        };

        ws.onerror = (err) => {
          console.error("[WSDebug] WebSocket ERROR", {
            roomId: targetRoomId,
            url: wsUrl,
            error: err,
            readyState: ws.readyState,
          });

          if (ws === wsRef.current) {
            setStatus("error");
          }
          // Do not force ws.close(1006) here; that can create noisy/invalid close behavior.
        };
      } catch (err) {
        console.error("[WSDebug] failed to create WebSocket", err);
        setStatus("error");
      }
    };

    connect();

    return () => {
      mountedRef.current = false;

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      pendingQueueRef.current = [];

      const ws = wsRef.current;
      wsRef.current = null;

      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        try {
          ws.close(1000, "Cleanup");
        } catch {}
      }
    };
  }, [targetRoomId, token]);

  return { status, send };
}