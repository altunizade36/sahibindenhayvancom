import { useState, useEffect, useRef } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from "agora-rtc-sdk-ng";

interface AgoraConfig {
  appId: string;
  channel: string;
  token: string | null;
  uid?: UID;
}

interface RemoteUser {
  uid: UID;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

export function useAgoraClient(config: AgoraConfig | null, isPublisher: boolean = false) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!config || initRef.current) return;

    const agoraClient = AgoraRTC.createClient({ 
      mode: "live", 
      codec: "vp8",
    });

    // Set client role explicitly (required for Agora SDK v4)
    const setupClient = async () => {
      try {
        await agoraClient.setClientRole(isPublisher ? "host" : "audience");
        
        agoraClient.on("user-published", async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          
          setRemoteUsers(prev => {
            const existing = prev.find(u => u.uid === user.uid);
            if (existing) {
              return prev.map(u => 
                u.uid === user.uid 
                  ? {
                      ...u,
                      videoTrack: mediaType === "video" ? user.videoTrack : u.videoTrack,
                      audioTrack: mediaType === "audio" ? user.audioTrack : u.audioTrack,
                    }
                  : u
              );
            }
            return [
              ...prev,
              {
                uid: user.uid,
                videoTrack: mediaType === "video" ? user.videoTrack : undefined,
                audioTrack: mediaType === "audio" ? user.audioTrack : undefined,
              },
            ];
          });
        });

        agoraClient.on("user-unpublished", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        agoraClient.on("user-left", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        setClient(agoraClient);
      } catch (err) {
        setError(`Failed to set client role: ${err}`);
      }
    };

    setupClient();
    initRef.current = true;

    return () => {
      agoraClient.leave();
      localVideoTrack?.close();
      localAudioTrack?.close();
    };
  }, [config, isPublisher]);

  const join = async () => {
    if (!client || !config) return;

    try {
      await client.join(config.appId, config.channel, config.token, config.uid);
      setIsJoined(true);
      setError(null);
    } catch (err) {
      setError(`Failed to join channel: ${err}`);
      throw err;
    }
  };

  const createLocalTracks = async () => {
    try {
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      return { audioTrack, videoTrack };
    } catch (err) {
      setError(`Failed to create local tracks: ${err}`);
      throw err;
    }
  };

  const publish = async () => {
    if (!client || !localAudioTrack || !localVideoTrack) {
      const missingItems = [];
      if (!client) missingItems.push("client");
      if (!localAudioTrack) missingItems.push("audio track");
      if (!localVideoTrack) missingItems.push("video track");
      const errorMsg = `Cannot publish: missing ${missingItems.join(", ")}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log("Publishing local tracks...");
      await client.publish([localAudioTrack, localVideoTrack]);
      setIsPublishing(true);
      setError(null);
      console.log("Successfully published local tracks");
    } catch (err) {
      const errorMsg = `Failed to publish: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMsg, err);
      setError(errorMsg);
      throw err;
    }
  };

  const unpublish = async () => {
    if (!client || !isPublishing) return;

    try {
      await client.unpublish([localAudioTrack!, localVideoTrack!]);
      setIsPublishing(false);
    } catch (err) {
      setError(`Failed to unpublish: ${err}`);
      throw err;
    }
  };

  const leave = async () => {
    if (!client) return;

    try {
      if (isPublishing) {
        await unpublish();
      }
      await client.leave();
      localVideoTrack?.close();
      localAudioTrack?.close();
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setIsJoined(false);
      setIsPublishing(false);
    } catch (err) {
      setError(`Failed to leave: ${err}`);
      throw err;
    }
  };

  return {
    client,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isPublishing,
    error,
    join,
    createLocalTracks,
    publish,
    unpublish,
    leave,
  };
}
