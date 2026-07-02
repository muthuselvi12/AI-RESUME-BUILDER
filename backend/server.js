require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
//   .split(',')
//   .map((o) => o.trim());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // temporarily allow all during dev
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight for all routes

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET','POST'] }
});
app.set('io', io);

connectDB();

app.use(helmet());
// app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Too many requests.' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('join-room', (userId) => socket.join(userId));
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});