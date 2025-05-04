import request from '../axios.js'

// 创建设备维修工单
export const CreateMaintenanceOrder = async (data) => {
    // 检查是否有图片文件需要上传
    if (data.images && data.images.length > 0) {
        const formData = new FormData();
        
        // 将工单数据转为JSON字符串添加到FormData
        const { images, ...orderData } = data;
        formData.append('data', JSON.stringify(orderData));
        
        // 添加图片文件
        images.forEach((item) => {
            // 确保使用原始文件对象
            if (item.raw) {
                formData.append('files', item.raw);
            }
        });
        
        // 使用FormData发送请求
        const response = await request.post('http://localhost:4000/maintenance/orders', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } else {
        // 没有图片文件，使用普通JSON请求
        const response = await request.post('http://localhost:4000/maintenance/orders', data);
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

