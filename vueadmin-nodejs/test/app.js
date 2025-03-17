// Load environment variables and configuration
const config = require('./config');
require('./database/init.js');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const expressJWT = require('express-jwt');
const path = require('path');

// Import routes
const role = require('./router/role.js');
const userRouter = require('./router/user.js');
const patientRouter = require('./router/patient.js');
const medicalRecord = require('./router/medicalRecord.js');
const uploadRouter = require('./router/upload.js');

// Import models for relationships
const User = require('./database/models/User');
const Role = require('./database/models/Role');

// Define relationships between models
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

const app = express();

// Middleware configuration
app.use(bodyParser.json());
app.use(cors(config.cors));
app.use(express.urlencoded({ extended: false }));

// JWT configuration
app.use(
    expressJWT({ 
        secret: config.jwt.secret,
        algorithms: config.jwt.algorithms 
    }).unless({ 
        path: [
            /^\/user\/login/,
            /^\/user\/register/,
            /^\/user\/test/
        ] 
    })
);

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: '无效的token或token已过期'
        });
    }
    next(err);
});

// Routes
app.use('/patient', patientRouter);
app.use('/role', role);
app.use('/user', userRouter);
app.use('/medicalRecord', medicalRecord);
app.use('/upload', uploadRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
app.listen(config.port, () => {
    console.log(`Server is running in ${config.nodeEnv} mode on port: ${config.port}`);
});