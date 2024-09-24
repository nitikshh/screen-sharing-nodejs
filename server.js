// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let isScreenSharing = false; // Track screen sharing state

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the viewer page at /viewer
app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Notify viewers about the screen sharing status when they connect
    socket.emit('screen-sharing', isScreenSharing);

    // Handle the start of screen sharing (offer)
    socket.on('offer', (offer) => {
        isScreenSharing = true; // Update screen sharing status
        socket.broadcast.emit('offer', offer); // Send offer to all clients except the sender
        socket.broadcast.emit('screen-sharing', isScreenSharing); // Notify viewers that screen sharing is live
    });

    // Handle the answer and ICE candidates
    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer); // Send answer back to the host
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate); // Handle ICE candidates
    });

    // Handle screen sharing stop (disconnect or end)
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
