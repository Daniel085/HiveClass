/**
 * React Hook for WebRTC Server (Teacher-side)
 *
 * Wraps the modernized WebRTC server implementation (Phase 5) in a React hook.
 * Manages multiple peer connections (multi-student support).
 *
 * @example
 * ```tsx
 * function TeacherApp() {
 *   const {
 *     server,
 *     peers,
 *     connected,
 *     broadcastMessage,
 *     sendToPeer,
 *   } = useWebRTCServer({
 *     rendezvousEndpoint: 'ws://localhost:9090',
 *     onPeerConnected: (peerId) => console.log('Student joined:', peerId),
 *     onPeerDisconnected: (peerId) => console.log('Student left:', peerId),
 *   });
 *
 *   return <div>Students connected: {peers.size}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Import the modernized WebRTC server (Phase 5)
// @ts-ignore
import { RTCServer } from '@/services/webrtc-server/server.js';

export interface UseWebRTCServerOptions {
  /** WebSocket rendezvous server endpoint (e.g., 'ws://localhost:9090') */
  rendezvousEndpoint: string;

  /** Callback when server connects to rendezvous */
  onOpen?: () => void;

  /** Callback when server disconnects */
  onClose?: () => void;

  /** Callback when error occurs */
  onError?: (error: Error) => void;

  /** Callback when a peer (student) connects */
  onPeerConnected?: (peerId: string, peer: any) => void;

  /** Callback when a peer (student) disconnects */
  onPeerDisconnected?: (peerId: string) => void;

  /** Callback when message received from a peer */
  onMessage?: (peerId: string, message: any) => void;

  /** Callback when remote stream added from a peer */
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
}

export interface UseWebRTCServerReturn {
  /** The WebRTC server instance */
  server: any | null;

  /** Map of connected peers (students) */
  peers: Map<string, any>;

  /** Whether connected to the rendezvous server */
  connected: boolean;

  /** Current error, if any */
  error: Error | null;

  /** Broadcast a message to all connected peers */
  broadcastMessage: (message: string) => void;

  /** Send a message to a specific peer */
  sendToPeer: (peerId: string, message: string) => void;

  /** Broadcast a stream to all peers */
  broadcastStream: (stream: MediaStream) => void;

  /** Send a stream to a specific peer */
  sendStreamToPeer: (peerId: string, stream: MediaStream) => void;

  /** Start the WebRTC server */
  start: () => void;

  /** Stop the WebRTC server */
  stop: () => void;
}

/**
 * Hook for WebRTC Server (Teacher-side)
 *
 * Manages WebRTC peer connections with multiple students.
 * Handles media streams, data channels, and signaling for all students.
 */
export function useWebRTCServer(options: UseWebRTCServerOptions): UseWebRTCServerReturn {
  const {
    rendezvousEndpoint,
    onOpen,
    onClose,
    onError,
    onPeerConnected,
    onPeerDisconnected,
    onMessage,
    onRemoteStream,
  } = options;

  const [server, setServer] = useState<any | null>(null);
  const [peers, setPeers] = useState<Map<string, any>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const serverRef = useRef<any>(null);

  useEffect(() => {
    // Create RTCServer instance with callbacks
    const rtcServer = new RTCServer(rendezvousEndpoint, {
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
      onpeerconnected: (peerId: string, peer: any) => {
        setPeers((prev) => {
          const next = new Map(prev);
          next.set(peerId, peer);
          return next;
        });
        onPeerConnected?.(peerId, peer);
      },
      onpeerdisconnected: (peerId: string) => {
        setPeers((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
        onPeerDisconnected?.(peerId);
      },
      onmessage: (peerId: string, msg: any) => {
        onMessage?.(peerId, msg);
      },
      onremotestream: (peerId: string, stream: MediaStream) => {
        onRemoteStream?.(peerId, stream);
      },
    });

    setServer(rtcServer);
    serverRef.current = rtcServer;

    // Cleanup on unmount
    return () => {
      if (serverRef.current) {
        serverRef.current.stop();
        serverRef.current = null;
      }
    };
  }, [rendezvousEndpoint, onOpen, onClose, onError, onPeerConnected, onPeerDisconnected, onMessage, onRemoteStream]);

  const broadcastMessage = useCallback((message: string) => {
    if (serverRef.current) {
      try {
        serverRef.current.broadcast(message);
      } catch (err) {
        console.error('Failed to broadcast message:', err);
        setError(err as Error);
      }
    }
  }, []);

  const sendToPeer = useCallback((peerId: string, message: string) => {
    if (serverRef.current) {
      try {
        serverRef.current.sendToPeer(peerId, message);
      } catch (err) {
        console.error(`Failed to send message to peer ${peerId}:`, err);
        setError(err as Error);
      }
    }
  }, []);

  const broadcastStream = useCallback((stream: MediaStream) => {
    if (serverRef.current) {
      try {
        serverRef.current.broadcastStream(stream);
      } catch (err) {
        console.error('Failed to broadcast stream:', err);
        setError(err as Error);
      }
    }
  }, []);

  const sendStreamToPeer = useCallback((peerId: string, stream: MediaStream) => {
    if (serverRef.current) {
      try {
        serverRef.current.sendStreamToPeer(peerId, stream);
      } catch (err) {
        console.error(`Failed to send stream to peer ${peerId}:`, err);
        setError(err as Error);
      }
    }
  }, []);

  const start = useCallback(() => {
    if (serverRef.current) {
      try {
        serverRef.current.start();
      } catch (err) {
        console.error('Failed to start server:', err);
        setError(err as Error);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (serverRef.current) {
      try {
        serverRef.current.stop();
        setConnected(false);
        setPeers(new Map());
      } catch (err) {
        console.error('Failed to stop server:', err);
        setError(err as Error);
      }
    }
  }, []);

  return {
    server,
    peers,
    connected,
    error,
    broadcastMessage,
    sendToPeer,
    broadcastStream,
    sendStreamToPeer,
    start,
    stop,
  };
}
