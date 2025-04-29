const maintenanceService = require('../services/maintenanceService');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

// 统一响应格式
const createResponse = (success, message, data = null) => {
    return {
        success,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

// 创建维修工单
const createMaintenanceOrder = async (req, res) => {
    try {
        const orderData = req.body;
        
        // 添加创建人信息
        if (req.user && req.user.id) {
            orderData.created_by = req.user.id;
        }
        
        const order = await maintenanceService.createMaintenanceOrder(orderData);
        
        res.status(201).json(createResponse(true, '工单创建成功', order));
    } catch (error) {
        console.error('创建维修工单错误:', error);
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 获取工单列表
const getMaintenanceOrders = async (req, res) => {
    try {
        const { current, size, searchQuery, department, departmentId, status, startDate, endDate, assigneeId } = req.query;
        
        const params = {
            current: parseInt(current) || 1,
            size: parseInt(size) || 10,
            searchQuery,
            department,
            departmentId: departmentId ? parseInt(departmentId) : undefined,
            status,
            startDate,
            endDate,
            assigneeId: assigneeId ? parseInt(assigneeId) : undefined
        };
        
        const result = await maintenanceService.getMaintenanceOrders(params);
        
        res.json(createResponse(true, '获取工单列表成功', result));
    } catch (error) {
        console.error('获取工单列表错误:', error);
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 获取工单详情
const getMaintenanceOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await maintenanceService.getMaintenanceOrderById(id);
        
        res.json(createResponse(true, '获取工单详情成功', order));
    } catch (error) {
        console.error('获取工单详情错误:', error);
        if (error.message.includes('不存在')) {
            return res.status(404).json(createResponse(false, error.message));
        }
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 获取工单历史记录
const getMaintenanceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const history = await maintenanceService.getMaintenanceHistory(id);
        
        res.json(createResponse(true, '获取工单历史记录成功', history));
    } catch (error) {
        console.error('获取工单历史记录错误:', error);
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 处理工单
const processMaintenanceOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const processData = req.body;
        
        // 如果有用户信息，使用当前登录用户作为处理人
        if (req.user && req.user.id && !processData.assignee_id) {
            processData.assignee_id = req.user.id;
            if (!processData.assignee && req.user.realname) {
                processData.assignee = req.user.realname;
            }
        }
        
        const order = await maintenanceService.processMaintenanceOrder(id, processData);
        
        res.json(createResponse(true, '工单已开始处理', order));
    } catch (error) {
        console.error('处理工单错误:', error);
        if (error.message.includes('不存在') || error.message.includes('只有待处理')) {
            return res.status(400).json(createResponse(false, error.message));
        }
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 完成工单
const completeMaintenanceOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const completeData = req.body;
        
        const order = await maintenanceService.completeMaintenanceOrder(id, completeData);
        
        res.json(createResponse(true, '工单已完成', order));
    } catch (error) {
        console.error('完成工单错误:', error);
        if (error.message.includes('不存在') || error.message.includes('只有处理中')) {
            return res.status(400).json(createResponse(false, error.message));
        }
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 取消工单
const cancelMaintenanceOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : '系统管理员';
        
        const order = await maintenanceService.cancelMaintenanceOrder(id, userId, username);
        
        res.json(createResponse(true, '工单已取消', order));
    } catch (error) {
        console.error('取消工单错误:', error);
        if (error.message.includes('不存在') || error.message.includes('只有待处理或处理中')) {
            return res.status(400).json(createResponse(false, error.message));
        }
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 更新工单
const updateMaintenanceOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : '系统管理员';
        
        const order = await maintenanceService.updateMaintenanceOrder(id, updateData, userId, username);
        
        res.json(createResponse(true, '工单更新成功', order));
    } catch (error) {
        console.error('更新工单错误:', error);
        if (error.message.includes('不存在')) {
            return res.status(404).json(createResponse(false, error.message));
        }
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 导出维修数据
const exportMaintenanceData = async (req, res) => {
    try {
        const { searchQuery, department, departmentId, status, startDate, endDate, assigneeId } = req.query;
        
        const params = {
            searchQuery,
            department,
            departmentId: departmentId ? parseInt(departmentId) : undefined,
            status,
            startDate,
            endDate,
            assigneeId: assigneeId ? parseInt(assigneeId) : undefined
        };
        
        const data = await maintenanceService.exportMaintenanceData(params);
        
        // 创建Excel工作簿
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('维修工单数据');
        
        // 设置表头
        const headers = [
            { header: '工单编号', key: 'order_number', width: 20 },
            { header: '设备名称', key: 'equipment_name', width: 20 },
            { header: '设备编号', key: 'equipment_code', width: 20 },
            { header: '所属科室', key: 'department', width: 15 },
            { header: '故障类型', key: 'fault_type', width: 15 },
            { header: '故障描述', key: 'fault_description', width: 30 },
            { header: '工单状态', key: 'status', width: 15 },
            { header: '报修人', key: 'reporter', width: 15 },
            { header: '联系电话', key: 'contact_phone', width: 15 },
            { header: '创建时间', key: 'create_time', width: 20 },
            { header: '处理人', key: 'assignee', width: 15 },
            { header: '处理人ID', key: 'assignee_id', width: 10 },
            { header: '处理时间', key: 'process_time', width: 20 },
            { header: '完成时间', key: 'complete_time', width: 20 },
            { header: '处理结果', key: 'process_result', width: 30 },
            { header: '维修费用', key: 'cost', width: 15 }
        ];
        
        // 处理数据，格式化日期和状态
        const formattedData = data.map(item => {
            // 格式化状态
            const statusMap = {
                'pending': '待处理',
                'processing': '处理中',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            
            // 格式化日期
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            };
            
            return {
                order_number: item.order_number,
                equipment_name: item.equipment_name,
                equipment_code: item.equipment_code,
                department: item.department,
                fault_type: item.fault_type,
                fault_description: item.fault_description,
                status: statusMap[item.status] || item.status,
                reporter: item.reporter,
                contact_phone: item.contact_phone,
                create_time: formatDate(item.create_time),
                assignee: item.assignee || '',
                process_time: formatDate(item.process_time),
                complete_time: formatDate(item.complete_time),
                process_result: item.process_result || '',
                cost: item.cost || 0
            };
        });
        
        // 添加数据行
        worksheet.addRows(formattedData);
        
        // 生成Excel文件
        const filename = `维修工单数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        // 确保uploads目录存在
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filePath = path.join(uploadsDir, filename);
        
        // 写入文件
        await workbook.xlsx.writeFile(filePath);
        
        // 返回文件下载链接
        const downloadUrl = `/uploads/${filename}`;
        
        res.json(createResponse(true, '维修数据导出成功', { downloadUrl }));
    } catch (error) {
        console.error('导出维修数据错误:', error);
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 获取工单统计数据
const getMaintenanceStats = async (req, res) => {
    try {
        const stats = await maintenanceService.getMaintenanceStats();
        
        res.json(createResponse(true, '获取工单统计数据成功', stats));
    } catch (error) {
        console.error('获取工单统计数据错误:', error);
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

module.exports = {
    createMaintenanceOrder,
    getMaintenanceOrders,
    getMaintenanceOrderById,
    getMaintenanceHistory,
    processMaintenanceOrder,
    completeMaintenanceOrder,
    cancelMaintenanceOrder,
    updateMaintenanceOrder,
    exportMaintenanceData,
    getMaintenanceStats
};
