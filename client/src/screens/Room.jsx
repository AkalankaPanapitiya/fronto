import React,{useEffect,useCallback,useState} from 'react';
import ReactPlayer from 'react-player';
import { useSocket } from '../context/SocketProvider';
import peer from '../service/peer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const [isMuted, setIsMuted] = useState(false);

const handleMute = () => {
  setIsMuted((prevMuted) => !prevMuted);
};

  
    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
        toast.info('Connected!', { position: toast.POSITION.TOP_CENTER });
      }, []);

    const handleCallUser = useCallback(async() =>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true, 
            video: true
        });
        const offer = await peer.getOffer();
        socket.emit("user:call",{to: remoteSocketId, offer})
        setMyStream(stream);
    },[remoteSocketId])
  
    const handleIncomingCall = useCallback(async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setMyStream(stream);
      console.log('incoming:call', from, offer);
      const answer = await peer.getAnswer(offer);
      socket.emit('call:accepted', { to: from, answer });
    }, [socket]);
  
    const sendStreams = useCallback(() => {
        if (myStream) {
          const senders = peer.peer.getSenders();
          const tracks = myStream.getTracks();
      
          tracks.forEach((track) => {
            const existingSender = senders.find((sender) => sender.track === track);
      
            if (!existingSender) {
              peer.peer.addTrack(track, myStream);
            }
          });
        }
      }, [myStream]);
      
    const handleCallAccepted = useCallback(({ from, answer }) => {
      peer.setLocalDescription(answer);
      console.log('call accepted');
      sendStreams();
    }, [sendStreams]);
  
    const handleNegoNeeded = useCallback(async () => {
      const offer = await peer.getOffer();
      socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);
  
    useEffect(() => {
      peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
      return () => {
        peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
      };
    }, [handleNegoNeeded]);
  
    const handleNegoNeedIncoming = useCallback(
      async (from, offer) => {
        const answer = await peer.getAnswer(offer);
        socket.emit('peer:nego:done', { to: from, answer });
      },
      [socket]
    );
  
    const handleNegoNeedFinal = useCallback(
      async ({ answer }) => {
        await peer.setLocalDescription(answer);
      },
      []
    );
  
    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
          const remoteStream = ev.streams;
          console.log("GOT TRACKS!!");
          setRemoteStream(remoteStream[0]);
        });
      }, []);

  
    useEffect(() => {
      socket.on('user:joined', handleUserJoined);
      socket.on('incoming:call', handleIncomingCall);
      socket.on('call:accepted', handleCallAccepted);
      socket.on('peer:nego:needed', handleNegoNeedIncoming);
      socket.on('peer:nego:final', handleNegoNeedFinal);
  
      return () => {
        socket.off('user:joined', handleUserJoined);
        socket.off('incoming:call', handleIncomingCall);
        socket.off('call:accepted', handleCallAccepted);
        socket.off('peer:nego:needed', handleNegoNeedIncoming);
        socket.off('peer:nego:final', handleNegoNeedFinal);
      };
    },[handleUserJoined,,handleIncomingCall,handleCallAccepted,handleNegoNeeded,handleNegoNeedIncoming,handleNegoNeedFinal,socket])
    
 

 

    return (
        <div className="video-container">
          <ToastContainer />
          <h3>{remoteSocketId ? '' : 'No one in the room'}</h3>
          {myStream && (
            <button className="call-button" onClick={sendStreams}>
              <i className="fa fa-video" />
            </button>
          )}
          {remoteSocketId && (
            <button className="call-button" onClick={handleCallUser}>
              <i className="fa fa-phone" />
            </button>
          )}
          <div className="preview-container">
            {remoteStream && (
              <div className="remote-stream-player">
                <ReactPlayer
                  playing
                  muted
                  height="100%"
                  width="100%"
                  url={remoteStream}
                />
                {myStream && (
                  <div className="caller-preview">
                    <ReactPlayer
                      playing
                      muted
                      height="100%"
                      width="100%"
                      url={myStream}
                    />
                    <button className="mute-button" onClick={handleMute}>
                      <i className={`fa fa-microphone${isMuted ? '-slash' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
      
};

export default RoomPage;
