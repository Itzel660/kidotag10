require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Hacer io accesible en toda la app
app.set('io', io);

// Manejar conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('[SOCKET] Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('[SOCKET] Cliente desconectado:', socket.id);
  });
});

// Conectar a la base de datos
connectDB();

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`Socket.IO listo para conexiones en tiempo real`);
});
