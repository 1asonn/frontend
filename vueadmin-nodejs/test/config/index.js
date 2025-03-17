require('dotenv').config();

module.exports = {
    // Server Configuration
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'yyjkn',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithms: ['HS256']
    },

    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'vueadmin',
        port: process.env.DB_PORT || 3306
    },

    // Security Configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
    },

    // Cors Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
};
