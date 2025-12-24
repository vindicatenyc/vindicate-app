/**
 * Vindicate NYC REST API
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// API routes
app.get('/api/v1', (c) => {
  return c.json({
    message: 'Welcome to Vindicate NYC API',
    version: '0.1.0',
    docs: '/api/v1/docs',
  });
});

// Start server
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`Vindicate NYC API starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
