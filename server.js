// server.js
const express = require('express');
const path = require('path');

// Importar controladores y la conexión a la DB
const db = require('./src/db');
const authController = require('./src/authController');
const propiedadesController = require('./src/propiedadesController');
const disponibilidadController = require('./src/disponibilidadController');
const reservaController = require('./src/reservaController');

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN E INICIALIZACIÓN ---
// db.initializeDatabase(); // Descomentar solo la primera vez

// Configuración de Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// --- RUTAS DE AUTENTICACIÓN (PÚBLICAS) ---
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);


// --- RUTAS PROTEGIDAS DE ANFITRIÓN/ADMIN ---
app.get('/api/anfitrion/dashboard', authController.protect(['anfitrion']), (req, res) => {
    res.json({ mensaje: `Bienvenido al Dashboard de Anfitrión, ID: ${req.user.id}` });
});

// Gestión de Propiedades (CRUD)
app.post('/api/anfitrion/propiedades', authController.protect(['anfitrion']), propiedadesController.crearPropiedad);
app.get('/api/anfitrion/propiedades', authController.protect(['anfitrion']), propiedadesController.listarMisPropiedades);

// Gestión de Calendario
app.post('/api/anfitrion/disponibilidad/bloquear', authController.protect(['anfitrion']), disponibilidadController.bloquearDisponibilidad);
app.get('/api/anfitrion/disponibilidad/propiedad/:id', authController.protect(['anfitrion']), disponibilidadController.getDisponibilidadByPropiedad);

// Aprobación Manual (Admin/Anfitrión)
app.post(
    '/api/admin/aprobar-pago', 
    authController.protect(['anfitrion', 'admin']), 
    reservaController.aprobarPagoManual
);

// LISTA DE RESERVAS PENDIENTES (Para el Dashboard Administrativo)
app.get(
    '/api/anfitrion/reservas-pendientes',
    authController.protect(['anfitrion', 'admin']),
    reservaController.listarReservasPendientes
);


// --- RUTAS DE RESERVA Y BÚSQUEDA PÚBLICAS ---
app.post('/api/publico/reservar', reservaController.crearReservaPendiente);
app.get('/api/publico/buscar', disponibilidadController.buscarDisponibilidad);

// Rutas de Front-end (Sirve los HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/detalle.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'detail.html'));
});


// --- INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});