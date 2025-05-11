import request from '../axios.js'

// 获取部门列表
export function getDepartmentList(params) {
  return request({
    url: '/department/list',
    method: 'get',
    params
  })
}

// 获取部门详情
export function getDepartmentById(id) {
  return request({
    url: `/department/${id}`,
    method: 'get'
  })
}

// 创建部门
export function createDepartment(data) {
  return request({
    url: '/department/add',
    method: 'post',
    data
  })
}

// 更新部门
export function updateDepartment(id, data) {
  return request({
    url: `/department/${id}`,
    method: 'put',
    data
  })
}

// 删除部门
export function deleteDepartment(id) {
  return request({
    url: `/department/${id}`,
    method: 'delete'
  })
}

// 修改部门状态
export function changeDepartmentStatus(id, data) {
  // 注意：根据后端API，状态修改通过通用的更新接口实现
  return updateDepartment(id, data)
}