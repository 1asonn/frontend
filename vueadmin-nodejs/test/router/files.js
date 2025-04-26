const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
require('isomorphic-fetch'); // 引入 fetch 实现
const { Dropbox } = require('dropbox');

// 配置 multer 的临时存储
const upload = multer({ storage: multer.memoryStorage() });

// 创建 Dropbox 客户端实例
const dbx = new Dropbox({ 
    accessToken: 'sl.u.AFvpzy6bFbsb1vshlCglqUOgILWbA2wvzUF6qwVY2DGkiYxY_qghvZZV6GiJKU3-HuxUlry3HtSzCZHRuVQBi9hWLVBY-wmaoAiA9_Iny0M2gw8gqrbOTfm8GfrlbievwA9ybOSQVi8CX2T0uonA6sz4P4ulmcZ3noHMwVjhuI4J7uXIy9KDb2bFShaATL25zw4zaThzERT9pPQWuoxY8tK7evJUHzqYDcBiQZh24N7ZxzwueMrIyevcNpa7qggPqb-O-gdw7lnYGH36Y8bGE6k2tj-8x51ZXsGNLoO5OAGXyN6Bh0iNXsV7mp5zlmdKRx8UGX2H0RbNxjnTDtbSbDcj4_2YnSgJb2vMRSeSDvVyRaFdFUEplRK6VmY6YCykwJpJPiYps5mhQRIJwkSk8I0lGx6mpT-r_nEU3LLkUNpxNOOTPbydNbjACsKHSOHiAxi5opnNwh_Frr3gweRforLzj2wQbrsd3mkukBQ0V17sl0FkmQOZIdwJ9h_IbaHI8z7ZqPbTYwTJu39xQxA6gdD0-0Ak-qG0mc9YaC9BszgeQmibJugWfMARk2YzSkNbQ0PMjPruEDOrJyk4n-IZj6V39twyvrqFJsAPHP7LbVvcJa2bJPk5lv3m8hcGDZ4ccyGu8BMt2N9N1TF7pkPRkKraoToZb0epcBqkL9rR9AQ708jtZUZyR7AGuVhD7f6aZkHYxP6gh95nDyfQswiF5yHthE9U33FUflParHJVuD5TeeSF4FqcDD4fDWPkDKnhbEnYXfUebkYbyG-3x7_q-Y5N9DASlmfOl9hP4WyHxVqghmxSWy8OxsVYaRVFAd0blyFA_caCE5GOQqyC2YFRZxXLJGvWYrbClxPeccHOc8AbIYkHm1zuPeybmrLhyUG1IvbtLqIiau7R7UV92ub5dRUZsS5vVfJT1N-Lh0atRgDpSb1QJNjDPj74qP7R0XAifVAjJC3iGn0NYVeL73nq3akmR-JMgAFZbhB-2XiYmvE9GibXCbdmYCAu057yAh33kylN3ezZ32rEZBdvKLO1OBIlwcndpiYLokGBIHBpDKK4wYtg0BZjHTD49UEyNqOwaD3AaXJCxp4zwU0mPEuCfc3nBTZ9qsIMHro7iqHR60rgGwrxjBZmyUskuLx2IMlYXdnNyzyUWa5BEv7rM8IIcEcZrWsecKWmnshMvp7_U98Pulqu69pFR049MYfB0SB_qtgE7k3mVJo5Cx3DHiWaIpCBCTHAOepznWd3AMZv3vRhP_k6wYptHD4oq7EDWYFbgCxaBb9KMpUE35KOVFxuZqaBHaqrWQ1tCF3spQTR5J79VfNiM1RmXzYELiazIsCHYZkwIHq93VioHLeuccqOXCF08FWHUgDsHK5P_VwE0oX-i4YnB7Ce1A_v7n9ilzXPCxcr0sfjI8NCg2Hu5MuAZqsVJsIyGmPTGwsxWrxi1Fo5kT8_bgxA5xEpcrd61sokFiY' 
});

/**
 * @api {get} /files/list 获取Dropbox文件列表
 * @apiDescription 获取Dropbox根目录下的文件列表
 * @apiName listFiles
 * @apiGroup Files
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object[]} data 文件列表数据
 */
router.get('/list', async (req, res) => {
    try {
        const response = await dbx.filesListFolder({ path: '' });
        
        res.status(200).json({
            success: true,
            data: response.result
        });
    } catch (error) {
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '获取文件列表失败',
            error: error.message
        });
    }
});

/**
 * @api {get} /files/list/:path 获取指定路径的文件列表
 * @apiDescription 获取Dropbox指定路径下的文件列表
 * @apiName listFilesInPath
 * @apiGroup Files
 * 
 * @apiParam {String} path 文件路径
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object[]} data 文件列表数据
 */
