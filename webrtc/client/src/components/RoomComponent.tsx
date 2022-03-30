import { useRef, useEffect } from "react"
import { useParams } from "react-router-dom"

const RoomComponent = () => {
    let { roomID } = useParams()
    const userVideo = useRef<HTMLVideoElement>(null)
    const partnerVideo = useRef<HTMLVideoElement>(null)
    let userStream: MediaStream;
    const partnerStream = useRef()
    let peer: RTCPeerConnection;
    const webSocketRef = new WebSocket(`ws://localhost:8080/join?roomID=${roomID}`)
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
        openCamera().then((stream) => {
            if (stream != undefined) {
                userVideo.current!.srcObject = stream
                userStream = stream;
                callUser();
            }
            webSocketRef.addEventListener("open", (e) => {
                webSocketRef.send(JSON.stringify({ join: true }))
            })
            webSocketRef.addEventListener("message", async (e) => {
                const message = JSON.parse(e.data)
                if (message.join) {
                    console.log(message)
                    callUser()
                }

                if (message.iceCandidate) {
                    console.log("Recieving ICE candidate")
                    try {
                        await peer.addIceCandidate(message.iceCandidate)
                    } catch (e) {
                        console.log(e)
                    }
                }

                if (message.offer) {
                    handleOffer(message.offer)
                }
            })
        })
    }, [])

    const handleOffer = async (offer: any) => {
        peer = createPeer()
        await peer.setRemoteDescription(new RTCSessionDescription(offer))

        userStream.getTracks().forEach((track) => {
            peer.addTrack(track, userStream)
        })
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)

        webSocketRef.send(JSON.stringify({ answer: peer.localDescription }))
    }

    const callUser = () => {
        console.log("calling user")
        if (!peer) {
            peer = createPeer()
        }
        userStream.getTracks().forEach((track) => {
            peer.addTrack(track, userStream)
        })
    }

    const createPeer = () => {
        console.log("Creating peer connection")
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })
        peer.onnegotiationneeded = handleNegotiation
        peer.onicecandidate = handleIceCandidate
        peer.ontrack = handleTrackEvent

        return peer
    }

    const handleNegotiation = async (event: Event) => {
        console.log("Creating offer")
        try {
            const myOffer = await peer.createOffer()
            await peer.setLocalDescription(myOffer)
            webSocketRef.send(JSON.stringify({ offer: peer.localDescription }))
        } catch (e) {
            console.log(e)
        }
    }

    const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
        console.log("Found Ice Candidate")
        if (event.candidate) {
            webSocketRef.send(JSON.stringify({ iceCandidate: event.candidate }))
        }
    }

    const handleTrackEvent = (event: RTCTrackEvent) => {
        console.log("Recieving tracks")
        partnerVideo.current!.srcObject = event.streams[0]
    }

    return <div>
        <video controls={true} ref={userVideo}></video>
        <video controls={true} ref={partnerVideo}></video>
    </div>
}

export default RoomComponent