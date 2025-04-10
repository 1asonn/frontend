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
