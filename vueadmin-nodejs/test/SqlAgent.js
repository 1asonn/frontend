const { ChatOpenAI } = require("@langchain/openai");
const { SqlDatabase } = require("langchain/sql_db");
const { createSqlAgent, SqlToolkit } = require("langchain/agents/toolkits/sql");
const { DataSource } = require("typeorm");

const run = async () => {
  const datasource = new DataSource({
    type: "mysql",
    database: "test",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
  });
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });
  const model = new ChatOpenAI({
    openai_api_key:"4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB",
    openai_api_base:"https://api.stepfun.com/v1",
    model_name:"step-1v-32k"
  });
  const toolkit = new SqlToolkit(db, model);
  const executor = createSqlAgent(model, toolkit);

  const input = `List the total sales per country. Which country's customers spent the most?`;

  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({ input });

  console.log(`Got output ${result.output}`);

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  );

  await datasource.destroy();
};


run()