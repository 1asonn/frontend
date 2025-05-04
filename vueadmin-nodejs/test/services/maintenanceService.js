const { Op } = require('sequelize');
const { MaintenanceOrder, MaintenanceHistory, MedicalEquipment, User } = require('../database/models');
const equipmentService = require('./equipmentService');

class MaintenanceService {
    // 创建维修工单
    async createMaintenanceOrder(orderData) {
        try {
            // 生成工单编号
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            // 查询当天最后一个工单编号
            const lastOrder = await MaintenanceOrder.findOne({
                where: {
                    order_number: {
                        [Op.like]: `MO${year}${month}${day}%`
                    }
                },
                order: [['order_number', 'DESC']]
            });
            
            let orderNumber;
            if (lastOrder) {
                // 提取序号并加1
                const lastSeq = parseInt(lastOrder.order_number.slice(-4));
                orderNumber = `MO${year}${month}${day}${String(lastSeq + 1).padStart(4, '0')}`;
            } else {
                // 当天第一个工单
                orderNumber = `MO${year}${month}${day}0001`;
            }
            
            // 处理零件数据，如果是数组则转为JSON字符串
            if (orderData.parts && Array.isArray(orderData.parts)) {
                orderData.parts = JSON.stringify(orderData.parts);
            }
            
            // 处理 equipment_id，如果为空字符串或非数字，则设为 null
            if (orderData.equipment_id === '' || orderData.equipment_id === undefined || isNaN(parseInt(orderData.equipment_id))) {
                orderData.equipment_id = null;
            } else {
                orderData.equipment_id = parseInt(orderData.equipment_id);
            }
            
            // 创建工单
            const order = await MaintenanceOrder.create({
                ...orderData,
                order_number: orderNumber,
                status: 'pending',
                create_time: new Date()
            });
            
            // 创建历史记录
            await MaintenanceHistory.create({
                order_id: order.id,
                type: 'create',
                title: '创建工单',
                content: '工单已创建，等待处理',
                operator: orderData.reporter,
                time: new Date()
            });
            
            return order;
        } catch (error) {
            throw new Error('创建维修工单失败: ' + error.message);
        }
    }
    
