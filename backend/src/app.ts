import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';
import { validateEnvironment } from './utils/validateEnv';

dotenv.config();

// Validate environment configuration
validateEnvironment();

const app = express();

// Respect X-Forwarded-* headers when behind Nginx/Cloudflared to satisfy rate limiter and logging
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
