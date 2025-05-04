/**
 * 系统菜单配置
 * 用于定义系统菜单项
 */

export const systemMenus = [
  {
    name: 'sys',
    title: '系统管理',
    icon: 'el-icon-setting',
    children: [
      {
        name: 'User',
        title: '用户管理',
        icon: 'el-icon-user',
        path: '/sys/user'
      },
      {
        name: 'Role',
        title: '角色管理',
        icon: 'el-icon-s-check',
        path: '/sys/role'
      },
      {
        name: 'Menu',
        title: '菜单管理',
        icon: 'el-icon-menu',
        path: '/sys/menu'
      },
      {
        name: 'Equipment',
        title: '设备管理',
        icon: 'el-icon-cpu',
        path: '/sys/equipment'
      },
      {
        name: 'MaintenanceOrder',
        title: '维修工单',
        icon: 'el-icon-document',
        path: '/sys/maintenance-order'
      },
      {
        name: 'SqlAgent',
        title: 'SQL智能查询',
        icon: 'el-icon-search',
        path: '/sys/sql-agent'
      }
    ]
  },
  {
    name: 'log',
    title: '日志管理',
    icon: 'el-icon-document',
    children: [
      {
        name: 'LoginLog',
        title: '登录日志',
        icon: 'el-icon-date',
        path: '/log/login'
      },
      {
        name: 'OperationLog',
        title: '操作日志',
        icon: 'el-icon-tickets',
        path: '/log/operation'
      }
    ]
  }
];

/**
 * 获取系统菜单
 * @returns {Array} 系统菜单数组
 */
export const getSystemMenus = () => {
  return systemMenus;
};

/**
 * 根据用户权限过滤菜单
 * @param {Array} menus 菜单数组
 * @param {Array} permissions 权限数组
 * @returns {Array} 过滤后的菜单数组
 */
export const filterMenusByPermissions = (menus, permissions) => {
  if (!permissions || permissions.length === 0) {
    return [];
  }
  
  return menus.filter(menu => {
    // 过滤子菜单
    if (menu.children && menu.children.length > 0) {
      menu.children = menu.children.filter(child => {
        return permissions.includes(child.name);
      });
      
      // 如果子菜单都被过滤掉了，则父菜单也不显示
      return menu.children.length > 0;
    }
    
    return permissions.includes(menu.name);
  });
};
