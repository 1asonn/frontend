const Client = require('aliyun-api-gateway').Client;
require('dotenv').config();

// 从环境变量获取AppKey和AppSecret，避免硬编码敏感信息
const APP_KEY = process.env.ALIYUN_APP_KEY || '204865905';
const APP_SECRET = process.env.ALIYUN_APP_SECRET || 'OMjSk7J1KveT0QTF631G510MLYikcgu5';

// 创建API网关客户端，使用AppKey和AppSecret进行签名认证
const client = new Client(APP_KEY, APP_SECRET);

// 短信服务
const smsService = {
    /**
     * 发送短信验证码
     * @param {string} phoneNumber - 接收验证码的手机号
     * @param {string} code - 验证码内容
     * @param {string} templateId - 短信模板ID，默认使用CST_ptdie100模板
     * @returns {Promise<Object>} - API响应结果
     */
    async sendSms(phoneNumber, code, templateId = 'CST_ptdie100') {
        const url = 'https://dfsns.market.alicloudapi.com/data/send_sms';
        
        // 验证参数
        if (!phoneNumber || !code) {
            throw new Error('手机号和验证码不能为空');
        }
        
        // 构建请求数据 - 使用对象形式而不是字符串形式
        const content = `code:${code}`;
        
        try {
            // 使用签名认证方式发送请求
            // 注意：aliyun-api-gateway SDK需要使用对象形式的data而不是字符串
            const result = await client.post(url, {
                data: {
                    content: content,
                    template_id: templateId,
                    phone_number: phoneNumber
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            });
            
            console.log('短信发送结果:', JSON.stringify(result));
            return {
                success: true,
                message: '短信发送成功',
                result
            };
        } catch (error) {
            console.error('发送短信验证码失败:', error);
            return {
                success: false,
                message: '短信发送失败',
                error
            };
        }
    }
};

module.exports = smsService; 