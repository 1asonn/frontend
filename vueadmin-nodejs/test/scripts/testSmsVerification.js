/**
 * 短信验证码接口测试文件
 * 
 * 此文件用于测试短信验证码发送功能，包括：
 * 1. 单个验证码发送测试
 * 2. 批量验证码发送测试（用于压力测试）
 * 3. 验证码生成功能测试
 * 4. 错误处理测试
 */

require('dotenv').config();
const { sendSmsCode, generateVerificationCode } = require('../router/SmsVerification');
const readline = require('readline');

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 测试生成验证码功能
 */
function testGenerateCode() {
  console.log('\n===== 测试验证码生成 =====');
  
  // 测试不同长度的验证码生成
  const code4 = generateVerificationCode(4);
  const code6 = generateVerificationCode(6);
  const codeDefault = generateVerificationCode();
  
  console.log(`4位验证码: ${code4} (长度: ${code4.length})`);
  console.log(`6位验证码: ${code6} (长度: ${code6.length})`);
  console.log(`默认验证码: ${codeDefault} (长度: ${codeDefault.length})`);
  
  // 验证结果
  console.log(`\n验证结果: ${code4.length === 4 && code6.length === 6 ? '通过' : '失败'}`);
  
  return { code4, code6, codeDefault };
}

/**
 * 测试发送单个验证码
 * @param {string} phoneNumber - 接收验证码的手机号
 */
async function testSendSingleSms(phoneNumber) {
  console.log('\n===== 测试发送单个验证码 =====');
  console.log(`目标手机号: ${phoneNumber}`);
  
  try {
    const code = generateVerificationCode(4);
    console.log(`生成的验证码: ${code}`);
    
    console.log('正在发送短信...');
    const startTime = Date.now();
    const result = await sendSmsCode(phoneNumber, code);
    const endTime = Date.now();
    
    console.log(`发送结果: ${JSON.stringify(result)}`);
    console.log(`请求耗时: ${endTime - startTime}ms`);
    
    return { success: true, result, code };
  } catch (error) {
    console.error('发送失败:', error);
    return { success: false, error };
  }
}

/**
 * 测试批量发送验证码（压力测试）
 * @param {string} phoneNumber - 接收验证码的手机号
 * @param {number} count - 发送次数
 * @param {number} interval - 发送间隔(毫秒)
 */
async function testBatchSendSms(phoneNumber, count = 3, interval = 1000) {
  console.log(`\n===== 测试批量发送验证码 (${count}条) =====`);
  console.log(`目标手机号: ${phoneNumber}`);
  console.log(`发送间隔: ${interval}ms`);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    try {
      const code = generateVerificationCode(4);
      console.log(`[${i+1}/${count}] 正在发送验证码: ${code}`);
      
      const result = await sendSmsCode(phoneNumber, code);
      results.push({ success: true, code, result });
      console.log(`[${i+1}/${count}] 发送成功`);
      
      // 如果不是最后一条，则等待指定间隔
      if (i < count - 1) {
        console.log(`等待 ${interval}ms 后发送下一条...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`[${i+1}/${count}] 发送失败:`, error);
      results.push({ success: false, error });
      
      // 如果遇到错误，可能是接口限流，增加等待时间
      await new Promise(resolve => setTimeout(resolve, interval * 2));
    }
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const successCount = results.filter(r => r.success).length;
  
  console.log('\n===== 批量发送结果 =====');
  console.log(`总发送数量: ${count}`);
  console.log(`成功数量: ${successCount}`);
  console.log(`失败数量: ${count - successCount}`);
  console.log(`总耗时: ${totalTime}ms`);
  console.log(`平均每条耗时: ${Math.round(totalTime / count)}ms`);
  
  return { results, totalTime, successCount };
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('\n===== 测试错误处理 =====');
  
  // 测试1: 空手机号
  console.log('测试1: 空手机号');
  try {
    await sendSmsCode('', '1234');
    console.log('测试失败: 应该抛出错误但没有');
  } catch (error) {
    console.log('测试通过: 正确捕获到错误 -', error.message);
  }
  
  // 测试2: 空验证码
  console.log('\n测试2: 空验证码');
  try {
    await sendSmsCode('13800138000', '');
    console.log('测试失败: 应该抛出错误但没有');
  } catch (error) {
    console.log('测试通过: 正确捕获到错误 -', error.message);
  }
  
  // 测试3: 无效手机号格式
  console.log('\n测试3: 无效手机号格式');
  try {
    await sendSmsCode('123', '1234');
    console.log('注意: API可能没有验证手机号格式');
  } catch (error) {
    console.log('API验证了手机号格式:', error.message);
  }
  
  return true;
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('===== 短信验证码接口测试 =====');
  console.log('当前时间:', new Date().toLocaleString());
  
  // 首先测试验证码生成功能
  testGenerateCode();
  
  // 询问用户是否要进行发送测试
  rl.question('\n是否要进行短信发送测试? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.question('请输入测试用手机号: ', async (phoneNumber) => {
        // 测试单个发送
        await testSendSingleSms(phoneNumber);
        
        // 询问是否进行批量测试
        rl.question('\n是否要进行批量发送测试? (y/n): ', async (batchAnswer) => {
          if (batchAnswer.toLowerCase() === 'y') {
            rl.question('请输入发送次数 (默认3次): ', async (countStr) => {
              const count = parseInt(countStr) || 3;
              await testBatchSendSms(phoneNumber, count);
              
              // 最后测试错误处理
              await testErrorHandling();
              rl.close();
            });
          } else {
            // 只测试错误处理
            await testErrorHandling();
            rl.close();
          }
        });
      });
    } else {
      // 只测试错误处理
      await testErrorHandling();
      rl.close();
    }
  });
}

// 检查环境变量
if (!process.env.ALIYUN_APP_KEY || !process.env.ALIYUN_APP_SECRET) {
  console.warn('警告: 环境变量 ALIYUN_APP_KEY 或 ALIYUN_APP_SECRET 未设置，请确保在 .env 文件中设置了这些变量');
  console.warn('如果未设置，将使用默认值，可能导致API调用失败');
}

// 运行测试
runTests();
