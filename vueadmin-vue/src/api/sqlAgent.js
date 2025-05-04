import request from '../axios.js'

/**
 * 执行自然语言查询
 * @param {string} query - 自然语言查询
 * @returns {Promise} - 返回查询结果的Promise
 */
export const executeQuery = async (query) => {
  try {
    const response = await request.post('http://localhost:4000/sqlAgent/query', { query });
    return response.data;
  } catch (error) {
    console.error('执行自然语言查询失败:', error);
    throw error;
  }
};

/**
 * 导出查询结果为Excel
 * @param {string} query - 自然语言查询
 * @param {string} fileName - 导出文件名
 * @returns {Promise} - 返回导出结果的Promise
 */
export const exportQueryResult = async (query, fileName = 'sql_report') => {
  try {
    const response = await request.post('http://localhost:4000/sqlAgent/export', { 
      query, 
      fileName 
    });
    return response.data;
  } catch (error) {
    console.error('导出查询结果失败:', error);
    throw error;
  }
};
