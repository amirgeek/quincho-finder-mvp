// src/propiedadesController.js
const db = require('./db');

// --- 1. Crear Nueva Propiedad (POST /api/anfitrion/propiedades) ---
const crearPropiedad = async (req, res) => {
    // req.user.id viene del token JWT (middleware protect)
    const { id: usuario_id } = req.user; 
    const { nombre, ciudad, descripcion, precio_dia, comision_tipo = 'comision' } = req.body;

    // Validación básica
    if (!nombre || !ciudad || !precio_dia) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, ciudad y precio_dia.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO propiedades 
             (usuario_id, nombre, ciudad, descripcion, precio_dia, comision_tipo) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [usuario_id, nombre, ciudad, descripcion, precio_dia, comision_tipo]
        );

        res.status(201).json({ mensaje: 'Propiedad creada con éxito.', propiedad: result.rows[0] });

    } catch (err) {
        console.error('Error al crear la propiedad:', err);
        res.status(500).json({ error: 'Error interno al guardar la propiedad.' });
    }
};

// --- 2. Listar Propiedades del Anfitrión (GET /api/anfitrion/propiedades) ---
const listarMisPropiedades = async (req, res) => {
    const { id: usuario_id } = req.user; 

    try {
        // Selecciona todas las propiedades que pertenecen al usuario autenticado
        const result = await db.query(
            'SELECT * FROM propiedades WHERE usuario_id = $1 ORDER BY id DESC',
            [usuario_id]
        );

        res.json(result.rows);

    } catch (err) {
        console.error('Error al listar propiedades:', err);
        res.status(500).json({ error: 'Error interno al obtener las propiedades.' });
    }
};

module.exports = {
    crearPropiedad,
    listarMisPropiedades,
};