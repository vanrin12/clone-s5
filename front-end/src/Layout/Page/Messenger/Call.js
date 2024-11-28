import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { Phone, Video, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import config from './../../../config';
import { IncomingCallAlert } from './IncomingCallAlert';

export function Call({ selectedChat }) {
  const [callStatus, setCallStatus] = useState('idle');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);

  const senderId = localStorage.getItem('_id');
  const receiverId = selectedChat?.userId;

  useEffect(() => {
    if (!senderId) return;

    socketRef.current = io(`${config.API_HOST}`, {
      query: { userId: senderId },
      autoConnect: true,
    });

    peerRef.current = new Peer(senderId);

    setupSocketListeners();
    setupPeerListeners();

    return () => {
      cleanupResources();
    };
  }, [senderId]);

  const setupSocketListeners = () => {
    socketRef.current.on('incomingCall', async ({ senderId: incomingSenderId, callerName, callType }) => {
      // Hiển thị thông báo cuộc gọi đến
      setIncomingCall({ senderId: incomingSenderId, callerName, callType });
    });

    socketRef.current.on('callAccepted', async () => {
      // Người nhận đã chấp nhận cuộc gọi
      console.log('Cuộc gọi được chấp nhận');
      setCallStatus('in-call');
    });

    socketRef.current.on('callRejected', () => {
      // Người nhận từ chối cuộc gọi
      alert('Cuộc gọi bị từ chối');
      endCall();
    });

    socketRef.current.on('endCall', () => {
      alert('Cuộc gọi đã kết thúc');
      endCall();
    });

    socketRef.current.on('getOnlineUsers', (users) => {
      setOnlineUsers(users.filter(user => user !== senderId));
    });
  };

  const setupPeerListeners = () => {
    peerRef.current.on('call', async (call) => {
      try {
        const localStream = await setupMediaStream(incomingCall?.callType || 'video');
        call.answer(localStream);
        callRef.current = call;

        // Hiển thị local stream
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play().catch(e => console.error('Lỗi phát video local:', e));
        }

        // Xử lý remote stream
        call.on('stream', handleRemoteStream);

        // Thay đổi trạng thái cuộc gọi
        setCallStatus('in-call');
        setIsVideoOn(incomingCall?.callType === 'video');
      } catch (error) {
        console.error('Lỗi khi trả lời cuộc gọi:', error);
        endCall();
      }
    });

    peerRef.current.on('error', (err) => {
      console.error('Lỗi PeerJS:', err);
      endCall();
    });
  };

  const handleRemoteStream = (remoteStream) => {
    console.log('Nhận stream remote:', remoteStream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => console.error('Lỗi phát video remote:', e));
    }
  };

  const setupMediaStream = async (callType) => {
    try {
      const constraints = {
        video: callType === 'video' ? { facingMode: 'user' } : false,
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      return stream;
    } catch (error) {
      handleMediaError(error);
    }
  };

  const handleMediaError = (error) => {
    console.error('Lỗi truy cập media:', error);
    alert(`Lỗi truy cập thiết bị: ${error.message}`);
  };

  const startCall = async (receiverId, callType, isInitiator = true) => {
    try {
      const localStream = await setupMediaStream(callType);

      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        await localVideoRef.current.play();
      }

      if (isInitiator) {
        // Gửi yêu cầu gọi đến người nhận
        socketRef.current.emit('requestVideoCall', {
          senderId,
          receiverId,
          callerName: 'Current User',
          callType,
        });

        // Thiết lập kết nối peer
        const call = peerRef.current.call(receiverId, localStream);
        callRef.current = call;

        call.on('stream', handleRemoteStream);

        // Đặt trạng thái cuộc gọi
        setCallStatus('calling');
        setIsVideoOn(callType === 'video');
      }
    } catch (error) {
      console.error('Lỗi khởi tạo cuộc gọi:', error);
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      // Thông báo cho người gọi rằng cuộc gọi được chấp nhận
      socketRef.current.emit('acceptCall', {
        senderId,
        receiverId: incomingCall.senderId
      });

      // Bắt đầu cuộc gọi
      await startCall(incomingCall.senderId, incomingCall.callType, false);
      setIncomingCall(null);
    } catch (error) {
      console.error('Lỗi khi chấp nhận cuộc gọi:', error);
      endCall();
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    socketRef.current.emit('rejectCall', {
      senderId,
      receiverId: incomingCall.senderId
    });
    setIncomingCall(null);
  };

  const endCall = () => {
    if (callRef.current) {
      callRef.current.close();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCallStatus('idle');
    setIsVideoOn(false);
    setIncomingCall(null);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    socketRef.current.emit('endCall', {
      senderId: senderId,
      receiverId: callRef.current?.peer,
    });
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !isMicOn;
        audioTracks.forEach((track) => (track.enabled = enabled));
        setIsMicOn(enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !isVideoOn;
        videoTracks.forEach((track) => (track.enabled = enabled));
        setIsVideoOn(enabled);

        if (localVideoRef.current) {
          localVideoRef.current.style.display = enabled ? 'block' : 'none';
        }
      }
    }
  };

  const cleanupResources = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerRef.current) peerRef.current.destroy();
    if (socketRef.current) socketRef.current.disconnect();
  };

  return (
    <div className="relative">
      {incomingCall && (
        <IncomingCallAlert
          call={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {selectedChat && receiverId && (
        <div className="flex space-x-2">
          <button
            className="p-2 rounded-full hover:bg-gray-600 transition-colors"
            onClick={() => startCall(receiverId, 'voice')}
          >
            <Phone className="w-5 h-5 text-white" />
          </button>

          <button
            className="p-2 rounded-full hover:bg-gray-600 transition-colors"
            onClick={() => startCall(receiverId, 'video')}
          >
            <Video className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {(callStatus === 'in-call' || callStatus === 'calling') && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4">
          {/* Controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-4 z-10">
            <button onClick={toggleMic} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600">
              {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-red-500" />}
            </button>
            <button onClick={toggleVideo} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600">
              {isVideoOn ? <VideoIcon className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-red-500" />}
            </button>
            <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700">
              <Phone className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Status message when calling */}
          {callStatus === 'calling' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-white">
              Đang gọi...
            </div>
          )}

          {/* Videos */}
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-4 right-4 w-48 h-32 object-cover rounded-lg border-2 border-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}