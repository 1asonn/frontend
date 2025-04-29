<template>
    <section id="login-form" class="main">
        <div class="formContainer">
            <h1>Welcome</h1>
            <form class="login-form" @submit.prevent="Login">
            <div class="input-wrap i1">
                <input id="usernameInput" v-model="loginForm.username" type="email" placeholder="请输入您的邮箱~" spellcheck="false" autocomplete=“off” required>
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="input-wrap i2">
                <input id="passwordInput" v-model="loginForm.password" type="password" placeholder="请输入密码~" spellcheck="false" required>
                <i class="fa-solid fa-lock"></i>
            </div>
            <div class="rem">
                <p>
                    <input type="checkbox" v-model="rememberMe" id="rememberMe">
                    <label for="rememberMe">Remember me</label>
                </p>
                <a @click="showForgotPassword">Forgot password?</a>
            </div>

            <button type="submit">Login</button>

            <p class="reg">Dont't have an account? <a>Register</a></p>
            </form>
        </div>
        <forgot-password ref="forgotPassword"></forgot-password>
    </section>
    
</template>

<script>
    import {md5} from 'js-md5'
    import ForgotPassword from './ForgotPassword.vue'
    export default{
        components: {
            ForgotPassword
        },
        data(){
            return{
                verifyCode:'0277',
                loginForm:{
                    username: '',
                    password: ''
                },
                rememberMe: false
            };
        },
        created(){
            this.$i18n.locale = 'zh-TW';
            // 检查是否有保存的登录信息
            this.checkSavedCredentials();
            console.log("i18n",this.$i18n)}
            ,
        mounted(){
            // 添加自动填充支持
            const usernameInput = document.getElementById('usernameInput');
            if (usernameInput) {
                usernameInput.setAttribute('autocomplete', 'username');
            }
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) {
                passwordInput.setAttribute('autocomplete', 'current-password');
            }
        },
        methods:{
            // 检查是否有保存的登录信息
            checkSavedCredentials() {
                const savedCredentials = localStorage.getItem('userCredentials');
                if (savedCredentials) {
                    try {
                        const credentials = JSON.parse(savedCredentials);
                        this.loginForm.username = credentials.username || '';
                        // 密码已加密存储，登录时会自动处理
                        if (credentials.encryptedPassword) {
                            this.loginForm.password = credentials.encryptedPassword;
                            this.rememberMe = true;
                        }
                    } catch (error) {
                        console.error('解析保存的凭据失败', error);
                        // 清除可能损坏的数据
                        localStorage.removeItem('userCredentials');
                    }
                }
            },

            // 保存登录凭据
            saveCredentials(username, encryptedPassword) {
                if (this.rememberMe) {
                    const credentials = {
                        username: username,
                        encryptedPassword: encryptedPassword,
                        timestamp: new Date().getTime()
                    };
                    localStorage.setItem('userCredentials', JSON.stringify(credentials));
                } else {
                    // 如果取消了"记住我"，则删除之前保存的凭据
                    localStorage.removeItem('userCredentials');
                }
            },
            
            showForgotPassword() {
                this.$refs.forgotPassword.show()
            },
            Login(event){
            event.preventDefault()

            if(!document.getElementById("usernameInput").validity.valid || !this.loginForm.password){
                return 
            }

            // 检查密码是否已经加密（从记住的凭据中加载的情况）
            let encryptedPassword = this.loginForm.password;
            if (this.loginForm.password.length < 32) { // 简单判断是否为MD5加密后的密码
                // 前端密码加密
                encryptedPassword = md5(this.loginForm.password, this.verifyCode);
            }
            
            const loginData = {
                username: this.loginForm.username,
                password: encryptedPassword
            };
            
            this.$axios.post('http://localhost:4000/user/login', loginData, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              transformRequest: (data) => {
                return new URLSearchParams(data).toString();
              }
            }).then((response) => {
                this.$notify({
                    title: '登录成功',
                    message: '欢迎回来',
                    type: 'success'
                });
                
                // 保存登录凭据（如果选择了"记住我"）
                this.saveCredentials(this.loginForm.username, encryptedPassword);
                
                const jwt = response.data.data['token']
                this.$store.commit('SET_TOKEN', jwt)
                this.$router.push('/index')
            }).catch((error) => {
                // 登录失败，清除可能存在的已保存凭据
                if (this.rememberMe) {
                    localStorage.removeItem('userCredentials');
                }
                
                // 显示错误消息
                this.$notify({
                    title: '登录失败',
                    message: error.response?.data?.message || '用户名或密码错误',
                    type: 'error'
                });
                
                console.log("error", error);
                
                // 如果是从记住的凭据登录失败，清空密码字段让用户重新输入
                if (this.loginForm.password.length >= 32) {
                    this.loginForm.password = '';
                }
            })
            },
            changeLang(){
                const res = require('../i18n/lang/zh-TW.js')
                console.log("========",res)
            }   
        },
        
    }

</script>

<style scoped>
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
    
    .main{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-image: url('../assets/jinan.jpg');
        background-size:cover;
        background-position: center;

    }

    .formContainer{
        border: 1px solid rgba(255, 255, 255, 0.329);
        background-color: rgba(255, 255, 255,0.1);
        width: 45%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px 10px;
        border-radius: 10px;
        backdrop-filter: blur(3px);
        box-shadow: 0 10px 25px grey;
    }

    .formContainer h1{
        font-size: 2.2rem;
        color: black;
        letter-spacing: 3px;
        opacity: 0;
        animation: reload 0.5s ease-out forwards;
        animation-delay: 0.2s;
    }
    .login-form{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    }
    .input-wrap{
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid grey;
        margin-bottom: 20px;
        height: 45px;
        width: 90%;
        opacity: 0;
        border-radius: 50px;
        box-shadow: 0 0 5px grey;
    }
    .i1{
        animation: reload 0.5s ease-out forwards;
        animation-delay: 0.4s;
    }

    .i2{
        animation: reload 0.5s ease-out forwards;
        animation-delay: 0.6s;
    }

    .input-wrap i{
        font-size: 1.2rem;
        padding-right:25px;
    }

    input{
        border: none;
        outline: none;
        background-color: transparent;
        font-size: 1rem;
        padding: 5px 25px;
    }

    input::placeholder{
        font-size: 1rem;
        color: black;
    }

    .rem{
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 90%;
        margin-bottom: 20px;
        opacity: 0;
        animation: reload 0.5s ease-out forwards;
        animation-delay: 0.8s;
    }

    .rem p,.rem a{
        font-size: 1.2rem;
        color: black;
        cursor: pointer;
    }

    button{
        font-size: 1.2rem;
        height: 60px;
        width: 90%;
        border-radius: 50px;
        font-weight: 600;
        /* 字符的间距 */
        letter-spacing: 1px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: 0.3s;
        opacity: 0;
        animation: reload 0.5s ease-out forwards;
        animation-delay: 1s;
    }

    button:hover{
        background-color: rgba(161, 143, 143, 0.949);
    }

    .reg{
        font-size: 1.2rem;
        color: black;
        margin-bottom: 10px;
        opacity: 0;
        animation: reload 0.5s ease-out forwards;
        animation-delay: 1.2s;
    }

    .reg a {
        font-weight: 600;
        cursor: pointer;
    }

    @keyframes reload {
        0%{
            transform: translateY(150px);
        }
        100%{
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>