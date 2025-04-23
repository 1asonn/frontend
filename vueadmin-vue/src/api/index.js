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
    
export const GetPatientRecord = async (patientId) => {
    try {
        const response = await request.get(`http://localhost:4000/medicalRecord/medical_records/${patientId}`)
        return response
    } catch (error) {
        console.log("error",error)
    }
}

// 查询患者信息（支持卡号和姓名）
export const GetPatientInfo = async ({ medicalId = '', name = '' }) => {
    try {
        // 确保 medicalId 作为字符串处理
        const medicalIdStr = String(medicalId).trim();
        const nameStr = String(name).trim();
        
        const response = await request.get('http://localhost:4000/patient/getPatients', {
            params: { 
                medicalId: medicalIdStr, 
                name: nameStr 
            }
        });
        // 返回 records 数组
        return response.data.data.records;
    } catch (error) {
        console.error("获取患者信息失败", error);
        return [];
    }
}

// 获取用户菜单
export const GetUserAuth = async () => {
    try {
        const response = await request.get('http://localhost:4000/role/getRoleAuthorities')
        return Promise.resolve(response.data)
    } catch (error) {
        console.log("error",error)
        return Promise.reject(error)
    }
}

// 获取权限树
export const GetAuthTree = async () => {
    try {
        const response = await request.get('http://localhost:4000/role/getAuthorityTree')
        return response.data.data
    } catch (error) {
        console.log(error)
    }
}


//获取系统用户列表
export const GetUserList = async ({ current = 1, size = 10, username = '' }) => {
    try {
        const response = await request.get('http://localhost:4000/user/getUserList', {
            params: {
                current,
                size,
                username
            }
        })
        return response.data.data
    } catch(error) {
        console.error('获取用户列表失败:', error)
        if (error.response?.status === 401) {
            throw new Error('token为空或无效')
        } else if (error.response?.status === 403) {
            throw new Error('用户无权限')
        } else {
            throw new Error('获取用户列表失败')
        }
    }
}


//获取角色列表
export const GetRoleList = async () => {
    try {
        const response = await request.get('http://localhost:4000/role/getRoleList')
        return response.data.data
    } catch (error) {
        console.log(error)
    }
}

//获取某个系统用户的信息
export const GetUserInfo = async (userId) => {
    try {
        const response = await request.get(`http://localhost:4000/user/getUserInfo/${userId}`)
        return response.data.data
    } catch (error) {
        console.log(error)
    }
}

//设置某个角色下的权限
export const SetRoleAuthority = async (Id,authoritys) => {
    try{
        const res = await request.post('http://localhost:4000/role/updateRoleAuthority',
        {
            id:Id,
            authoritys:authoritys
        })
    }catch(error){
        console.log(error)
    }
}


//获取某个角色的信息
export const GetRoleInfo = async (roleId) => {
    try {
        const response = await request.get(`http://localhost:4000/role/getRoleInfo/${roleId}`)
        return response.data.data    
    } catch (error) {
        console.log(error)
    }
}

//获取菜单加密公钥
export const GetMenuPublicKey = async () => {
    try {
        const publicKey = await request.get('http://localhost:4000/role/public-key')
        return publicKey.data.data.publicKey
    } catch (error) {
        console.log(error)
    }
}

// 获取AI分析结果
export const GetAIAnalysis = async (patientId) => {
    try {
        const response = await request.get(`http://localhost:4000/ai/analyze/${patientId}`)
        return response.data
    } catch (error) {
        console.log("error", error)
    }
}

// 获取药品库存风险预警
export const GetMedicineStockAlerts = async () => {
    try {
        const response = await request.get('/medicine/risk/alerts')
        return response.data
    } catch (error) {
        console.error('获取药品库存风险预警失败:', error)
        throw error
    }
}

// 获取科室列表
export const GetDepartments = async () => {
    try {
        const response = await request.get('/departments')
        return response.data
    } catch (error) {
        console.error('获取科室列表失败:', error)
        throw error
    }
}

// 获取科室医生列表
export const GetDepartmentDoctors = async (departmentId) => {
    try {
        const response = await request.get(`/departments/${departmentId}/doctors`)
        return response.data
    } catch (error) {
        console.error('获取科室医生列表失败:', error)
        throw error
    }
}

// 获取医生排班
export const GetDoctorSchedule = async (doctorId, date) => {
    try {
        const response = await request.get(`/doctors/${doctorId}/schedule`, {
            params: { date }
        })
        return response.data
    } catch (error) {
        console.error('获取医生排班失败:', error)
        throw error
    }
}

// 创建预约挂号
export const CreateAppointment = async (data) => {
    try {
        const response = await request.post('/appointments', data)
        return response.data
    } catch (error) {
        console.error('创建预约挂号失败:', error)
        throw error
    }
}

export const DownloadFiles = async (fileName) => {
    try {
        const response = await request.get(`http://localhost:4000/download/file/${fileName}`)
        console.log("primaryRes",response)
        return response.data
    } catch (error) {
        console.error('下载文件失败:', error)
        throw error
    }
}


// 获取部门列表
export const GetDepartmentList = async () => {
    try {
        const response = await request.get('/department/list')
        return response.data
    } catch (error) {
        console.error('获取部门列表失败:', error)
        throw error
    }
}

// 批量更新职工排班情况
export const UpdateSchedule = async (data) => {
    try {
        const response = await request.post('/schedule/update', data)
        return response.data
    } catch (error) {
        console.error('更新职工排班情况失败:', error)
        throw error
    }
}

// 注册新用户
export const UserRegiste = async (data) => {
    try {
        const response = await request.post('/user/register', {
            username: data.username,
            password: data.password,
            realname: data.realname,
            gender: data.gender,
            birthDate: data.birth_date,
            address: data.address,
            roleId: parseInt(data.roleId, 10),
            departmentId: parseInt(data.departmentId, 10)
        })
        return response.data
    } catch (error) {
        console.error('注册用户失败:', error)
        throw error
    }
}


