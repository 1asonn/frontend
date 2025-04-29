/**
 * JWT Token 解析工具
 */

/**
 * 解析JWT Token
 * @param {string} token - JWT token字符串
 * @returns {Object} 解析后的payload对象
 */
export function parseJwt(token) {
  try {
    // 检查token是否存在
    if (!token) {
      console.error('Token is empty');
      return null;
    }
    
    // 分割token (格式: header.payload.signature)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid token format');
      return null;
    }
    
    // 将base64转为普通字符串
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    // 解析JSON
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * 从localStorage中获取当前用户信息
 * @returns {Object|null} 用户信息对象或null
 */
export function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    return parseJwt(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * 从localStorage中获取当前用户ID
 * @returns {string|null} 用户ID或null
 */
export function getCurrentUserId() {
  const user = getCurrentUser();
  return user ? user.id || user.userId || user.user_id : null;
}
