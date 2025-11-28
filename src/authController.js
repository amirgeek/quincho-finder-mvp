// src/authController.js
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clave secreta para firmar los tokens JWT
// ¡IMPORTANTE! NUNCA la pongas en código fuente en producción. Usa variables de entorno.
const JWT_SECRET = 'TU_CLAVE_SECRETA_SUPER_SEGURA'; 

// --- 1. REGISTRO DE USUARIO ---
const register = async (req, res) => {
    const { email, password, nombre, rol = 'cliente' } = req.body;
    
    // Validación básica de rol (solo permite cliente o anfitrión)
    if (!['cliente', 'anfitrion'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    try {
        // Encriptar la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, password_hash, nombre, rol]
        );

        // Generar JWT (token de autenticación)
        const token = jwt.sign({ id: result.rows[0].id, rol: rol }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ token, rol });

    } catch (err) {
        if (err.code === '23505') { // Código de error para email duplicado
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al registrar el usuario.', details: err.message });
    }
};

// --- 2. LOGIN DE USUARIO ---
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        const user = result.rows[0];
        
        // Comparar la contraseña ingresada con el hash guardado
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        // Generar JWT
        const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, rol: user.rol });

    } catch (err) {
        res.status(500).json({ error: 'Error en el login.', details: err.message });
    }
};


// --- 3. MIDDLEWARE DE PROTECCIÓN DE RUTA ---
const protect = (allowedRoles) => (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adjunta el ID y el Rol del usuario al request
        
        // Verificar si el rol del usuario está permitido en esta ruta
        if (allowedRoles && !allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'Acceso denegado. Rol insuficiente.' });
        }

        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido.' });
    }
};


module.exports = {
    register,
    login,
    protect,
};