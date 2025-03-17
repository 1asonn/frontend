const crypto = require('crypto');

// 生成RSA密钥对
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

/**
 * 对数据进行签名
 * @param {Object} data - 要签名的数据
 * @returns {Object} - 原始数据和签名
 */
function signData(data) {
    try {
        // 将数据转换为JSON字符串
        const jsonData = JSON.stringify(data);
        
        // 创建签名对象
        const sign = crypto.createSign('SHA256');
        
        // 更新要签名的数据
        sign.update(jsonData);
        
        // 使用私钥生成签名
        const signature = sign.sign(privateKey, 'hex');
        
        // 添加时间戳，防止重放攻击
        const timestamp = Date.now();
        
        return {
            data,
            metadata: {
                signature,
                timestamp,
                algorithm: 'SHA256withRSA'
            }
        };
    } catch (error) {
        console.error('Signing error:', error);
        throw new Error('Data signing failed');
    }
}

/**
 * 验证数据签名
 * @param {Object} signedPackage - 包含数据和签名的包
 * @returns {boolean} - 签名是否有效
 */
function verifySignature(signedPackage) {
    try {
        const { data, metadata } = signedPackage;
        const { signature, timestamp, algorithm } = metadata;
        
        // 检查时间戳是否在有效期内（例如：5分钟）
        const validityPeriod = 5 * 60 * 1000; // 5分钟
        if (Date.now() - timestamp > validityPeriod) {
            throw new Error('Signature has expired');
        }

        // 将数据转换为JSON字符串
        const jsonData = JSON.stringify(data);
        
        // 创建验证对象
        const verify = crypto.createVerify('SHA256');
        
        // 更新要验证的数据
        verify.update(jsonData);
        
        // 使用公钥验证签名
        return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

/**
 * 获取公钥
 * @returns {string} - PEM格式的公钥
 */
function getPublicKey() {
    return publicKey;
}

module.exports = {
    signData,
    verifySignature,
    getPublicKey
};
