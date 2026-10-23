import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import reportRoutes from './routes/reportRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// app config
const app = express();
const port = process.env.PORT || 9000;
const isProduction = process.env.NODE_ENV === 'production';

/*
 * Trust the platform's reverse proxy.
 *
 * On Render, TLS terminates at a load balancer and Express receives plain http
 * from the proxy's address. Without this setting:
 *   - req.secure is false, so express-session refuses to send a Secure cookie
 *     at all — login silently does nothing in production;
 *   - every visitor appears to come from the proxy's IP, so the rate limiters
 *     are shared by the whole site: five logins anywhere would lock everyone
 *     out of /api/auth for fifteen minutes.
 * TRUST_PROXY is the number of proxy hops in front of the app (1 on Render).
 */
const trustProxy = process.env.TRUST_PROXY ?? (isProduction ? '1' : '0');
app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

// Security: Set security headers.
// Content Security Policy, starting from Helmet's defaults:
//  - img-src is widened to https:, because instructor photos and galleries are
//    external URLs (Cloudinary, once uploads exist);
//  - font-src and style-src are narrowed to our own origin. Helmet allows any
//    https: source for both, which is what let the fonts come from Google; they
//    are bundled now, and no stylesheet or <style> tag comes from anywhere else.
//    React's style props are set through the DOM and are not affected.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                'img-src': ["'self'", 'data:', 'https:'],
                'font-src': ["'self'"],
                'style-src': ["'self'"],
            },
        },
    })
);

/*
 * CORS.
 *
 * In production the frontend is served by this same app (see the static block
 * near the bottom), so the browser's requests are same-origin — but browsers
 * still attach an Origin header to same-origin POST/PUT/DELETE requests. If we
 * only checked an allowlist, every login would be rejected unless
 * CLIENT_ORIGIN happened to be set to the site's own URL. So a request whose
 * Origin is this server's own origin is always allowed.
 *
 * CLIENT_ORIGIN remains for anyone who splits the frontend onto another host.
 * RENDER_EXTERNAL_URL is set by Render automatically and is our own public URL.
 */
const allowedOrigins = [
    ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : []),
    ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
    ...(isProduction ? [] : ['http://localhost:5173', 'http://localhost:3000']),
].map((origin) => origin.trim().replace(/\/$/, ''));

app.use(
    cors((req, callback) => {
        const origin = req.get('origin');
        const selfOrigin = `${req.protocol}://${req.get('host')}`;

        const allowed =
            !origin ||                      // curl, server-to-server, same-origin GETs
            origin === selfOrigin ||        // the frontend this app serves itself
            allowedOrigins.includes(origin) ||
            !isProduction;                  // anything goes in development

        if (!allowed) {
            const error = new Error('Not allowed by CORS');
            error.status = 403;
            return callback(error);
        }

        return callback(null, { origin: true, credentials: true });
    })
);

/*
 * Rate limiting — API only.
 *
 * Mounted on /api rather than globally: now that this app also serves the
 * frontend, every JS, CSS and image file would otherwise count against the same
 * budget as API calls. 300 per 15 minutes rather than 100, because Irish
 * mobile carriers put many subscribers behind one address (CGNAT), and a limit
 * sized for one person would be shared by strangers.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', generalLimiter);


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

/*
 * Session cookie SameSite policy.
 *
 * The frontend is served by this same app, so the session cookie is
 * first-party and 'lax' is the right default everywhere: it is sent on normal
 * navigation (so arriving from an email link keeps you signed in) and withheld
 * from cross-site POSTs, which is what protects us from CSRF.
 *
 * History, because the obvious alternative was tried: the frontend and API
 * used to be two Render services on two onrender.com subdomains. onrender.com
 * is on the Public Suffix List, so those are different sites and the cookie
 * was third-party. Switching it to SameSite=None made Chrome work, but Safari —
 * and therefore every iPhone — blocks third-party cookies outright, whatever
 * their SameSite value. For a mobile-first product in Ireland that is a large
 * share of users who could never log in. Same-origin is the only arrangement
 * that works everywhere.
 *
 * COOKIE_SAMESITE=none exists only for anyone who splits the frontend onto
 * another site again; it forces Secure, and will still fail on Safari.
 */
const sameSite = process.env.COOKIE_SAMESITE || 'lax';

/* Browsers reject SameSite=None unless the cookie is also Secure, and reject it
   silently — so a misconfiguration here would look exactly like the bug above. */
const secureCookie = sameSite === 'none' ? true : process.env.NODE_ENV === 'production';

if (sameSite === 'none') {
    console.warn('COOKIE_SAMESITE=none: the session cookie is third-party and Safari/iOS will block it.');
}

app.use(
    session({
        name: 'pro.me.sid',
        secret: sessionSecret || 'dev-session-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite,
            secure: secureCookie,
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
        store: MongoStore.create({
            mongoUrl: mongoUri,
            collectionName: 'sessions',
        }),
    })
);

// Health check for the platform. Only answers once the database is connected,
// so a deploy is not marked live while it cannot actually serve requests.
app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ ok: connected });
});

//api endpoints

// Brute-force limits live on the login and register routes themselves (see
// authRoutes.js), not on all of /api/auth — /auth/me runs on every page load.
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

/*
 * Serve the built frontend from this same app.
 *
 * One origin for the page and the API is what makes the session cookie
 * first-party (see the SameSite note above). Only active when a build exists,
 * so local development — where Vite serves the frontend on :5173 and proxies
 * /api here — is unaffected.
 */
const frontendDist = fileURLToPath(new URL('../frontend/dist', import.meta.url));
const frontendIndex = path.join(frontendDist, 'index.html');

if (existsSync(frontendIndex)) {
    // Vite fingerprints everything under /assets, so it can be cached forever.
    app.use(
        '/assets',
        express.static(path.join(frontendDist, 'assets'), { immutable: true, maxAge: '1y' })
    );
    app.use(express.static(frontendDist, { index: false }));

    // Client-side routes (/instructors/123, /terms, ...) all load index.html.
    // API paths and missing files with an extension fall through to the 404.
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api/') || path.extname(req.path)) {
            return next();
        }
        // Never cache the shell, or a deploy would keep serving stale asset names.
        res.set('Cache-Control', 'no-cache');
        return res.sendFile(frontendIndex);
    });
} else {
    app.get('/', (_req, res) => {
        res.send('API running. The frontend is served separately in development (npm --prefix frontend run dev).');
    });
}

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
