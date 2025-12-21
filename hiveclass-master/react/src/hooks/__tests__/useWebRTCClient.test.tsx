import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebRTCClient } from '../useWebRTCClient';

// Mock the WebRTC client
vi.mock('@/services/webrtc-client/client.js', () => {
  class MockRTCClient {
    endpoint: string;
    handlers: any;
    start: any;
    stop: any;
    send: any;
    attachStream: any;
    detachStream: any;

    constructor(endpoint: string, handlers: any) {
      this.endpoint = endpoint;
      this.handlers = handlers;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.send = vi.fn();
      this.attachStream = vi.fn();
      this.detachStream = vi.fn();
    }

    _triggerOpen() {
      this.handlers.onopen?.();
    }

    _triggerError(error: Error) {
      this.handlers.onerror?.(error);
    }
  }

  return {
    RTCClient: MockRTCClient,
  };
});

describe('useWebRTCClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize client with endpoint', () => {
    const { result } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(result.current.client).toBeTruthy();
    expect(result.current.connected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set connected state when connection opens', async () => {
    const onOpen = vi.fn();

    const { result } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
        onOpen,
      })
    );

    // Trigger the open event
    if (result.current.client) {
      result.current.client._triggerOpen();
    }

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(onOpen).toHaveBeenCalled();
    });
  });

  it('should handle errors', async () => {
    const onError = vi.fn();
    const testError = new Error('Connection failed');

    const { result } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
        onError,
      })
    );

    // Trigger an error
    if (result.current.client) {
      result.current.client._triggerError(testError);
    }

    await waitFor(() => {
      expect(result.current.error).toEqual(testError);
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  it('should provide sendMessage function', () => {
    const { result } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(typeof result.current.sendMessage).toBe('function');

    // Test sending a message
    result.current.sendMessage('test message');

    if (result.current.client) {
      expect(result.current.client.send).toHaveBeenCalledWith('test message');
    }
  });

  it('should provide stream management functions', () => {
    const { result } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(typeof result.current.attachStream).toBe('function');
    expect(typeof result.current.detachStream).toBe('function');
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    const client = result.current.client;
    expect(client).toBeTruthy();

    unmount();

    expect(client.stop).toHaveBeenCalled();
  });

  it('should provide start and stop functions', () => {
    const { result } = renderHook(() =>
      useWebRTCClient({
        rendezvousEndpoint: 'ws://localhost:9090',
      })
    );

    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');

    result.current.start();
    expect(result.current.client?.start).toHaveBeenCalled();

    result.current.stop();
    expect(result.current.client?.stop).toHaveBeenCalled();
  });
});
