const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDropboxClient } = require('./dropboxAuth');

/**
 * 文件上传服务，提供多种上传方式
 * 首先尝试上传到Dropbox，如果失败则回退到本地存储
 */
class FileUploadService {
  constructor() {
    // 确保上传目录存在
    this.uploadsDir = path.join(__dirname, '../uploads');
    this.imagesDir = path.join(this.uploadsDir, 'images');
    this.maintenanceImagesDir = path.join(this.imagesDir, 'maintenance');
    this.equipmentImagesDir = path.join(this.imagesDir, 'equipment');
    
    this.ensureDirectoryExists(this.uploadsDir);
    this.ensureDirectoryExists(this.imagesDir);
    this.ensureDirectoryExists(this.maintenanceImagesDir);
    this.ensureDirectoryExists(this.equipmentImagesDir);
    
    // 服务器基础URL，用于构建本地文件的访问URL
    this.baseUrl = process.env.SERVER_BASE_URL || 'http://localhost:4000';
  }
  
  /**
   * 确保目录存在，如果不存在则创建
   * @param {string} dirPath - 目录路径
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`创建目录: ${dirPath}`);
    }
  }
  
  /**
   * 上传工单相关图片
   * @param {Array} files - 图片文件数组
   * @param {string} orderId - 工单ID，可选
   * @returns {Promise<Array>} 图片URL数组
   */
  async uploadMaintenanceImages(files, orderId = '') {
    try {
      // 首先尝试上传到Dropbox
      const urls = await this.uploadToDropbox(files, 'maintenance', orderId);
      return urls;
    } catch (error) {
      console.error('Dropbox上传失败，回退到本地存储:', error.message);
      // Dropbox上传失败，回退到本地存储
      return this.uploadToLocalStorage(files, 'maintenance', orderId);
    }
  }
  
  /**
   * 上传设备相关图片
   * @param {Array} files - 图片文件数组
   * @param {string} equipmentId - 设备ID，可选
   * @returns {Promise<Array>} 图片URL数组
   */
  async uploadEquipmentImages(files, equipmentId = '') {
    try {
      // 首先尝试上传到Dropbox
      const urls = await this.uploadToDropbox(files, 'equipment', equipmentId);
      return urls;
    } catch (error) {
      console.error('Dropbox上传失败，回退到本地存储:', error.message);
      // Dropbox上传失败，回退到本地存储
      return this.uploadToLocalStorage(files, 'equipment', equipmentId);
    }
  }
  
  /**
   * 上传图片到Dropbox
   * @param {Array} files - 图片文件数组
   * @param {string} type - 图片类型，如'maintenance'或'equipment'
   * @param {string} id - 关联ID，如工单ID或设备ID
   * @returns {Promise<Array>} 图片URL数组
   */
  async uploadToDropbox(files, type, id = '') {
    // 获取Dropbox客户端
    const dbx = await getDropboxClient();
    
    // 处理多个图片文件
    const uploadPromises = files.map(async (file) => {
      // 生成唯一文件名
      const uniqueId = uuidv4().substring(0, 8);
      const fileName = `${type}_${id}_${Date.now()}_${uniqueId}${this.getExtension(file.originalname)}`;
      const filePath = `/${type}/${fileName}`;
      
      // 上传文件到Dropbox
      await dbx.filesUpload({
        path: filePath,
        contents: file.buffer,
        mode: 'overwrite'
      });
      
      // 获取共享链接
      const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: filePath,
        settings: {
          requested_visibility: { '.tag': 'public' }
        }
      });
      
      // 获取直接下载链接（替换dl=0为dl=1）
      return linkResponse.result.url.replace('dl=0', 'dl=1');
    });
    
    // 等待所有图片上传完成
    return Promise.all(uploadPromises);
  }
  
  /**
   * 上传图片到本地存储
   * @param {Array} files - 图片文件数组
   * @param {string} type - 图片类型，如'maintenance'或'equipment'
   * @param {string} id - 关联ID，如工单ID或设备ID
   * @returns {Promise<Array>} 图片URL数组
   */
  async uploadToLocalStorage(files, type, id = '') {
    // 确定存储目录
    const storageDir = type === 'maintenance' ? this.maintenanceImagesDir : this.equipmentImagesDir;
    
    // 处理多个图片文件
    const uploadPromises = files.map(async (file) => {
      // 生成唯一文件名
      const uniqueId = uuidv4().substring(0, 8);
      const fileName = `${type}_${id}_${Date.now()}_${uniqueId}${this.getExtension(file.originalname)}`;
      const filePath = path.join(storageDir, fileName);
      
      // 写入文件到本地存储
      await fs.promises.writeFile(filePath, file.buffer);
      
      // 构建访问URL
      return `${this.baseUrl}/uploads/images/${type}/${fileName}`;
    });
    
    // 等待所有图片上传完成
    return Promise.all(uploadPromises);
  }
  
  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 文件扩展名，包括点号
   */
  getExtension(filename) {
    return filename.substring(filename.lastIndexOf('.'));
  }
}

// 导出单例实例
module.exports = new FileUploadService();
