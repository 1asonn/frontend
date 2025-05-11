// 导入数据分析服务
const dataAnalyzeService = require('../services/dataAnalyzeService');

/**
 * 统一响应格式
 * @param {boolean} success - 是否成功
 * @param {string} message - 消息
 * @param {Object} data - 返回数据
 * @returns {Object} 格式化的响应对象
 */
const createResponse = (success, message, data = null) => {
  return {
    code: success ? 200 : 400,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 分析Excel数据 (一次性响应版本)
 * @param {Object} req - 请求对象，包含Excel文件URL
 * @param {Object} res - 响应对象
 */
exports.analyzeData = async (req, res) => {
  try {
    console.log('处理Excel分析请求 (一次性响应)');
    const { excelUrl } = req.body;
    
    // 验证参数
    if (!excelUrl) {
      return res.status(400).json(createResponse(false, '缺少Excel文件URL参数'));
    }

    // 动态导入ES模块
    const dataAnalyzeModule = await import('../dataAnalyze.mjs');
    
    // 调用analyzeExcelData函数处理Excel数据
    console.log('发送Excel数据分析请求到:', excelUrl);
    const result = await dataAnalyzeModule.analyzeExcelData(excelUrl);
    
    console.log('收到Excel分析响应:', JSON.stringify(result, null, 2));
    
    // 处理响应结果
    if (result.success) {
      // 提取分析结果中的内容
      let responseData;
      
      if (result.data && typeof result.data === 'object') {
        console.log('响应数据类型:', typeof result.data);
        console.log('响应数据结构:', Object.keys(result.data));
        
        // 处理WorkflowEvent格式的数据
        if (result.data.content) {
          // 直接返回原始的分析内容，它是Markdown格式
          responseData = {
            analysisContent: result.data.content,
            messageCount: result.messageCount
          };
          
          // 提取PDF报告的URL（如果存在）
          const pdfUrlMatch = result.data.content.match(/http:\/\/[^\s]+\.pdf/);
          if (pdfUrlMatch) {
            responseData.pdfReport = pdfUrlMatch[0];
          }
          
          // 提取图表URL列表
          const chartUrlsMatches = [...result.data.content.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)];
          if (chartUrlsMatches && chartUrlsMatches.length > 0) {
            responseData.charts = chartUrlsMatches.map(match => ({
              url: match[1],
              alt: match[0].match(/!\[(.*?)\]/) ? match[0].match(/!\[(.*?)\]/)[1] : ''
            }));
          }
          
          // 提取分析结果摘要
          const summaryMatch = result.data.content.match(/# 总结([\s\S]*?)(?:----|(\z))/);
          if (summaryMatch) {
            responseData.summary = summaryMatch[1].trim();
          }
        } else if (result.data.original && result.data.original.choices) {
          // 处理OpenAI或类似的响应格式
          responseData = {
            analysisContent: result.data.original.choices[0].message.content,
            model: result.data.original.model,
            messageCount: result.messageCount
          };
        } else {
          // 其他类型的响应
          responseData = result.data;
        }
      } else {
        // 如果不是对象，直接使用
        responseData = result.data;
      }
      
      // 记录提取的响应数据
      console.log('提取的响应数据结构:', Object.keys(responseData));
      
      res.json(createResponse(true, '数据分析成功', responseData));
    } else {
      console.error('数据分析失败:', result.error || result.data);
      res.status(500).json(createResponse(false, '数据分析失败', result.error || result.data));
    }
  } catch (error) {
    console.error('数据分析接口错误:', error);
    res.status(500).json(createResponse(false, '数据分析服务异常: ' + error.message));
  }
};

/**
 * 分析Excel数据 (流式响应版本)
 * @param {Object} req - 请求对象，包含Excel文件URL
 * @param {Object} res - 响应对象
 */
exports.analyzeDataStream = async (req, res) => {
  try {
    console.log('处理Excel分析请求 (流式响应)');
    const { excelUrl } = req.body;
    
    // 验证参数
    if (!excelUrl) {
      return res.status(400).json(createResponse(false, '缺少Excel文件URL参数'));
    }

    // 设置流式响应所需的响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 防止Nginx缓冲
    
    // 发送初始状态事件
    res.write(`data: ${JSON.stringify({
      event: 'start',
      message: '开始数据分析',
      timestamp: new Date().toISOString()
    })}

`);
    
    try {
      // 动态导入ES模块
      const dataAnalyzeModule = await import('../dataAnalyze.mjs');
      
      // 定义数据块处理回调
      const onChunk = (chunk, count) => {
        try {
          // 将数据块发送给客户端
          const eventData = {
            event: 'message',
            data: chunk,
            count,
            timestamp: new Date().toISOString()
          };
          
          res.write(`data: ${JSON.stringify(eventData)}

`);
          
          // 检查连接是否已经断开
          if (res.writableEnded) {
            console.log('客户端连接已断开，停止数据发送');
            return false; // 返回false表示停止处理
          }
          
          return true; // 返回true表示继续处理
        } catch (writeError) {
          console.error('写入数据块错误:', writeError);
          return false; // 发生错误时停止处理
        }
      };
      
      // 定义错误处理回调
      const onError = (error) => {
        try {
          // 将错误发送给客户端
          res.write(`data: ${JSON.stringify({
            event: 'error',
            message: `处理数据错误: ${error.message}`,
            timestamp: new Date().toISOString()
          })}

`);
        } catch (writeError) {
          console.error('写入错误信息失败:', writeError);
        }
      };
      
      // 调用analyzeExcelData函数并传入回调
      console.log('开始分析Excel数据 (URL):', excelUrl);
      const result = await dataAnalyzeModule.analyzeExcelData(excelUrl, onChunk, onError);
      
      // 发送完成事件
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          event: 'complete',
          message: '数据分析完成',
          success: result.success,
          timestamp: new Date().toISOString()
        })}

`);
        
        // 结束响应
        res.end();
      }
      
      console.log('数据分析流式响应完成');
    } catch (streamError) {
      console.error('流式分析过程出错:', streamError);
      
      // 发送错误信息
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          event: 'error',
          message: `数据分析过程出错: ${streamError.message}`,
          timestamp: new Date().toISOString()
        })}

`);
        
        res.end();
      }
    }
  } catch (error) {
    console.error('数据分析接口错误:', error);
    
    if (!res.headersSent) {
      // 如果还没有发送响应头，则发送正常的JSON错误响应
      res.status(500).json(createResponse(false, '数据分析服务异常: ' + error.message));
    } else if (!res.writableEnded) {
      // 如果已经发送了响应头但还没结束，则发送错误事件
      res.write(`data: ${JSON.stringify({
        event: 'error',
        message: `服务器错误: ${error.message}`,
        timestamp: new Date().toISOString()
      })}

`);
      
      res.end();
    }
  }
};

