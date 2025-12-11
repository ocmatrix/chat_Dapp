import React, { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import WalletConnect from './components/WalletConnect';
import VideoCall from './components/VideoCall';
import { Message, ConnectionStatus } from './types';
import { generateSmartReply, chatWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  
  // Call State
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // --- Persistence Logic ---
  // Load messages from LocalStorage on login
  useEffect(() => {
    if (myPeerId) {
        const savedKey = `dechat_${myPeerId}`;
        const savedMessages = localStorage.getItem(savedKey);
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
    }
  }, [myPeerId]);

  // Save messages to LocalStorage whenever they change
  useEffect(() => {
      if (myPeerId && messages.length > 0) {
          const savedKey = `dechat_${myPeerId}`;
          localStorage.setItem(savedKey, JSON.stringify(messages));
      }
  }, [messages, myPeerId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for deep link connection on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectTo = params.get('connect');
    if (connectTo) {
      setTargetPeerId(connectTo.toLowerCase());
    }
  }, []);

  // Handle Wallet Connection -> Init Peer
  const handleWalletConnect = (address: string) => {
    const cleanId = address.toLowerCase();
    setMyPeerId(cleanId);
    // Only initialize if not already initializing
    if (!peerRef.current) {
        initializePeer(cleanId);
    }
  };

  const handleLogout = () => {
    if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
    }
    setMyPeerId('');
    setTargetPeerId('');
    setStatus(ConnectionStatus.DISCONNECTED);
    // Force reload to clean up memory/streams
    window.location.reload();
  };

  const initializePeer = (id: string) => {
    setStatus(ConnectionStatus.CONNECTING);
    
    // Using PeerJS cloud for signaling (Serverless storage).
    const peer = new Peer(id, {
      debug: 1,
      // Adding config to help with connectivity through some firewalls
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setStatus(ConnectionStatus.CONNECTED);
      
      // Auto-connect if deep link present
      if (targetPeerId && targetPeerId !== id) {
        setTimeout(() => connectToPeer(targetPeerId), 1000);
      }
    });

    peer.on('connection', (conn) => {
      handleConnection(conn);
    });

    peer.on('call', (call) => {
      const acceptVideo = window.confirm("Incoming Call. Accept with Video? (Cancel for Audio Only)");
      const constraints = { audio: true, video: acceptVideo };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          setLocalStream(stream);
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setInCall(true);
          });
          call.on('close', () => endCall());
        })
        .catch(err => console.error('Failed to get local stream', err));
    });

    peer.on('error', (err) => {
      console.error(err);
      // If ID is taken, it usually means we refreshed the page and the old session is still active on PeerJS server.
      // We can try to append a random string or just alert.
      if (err.type === 'unavailable-id') {
         setStatus(ConnectionStatus.ERROR);
         alert("Session already active. Please wait 10 seconds and try again.");
      } else {
         setStatus(ConnectionStatus.ERROR);
      }
    });

    peer.on('disconnected', () => {
        setStatus(ConnectionStatus.DISCONNECTED);
        // Attempt reconnect
        peer.reconnect();
    });

    peerRef.current = peer;
  };

  const handleConnection = (conn: DataConnection) => {
    if (connRef.current) {
        connRef.current.close();
    }
    connRef.current = conn;
    setTargetPeerId(conn.peer);

    conn.on('data', (data: any) => {
      const msg = data as Message;
      addMessage(msg);
      
      if (msg.type === 'text') {
        const history = messages.filter(m => m.type === 'text').map(m => `${m.sender}: ${m.content}`);
        generateSmartReply(history, msg.content).then(reply => {
          if (reply) setAiSuggestion(reply);
        });
      }
    });

    conn.on('close', () => {
      addMessage({
        id: Date.now().toString(),
        sender: 'System',
        content: 'Peer disconnected',
        timestamp: Date.now(),
        type: 'system'
      });
      connRef.current = null;
    });

    conn.on('open', () => {
        addMessage({
            id: Date.now().toString(),
            sender: 'System',
            content: 'Secure Connection Established',
            timestamp: Date.now(),
            type: 'system'
          });
    })
  };

  const connectToPeer = (peerId: string) => {
    if (!peerRef.current || !peerId) return;
    const conn = peerRef.current.connect(peerId.toLowerCase());
    handleConnection(conn);
  };

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const sendMessage = async () => {
    if (!inputMsg.trim()) return;

    if (inputMsg.startsWith('/ai ')) {
      const query = inputMsg.replace('/ai ', '');
      addMessage({
        id: Date.now().toString(),
        sender: 'Me',
        content: inputMsg,
        timestamp: Date.now(),
        type: 'text'
      });
      setInputMsg('');
      
      const aiResponse = await chatWithGemini(query);
      addMessage({
        id: Date.now().toString() + 'ai',
        sender: 'Gemini',
        content: aiResponse,
        timestamp: Date.now(),
        type: 'text',
        isAi: true
      });
      return;
    }

    const msg: Message = {
      id: Date.now().toString(),
      sender: myPeerId,
      content: inputMsg,
      timestamp: Date.now(),
      type: 'text'
    };

    if (connRef.current && connRef.current.open) {
      connRef.current.send(msg);
      addMessage({ ...msg, sender: 'Me' });
      setInputMsg('');
      setAiSuggestion(null);
    } else {
      alert("Not connected to a peer.");
    }
  };

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          sendAudioMessage(base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = (base64Audio: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      sender: myPeerId,
      content: base64Audio,
      timestamp: Date.now(),
      type: 'audio'
    };

    if (connRef.current && connRef.current.open) {
      connRef.current.send(msg);
      addMessage({ ...msg, sender: 'Me' });
    } else {
      alert("Not connected. Audio not sent.");
    }
  };

  // --- Call Logic ---
  const startCall = (video: boolean) => {
    if (!peerRef.current || !targetPeerId) return;
    
    navigator.mediaDevices.getUserMedia({ video: video, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        const call = peerRef.current!.call(targetPeerId, stream);
        call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setInCall(true);
        });
        call.on('close', () => endCall());
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
        alert("Could not access camera/microphone.");
      });
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?connect=${myPeerId}`;
    navigator.clipboard.writeText(url);
    alert("Invitation Link Copied! Send this to your friend.");
  };

  // --- RENDER ---
  if (!myPeerId) {
    return <WalletConnect onConnect={handleWalletConnect} />;
  }

  return (
    <div className="flex flex-col h-screen bg-crypto-dark text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-crypto-surface/90 backdrop-blur-md border-b border-gray-700/50 z-10 sticky top-0">
        <div className="flex flex-col">
           <div className="flex items-center gap-2">
             <h2 className="font-bold text-lg text-white tracking-wide">DeChat</h2>
             <span className="px-1.5 py-0.5 rounded text-[10px] bg-crypto-primary/20 text-crypto-primary border border-crypto-primary/30">P2P</span>
           </div>
           <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
             <span className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-crypto-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : status === ConnectionStatus.ERROR ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
             <span className="truncate max-w-[100px] cursor-pointer hover:text-white transition-colors" onClick={() => navigator.clipboard.writeText(myPeerId)}>
                {myPeerId.substring(0, 6)}...{myPeerId.substring(myPeerId.length - 4)}
             </span>
           </div>
        </div>
        <div className="flex gap-2">
             <button onClick={copyLink} className="p-2 bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
            <button onClick={() => startCall(false)} disabled={!targetPeerId || status !== ConnectionStatus.CONNECTED} className="p-2 bg-gray-800 text-crypto-success rounded-full hover:bg-gray-700 transition-all border border-gray-700 disabled:opacity-30 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </button>
            <button onClick={() => startCall(true)} disabled={!targetPeerId || status !== ConnectionStatus.CONNECTED} className="p-2 bg-gray-800 text-crypto-primary rounded-full hover:bg-gray-700 transition-all border border-gray-700 disabled:opacity-30 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={handleLogout} className="p-2 ml-1 bg-gray-800 text-red-400 rounded-full hover:bg-gray-700 transition-all active:scale-95 border border-red-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
        </div>
      </header>

      {/* Manual Connection Bar */}
      {!connRef.current && (
          <div className="p-4 bg-gray-900 border-b border-gray-800 animate-fade-in">
              <div className="flex gap-2">
                  <input type="text" placeholder="Friend's Address (0x...)" className="flex-1 bg-crypto-surface border border-gray-700 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-crypto-primary placeholder-gray-600 transition-colors" value={targetPeerId} onChange={(e) => setTargetPeerId(e.target.value.toLowerCase())} />
                  <button onClick={() => connectToPeer(targetPeerId)} className="bg-crypto-primary px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 shadow-lg active:scale-95 transition-all">Connect</button>
              </div>
          </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gradient-to-b from-crypto-dark to-gray-900">
        {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20 text-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="max-w-[200px]">Waiting for connection...</p>
                <p className="text-xs mt-2 text-gray-600">Encrypted P2P Channel.</p>
                <button onClick={copyLink} className="mt-4 text-crypto-primary text-xs underline">Share Link</button>
            </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'Me' ? 'items-end' : msg.sender === 'System' ? 'items-center' : 'items-start'}`}>
            {msg.type === 'system' ? (
                 <span className="text-[10px] text-gray-400 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700">{msg.content}</span>
            ) : (
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md relative group ${msg.sender === 'Me' ? 'bg-crypto-primary text-white rounded-br-none' : msg.isAi ? 'bg-gray-800 border border-purple-500/30 text-gray-100 rounded-bl-none' : 'bg-crypto-surface text-gray-200 rounded-bl-none border border-gray-700'}`}>
                    {msg.isAi && (
                        <div className="flex items-center gap-1 mb-1">
                             <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Gemini AI</span>
                        </div>
                    )}
                    {msg.type === 'audio' ? (
                        <div className="flex items-center gap-2 min-w-[140px]">
                            <audio src={msg.content} controls className="h-8 w-32 opacity-80" />
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</div>
                    )}
                    <div className={`text-[9px] mt-1 opacity-60 text-right w-full flex justify-end items-center gap-1`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="px-4 pb-2 bg-gradient-to-t from-crypto-dark to-transparent">
            <button onClick={() => { setInputMsg(aiSuggestion); setAiSuggestion(null); }} className="flex items-center gap-2 text-xs bg-crypto-accent/20 text-crypto-accent border border-crypto-accent/50 px-4 py-2 rounded-full hover:bg-crypto-accent/30 transition-all active:scale-95 backdrop-blur-sm">
                <span className="animate-pulse">✨</span> AI Suggestion: "{aiSuggestion}"
            </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-crypto-surface border-t border-gray-800 safe-area-bottom">
        <div className="flex items-end gap-2 bg-gray-900/50 p-1.5 rounded-3xl border border-gray-700/50">
            <button className={`p-2 rounded-full transition-colors mb-0.5 ${inputMsg.startsWith('/ai ') ? 'text-purple-400 bg-purple-900/20' : 'text-gray-400 hover:text-crypto-primary'}`} onClick={() => setInputMsg(prev => prev.startsWith('/ai ') ? prev.replace('/ai ', '') : '/ai ' + prev)}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </button>
            <textarea value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} placeholder={isRecording ? "Recording audio..." : "Type message..."} rows={1} disabled={isRecording} className="flex-1 bg-transparent text-white max-h-24 py-2.5 px-2 focus:outline-none text-sm resize-none disabled:opacity-50" style={{ minHeight: '40px' }} />
            {inputMsg.trim() ? (
                <button onClick={sendMessage} className="p-2.5 bg-crypto-primary rounded-full text-white hover:bg-blue-600 shadow-lg mb-0.5 transition-transform active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            ) : (
                <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-2.5 rounded-full text-white shadow-lg mb-0.5 transition-all active:scale-90 ${isRecording ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                </button>
            )}
        </div>
        {isRecording && <div className="text-center text-xs text-red-400 mt-2 font-semibold">Recording... Release to send</div>}
      </div>
      <VideoCall isActive={inCall} localStream={localStream} remoteStream={remoteStream} onEndCall={() => { peerRef.current?.connections[targetPeerId]?.forEach((c: any) => c.close()); endCall(); }} />
    </div>
  );
};

export default App;