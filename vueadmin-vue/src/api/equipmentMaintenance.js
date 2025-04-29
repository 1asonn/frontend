import request from '../axios.js'

// 创建设备维修工单
export const CreateMaintenanceOrder = async (data) => {
    const response = await request.post('http://localhost:4000/maintenance/orders', data)
    return response.data
}

// 获取设备维修工单列表
export const GetMaintenanceOrders = async () => {
    const response = await request.get('http://localhost:4000/maintenance/orders')
    return response.data
}

// 取消工单
export const CancelMaintenanceOrder = async (orderId) => {
    const response = await request.post(`http://localhost:4000/maintenance/orders/${orderId}/cancel`)
    return response.data
}

// 完成工单
export const CompleteMaintenanceOrder = async (orderId) => {
    const response = await request.post(`http://localhost:4000/maintenance/orders/${orderId}/complete`)
    return response.data
}

// 处理工单
export const ProcessMaintenanceOrder = async (orderId) => {
    const response = await request.post(`http://localhost:4000/maintenance/orders/${orderId}/process`)
    return response.data
}

