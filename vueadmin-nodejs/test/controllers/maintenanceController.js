const maintenanceService = require('../services/maintenanceService');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const cosService = require('../services/cosService');

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
        // 解析请求中的工单数据
        let orderData;
        
        // 如果是FormData提交，则req.body.data应该是JSON字符串
        if (req.body && req.body.data) {
            try {
                orderData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (parseError) {
                console.error('解析工单数据错误:', parseError);
                return res.status(400).json(createResponse(false, '工单数据格式错误'));
            }
        } else {
            // 如果不是FormData提交，则直接使用req.body
            orderData = req.body;
        }
        
        // 检查必填字段
        const requiredFields = [
            'equipment_name', 'equipment_code', 'department', 
            'fault_type', 'fault_description', 'reporter', 'contact_phone'
        ];
        
        const missingFields = requiredFields.filter(field => !orderData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json(createResponse(
                false, 
                `缺少必填字段: ${missingFields.join(', ')}`
            ));
        }
        
        // 添加创建人信息
        if (req.user && req.user.id) {
            orderData.created_by = req.user.id;
        }
        
        // 处理图片上传
        let imageUrls = [];
        // 检查是否有上传的文件
        if (req.files && req.files.length > 0) {
            // 过滤出图片文件（根据文件类型）
            const imageFiles = req.files.filter(file => {
                const mimeType = file.mimetype.toLowerCase();
                return mimeType.startsWith('image/');
            });
            
            if (imageFiles.length === 0) {
                console.log('未检测到有效的图片文件');
            }
            try {
                // 处理多个图片文件
                const uploadPromises = imageFiles.map(async (file) => {
                    // 生成文件名和存储路径
                    const originalExt = path.extname(file.originalname);
                    const fileName = `maintenance_${Date.now()}_${Math.floor(Math.random() * 10000)}${originalExt}`;
                    const cosKey = cosService.generateFileKey(fileName, 'maintenance/');
                    
                    // 上传文件到腾讯云COS
                    const uploadResult = await cosService.uploadFile({
                        file: file.buffer,
                        key: cosKey
                    });
                    
                    if (!uploadResult.success) {
                        throw new Error(`上传到腾讯云COS失败: ${uploadResult.error}`);
                    }
                    
                    // 返回永久链接，适合在浏览器中直接展示图片
                    return uploadResult.url;
                });
                
                // 等待所有图片上传完成
                imageUrls = await Promise.all(uploadPromises);
                
                // 将图片URL数组添加到工单数据中
                if (imageUrls.length > 0) {
                    orderData.images = JSON.stringify(imageUrls);
                }
            } catch (uploadError) {
                console.error('工单图片上传错误:', uploadError);
                // 图片上传错误不应阻止工单创建
            }
        }
        
        // 创建工单
        const order = await maintenanceService.createMaintenanceOrder(orderData);
        
        res.status(200).json(createResponse(true, '工单创建成功', {
            order,
            imageUrls
        }));
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
        
        res.status(200).json(createResponse(true, '获取工单列表成功', result));
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
        
        res.status(200).json(createResponse(true, '获取工单详情成功', order));
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
        
        res.status(200).json(createResponse(true, '获取工单历史记录成功', history));
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
        console.log("this is processData", processData);
        const order = await maintenanceService.processMaintenanceOrder(id, processData);
        
        res.status(200).json(createResponse(true, '工单已开始处理', order));
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
        
        res.status(200).json(createResponse(true, '工单已完成', order));
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
        
        res.status(200).json(createResponse(true, '工单已取消', order));
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
        
        res.status(200).json(createResponse(true, '工单更新成功', order));
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
        // 调用服务获取详细统计数据
        const stats = await maintenanceService.getMaintenanceStats();
        
        // 计算平均处理时间（将小时转为天）
        const avgProcessingDays = stats.avgProcessingTime / 24;
        
        // 格式化平均处理时间，保留一位小数
        const formattedAvgProcessingDays = avgProcessingDays.toFixed(1);
        
        // 获取上月的平均处理时间（模拟数据，实际应从数据库查询）
        // 这里模拟上月平均处理时间比当前多0.5天
        const lastMonthAvgProcessingDays = parseFloat(formattedAvgProcessingDays) + 0.5;
        
        // 计算平均处理时间的变化
        const processingTimeChange = lastMonthAvgProcessingDays - parseFloat(formattedAvgProcessingDays);
        
        // 构建前端需要的统计数据格式
        const responseData = {
            // 总工单数
            totalOrders: stats.totalOrders,
            totalOrdersGrowth: Math.abs(stats.orderGrowthRate).toFixed(1),
            totalOrdersTrend: stats.orderGrowthRate >= 0 ? 'up' : 'down',
            
            // 待处理工单
            pendingOrders: stats.pendingOrders,
            pendingOrdersGrowth: Math.abs(stats.pendingGrowthRate).toFixed(1),
            pendingOrdersTrend: stats.pendingGrowthRate >= 0 ? 'up' : 'down',
            
            // 处理中工单
            processingOrders: stats.processingOrders,
            processingOrdersGrowth: Math.abs(stats.processingGrowthRate).toFixed(1),
            processingOrdersTrend: stats.processingGrowthRate >= 0 ? 'up' : 'down',
            
            // 平均处理时间
            avgProcessingDays: formattedAvgProcessingDays,
            avgProcessingDaysChange: Math.abs(processingTimeChange).toFixed(1),
            avgProcessingDaysTrend: processingTimeChange > 0 ? 'up' : 'down',
            
            // 其他统计数据（可能在其他图表中使用）
            completedOrders: stats.completedOrders,
            cancelledOrders: stats.cancelledOrders
        };
        
        res.json(createResponse(true, '获取统计数据成功', responseData));
    } catch (error) {
        console.error('获取工单统计数据错误:', error);
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 获取设备维修历史记录
const getEquipmentMaintenanceHistory = async (req, res) => {
    try {
        const { equipmentId } = req.params;
        const { 
            page = 1, 
            size = 10, 
            startDate, 
            endDate, 
            maintenanceType, 
            operator,
            faultDescription,
            minCost,
            maxCost,
            orderField,
            orderDirection
        } = req.query;
        
        // 构建查询参数
        const queryParams = {
            page: parseInt(page),
            size: parseInt(size)
        };
        
        // 添加基本筛选条件
        if (startDate) queryParams.start_date = startDate;
        if (endDate) queryParams.end_date = endDate;
        if (maintenanceType) queryParams.maintenance_type = maintenanceType;
        
        // 添加人员相关筛选条件
        if (operator) queryParams.operator = operator;
        
        // 添加故障相关筛选条件
        if (faultDescription) queryParams.fault_description = faultDescription;
        
        // 添加成本相关筛选条件
        if (minCost !== undefined) queryParams.min_cost = minCost;
        if (maxCost !== undefined) queryParams.max_cost = maxCost;
        
        // 添加排序参数
        if (orderField) queryParams.orderField = orderField;
        if (orderDirection) queryParams.orderDirection = orderDirection;
        
        // 使用设备服务获取维修记录
        const equipmentService = require('../services/equipmentService');
        const maintenanceRecords = await equipmentService.getMaintenanceList(
            equipmentId,
            queryParams.page,
            queryParams.size,
            queryParams
        );
        
        res.status(200).json(createResponse(true, '获取设备维修历史记录成功', maintenanceRecords));
    } catch (error) {
        console.error('获取设备维修历史记录错误:', error);
        if (error.message.includes('设备不存在')) {
            return res.status(404).json(createResponse(false, error.message));
        }
        res.status(500).json(createResponse(false, error.message || '服务器内部错误'));
    }
};

// 上传工单图片
const uploadOrderImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.json(createResponse(false, '未提供图片文件'));
        }

        // 获取带有有效 token 的 Dropbox 客户端
        const dbx = await getDropboxClient();
        
        // 处理多个图片文件
        const uploadPromises = req.files.map(async (file) => {
            // 设置文件路径和名称
            const fileName = `maintenance_${Date.now()}_${Math.floor(Math.random() * 10000)}${getExtension(file.originalname)}`;
            const filePath = `/maintenance/${fileName}`;
            
            // 上传文件到Dropbox
            await dbx.filesUpload({
                path: filePath,
                contents: file.buffer,
                mode: 'overwrite'
            });
            
            // 获取共享链接
            const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
                path: filePath,
                settings: {
                    requested_visibility: { '.tag': 'public' }
                }
            });
            
            // 获取直接下载链接（替换dl=0为dl=1）
            return linkResponse.result.url.replace('dl=0', 'dl=1');
        });
        
        // 等待所有图片上传完成
        const imageUrls = await Promise.all(uploadPromises);
        
        res.json(createResponse(true, '图片上传成功', { imageUrls }));
    } catch (error) {
        console.error('上传工单图片错误:', error);
        res.status(500).json(createResponse(false, '图片上传失败: ' + error.message));
    }
};

