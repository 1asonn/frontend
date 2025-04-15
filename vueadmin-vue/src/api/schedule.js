import request from '../axios.js'


export const GetSchedules = async () => {
    try {
        const response = await request.get(`/schedulePage`)
        return response.data
    } catch (error) {
        console.error('获取排班失败:', error)
        throw error
    }
}


export const GetSchedulesByPage = async ({ page, size, departmentId }) => {
    try {
        const response = await request.get(`/schedulePage?page=${page}&size=${size}&departmentId=${departmentId}`)
        return response.data
    } catch (error) {
        console.error('获取排班失败:', error)
        throw error
    }
}

//获取当前用户的排班信息
export const GetCurrentSchedule = async() => {
    try {
        const response = await request.get('/schedule/currentSchedule')
        return response
    } catch (error) {
        console.error('获取当前职工排班失败',error)
        throw error
    }
}


// 获取班次列表
export const GetShifts = async (params) => {
    try {
        const response = await request.get('/shiftSetting/shifts', {
            params: {
                page: params?.page || 1,
                size: params?.size || 10
            }
        })
        return response.data
    } catch (error) {
        console.error('获取班次列表失败:', error)
        throw error
    }
}

// 新建班次
export const CreateShift = async (data) => {
    try {
        const response = await request.post('/shiftSetting/shift', data)
        return response.data
    } catch (error) {
        console.error('创建班次失败:', error)
        throw error
    }
}

// 更新班次
export const UpdateShift = async (id, data) => {
    try {
        const response = await request.put(`/shiftSetting/shift/${id}`, data)
        return response.data
    } catch (error) {
        console.error('更新班次失败:', error)
        throw error
    }
}

// 删除班次
export const DeleteShift = async (id) => {
    try {
        const response = await request.delete(`/shiftSetting/shift/${id}`)
        return response.data
    } catch (error) {
        console.error('删除班次失败:', error)
        throw error
    }
}

// 获取部门排班
export const GetDepartmentSchedule = async (departmentId) => {
    try {
        const response = await request.get(`/schedule/getSchListBydepartment/${departmentId}`)
        return response.data
    } catch (error) {
        console.error('获取部门排班失败:', error)
        throw error
    }
}

// 保存排班
export const SaveSchedule = async (data) => {
    try {
        const response = await request.post('/shiftSetting/schedule', data)
        return response.data
    } catch (error) {
        console.error('保存排班失败:', error)
        throw error
    }
}

//