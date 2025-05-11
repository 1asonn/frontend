import request from '../axios.js'

/**
 * 分析Excel数据
 * @param {Object} data - 包含Excel文件URL或文件的数据对象
 * @returns {Promise<Object>} 分析结果
 */
export function analyzeExcelData(data) {
  // 如果是FormData对象（上传文件的情况）
  if (data instanceof FormData) {
    return request({
      url: '/dataAnalyze/analyze',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  
  // 如果是JSON数据（使用文件URL的情况）
  return request({
    url: '/dataAnalyze/analyze',
    method: 'post',
    data: data
  })
}

/**
 * 获取历史SQL查询文件列表
 * @param {string} path - 文件路径，默认为 'reports/sql-reports'
 * @param {string} linkType - 链接类型，默认为 'temp'
 * @returns {Promise<Object>} 文件列表及下载链接
 */
export function getSqlReportFiles(path = 'reports/sql-reports', linkType = 'temp') {
  return request({
    url: '/files/list-with-links',
    method: 'get',
    params: { path, linkType }
  })
}