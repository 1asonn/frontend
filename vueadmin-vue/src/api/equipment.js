import request from '../axios.js'

/**
 * 分页查询医疗设备列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @param {string} params.name - 设备名称（可选）
 * @param {string} params.department - 所属科室（可选）
 * @param {string} params.status - 设备状态（可选）
 * @returns {Promise} - 返回查询结果的Promise
 */
export const getEquipmentList = async (params = {}) => {
    try {
        const { page = 1, size = 10, ...query } = params;
        const response = await request.get('/equipment/list/page', {
            params: {
                page,
                size,
                ...query
            }
        });
        return response.data;
    } catch (error) {
        console.error('获取医疗设备列表失败:', error);
        throw error;
    }
};

/**
 * 获取单个医疗设备详情
 * @param {string} id - 设备ID
 * @returns {Promise} - 返回设备详情的Promise
 */
export const getEquipmentById = async (id) => {
    try {
        const response = await request.get(`/equipment/${id}`);
        return response.data;
    } catch (error) {
        console.error('获取医疗设备详情失败:', error);
        throw error;
    }
};

/**
 * 创建新的医疗设备
 * @param {Object} equipmentData - 设备数据
 * @returns {Promise} - 返回创建结果的Promise
 */
export const createEquipment = async (equipmentData) => {
    try {
        const response = await request.post('/equipment/create', equipmentData);
        return response.data;
    } catch (error) {
        console.error('创建医疗设备失败:', error);
        throw error;
    }
};

/**
 * 创建新的医疗设备并上传图片（一体化接口）
 * @param {Object} equipmentData - 设备数据
 * @param {File} imageFile - 设备图片文件
 * @returns {Promise} - 返回创建结果的Promise
 */
export const createEquipmentWithImage = async (equipmentData, imageFile) => {
    try {
        const formData = new FormData();
        
        // 添加设备数据
        formData.append('equipmentData', JSON.stringify(equipmentData));
        
        // 添加图片文件
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const response = await request.post('/equipment/create-with-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('创建医疗设备并上传图片失败:', error);
        throw error;
    }
};

/**
 * 更新医疗设备信息
 * @param {string} id - 设备ID
 * @param {Object} equipmentData - 更新的设备数据
 * @returns {Promise} - 返回更新结果的Promise
 */
export const updateEquipment = async (id, equipmentData) => {
    try {
        const response = await request.put(`/equipment/update/${id}`, equipmentData);
        return response.data;
    } catch (error) {
        console.error('更新医疗设备失败:', error);
        throw error;
    }
};

/**
 * 删除医疗设备
 * @param {string} id - 设备ID
 * @returns {Promise} - 返回删除结果的Promise
 */
export const deleteEquipment = async (id) => {
    try {
        const response = await request.delete(`/equipment/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error('删除医疗设备失败:', error);
        throw error;
    }
};

/**
 * 上传设备图片
 * @param {string} id - 设备ID
 * @param {File} imageFile - 图片文件
 * @returns {Promise} - 返回上传结果的Promise
 */
export const uploadEquipmentImage = async (id, imageFile) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await request.post(`/equipment/upload-image/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('上传设备图片失败:', error);
        throw error;
    }
};

/**
 * 创建设备维修记录
 * @param {string} equipmentId - 设备ID
 * @param {Object} maintenanceData - 维修记录数据
 * @returns {Promise} - 返回创建结果的Promise
 */
export const createMaintenance = async (equipmentId, maintenanceData) => {
    try {
        const response = await request.post(`/equipment/${equipmentId}/maintenance`, maintenanceData);
        return response.data;
    } catch (error) {
        console.error('创建维修记录失败:', error);
        throw error;
    }
};

/**
 * 获取设备维修记录列表
 * @param {string} equipmentId - 设备ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @returns {Promise} - 返回查询结果的Promise
 */
export const getMaintenanceList = async (equipmentId, params = {}) => {
    try {
        const { page = 1, size = 10, ...query } = params;
        const response = await request.get(`/equipment/${equipmentId}/maintenance/list`, {
            params: {
                page,
                size,
                ...query
            }
        });
        return response.data;
    } catch (error) {
        console.error('获取维修记录列表失败:', error);
        throw error;
    }
};

export const exportEquipmentHealthReport = async (equipmentId, format = 'pdf') => {
    try {
        const response = await request.get(`/equipment/${equipmentId}/health-report/export`, {
            params: { format },
            responseType: 'blob'
        });
        return response;
    } catch (error) {
        console.error('导出设备AI健康报表失败:', error);
        throw error;
    }
};
