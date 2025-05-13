-- 用户表数据填充脚本
-- 创建日期: 2025-05-13
-- 包含各部门职工信息

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE users;

-- 重置自增ID（可选，谨慎使用）
-- ALTER TABLE users AUTO_INCREMENT = 1;

-- 系统管理员
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'admin', 
    '13800000001', 
    '110101199001010001', 
    -- 密码为 admin123 使用bcrypt加密
    '$2a$12$xRDqnWbXKFh.RpnbnmJYRu1W0XFWBOGjJWKYEJJVVCWNYTxTi/Opm', 
    '系统管理员', 
    '男', 
    '1990-01-01', 
    '北京市海淀区',
    1, -- 系统管理员角色
    24, -- 信息技术部
    NOW(), 
    NOW()
);

-- 内科主任
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'neike_zhuren', 
    '13800000002', 
    '110101196505050002', 
    -- 密码为 password123 使用bcrypt加密
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '张医生', 
    '男', 
    '1965-05-05', 
    '北京市朝阳区',
    2, -- 医护人员角色
    1, -- 内科
    NOW(), 
    NOW()
);

-- 内科医生1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'neike_doctor1', 
    '13800000003', 
    '110101198007070003', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '李医生', 
    '女', 
    '1980-07-07', 
    '北京市西城区',
    2, -- 医护人员角色
    1, -- 内科
    NOW(), 
    NOW()
);

-- 内科护士1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'neike_nurse1', 
    '13800000004', 
    '110101199202020004', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '王护士', 
    '女', 
    '1992-02-02', 
    '北京市东城区',
    2, -- 医护人员角色
    1, -- 内科
    NOW(), 
    NOW()
);

-- 外科主任
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'waike_zhuren', 
    '13800000005', 
    '110101196303030005', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '赵主任', 
    '男', 
    '1963-03-03', 
    '北京市海淀区',
    2, -- 医护人员角色
    2, -- 外科
    NOW(), 
    NOW()
);

-- 外科医生1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'waike_doctor1', 
    '13800000006', 
    '110101198505050006', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '钱医生', 
    '男', 
    '1985-05-05', 
    '北京市朝阳区',
    2, -- 医护人员角色
    2, -- 外科
    NOW(), 
    NOW()
);

-- 外科护士1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'waike_nurse1', 
    '13800000007', 
    '110101199008080007', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '孙护士', 
    '女', 
    '1990-08-08', 
    '北京市丰台区',
    2, -- 医护人员角色
    2, -- 外科
    NOW(), 
    NOW()
);

-- 妇产科主任
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'fuchan_zhuren', 
    '13800000008', 
    '110101196707070008', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '周主任', 
    '女', 
    '1967-07-07', 
    '北京市西城区',
    2, -- 医护人员角色
    3, -- 妇产科
    NOW(), 
    NOW()
);

-- 妇产科医生1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'fuchan_doctor1', 
    '13800000009', 
    '110101198303030009', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '吴医生', 
    '女', 
    '1983-03-03', 
    '北京市朝阳区',
    2, -- 医护人员角色
    3, -- 妇产科
    NOW(), 
    NOW()
);

-- 儿科主任
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'erke_zhuren', 
    '13800000010', 
    '110101196606060010', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '郑主任', 
    '女', 
    '1966-06-06', 
    '北京市海淀区',
    2, -- 医护人员角色
    4, -- 儿科
    NOW(), 
    NOW()
);

-- 急诊科医生
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'jizhen_doctor', 
    '13800000011', 
    '110101198808080011', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '冯医生', 
    '男', 
    '1988-08-08', 
    '北京市朝阳区',
    2, -- 医护人员角色
    5, -- 急诊科
    NOW(), 
    NOW()
);

-- 骨科医生
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'guke_doctor', 
    '13800000012', 
    '110101198404040012', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '陈医生', 
    '男', 
    '1984-04-04', 
    '北京市海淀区',
    2, -- 医护人员角色
    6, -- 骨科
    NOW(), 
    NOW()
);

