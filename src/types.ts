export interface Message {
  id: string;
  sender: string;
  content: string; // Text content or Base64 data for audio
  timestamp: number;
  type: 'text' | 'system' | 'audio';
  isAi?: boolean;
}

export interface PeerData {
  peerId: string;
  connected: boolean;
}

export enum ConnectionStatus {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR
}

export interface CallState {
  isReceivingCall: boolean;
  caller: string;
  callType: 'video' | 'audio';
  stream?: MediaStream;
}

// Minimal definition for Web3 Provider injection
export interface WindowEthereum {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
}