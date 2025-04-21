INSERT INTO `roles` (`role_name`, `authoritys`, `description`, `created_at`, `updated_at`) VALUES
('管理员', 'ALL', '系统超级管理员，拥有所有权限', NOW(), NOW()),
('操作员', 'DEVICE_MANAGE,USER_VIEW', '负责设备管理和用户查看', NOW(), NOW()),
('访客', 'USER_VIEW', '只读权限，无法进行操作', NOW(), NOW()),
('财务', 'FINANCE_VIEW,FINANCE_EDIT', '负责财务相关操作', NOW(), NOW()),
('技术支持', 'DEVICE_MANAGE,DEVICE_REPAIR', '负责技术支持和设备维修', NOW(), NOW());
