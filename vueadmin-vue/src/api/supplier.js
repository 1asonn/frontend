import request from '../axios.js'

// 获取供应商列表（分页）
export function getSupplierList(params) {
  return request({
    url: '/supplier/getSupplierList',
    method: 'get',
    params
  })
}

// 获取供应商详情
export function getSupplierById(id) {
  return request({
    url: `/supplier/getSupplierById/${id}`,
    method: 'get'
  })
}

// 创建供应商
export function createSupplier(data) {
  return request({
    url: '/supplier/createSupplier',
    method: 'post',
    data
  })
}

// 更新供应商
export function updateSupplier(id, data) {
  return request({
    url: `/supplier/updateSupplier/${id}`,
    method: 'put',
    data
  })
}

// 删除供应商
export function deleteSupplier(id) {
  return request({
    url: `/supplier/deleteSupplier/${id}`,
    method: 'delete'
  })
}

// 获取所有供应商（不分页，用于下拉选择）
export function getAllSuppliers() {
  return request({
    url: '/supplier/getAllSuppliers',
    method: 'get'
  })
}