import axios from "axios";
import router from "./router";
import Element from "element-ui";

// axios.defaults.baseURL = "https://localhost:8080"

const request = axios.create({
    baseURL: 'http://localhost:4000',  // 添加baseURL，端口要和后端服务端口一致
    timeout:5000,
    headers:{
        'Content-Type':'application/json;charset=utf-8'
    }
})

/* 请求拦截器 */
request.interceptors.request.use(config =>{       
    const token = localStorage.getItem('token')                            
    config.headers['Authorization'] = `Bearer ${token}`
    return config
})



/* 响应拦截器 */
request.interceptors.response.use(
    response =>{
    const res = response.data

    if(response.status === 200 || res.code === 200 || res.success === true){                 
        return response }

    else{
        console.log("what is res?",res)
        Element.Message.error(res.msg,res.msg,'System Error!')  //弹窗错误警告
        return Promise.reject(response.data.msg)}   
    },
    error =>{
    if(error.response.data){
        error.message = error.response.data.message}
    
    if(error.response.data.code === 401){
        router.push('/login')}
    Element.Message.error(error.response.data.message,{duration:3000}) //弹窗错误警告
    return Promise.reject(error)
    }
)

export default request