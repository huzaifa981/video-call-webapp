import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useUserById } from "@/hooks/use-users";
import { useCreateCall } from "@/hooks/use-calls";
import { connectSocket, getSocket } from "@/lib/socket";
import SimplePeer, { type Instance as PeerInstance } from "simple-peer";
import { Button } from "@/components/ui/button";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Monitor, MonitorOff, MoreVertical, MessageSquare 
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CallPage() {
  const [, params] = useRoute("/call/:userId");
  const [, setLocation] = useLocation();
  const remoteUserId = parseInt(params?.userId || "0");
  
  const { data: currentUser } = useUser();
  const { data: remoteUser, isLoading: isLoadingRemote } = useUserById(remoteUserId);
  const { mutate: createCallRecord } = useCreateCall();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<PeerInstance | null>(null);
  const socketRef = useRef<any>(null);

  // Initialize call
  useEffect(() => {
    if (!currentUser || !remoteUserId) return;

    socketRef.current = connectSocket();
    const socket = socketRef.current;

    // Join my own room for receiving signals
    socket.emit("join-room", currentUser.id);

    // Get media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = currentStream;
        }

        // Initiate call immediately
        initiateCall(currentStream);
      })
      .catch((err) => {
        console.error("Failed to get media", err);
        toast({ title: "Camera Error", description: "Could not access camera/microphone", variant: "destructive" });
      });

    // Cleanup
    return () => {
      connectionRef.current?.destroy();
      stream?.getTracks().forEach(track => track.stop());
      socket.off("call-accepted");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [currentUser, remoteUserId]);


  const initiateCall = (currentStream: MediaStream) => {
    setCallStatus("calling");
    
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    });

    peer.on("signal", (data) => {
      socketRef.current.emit("call-user", {
        userToCall: remoteUserId,
        signalData: data,
        from: currentUser?.id,
      });
    });

    peer.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    socketRef.current.on("call-accepted", (signal: any) => {
      setCallStatus("connected");
      createCallRecord({ callerId: currentUser!.id, receiverId: remoteUserId });
      peer.signal(signal);
    });

    socketRef.current.on("call-ended", () => {
      endCall();
    });

    connectionRef.current = peer;
  };

  const endCall = () => {
    setCallStatus("ended");
    connectionRef.current?.destroy();
    stream?.getTracks().forEach(track => track.stop());
    setLocation("/");
    toast({ title: "Call Ended" });
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then((screenStream) => {
          const videoTrack = screenStream.getVideoTracks()[0];
          
          if (connectionRef.current && stream) {
            connectionRef.current.replaceTrack(
              stream.getVideoTracks()[0],
              videoTrack,
              stream
            );
          }
          
          videoTrack.onended = () => {
            stopScreenShare();
          };

          setIsScreenSharing(true);
        })
        .catch(err => console.error("Screen share failed", err));
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((camStream) => {
      const videoTrack = camStream.getVideoTracks()[0];
      if (connectionRef.current && stream) {
        connectionRef.current.replaceTrack(
          stream.getVideoTracks().find(t => t.kind === 'video')!,
          videoTrack,
          stream
        );
      }
      setIsScreenSharing(false);
    });
  };

  if (isLoadingRemote) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;
  }

  return (
    <div className="h-full bg-black text-white flex flex-col overflow-hidden relative">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
        {callStatus === "calling" && !remoteStream && (
          <div className="text-center space-y-4 animate-pulse">
            <div 
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold bg-zinc-800 border-4 border-primary/20"
              style={{ color: remoteUser?.avatarColor }}
            >
              {remoteUser?.username.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold">Calling {remoteUser?.username}...</h2>
            <p className="text-zinc-400">Waiting for response</p>
          </div>
        )}
        
        {remoteStream && (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
        )}
      </div>

      {/* Local Video (PiP) */}
      <div className="absolute top-6 right-6 w-48 md:w-64 aspect-video bg-zinc-800 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-10 transition-all hover:scale-105">
        {stream ? (
          <video 
            ref={myVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="font-bold">{currentUser?.username.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl z-20">
        <Button 
          variant={isMuted ? "destructive" : "secondary"} 
          size="icon" 
          className="rounded-full w-12 h-12"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        
        <Button 
          variant={isVideoOff ? "destructive" : "secondary"} 
          size="icon" 
          className="rounded-full w-12 h-12"
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        <Button 
          variant={isScreenSharing ? "default" : "secondary"} 
          size="icon" 
          className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        <Button 
          variant="destructive" 
          size="icon" 
          className="rounded-full w-14 h-14 mx-2 shadow-lg shadow-red-500/20"
          onClick={endCall}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>

        <Button variant="secondary" size="icon" className="rounded-full w-12 h-12">
          <MessageSquare className="w-5 h-5" />
        </Button>
        
        <Button variant="secondary" size="icon" className="rounded-full w-12 h-12">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
