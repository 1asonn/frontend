const { Role } = require('./database/models');

async function debugRole() {
  try {
    // 1. 查询所有角色
    const allRoles = await Role.findAll();
    console.log('所有角色数量:', allRoles.length);
    
    if (allRoles.length > 0) {
      console.log('\n角色列表:');
      allRoles.forEach(role => {
        console.log(`ID: ${role.id}, 名称: ${role.role_name}, 权限: ${role.authoritys}`);
      });
    } else {
      console.log('警告: 角色表中没有数据!');
    }
    
    // 2. 测试通过ID查询角色 (模拟注册时的查询)
    // 尝试查询ID为1的角色
    console.log('\n尝试查询ID为1的角色:');
    const role1 = await Role.findByPk(1);
    console.log('结果:', role1 ? `找到角色: ${role1.role_name}` : '未找到角色');
    
    // 尝试查询ID为2的角色
    console.log('\n尝试查询ID为2的角色:');
    const role2 = await Role.findByPk(2);
    console.log('结果:', role2 ? `找到角色: ${role2.role_name}` : '未找到角色');
    
    // 3. 测试通过角色名查询
    if (allRoles.length > 0) {
      const firstRoleName = allRoles[0].role_name;
      console.log(`\n尝试通过名称查询: "${firstRoleName}"`);
      const roleByName = await Role.findOne({ where: { role_name: firstRoleName } });
      console.log('结果:', roleByName ? `找到角色ID: ${roleByName.id}` : '未找到角色');
    }
    
  } catch (error) {
    console.error('调试角色时出错:', error);
  } finally {
    process.exit(0);
  }
}

debugRole();
