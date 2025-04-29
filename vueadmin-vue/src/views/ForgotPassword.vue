<template>
    <el-dialog
        title="找回密码"
        :visible.sync="dialogVisible"
        width="35%"
        :before-close="handleClose"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        class="forgot-password-dialog"
    >
        <!-- 步骤条 -->
        <el-steps :active="activeStep" finish-status="success" align-center>
            <el-step title="验证身份" icon="el-icon-user"></el-step>
            <el-step title="验证手机" icon="el-icon-mobile-phone"></el-step>
            <el-step title="重置密码" icon="el-icon-lock"></el-step>
        </el-steps>

        <!-- 第一步：输入用户名 -->
        <div v-if="activeStep === 0" class="step-content">
            <div class="step-title">请输入您的用户名以验证身份</div>
            <el-form :model="form" :rules="rules" ref="usernameForm">
                <el-form-item prop="username">
                    <el-input 
                        v-model="form.username" 
                        placeholder="请输入用户名"
                        prefix-icon="el-icon-user"
                        clearable
                        @keyup.enter.native="verifyUsername"
                    >
                    </el-input>
                </el-form-item>
            </el-form>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="verifyUsername" :loading="loading.username">下一步</el-button>
            </div>
        </div>

        <!-- 第二步：手机验证 -->
        <div v-if="activeStep === 1" class="step-content">
            <div class="phone-info">
                <i class="el-icon-mobile-phone"></i>
                <p>验证手机号码：<span class="highlight-text">{{ maskPhone }}</span></p>
                <p class="sub-text">我们将向该手机号发送验证码</p>
            </div>
            <el-form :model="form" :rules="rules" ref="verifyForm">
                <el-form-item prop="verifyCode">
                    <el-input 
                        v-model="form.verifyCode" 
                        placeholder="请输入验证码"
                        prefix-icon="el-icon-key"
                        maxlength="6"
                        @keyup.enter.native="handleVerifyCode"
                    >
                        <el-button 
                            slot="append" 
                            @click="sendVerifyCode" 
                            :disabled="countdown > 0"
                            :loading="loading.sendCode"
                            type="primary"
                        >
                            {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
                        </el-button>
                    </el-input>
                </el-form-item>
            </el-form>
            <div class="dialog-footer">
                <el-button @click="activeStep--">上一步</el-button>
                <el-button type="primary" @click="handleVerifyCode" :loading="loading.verifyCode">下一步</el-button>
            </div>
        </div>

        <!-- 第三步：重置密码 -->
        <div v-if="activeStep === 2" class="step-content">
            <div class="step-title">请设置您的新密码</div>
            <el-form :model="form" :rules="rules" ref="passwordForm">
                <el-form-item prop="newPassword">
                    <el-input 
                        v-model="form.newPassword" 
                        :type="passwordVisible ? 'text' : 'password'" 
                        placeholder="请输入新密码"
                        prefix-icon="el-icon-lock"
                        @keyup="checkPasswordStrength"
                    >
                        <i 
                            slot="suffix" 
                            :class="[passwordVisible ? 'el-icon-view' : 'el-icon-hide']"
                            @click="passwordVisible = !passwordVisible"
                            class="password-eye"
                        ></i>
                    </el-input>
                    <!-- 密码强度指示器 -->
                    <div class="password-strength" v-if="form.newPassword">
                        <div class="strength-text">密码强度: <span :class="strengthClass">{{ strengthText }}</span></div>
                        <div class="strength-bar">
                            <div 
                                class="strength-level" 
                                :class="strengthClass"
                                :style="{width: strengthPercentage + '%'}"
                            ></div>
                        </div>
                        <div class="password-tips">提示：密码至少包含6个字符，建议使用字母、数字和特殊字符的组合</div>
                    </div>
                </el-form-item>
                <el-form-item prop="confirmPassword">
                    <el-input 
                        v-model="form.confirmPassword" 
                        :type="confirmPasswordVisible ? 'text' : 'password'" 
                        placeholder="请确认新密码"
                        prefix-icon="el-icon-lock"
                        @keyup.enter.native="resetPassword"
                    >
                        <i 
                            slot="suffix" 
                            :class="[confirmPasswordVisible ? 'el-icon-view' : 'el-icon-hide']"
                            @click="confirmPasswordVisible = !confirmPasswordVisible"
                            class="password-eye"
                        ></i>
                    </el-input>
                </el-form-item>
            </el-form>
            <div class="dialog-footer">
                <el-button @click="activeStep--">上一步</el-button>
                <el-button type="primary" @click="resetPassword" :loading="loading.resetPassword">确认重置</el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script>
import { md5 } from 'js-md5'
import { sendVerifyCode, GetPhoneNumber, VerifyCode, ResetPasswordBySms } from '@/api/index.js'

export default {
    data() {
        // 密码确认验证
        const validateConfirmPassword = (rule, value, callback) => {
            if (value !== this.form.newPassword) {
                callback(new Error('两次输入的密码不一致'))
            } else {
                callback()
            }
        }
        
        return {
            resetToken:'',
            dialogVisible: false,
            activeStep: 0,
            form: {
                username: '',
                phone: '',
                verifyCode: '',
                newPassword: '',
                confirmPassword: ''
            },
            rules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                verifyCode: [
                    { required: true, message: '请输入验证码', trigger: 'blur' },
                ],
                newPassword: [
                    { required: true, message: '请输入新密码', trigger: 'blur' },
                    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
                ],
                confirmPassword: [
                    { required: true, message: '请确认新密码', trigger: 'blur' },
                    { validator: validateConfirmPassword, trigger: 'blur' }
                ]
            },
            countdown: 0,
            verifyCode: '0277', // 与登录页面保持一致
            passwordVisible: false,
            confirmPasswordVisible: false,
            passwordStrength: 0, // 0-弱 1-中 2-强
            loading: {
                username: false,
                sendCode: false,
                verifyCode: false,
                resetPassword: false
            }
        }
    },
    computed: {
        maskPhone() {
            if (!this.form.phone) return ''
            return this.form.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        },
        strengthText() {
            const strength = this.passwordStrength
            return strength === 0 ? '弱' : strength === 1 ? '中' : '强'
        },
        strengthClass() {
            const strength = this.passwordStrength
            return strength === 0 ? 'weak' : strength === 1 ? 'medium' : 'strong'
        },
        strengthPercentage() {
            const strength = this.passwordStrength
            return strength === 0 ? 33 : strength === 1 ? 66 : 100
        }
    },
    methods: {
        show() {
            this.dialogVisible = true
            this.resetForm()
        },
        handleClose() {
            this.dialogVisible = false
            this.resetToken = ''
            this.resetForm()
        },
        resetForm() {
            this.activeStep = 0
            this.form = {
                username: '',
                phone: '',
                verifyCode: '',
                newPassword: '',
                confirmPassword: ''
            }
            this.countdown = 0
            if (this.$refs.usernameForm) this.$refs.usernameForm.resetFields()
            if (this.$refs.verifyForm) this.$refs.verifyForm.resetFields()
            if (this.$refs.passwordForm) this.$refs.passwordForm.resetFields()
        },
        // 检查密码强度
        checkPasswordStrength() {
            const password = this.form.newPassword
            if (!password) {
                this.passwordStrength = 0
                return
            }
            
            let score = 0
            
            // 长度检查
            if (password.length >= 8) score += 1
            if (password.length >= 10) score += 1
            
            // 复杂度检查
            if (/[A-Z]/.test(password)) score += 1
            if (/[a-z]/.test(password)) score += 1
            if (/[0-9]/.test(password)) score += 1
            if (/[^A-Za-z0-9]/.test(password)) score += 2
            
            // 设置强度等级
            if (score >= 6) {
                this.passwordStrength = 2 // 强
            } else if (score >= 3) {
                this.passwordStrength = 1 // 中
            } else {
                this.passwordStrength = 0 // 弱
            }
        },
        
        async verifyUsername() {
            try {
                await this.$refs.usernameForm.validate()
                this.loading.username = true
                const response = await GetPhoneNumber(this.form.username)
                this.form.phone = response.data
                this.activeStep++
            } catch (error) {
                if (error.response) {
                    this.$notify({
                        title: '错误',
                        message: error.response.data.message || '用户名验证失败',
                        type: 'error'
                    })
                }
            } finally {
                this.loading.username = false
            }
        },

        // 发送验证码
        async sendVerifyCode() {
            try {
                this.loading.sendCode = true
                const response = await sendVerifyCode({username:this.form.username})
                this.$notify({
                    title: '成功',
                    message: '验证码已发送到您的手机',
                    type: 'success'
                })
                
                this.countdown = 60
                const timer = setInterval(() => {
                    this.countdown--
                    if (this.countdown <= 0) {
                        clearInterval(timer)
                    }
                }, 1000)
            } catch (error) {
                this.$notify({
                    title: '错误',
                    message: error.response?.data?.message || '验证码发送失败',
                    type: 'error'
                })
            } finally {
                this.loading.sendCode = false
            }
        },

        // 验证码校验
        async handleVerifyCode() {
            try {
                await this.$refs.verifyForm.validate()
                this.loading.verifyCode = true
                const response = await VerifyCode({
                    username: this.form.username,
                    code: this.form.verifyCode
                })
                if(response.success){
                    // 密码重置令牌
                    this.resetToken = response.data.resetToken 
                    this.activeStep++
                }
                
            } catch (error) {
                if (error.response) {
                    this.$notify({
                        title: '错误',
                        message: error.response.data.message || '验证码验证失败',
                        type: 'error'
                    })
                }
            } finally {
                this.loading.verifyCode = false
            }
        },

        // 重置密码
        async resetPassword() {
            try {
                await this.$refs.passwordForm.validate()
                this.loading.resetPassword = true
                // 添加MD5密码加密
                const encryptedPassword = md5(this.form.newPassword, '0277')
                const response = await ResetPasswordBySms({
                    username: this.form.username,
                    resetToken: this.resetToken,
                    newPassword: encryptedPassword
                })
                this.$notify({
                    title: '成功',
                    message: '密码重置成功，请使用新密码登录',
                    type: 'success',
                    duration: 3000
                })

                // 延迟关闭对话框，让用户看到成功消息
                setTimeout(() => {
                    this.handleClose()
                }, 1500)
            } catch (error) {
                if (error.response) {
                    this.$notify({
                        title: '错误',
                        message: error.response.data.message || '密码重置失败',
                        type: 'error'
                    })
                }
            } finally {
                this.loading.resetPassword = false
            }
        }
    }
}
</script>

