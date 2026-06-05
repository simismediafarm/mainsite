import { useEffect, useRef } from 'react';
import { SSEEvent } from '@simis/shared';

export function useEventSourceFeed(onEvent: (event: SSEEvent) => void) {
  const callbackRef = useRef(onEvent);

  // Keep callback updated
  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const eventSource = new EventSource('/api/mvp/stream');

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.type) {
          callbackRef.current(data);
        }
      } catch (err) {
        console.error('SSE JSON parse failed:', err);
      }
    };

    eventSource.onerror = () => {
      // Intentionally quiet: SSE natively auto-reconnects.
      // console.warn('SSE reconnecting or server offline.');
    };

    return () => {
      eventSource.close();
    };
  }, []);
}
