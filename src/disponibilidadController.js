// src/disponibilidadController.js
const db = require('./db');

// --- 1. BLOQUEAR DISPONIBILIDAD (Para Anfitriones) ---
const bloquearDisponibilidad = async (req, res) => {
    // El req.user.id viene del JWT (protección de ruta)
    const { id: usuario_id } = req.user; 
    const { propiedad_id, fecha, hora_inicio, hora_fin } = req.body;

    if (!propiedad_id || !fecha || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el bloqueo.' });
    }

    try {
        // VERIFICAR que la propiedad pertenezca al anfitrión
        const ownerCheck = await db.query(
            'SELECT 1 FROM propiedades WHERE id = $1 AND usuario_id = $2',
            [propiedad_id, usuario_id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. La propiedad no te pertenece.' });
        }

        // Insertar el bloqueo en la tabla disponibilidad
        const result = await db.query(
            `INSERT INTO disponibilidad 
             (propiedad_id, fecha, hora_inicio, hora_fin, estado) 
             VALUES ($1, $2, $3, $4, 'bloqueado') 
             RETURNING *`,
            [propiedad_id, fecha, hora_inicio, hora_fin]
        );

        res.status(201).json({ 
            mensaje: 'Período bloqueado con éxito.', 
            bloqueo: result.rows[0] 
        });

    } catch (err) {
        // Error 23505 = Conflicto de llave única (ya existe un bloqueo o reserva en ese horario)
        if (err.code === '23505') { 
            return res.status(409).json({ error: 'Ya existe un evento o bloqueo en ese horario.' });
        }
        console.error('Error al bloquear la disponibilidad:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};


// --- 2. BÚSQUEDA PÚBLICA DE PROPIEDADES DISPONIBLES ---
const buscarDisponibilidad = async (req, res) => {
    const { fecha, ciudad } = req.query;

    if (!fecha || !ciudad) {
        return res.status(400).json({ error: 'Debe especificar fecha y ciudad para buscar.' });
    }

    try {
        // Consulta avanzada: Busca propiedades en la ciudad que NO tengan un estado 'bloqueado' o 'reservado'
        const results = await db.query(
            `SELECT p.* FROM propiedades p
             LEFT JOIN disponibilidad d ON p.id = d.propiedad_id AND d.fecha = $1
             WHERE p.ciudad ILIKE $2 
               AND (d.estado IS NULL OR d.estado NOT IN ('bloqueado', 'reservado'))
             GROUP BY p.id`,
            [fecha, `%${ciudad}%`]
        );

        res.json(results.rows);

    } catch (err) {
        console.error('Error en la búsqueda de disponibilidad:', err);
        res.status(500).json({ error: 'Error interno del servidor durante la búsqueda.' });
    }
};

module.exports = {
    bloquearDisponibilidad,
    buscarDisponibilidad,
};

// src/disponibilidadController.js (Agregar al final)
// ... (Código anterior) ...

// --- 3. OBTENER DISPONIBILIDAD DE UNA PROPIEDAD (Para el Calendario) ---
const getDisponibilidadByPropiedad = async (req, res) => {
    const { id: usuario_id } = req.user;
    const propiedad_id = parseInt(req.params.id);

    try {
        // VERIFICAR que la propiedad pertenezca al anfitrión (SEGURIDAD)
        const ownerCheck = await db.query(
            'SELECT 1 FROM propiedades WHERE id = $1 AND usuario_id = $2',
            [propiedad_id, usuario_id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Propiedad no autorizada.' });
        }

        // Obtener todos los eventos (bloqueados y reservados) de esa propiedad
        const results = await db.query(
            'SELECT fecha, hora_inicio, hora_fin, estado FROM disponibilidad WHERE propiedad_id = $1',
            [propiedad_id]
        );

        res.json(results.rows);

    } catch (err) {
        console.error('Error al obtener disponibilidad:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    bloquearDisponibilidad,
    buscarDisponibilidad,
    getDisponibilidadByPropiedad, // <--- EXPORTAR
};

