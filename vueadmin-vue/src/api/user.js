import request from '../axios.js'

// 获取用户列表（分页）
export function getUserList(params) {
  return request({
    url: '/user/getUserList',
    method: 'get',
    params
  })
}

// 获取所有用户（用于下拉选择）
export function getAllUsers() {
  return request({
    url: '/user/getAllUsers',
    method: 'get'
  })
}

// 获取用户详情
export function getUserById(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/user/add',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(id, data) {
  return request({
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}
