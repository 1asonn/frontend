// const { sequelize, Sequelize } = require("../init.js")

// const AiAgent = sequelize.define('ai_agent', {
//     id: {
//         type: Sequelize.INTEGER,
//         primaryKey: true,
//         autoIncrement: true
//     },
//     name: {
//         type: Sequelize.STRING,
//         validate: {
//             notEmpty: true
//         }
//     },
//     description: {
//         type: Sequelize.TEXT
//     },
//     prompt: {
//         type: Sequelize.TEXT,
//         validate: {
//             notEmpty: true
//         }
//     },
//     model: {
//         type: Sequelize.STRING,
//         defaultValue: 'step'
//     },
//     temperature: {
//         type: Sequelize.FLOAT,
//         defaultValue: 0.7
//     },
//     maxTokens: {
//         type: Sequelize.INTEGER,
//         defaultValue: 2000
//     },
//     active: {
//         type: Sequelize.BOOLEAN,
//         defaultValue: true
//     }
// }, { timestamps: true })

// AiAgent.sync().then(() => {
//     console.log('ai_agent表模型已同步!')
// })

// module.exports = AiAgent
