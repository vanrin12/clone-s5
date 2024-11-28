import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import './Call.css';
// đây là mã phụ của tôi, tôi cần bạn đưa chức năng của bên này qua cho bên chính
function Call() {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [peerId, setPeerId] = useState('');
    const [receiverId, setReceiverId] = useState('');
    const [callType, setCallType] = useState('');
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const callRef = useRef(null);

    const userId = localStorage.getItem('_id');
    //  đây là mã phụ cần bổ sung qua chính
    useEffect(() => {
        if (!userId) return;

        if (!socketRef.current) {
            socketRef.current = io('http://localhost:5000', {
                query: { userId },
                autoConnect: true,
            });

            socketRef.current.on('connect', () => {
                console.log('Kết nối thành công:', socketRef.current.id);
            });

            socketRef.current.on('getOnlineUsers', (users) => {
                // console.log('Người dùng trực tuyến:', users);
                setOnlineUsers(users.filter(user => user !== userId));
            });

            socketRef.current.on('incomingCall', async ({ callerId, callerName, callType }) => {
                const confirmed = window.confirm(`Cuộc gọi ${callType} đến từ ${callerName}. Chấp nhận không?`);
                socketRef.current.emit('respondToCall', {
                    callerId,
                    receiverId: userId,
                    accepted: confirmed
                });

                if (confirmed) {
                    await setupMediaConnection(callType);
                    peerRef.current.on('call', (call) => {
                        call.answer(localStreamRef.current);
                        call.on('stream', (remoteStream) => {
                            if (remoteVideoRef.current) {
                                remoteVideoRef.current.srcObject = remoteStream;
                            }
                        });
                    });
                }
            });
        }

        const peer = new Peer(userId);
        peerRef.current = peer;

        peer.on('open', (id) => {
            setPeerId(id);
            // console.log('PeerJS ID:', id);
        });

        peer.on('call', (call) => {
            call.answer(localStreamRef.current);
            call.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });
        });

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [userId]);

    const setupMediaConnection = async (callType) => {
        try {
            const constraints = {
                video: callType === 'video',
                audio: true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            if (localVideoRef.current && callType === 'video') {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error('Lỗi truy cập media:', err);
        }
    };

    const startCall = async (receiverId, callType) => {
        setCallType(callType);
        await setupMediaConnection(callType);

        const call = peerRef.current.call(receiverId, localStreamRef.current);
        callRef.current = call;

        call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        socketRef.current.emit('requestVideoCall', {
            callerId: userId,
            receiverId,
            callerName: 'User',
            callType
        });
    };

    const endCall = () => {
        if (callRef.current) {
            callRef.current.close();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setCallType('');
        localVideoRef.current.srcObject = null;
        remoteVideoRef.current.srcObject = null;
    };

    const toggleMic = () => {
        const enabled = !isMicOn;
        localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = enabled;
        });
        setIsMicOn(enabled);
    };

    const toggleVideo = () => {
        const enabled = !isVideoOn;
        localStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = enabled;
        });
        setIsVideoOn(enabled);
    };

    return (
        <div className="call-container">
            <h3 className="call-title">Người dùng trực tuyến</h3>
            <ul className="call-user-list">
                {onlineUsers.map((user) => (
                    <li key={user} className="call-user-item">
                        {user}
                        <button
                            className="call-button"
                            onClick={() => {
                                setReceiverId(user);
                                startCall(user, 'voice');
                            }}
                        >
                            Call Voice
                        </button>
                        <button
                            className="call-button"
                            onClick={() => {
                                setReceiverId(user);
                                startCall(user, 'video');
                            }}
                        >
                            Call Video
                        </button>
                    </li>
                ))}
            </ul>
            {callType && (
                <div className="call-controls">
                    <button className="control-button" onClick={toggleMic}>
                        {isMicOn ? 'Turn Off Mic' : 'Turn On Mic'}
                    </button>
                    <button className="control-button" onClick={toggleVideo}>
                        {isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
                    </button>
                    <button className="end-call-button" onClick={endCall}>
                        End Call
                    </button>
                </div>
            )}
            <div className="call-video-container">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="call-video"
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="call-video"
                />
            </div>
        </div>
    );
}

export default Call;
