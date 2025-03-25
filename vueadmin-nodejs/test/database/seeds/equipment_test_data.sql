-- 插入用户数据
INSERT INTO users 
(username, password, name, role_id, created_at, updated_at)
VALUES
('wangeng', '$2a$10$X/nxhAZgRnR/YZlGPu.zBe8XUbhqUB6T3.QBnxpzGv6jQvBG0qTXi', '王工程师', 2, NOW(), NOW()),
('lieng', '$2a$10$X/nxhAZgRnR/YZlGPu.zBe8XUbhqUB6T3.QBnxpzGv6jQvBG0qTXi', '李工程师', 2, NOW(), NOW()),
('zhangeng', '$2a$10$X/nxhAZgRnR/YZlGPu.zBe8XUbhqUB6T3.QBnxpzGv6jQvBG0qTXi', '张工程师', 2, NOW(), NOW()),
('zhaoeng', '$2a$10$X/nxhAZgRnR/YZlGPu.zBe8XUbhqUB6T3.QBnxpzGv6jQvBG0qTXi', '赵工程师', 2, NOW(), NOW()),
('qianeng', '$2a$10$X/nxhAZgRnR/YZlGPu.zBe8XUbhqUB6T3.QBnxpzGv6jQvBG0qTXi', '钱工程师', 2, NOW(), NOW());

-- 插入医疗设备测试数据
INSERT INTO medical_equipment 
(equipment_code, name, model, manufacturer, purchase_date, warranty_period, department, location, 
status, last_maintenance_date, next_maintenance_date, responsible_person, contact_number, 
purchase_price, service_life, description, created_at, updated_at)
VALUES
-- 放射科设备
('EQ001', 'X光机', 'XR-2000', '飞利浦医疗', '2024-01-01', '2027-01-01', '放射科', '1号楼3层',
'normal', '2024-03-01', '2024-06-01', '张医生', '13800138001',
150000.00, 8, 'DR数字化X光机，具有高清成像功能', NOW(), NOW()),

('EQ002', 'CT扫描仪', 'CT-8000', '西门子医疗', '2024-02-15', '2027-02-15', '放射科', '1号楼3层',
'maintenance', '2024-03-15', '2024-06-15', '李医生', '13800138002',
2000000.00, 10, '64排螺旋CT，具有低辐射特性', NOW(), NOW()),

-- 检验科设备
('EQ003', '全自动生化分析仪', 'AUTO-800', '罗氏诊断', '2024-01-20', '2027-01-20', '检验科', '2号楼2层',
'normal', '2024-03-10', '2024-06-10', '王医生', '13800138003',
300000.00, 5, '具有高通量分析能力，每小时处理800个样本', NOW(), NOW()),

-- 手术室设备
('EQ004', '手术无影灯', 'LED-500', '迈瑞医疗', '2024-03-01', '2027-03-01', '手术室', '3号楼4层',
'normal', '2024-03-20', '2024-06-20', '赵医生', '13800138004',
80000.00, 6, 'LED冷光源，多角度调节', NOW(), NOW()),

('EQ005', '麻醉机', 'AN-2000', '德尔格医疗', '2024-02-01', '2027-02-01', '手术室', '3号楼4层',
'scrapped', '2024-02-28', '2024-05-28', '钱医生', '13800138005',
200000.00, 7, '智能麻醉系统，具有实时监控功能', NOW(), NOW());

-- 插入设备维修记录测试数据
INSERT INTO equipment_maintenance 
(equipment_id, operator_id, operator_name, maintenance_type, start_date, end_date, maintenance_staff, 
fault_description, maintenance_details, parts_replaced, cost, status, result,
next_maintenance_date, maintenance_company, company_contact, company_phone,
warranty_covered, remarks, created_at, updated_at)
VALUES
-- X光机的维修记录
(1, 1, '王工程师', 'routine', '2024-03-01', '2024-03-01', '张工',
NULL, '例行检查和校准', NULL, 1000.00, 'completed', 'success',
'2024-06-01', '飞利浦医疗服务', '张工程师', '13900139001',
true, '设备运行正常，完成常规保养', NOW(), NOW()),

-- CT扫描仪的维修记录
(2, 2, '李工程师', 'repair', '2024-03-15', NULL, '王工',
'扫描成像不清晰', '检修成像系统，更换图像处理模块', '图像处理模块*1', 50000.00, 'in_progress', NULL,
'2024-06-15', '西门子维修中心', '王工程师', '13900139002',
true, '正在等待更换部件到货', NOW(), NOW()),

(2, 2, '李工程师', 'routine', '2024-02-15', '2024-02-15', '王工',
NULL, '定期检查和系统校准', NULL, 2000.00, 'completed', 'success',
'2024-05-15', '西门子维修中心', '王工程师', '13900139002',
true, '完成系统校准和性能测试', NOW(), NOW()),

-- 生化分析仪的维修记录
(3, 3, '张工程师', 'calibration', '2024-03-10', '2024-03-10', '李工',
NULL, '仪器校准和精度调整', NULL, 1500.00, 'completed', 'success',
'2024-06-10', '罗氏诊断服务', '李工程师', '13900139003',
true, '完成校准，各项指标正常', NOW(), NOW()),

-- 手术无影灯的维修记录
(4, 4, '赵工程师', 'routine', '2024-03-20', '2024-03-20', '刘工',
NULL, '灯泡检查和亮度调节', '备用灯泡*1', 3000.00, 'completed', 'success',
'2024-06-20', '迈瑞医疗服务', '刘工程师', '13900139004',
true, '更换备用灯泡，调节光照角度', NOW(), NOW()),

-- 麻醉机的维修记录
(5, 5, '钱工程师', 'repair', '2024-02-28', '2024-02-28', '周工',
'气路系统泄漏', '维修气路系统，更换密封圈', '密封圈套件*1', 5000.00, 'completed', 'failed',
'2024-05-28', '德尔格服务中心', '周工程师', '13900139005',
true, '维修后仍存在问题，建议报废处理', NOW(), NOW());
