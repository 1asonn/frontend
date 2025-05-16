const express = require('express');
const router = express.Router();
const ShiftSetting = require('../database/models/ShiftSetting');
const jwt = require('jsonwebtoken');

// 创建班次设置
router.post('/shift', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌'
      });
    }
    const { userId } = jwt.verify(token, process.env.JWT_SECRET || "yyjkn");

    const { name, startTime, endTime, description } = req.body;
    
    const shift = await ShiftSetting.create({
      name,
      startTime,
      endTime,
      description,
      createdBy: userId
    });
    
    res.json({
      code: 200,
      data: shift,
      message: '班次设置创建成功'
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        code: 400,
        message: '班次名称已存在'
      });
    }
    res.status(500).json({
      code: 500,
      message: '班次设置创建失败',
      error: error.message
    });
  }
});

// 获取所有班次设置（分页）
router.get('/shifts', async (req, res) => {
  try {
    const { page = 1, size = 20 } = req.query;
    const offset = (page - 1) * size;
    
    const shifts = await ShiftSetting.findAndCountAll({
      offset,
      limit: parseInt(size),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'startTime', 'endTime', 'description', 'isEnabled', 'createdAt']
    });
    
    res.json({
      code: 200,
      data: shifts,
      message: '获取班次设置列表成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取班次设置列表失败',
      error: error.message
    });
  }
});

// 获取单个班次设置详情
router.get('/shift/:id', async (req, res) => {
  try {
    const shift = await ShiftSetting.findByPk(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        code: 404,
        message: '未找到该班次设置'
      });
    }
    
    res.json({
      code: 200,
      data: shift,
      message: '获取班次设置成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取班次设置失败',
      error: error.message
    });
  }
});

// 更新班次设置
router.put('/shift/:id', async (req, res) => {
  try {
    const { name, startTime, endTime, description, isEnabled } = req.body;
    const shift = await ShiftSetting.findByPk(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        code: 404,
        message: '未找到该班次设置'
      });
    }
    
    await shift.update({
      name,
      startTime,
      endTime,
      description,
      isEnabled
    });
    
    res.json({
      code: 200,
      data: shift,
      message: '班次设置更新成功'
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        code: 400,
        message: '班次名称已存在'
      });
    }
    res.status(500).json({
      code: 500,
      message: '班次设置更新失败',
      error: error.message
    });
  }
});

// 删除班次设置
router.delete('/shift/:id', async (req, res) => {
  try {
    const shift = await ShiftSetting.findByPk(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        code: 404,
        message: '未找到该班次设置'
      });
    }
    
    await shift.destroy();
    
    res.json({
      code: 200,
      message: '班次设置删除成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '班次设置删除失败',
      error: error.message
    });
  }
});

// 获取所有启用的班次设置（不分页）
router.get('/shifts/enabled', async (req, res) => {
  try {
    const shifts = await ShiftSetting.findAll({
      where: { isEnabled: true },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'startTime', 'endTime', 'description']
    });
    
    res.json({
      code: 200,
      data: shifts,
      message: '获取启用的班次设置成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取启用的班次设置失败',
      error: error.message
    });
  }
});

module.exports = router;