/**
 * 导出分析结果为Excel并上传到Dropbox
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.exportToExcel = async (req, res) => {
  try {
    const { data, fileName = 'data_analysis' } = req.body;
    
    if (!data) {
      return res.status(400).json(createResponse(false, '缺少数据参数'));
    }
    
    // 导出到Excel并上传到Dropbox
    const result = await dataAnalyzeService.exportToExcel(data, fileName);
    
    if (!result.success) {
      return res.status(400).json(createResponse(false, result.message || '导出失败'));
    }
    
    res.json(createResponse(true, '导出成功', {
      fileName: result.fileName,
      downloadUrl: result.downloadUrl,
      shareUrl: result.shareUrl
    }));
  } catch (error) {
    console.error('导出Excel错误:', error);
    res.status(500).json(createResponse(false, '服务器内部错误: ' + error.message));
  }
};

/**
 * 获取数据分析文件列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getFileList = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 获取文件列表
    const result = await dataAnalyzeService.getFileList(parseInt(limit, 10));
    
    if (!result.success) {
      return res.status(400).json(createResponse(false, result.message || '获取文件列表失败'));
    }
    
    res.json(createResponse(true, '获取文件列表成功', {
      files: result.files,
      total: result.total
    }));
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json(createResponse(false, '服务器内部错误: ' + error.message));
  }
};
