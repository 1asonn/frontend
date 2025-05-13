-- 医院部门数据填充脚本
-- 创建日期: 2025-05-13
-- 包含医院常见科室部门

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE departments;

-- 重置自增ID（可选，谨慎使用）
-- ALTER TABLE departments AUTO_INCREMENT = 1;

-- 内科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '内科', 
    '负责内科疾病的诊断和治疗，包括心脏病、肺病、消化系统疾病等',
    NOW(), 
    NOW()
);

-- 外科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '外科', 
    '负责外科手术和治疗，包括普通外科、骨科、神经外科等',
    NOW(), 
    NOW()
);

-- 妇产科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '妇产科', 
    '专门处理女性生殖系统疾病和孕产妇保健',
    NOW(), 
    NOW()
);

-- 儿科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '儿科', 
    '专门负责儿童疾病的诊断和治疗',
    NOW(), 
    NOW()
);

-- 急诊科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '急诊科', 
    '处理需要紧急医疗救助的患者',
    NOW(), 
    NOW()
);

-- 骨科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '骨科', 
    '专门处理骨骼、关节、肌肉等运动系统疾病',
    NOW(), 
    NOW()
);

-- 神经内科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '神经内科', 
    '诊断和治疗中枢神经系统、周围神经系统及肌肉疾病',
    NOW(), 
    NOW()
);

-- 心脏内科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '心脏内科', 
    '专门处理心脏及血管系统疾病',
    NOW(), 
    NOW()
);

-- 呼吸内科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '呼吸内科', 
    '诊断和治疗呼吸系统疾病',
    NOW(), 
    NOW()
);

-- 消化内科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '消化内科', 
    '专门处理消化系统疾病',
    NOW(), 
    NOW()
);

-- 泌尿外科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '泌尿外科', 
    '诊断和治疗泌尿系统疾病',
    NOW(), 
    NOW()
);

-- 眼科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '眼科', 
    '专门处理眼部疾病和视力问题',
    NOW(), 
    NOW()
);

-- 耳鼻喉科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '耳鼻喉科', 
    '诊断和治疗耳、鼻、喉及相关头颈部位疾病',
    NOW(), 
    NOW()
);

-- 皮肤科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '皮肤科', 
    '专门处理皮肤疾病和皮肤健康问题',
    NOW(), 
    NOW()
);

-- 精神科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '精神科', 
    '诊断和治疗精神疾病和心理健康问题',
    NOW(), 
    NOW()
);

-- 肿瘤科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '肿瘤科', 
    '专门处理各类肿瘤疾病',
    NOW(), 
    NOW()
);

-- 放射科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '放射科', 
    '负责医学影像检查和诊断',
    NOW(), 
    NOW()
);

-- 检验科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '检验科', 
    '负责各类医学检验和化验',
    NOW(), 
    NOW()
);

-- 药剂科
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '药剂科', 
    '负责药品管理、调配和发放',
    NOW(), 
    NOW()
);

-- 护理部
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '护理部', 
    '负责全院护理工作的管理和协调',
    NOW(), 
    NOW()
);

-- 医疗设备部
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '医疗设备部', 
    '负责医疗设备的管理、维护和保养',
    NOW(), 
    NOW()
);

-- 行政部
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '行政部', 
    '负责医院日常行政事务和人事管理',
    NOW(), 
    NOW()
);

-- 财务部
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '财务部', 
    '负责医院财务管理和会计工作',
    NOW(), 
    NOW()
);

-- 信息技术部
INSERT INTO departments (name, description, created_at, updated_at) 
VALUES (
    '信息技术部', 
    '负责医院信息系统的开发、维护和管理',
    NOW(), 
    NOW()
);
