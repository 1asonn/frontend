const express = require('express')
const userRouter = require('./router/user.js')
const patientRouter = require('./router/patient.js')
const medicalRecord = require('./router/medicalRecord.js')
const cors = require('cors')
const expressJWT = require('express-jwt')
const role = require('./router/role.js')
const uploadRouter = require('./router/upload.js'); 
require('./database/init.js')
require('./database/models/User.js')


const config = {
    jwtSecretKey: 'yyjkn' // 与签发 token 时使用的密钥相同
  };
const app =express()

//配置token校验
app.use(expressJWT({ secret: config.jwtSecretKey ,algorithms: ['HS256']}).unless({ path: [/^\/user\//] }));
app.use(cors())
app.use(express.urlencoded({ extended:false }))
app.use('/patient',patientRouter)
app.use('/user',userRouter)
app.use('/medicalRecord',medicalRecord)
app.use('/role',role)
app.use('/upload', uploadRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(4000,() => {
    console.log('serve is running on port: 4000')
})