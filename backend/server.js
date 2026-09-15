import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeRequest from './middleware/sanitize.js';
import 'dotenv/config';
import enterpriseRoutes from './routes/enterpriseRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import referenceRoutes from './routes/referenceRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';

// app config
const app = express();
const port = process.env.PORT || 9000;

// Security: Set security headers
app.use(helmet());

// Security: CORS configuration - restrict to specific origin in production
const allowedOrigins = process.env.CLIENT_ORIGIN 
    ? process.env.CLIENT_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            
            // In development, allow all origins
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);

// Security: Rate limiting - general
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(generalLimiter);

// Security: Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login/register attempts per window
    message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: '5mb' }));

// Security: Strip Mongo operators from input to prevent NoSQL injection.
// Registered after express.json() so req.body is already parsed.
app.use(sanitizeRequest);

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
}

// Security: Validate session secret in production
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set in production');
}

app.use(
    session({
        name: 'pro.me.sid',
        secret: sessionSecret || 'dev-session-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
        store: MongoStore.create({
            mongoUrl: mongoUri,
            collectionName: 'sessions',
        }),
    })
);

//api endpoints
app.get('/',(req,res) => {
    res.send('API WORKING...');
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/favorites', favoriteRoutes);

// Security: 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Security: Global error handler - don't leak error details in production
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : err.message;
    
    res.status(err.status || 500).json({ message });
});

mongoose
    .connect(mongoUri)
    .then(() => {
        app.listen(port, () => console.log(`Listening on localhost:${port}`));
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    });
