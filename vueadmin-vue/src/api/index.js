import request from '../axios.js'

// 设置baseUrl
// request.defaults.baseURL = 'http://localhost:4000'

// 获取患者列表
export const GetPatientList = async () => {
        try{
            const response = await request.get('http://localhost:4000/patient/getPatients')
            return response
        }catch(error){
            console.error("error",error)
        }
    }

// 获取用户菜单
export const GetUserAuth = async () => {
    try {
        const response = await request.get('http://localhost:4000/role/getRoleAuthorities')
        return response.data
    } catch (error) {
        console.log("error",error)
    }
}

// 获取权限树
export const GetAuthTree = async () => {
    try {
        const response = await request.get('http://localhost:4000/role/getAuthorityTree')
        return response.data
    } catch (error) {
        console.log(error)
    }
}
