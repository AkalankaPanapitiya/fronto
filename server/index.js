// const express = require('express');
// const http = require('http');
const {Server} = require('socket.io');

// const app = express();
// const server = http.createServer(app);
const io = new Server (8000,{
    cors: true,
})

const emailToSocketIdMap = new Map();
const sockertidtoEmailMap = new Map();

io.on('connection', (socket) => {
  console.log('socket connected. ID is ',socket.id);
  socket.on("room:join",(data) =>{
    const {name,email,room} = data;
    emailToSocketIdMap.set(email, socket.id);
    sockertidtoEmailMap .set(socket.id, email);
    io.to(room).emit('user:joined',{email,id: socket.id});
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
    console.log(data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, answer }) => {
    io.to(to).emit("call:accepted", { from: socket.id, answer });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, answer }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, answer });
  });

  // Handle events and emit data here

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// const port = 8000;

// Server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
