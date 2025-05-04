const MedicalEquipment = require('../database/models/medical_equipment')
const EquipmentMaintenance = require('../database/models/equipment_maintenance')
const { Op } = require('sequelize')
const Department = require('../database/models/Department')

class EquipmentService {
    // 创建医疗设备
    async createEquipment(data) {
        try {
            // 如果提供了department_id，则查询对应的部门名称
            if (data.department_id) {
                const department = await Department.findByPk(data.department_id)
                
                if (department) {
                    // 将部门名称填充到department字段
                    data.department = department.name
                } else {
                    throw new Error('指定的部门ID不存在')
                }
            }
            
            return await MedicalEquipment.create(data)
        } catch (error) {
            throw new Error('创建医疗设备失败: ' + error.message)
        }
    }

    // 更新医疗设备
    async updateEquipment(id, data) {
        try {
            const equipment = await MedicalEquipment.findByPk(id)
            if (!equipment) {
                throw new Error('设备不存在')
            }
            return await equipment.update(data)
        } catch (error) {
            throw new Error('更新医疗设备失败: ' + error.message)
        }
    }

    // 删除医疗设备
    async deleteEquipment(id) {
        try {
            const equipment = await MedicalEquipment.findByPk(id)
            if (!equipment) {
                throw new Error('设备不存在')
            }
            // 检查是否有关联的维修记录
            const maintenanceCount = await EquipmentMaintenance.count({
                where: { equipment_id: id }
            })
            if (maintenanceCount > 0) {
                throw new Error('该设备存在维修记录，无法删除')
            }
            await equipment.destroy()
        } catch (error) {
            throw new Error('删除医疗设备失败: ' + error.message)
        }
    }

    // 获取单个医疗设备
    async getEquipmentById(id) {
        try {
            const equipment = await MedicalEquipment.findByPk(id, {
                include: [{
                    model: EquipmentMaintenance,
                    as: 'maintenance_records',
                    limit: 5,
                    order: [['created_at', 'DESC']]
                }]
            })
            if (!equipment) {
                throw new Error('设备不存在')
            }
            return equipment
        } catch (error) {
            throw new Error('获取医疗设备失败: ' + error.message)
        }
    }

    // 分页查询医疗设备
    async getEquipmentList(page, size, query) {
        try {
            const where = {}
            
            // 构建查询条件
            if (query.name) {
                where.name = { [Op.like]: `%${query.name}%` }
            }
            if (query.equipment_code) {
                where.equipment_code = { [Op.like]: `%${query.equipment_code}%` }
            }
            if (query.department) {
                where.department = query.department
            }
            if (query.department_id) {
                where.department_id = query.department_id
            }
            if (query.status) {
                where.status = query.status
            }

            const { count, rows } = await MedicalEquipment.findAndCountAll({
                where,
                offset: (page - 1) * size,
                limit: size,
                order: [['created_at', 'DESC']],
                include: [{
                    model: EquipmentMaintenance,
                    as: 'maintenance_records',
                    limit: 1,
                    order: [['created_at', 'DESC']]
                }]
            })

            return {
                total: count,
                items: rows,
                page: parseInt(page),
                size: parseInt(size)
            }
        } catch (error) {
            throw new Error('查询医疗设备列表失败: ' + error.message)
        }
    }

    // 创建维修记录
    async createMaintenance(equipmentId, data) {
        try {
            const equipment = await MedicalEquipment.findByPk(equipmentId)
            if (!equipment) {
                throw new Error('设备不存在')
            }
            
            // 处理时间信息
            const start_date = data.start_date || new Date();
            const end_date = data.end_date || null;
            
            // 构建维修记录数据
            const maintenanceData = {
                // 基本关联信息
                equipment_id: equipmentId,
                maintenance_order_id: data.maintenance_order_id,
                order_number: data.order_number,
                
                // 维修类型
                maintenance_type: data.maintenance_type || 'repair',
                
                // 时间跟踪
                start_date: start_date,
                end_date: end_date,
                next_maintenance_date: data.next_maintenance_date,
                
                // 人员信息
                operator_id: data.operator_id,
                operator: data.operator,
                
                // 故障和维修详情
                fault_description: data.fault_description,
                maintenance_details: data.maintenance_details,
                
                // 费用信息
                total_cost: data.total_cost || 0,
                
                // 其他信息
                remarks: data.remarks
            };
            
            // 创建维修记录
            const maintenance = await EquipmentMaintenance.create(maintenanceData);

            // 更新设备状态
            await equipment.update({
                status: 'maintenance',
                last_maintenance_date: maintenance.start_date,
                next_maintenance_date: data.next_maintenance_date
            });

            return maintenance;
        } catch (error) {
            console.error('创建维修记录错误详情:', error);
            throw new Error('创建维修记录失败: ' + error.message);
        }
    }

    // 分页查询维修记录
    async getMaintenanceList(equipmentId, page, size, query = {}) {
        try {
            const where = { equipment_id: equipmentId };
            
            // 基本查询条件
            if (query.maintenance_type) {
                where.maintenance_type = query.maintenance_type;
            }
            
            // 时间范围查询
            if (query.start_date) {
                where.start_date = {
                    [Op.gte]: new Date(query.start_date)
                };
            }
            if (query.end_date) {
                where.end_date = {
                    [Op.lte]: new Date(query.end_date)
                };
            }
            
            // 人员相关查询
            if (query.operator) {
                where.operator = { [Op.like]: `%${query.operator}%` };
            }
            
            // 故障相关查询
            if (query.fault_description) {
                where.fault_description = { [Op.like]: `%${query.fault_description}%` };
            }
            
            // 成本相关查询
            if (query.min_cost !== undefined) {
                where.total_cost = { ...where.total_cost, [Op.gte]: parseFloat(query.min_cost) };
            }
            if (query.max_cost !== undefined) {
                where.total_cost = { ...where.total_cost, [Op.lte]: parseFloat(query.max_cost) };
            }
            
            // 排序字段和方向
            let orderField = query.orderField || 'created_at';
            let orderDirection = query.orderDirection || 'DESC';
            
            // 验证排序字段是否有效
            const validOrderFields = [
                'created_at', 'start_date', 'end_date', 
                'total_cost', 'maintenance_type'
            ];
            
            if (!validOrderFields.includes(orderField)) {
                orderField = 'created_at';
            }
            
            if (!['ASC', 'DESC'].includes(orderDirection)) {
                orderDirection = 'DESC';
            }

            const { count, rows } = await EquipmentMaintenance.findAndCountAll({
                where,
                offset: (page - 1) * size,
                limit: size,
                order: [[orderField, orderDirection]],
                include: [{
                    model: MedicalEquipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'equipment_code', 'model', 'manufacturer', 'department', 'status']
                }]
            });

            return {
                total: count,
                items: rows,
                page: parseInt(page),
                size: parseInt(size),
                query: query // 返回查询条件，便于前端展示当前筛选条件
            };
        } catch (error) {
            console.error('查询维修记录列表错误:', error);
            throw new Error('查询维修记录列表失败: ' + error.message);
        }
    }
}

module.exports = new EquipmentService()
