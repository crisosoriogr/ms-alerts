const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const socketIo = require("socket.io");

const server = require("http").createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://127.0.0.1:7000",
    credentials: true,
  },
});

const PORT = process.env.PORT || 7000;
const list_users = {};
const list_drivers = {};

app.use(express.static(path.join(__dirname, "views")));

const userNamespace = io.of("/users");
const driverNamespace = io.of("/drivers");

userNamespace.on("connection", (socket) => {
  console.log(`The user ${socket.id} has joined the chat as a user of type ${socket.handshake.query.type}`);

  socket.on("register", (nickname) => {
    if (list_users[nickname]) {
      socket.emit("userExists");
      return;
    } else {
      list_users[nickname] = socket.id;
      socket.nickname = nickname;
      socket.emit("login");
      userNamespace.emit("activeSessions", list_users);
    }
  });

  socket.on("disconnect", () => {
    delete list_users[socket.nickname];
    console.log(`The user ${list_users[socket.nickname]} has left the chat.`);
    userNamespace.emit("activeSessions", list_users);
  });

  socket.on("sendMessage", ({ message, image }) => {
    userNamespace.emit("sendMessage", { message, user: socket.nickname, image });
  });

  socket.on("sendMessagesPrivate", ({ message, image, selectUser }) => {
    if (list_users[selectUser]) {
      userNamespace.to(list_users[selectUser]).emit("sendMessage", {
        message,
        user: socket.nickname,
        image,
      });
      userNamespace.to(list_users[socket.nickname]).emit("sendMessage", {
        message,
        user: socket.nickname,
        image,
      });
    } else {
       
      socket.emit("error", "El usuario al que intentas enviar el mensaje no existe!");
    }
  });
});

driverNamespace.on("connection", (socketDrivers) => {
  console.log(`The driver ${socketDrivers.id} has joined the chat as a driver of type ${socketDrivers.handshake.query.type}`);

  socketDrivers.on("register", (nickname) => {
    if (list_drivers[nickname]) {
      socketDrivers.emit("userExists");
      return;
    } else {
      list_drivers[nickname] = socketDrivers.id;
      socketDrivers.nickname = nickname;
      socketDrivers.emit("login");
      driverNamespace.emit("activeSessions", list_drivers);
    }
  });

  socketDrivers.on("disconnect", () => {
    delete list_drivers[socketDrivers.nickname];
    console.log(`The driver ${list_drivers[socketDrivers.nickname]} has left the chat.`);
    driverNamespace.emit("activeSessions", list_drivers);
  });

  socketDrivers.on("sendMessage", ({ message, image }) => {
    driverNamespace.emit("sendMessage", { message, user: socketDrivers.nickname, image });
  });

  socketDrivers.on("sendMessagesPrivate", ({ message, image, selectUser }) => {
    if (list_drivers[selectUser]) {
      driverNamespace.to(list_drivers[selectUser]).emit("sendMessage", {
        message,
        user: socketDrivers.nickname,
        image,
      });
      driverNamespace.to(list_drivers[socketDrivers.nickname]).emit("sendMessage", {
        message,
        user: socketDrivers.nickname,
        image,
      });
    } else {
     
      socketDrivers.emit("error", "El conductor al que intentas enviar el mensaje no existe!");
    }
  });
});

server.listen(PORT, () => {
  console.log(
    "-+-+-+-+- Servidor iniciado -+-+-+-+-+-\n" +
    " -+-+-+- http://127.0.0.1:" +
    PORT +
    " -+-+-+-"
  );
});
