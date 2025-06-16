import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './database/sqlite.js';
import { handleSocketConnection } from './socket/editorSocket.js';
import editorRoutes from './routes/editorRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Environment variables
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === 'production' ? [CLIENT_URL] : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' ? [CLIENT_URL] : ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Initialize database
await initDatabase();

// Routes
app.use('/api', editorRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server running successfully',
    environment: NODE_ENV,
    port: PORT
  });
});

// Serve React app in production
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  if (NODE_ENV === 'development') {
    console.log(`📝 Editor available at http://localhost:5173`);
  }
});