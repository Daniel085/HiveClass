import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebRTCServer } from '../useWebRTCServer';

// Mock the WebRTC server
vi.mock('@/services/webrtc-server/server.js', () => {
  class MockRTCServer {
    endpoint: string;
    handlers: any;
    start: any;
    stop: any;
    broadcast: any;
    sendToPeer: any;
    broadcastStream: any;
    sendStreamToPeer: any;

    constructor(endpoint: string, handlers: any) {
      this.endpoint = endpoint;
      this.handlers = handlers;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.broadcast = vi.fn();
      this.sendToPeer = vi.fn();
      this.broadcastStream = vi.fn();
      this.sendStreamToPeer = vi.fn();
    }

    _triggerOpen() {
      this.handlers.onopen?.();
    }

    _triggerPeerConnected(peerId: string, peer: any) {
      this.handlers.onpeerconnected?.(peerId, peer);
    }

    _triggerPeerDisconnected(peerId: string) {
      this.handlers.onpeerdisconnected?.(peerId);
    }
  }

  return {
    RTCServer: MockRTCServer,
  };
});

describe('useWebRTCServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize server with endpoint', () => {
    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(result.current.server).toBeTruthy();
    expect(result.current.connected).toBe(false);
    expect(result.current.peers.size).toBe(0);
  });

  it('should set connected state when connection opens', async () => {
    const onOpen = vi.fn();

    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
        onOpen,
      })
    );

    // Trigger the open event
    if (result.current.server) {
      result.current.server._triggerOpen();
    }

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(onOpen).toHaveBeenCalled();
    });
  });

  it('should add peer when student connects', async () => {
    const onPeerConnected = vi.fn();

    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
        onPeerConnected,
      })
    );

    // Simulate student connecting
    const mockPeer = { id: 'student-1' };
    if (result.current.server) {
      result.current.server._triggerPeerConnected('student-1', mockPeer);
    }

    await waitFor(() => {
      expect(result.current.peers.size).toBe(1);
      expect(result.current.peers.has('student-1')).toBe(true);
      expect(onPeerConnected).toHaveBeenCalledWith('student-1', mockPeer);
    });
  });

  it('should remove peer when student disconnects', async () => {
    const onPeerDisconnected = vi.fn();

    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
        onPeerDisconnected,
      })
    );

    // Add a peer first
    const mockPeer = { id: 'student-1' };
    if (result.current.server) {
      result.current.server._triggerPeerConnected('student-1', mockPeer);
    }

    await waitFor(() => {
      expect(result.current.peers.size).toBe(1);
    });

    // Disconnect the peer
    if (result.current.server) {
      result.current.server._triggerPeerDisconnected('student-1');
    }

    await waitFor(() => {
      expect(result.current.peers.size).toBe(0);
      expect(onPeerDisconnected).toHaveBeenCalledWith('student-1');
    });
  });

  it('should provide broadcastMessage function', () => {
    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(typeof result.current.broadcastMessage).toBe('function');

    result.current.broadcastMessage('Hello everyone');

    if (result.current.server) {
      expect(result.current.server.broadcast).toHaveBeenCalledWith('Hello everyone');
    }
  });

  it('should provide sendToPeer function', () => {
    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(typeof result.current.sendToPeer).toBe('function');

    result.current.sendToPeer('student-1', 'Hello student');

    if (result.current.server) {
      expect(result.current.server.sendToPeer).toHaveBeenCalledWith('student-1', 'Hello student');
    }
  });

  it('should handle multiple students', async () => {
    const { result } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    // Add multiple students
    const students = ['student-1', 'student-2', 'student-3'];

    for (const studentId of students) {
      if (result.current.server) {
        result.current.server._triggerPeerConnected(studentId, { id: studentId });
      }
    }

    await waitFor(() => {
      expect(result.current.peers.size).toBe(3);
      students.forEach((id) => {
        expect(result.current.peers.has(id)).toBe(true);
      });
    });
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useWebRTCServer({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    const server = result.current.server;
    expect(server).toBeTruthy();

    unmount();

    expect(server.stop).toHaveBeenCalled();
  });
});
