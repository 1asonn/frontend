import request from '../axios.js'

/**
 * 获取文件列表
 * @param {Object} params - 请求参数
 * @param {string} params.prefix - 路径前缀
 * @param {string} params.delimiter - 目录分隔符
 * @param {number} params.maxKeys - 最大返回数量
 * @returns {Promise<Object>} 文件列表及下载链接
 */
export function listFiles(params = {}) {
  return request({
    url: '/cos/listFiles',
    method: 'get',
    params
  })
}

/**
 * 上传单个文件
 * @param {FormData} formData - 包含文件的表单数据
 * @returns {Promise<Object>} 上传结果
 */
export function uploadFile(formData) {
  return request({
    url: '/cos/uploadFile',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取文件URL
 * @param {Object} params - 请求参数
 * @param {string} params.key - 文件Key
 * @param {number} params.expires - URL过期时间（秒）
 * @returns {Promise<Object>} 文件URL结果
 */
export function getFileUrl(params) {
  return request({
    url: '/cos/getFileUrl',
    method: 'get',
    params
  })
}

/**
 * 删除文件
 * @param {Object} data - 请求数据
 * @param {string} data.key - 文件Key
 * @returns {Promise<Object>} 删除结果
 */
export function deleteFile(data) {
  return request({
    url: '/cos/deleteFile',
    method: 'post',
    data
  })
}

/**
 * 分析Excel数据 - 返回JSON对象中包含字符串格式的JSON分析结果
 * @param {Object} data - 包含Excel文件URL或文件的数据对象
 * @returns {Promise<Object>} 包含分析结果的Promise
 */
export function analyzeExcelData(data) {
  let url = '/dataAnalyze/analyze';
  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  };

  // 如果是FormData对象（上传文件的情况）
  if (data instanceof FormData) {
    const excelUrl = data.get('excelUrl');
    if (excelUrl) {
      // 如果是传入URL，则使用JSON
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ excelUrl })
      };
    } else {
      // 上传文件时使用multipart/form-data
      options = {
        method: 'POST',
        body: data
      };
    }
  }

  // 使用fetch发送请求并处理响应
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`\u670d\u52a1\u5668\u9519\u8bef: ${response.status} ${text}`);
        });
      }
      return response.json();
    })
    .then(result => {
      if (!result.success) {
        throw new Error(result.message || '\u6570\u636e\u5206\u6790\u5931\u8d25');
      }
      return result;
    });
}
