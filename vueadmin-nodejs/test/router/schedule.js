const express = require('express');
const router = express.Router();
const Schedule = require('../database/models/Schedule');
const jwt = require('jsonwebtoken')
// 创建或更新排班
router.post('/schedule', async (req, res) => {
  try {
    const { employeeId, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;
    
    // 查找是否已存在该职工的排班
    let schedule = await Schedule.findOne({ where: { employeeId } });
    
    if (schedule) {
      // 更新现有排班
      await schedule.update({
        monday, tuesday, wednesday, thursday, friday, saturday, sunday
      });
    } else {
      // 创建新排班
      schedule = await Schedule.create({
        employeeId, monday, tuesday, wednesday, thursday, friday, saturday, sunday
      });
    }
    
    res.json({
      code: 200,
      data: schedule,
      message: '排班保存成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '排班保存失败',
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
router.get('/schedule ', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌'
      });
    }
    const { userId } = jwt.verify(token, process.env.JWT_SECRET || "yyjkn");
    
    const schedule = await Schedule.findOne({ where: { employeeId: userId } });
    
    if (!schedule) {
      return res.status(404).json({
        code: 404,
        message: '未找到该职工的排班信息'
      });
    }
    
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
router.get('/scheduleByDepartment', async (req, res) => {
  try {
    const { departmentId } = req.query;
    const userId = await User.findOne({
      where: { departmentId },
      attributes: ['id']
    });
    const schedules = await Schedule.findAll({ where: { employeeId: userId.id } });
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

// 获取对应部门下的职工排班信息
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const schedules = await Schedule.findAll({
      where: { departmentId },
      attributes: [
        'id', 'employeeId', 'employeeName', 'departmentId',
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday',
        'createdAt', 'updatedAt'
      ],
      order: [['employeeName', 'ASC']]
    });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '该部门下未找到任何排班信息'
      });
    }

    res.json({
      code: 200,
      data: schedules,
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
