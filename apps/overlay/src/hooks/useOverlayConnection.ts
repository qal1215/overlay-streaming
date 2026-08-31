import { useState, useEffect, useRef } from 'react';
import type { AlertEvent, OverlayRuntimeState } from '@overlay/schema';
import { OverlayRuntimeMessageSchema } from '@overlay/schema';
import { API_URL } from '../lib/config';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export function useOverlayConnection(overlayId: string, onAlertEvent?: (event: AlertEvent) => void) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [runtimeState, setRuntimeState] = useState<OverlayRuntimeState | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000); // Start with 1 second

  const runtimeStateRef = useRef<OverlayRuntimeState | null>(null);
  useEffect(() => {
    runtimeStateRef.current = runtimeState;
  }, [runtimeState]);
  
  const onAlertEventRef = useRef(onAlertEvent);
  useEffect(() => {
    onAlertEventRef.current = onAlertEvent;
  }, [onAlertEvent]);

  useEffect(() => {
    if (!overlayId) return;

    let mounted = true;

    const connect = () => {
      if (!mounted) return;
      
      setConnectionState(backoffRef.current > 1000 ? 'reconnecting' : 'connecting');
      
      const wsUrl = API_URL.replace(/^http/, 'ws') + `/api/overlay/${overlayId}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setConnectionState('connected');
        backoffRef.current = 1000; // Reset backoff on success
      };

      let messageQueue = Promise.resolve();

      ws.onmessage = (event) => {
        messageQueue = messageQueue.then(async () => {
          if (!mounted) return;
          
          try {
            const data = JSON.parse(event.data);
            const parsed = OverlayRuntimeMessageSchema.parse(data);

            if (parsed.type === 'overlay:init' || parsed.type === 'overlay:update') {
              const { prepareAlertAudio } = await import('../lib/prepareAlertAudio');
              await prepareAlertAudio(Object.values(parsed.state.alerts), parsed.state.overlay.assets);
              if (!mounted) return;
              setRuntimeState(parsed.state);
            } else if (parsed.type === 'alert:update') {
              const currentAssets = runtimeStateRef.current?.overlay.assets;
              const { prepareAlertAudio } = await import('../lib/prepareAlertAudio');
              await prepareAlertAudio([parsed.alert], currentAssets);
              if (!mounted) return;
              setRuntimeState(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  alerts: {
                    ...prev.alerts,
                    [parsed.alert.id]: parsed.alert
                  }
                };
              });
            } else if (parsed.type === 'alert:event') {
              if (onAlertEventRef.current) {
                onAlertEventRef.current(parsed.event);
              }
            } else if (parsed.type === 'error') {
              console.error('Overlay error:', parsed.message);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message', err);
          }
        }).catch(err => {
          console.error('WebSocket message queue error:', err);
        });
      };

      ws.onclose = () => {
        if (!mounted) return;
        setConnectionState('disconnected');
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (!mounted) return;
        setConnectionState('error');
        // onclose is usually called after onerror, so we let onclose handle the reconnect
      };
    };

    const scheduleReconnect = () => {
      if (!mounted) return;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Max backoff of 30 seconds
      const nextBackoff = Math.min(backoffRef.current * 2, 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoffRef.current);
      
      backoffRef.current = nextBackoff;
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [overlayId]);

  return { connectionState, runtimeState };
}
