// Our official coze sdk for JavaScript [coze-js](https://github.com/coze-dev/coze-js)
import { CozeAPI } from '@coze/api';

const apiClient = new CozeAPI({
  token: 'pat_i0V2sT3gNbuYKJwH7kC8Tcyk5opRN71oeYj8ISrW4N5PzymaE2aTtUJo2vxaKRyL',
  baseURL: 'https://api.coze.cn'
});

// 运行工作流并处理流式响应
async function runWorkflowStream() {
  try {
    console.log('开始运行工作流...');
    
    // 直接使用流式API
    const stream = await apiClient.workflows.runs.stream({
      workflow_id: '7486457220134338610',
      parameters: {
        "excel": "https://p3-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/9de53c3fa0e84c11aefca1551b85fd73.xlsx~tplv-mdko3gqilj-image.image?rk3s=81d4c505&x-expires=1774193770&x-signature=W81HOV97xUvpgHg3nrmyKhz4JQY%3D&x-wf-file_name=%E6%88%B4%E5%B8%88%E5%85%84%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%90%AF%E8%92%99%E8%AF%BE_Excel%E7%BB%83%E4%B9%A0.xlsx"
      }
    });

    // 处理流式响应
    for await (const chunk of stream) {
        console.log("this is chunk",chunk);
      if (typeof chunk === 'string') {
        try {
          const message = JSON.parse(chunk);
          console.log('收到消息:', message);
        } catch (error) {
          console.log('原始消息:', chunk);
        }
      } else {
        console.log('收到非字符串消息:', chunk);
      }
    }

    console.log('工作流执行结束');
  } catch (error) {
    console.error('工作流执行出错:', error);
    throw error;
  }
}

// 运行主函数
runWorkflowStream().catch(console.error);