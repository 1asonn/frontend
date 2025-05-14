import request from '../axios.js'

// 获取药品列表
export function getMedicineList(params) {
  return request({
    url: '/medicine',
    method: 'get',
    params
  })
}

// 获取供应商列表
export function getSupplierList(params) {
  return request({
    url: '/medicine/supplier',
    method: 'get',
    params
  })
}

// ================ 药品库存管理 ================

// 获取药品库存列表
export function getStockList(params) {
  return request({
    url: '/medicineTransaction/getStockList',
    method: 'get',
    params
  })
}

// 获取药品库存详情
export function getStockDetail(id) {
  return request({
    url: `/medicine/medicine/stock/${id}`,
    method: 'get'
  })
}

// ================ 药品入库管理 ================

// 创建入库单
export function createStockIn(data) {
  return request({
    url: '/medicineTransaction/createStockIn',
    method: 'post',
    data
  })
}

// 获取入库单列表
export function getStockInList(params) {
  return request({
    url: '/medicineTransaction/getStockInList',
    method: 'get',
    params
  })
}

// 获取入库单详情
export function getStockInDetail(id) {
  return request({
    url: `/medicine/medicine/stock/records/${id}`,
    method: 'get'
  })
}

// 获取交易单详情(新接口)
export function getTransactionDetail(id) {
  return request({
    url: `medicineTransaction/getTransactionDetail/${id}`,
    method: 'get'
  })
}

// 审核入库单
export function approveStockIn(id, data) {
  return request({
    url: `/medicine/medicine/stock/records/${id}/approve`,
    method: 'post',
    data
  })
}

// 取消入库单
export function cancelStockIn(id, data) {
  return request({
    url: `/medicine/medicine/stock/records/${id}/cancel`,
    method: 'post',
    data
  })
}

// ================ 药品出库管理 ================

// 普通药品出库
export function createStockOut(data) {
  return request({
    url: '/medicineTransaction/createStockOut',
    method: 'post',
    data
  })
}

// 处方出库
export function prescriptionOut(data) {
  return request({
    url: '/medicine/medicine/stock/prescription-out',
    method: 'post',
    data
  })
}

// 获取出库单列表
export function getStockOutList(params) {
  return request({
    url: '/medicineTransaction/getStockOutList',
    method: 'get',
    params
  })
}

// ================ 库存调整 ================

// 库存调整
export function adjustStock(data) {
  return request({
    url: '/medicine/medicine/stock/adjust',
    method: 'post',
    data
  })
}

// ================ 出入库记录 ================

// 获取出入库记录
export function getStockRecords(params) {
  return request({
    url: '/medicine/medicine/stock/records',
    method: 'get',
    params
  })
}

// ================ 交易单操作 ================

// 审核交易单（通用，适用于入库单和出库单）
export function approveTransaction(id, data) {
  return request({
    url: `medicineTransaction/approveTransaction/${id}`,
    method: 'put',
    data
  })
}

// 取消交易单（通用，适用于入库单和出库单）
export function cancelTransaction(id, data) {
  return request({
    url: `/medicineTransaction/cancelTransaction/${id}`,
    method: 'put',
    data
  })
}

// 从电子处方生成出库单
export function createStockOutFromPrescription(data) {
  return request({
    url: '/medicineTransaction/createStockOutFromPrescription',
    method: 'post',
    data
  })
}
