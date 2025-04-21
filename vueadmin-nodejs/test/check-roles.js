const { Role } = require('./database/models');

async function checkRoles() {
  try {
    // 查询所有角色
    const roles = await Role.findAll();
    console.log('角色总数:', roles.length);
    
    // 打印每个角色的详细信息
    roles.forEach(role => {
      console.log('ID:', role.id);
      console.log('角色名称:', role.role_name);
      console.log('权限:', role.authoritys);
      console.log('描述:', role.description);
      console.log('------------------------');
    });
  } catch (error) {
    console.error('查询角色出错:', error);
  }
}

checkRoles();
