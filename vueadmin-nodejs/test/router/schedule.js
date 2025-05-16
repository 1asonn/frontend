const express = require('express');
const router = express.Router();
const Schedule = require('../database/models/Schedule');
const User = require('../database/models/user');
const Department = require('../database/models/department');
const ShiftSetting = require('../database/models/ShiftSetting');
const jwt = require('jsonwebtoken');
const { sequelize, Sequelize } = require('../database/init.js');

// 创建或更新排班
// 单个职工排班创建或更新
router.post('/schedule', async (req, res) => {
  // 使用事务确保数据一致性
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      employeeId, 
      departmentId,
      shiftAssignments // 班次分配格式: [{day: 'monday', shiftId: 1}, {day: 'tuesday', shiftId: 2}, ...]
    } = req.body;
    
    if (!employeeId || !departmentId) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要的职工或部门信息'
      });
    }
    
    // 验证班次分配数据格式
    if (shiftAssignments && !Array.isArray(shiftAssignments)) {
      return res.status(400).json({
        code: 400,
        message: '班次分配数据格式错误，应为数组格式'
      });
    }
    
    // 查找是否已存在该职工的排班
    let schedule = await Schedule.findOne({ 
      where: { employee_id: employeeId },
      transaction
    });
    
    // 初始化星期字段的值，直接存储班次ID
    let weekDays = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    };
    
    // 将班次分配数组转换为映射格式
    if (shiftAssignments && shiftAssignments.length > 0) {
      shiftAssignments.forEach(assignment => {
        if (assignment.day && weekDays.hasOwnProperty(assignment.day)) {
          // 直接将班次ID存储到对应的星期字段
          weekDays[assignment.day] = assignment.shiftId === 0 ? null : assignment.shiftId;
        }
      });
    }
    
    if (schedule) {
      // 更新现有排班
      await schedule.update({
        ...weekDays,
        department_id: departmentId
      }, { transaction });
    } else {
      // 创建新排班
      schedule = await Schedule.create({
        employee_id: employeeId,
        ...weekDays,
        department_id: departmentId
      }, { transaction });
    }
    
    // 提交事务
    await transaction.commit();
    
    // 获取更新后的排班信息
    const updatedSchedule = await Schedule.findOne({
      where: { id: schedule.id },
      include: [{
        model: User,
        as: 'employee',
        attributes: { exclude: ['password'] }
      }]
    });
    
    // 获取所有班次信息，用于根据班次ID获取具体时间
    const allShifts = await ShiftSetting.findAll({
      where: { isEnabled: true },
      attributes: ['id', 'name', 'startTime', 'endTime', 'description']
    });
    
    // 创建班次ID到班次详细信息的映射
    const shiftsById = {};
    allShifts.forEach(shift => {
      shiftsById[shift.id] = shift;
    });
    
    // 初始化班次映射和时间映射
    const shiftMapping = {};
    const detailedShiftMapping = {};
    
    // 预处理排班数据中的班次ID
    for (const day of Object.keys(weekDays)) {
      const shiftId = updatedSchedule[day];
      if (shiftId && shiftsById[shiftId]) {
        const shift = shiftsById[shiftId];
        
        // 更新班次ID映射
        shiftMapping[day] = shiftId;
        
        // 更新详细班次映射
        detailedShiftMapping[day] = {
          id: shift.id,
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          description: shift.description,
          timeRange: `${shift.startTime.slice(0, 5)}-${shift.endTime.slice(0, 5)}`
        };
      }
    }
    
    // 添加班次映射到排班记录
    updatedSchedule.setDataValue('shift_mapping', shiftMapping);
    updatedSchedule.setDataValue('detailed_shift_mapping', detailedShiftMapping);
    
    res.json({
      code: 200,
      data: updatedSchedule,
      message: '排班创建或更新成功'
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    
    console.error('创建或更新排班时出错:', error);
    res.status(500).json({
      code: 500,
      message: '创建或更新排班失败',
      error: error.message
    });
  }
});

