import { useEffect, useRef } from "react"
import { useParams } from "react-router"
const MSG_TYPES = {
    SDP: 'SDP',
    CANDIDATE: 'CANDIDATE',
}


const CustomRoomComponent = () => {
    let { roomID } = useParams()
    const userVideo = useRef<HTMLVideoElement>(null)
    const partnerVideo = useRef<HTMLVideoElement>(null)
    let userStream: MediaStream;
    let peerConnection: RTCPeerConnection;
    let ws: WebSocket;
    const openCamera = async () => {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const cameras = allDevices.filter((device) => device.kind == "videoinput")
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: true, video: {
                    deviceId: cameras[0].deviceId
                }
            })
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        openCamera().then(stream => {
            ws = new WebSocket(`ws://localhost:8080/join?roomID=${roomID}`);
            peerConnection = createPeerConnection();

            addMessageHandler();

            stream!.getTracks().forEach(track => peerConnection.addTrack(track, stream!));
            if (stream != undefined) {
                userVideo.current!.srcObject = stream
            }
        })
    }, [])
    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.test.com:19000' }],
        });

        pc.onnegotiationneeded = createAndSendOffer;

        pc.onicecandidate = (iceEvent) => {
            if (iceEvent && iceEvent.candidate) {
                ws.send(JSON.stringify({
                    message_type: MSG_TYPES.CANDIDATE,
                    content: iceEvent.candidate,
                }));
            }
        }
        pc.ontrack = (event) => {
            console.log("Assigned stream to partner")
            partnerVideo.current!.srcObject = event.streams[0];
        };
        return pc
    }
    const createAndSendOffer = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("SENDING OFFER")
        ws.send(JSON.stringify({ message_type: MSG_TYPES.SDP, content: offer }));
    }
    const addMessageHandler = () => {
        ws.onmessage = async (message) => {
            const data = JSON.parse(message.data);

            if (!data) {
                return;
            }

            const { message_type, content } = data;
            try {
                if (message_type === MSG_TYPES.CANDIDATE && content) {
                    await peerConnection.addIceCandidate(content);
                } else if (message_type === MSG_TYPES.SDP) {
                    if (content.type === 'offer') {
                        await peerConnection.setRemoteDescription(content);
                        const answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answer);
                        console.log("sent answer")
                        ws.send(JSON.stringify({
                            message_type: MSG_TYPES.SDP,
                            content: answer,
                        }));
                    } else if (content.type === 'answer') {
                        await peerConnection.setRemoteDescription(content);
                    } else {
                        console.log('Unsupported SDP type.');
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
    };
    return <div>
        <video controls={true} ref={userVideo}></video>
        <video controls={true} ref={partnerVideo}></video>
    </div>
}


export default CustomRoomComponent