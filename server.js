const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const { formatMessage } = require('./utils/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ADMIN = 'Admin';

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  // Надсилаємо клієнту його socket.id
  socket.emit('session', { socketId: socket.id });

  socket.on('joinRoom', ({ username, room }) => {
    // Дозволяємо дублікати username — тільки додаємо користувача
    const user = userJoin(socket.id, (username || 'Anon').trim(), (room || 'default').trim());
    socket.join(user.room);

    // Персональне вітання
    socket.emit('message', {
      senderId: 'admin',
      username: ADMIN,
      ...formatMessage(ADMIN, `Welcome, ${user.username}!`)
    });

    // Іншим у кімнаті
    socket.broadcast.to(user.room).emit('message', {
      senderId: 'admin',
      username: ADMIN,
      ...formatMessage(ADMIN, `${user.username} has joined!`)
    });

    // Оновити список користувачів
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(user.room).emit('message', {
        senderId: user.id,
        username: user.username,
        ...formatMessage(user.username, msg)
      });
    }
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit('message', {
        senderId: 'admin',
        username: ADMIN,
        ...formatMessage(ADMIN, `${user.username} has left`)
      });

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));