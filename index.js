const express = require('express')
const app = express()
const PORT = 2500
app.use(express.json())
const cors = require('cors')
const { users, rooms } = require('./data')

const http = require('http')
const server = http.createServer(app) // create big http server (because i need more functionality for the socket.io) and connect it to my express app

const socketIO = require('socket.io')
const io = new socketIO.Server(server, {
  cors: {
    origin: '*', // configures that every client can connect the socket server
  },
}) // that's how i connect the socket to my server - by passing the big http server to the socket server (because only express app server don't have the full functionality that socket.io needs)

io.on('connection', (socket) => {
  console.log('connected now:', socket.id)

  socket.on('connection', (nickName) => {
    if (users[nickName])
      // check if this nickname is already exist
      socket.emit('nickname-error', 'There is already user with this nickname')
    else {
      users[nickName] = socket.id
      socket.emit('join', {
        // emits an event to the specific client
        socketId: users[nickName],
        rooms: Object.keys(rooms),
      })

      socket.broadcast.emit('msg-server', `${nickName} joined the room`) // the event data will only be broadcast to every sockets but the sender
    }
  })

  socket.on('set-room', (room) => {
    socket.emit('set-msgs', rooms[room])
  })

  socket.on('add-room', (room) => {
    if (rooms[room]) socket.emit('add-room-error', 'This room is already exist')
    else {
      rooms[room] = []
      io.emit('add-room-server', Object.keys(rooms)) // emits an event to all connected clients
    }
  })

  socket.on('new-msg', ({ room, msg }) => {
    if (msg) {
      rooms[room].push(msg)
      io.emit('new-msg-server', msg)
    } 
    else return
  })

  socket.on('leave-room', ({ nickName, reason }) => {
    console.log(reason, socket.id)
    socket.disconnect()
    socket.broadcast.emit('msg-server', `${nickName} has left`)
  })
})

server.listen(PORT, () => {
  // listen to the big http server
  console.log(`listening on port ${PORT}...`)
})
