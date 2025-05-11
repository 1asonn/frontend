const sqlAgentService = require('../services/sqlAgentService');

/**
 * SQL Agent 控制器
 * 处理自然语言查询并返回SQL执行结果
 */

// 统一响应格式
const createResponse = (success, message, data = null) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * 执行自然语言查询
 */
const executeQuery = async (req, res) => {
  try {
    const { query, exportToExcel = false, fileName = '' } = req.body;
    
    if (!query) {
      return res.status(400).json(createResponse(false, '查询语句不能为空'));
    }
    
    // 执行查询
    const result = await sqlAgentService.executeQuery(query, exportToExcel, fileName);
    
    if (!result.success) {
      return res.status(400).json(createResponse(false, result.message));
    }
    
    res.json(createResponse(true, '查询执行成功', result));
  } catch (error) {
    console.error('执行SQL Agent查询错误:', error);
    res.status(500).json(createResponse(false, '服务器内部错误: ' + error.message));
  }
};

/**
 * 导出查询结果为Excel并上传到Dropbox
 */
const exportQueryResult = async (req, res) => {
  try {
    const { query, fileName = 'sql_report' } = req.body;
    
    if (!query) {
      return res.status(400).json(createResponse(false, '查询语句不能为空'));
    }
    
    // 执行查询并导出
    const result = await sqlAgentService.executeQuery(query, true, fileName);
    
    if (!result.success) {
      return res.status(400).json(createResponse(false, result.message));
    }
    
    if (!result.exportResult || !result.exportResult.success) {
      return res.status(400).json(createResponse(false, '导出失败: ' + (result.exportResult?.message || '未知错误')));
    }
    
    res.json(createResponse(true, '导出成功并已上传到Dropbox', {
      downloadUrl: result.exportResult.downloadUrl, // Dropbox下载链接
      shareUrl: result.exportResult.shareUrl,      // Dropbox分享链接
      fileName: result.exportResult.fileName,
      fileSize: result.exportResult.filePath ? require('fs').statSync(result.exportResult.filePath).size : null,
      result: result.result
    }));
  } catch (error) {
    console.error('导出查询结果错误:', error);
    res.status(500).json(createResponse(false, '服务器内部错误: ' + error.message));
  }
};

module.exports = {
  executeQuery,
  exportQueryResult
};
