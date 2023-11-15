
express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");  
const socketIo = require("socket.io");


const server = require("http").createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://127.0.0.1:7000",
    credentials: true
  }
});


const PORT = process.env.PORT || 7000;
const list_users = {};



app.use(express.static(path.join(__dirname, "views")));

server.listen(PORT, () => {
  console.log(
    "-+-+-+-+- Servidor iniciado -+-+-+-+-+-\n" +
      " -+-+-+- http://127.0.0.1:" +
      PORT +
      " -+-+-+-"
  );
});

io.on("connection", (socket) => {

 console.log(`The user ${socket.id} has joined the chat as an user of type ${socket.handshake.query.type}`)
  socket.on("register", (nickname) => {
    if (list_users[nickname]) {
      socket.emit("userExists");
      return;
    } else {
      list_users[nickname] = socket.id;
      socket.nickname = nickname;
      socket.emit("login");
      io.emit("activeSessions", list_users);
    }
  });

  socket.on("disconnect", () => {
    delete list_users[socket.nickname];
    console.log(`The user ${list_users[socket.nickname]} has left the chat.`)
    io.emit("activeSessions", list_users);
  });

  socket.on("sendMessage", ({ message, image }) => {
    io.emit("sendMessage", { message, user: socket.nickname, image });
  });

  socket.on("sendMessagesPrivate", ({ message, image, selectUser }) => {
    if (list_users[selectUser]) {
      io.to(list_users[selectUser]).emit("sendMessage", {
        message,
        user: socket.nickname,
        image,
      });
      io.to(list_users[socket.nickname]).emit("sendMessage", {
        message,
        user: socket.nickname,
        image,
      });
    } else {
      alert("El usuario al que intentas enviar el mensaje no existe!");
    }
  });
});