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
    accessToken: 'sl.u.AFoB9o6lr9oseyvYRhuCieMSiVtLe8ESTghkXgk2gEpgkeqyIh5VzK4_QJ_JoGrzzN5cEeah0xpst90hgR9xx0fu7yXS0aEX3SljJnUVF0YFtkAsUQC-rlkUQXgmOFED62QpCdw0NNNR7mBAjk-eT3T7ufnzZbO4WgcS_TvbDjmQEwIpPCcX3Bt_kbTdUtTqJc0hjjd_jxy17QpdJA8txmloxhlmcQhuy_qMvodouXIW7cqZaPCmi-DN2ua5BFyp4-DuXEE6kZeeL9sfMdmqYudJQlsjLxG1qyCT7oO6LOCRD3iDHlb4NEBGkN791leBvAJJQCXauMeZliWDfkH_hYMj7sI5oaIHgRJEUI0HPYCpysn5QJB_0pcyeZoOG-ci-lzDGfwuDE9e36uTt4JTkkH1zjVvsW1MsGock2ufiP9t-iR9_dseYrDruGCTkNd40ztr8AyOHc8myselquyreawkPOzzAUuY4j_r2lrRwj11USb5i-CrryP-dAk-iFHGTURf3VMLSM7-mW2L-ij3IPfAJwJ25mcaPT5cR6XDXlJjWC4LvGF6AXCt6aTLY2WVhP_cg0dnCw2bAjTjksdM6WnpuPQ7dAZAGOBQWIuJZhL_gx0LrDEVcCMnLDqUJMOq_VzkeZRT-uluzRec5IZwCVowTR-xxvFeUi-qyvRsuPCx516DYj1y3YE5w_eJqjptoFwq4Z4KUnNcgK-fBs5t197WaZodlikkEJkXL4X3nvNJx58iqHyWSClB2GWc9lzO2jTi5qtZlhnC413zNDAcxVlIpPgnXZknw9uqMqPFdEds37H6wQczyxJZ883suDcnHMKoV8vHSMQ2hNBpksh_3PqnlKNxSYeDr3Z6567z4ALptuOiRaPgjc-Y-inZCi-gtmVvvlgWukqPMz85w0qD17XpLMiLO5CvbOF9YENy8zAWpuCxhxCJYpPx6CZ03K3z-J0Vm4wQP51ROpls2nNv3XaSVFGf_p4y2O-85Zgi4mhfOazobOmoO92r6Q_wL-2Y-NPUFQXP78jTliaFbecynldI4GwUAWNre1WwA8vzLQQ6MOf8MV-v-G0HniHQCf7TlJg3KFHoq5qmIswOVNGUIYeIfkzm45HvqzDbf3Uq6NDB_7FtFB45GOEy4BTL9An3qy8VoR_X1aq8BRRbdyguv78mBTDjSUrvFr-gd85tibC8o3_InOA0c8RKuwZLOnbWEIqNy7oJMGGmobj474fdHw1qLUduszQyTLeOmym4UW9DJFjVXEFBd4QA-9sPUV6B4tstE0ub1osnSHzdqvCTBkk8H5KZAQpwrlM1aLrQqWKNC1vE-SgGddlcBg-be6BWLDAPsmWrHh6hVU3KaDD0i0XuKh7u2liOCu4ojyD9ClYJm9DCr2RC_6e2xEk6yh5ZVoOFGnhYyF9noYs3RpPnZRUgQ-nx5Hq0A_QKis-NAk5kzgOrZkISuzDlP_5RlfEL_oI' 
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
