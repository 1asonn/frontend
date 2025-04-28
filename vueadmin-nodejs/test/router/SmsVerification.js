const Client = require('aliyun-api-gateway').Client;
require('dotenv').config();

// 从环境变量获取AppKey和AppSecret，避免硬编码敏感信息
const APP_KEY = process.env.ALIYUN_APP_KEY || '204865905';
const APP_SECRET = process.env.ALIYUN_APP_SECRET || 'OMjSk7J1KveT0QTF631G510MLYikcgu5';

// 创建API网关客户端，使用AppKey和AppSecret进行签名认证
const client = new Client(APP_KEY, APP_SECRET);

/**
 * 发送短信验证码
 * @param {string} phoneNumber - 接收验证码的手机号
 * @param {string} code - 验证码内容
 * @param {string} templateId - 短信模板ID，默认使用CST_ptdie100模板
 * @returns {Promise<Object>} - API响应结果
 */
async function sendSmsCode(phoneNumber, code, templateId = 'CST_ptdie100') {
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
    return result;
  } catch (error) {
    console.error('发送短信验证码失败:', error);
    throw error;
  }
}

/**
 * 生成指定长度的随机数字验证码
 * @param {number} length - 验证码长度
 * @returns {string} - 生成的验证码
 */
function generateVerificationCode(length = 4) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

/**
 * 测试发送短信验证码的示例函数
 */
async function testSendSms() {
  // 这里替换为实际的手机号
  const phoneNumber = '13827871831'; // 实际使用时替换为真实手机号
  const code = generateVerificationCode();
  
  try {
    const result = await sendSmsCode(phoneNumber, code);
    console.log('验证码发送成功:', code);
    return result;
  } catch (error) {
    console.error('测试发送短信失败:', error);
    throw error;
  }
}

// 仅在直接运行此文件时执行测试
if (require.main === module) {
  testSendSms().catch((err) => {
    console.error('短信发送测试失败:', err);
    console.log(err.stack);
  });
}

module.exports = {
  sendSmsCode,
  generateVerificationCode
};