router.get('/list/:path', async (req, res) => {
    try {
        const path = req.params.path;
        const response = await dbx.filesListFolder({ path: `/${path}` });
        
        res.status(200).json({
            success: true,
            data: response.result
        });
    } catch (error) {
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '获取文件列表失败',
            error: error.message
        });
    }
});

/**
 * @api {get} /files/download/:path 下载文件
 * @apiDescription 从Dropbox下载指定路径的文件
 * @apiName downloadFile
 * @apiGroup Files
 * 
 * @apiParam {String} path 文件路径
 * 
 * @apiSuccess {File} file 文件流
 */
router.get('/download/:path', async (req, res) => {
    try {
        const path = req.params.path;
        const response = await dbx.filesDownload({ path: `/${path}` });
        
        // 设置响应头
        res.setHeader('Content-Disposition', `attachment; filename=${response.result.name}`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // 发送文件内容
        res.send(response.result.fileBinary);
    } catch (error) {
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '文件下载失败',
            error: error.message
        });
    }
});

/**
 * @api {post} /files/upload 上传文件
 * @apiDescription 上传文件到Dropbox
 * @apiName uploadFile
 * @apiGroup Files
 * 
 * @apiParam {File} file 要上传的文件
 * @apiParam {String} path 上传路径
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 上传成功的文件信息
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '未提供文件'
            });
        }

        const uploadPath = req.body.path || '';
        const fileName = req.file.originalname;
        const filePath = uploadPath ? `/${uploadPath}/${fileName}` : `/${fileName}`;
        
        // 使用文件的 buffer 数据
        const response = await dbx.filesUpload({
            path: filePath,
            contents: req.file.buffer,
            mode: 'overwrite'
        });
        
        res.status(200).json({
            success: true,
            message: '文件上传成功',
            data: response.result
        });
    } catch (error) {
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '文件上传失败',
            error: error.message
        });
    }
});

/**
 * @api {delete} /files/delete/:path 删除文件
 * @apiDescription 删除Dropbox中的文件
 * @apiName deleteFile
 * @apiGroup Files
 * 
 * @apiParam {String} path 文件路径
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {Object} data 删除的文件信息
 */
router.delete('/delete/:path', async (req, res) => {
    try {
        const path = req.params.path;
        const response = await dbx.filesDelete({ path: `/${path}` });
        
        res.status(200).json({
            success: true,
            message: '文件删除成功',
            data: response.result
        });
    } catch (error) {
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '文件删除失败',
            error: error.message
        });
    }
});

/**
 * @api {get} /files/templink/:path 获取文件临时链接
 * @apiDescription 获取Dropbox文件的临时直接下载链接
 * @apiName getTemporaryLink
 * @apiGroup Files
 * 
 * @apiParam {String} path 文件路径
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} link 临时下载链接
 * @apiSuccess {Object} metadata 文件元数据
 */
router.get('/templink/:path', async (req, res) => {
    try {
        const path = req.params.path;
        const response = await dbx.filesGetTemporaryLink({ path: `/${path}` });
        
        res.status(200).json({
            success: true,
            link: response.result.link,
            metadata: response.result.metadata
        });
    } catch (error) {
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '获取临时链接失败',
            error: error.message
        });
    }
});

/**
 * @api {get} /files/sharelink/:path 获取文件共享链接
 * @apiDescription 创建或获取Dropbox文件的永久共享链接
 * @apiName getSharedLink
 * @apiGroup Files
 * 
 * @apiParam {String} path 文件路径
 * 
 * @apiSuccess {Boolean} success 请求是否成功
 * @apiSuccess {String} url 共享链接
 * @apiSuccess {Object} metadata 共享链接元数据
 */
router.get('/sharelink/:path', async (req, res) => {
    try {
        const path = req.params.path;
        const response = await dbx.sharingCreateSharedLinkWithSettings({
            path: `/${path}`,
            settings: {
                requested_visibility: { '.tag': 'public' }
            }
        });
        
        res.status(200).json({
            success: true,
            url: response.result.url,
            metadata: response.result
        });
    } catch (error) {
        // 如果链接已存在，尝试获取现有链接
        if (error.status === 409 && error.error && error.error.error && error.error.error['.tag'] === 'shared_link_already_exists') {
            try {
                const listResponse = await dbx.sharingListSharedLinks({
                    path: `/${path}`,
                    direct_only: true
                });
                
                if (listResponse.result.links && listResponse.result.links.length > 0) {
                    return res.status(200).json({
                        success: true,
                        url: listResponse.result.links[0].url,
                        metadata: listResponse.result.links[0]
                    });
                }
            } catch (listError) {
                console.error('Dropbox API error when listing shared links:', listError);
            }
        }
        
        console.error('Dropbox API error:', error);
        res.status(500).json({
            success: false,
            message: '获取共享链接失败',
            error: error.message
        });
    }
});

module.exports = router;
