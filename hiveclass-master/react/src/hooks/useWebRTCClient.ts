/**
 * React Hook for WebRTC Client (Student-side)
 *
 * Wraps the modernized WebRTC client implementation (Phase 5) in a React hook.
 * Provides connection state management, message sending, and media stream handling.
 *
 * @example
 * ```tsx
 * function StudentApp() {
 *   const {
 *     client,
 *     connected,
 *     error,
 *     sendMessage,
 *     attachStream,
 *     detachStream
 *   } = useWebRTCClient({
 *     rendezvousEndpoint: 'ws://localhost:9090',
 *     onOpen: () => console.log('Connected!'),
 *     onMessage: (msg) => console.log('Message:', msg)
 *   });
 *
 *   return <div>Connected: {connected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Import the modernized WebRTC client (Phase 5)
// Note: This is JavaScript, so we use @ts-ignore
// @ts-ignore
import { RTCClient } from '@/services/webrtc-client/client.js';

export interface UseWebRTCClientOptions {
  /** WebSocket rendezvous server endpoint (e.g., 'ws://localhost:9090') */
  rendezvousEndpoint: string;

  /** Callback when connection opens */
  onOpen?: () => void;

  /** Callback when connection closes */
  onClose?: () => void;

  /** Callback when error occurs */
  onError?: (error: Error) => void;

  /** Callback when message received */
  onMessage?: (message: any) => void;

  /** Callback when remote stream added */
  onRemoteStream?: (stream: MediaStream) => void;
}

export interface UseWebRTCClientReturn {
  /** The WebRTC client instance */
  client: any | null;

  /** Whether connected to the rendezvous server */
  connected: boolean;

  /** Current error, if any */
  error: Error | null;

  /** Send a message through the data channel */
  sendMessage: (message: string) => void;

  /** Attach a local media stream (video/audio) */
  attachStream: (stream: MediaStream) => void;

  /** Detach a local media stream */
  detachStream: (stream: MediaStream) => void;

  /** Start the WebRTC client */
  start: () => void;

  /** Stop the WebRTC client */
  stop: () => void;
}

/**
 * Hook for WebRTC Client (Student-side)
 *
 * Manages WebRTC peer connection with the teacher.
 * Handles media streams, data channels, and signaling.
 */
export function useWebRTCClient(options: UseWebRTCClientOptions): UseWebRTCClientReturn {
  const {
    rendezvousEndpoint,
    onOpen,
    onClose,
    onError,
    onMessage,
    onRemoteStream,
  } = options;

  const [client, setClient] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<any>(null);

  useEffect(() => {
    // Create RTCClient instance with callbacks
    const rtcClient = new RTCClient(rendezvousEndpoint, {
      onopen: () => {
        setConnected(true);
        setError(null);
        onOpen?.();
      },
      onclose: () => {
        setConnected(false);
        onClose?.();
      },
      onerror: (err: Error) => {
        setError(err);
        onError?.(err);
      },
      onmessage: (msg: any) => {
        onMessage?.(msg);
      },
      onremotestream: (stream: MediaStream) => {
        onRemoteStream?.(stream);
      },
    });

    setClient(rtcClient);
    clientRef.current = rtcClient;

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.stop();
        clientRef.current = null;
      }
    };
  }, [rendezvousEndpoint, onOpen, onClose, onError, onMessage, onRemoteStream]);

  const sendMessage = useCallback((message: string) => {
    if (clientRef.current) {
      try {
        clientRef.current.send(message);
      } catch (err) {
        console.error('Failed to send message:', err);
        setError(err as Error);
      }
    }
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    if (clientRef.current) {
      try {
        clientRef.current.attachStream(stream);
      } catch (err) {
        console.error('Failed to attach stream:', err);
        setError(err as Error);
      }
    }
  }, []);

  const detachStream = useCallback((stream: MediaStream) => {
    if (clientRef.current) {
      try {
        clientRef.current.detachStream(stream);
      } catch (err) {
        console.error('Failed to detach stream:', err);
        setError(err as Error);
      }
    }
  }, []);

  const start = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.start();
      } catch (err) {
        console.error('Failed to start client:', err);
        setError(err as Error);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.stop();
        setConnected(false);
      } catch (err) {
        console.error('Failed to stop client:', err);
        setError(err as Error);
      }
    }
  }, []);

  return {
    client,
    connected,
    error,
    sendMessage,
    attachStream,
    detachStream,
    start,
    stop,
  };
}