// 批量职工排班创建或更新
router.post('/batchSchedule', async (req, res) => {
  // 使用事务确保数据一致性
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      schedules, // 批量排班数据，格式: [{employeeId, departmentId, shiftAssignments}, ...]
      departmentId // 可选的公共部门ID，如果所有职工都属于同一部门
    } = req.body;
    
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '缺少排班数据或格式错误'
      });
    }
    
    const results = [];
    const errors = [];
    
    // 处理每个职工的排班
    for (const scheduleData of schedules) {
      try {
        const employeeId = scheduleData.employeeId;
        const empDepartmentId = scheduleData.departmentId || departmentId;
        const shiftAssignments = scheduleData.shiftAssignments || [];
        
        if (!employeeId || !empDepartmentId) {
          errors.push({
            employeeId,
            message: '缺少必要的职工或部门信息'
          });
          continue;
        }
        
        // 初始化星期字段的值
        let weekDays = {
          monday: null,
          tuesday: null,
          wednesday: null,
          thursday: null,
          friday: null,
          saturday: null,
          sunday: null
        };
        
        // 将班次分配数组转换为映射格式
        if (shiftAssignments && shiftAssignments.length > 0) {
          shiftAssignments.forEach(assignment => {
            if (assignment.day && weekDays.hasOwnProperty(assignment.day)) {
              weekDays[assignment.day] = assignment.shiftId === 0 ? null : assignment.shiftId;
            }
          });
        }
        
        // 查找是否已存在该职工的排班
        let schedule = await Schedule.findOne({ 
          where: { employee_id: employeeId },
          transaction
        });
        
        if (schedule) {
          // 更新现有排班
          await schedule.update({
            ...weekDays,
            department_id: empDepartmentId
          }, { transaction });
        } else {
          // 创建新排班
          schedule = await Schedule.create({
            employee_id: employeeId,
            ...weekDays,
            department_id: empDepartmentId
          }, { transaction });
        }
        
        results.push({
          employeeId,
          scheduleId: schedule.id,
          status: 'success'
        });
      } catch (error) {
        errors.push({
          employeeId: scheduleData.employeeId,
          message: error.message,
          status: 'error'
        });
      }
    }
    
    // 如果所有操作都失败，回滚事务
    if (results.length === 0 && errors.length > 0) {
      await transaction.rollback();
      return res.status(500).json({
        code: 500,
        message: '所有排班操作均失败',
        errors
      });
    }
    
    // 提交事务
    await transaction.commit();
    
    // 获取所有更新后的排班信息
    const updatedSchedules = await Schedule.findAll({
      where: { 
        id: results.map(r => r.scheduleId) 
      },
      include: [{
        model: User,
        as: 'employee',
        attributes: { exclude: ['password'] }
      }]
    });
    
    // 获取所有班次信息
    const allShifts = await ShiftSetting.findAll({
      where: { isEnabled: true },
      attributes: ['id', 'name', 'startTime', 'endTime', 'description']
    });
    
    // 创建班次ID到班次详细信息的映射
    const shiftsById = {};
    allShifts.forEach(shift => {
      shiftsById[shift.id] = shift;
    });
    
    // 为每个排班添加班次映射
    const processedSchedules = updatedSchedules.map(schedule => {
      const weekDays = {
        monday: schedule.monday,
        tuesday: schedule.tuesday,
        wednesday: schedule.wednesday,
        thursday: schedule.thursday,
        friday: schedule.friday,
        saturday: schedule.saturday,
        sunday: schedule.sunday
      };
      
      // 初始化班次映射和时间映射
      const shiftMapping = {};
      const detailedShiftMapping = {};
      
      // 预处理排班数据中的班次ID
      for (const day of Object.keys(weekDays)) {
        const shiftId = schedule[day];
        if (shiftId && shiftsById[shiftId]) {
          const shift = shiftsById[shiftId];
          
          // 更新班次ID映射
          shiftMapping[day] = shiftId;
          
          // 更新详细班次映射
          detailedShiftMapping[day] = {
            id: shift.id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            description: shift.description,
            timeRange: `${shift.startTime.slice(0, 5)}-${shift.endTime.slice(0, 5)}`
          };
        }
      }
      
      // 添加班次映射到排班记录
      schedule.setDataValue('shift_mapping', shiftMapping);
      schedule.setDataValue('detailed_shift_mapping', detailedShiftMapping);
      
      return schedule;
    });
    
    res.json({
      code: 200,
      data: {
        schedules: processedSchedules,
        results,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `批量排班操作完成: 成功 ${results.length} 个, 失败 ${errors.length} 个`
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    
    console.error('批量创建或更新排班时出错:', error);
    res.status(500).json({
      code: 500,
      message: '批量创建或更新排班失败',
      error: error.message
    });
  }
});

