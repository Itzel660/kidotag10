require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");
const http = require("http");
const { Server } = require("socket.io");

const DEFAULT_PORT = 3000;
const requestedPort = Number.parseInt(process.env.PORT, 10);
const START_PORT = Number.isInteger(requestedPort)
  ? requestedPort
  : DEFAULT_PORT;

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Hacer io accesible en toda la app
app.set("io", io);

// Manejar conexiones de Socket.IO
io.on("connection", (socket) => {
  console.log("[SOCKET] Cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("[SOCKET] Cliente desconectado:", socket.id);
  });
});

// Conectar a la base de datos
connectDB();

function startServer(port) {
  const handleError = (error) => {
    server.off("listening", handleListening);

    if (error.code === "EADDRINUSE" && port < 65535) {
      const nextPort = port + 1;
      console.warn(`Puerto ${port} en uso, intentando con ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error(
      `No se pudo iniciar el servidor en el puerto ${port}:`,
      error,
    );
    process.exit(1);
  };

  const handleListening = () => {
    server.off("error", handleError);

    const address = server.address();
    const activePort =
      typeof address === "object" && address !== null ? address.port : port;

    console.log(`Servidor ejecutándose en http://0.0.0.0:${activePort}`);
    console.log("Socket.IO listo para conexiones en tiempo real");
  };

  server.once("error", handleError);
  server.once("listening", handleListening);
  server.listen(port);
}

// Iniciar servidor
startServer(START_PORT);
