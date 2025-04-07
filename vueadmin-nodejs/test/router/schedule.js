const express = require('express');
const router = express.Router();
const Schedule = require('../database/models/Schedule');

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

// 获取职工排班信息
router.get('/schedule/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const schedule = await Schedule.findOne({ where: { employeeId } });
    
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

module.exports = router;
