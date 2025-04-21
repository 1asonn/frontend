const { Role, Department } = require('./database/models');

async function simulateRegisterCheck() {
  try {
    console.log('===== 角色表检查 =====');
    // 查询所有角色
    const roles = await Role.findAll();
    console.log(`角色表中有 ${roles.length} 条记录`);
    
    // 打印所有角色
    roles.forEach(role => {
      console.log(`ID: ${role.id}, 名称: ${role.role_name}, 权限: ${role.authoritys}, 描述: ${role.description || '无'}`);
    });
    
    console.log('\n===== 部门表检查 =====');
    // 查询所有部门
    const departments = await Department.findAll();
    console.log(`部门表中有 ${departments.length} 条记录`);
    
    // 打印所有部门
    departments.forEach(dept => {
      console.log(`ID: ${dept.id}, 名称: ${dept.name}, 描述: ${dept.description || '无'}`);
    });
    
    console.log('\n===== 注册参数检查 =====');
    // 模拟注册时常用的角色ID
    const testRoleIds = [1, 2, 3];
    
    for (const roleId of testRoleIds) {
      console.log(`\n检查角色ID: ${roleId}`);
      // 使用findByPk查询角色
      const role = await Role.findByPk(roleId);
      if (role) {
        console.log(`✓ 找到角色: ${role.role_name}`);
      } else {
        console.log(`✗ 未找到角色ID为 ${roleId} 的记录`);
      }
      
      // 使用字符串形式的ID查询 (模拟前端传递字符串ID)
      const roleWithStringId = await Role.findByPk(String(roleId));
      if (roleWithStringId) {
        console.log(`✓ 使用字符串ID '${roleId}' 找到角色: ${roleWithStringId.role_name}`);
      } else {
        console.log(`✗ 使用字符串ID '${roleId}' 未找到角色`);
        console.log(`  这可能是问题所在! 前端传递的ID可能是字符串格式`);
      }
    }
    
  } catch (error) {
    console.error('检查过程中出错:', error);
  } finally {
    process.exit(0);
  }
}

simulateRegisterCheck();
