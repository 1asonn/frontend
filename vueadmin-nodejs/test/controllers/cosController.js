/**
 * 腾讯云对象存储控制器
 * 提供文件上传、获取、删除等接口
 */
const cosService = require('../services/cosService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 配置临时文件存储
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../uploads/temp');
      // 确保目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
  }
});

/**
 * 上传单个文件到COS
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
const uploadFile = async (req, res) => {
  try {
    // 使用multer中间件后，文件已经上传到临时目录
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有选择文件或文件上传失败' });
    }

    // 文件存储路径前缀，可以按照业务类型分类
    const prefix = req.body.prefix || 'uploads/';
    
    // 生成COS中的文件Key
    const key = cosService.generateFileKey(req.file.originalname, prefix);
    
    // 上传到COS
    const result = await cosService.uploadFile({
      file: req.file.path, // 本地临时文件路径
      key: key
    });

    // 上传成功后删除临时文件
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('删除临时文件失败:', err);
    });

    if (result.success) {
      res.json({
        success: true,
        fileInfo: {
          url: result.url,
          key: result.key,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件上传到云存储失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({
      success: false,
      message: '文件上传处理出错',
      error: error.message
    });
  }
};

/**
 * 上传多个文件到COS
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '没有选择文件或文件上传失败' });
    }
    
    const prefix = req.body.prefix || 'uploads/';
    const uploadResults = [];
    const failedUploads = [];
    
    // 处理每个文件
    for (const file of req.files) {
      const key = cosService.generateFileKey(file.originalname, prefix);
      
      const result = await cosService.uploadFile({
        file: file.path,
        key: key
      });
      
      // 删除临时文件
      fs.unlink(file.path, (err) => {
        if (err) console.error(`删除临时文件 ${file.path} 失败:`, err);
      });
      
      if (result.success) {
        uploadResults.push({
          url: result.url,
          key: result.key,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        });
      } else {
        failedUploads.push({
          originalName: file.originalname,
          error: result.error
        });
      }
    }
    
    res.json({
      success: true,
      uploadedFiles: uploadResults,
      failedFiles: failedUploads,
      totalUploaded: uploadResults.length,
      totalFailed: failedUploads.length
    });
  } catch (error) {
    console.error('多文件上传错误:', error);
    res.status(500).json({
      success: false,
      message: '多文件上传处理出错',
      error: error.message
    });
  }
};

/**
 * 根据Key获取文件URL
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
const getFileUrl = async (req, res) => {
  try {
    const { key, expires } = req.query;
    
    if (!key) {
      return res.status(400).json({ success: false, message: '文件Key不能为空' });
    }
    
    const result = await cosService.getFileUrl({
      key: key,
      expires: expires ? parseInt(expires) : 3600
    });
    
    if (result.success) {
      res.json({
        success: true,
        url: result.url,
        expires: result.expires
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取文件URL失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取文件URL错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文件URL处理出错',
      error: error.message
    });
  }
};

/**
 * 删除文件
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
const deleteFile = async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ success: false, message: '文件Key不能为空' });
    }
    
    const result = await cosService.deleteFile({ key });
    
    if (result.success) {
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件删除失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除文件处理出错',
      error: error.message
    });
  }
};

/**
 * 批量删除文件
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
const deleteMultipleFiles = async (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ success: false, message: '文件Key列表不能为空且必须是数组' });
    }
    
    const result = await cosService.deleteMultipleFiles({ keys });
    
    if (result.success) {
      res.json({
        success: true,
        message: '文件批量删除成功',
        deleted: result.deleted,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件批量删除失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('批量删除文件错误:', error);
    res.status(500).json({
      success: false,
      message: '批量删除文件处理出错',
      error: error.message
    });
  }
};

/**
 * 获取文件列表
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
const listFiles = async (req, res) => {
  try {
    const { prefix, delimiter, maxKeys } = req.query;
    
    const result = await cosService.listFiles({
      prefix: prefix || '',
      delimiter: delimiter || '/',
      maxKeys: maxKeys ? parseInt(maxKeys) : 1000
    });
    
    if (result.success) {
      res.json({
        success: true,
        files: result.files,
        directories: result.commonPrefixes,
        isTruncated: result.isTruncated,
        nextMarker: result.nextMarker
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取文件列表失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文件列表处理出错',
      error: error.message
    });
  }
};

module.exports = {
  uploadSingle: upload.single('file'), // 中间件，处理单文件上传
  uploadMultiple: upload.array('files', 10), // 中间件，处理最多10个文件的上传
  uploadFile,
  uploadMultipleFiles,
  getFileUrl,
  deleteFile,
  deleteMultipleFiles,
  listFiles
};