-- 心脏内科医生
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'xinzang_doctor', 
    '13800000013', 
    '110101198101010013', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '楚医生', 
    '男', 
    '1981-01-01', 
    '北京市朝阳区',
    2, -- 医护人员角色
    8, -- 心脏内科
    NOW(), 
    NOW()
);

-- 眼科医生
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'yanke_doctor', 
    '13800000014', 
    '110101198909090014', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '魏医生', 
    '女', 
    '1989-09-09', 
    '北京市海淀区',
    2, -- 医护人员角色
    12, -- 眼科
    NOW(), 
    NOW()
);

-- 放射科医生
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'fangshe_doctor', 
    '13800000015', 
    '110101198707070015', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '蒋医生', 
    '男', 
    '1987-07-07', 
    '北京市朝阳区',
    2, -- 医护人员角色
    17, -- 放射科
    NOW(), 
    NOW()
);

-- 药剂科主管
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'yaoji_manager', 
    '13800000016', 
    '110101197505050016', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '沈主管', 
    '女', 
    '1975-05-05', 
    '北京市西城区',
    5, -- 药房管理员角色
    19, -- 药剂科
    NOW(), 
    NOW()
);

-- 药剂师1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'yaoji_staff1', 
    '13800000017', 
    '110101199010100017', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '韩药师', 
    '女', 
    '1990-10-10', 
    '北京市朝阳区',
    5, -- 药房管理员角色
    19, -- 药剂科
    NOW(), 
    NOW()
);

-- 医疗设备部主管
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'equipment_manager', 
    '13800000018', 
    '110101197010100018', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '杨主管', 
    '男', 
    '1970-10-10', 
    '北京市海淀区',
    4, -- 医疗设备管理员角色
    21, -- 医疗设备部
    NOW(), 
    NOW()
);

-- 医疗设备技术员1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'equipment_tech1', 
    '13800000019', 
    '110101199212120019', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '朱技术员', 
    '男', 
    '1992-12-12', 
    '北京市朝阳区',
    4, -- 医疗设备管理员角色
    21, -- 医疗设备部
    NOW(), 
    NOW()
);

-- 行政部主管
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'admin_manager', 
    '13800000020', 
    '110101196808080020', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '秦主管', 
    '女', 
    '1968-08-08', 
    '北京市西城区',
    3, -- 行政人员角色
    22, -- 行政部
    NOW(), 
    NOW()
);

-- 行政部职员1
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'admin_staff1', 
    '13800000021', 
    '110101199505050021', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '尹职员', 
    '女', 
    '1995-05-05', 
    '北京市朝阳区',
    3, -- 行政人员角色
    22, -- 行政部
    NOW(), 
    NOW()
);

-- 财务部主管
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'finance_manager', 
    '13800000022', 
    '110101197303030022', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '许主管', 
    '女', 
    '1973-03-03', 
    '北京市海淀区',
    3, -- 行政人员角色
    23, -- 财务部
    NOW(), 
    NOW()
);

-- 信息技术部技术员
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'it_staff', 
    '13800000023', 
    '110101199404040023', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '何技术员', 
    '男', 
    '1994-04-04', 
    '北京市朝阳区',
    1, -- 系统管理员角色
    24, -- 信息技术部
    NOW(), 
    NOW()
);

-- 数据分析师
INSERT INTO users (username, phone, identity, password, realname, gender, birth_date, address, role_id, department_id, created_at, updated_at) 
VALUES (
    'data_analyst', 
    '13800000024', 
    '110101199111110024', 
    '$2a$12$OlFXCUz.0N6UQ.16k9Vh6.GR8rZ/R/i/Y1CJhwKQJTkOZ6Ae2PsOe', 
    '吕分析师', 
    '男', 
    '1991-11-11', 
    '北京市海淀区',
    6, -- 数据分析师角色
    24, -- 信息技术部
    NOW(), 
    NOW()
);
