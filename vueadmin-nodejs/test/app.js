require('./database/init.js')
const express = require('express')
const bodyParser = require('body-parser');
const role = require('./router/role.js')
const userRouter = require('./router/user.js')
const patientRouter = require('./router/patient.js')
const medicalRecord = require('./router/medicalRecord.js')
const cors = require('cors')
const expressJWT = require('express-jwt')
const uploadRouter = require('./router/upload.js'); 
const path = require('path')
// 定义表之间的关系
const User = require('./database/models/User')
const Role = require('./database/models/Role')

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });



const config = {
    jwtSecretKey: 'yyjkn' // 与签发 token 时使用的密钥相同
  };
const app =express()

//配置token校验
app.use(bodyParser.json()); // 解析 JSON 格式的请求体
app.use(expressJWT({ secret: config.jwtSecretKey ,algorithms: ['HS256']}).unless({ path: [/^\/user\//] }));
app.use(cors())
app.use(express.urlencoded({ extended:false }))
app.use('/patient',patientRouter)
app.use('/role',role)
app.use('/user',userRouter)
app.use('/medicalRecord',medicalRecord)
app.use('/upload', uploadRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(4000,() => {
    console.log('serve is running on port: 4000')
})