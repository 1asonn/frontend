import { GetMenuPublicKey } from '../api/index'

/**
 * 将PEM格式的公钥转换为CryptoKey对象
 * @param {string} pemKey - PEM格式的公钥
 * @returns {Promise<CryptoKey>}
 */
async function importPublicKey(pemKey) {
    // 移除PEM头尾和换行符
    const pemContents = pemKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '');
    
    // Base64解码为二进制
    const binaryDer = window.atob(pemContents);
    const derArray = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
        derArray[i] = binaryDer.charCodeAt(i);
    }

    // 导入为CryptoKey对象
    return window.crypto.subtle.importKey(
        'spki',
        derArray,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: { name: 'SHA-256' },
        },
        true,
        ['verify']
    );
}

/**
 * 将十六进制字符串转换为ArrayBuffer
 * @param {string} hexString - 十六进制字符串
 * @returns {ArrayBuffer}
 */
function hexToArrayBuffer(hexString) {
    const pairs = hexString.match(/[\da-f]{2}/gi);
    if (!pairs) {
        throw new Error('Invalid hex string');
    }
    const bytes = new Uint8Array(pairs.map(pair => parseInt(pair, 16)));
    return bytes.buffer;
}

/**
 * 验证签名
 * @param {Object} data - 要验证的数据包
 * @returns {Promise<boolean>} - 验证结果
 */
async function verifySignature(data) {
    try {
        // 获取公钥
        const publicKeyPem = await GetMenuPublicKey();
        const publicKey = await importPublicKey(publicKeyPem);

        let menuData, signature;

        if (data.data && data.metadata) {
            menuData = data.data;
            signature = data.metadata.signature;
            console.log(data,'data')
        } else {
            console.error('Invalid data format');
            return false;
        }
        console.log(menuData,'menuData')
        // 准备要验证的数据
        const jsonData = JSON.stringify(menuData);
        const dataBuffer = new TextEncoder().encode(jsonData);
        const signatureBuffer = hexToArrayBuffer(signature);

        // 验证签名
        const isValid = await window.crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            publicKey,
            signatureBuffer,
            dataBuffer
        );
        return isValid;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

export { verifySignature }