    // 获取工单列表（支持分页和筛选）
    async getMaintenanceOrders(params) {
        try {
            const { current = 1, size = 10, searchQuery, department, departmentId, status, startDate, endDate, assigneeId } = params;
            const offset = (current - 1) * size;
            
            // 构建查询条件
            const where = {};
            
            // 搜索条件：工单号或设备名称
            if (searchQuery) {
                where[Op.or] = [
                    { order_number: { [Op.like]: `%${searchQuery}%` } },
                    { equipment_name: { [Op.like]: `%${searchQuery}%` } }
                ];
            }
            
            // 科室筛选 - 支持通过科室名称或ID筛选
            if (departmentId) {
                // 优先使用department_id进行筛选
                where.department_id = departmentId;
            } else if (department) {
                // 兼容旧版本，通过科室名称筛选
                where.department = department;
            }
            
            // 处理人ID筛选
            if (assigneeId && !isNaN(parseInt(assigneeId))) {
                where.assignee_id = parseInt(assigneeId);
            }
            
            // 状态筛选
            if (status) {
                where.status = status;
            }
            
            // 日期范围筛选
            if (startDate && endDate) {
                where.create_time = {
                    [Op.between]: [
                        new Date(startDate),
                        new Date(endDate)
                    ]
                };
            } else if (startDate) {
                where.create_time = {
                    [Op.gte]: new Date(startDate)
                };
            } else if (endDate) {
                where.create_time = {
                    [Op.lte]: new Date(endDate)
                };
            }
            
            // 查询工单列表
            const result = await MaintenanceOrder.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'assignee_info',
                        attributes: ['id', 'username', 'realname', 'phone']
                    }
                ],
                limit: size,
                offset,
                order: [['create_time', 'DESC']]
            });
            
            // 处理零件数据，将JSON字符串转为数组
            const records = result.rows.map(order => {
                const orderData = order.toJSON();
                if (orderData.parts && typeof orderData.parts === 'string') {
                    try {
                        orderData.parts = JSON.parse(orderData.parts);
                    } catch (e) {
                        orderData.parts = [];
                    }
                }
                return orderData;
            });
            
            return {
                records,
                total: result.count,
                size,
                current
            };
        } catch (error) {
            throw new Error('获取维修工单列表失败: ' + error.message);
        }
    }
    
    // 获取单个工单详情
    async getMaintenanceOrderById(id) {
        try {
            const order = await MaintenanceOrder.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'assignee_info',
                        attributes: ['id', 'username', 'realname', 'phone']
                    },
                    {
                        model: User,
                        as: 'creator_info',
                        attributes: ['id', 'username', 'realname', 'phone']
                    }
                ]
            });
            
            if (!order) {
                throw new Error('工单不存在');
            }
            
            // 处理零件数据，将JSON字符串转为数组
            const orderData = order.toJSON();
            if (orderData.parts && typeof orderData.parts === 'string') {
                try {
                    orderData.parts = JSON.parse(orderData.parts);
                } catch (e) {
                    orderData.parts = [];
                }
            }
            
            return orderData;
        } catch (error) {
            throw new Error('获取维修工单详情失败: ' + error.message);
        }
    }
    
    // 获取工单历史记录
    async getMaintenanceHistory(orderId) {
        try {
            const history = await MaintenanceHistory.findAll({
                where: { order_id: orderId },
                order: [['time', 'ASC']]
            });
            
            return history;
        } catch (error) {
            throw new Error('获取维修历史记录失败: ' + error.message);
        }
    }
    
    // 开始处理工单
    async processMaintenanceOrder(id, processData) {
        try {
            const order = await MaintenanceOrder.findByPk(id);
            if (!order) {
                throw new Error('工单不存在');
            }
            
            if (order.status !== 'pending') {
                throw new Error('只有待处理的工单才能开始处理');
            }
            
            // 处理assignee_id，确保它是数字或null
            let assigneeId = null;
            if (processData.assignee_id && !isNaN(parseInt(processData.assignee_id))) {
                assigneeId = parseInt(processData.assignee_id);
                
                // 如果有assignee_id但没有assignee名称，尝试从用户表获取
                if (!processData.assignee || processData.assignee.trim() === '') {
                    const user = await User.findByPk(assigneeId);
                    if (user) {
                        processData.assignee = user.realname || user.username;
                    }
                }
            }
            
            // 更新工单状态
            await order.update({
                status: 'processing',
                assignee: processData.assignee,
                assignee_id: assigneeId,
                estimated_time: processData.estimated_time,
                process_remark: processData.process_remark,
                process_time: new Date()
            });
            
            // 创建历史记录
            await MaintenanceHistory.create({
                order_id: id,
                type: 'process',
                title: '开始处理',
                content: processData.process_remark || '工程师已接单，开始处理故障',
                operator: processData.assignee,
                time: new Date()
            });
            
            return await this.getMaintenanceOrderById(id);
        } catch (error) {
            throw new Error('处理维修工单失败: ' + error.message);
        }
    }
    
    // 完成工单
    async completeMaintenanceOrder(id, data) {
        try {
            console.log('开始完成工单，ID:', id, '数据:', JSON.stringify(data));

            // 查找工单及关联设备
            const order = await MaintenanceOrder.findByPk(id, {
                include: [{
                    model: MedicalEquipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'equipment_code', 'model', 'manufacturer', 'department_id', 'department', 
                                'location', 'status', 'purchase_date', 'warranty_period', 'service_life', 
                                'last_maintenance_date', 'next_maintenance_date', 'responsible_person', 'contact_number', 
                                'description', 'image_url', 'created_at', 'updated_at']
                }]
            });

            if (!order) {
                throw new Error('工单不存在');
            }

            console.log('找到工单:', order.id, '设备ID:', order.equipment ? order.equipment.id : 'null');

            // 获取当前时间作为完成时间
            const completeTime = new Date();
            
            // 更新工单状态
            await order.update({
                status: 'completed',
                complete_time: completeTime,
                process_result: data.process_result || null,
                result_type: data.result_type || null,
                cost: data.cost || 0,
                process_remark: data.process_remark || null
            });

            console.log('工单状态已更新为已完成');
            
            // 创建工单历史记录
            await MaintenanceHistory.create({
                order_id: order.id,
                type: 'complete',
                title: '完成工单',
                content: `工单已完成，处理备注: ${data.process_remark || '无'}`,
                operator: order.assignee || '系统管理员',
                time: completeTime
            });
            
            console.log('工单历史记录已创建');

            // 如果有关联设备，创建设备维修记录并更新设备状态
            if (order.equipment && order.equipment_id) {
                console.log('准备创建设备维修记录');

                // 映射维修类型 - 根据故障类型确定
                let maintenance_type = 'repair'; // 默认为故障维修
                if (order.fault_type === '软件故障') {
                    maintenance_type = 'software';
                } else if (order.fault_type === '电气故障') {
                    maintenance_type = 'electrical';
                } else if (order.fault_type === '机械故障') {
                    maintenance_type = 'mechanical';
                } else if (order.fault_type === '校准') {
                    maintenance_type = 'calibration';
                } else if (order.fault_type === '例行保养') {
                    maintenance_type = 'preventive';
                }

                // 映射维修结果
                let result = 'fixed';
                if (order.result_type === 'partially_fixed') {
                    result = 'partially_fixed';
                } else if (order.result_type === 'cannot_fix') {
                    result = 'cannot_fix';
                } else if (order.result_type === 'need_parts') {
                    result = 'need_parts';
                }

                // 计算下次维护日期（默认3个月后）
                const today = new Date();
                const next_maintenance_date = new Date(today.setMonth(today.getMonth() + 3));
                
                // 解析图片URLs
                let imageUrls = [];
                if (order.images) {
                    try {
                        imageUrls = JSON.parse(order.images);
                    } catch (e) {
                        console.error('解析图片URLs失败:', e);
                    }
                }

                // 创建设备维修记录
                const maintenanceData = {
                    // 基本关联信息
                    equipment_id: order.equipment_id,
                    maintenance_order_id: order.id,
                    order_number: order.order_number,
                    
                    // 维修类型
                    maintenance_type: maintenance_type,
                    
                    // 时间跟踪
                    start_date: order.create_time,
                    end_date: completeTime,
                    next_maintenance_date: next_maintenance_date,
                    
                    // 人员信息
                    operator: order.assignee || order.reporter,
                    operator_id: order.assignee_id || null,
                    
                    // 故障和维修详情
                    fault_type: order.fault_type,
                    fault_description: order.fault_description,
                    maintenance_details: order.process_remark || '',
                    
                    // 零件和成本
                    parts_replaced: order.parts || null,
                    total_cost: order.cost || 0,
                    
                    // 状态和结果
                    status: 'completed',
                    result: result,
                    
                    // 其他信息
                    remarks: order.remarks || '',
                    images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
                };

                console.log('创建设备维修记录数据:', JSON.stringify(maintenanceData));

                try {
                    await equipmentService.createMaintenance(order.equipment_id, maintenanceData);
                    console.log('设备维修记录创建成功');
                    
                    // 更新设备状态为正常
                    await order.equipment.update({
                        status: 'normal',
                        last_maintenance_date: completeTime,
                        next_maintenance_date: next_maintenance_date
                    });
                    console.log('设备状态已更新为正常');
                } catch (error) {
                    console.error('创建设备维修记录或更新设备状态失败:', error.message);
                    console.error('错误详情:', error.stack);
                    // 不抛出异常，继续执行
                }
            } else {
                console.log('工单没有关联设备，跳过创建维修记录');
            }
            
            console.log('工单完成处理结束');
            return await this.getMaintenanceOrderById(id);
        } catch (error) {
            console.error('完成工单失败:', error);
            throw new Error('完成工单失败: ' + error.message);
        }
    }
    
    // 取消工单
    async cancelMaintenanceOrder(id, userId, username) {
        try {
            const order = await MaintenanceOrder.findByPk(id);
            if (!order) {
                throw new Error('工单不存在');
            }
            
            if (!['pending', 'processing'].includes(order.status)) {
                throw new Error('只有待处理或处理中的工单才能取消');
            }
            
            // 更新工单状态
            await order.update({
                status: 'cancelled',
                cancel_time: new Date()
            });
            
            // 创建历史记录
            await MaintenanceHistory.create({
                order_id: id,
                type: 'cancel',
                title: '取消工单',
                content: '工单已取消',
                operator: username,
                time: new Date()
            });
            
            return await this.getMaintenanceOrderById(id);
        } catch (error) {
            throw new Error('取消维修工单失败: ' + error.message);
        }
    }
    
    // 更新工单信息
    async updateMaintenanceOrder(id, updateData, userId, username) {
        try {
            const order = await MaintenanceOrder.findByPk(id);
            if (!order) {
                throw new Error('工单不存在');
            }
            
            // 处理零件数据，如果是数组则转为JSON字符串
            if (updateData.parts && Array.isArray(updateData.parts)) {
                updateData.parts = JSON.stringify(updateData.parts);
            }
            
            // 更新工单
            await order.update(updateData);
            
            // 创建历史记录
            await MaintenanceHistory.create({
                order_id: id,
                type: 'update',
                title: '更新工单',
                content: '工单信息已更新',
                operator: username,
                time: new Date()
            });
            
            return await this.getMaintenanceOrderById(id);
        } catch (error) {
            throw new Error('更新维修工单失败: ' + error.message);
        }
    }
    
    // 导出维修数据
    async exportMaintenanceData(params) {
        try {
            // 使用与getMaintenanceOrders相同的筛选逻辑，但不分页
            const { searchQuery, department, status, startDate, endDate } = params;
            
            // 构建查询条件
            const where = {};
            
            // 搜索条件：工单号或设备名称
            if (searchQuery) {
                where[Op.or] = [
                    { order_number: { [Op.like]: `%${searchQuery}%` } },
                    { equipment_name: { [Op.like]: `%${searchQuery}%` } }
                ];
            }
            
            // 科室筛选
            if (department) {
                where.department = department;
            }
            
            // 状态筛选
            if (status) {
                where.status = status;
            }
            
            // 日期范围筛选
            if (startDate && endDate) {
                where.create_time = {
                    [Op.between]: [
                        new Date(startDate),
                        new Date(new Date(endDate).setHours(23, 59, 59, 999)) // 设置为当天结束时间
                    ]
                };
            } else if (startDate) {
                where.create_time = {
                    [Op.gte]: new Date(startDate)
                };
            } else if (endDate) {
                where.create_time = {
                    [Op.lte]: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                };
            }
            
            // 查询工单列表
            const orders = await MaintenanceOrder.findAll({
                where,
                order: [['create_time', 'DESC']]
            });
            
            // 处理零件数据，将JSON字符串转为数组
            const records = orders.map(order => {
                const orderData = order.toJSON();
                if (orderData.parts && typeof orderData.parts === 'string') {
                    try {
                        orderData.parts = JSON.parse(orderData.parts);
                    } catch (e) {
                        orderData.parts = [];
                    }
                }
                return orderData;
            });
            
            return records;
        } catch (error) {
            throw new Error('导出维修数据失败: ' + error.message);
        }
    }
    
    // 获取工单统计数据
    async getMaintenanceStats() {
        try {
            // 获取总工单数
            const totalOrders = await MaintenanceOrder.count();
            
            // 获取待处理工单数
            const pendingOrders = await MaintenanceOrder.count({
                where: { status: 'pending' }
            });
            
            // 获取处理中工单数
            const processingOrders = await MaintenanceOrder.count({
                where: { status: 'processing' }
            });
            
            // 获取已完成工单数
            const completedOrders = await MaintenanceOrder.count({
                where: { status: 'completed' }
            });
            
            // 获取已取消工单数
            const cancelledOrders = await MaintenanceOrder.count({
                where: { status: 'cancelled' }
            });
            
            // 计算平均处理时间（完成时间 - 处理时间）
            const completedOrdersWithTimes = await MaintenanceOrder.findAll({
                where: {
                    status: 'completed',
                    process_time: { [Op.not]: null },
                    complete_time: { [Op.not]: null }
                },
                attributes: ['process_time', 'complete_time']
            });
            
            let totalProcessingTime = 0;
            completedOrdersWithTimes.forEach(order => {
                const processTime = new Date(order.process_time).getTime();
                const completeTime = new Date(order.complete_time).getTime();
                totalProcessingTime += (completeTime - processTime);
            });
            
            // 平均处理时间（小时）
            const avgProcessingTime = completedOrdersWithTimes.length > 0 
                ? (totalProcessingTime / completedOrdersWithTimes.length) / (1000 * 60 * 60) 
                : 0;
            
            // 获取本月和上月的工单数据，用于计算增长率
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            // 本月第一天
            const currentMonthStart = new Date(currentYear, currentMonth, 1);
            // 上月第一天
            const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
            // 上月最后一天
            const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
            
            // 本月工单数
            const currentMonthOrders = await MaintenanceOrder.count({
                where: {
                    create_time: {
                        [Op.gte]: currentMonthStart
                    }
                }
            });
            
            // 上月工单数
            const lastMonthOrders = await MaintenanceOrder.count({
                where: {
                    create_time: {
                        [Op.between]: [lastMonthStart, lastMonthEnd]
                    }
                }
            });
            
            // 计算增长率
            const orderGrowthRate = lastMonthOrders > 0 
                ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
                : 0;
            
            // 本月待处理工单数
            const currentMonthPendingOrders = await MaintenanceOrder.count({
                where: {
                    status: 'pending',
                    create_time: {
                        [Op.gte]: currentMonthStart
                    }
                }
            });
            
            // 上月待处理工单数
            const lastMonthPendingOrders = await MaintenanceOrder.count({
                where: {
                    status: 'pending',
                    create_time: {
                        [Op.between]: [lastMonthStart, lastMonthEnd]
                    }
                }
            });
            
            // 计算待处理工单增长率
            const pendingGrowthRate = lastMonthPendingOrders > 0 
                ? ((currentMonthPendingOrders - lastMonthPendingOrders) / lastMonthPendingOrders) * 100 
                : 0;
            
            // 本月处理中工单数
            const currentMonthProcessingOrders = await MaintenanceOrder.count({
                where: {
                    status: 'processing',
                    create_time: {
                        [Op.gte]: currentMonthStart
                    }
                }
            });
            
            // 上月处理中工单数
            const lastMonthProcessingOrders = await MaintenanceOrder.count({
                where: {
                    status: 'processing',
                    create_time: {
                        [Op.between]: [lastMonthStart, lastMonthEnd]
                    }
                }
            });
            
            // 计算处理中工单增长率
            const processingGrowthRate = lastMonthProcessingOrders > 0 
                ? ((currentMonthProcessingOrders - lastMonthProcessingOrders) / lastMonthProcessingOrders) * 100 
                : 0;
            
            return {
                totalOrders,
                pendingOrders,
                processingOrders,
                completedOrders,
                cancelledOrders,
                avgProcessingTime,
                orderGrowthRate,
                pendingGrowthRate,
                processingGrowthRate
            };
        } catch (error) {
            throw new Error('获取工单统计数据失败: ' + error.message);
        }
    }
}

module.exports = new MaintenanceService();
