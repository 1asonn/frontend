import axios from "axios"
import Mock from 'mockjs'

// 创建专门用于排班的axios实例
const mockRequest = axios.create({
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    }
})

// Mock数据
const departments = [
    { id: 1, name: '技术部' },
    { id: 2, name: '人事部' },
    { id: 3, name: '财务部' },
    { id: 4, name: '市场部' }
]

const shifts = [
    {
        id: 1,
        name: '标准班',
        description: '标准工作时间',
        weekSchedule: [
            { enabled: true, startTime: '09:00', endTime: '18:00' },  // 周一
            { enabled: true, startTime: '09:00', endTime: '18:00' },  // 周二
            { enabled: true, startTime: '09:00', endTime: '18:00' },  // 周三
            { enabled: true, startTime: '09:00', endTime: '18:00' },  // 周四
            { enabled: true, startTime: '09:00', endTime: '18:00' },  // 周五
            { enabled: false, startTime: '', endTime: '' },           // 周六
            { enabled: false, startTime: '', endTime: '' }            // 周日
        ]
    },
    {
        id: 2,
        name: '早班',
        description: '早班时间',
        weekSchedule: [
            { enabled: true, startTime: '06:00', endTime: '14:00' },
            { enabled: true, startTime: '06:00', endTime: '14:00' },
            { enabled: true, startTime: '06:00', endTime: '14:00' },
            { enabled: true, startTime: '06:00', endTime: '14:00' },
            { enabled: true, startTime: '06:00', endTime: '14:00' },
            { enabled: false, startTime: '', endTime: '' },
            { enabled: false, startTime: '', endTime: '' }
        ]
    },
    {
        id: 3,
        name: '晚班',
        description: '晚班时间',
        weekSchedule: [
            { enabled: true, startTime: '14:00', endTime: '22:00' },
            { enabled: true, startTime: '14:00', endTime: '22:00' },
            { enabled: true, startTime: '14:00', endTime: '22:00' },
            { enabled: true, startTime: '14:00', endTime: '22:00' },
            { enabled: true, startTime: '14:00', endTime: '22:00' },
            { enabled: false, startTime: '', endTime: '' },
            { enabled: false, startTime: '', endTime: '' }
        ]
    }
]

// Mock接口
Mock.mock(/\/api\/mock\/departments/, 'get', {
    code: 200,
    msg: 'success',
    data: departments
})

Mock.mock(/\/api\/mock\/shifts/, 'get', {
    code: 200,
    msg: 'success',
    data: shifts
})

Mock.mock(/\/api\/mock\/shifts\/\d+/, 'put', (options) => {
    const body = JSON.parse(options.body)
    const id = parseInt(options.url.match(/\/shifts\/(\d+)/)[1])
    const index = shifts.findIndex(s => s.id === id)
    
    if (index !== -1) {
        shifts[index] = { ...shifts[index], ...body }
        return {
            code: 200,
            msg: 'success'
        }
    }
    
    return {
        code: 400,
        msg: '班次不存在'
    }
})

Mock.mock(/\/api\/mock\/shifts/, 'post', (options) => {
    const body = JSON.parse(options.body)
    const newShift = {
        ...body,
        id: shifts.length + 1
    }
    shifts.push(newShift)
    return {
        code: 200,
        msg: 'success'
    }
})

Mock.mock(/\/api\/mock\/shifts\/\d+/, 'delete', (options) => {
    const id = parseInt(options.url.match(/\/shifts\/(\d+)/)[1])
    const index = shifts.findIndex(s => s.id === id)
    
    if (index !== -1) {
        shifts.splice(index, 1)
        return {
            code: 200,
            msg: 'success'
        }
    }
    
    return {
        code: 400,
        msg: '班次不存在'
    }
})

Mock.mock(/\/api\/mock\/schedules\/department\/\d+/, 'get', () => {
    const employees = [
        { id: 1, name: '张三', departmentId: 1 },
        { id: 2, name: '李四', departmentId: 1 },
        { id: 3, name: '王五', departmentId: 1 }
    ]

    const schedules = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        schedules: []
    }))

    return {
        code: 200,
        msg: 'success',
        data: schedules
    }
})

// Mock响应拦截器
mockRequest.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        console.error('Mock请求错误:', error)
        return Promise.reject(error)
    }
)

// API函数
export const getDepartments = () => {
    return mockRequest.get('/api/mock/departments')
}

export const getShifts = () => {
    return mockRequest.get('/api/mock/shifts')
}

export const createShift = (data) => {
    return mockRequest.post('/api/mock/shifts', data)
}

export const updateShift = (id, data) => {
    return mockRequest.put(`/api/mock/shifts/${id}`, data)
}

export const deleteShift = (id) => {
    return mockRequest.delete(`/api/mock/shifts/${id}`)
}

export const getSchedulesByDepartment = (departmentId) => {
    return mockRequest.get(`/api/mock/schedules/department/${departmentId}`)
}

export const assignShift = (data) => {
    return mockRequest.post('/api/mock/schedules/assign', data)
}

export const removeShift = (data) => {
    return mockRequest.delete('/api/mock/schedules/assign', { data })
}
