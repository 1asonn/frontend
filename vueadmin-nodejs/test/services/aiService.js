const { Configuration, OpenAIApi } = require('openai');
const { DataSource } = require('typeorm');

const config = require('../config');
const dataSource = new DataSource(config.dataSourceOptions);


class AiService {
    constructor() {
        const configuration = new Configuration({
            apiKey: process.env.API_KEY,
            baseURL: process.env.BASE_URL
        });
        this.openai = new OpenAIApi(configuration);
    } 
}

console.log("dataSource",dataSource)
module.exports = new AiService();
