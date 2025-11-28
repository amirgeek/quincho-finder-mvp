// src/reservaController.js
const db = require('./db');

// --- RUTA PÚBLICA: CREAR RESERVA PENDIENTE ---
const crearReservaPendiente = async (req, res) => {
    const { 
        propiedad_id, 
        nombre_inquilino, 
        email_inquilino, 
        telefono_inquilino,
        fecha_inicio, 
        fecha_fin, 
        monto_total 
    } = req.body;

    if (!propiedad_id || !fecha_inicio || !monto_total || !email_inquilino) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para la reserva.' });
    }

    try {
        // Paso 1: Crear la RESERVA en la tabla (estado 'pendiente')
        const reservaResult = await db.query(
            `INSERT INTO reservas 
             (propiedad_id, nombre_inquilino, email_inquilino, telefono_inquilino, fecha_inicio, fecha_fin, monto_total, estado_pago) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente') 
             RETURNING *`,
            [propiedad_id, nombre_inquilino, email_inquilino, telefono_inquilino, fecha_inicio, fecha_fin, monto_total]
        );

        const reserva = reservaResult.rows[0];

        // Paso 2: BLOQUEAR el espacio en la tabla DISPONIBILIDAD (estado 'reservado')
        await db.query(
            `INSERT INTO disponibilidad 
             (propiedad_id, fecha, hora_inicio, hora_fin, estado) 
             VALUES ($1, $2, $3, $4, 'reservado')`,
            [
                propiedad_id, 
                fecha_inicio.split('T')[0], 
                fecha_inicio.split('T')[1].substring(0, 8), 
                fecha_fin.split('T')[1].substring(0, 8)
            ]
        );

        res.status(201).json({ 
            mensaje: 'Reserva creada con éxito (Pendiente de Pago).', 
            reserva: reserva 
        });

    } catch (err) {
        console.error('Error al crear la reserva:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El espacio ya está ocupado en ese horario.' });
        }
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// --- RUTA PROTEGIDA: APROBACIÓN MANUAL POR ADMINISTRADOR ---
const aprobarPagoManual = async (req, res) => {
    const { reserva_id } = req.body; 

    try {
        const result = await db.query(
            'UPDATE reservas SET estado_pago = $1 WHERE id = $2 RETURNING estado_pago',
            ['confirmado', reserva_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }
        
        res.json({ 
            mensaje: `Reserva ${reserva_id} confirmada manualmente.`, 
            estado: 'confirmado' 
        });

    } catch (error) {
        console.error('Error al aprobar manualmente:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// --- 3. LISTAR RESERVAS PENDIENTES DEL ANFITRIÓN ---
const listarReservasPendientes = async (req, res) => {
    const { id: usuario_id } = req.user;

    try {
        const results = await db.query(
            `SELECT 
                r.id AS reserva_id, r.monto_total, r.fecha_creacion,
                r.nombre_inquilino, r.telefono_inquilino,
                p.nombre AS nombre_quincho, p.id AS propiedad_id
             FROM reservas r
             JOIN propiedades p ON r.propiedad_id = p.id
             WHERE p.usuario_id = $1 AND r.estado_pago = 'pendiente'
             ORDER BY r.fecha_creacion DESC`,
            [usuario_id]
        );

        res.json(results.rows);

    } catch (err) {
        console.error('Error al listar reservas pendientes:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};


module.exports = {
    crearReservaPendiente,
    aprobarPagoManual,
    listarReservasPendientes // <-- ¡LISTO PARA SER USADO EN EL DASHBOARD!
};