/**
 * 腾讯云对象存储服务(COS)
 * 提供文件上传、下载、删除等基础功能
 */
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 创建COS实例
const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID,
  SecretKey: process.env.TENCENT_SECRET_KEY,
  FileParallelLimit: 3,    // 控制文件上传并发数
  ChunkParallelLimit: 8,   // 控制单个文件下分片上传并发数
  ChunkSize: 1024 * 1024 * 8, // 控制分片大小，单位B
});

// 默认配置
const defaultConfig = {
  bucket: process.env.TENCENT_COS_BUCKET,
  region: process.env.TENCENT_COS_REGION,
};

/**
 * 上传文件到腾讯云COS
 * @param {Object} options 上传选项
 * @param {string|Buffer|Stream} options.file 文件路径、文件Buffer或可读流
 * @param {string} options.key 存储的文件名/路径
 * @param {string} [options.bucket] 存储桶名称，默认使用配置中的bucket
 * @param {string} [options.region] 地域，默认使用配置中的region
 * @param {Object} [options.headers] 额外的请求头
 * @returns {Promise<Object>} 上传结果，包含文件访问URL等信息
 */
const uploadFile = async (options) => {
  try {
    const uploadOptions = {
      Bucket: options.bucket || defaultConfig.bucket,
      Region: options.region || defaultConfig.region,
      Key: options.key,
      Headers: options.headers || {},
    };

    // 根据不同的文件类型设置Body属性
    if (typeof options.file === 'string') {
      // 文件路径
      uploadOptions.Body = fs.createReadStream(options.file);
    } else if (Buffer.isBuffer(options.file)) {
      // Buffer
      uploadOptions.Body = options.file;
    } else {
      // 可读流
      uploadOptions.Body = options.file;
    }

    const result = await cos.putObject(uploadOptions);
    
    // 构建文件访问URL
    const url = `https://${uploadOptions.Bucket}.cos.${uploadOptions.Region}.myqcloud.com/${uploadOptions.Key}`;
    
    return {
      success: true,
      url,
      etag: result.ETag,
      requestId: result.RequestId,
      key: uploadOptions.Key
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 从腾讯云COS获取文件
 * @param {Object} options 下载选项
 * @param {string} options.key 文件名/路径
 * @param {string} [options.bucket] 存储桶名称，默认使用配置中的bucket
 * @param {string} [options.region] 地域，默认使用配置中的region
 * @param {string} [options.outputPath] 输出路径，如果提供则保存到本地文件
 * @returns {Promise<Object>} 下载结果
 */
const getFile = async (options) => {
  try {
    const downloadOptions = {
      Bucket: options.bucket || defaultConfig.bucket,
      Region: options.region || defaultConfig.region,
      Key: options.key,
    };

    if (options.outputPath) {
      // 下载到本地文件
      const result = await cos.getObject(downloadOptions);
      const outputStream = fs.createWriteStream(options.outputPath);
      result.Body.pipe(outputStream);
      
      return new Promise((resolve, reject) => {
        outputStream.on('finish', () => {
          resolve({
            success: true,
            path: options.outputPath,
            contentType: result.headers['content-type'],
            contentLength: result.headers['content-length'],
          });
        });
        outputStream.on('error', (err) => {
          reject({
            success: false,
            error: err.message
          });
        });
      });
    } else {
      // 返回文件内容
      const result = await cos.getObject(downloadOptions);
      return {
        success: true,
        body: result.Body,
        contentType: result.headers['content-type'],
        contentLength: result.headers['content-length'],
      };
    }
  } catch (error) {
    console.error('文件获取失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 生成文件临时访问URL
 * @param {Object} options 选项
 * @param {string} options.key 文件名/路径
 * @param {string} [options.bucket] 存储桶名称，默认使用配置中的bucket
 * @param {string} [options.region] 地域，默认使用配置中的region
 * @param {number} [options.expires] 链接有效期，单位秒，默认3600秒
 * @returns {Promise<Object>} 包含临时URL的结果
 */
const getFileUrl = async (options) => {
  try {
    const urlOptions = {
      Bucket: options.bucket || defaultConfig.bucket,
      Region: options.region || defaultConfig.region,
      Key: options.key,
      Expires: options.expires || 3600,
      Sign: true,
    };

    const url = cos.getObjectUrl(urlOptions);
    
    return {
      success: true,
      url,
      expires: new Date(Date.now() + (options.expires || 3600) * 1000)
    };
  } catch (error) {
    console.error('获取文件URL失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 删除腾讯云COS上的文件
 * @param {Object} options 删除选项
 * @param {string} options.key 文件名/路径
 * @param {string} [options.bucket] 存储桶名称，默认使用配置中的bucket
 * @param {string} [options.region] 地域，默认使用配置中的region
 * @returns {Promise<Object>} 删除结果
 */
const deleteFile = async (options) => {
  try {
    const deleteOptions = {
      Bucket: options.bucket || defaultConfig.bucket,
      Region: options.region || defaultConfig.region,
      Key: options.key,
    };

    const result = await cos.deleteObject(deleteOptions);
    
    return {
      success: true,
      requestId: result.RequestId
    };
  } catch (error) {
    console.error('文件删除失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 批量删除COS文件
 * @param {Object} options 批量删除选项
 * @param {Array<string>} options.keys 文件名/路径数组
 * @param {string} [options.bucket] 存储桶名称，默认使用配置中的bucket
 * @param {string} [options.region] 地域，默认使用配置中的region
 * @returns {Promise<Object>} 批量删除结果
 */
const deleteMultipleFiles = async (options) => {
  try {
    const deleteOptions = {
      Bucket: options.bucket || defaultConfig.bucket,
      Region: options.region || defaultConfig.region,
      Objects: options.keys.map(key => ({ Key: key }))
    };

    const result = await cos.deleteMultipleObject(deleteOptions);
    
    return {
      success: true,
      deleted: result.Deleted,
      errors: result.Error || [],
      requestId: result.RequestId
    };
  } catch (error) {
    console.error('批量删除文件失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 获取目录下的文件列表
 * @param {Object} options 列表选项
 * @param {string} [options.prefix] 前缀，相当于目录路径
 * @param {string} [options.bucket] 存储桶名称，默认使用配置中的bucket
 * @param {string} [options.region] 地域，默认使用配置中的region
 * @param {string} [options.delimiter] 分隔符，通常是'/'
 * @param {number} [options.maxKeys] 单次返回最大条目数，默认1000
 * @returns {Promise<Object>} 文件列表结果
 */
const listFiles = async (options) => {
  try {
    const listOptions = {
      Bucket: options.bucket || defaultConfig.bucket,
      Region: options.region || defaultConfig.region,
      Prefix: options.prefix || '',
      Delimiter: options.delimiter || '',
      MaxKeys: options.maxKeys || 1000
    };

    const result = await cos.getBucket(listOptions);
    
    return {
      success: true,
      files: result.Contents,
      commonPrefixes: result.CommonPrefixes,
      isTruncated: result.IsTruncated,
      nextMarker: result.NextMarker,
      requestId: result.RequestId
    };
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 生成上传文件的唯一Key
 * @param {string} filename 原始文件名
 * @param {string} [prefix] 路径前缀，例如 'images/'
 * @returns {string} 唯一的文件Key
 */
const generateFileKey = (filename, prefix = '') => {
  const ext = path.extname(filename);
  const uuid = uuidv4();
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  
  return `${prefix}${dateStr}/${uuid}${ext}`;
};

/**
 * 从URL中提取文件Key
 * @param {string} url COS文件URL
 * @returns {string|null} 文件Key或null
 */
const getKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // URL格式：https://<bucket>.cos.<region>.myqcloud.com/<key>
    const pathname = urlObj.pathname;
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  } catch (error) {
    console.error('从URL提取Key失败:', error);
    return null;
  }
};

module.exports = {
  uploadFile,
  getFile,
  getFileUrl,
  deleteFile,
  deleteMultipleFiles,
  listFiles,
  generateFileKey,
  getKeyFromUrl
};
