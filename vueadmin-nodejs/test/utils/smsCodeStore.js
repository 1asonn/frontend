// 用于存储短信验证码的内存对象
const smsCodeStore = {
    // 存储格式: { phone: { code: '123456', expireTime: Date.now() + 5 * 60 * 1000 } }
    codes: {},
    
    /**
     * 生成指定长度的随机数字验证码
     * @param {number} length - 验证码长度，默认为4位
     * @returns {string} - 生成的验证码
     */
    generateCode(length = 4) {
        let code = '';
        for (let i = 0; i < length; i++) {
            code += Math.floor(Math.random() * 10);
        }
        return code;
    },
    
    // 保存验证码
    saveCode(phone, code, expireMinutes = 5) {
        this.codes[phone] = {
            code,
            expireTime: Date.now() + expireMinutes * 60 * 1000
        };
    },
    
    // 验证验证码
    verifyCode(phone, code) {
        const storedData = this.codes[phone];
        if (!storedData) {
            return { valid: false, message: '验证码不存在' };
        }
        
        if (Date.now() > storedData.expireTime) {
            delete this.codes[phone];
            return { valid: false, message: '验证码已过期' };
        }
        
        if (storedData.code !== code) {
            return { valid: false, message: '验证码不正确' };
        }
        
        // 验证成功后删除验证码
        delete this.codes[phone];
        return { valid: true, message: '验证成功' };
    },
    
    // 清理过期的验证码
    cleanup() {
        const now = Date.now();
        Object.keys(this.codes).forEach(phone => {
            if (now > this.codes[phone].expireTime) {
                delete this.codes[phone];
            }
        });
    }
};

// 定期清理过期的验证码
setInterval(() => {
    smsCodeStore.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次

module.exports = smsCodeStore; 