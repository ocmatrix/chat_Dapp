import React, { useEffect, useRef } from 'react';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  isActive: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ localStream, remoteStream, onEndCall, isActive }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Remote Stream (Full Screen) */}
      <div className="flex-1 relative bg-gray-900">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 animate-pulse">
            Connecting to peer...
          </div>
        )}
        
        {/* Local Stream (PIP) */}
        <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-lg overflow-hidden border-2 border-crypto-surface shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }} // Mirror effect for self
          />
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 bg-crypto-dark/90 backdrop-blur flex items-center justify-center gap-8 absolute bottom-0 w-full pb-4">
        <button 
          onClick={onEndCall}
          className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6.666M13 8v20" /> {/* Simplified phone hangup icon representation */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;