// 分页查询职工排班信息（部门ID、员工姓名）
router.get('/schedulePage', async (req, res) => {
  try {
    const { page, size, departmentId } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedSize = parseInt(size, 10);
    const offset = (parsedPage - 1) * parsedSize;
    const schedules = await Schedule.findAndCountAll({ offset, limit: parsedSize, where: { departmentId }  });
    res.json({
      code: 200,
      data: schedules,
      message: '获取排班信息成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取排班信息失败',
      error: error.message
    });
  }
});

// 获取某一职工的排班信息
router.get('/schedule', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌'
      });
    }
    const { userId } = jwt.verify(token, process.env.JWT_SECRET || "yyjkn");
    
    // 准备查询条件
    const queryOptions = {
      where: { employee_id: userId },
      include: [{
        model: User,
        as: 'employee',
        attributes: { exclude: ['password'] },
        required: true
      }],
      attributes: [
        'id', 'employee_id', 'department_id',
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday',
        'createdAt', 'updatedAt'
      ]
    };
    
    
    const schedule = await Schedule.findOne(queryOptions);
    
    if (!schedule) {
      return res.status(404).json({
        code: 404,
        message: '未找到该职工的排班信息'
      });
    }
    
    // 获取所有班次信息，用于根据班次ID获取具体时间
    const allShifts = await ShiftSetting.findAll({
      where: { isEnabled: true },
      attributes: ['id', 'name', 'startTime', 'endTime', 'description']
    });
    
    // 创建班次ID到班次信息的映射
    const shiftMap = {};
    allShifts.forEach(shift => {
      shiftMap[shift.id] = shift;
    });
    
    // 初始化班次映射和时间映射
    const shiftMapping = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    };
    
    const timeMapping = {
      monday: schedule.monday,
      tuesday: schedule.tuesday,
      wednesday: schedule.wednesday,
      thursday: schedule.thursday,
      friday: schedule.friday,
      saturday: schedule.saturday,
      sunday: schedule.sunday
    };
    
    // 创建包含班次详细信息的映射
    const detailedShiftMapping = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    };
    
    // 创建班次ID到班次详细信息的映射
    const shiftsById = {};
    allShifts.forEach(shift => {
      shiftsById[shift.id] = shift;
    });
    
    // 预处理排班数据中的班次ID
    // 排班数据中的班次ID可能以字符串形式存储，如"1", "2"
    for (const day of Object.keys(timeMapping)) {
      const shiftIdStr = schedule[day];
      if (shiftIdStr && shiftIdStr !== 'null') {
        try {
          // 尝试将字符串转换为数字
          const shiftId = parseInt(shiftIdStr, 10);
          if (!isNaN(shiftId) && shiftsById[shiftId]) {
            const shift = shiftsById[shiftId];
            
            // 更新班次ID映射
            shiftMapping[day] = shiftId;
            
            // 更新详细班次映射
            detailedShiftMapping[day] = {
              id: shift.id,
              name: shift.name,
              startTime: shift.startTime,
              endTime: shift.endTime,
              description: shift.description,
              timeRange: `${shift.startTime.slice(0, 5)}-${shift.endTime.slice(0, 5)}`
            };
            
            // 更新时间映射
            timeMapping[day] = `${shift.startTime.slice(0, 5)}-${shift.endTime.slice(0, 5)}`;
          }
        } catch (e) {
          console.error(`解析${day}的班次ID时出错:`, e);
        }
      }
    }
    
    try {
      // 对于每个工作日，如果已经有班次ID映射，就不需要再处理
      for (const day of Object.keys(timeMapping)) {
        if (!detailedShiftMapping[day]) {
          // 如果还没有详细班次映射，尝试从时间字符串推断
          const timeValue = timeMapping[day];
          if (timeValue && timeValue !== 'null') {
            // 尝试根据时间字符串找到匹配的班次
            const matchingShift = allShifts.find(shift => {
              if (shift && shift.startTime && shift.endTime) {
                const shiftTimeRange = `${shift.startTime.slice(0, 5)}-${shift.endTime.slice(0, 5)}`;
                return shiftTimeRange === timeValue;
              }
              return false;
            });
            
            if (matchingShift) {
              shiftMapping[day] = matchingShift.id;
              detailedShiftMapping[day] = {
                id: matchingShift.id,
                name: matchingShift.name,
                startTime: matchingShift.startTime,
                endTime: matchingShift.endTime,
                description: matchingShift.description,
                timeRange: timeValue
              };
            }
          }
        }
      }
    } catch (error) {
      console.error('处理班次映射时出错:', error);
      // 出错时不中断执行，继续返回可用数据
    }
    
    // 更新排班记录中的时间信息
    schedule.setDataValue('monday', timeMapping.monday);
    schedule.setDataValue('tuesday', timeMapping.tuesday);
    schedule.setDataValue('wednesday', timeMapping.wednesday);
    schedule.setDataValue('thursday', timeMapping.thursday);
    schedule.setDataValue('friday', timeMapping.friday);
    schedule.setDataValue('saturday', timeMapping.saturday);
    schedule.setDataValue('sunday', timeMapping.sunday);
    
    // 添加班次映射到排班记录
    schedule.setDataValue('shift_mapping', shiftMapping);
    schedule.setDataValue('detailed_shift_mapping', detailedShiftMapping);
    
    // 返回响应
    res.json({
      code: 200,
      data: schedule,
      message: '获取排班信息成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取排班信息失败',
      error: error.message
    });
  }
});

