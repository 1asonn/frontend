-- 角色表数据填充脚本
-- 创建日期: 2025-05-13
-- 包含系统管理员、医护人员、行政人员、医疗设备管理员等角色

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE roles;

-- 重置自增ID（可选，谨慎使用）
-- ALTER TABLE roles AUTO_INCREMENT = 1;

-- 系统管理员角色
INSERT INTO roles (role_name, authoritys, description, created_at, updated_at) 
VALUES (
    '系统管理员', 
    '["user:manage", "role:manage", "department:manage", "system:config", "logs:view", "patient:manage", "medicine:manage", "equipment:manage", "schedule:manage", "maintenance:manage", "files:manage", "report:view"]', 
    '系统最高权限管理员，可以管理所有系统功能和数据',
    NOW(), 
    NOW()
);

-- 医护人员角色
INSERT INTO roles (role_name, authoritys, description, created_at, updated_at) 
VALUES (
    '医护人员', 
    '["patient:view", "patient:add", "patient:edit", "medicalRecord:manage", "medicine:view", "medicine:use", "schedule:view", "files:view", "files:upload"]', 
    '医生和护士等医疗专业人员，负责患者诊疗和医疗记录管理',
    NOW(), 
    NOW()
);

-- 行政人员角色
INSERT INTO roles (role_name, authoritys, description, created_at, updated_at) 
VALUES (
    '行政人员', 
    '["department:view", "user:view", "schedule:view", "schedule:edit", "report:view", "files:view", "files:upload", "supplier:manage"]', 
    '负责行政事务、人员排班和基础数据管理的工作人员',
    NOW(), 
    NOW()
);

-- 医疗设备管理员角色
INSERT INTO roles (role_name, authoritys, description, created_at, updated_at) 
VALUES (
    '医疗设备管理员', 
    '["equipment:view", "equipment:add", "equipment:edit", "equipment:delete", "maintenance:manage", "supplier:view", "files:view", "files:upload"]', 
    '负责医疗设备的管理、维护和保养工作',
    NOW(), 
    NOW()
);

-- 药房管理员角色
INSERT INTO roles (role_name, authoritys, description, created_at, updated_at) 
VALUES (
    '药房管理员', 
    '["medicine:view", "medicine:add", "medicine:edit", "medicine:delete", "medicineStock:manage", "medicineTransaction:manage", "supplier:view", "files:view", "files:upload"]', 
    '负责药品库存管理、采购和发放工作',
    NOW(), 
    NOW()
);

-- 数据分析师角色
INSERT INTO roles (role_name, authoritys, description, created_at, updated_at) 
VALUES (
    '数据分析师', 
    '["report:view", "report:export", "dataAnalyze:manage", "patient:view", "medicine:view", "equipment:view", "files:view"]', 
    '负责医疗数据分析和报表生成工作',
    NOW(), 
    NOW()
);
