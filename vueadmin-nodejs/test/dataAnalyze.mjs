// Our official coze sdk for JavaScript [coze-js](https://github.com/coze-dev/coze-js)
import { CozeAPI } from '@coze/api';

const apiClient = new CozeAPI({
  token: 'pat_kew1cPZbWq3QXa3FWUDqPdEdDA131YpdVK6CHkySW3ZJUU1nnSI8XeYX10zM6zJJ',
  baseURL: 'https://api.coze.cn'
});

/**
 * 运行数据分析工作流并处理响应
 * @param {string} excelUrl - Excel文件的URL
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeExcelData(excelUrl) {
  try {
    console.log('开始运行数据分析工作流...');
    console.log('Excel URL:', excelUrl);
    
    // 直接使用流式API
    const stream = await apiClient.workflows.runs.stream({
      workflow_id: '7486457220134338610',
      parameters: {
        "excel": excelUrl
      }
    });

    // 收集分析结果
    let finalResult = null;
    let lastMessage = null;
    let messageCount = 0;
    
    for await (const chunk of stream) {
      try {
        messageCount++;
        
        if (chunk && chunk.event === 'Message' && chunk.data && chunk.data.content) {
          // 处理 WorkflowEvent 对象
          console.log(`收到WorkflowEvent消息 ${messageCount}:`, JSON.stringify({
            id: chunk.id,
            event: chunk.event,
            nodeTitle: chunk.data.node_title,
            contentPreview: chunk.data.content.substring(0, 100) + '...'
          }, null, 2));
          
          // 这里就是我们需要的实际分析结果
          finalResult = {
            content: chunk.data.content,
            contentType: chunk.data.content_type,
            nodeTitle: chunk.data.node_title,
            nodeType: chunk.data.node_type,
            isFinished: chunk.data.node_is_finish
          };
          
          lastMessage = chunk;
        } else if (typeof chunk === 'string') {
          try {
            // 尝试解析JSON
            const jsonData = JSON.parse(chunk);
            console.log(`收到JSON消息 ${messageCount}:`, JSON.stringify(jsonData, null, 2));
            lastMessage = jsonData;
            
            // 检查各种可能的字段格式
            if (jsonData.content) {
              finalResult = jsonData;
            } else if (jsonData.choices && jsonData.choices.length > 0 && jsonData.choices[0].message) {
              finalResult = {
                content: jsonData.choices[0].message.content,
                original: jsonData
              };
            }
          } catch (parseError) {
            // 如果不是JSON，记录原始消息
            console.log(`收到原始消息 ${messageCount}:`, chunk);
          }
        } else {
          // 其他类型的消息
          console.log(`收到其他类型消息 ${messageCount}:`, chunk);
          
          // 如果对象有data属性，也可能是我们需要的
          if (chunk && typeof chunk === 'object') {
            lastMessage = chunk;
            
            // 检查是否是WorkflowEvent类的对象
            if (chunk.event && chunk.data) {
              console.log('可能是WorkflowEvent对象:', Object.keys(chunk));
              
              if (chunk.event === 'Message' && chunk.data.content) {
                finalResult = {
                  content: chunk.data.content,
                  contentType: chunk.data.content_type,
                  nodeTitle: chunk.data.node_title,
                  nodeType: chunk.data.node_type,
                  isFinished: chunk.data.node_is_finish
                };
              }
            }
          }
        }
      } catch (chunkError) {
        console.error('处理数据块错误:', chunkError);
      }
    }

    console.log('数据分析工作流执行结束，收到', messageCount, '条消息');
    
    // 检查是否获取到了结果
    if (finalResult) {
      console.log('使用已找到的分析结果');
      console.log('分析结果类型:', typeof finalResult);
      if (typeof finalResult === 'object') {
        console.log('分析结果结构:', Object.keys(finalResult));
      }
    } else if (lastMessage && lastMessage.data && lastMessage.data.content) {
      // 如果没有找到最终结果，但有包含内容的最后一条消息，使用它
      console.log('使用最后一条WorkflowEvent消息的内容作为结果');
      finalResult = {
        content: lastMessage.data.content,
        contentType: lastMessage.data.content_type,
        nodeTitle: lastMessage.data.node_title,
        nodeType: lastMessage.data.node_type,
        isFinished: lastMessage.data.node_is_finish
      };
    } else if (lastMessage) {
      // 如果有最后一条普通消息，使用它
      console.log('使用最后一条消息作为结果');
      finalResult = lastMessage;
    } else {
      console.log('未找到有效的分析结果');
    }
    
    // 格式化返回分析结果
    const formattedResult = finalResult ? {
      success: true,
      messageCount,
      data: finalResult
    } : {
      success: false,
      messageCount,
      data: { message: '未能获取到有效的分析结果' }
    };
    
    console.log('返回结果:', JSON.stringify(formattedResult, null, 2).substring(0, 500) + '...');
    return formattedResult;
  } catch (error) {
    console.error('数据分析工作流执行出错:', error);
    return {
      success: false,
      error: error.message || '数据分析失败'
    };
  }
}