-- 药品库存表数据填充脚本
-- 创建日期: 2025-05-13
-- 根据药品基本信息生成库存数据

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE medicine_stocks;

-- 重置自增ID（可选，谨慎使用）
-- ALTER TABLE medicine_stocks AUTO_INCREMENT = 1;

-- 布洛芬缓释胶囊库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(1, '布洛芬缓释胶囊', 'BLF20240301', 350, '盒', '0.3g*12粒/盒', '2024-03-01', '2026-03-01', 'A区-01-01', 1, NOW(), NOW(), NOW()),
(1, '布洛芬缓释胶囊', 'BLF20240415', 280, '盒', '0.3g*12粒/盒', '2024-04-15', '2026-04-15', 'A区-01-02', 1, NOW(), NOW(), NOW());

-- 阿莫西林胶囊库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(2, '阿莫西林胶囊', 'AMX20240210', 420, '盒', '0.25g*24粒/盒', '2024-02-10', '2026-02-10', 'A区-02-01', 2, NOW(), NOW(), NOW()),
(2, '阿莫西林胶囊', 'AMX20240325', 380, '盒', '0.25g*24粒/盒', '2024-03-25', '2026-03-25', 'A区-02-02', 2, NOW(), NOW(), NOW());

-- 格列吡嗪片库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(3, '格列吡嗪片', 'GLP20240105', 180, '盒', '5mg*24片/盒', '2024-01-05', '2026-01-05', 'B区-01-01', 3, NOW(), NOW(), NOW()),
(3, '格列吡嗪片', 'GLP20240320', 220, '盒', '5mg*24片/盒', '2024-03-20', '2026-03-20', 'B区-01-02', 3, NOW(), NOW(), NOW());

-- 硝苯地平缓释片库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(4, '硝苯地平缓释片', 'XBD20240220', 300, '瓶', '10mg*50片/瓶', '2024-02-20', '2026-02-20', 'B区-02-01', 4, NOW(), NOW(), NOW()),
(4, '硝苯地平缓释片', 'XBD20240410', 270, '瓶', '10mg*50片/瓶', '2024-04-10', '2026-04-10', 'B区-02-02', 4, NOW(), NOW(), NOW());

-- 维生素C片库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(5, '维生素C片', 'VSC20240115', 520, '瓶', '0.1g*100片/瓶', '2024-01-15', '2026-01-15', 'C区-01-01', 5, NOW(), NOW(), NOW()),
(5, '维生素C片', 'VSC20240405', 480, '瓶', '0.1g*100片/瓶', '2024-04-05', '2026-04-05', 'C区-01-02', 5, NOW(), NOW(), NOW());

-- 盐酸氨溴索口服溶液库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(6, '盐酸氨溴索口服溶液', 'YSA20240310', 220, '瓶', '100ml/瓶', '2024-03-10', '2025-09-10', 'C区-02-01', 6, NOW(), NOW(), NOW()),
(6, '盐酸氨溴索口服溶液', 'YSA20240425', 190, '瓶', '100ml/瓶', '2024-04-25', '2025-10-25', 'C区-02-02', 6, NOW(), NOW(), NOW());

-- 复方丹参滴丸库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(7, '复方丹参滴丸', 'FFDS20240205', 320, '瓶', '27mg*180丸/瓶', '2024-02-05', '2026-02-05', 'D区-01-01', 7, NOW(), NOW(), NOW()),
(7, '复方丹参滴丸', 'FFDS20240330', 280, '瓶', '27mg*180丸/瓶', '2024-03-30', '2026-03-30', 'D区-01-02', 7, NOW(), NOW(), NOW());

-- 盐酸二甲双胍片库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(8, '盐酸二甲双胍片', 'YSEJ20240125', 380, '盒', '0.5g*60片/盒', '2024-01-25', '2026-01-25', 'D区-02-01', 8, NOW(), NOW(), NOW()),
(8, '盐酸二甲双胍片', 'YSEJ20240420', 350, '盒', '0.5g*60片/盒', '2024-04-20', '2026-04-20', 'D区-02-02', 8, NOW(), NOW(), NOW());

-- 阿托伐他汀钙片库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(9, '阿托伐他汀钙片', 'ATFT20240215', 200, '盒', '20mg*7片/盒', '2024-02-15', '2026-02-15', 'E区-01-01', 9, NOW(), NOW(), NOW()),
(9, '阿托伐他汀钙片', 'ATFT20240405', 180, '盒', '20mg*7片/盒', '2024-04-05', '2026-04-05', 'E区-01-02', 9, NOW(), NOW(), NOW());

-- 奥美拉唑肠溶胶囊库存记录
INSERT INTO medicine_stocks (medicine_id, medicine_name, batch_number, quantity, unit, specification, production_date, expiry_date, location, supplier_id, last_update_time, created_at, updated_at) 
VALUES 
(10, '奥美拉唑肠溶胶囊', 'AMLZ20240110', 320, '盒', '20mg*14粒/盒', '2024-01-10', '2026-01-10', 'E区-02-01', 10, NOW(), NOW(), NOW()),
(10, '奥美拉唑肠溶胶囊', 'AMLZ20240328', 290, '盒', '20mg*14粒/盒', '2024-03-28', '2026-03-28', 'E区-02-02', 10, NOW(), NOW(), NOW());
