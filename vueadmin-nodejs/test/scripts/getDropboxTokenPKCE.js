/**
 * Dropbox OAuth2 PKCE 授权流程脚本
 * 
 * 此脚本使用 PKCE (Proof Key for Code Exchange) 流程获取 Dropbox 授权码
 * PKCE 是一种更安全的授权流程，特别适合客户端应用
 * 
 * 使用方法:
 * 1. 运行此脚本: node getDropboxTokenPKCE.js
 * 2. 在浏览器中打开生成的授权 URL
 * 3. 授权后，将获得的 code 复制到控制台
 * 4. 脚本将使用 code 和 code_verifier 获取 access_token 和 refresh_token
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 获取 Dropbox 应用凭据
const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

// 检查应用凭据
if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
  console.error('错误: Dropbox App Key 或 App Secret 未设置。请检查 .env 文件');
  process.exit(1);
}

/**
 * 生成随机字符串作为 code_verifier
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * 从 code_verifier 生成 code_challenge
 * @param {string} verifier - code_verifier
 * @returns {string} code_challenge
 */
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 生成授权 URL
 * @param {string} codeChallenge - code_challenge
 * @returns {string} 授权 URL
 */
function getAuthorizationUrl(codeChallenge) {
  const params = new URLSearchParams({
    client_id: DROPBOX_APP_KEY,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    token_access_type: 'offline' // 请求 refresh_token
  });
  
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

/**
 * 使用授权码获取 token
 * @param {string} code - 授权码
 * @param {string} codeVerifier - code_verifier
 */
async function getTokenWithCode(code, codeVerifier) {
  try {
    console.log('正在使用授权码和 code_verifier 获取 token...');
    
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', REDIRECT_URI);
    params.append('client_id', DROPBOX_APP_KEY);
    params.append('client_secret', DROPBOX_APP_SECRET);
    params.append('code_verifier', codeVerifier);
    
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const responseText = await response.text();
    console.log(`响应状态: ${response.status} ${response.statusText}`);
    
    try {
      const data = JSON.parse(responseText);
      
      if (!response.ok) {
        console.error('获取 token 失败:');
        console.error(data);
        return;
      }
      
      console.log('获取 token 成功!');
      console.log('响应数据:');
      console.log(`- access_token: ${data.access_token.substring(0, 10)}...`);
      console.log(`- token_type: ${data.token_type}`);
      console.log(`- expires_in: ${data.expires_in} 秒`);
      
      if (data.refresh_token) {
        console.log(`- refresh_token: ${data.refresh_token.substring(0, 10)}...`);
      } else {
        console.log('- refresh_token: 未返回');
      }
      
      // 询问是否更新 .env 文件
      rl.question('\n是否要更新 .env 文件中的 token? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          updateEnvFile(data.access_token, data.refresh_token);
        } else {
          console.log('未更新 .env 文件');
        }
        
        rl.close();
      });
      
    } catch (parseError) {
      console.error('解析响应失败:');
      console.error(responseText);
      console.error(parseError);
      rl.close();
    }
    
  } catch (error) {
    console.error('获取 token 过程中出错:', error);
    rl.close();
  }
}

/**
 * 更新 .env 文件中的 token
 */
function updateEnvFile(accessToken, refreshToken) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 更新 access_token
    if (envContent.includes('DROPBOX_ACCESS_TOKEN=')) {
      envContent = envContent.replace(
        /DROPBOX_ACCESS_TOKEN=.*/,
        `DROPBOX_ACCESS_TOKEN=${accessToken}`
      );
    } else {
      envContent += `\nDROPBOX_ACCESS_TOKEN=${accessToken}`;
    }
    
    // 更新 refresh_token (如果有)
    if (refreshToken) {
      if (envContent.includes('DROPBOX_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /DROPBOX_REFRESH_TOKEN=.*/,
          `DROPBOX_REFRESH_TOKEN=${refreshToken}`
        );
      } else {
        envContent += `\nDROPBOX_REFRESH_TOKEN=${refreshToken}`;
      }
    }
    
    // 写入文件
    fs.writeFileSync(envPath, envContent);
    console.log('.env 文件已更新');
    
  } catch (error) {
    console.error('更新 .env 文件失败:', error);
  }
}

// 主函数
async function main() {
  // 生成 code_verifier (长度在 43-128 之间)
  const codeVerifier = generateRandomString(64);
  console.log(`生成的 code_verifier: ${codeVerifier}`);
  
  // 生成 code_challenge
  const codeChallenge = generateCodeChallenge(codeVerifier);
  console.log(`生成的 code_challenge: ${codeChallenge}`);
  
  // 获取授权 URL
  const authUrl = getAuthorizationUrl(codeChallenge);
  console.log('\n请在浏览器中打开以下 URL 进行授权:');
  console.log(authUrl);
  
  // 等待用户输入授权码
  rl.question('\n授权后，请输入获得的授权码 (code): ', (code) => {
    if (!code) {
      console.error('错误: 未提供授权码');
      rl.close();
      return;
    }
    
    // 使用授权码和 code_verifier 获取 token
    getTokenWithCode(code, codeVerifier);
  });
}

// 执行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
  rl.close();
});
