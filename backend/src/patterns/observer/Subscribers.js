const { eventBus, EVENTOS } = require('./EventBus');
const nodemailer = require('nodemailer');
require('dotenv').config();

// ── Transporte de correo ──────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Utilidad de envío ─────────────────────────────────────────
async function enviarCorreo(destinatario, asunto, html) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: destinatario,
      subject: asunto,
      html,
    });
    console.log(`📧 Correo enviado a ${destinatario}: ${asunto}`);
  } catch (err) {
    console.error('❌ Error al enviar correo:', err.message);
  }
}

// ── SUSCRIPTOR 1: Alerta de stock bajo ───────────────────────
eventBus.on(EVENTOS.STOCK_BAJO, async ({ producto, stock_actual, stock_minimo }) => {
  console.log(`⚠️  [Observer] Stock bajo: ${producto} (${stock_actual}/${stock_minimo})`);

  // Notificar al administrador por email
  if (process.env.NODE_ENV !== 'test') {
    await enviarCorreo(
      process.env.MAIL_USER,
      `⚠️ Stock bajo: ${producto}`,
      `<h2>Alerta de Stock</h2>
       <p>El producto <strong>${producto}</strong> tiene solo <strong>${stock_actual}</strong> unidades.</p>
       <p>Stock mínimo configurado: ${stock_minimo}. Por favor reabastezca pronto.</p>`
    );
  }
});

// ── SUSCRIPTOR 2: Membresía próxima a vencer ─────────────────
eventBus.on(EVENTOS.MEMBRESIA_POR_VENCER, async ({ socio, correo, diasRestantes, fechaVencimiento }) => {
  console.log(`📅 [Observer] Membresía por vencer: ${socio} (${diasRestantes} días)`);

  if (process.env.NODE_ENV !== 'test' && correo) {
    await enviarCorreo(
      correo,
      '⏰ Tu membresía GymFlow vence pronto',
      `<h2>Hola ${socio}!</h2>
       <p>Tu membresía vence el <strong>${fechaVencimiento}</strong> (en ${diasRestantes} días).</p>
       <p>Renuévala en recepción o comunícate con nosotros.</p>
       <p>¡Te esperamos! 💪</p>`
    );
  }
});

// ── SUSCRIPTOR 3: Membresía vencida (actualiza estado del socio) ──
eventBus.on(EVENTOS.MEMBRESIA_VENCIDA, async ({ id_socio, socio, correo }) => {
  console.log(`❌ [Observer] Membresía vencida: ${socio} (id_socio=${id_socio})`);

  // El KpiService se suscribirá por separado; aquí solo notificamos al socio
  if (process.env.NODE_ENV !== 'test' && correo) {
    await enviarCorreo(
      correo,
      '❌ Tu membresía GymFlow ha vencido',
      `<h2>Hola ${socio}</h2>
       <p>Tu membresía ha vencido. Para continuar disfrutando del gimnasio, por favor renuévala en recepción.</p>`
    );
  }
});

// ── SUSCRIPTOR 4: Mantenimiento pendiente ────────────────────
eventBus.on(EVENTOS.MANTENIMIENTO_PENDIENTE, async ({ equipo, zona, diasSinRevision }) => {
  console.log(`🔧 [Observer] Mantenimiento pendiente: ${equipo} (${diasSinRevision} días sin revisión)`);

  if (process.env.NODE_ENV !== 'test') {
    await enviarCorreo(
      process.env.MAIL_USER,
      `🔧 Mantenimiento pendiente: ${equipo}`,
      `<h2>Alerta de Mantenimiento</h2>
       <p>El equipo <strong>${equipo}</strong> en la zona <strong>${zona}</strong> 
          lleva <strong>${diasSinRevision}</strong> días sin revisión preventiva.</p>
       <p>Programe un mantenimiento a la brevedad.</p>`
    );
  }
});

console.log('✅ Suscriptores Observer registrados');
