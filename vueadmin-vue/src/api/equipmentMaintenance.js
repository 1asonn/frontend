import request from '../axios.js'

// 创建设备维修工单
export const CreateMaintenanceOrder = async (data) => {
    // 如果有图片文件，需要使用FormData处理
    if (data.images && data.images.length > 0) {
        const formData = new FormData();
        
        // 将数据对象转为JSON字符串添加到FormData
        // 排除images字段，单独处理
        const { images, ...orderData } = data;
        formData.append('data', JSON.stringify(orderData));
        
        // 添加图片文件
        images.forEach((item, index) => {
            // 确保我们使用原始文件对象
            if (item.raw) {
                formData.append('files', item.raw);
            }
        });
        
        // 使用自定义头部发送FormData
        const response = await request.post('http://localhost:4000/maintenance/orders', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } else {
        // 没有图片文件，使用原来的JSON请求
        // 确保images字段是字符串而不是数组或对象
        const modifiedData = { ...data };
        if (modifiedData.images && (Array.isArray(modifiedData.images) || typeof modifiedData.images === 'object')) {
            modifiedData.images = ""; // 设置为空字符串
        }
        
        const response = await request.post('http://localhost:4000/maintenance/orders', modifiedData);
        return response.data;
    }
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
export const CompleteMaintenanceOrder = async (orderId, data) => {
    const response = await request.post(`http://localhost:4000/maintenance/orders/${orderId}/complete`, data)
    return response.data
}

// 处理工单
export const ProcessMaintenanceOrder = async (orderId, data) => {
    const response = await request.post(`http://localhost:4000/maintenance/orders/${orderId}/process`, data)
    return response.data
}

// 获取设备维护记录
export const GetEquipmentMaintenanceHistory = async (equipmentId, params) => {
    const response = await request.get(`http://localhost:4000/maintenance/equipment/${equipmentId}/history`, { params })
    return response.data
}

// 获取工单详情
export const GetMaintenanceOrderById = async (orderId) => {
    const response = await request.get(`http://localhost:4000/maintenance/orders/${orderId}`)
    return response.data
}

// 获取工单历史
export const GetMaintenanceOrderHistory = async (orderId) => {
    const response = await request.get(`http://localhost:4000/maintenance/orders/${orderId}/history`)
    return response.data
}

