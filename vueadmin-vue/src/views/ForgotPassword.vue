<template>
    <el-dialog
        title="找回密码"
        :visible.sync="dialogVisible"
        width="30%"
        :before-close="handleClose"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        class="forgot-password-dialog"
    >
        <!-- 步骤条 -->
        <el-steps :active="activeStep" finish-status="success" simple>
            <el-step title="验证身份"></el-step>
            <el-step title="验证手机"></el-step>
            <el-step title="重置密码"></el-step>
        </el-steps>

        <!-- 第一步：输入用户名 -->
        <div v-if="activeStep === 0" class="step-content">
            <el-form :model="form" :rules="rules" ref="usernameForm">
                <el-form-item prop="username">
                    <el-input 
                        v-model="form.username" 
                        placeholder="请输入用户名"
                        prefix-icon="el-icon-user"
                    >
                    </el-input>
                </el-form-item>
            </el-form>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="verifyUsername">下一步</el-button>
            </div>
        </div>

        <!-- 第二步：手机验证 -->
        <div v-if="activeStep === 1" class="step-content">
            <div class="phone-info">
                <p>手机号码：{{ maskPhone }}</p>
            </div>
            <el-form :model="form" :rules="rules" ref="verifyForm">
                <el-form-item prop="verifyCode">
                    <el-input 
                        v-model="form.verifyCode" 
                        placeholder="请输入验证码"
                        prefix-icon="el-icon-key"
                    >
                        <el-button 
                            slot="append" 
                            @click="sendVerifyCode" 
                            :disabled="countdown > 0"
                        >
                            {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
                        </el-button>
                    </el-input>
                </el-form-item>
            </el-form>
            <div class="dialog-footer">
                <el-button @click="activeStep--">上一步</el-button>
                <el-button type="primary" @click="verifyCode">下一步</el-button>
            </div>
        </div>

        <!-- 第三步：重置密码 -->
        <div v-if="activeStep === 2" class="step-content">
            <el-form :model="form" :rules="rules" ref="passwordForm">
                <el-form-item prop="newPassword">
                    <el-input 
                        v-model="form.newPassword" 
                        type="password" 
                        placeholder="请输入新密码"
                        prefix-icon="el-icon-lock"
                    >
                    </el-input>
                </el-form-item>
                <el-form-item prop="confirmPassword">
                    <el-input 
                        v-model="form.confirmPassword" 
                        type="password" 
                        placeholder="请确认新密码"
                        prefix-icon="el-icon-lock"
                    >
                    </el-input>
                </el-form-item>
            </el-form>
            <div class="dialog-footer">
                <el-button @click="activeStep--">上一步</el-button>
                <el-button type="primary" @click="resetPassword">确认重置</el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script>
import { md5 } from 'js-md5'

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
                    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
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
            verifyCode: '0277' // 与登录页面保持一致
        }
    },
    computed: {
        maskPhone() {
            if (!this.form.phone) return ''
            return this.form.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        }
    },
    methods: {
        show() {
            this.dialogVisible = true
            this.resetForm()
        },
        handleClose() {
            this.dialogVisible = false
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
        async verifyUsername() {
            try {
                await this.$refs.usernameForm.validate()
                const response = await this.$axios.post('http://localhost:4000/user/verify-username', {
                    username: this.form.username
                })
                this.form.phone = response.data.data.phone
                this.activeStep++
            } catch (error) {
                if (error.response) {
                    this.$notify({
                        title: '错误',
                        message: error.response.data.message || '用户名验证失败',
                        type: 'error'
                    })
                }
            }
        },
        async sendVerifyCode() {
            try {
                const response = await this.$axios.post('http://localhost:4000/user/send-code', {
                    phone: this.form.phone
                })
                
                this.$notify({
                    title: '成功',
                    message: '验证码已发送',
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
                    message: '验证码发送失败',
                    type: 'error'
                })
            }
        },
        async verifyCode() {
            try {
                await this.$refs.verifyForm.validate()
                const response = await this.$axios.post('http://localhost:4000/user/verify-code', {
                    phone: this.form.phone,
                    code: this.form.verifyCode
                })
                this.activeStep++
            } catch (error) {
                if (error.response) {
                    this.$notify({
                        title: '错误',
                        message: error.response.data.message || '验证码验证失败',
                        type: 'error'
                    })
                }
            }
        },
        async resetPassword() {
            try {
                await this.$refs.passwordForm.validate()
                const response = await this.$axios.post('http://localhost:4000/user/reset-password', {
                    username: this.form.username,
                    phone: this.form.phone,
                    verifyCode: this.form.verifyCode,
                    newPassword: md5(this.form.newPassword, this.verifyCode)
                })

                this.$notify({
                    title: '成功',
                    message: '密码重置成功',
                    type: 'success'
                })

                this.handleClose()
            } catch (error) {
                if (error.response) {
                    this.$notify({
                        title: '错误',
                        message: error.response.data.message || '密码重置失败',
                        type: 'error'
                    })
                }
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
    margin-top: 20px;
}

.phone-info {
    margin-bottom: 20px;
    color: #606266;
}

.dialog-footer {
    margin-top: 20px;
    text-align: right;
}

.el-steps {
    margin-bottom: 20px;
}

.el-input {
    margin-bottom: 10px;
}
</style> 