const fetch = require('node-fetch');
const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');

// 环境变量文件路径
const ENV_FILE_PATH = path.join(__dirname, '../.env');

// Dropbox API credentials
const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;

// Initial access token (will be updated through refresh)
let currentAccessToken = process.env.DROPBOX_ACCESS_TOKEN || '';
let tokenExpirationTime = 0; // Timestamp when the token expires

/**
 * 使用授权码获取初始的 refresh token 和 access token
 * @param {string} authorizationCode - 从 Dropbox 授权页面获取的授权码
 * @param {string} redirectUri - 应用的重定向 URI
 * @returns {Promise<Object>} 包含 refresh_token 和 access_token 的对象
 */
async function getInitialTokens(authorizationCode, redirectUri) {
  try {
    console.log('正在使用授权码获取 tokens...');
    
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: authorizationCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`获取 tokens 失败: ${JSON.stringify(errorData)}`);
    }
    
    const tokenData = await response.json();
    
    // 更新内存中的 token 信息
    currentAccessToken = tokenData.access_token;
    tokenExpirationTime = Date.now() + (tokenData.expires_in * 1000);
    
    // 更新环境变量文件
    updateEnvFile({
      DROPBOX_ACCESS_TOKEN: tokenData.access_token,
      DROPBOX_REFRESH_TOKEN: tokenData.refresh_token
    });
    
    console.log('成功获取 tokens 并更新环境变量');
    return tokenData;
  } catch (error) {
    console.error('获取初始 tokens 失败:', error);
    throw error;
  }
}

/**
 * 更新环境变量文件
 * @param {Object} variables - 要更新的环境变量对象
 */
function updateEnvFile(variables) {
  try {
    let envContent = '';
    
    // 读取现有 .env 文件内容
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    }
    
    // 更新环境变量
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        // 更新现有变量
        envContent = envContent.replace(regex, `${key}=${variables[key]}`);
      } else {
        // 添加新变量
        envContent += `\n${key}=${variables[key]}`;
      }
    });
    
    // 写入更新后的 .env 文件
    fs.writeFileSync(ENV_FILE_PATH, envContent.trim());
    console.log('已更新 .env 文件');
  } catch (error) {
    console.error('更新 .env 文件失败:', error);
  }
}

/**
 * Refresh the Dropbox access token using the refresh token
 * @returns {Promise<string>} The new access token
 */
async function refreshAccessToken() {
  try {
    // 检查是否有 refresh token
    if (!DROPBOX_REFRESH_TOKEN) {
      throw new Error('Refresh token is empty. Please obtain a refresh token first.');
    }
    
    console.log('Refreshing Dropbox access token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', DROPBOX_REFRESH_TOKEN);
    params.append('client_id', DROPBOX_APP_KEY);
    params.append('client_secret', DROPBOX_APP_SECRET);
    
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh token: ${errorData.error_description || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    // Update the current access token and expiration time
    currentAccessToken = data.access_token;
    // Set expiration time (convert seconds to milliseconds)
    tokenExpirationTime = Date.now() + (data.expires_in * 1000);
    
    console.log('Access token refreshed successfully');
    return currentAccessToken;
  } catch (error) {
    console.error('Error refreshing Dropbox access token:', error);
    throw error;
  }
}

/**
 * 直接使用应用凭据获取 access token
 * @returns {Promise<string>} 获取到的 access token
 */
async function getDirectAccessToken() {
  try {
    console.log('正在使用应用凭据获取 access token...');
    
    // 检查应用凭据
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
      throw new Error('Dropbox App Key 或 App Secret 未设置。');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', DROPBOX_APP_KEY);
    params.append('client_secret', DROPBOX_APP_SECRET);
    
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`获取 access token 失败: ${errorData.error_description || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    // 更新内存中的 token 信息
    currentAccessToken = data.access_token;
    // 设置过期时间（如果有）
    if (data.expires_in) {
      tokenExpirationTime = Date.now() + (data.expires_in * 1000);
    } else {
      // 如果没有过期时间，设置一个默认值（例如 1 小时）
      tokenExpirationTime = Date.now() + (3600 * 1000);
    }
    
    console.log('Access token 获取成功');
    return currentAccessToken;
  } catch (error) {
    console.error('获取 access token 失败:', error);
    throw error;
  }
}

/**
 * Get a valid Dropbox access token, refreshing if necessary
 * @returns {Promise<string>} A valid access token
 */
async function getAccessToken() {
  // 如果有 refresh token，优先使用 refresh token
  if (DROPBOX_REFRESH_TOKEN) {
    // If token is expired or about to expire in the next 5 minutes, refresh it
    const fiveMinutesInMs = 5 * 60 * 1000;
    if (!currentAccessToken || Date.now() + fiveMinutesInMs >= tokenExpirationTime) {
      return await refreshAccessToken();
    }
    return currentAccessToken;
  } else {
    // 如果没有 refresh token，尝试直接获取 access token
    return await getDirectAccessToken();
  }
}

/**
 * Create a Dropbox client with auto-refreshing token
 * @returns {Dropbox} A configured Dropbox client
 */
function createDropboxClient() {
  return new Dropbox({
    accessToken: currentAccessToken,
    clientId: DROPBOX_APP_KEY,
    clientSecret: DROPBOX_APP_SECRET,
    refreshToken: DROPBOX_REFRESH_TOKEN,
    accessTokenExpiresAt: new Date(tokenExpirationTime)
  });
}

/**
 * Get a Dropbox client with a valid token
 * @returns {Promise<Dropbox>} A Dropbox client with a valid token
 */
async function getDropboxClient() {
  // Ensure we have a valid token
  await getAccessToken();
  
  // Create and return a new client with the current token
  return createDropboxClient();
}

/**
 * 生成 Dropbox 授权 URL
 * @param {string} redirectUri - 应用的重定向 URI
 * @returns {string} 授权 URL
 */
function getAuthorizationUrl(redirectUri) {
  return `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=code&redirect_uri=${redirectUri}&token_access_type=offline`;
}

/**
 * 初始化 Dropbox 授权
 * 这个函数展示了如何获取授权 URL 和处理回调
 */
function initializeDropboxAuth() {
  // 1. 生成授权 URL
  const redirectUri = 'YOUR_REDIRECT_URI'; // 例如 http://localhost:4000/auth/dropbox/callback
  const authUrl = getAuthorizationUrl(redirectUri);
  
  console.log('\n\n=== Dropbox 授权流程 ===');
  console.log(`1. 将以下 URL 复制到浏览器中访问:`);
  console.log(authUrl);
  console.log('2. 完成授权后，你将被重定向到你的回调 URL，并带有授权码参数');
  console.log('3. 从 URL 中提取授权码，然后调用:');
  console.log(`   getInitialTokens('YOUR_AUTHORIZATION_CODE', '${redirectUri}')\n\n`);
  
  // 示例: 如何处理回调和获取 tokens
  // 在实际应用中，这将在路由处理程序中实现
  /*
  // Express 路由示例
  app.get('/auth/dropbox/callback', async (req, res) => {
    const { code } = req.query;
    if (code) {
      try {
        // 获取 tokens 并保存到环境变量
        await getInitialTokens(code, redirectUri);
        res.send('授权成功！');
      } catch (error) {
        res.status(500).send(`授权失败: ${error.message}`);
      }
    } else {
      res.status(400).send('未提供授权码');
    }
  });
  */
}

module.exports = {
  getAccessToken,
  refreshAccessToken,
  getDropboxClient,
  getInitialTokens,
  getAuthorizationUrl,
  initializeDropboxAuth,
  updateEnvFile
};
