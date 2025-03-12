const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// 配置 multer 的存储选项
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 设置文件存储的目录
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // 设置文件名（可以自定义文件名格式）
        const ext = path.extname(file.originalname); // 获取文件扩展名
        cb(null, Date.now() + ext); // 使用时间戳作为文件名
    }
});

// 创建 multer 实例
const upload = multer({ storage });

// 图片上传接口
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '未上传文件' });
    }

    const { filename, originalname, mimetype, size } = req.file;

    res.status(200).json({
        message: '图片上传成功',
        data: {
            filename, // 保存后的文件名
            originalname, // 原始文件名
            mimetype, // 文件类型
            size, // 文件大小
            url: `/uploads/${filename}` // 文件访问路径
        }
    });
});

module.exports = router;