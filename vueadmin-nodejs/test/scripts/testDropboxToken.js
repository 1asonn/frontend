/**
 * Dropbox OAuth2 Token 测试脚本
 * 
 * 此脚本用于测试 Dropbox OAuth2 token 接口，使用 authorization_code 流程
 * 获取 access_token 和 refresh_token
 * 
 * 使用方法:
 * 1. 先运行 getDropboxRefreshToken.js 获取授权 URL 并获取 code
 * 2. 运行此脚本: node testDropboxToken.js <authorization_code>
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 获取 Dropbox 应用凭据
const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

// 检查命令行参数
if (process.argv.length < 3) {
  console.log('请提供授权码 (authorization code)');
  console.log('用法: node testDropboxToken.js <authorization_code>');
  process.exit(1);
}

const authorizationCode = process.argv[2];

/**
 * 使用授权码获取 access_token 和 refresh_token
 */
async function getTokenWithAuthCode() {
  try {
    console.log('正在使用授权码获取 token...');
    console.log(`授权码: ${authorizationCode}`);
    
    // 检查应用凭据
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
      throw new Error('Dropbox App Key 或 App Secret 未设置。请检查 .env 文件');
    }
    
    // 构建请求参数
    const params = new URLSearchParams();
    params.append('code', authorizationCode);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', REDIRECT_URI);
    params.append('client_id', DROPBOX_APP_KEY);
    params.append('client_secret', DROPBOX_APP_SECRET);
    
    console.log('请求参数:');
    console.log(`- grant_type: authorization_code`);
    console.log(`- redirect_uri: ${REDIRECT_URI}`);
    console.log(`- client_id: ${DROPBOX_APP_KEY}`);
    console.log(`- client_secret: ${DROPBOX_APP_SECRET.substring(0, 4)}...`);
    
    // 发送请求
    console.log('发送请求到 https://api.dropboxapi.com/oauth2/token...');
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    // 解析响应
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
      console.log('\n是否要更新 .env 文件中的 token? (y/n)');
      process.stdin.once('data', (input) => {
        const answer = input.toString().trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
          updateEnvFile(data.access_token, data.refresh_token);
        } else {
          console.log('未更新 .env 文件');
        }
        
        process.exit(0);
      });
      
    } catch (parseError) {
      console.error('解析响应失败:');
      console.error(responseText);
      console.error(parseError);
    }
    
  } catch (error) {
    console.error('获取 token 过程中出错:', error);
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

// 执行主函数
getTokenWithAuthCode();
