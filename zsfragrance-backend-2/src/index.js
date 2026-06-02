import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { adminAuth } from './middleware/auth.js';
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ZS Fragrance API', timestamp: new Date().toISOString() });
});

// ─── Routes publiques (frontend) ──────────────────────────
app.post('/orders', ordersRouter);
app.get('/products', productsRouter);

// ─── Routes admin (protégées) ─────────────────────────────
app.use('/admin/orders',   adminAuth, ordersRouter);
app.use('/admin/products', adminAuth, productsRouter);

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ─── Error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`\n🌿 ZS Fragrance API démarrée`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://localhost:${PORT}/health\n`);
});
