-- 供应商表数据填充脚本
-- 创建日期: 2025-05-13
-- 根据药品制造商信息生成供应商数据

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE suppliers;

-- 重置自增ID（可选，谨慎使用）
-- ALTER TABLE suppliers AUTO_INCREMENT = 1;

-- 供应商数据
INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(1, '上海强生制药有限公司', '张经理', '13901234567', '上海市浦东新区张江高科技园区龙东大道1号', '布洛芬缓释胶囊主要供应商，合作5年以上', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(2, '哈药集团制药总厂', '李经理', '13802345678', '黑龙江省哈尔滨市南岗区哈药路418号', '阿莫西林胶囊主要供应商，质量稳定可靠', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(3, '北京诺华制药有限公司', '王总监', '13903456789', '北京市昌平区科技园区创新路8号', '格列吡嗪片供应商，国际知名药企', 1, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(4, '德国拜耳医药保健有限公司', 'Michael Schmidt', '13904567890', '北京市朝阳区建国路2号', '硝苯地平缓释片供应商，进口药品', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(5, '东北制药集团有限责任公司', '赵主管', '13905678901', '辽宁省沈阳市铁西区重工南街38号', '维生素C片主要供应商，价格合理', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(6, '勃林格殷格翰制药有限公司', '钱经理', '13906789012', '上海市浦东新区张江高科技园区盛夏路399号', '盐酸氨溴索口服溶液供应商，德国品牌', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(7, '天士力制药集团股份有限公司', '孙总监', '13907890123', '天津市北辰区普济河东道2号', '复方丹参滴丸主要供应商，中药现代化企业', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(8, '中美上海施贵宝制药有限公司', '周经理', '13908901234', '上海市闵行区剑川路1528号', '盐酸二甲双胍片供应商，中美合资企业', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(9, '辉瑞制药有限公司', 'John Smith', '13909012345', '上海市浦东新区张江高科技园区李冰路288号', '阿托伐他汀钙片供应商，全球知名药企', 76, NOW(), NOW());

INSERT INTO suppliers (id, name, contact_person, contact_phone, address, notes, created_by, created_at, updated_at) 
VALUES 
(10, '阿斯利康制药有限公司', 'David Johnson', '13900123456', '江苏省无锡市新区长江路7号', '奥美拉唑肠溶胶囊供应商，英国跨国制药公司', 76, NOW(), NOW());
