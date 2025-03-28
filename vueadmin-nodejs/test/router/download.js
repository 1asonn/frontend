const router = require('express').Router()
const path = require('path')
const fs = require('fs')

// 获取导出文件列表
router.get('/files', (req, res) => {
    const exportDir = path.join(__dirname, '../exports')
    fs.readdir(exportDir, (err, files) => {
        if (err) {
            return res.json({
                code: 500,
                msg: '获取文件列表失败',
                data: null
            })
        }
        const fileList = files.map(file => ({
            filename: file,
            url: `/api/download/file/${file}`
        }))
        res.json({
            code: 200,
            msg: '获取文件列表成功',
            data: fileList
        })
    })
})

// 下载文件（Base64格式）
router.get('/file/:filename', (req, res) => {
    const filename = req.params.filename
    const filePath = path.join(__dirname, '../exports', filename)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            code: 404,
            msg: '文件不存在',
            data: null
        })
    }

    try {
        // 读取文件并转换为Base64
        const fileContent = fs.readFileSync(filePath)
        const base64Content = fileContent.toString('base64')
        
        // 获取文件扩展名
        const ext = path.extname(filename).toLowerCase()
        
        res.json({
            code: 200,
            msg: '获取文件成功',
            data: {
                filename: filename,
                base64: base64Content,
                ext: ext
            }
        })
    } catch (err) {
        console.error('文件读取错误:', err)
        res.status(500).json({
            code: 500,
            msg: '文件读取错误',
            data: null
        })
    }
})

module.exports = router
