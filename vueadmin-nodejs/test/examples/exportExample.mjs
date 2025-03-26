import { runQueryAndExport } from '../Sql_Agent.mjs';

// 测试查询示例
const examples = [
    {
        question: "查询所有在库且未过期的药品库存情况，包括药品名称、规格、库存数量和过期时间",
        fileName: "medicine_stock_report"
    },
    {
        question: "统计每种药品的总库存量和最早过期日期",
        fileName: "medicine_stock_summary"
    },
    {
        question: "查询近30天内的设备维护记录，包括设备名称、维护人员和维护内容",
        fileName: "equipment_maintenance_report"
    }
];

// 依次执行查询并导出
async function runExamples() {
    for (const example of examples) {
        console.log(`\n执行查询: ${example.question}`);
        try {
            const result = await runQueryAndExport(example.question, example.fileName);
            console.log('查询成功:', result);
        } catch (error) {
            console.error('查询失败:', error);
        }
    }
}

runExamples().catch(console.error);