// 获取对应部门下的职工排班信息
router.get('/getSchListBydepartment/:departmentId', async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    // 先找到该部门的所有用户，返回除密码外的所有基本信息
    const users = await User.findAll({
      where: { department_id: departmentId },
      attributes: { exclude: ['password'] }
    });

    if (!users || users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '该部门下未找到任何用户'
      });
    }
    console.log("this are users",users)
    // 获取这些用户的排班信息
    const userIds = users.map(user => user.id);
    const schedules = await Schedule.findAll({
      where: { 
        employee_id: userIds 
      },
      include: [{
        model: User,
        as: 'employee',
        attributes: { exclude: ['password'] },
        required: true
      }],
      attributes: [
        'id', 'employee_id',
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday',
        'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // 处理排班数据
    let allUserSchedules = [];
    
    if (!schedules || schedules.length === 0) {
      // 情况1: 所有用户都没有排班记录，为全部用户创建空排班数据
      allUserSchedules = users.map(user => ({
        id: null,
        employee_id: user.id,
        employee: user,
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
        createdAt: null,
        updatedAt: null
      }));
    } else {
      // 情况2: 部分用户有排班记录，需要找出没有排班记录的用户并为他们创建空记录
      
      // 找出已有排班记录的用户ID
      const scheduledUserIds = schedules.map(schedule => schedule.employee_id);
      
      // 已有排班记录的用户，直接加入结果列表
      allUserSchedules = [...schedules];
      
      // 找出没有排班记录的用户
      const unscheduledUsers = users.filter(user => !scheduledUserIds.includes(user.id));
      
      // 为没有排班记录的用户创建空排班数据并加入结果列表
      const emptySchedules = unscheduledUsers.map(user => ({
        id: null,
        employee_id: user.id,
        employee: user,
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
        createdAt: null,
        updatedAt: null
      }));
      
      allUserSchedules = [...allUserSchedules, ...emptySchedules];
    }
    
    return res.json({
      code: 200,
      data: allUserSchedules,
      message: '获取部门排班信息成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取部门排班信息失败',
      error: error.message
    });
  }
});


module.exports = router;
