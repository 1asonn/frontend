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
const aiagent = require('./router/aiAgent.js')
const medicineRouter = require('./router/medicine.js');
const equipmentRouter = require('./router/equipment.js')
const downloadRouter = require('./router/download.js');
const scheduleRouter = require('./router/schedule.js');
const departmentRouter = require('./router/department.js');
const shiftSettingRouter = require('./router/shiftSetting.js');
const filesRouter = require('./router/files.js');
const maintenanceRouter = require('./router/maintenance.js');
const sqlAgentRouter = require('./router/sqlAgent.js');

// Initialize model associations
require('./database/models');

const app = express();

// Middleware configuration
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors(config.cors));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// JWT configuration
app.use(
    expressJWT({ 
        secret: config.jwt.secret,
        algorithms: config.jwt.algorithms 
    }).unless({ 
        path: [
            /^\/user\/login/,
            /^\/user\/register/,
            /^\/user\/test/,
            /^\/user\/getPhoneByUsername\/.*/,
            /^\/user\/sendSmsCode/,
            /^\/user\/sendResetPasswordCode/,
            /^\/user\/verifyResetPasswordCode/,
            /^\/user\/resetPasswordBySms/,
            /^\/sqlAgent\/.*/
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
app.use('/aiagent',aiagent)
app.use('/medicine', medicineRouter)
app.use('/equipment', equipmentRouter);
app.use('/download', downloadRouter)
app.use('/schedule', scheduleRouter);
app.use('/department', departmentRouter);
app.use('/shiftSetting', shiftSettingRouter);
app.use('/files', filesRouter);
app.use('/maintenance', maintenanceRouter);
app.use('/sqlAgent', sqlAgentRouter);

// Start server
app.listen(config.port, () => {
    console.log(`Server is running in ${config.nodeEnv} mode on port: ${config.port}`);
});