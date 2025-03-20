const { sequelize,Sequelize } = require("../init.js")
const {  OpenAI } = require('openai');
const { DataSource } = require('typeorm');
const { ChatOpenAI } = require("langchain/chat_models");

const dataSource = new DataSource({type: "mysql", // 数据库类型
    host: "localhost", // 数据库主机地址
    port: 3306, // 数据库端口
    username: "root", // 数据库用户名
    password: "root", // 数据库密码
    database: "test", // 数据库名称
    entities: [__dirname + "/entity/*{.js,.ts}"], // 实体类路径
    synchronize: true, // 是否自动同步数据库表结构
    logging: false 
})
const { SqlDatabase }  = require("langchain/sql_db");
const { SqlDatabaseChain } = require("langchain/chains/sql_db");

const llm = ChatOpenAI(
    openai_api_key=getenv("4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB"),
    openai_api_base="https://api.stepfun.com/v1",
    model_name="step-1v-32k"
  )
async function test(){
    return await SqlDatabase.fromDataSourceParams({
        appDataSource: dataSource,
      });
}

async function main() {
    // 初始化 TypeORM 数据源
    await dataSource.initialize().catch((err) => {
        console.error("Error during Data Source initialization", err);
    });

    // 调用 test() 并等待结果
    const db = await test();

    // 创建 SqlDatabaseChain 实例
    const chain = new SqlDatabaseChain({
        llm: llm,
        database: db,
    });

    // 执行查询
    const res = await chain.run("How many patients are there?");
    console.log(res);
    console.log("dataSource", dataSource);

    // 关闭数据源
    await dataSource.destroy();
}
const Patient = sequelize.define('patient',{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    name:{
       type:Sequelize.STRING,
       validate:{
           notEmpty:true
       }
    },
    medicalId:{
       type:Sequelize.STRING,
       validate:{
           notEmpty:true
       }
    },
    gender:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    birthday:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    idCard:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    phone:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    address:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    medicalHistory:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:false
        }
    }

},{timestamps: true})

Patient.sync().then(() =>{
    console.log('patient表模型已同步!')
})


main()

module.exports = Patient