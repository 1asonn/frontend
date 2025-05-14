// src/routes/medicalRecordRoutes.js

const express = require('express');
const router = express.Router();

// 引入模型
const MedicalRecord = require('../database/models/MedicalRecord');
const User = require('../database/models/user');
const { sequelize } = require('../database/init.js');

// 获取医疗记录列表
router.get('/medical_records', async (req, res) => {
    try {
       const records = await MedicalRecord.findAll({
           include: [{
               model: User,
               as: 'doctor',
               attributes: ['id', 'realname']
           }]
       });
       res.status(200).json(records);
   } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ message: 'Error fetching medical records' });
    }
});

// 获取与特定 patientId 相关联的所有医疗记录
router.get('/medical_records/:patientId', async (req, res) => {
    try {
      const records = await MedicalRecord.findAll({
       where: {
         patientId: req.params.patientId // 通过外键 patientId 获取记录
       },
       include: [{
           model: User,
           as: 'doctor',
           attributes: ['id', 'realname']
       }]
     });
     if (records.length > 0) {
        res.status(200).json(records);
      } else {
        res.status(404).json({ message: 'No records found for the given patientId'});
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      res.status(500).json({ message: 'Error fetching medical records' });
    }
  });

// 创建新的医疗记录
router.post('/medical_records', async (req, res) => {
    try {
       const newRecord = await MedicalRecord.create(req.body);
       res.status(201).json(newRecord);
   } catch (error) {
        console.error('Error creating medical record:', error);
        res.status(500).json({ message: 'Error creating medical record' });
    }
});

// 更新医疗记录
router.put('/medical_records/:id', async (req, res) => {
    try {
       const [updatedCount] = await MedicalRecord.update(req.body, {
           where: { recordId: req.params.id }
       });
       if (updatedCount > 0) {
            res.status(200).json({ message: 'Medical record updated successfully' });
        } else {
            res.status(404).json({ message: 'Medical record not found' });
        }
   } catch (error) {
        console.error('Error updating medical record:', error);
        res.status(500).json({ message: 'Error updating medical record' });
    }
});

// 删除医疗记录
router.delete('/medical_records/:id', async (req, res) => {
    try {
       const [deletedCount] = await MedicalRecord.destroy({
           where: { recordId: req.params.id }
       });
       if (deletedCount > 0) {
            res.status(200).json({ message: 'Medical record deleted successfully' });
        } else {
            res.status(404).json({ message: 'Medical record not found' });
        }
   } catch (error) {
        console.error('Error deleting medical record:', error);
        res.status(500).json({ message: 'Error deleting medical record' });
    }
});

module.exports = router;