<style scoped>
.forgot-password-dialog {
    text-align: center;
}

.step-content {
    margin-top: 30px;
    padding: 0 20px;
}

.step-title {
    font-size: 16px;
    color: #303133;
    margin-bottom: 20px;
    font-weight: 500;
}

.phone-info {
    margin-bottom: 25px;
    color: #606266;
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    text-align: center;
}

.phone-info i {
    font-size: 24px;
    color: #409EFF;
    margin-bottom: 10px;
}

.highlight-text {
    color: #409EFF;
    font-weight: bold;
}

.sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}

.dialog-footer {
    margin-top: 25px;
    text-align: right;
}

.el-steps {
    margin-bottom: 30px;
}

.el-input {
    margin-bottom: 15px;
}

.password-eye {
    cursor: pointer;
    color: #909399;
}

.password-strength {
    margin-top: 5px;
    margin-bottom: 15px;
    text-align: left;
}

.strength-text {
    font-size: 12px;
    margin-bottom: 5px;
}

.strength-bar {
    height: 4px;
    background-color: #ebeef5;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 5px;
}

.strength-level {
    height: 100%;
    transition: width 0.3s ease;
}

.weak {
    color: #F56C6C;
    background-color: #F56C6C;
}

.medium {
    color: #E6A23C;
    background-color: #E6A23C;
}

.strong {
    color: #67C23A;
    background-color: #67C23A;
}

.password-tips {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
    .el-dialog {
        width: 90% !important;
        margin-top: 10vh !important;
    }
    
    .step-content {
        padding: 0 10px;
    }
}
</style>