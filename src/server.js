const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const downloadRoutes = require('./routes/download');
const securityRoutes = require('./routes/security');
const { securityHeaders, requestSizeLimit, ipFilter } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');
const { globalRateLimiter, downloadRateLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Helmet - Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(requestSizeLimit('10mb'));
app.use(require('xss-clean')());
app.use(require('express-mongo-sanitize')());
app.use(require('hpp')({ whitelist: ['quality', 'format', 'url'] }));
app.use(ipFilter());
app.use(require('cookie-parser')(process.env.COOKIE_SECRET || 'default-secret-change-in-production'));
app.use(require('compression')());
app.use(require('morgan')('combined', {
  skip: (req) => req.path === '/health'
}));

app.use(express.static(path.join(__dirname, '../public'), {
  dotfiles: 'ignore',
  etag: true,
  maxAge: '1d'
}));

app.use('/downloads', express.static(path.join(__dirname, '../public/downloads'), {
  dotfiles: 'ignore',
  etag: false,
  maxAge: '1h',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/download', sanitizeInput, downloadRoutes);
app.use('/api/security', securityRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 404 });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    code: err.status || 500,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => { server.close(() => console.log('Process closed')); });

module.exports = app;