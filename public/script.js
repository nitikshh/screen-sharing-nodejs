// script.js
const socket = io();

let localStream;
let peerConnection;
const screenVideo = document.getElementById('screenVideo');
const startScreenShareBtn = document.getElementById('startScreenShare');

// WebRTC configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Google's public STUN server
    ]
};

// Event listener for screen sharing button
startScreenShareBtn.addEventListener('click', async () => {
    try {
        // Get screen stream using WebRTC's getDisplayMedia
        localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenVideo.srcObject = localStream;

        // Initialize peer connection
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', event.candidate);
            }
        };

        // Add screen stream tracks to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Create WebRTC offer and send it to the server
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    } catch (error) {
        console.error('Error sharing screen:', error);
    }
});

// Handle incoming WebRTC offer from the host
socket.on('offer', async (offer) => {
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(configuration);
    }

    peerConnection.ontrack = (event) => {
        screenVideo.srcObject = event.streams[0]; // Display the incoming stream
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };

    // Set remote description with the offer from the host
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create an answer and send it back to the host
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

// Handle incoming WebRTC answer from the client
socket.on('answer', async (answer) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
});

// Handle incoming ICE candidates for peer connection
socket.on('candidate', async (candidate) => {
    if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});
