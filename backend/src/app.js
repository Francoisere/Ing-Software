require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { testConnection }  = require('./config/database');
const routes              = require('./routes/index');
const { errorHandler }    = require('./middleware/errorHandler');

// ── Registrar suscriptores Observer al arrancar ──────────────
require('./patterns/observer/Subscribers');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));

// ── Error handler global ──────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ──────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 GymFlow Manager API corriendo en http://localhost:${PORT}`);
    console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('─────────────────────────────────────────');
    console.log('Rutas principales:');
    console.log(`  POST   /api/auth/login`);
    console.log(`  GET    /api/socios`);
    console.log(`  POST   /api/membresias`);
    console.log(`  POST   /api/ventas        (GestorFacade)`);
    console.log(`  GET    /api/kpi/dashboard`);
    console.log(`  GET    /api/equipos`);
    console.log('─────────────────────────────────────────\n');
  });
}

start();

module.exports = app; // para tests con supertest
