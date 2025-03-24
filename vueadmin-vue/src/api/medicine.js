import request from '../axios.js'

export function getMedicineList(params) {
  return request({
    url: '/medicine',
    method: 'get',
    params
  })
}

export function getMedicine(id) {
  return request({
    url: `/medicine/${id}`,
    method: 'get'
  })
}

export function createMedicine(data) {
  return request({
    url: '/medicine',
    method: 'post',
    data
  })
}

export function updateMedicine(id, data) {
  return request({
    url: `/medicine/${id}`,
    method: 'put',
    data
  })
}

export function deleteMedicine(id) {
  return request({
    url: `/medicine/${id}`,
    method: 'delete'
  })
}

export function getMedicineStock(medicineId) {
  return request({
    url: `/medicine/${medicineId}/stock`,
    method: 'get'
  })
}

export function updateMedicineStock(stockId, data) {
  return request({
    url: `/medicine/stock/${stockId}`,
    method: 'put',
    data
  })
}

export function getMedicineRiskAlerts() {
  return request({
    url: '/medicine/risk/alerts',
    method: 'get'
  })
}
