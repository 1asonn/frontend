
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
    const bytes = new Uint8Array(pairs.map(pair => parseInt(pair, 16)));
    console.log(bytes,'bytes')
    return bytes.buffer;
}

/**
 * 验证签名
 * @param {Object} signedPackage - 签名包
 * @returns {Promise<boolean>} - 验证结果
 */
async function verifySignature(signedPackage) {
    try {
        // 1. 获取公钥
        const publicKeyPem = await GetMenuPublicKey();
        const publicKey = await importPublicKey(publicKeyPem);

        // 2. 解析签名包
        const { data, metadata } = signedPackage;
        const { signature, timestamp } = metadata;

        // 3. 验证时间戳
        const validityPeriod = 5 * 60 * 1000; // 5分钟
        if (Date.now() - timestamp > validityPeriod) {
            console.error('Signature has expired');
            return false;
        }
        const errordata =  [
            {
                name: 'PatientManager',
                title: '患者信息管理',
                icon: 'el-icon-s-custom',
                path: '/patient',
                component: 'patient/Patient',
                children: [
                    {
                        name: 'SysPatient',
                        title: '用户管理',
                        icon: 'el-icon-s-custom',
                        path: '/sys/patient',
                        component: 'sys/Patient',
                        children: []
                    },
                ]
            },
            {
                name: 'HospitalizationManager',
                title: '住院管理',
                icon: 'el-icon-s-home',
                path: '/hospitalization',
                component: 'hospitalization/Hospitalization',
                children: []
            },
            {
                name: 'MedicineManager',
                title: '药品管理',
                icon: 'el-icon-s-goods',
                path: '/medicine',
                component: 'medicine/Medicine',
                children: []
            },
            {
                name: 'EquipmentManager',
                title: '医疗设备管理',
                icon: 'el-icon-s-tools',
                path: '/equipment',
                component: 'equipment/Equipment',
                children: [
                    {
                        name: 'SysEquipment',
                        title: '设备列表',
                        icon: 'el-icon-s-custom',
                        path: '/sys/equipments',
                        component: 'sys/Equipment',
                        children: []
                    }
                ]
            },
            {
                name: 'HRManager',
                title: '人力资源管理',
                icon: 'el-icon-s-custom',
                path: '/hr',
                component: 'hr/HR',
                children: [
                    {
                        name: 'SysUser',
                        title: '用户列表',
                        icon: 'el-icon-s-custom',
                        path: '/sys/user',
                        component: 'sys/User',
                        children: []
                    },
                    {
                        name: 'SysRole',
                        title: '角色管理',
                        icon: 'el-icon-s-custom',
                        path:'/sys/role',
                        component: 'sys/Role',
                        children: []
                    }
                ]
            },
            {
                name: 'FinanceManager',
                title: '财务管理',
                icon: 'el-icon-s-finance',
                path: '/finance',
                component: 'finance/Finance',
                children: []
            },
            {
                name: 'DataManager',
                title: '数据统计与分析',
                icon: 'el-icon-s-data',
                path: '/data',
                component: 'data/Data',
                children: []
            },
            {
                name: 'AiManager',
                title: '智慧管理',
                icon: 'el-icon-s-data',
                path: '/ai',
                component: 'ai/Ai',
                children: []
            }
        ];
        // 4. 准备要验证的数据
        const jsonData = JSON.stringify(errordata);
        const dataBuffer = new TextEncoder().encode(jsonData);
        const signatureBuffer = hexToArrayBuffer(signature);

        // 5. 验证签名
        const isValid = await window.crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            publicKey,
            signatureBuffer,
            dataBuffer
        );
        console.log(isValid,'isValid')
        return isValid;
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

export { verifySignature }