// 为工单添加图片
const addOrderImages = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.files || req.files.length === 0) {
            return res.json(createResponse(false, '未提供图片文件'));
        }
        
        // 检查工单是否存在
        const order = await maintenanceService.getMaintenanceOrderById(id);
        if (!order) {
            return res.status(404).json(createResponse(false, '工单不存在'));
        }
        
        // 过滤出图片文件
        const imageFiles = req.files.filter(file => {
            const mimeType = file.mimetype.toLowerCase();
            return mimeType.startsWith('image/');
        });
        
        if (imageFiles.length === 0) {
            return res.status(400).json(createResponse(false, '未检测到有效的图片文件'));
        }
        
        // 处理多个图片文件
        const uploadPromises = imageFiles.map(async (file) => {
            // 生成文件名和存储路径
            const originalExt = path.extname(file.originalname);
            const fileName = `maintenance_${id}_${Date.now()}_${Math.floor(Math.random() * 10000)}${originalExt}`;
            const cosKey = cosService.generateFileKey(fileName, 'maintenance/');
            
            // 上传文件到腾讯云COS
            const uploadResult = await cosService.uploadFile({
                file: file.buffer,
                key: cosKey
            });
            
            if (!uploadResult.success) {
                throw new Error(`上传到腾讯云COS失败: ${uploadResult.error}`);
            }
            
            // 返回永久链接，适合在浏览器中直接展示图片
            return uploadResult.url;
        });
        
        // 等待所有图片上传完成
        const newImageUrls = await Promise.all(uploadPromises);
        
        // 获取现有图片数组
        let existingImages = [];
        if (order.images) {
            try {
                existingImages = JSON.parse(order.images);
            } catch (e) {
                console.error('解析现有图片数组错误:', e);
            }
        }
        
        // 合并新旧图片数组
        const allImages = [...existingImages, ...newImageUrls];
        
        // 更新工单记录
        const updatedOrder = await maintenanceService.updateMaintenanceOrder(
            id, 
            { images: JSON.stringify(allImages) },
            req.user ? req.user.id : null,
            req.user ? req.user.username : '系统管理员'
        );
        
        res.json(createResponse(true, '工单图片添加成功', {
            order: updatedOrder,
            imageUrls: allImages
        }));
    } catch (error) {
        console.error('添加工单图片错误:', error);
        res.status(500).json(createResponse(false, '添加工单图片失败: ' + error.message));
    }
};

// 不再需要此函数，使用path.extname代替

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
    getMaintenanceStats,
    getEquipmentMaintenanceHistory,
    uploadOrderImages,
    addOrderImages
};
