// src/db.js
const { Pool } = require('pg');

// -----------------------------------------------------------
// 🚨 ¡IMPORTANTE! REEMPLAZAR CON TUS CREDENCIALES REALES 🚨
// -----------------------------------------------------------
const pool = new Pool({
    user: 'amirb',  // Ej: el que usaste en createdb
    host: 'localhost',                 
    database: 'quincho_finder',        
    password: '',      // Si la dejaste vacía, déjalo como una cadena vacía ''
    port: 5432,                        
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Función para inicializar y crear las tablas necesarias.
 * Se debe ejecutar una sola vez.
 */
const initializeDatabase = async () => {
    try {
        await pool.query(`
            -- TABLA 1: USUARIOS (Para Anfitriones y Clientes)
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                rol VARCHAR(20) NOT NULL DEFAULT 'cliente'
            );

            -- TABLA 2: PROPIEDADES (Los Quinchos y Clubhouses)
            CREATE TABLE IF NOT EXISTS propiedades (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id),
                nombre VARCHAR(100) NOT NULL,
                ciudad VARCHAR(50) NOT NULL,
                descripcion TEXT,
                precio_dia NUMERIC(10, 2) NOT NULL,
                comision_tipo VARCHAR(20) NOT NULL DEFAULT 'comision',
                fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- TABLA 3: DISPONIBILIDAD (El motor de reservas)
            CREATE TABLE IF NOT EXISTS disponibilidad (
                id SERIAL PRIMARY KEY,
                propiedad_id INTEGER REFERENCES propiedades(id),
                fecha DATE NOT NULL,
                hora_inicio TIME WITHOUT TIME ZONE NOT NULL,
                hora_fin TIME WITHOUT TIME ZONE NOT NULL,
                estado VARCHAR(20) NOT NULL DEFAULT 'libre',
                UNIQUE (propiedad_id, fecha, hora_inicio, hora_fin)
            );
        `);
        console.log("✅ Tablas de PostgreSQL creadas o verificadas.");
    } catch (err) {
        console.error("❌ Error al inicializar la base de datos. Verifica tus credenciales y que el servicio de PG esté corriendo.", err);
        throw err;
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    initializeDatabase,
    pool: pool 
};