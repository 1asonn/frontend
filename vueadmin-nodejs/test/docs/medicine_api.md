# 药品模块 API 文档

## 目录

- [简介](#简介)
- [基础信息](#基础信息)
- [数据模型](#数据模型)
- [API 接口](#api-接口)
  - [药品管理](#药品管理)
  - [库存管理](#库存管理)
  - [出入库管理](#出入库管理)

## 简介

药品模块提供了完整的药品信息管理、库存管理和出入库管理功能。通过这些 API，可以实现药品的基础信息维护、库存查询、药品入库、出库等操作，并提供完整的出入库记录查询功能。

## 基础信息

- **基础路径**: `/api/medicine`
- **请求方式**: 支持 GET, POST, PUT, DELETE 方法
- **数据格式**: 请求和响应数据均为 JSON 格式
- **认证方式**: 使用 JWT 认证，需在请求头中包含 `Authorization: Bearer {token}`
- **响应格式**:
  ```json
  {
    "success": true|false,
    "message": "操作结果描述",
    "data": {} // 返回的数据
  }
  ```

## 数据模型

### 药品信息 (Medicine)

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | Integer | 药品ID，主键 |
| name | String | 药品名称 |
| specification | String | 规格 |
| manufacturer | String | 生产厂家 |
| unit | String | 单位 |
| category | String | 药品类别 |
| description | Text | 药品描述 |
| stock_threshold | Integer | 库存预警阈值 |
| storage_conditions | String | 储存条件，如"常温""冷藏"等 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 药品库存 (MedicineStock)

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | Integer | 库存记录ID，主键 |
| medicine_id | Integer | 药品ID，外键 |
| batch_number | String | 批号 |
| quantity | Integer | 库存数量 |
| status | Enum | 库存状态：in_stock-在库，consumed-已使用，expired-已过期，returned-已退货 |
| unit_price | Decimal | 单价 |
| location | String | 药品在仓库中的存放位置，如"货架 A1-3" |
| production_date | DateTime | 生产日期 |
| expiry_date | DateTime | 有效期 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 出入库记录 (StockRecord)

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | Integer | 记录ID，主键 |
| medicine_id | Integer | 药品ID，外键 |
| batch_number | String | 批号 |
| quantity | Integer | 数量，正值表示入库，负值表示出库 |
| record_type | Enum | 记录类型：IN-入库，OUT-出库，ADJUST-调整，RETURN-退货，EXPIRED-过期，PRESCRIPTION-处方出库 |
| operator_id | Integer | 操作人ID，外键 |
| operator | String | 操作人姓名 |
| remark | Text | 备注信息，如入库来源、出库目的等 |
| source_destination | String | 来源或目的地，如供应商名称、科室名称等 |
| prescription_id | Integer | 处方ID，仅处方出库时有值 |
| patient_id | Integer | 患者ID，仅处方出库时有值 |
| patient_name | String | 患者姓名，仅处方出库时有值 |
| medical_record_id | String | 病历号，仅处方出库时有值 |
| record_time | DateTime | 记录时间 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## API 接口

### 药品管理

#### 获取药品列表

- **URL**: `/`
- **方法**: `GET`
- **描述**: 获取药品列表，支持分页和筛选
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| page | Integer | 否 | 页码，默认为1 |
| pageSize | Integer | 否 | 每页记录数，默认为10 |
| name | String | 否 | 药品名称，支持模糊查询 |
| category | String | 否 | 药品类别 |

- **成功响应**:
```json
{
  "success": true,
  "message": "获取药品列表成功",
  "data": {
    "total": 100,
    "list": [
      {
        "id": 1,
        "name": "阿莫西林胶囊",
        "specification": "0.25g*24粒",
        "manufacturer": "哈药集团制药总厂",
        "unit": "盒",
        "category": "抗生素",
        "description": "用于敏感菌所致的感染",
        "stock_threshold": 100,
        "storage_conditions": "常温避光",
        "created_at": "2025-01-01T08:00:00.000Z",
        "updated_at": "2025-01-01T08:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 10
  }
}
```

#### 获取药品详情

- **URL**: `/:id`
- **方法**: `GET`
- **描述**: 获取指定ID的药品详情
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| id | Integer | 是 | 药品ID |

- **成功响应**:
```json
{
  "success": true,
  "message": "获取药品详情成功",
  "data": {
    "id": 1,
    "name": "阿莫西林胶囊",
    "specification": "0.25g*24粒",
    "manufacturer": "哈药集团制药总厂",
    "unit": "盒",
    "category": "抗生素",
    "description": "用于敏感菌所致的感染",
    "stock_threshold": 100,
    "storage_conditions": "常温避光",
    "created_at": "2025-01-01T08:00:00.000Z",
    "updated_at": "2025-01-01T08:00:00.000Z",
    "stocks": [
      {
        "id": 1,
        "batch_number": "20250101",
        "quantity": 1000,
        "status": "in_stock",
        "unit_price": 15.8,
        "location": "货架A1-3",
        "production_date": "2025-01-01T00:00:00.000Z",
        "expiry_date": "2027-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### 创建药品

- **URL**: `/`
- **方法**: `POST`
- **描述**: 创建新的药品信息
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| name | String | 是 | 药品名称 |
| specification | String | 是 | 规格 |
| manufacturer | String | 是 | 生产厂家 |
| unit | String | 是 | 单位 |
| category | String | 是 | 药品类别 |
| description | String | 否 | 药品描述 |
| stock_threshold | Integer | 否 | 库存预警阈值，默认100 |
| storage_conditions | String | 否 | 储存条件 |

- **成功响应**:
```json
{
  "success": true,
  "message": "创建药品成功",
  "data": {
    "id": 1,
    "name": "阿莫西林胶囊",
    "specification": "0.25g*24粒",
    "manufacturer": "哈药集团制药总厂",
    "unit": "盒",
    "category": "抗生素",
    "description": "用于敏感菌所致的感染",
    "stock_threshold": 100,
    "storage_conditions": "常温避光",
    "created_at": "2025-01-01T08:00:00.000Z",
    "updated_at": "2025-01-01T08:00:00.000Z"
  }
}
```

#### 更新药品

- **URL**: `/:id`
- **方法**: `PUT`
- **描述**: 更新指定ID的药品信息
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| id | Integer | 是 | 药品ID |
| name | String | 否 | 药品名称 |
| specification | String | 否 | 规格 |
| manufacturer | String | 否 | 生产厂家 |
| unit | String | 否 | 单位 |
| category | String | 否 | 药品类别 |
| description | String | 否 | 药品描述 |
| stock_threshold | Integer | 否 | 库存预警阈值 |
| storage_conditions | String | 否 | 储存条件 |

- **成功响应**:
```json
{
  "success": true,
  "message": "更新药品成功",
  "data": {
    "id": 1,
    "name": "阿莫西林胶囊",
    "specification": "0.25g*24粒",
    "manufacturer": "哈药集团制药总厂",
    "unit": "盒",
    "category": "抗生素",
    "description": "用于敏感菌所致的感染，更新后的描述",
    "stock_threshold": 150,
    "storage_conditions": "常温避光",
    "created_at": "2025-01-01T08:00:00.000Z",
    "updated_at": "2025-05-04T08:00:00.000Z"
  }
}
```

#### 删除药品

- **URL**: `/:id`
- **方法**: `DELETE`
- **描述**: 删除指定ID的药品信息
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| id | Integer | 是 | 药品ID |

- **成功响应**:
```json
{
  "success": true,
  "message": "删除药品成功",
  "data": null
}
```

### 库存管理

#### 获取药品库存列表

- **URL**: `/stock`
- **方法**: `GET`
- **描述**: 获取药品库存列表，支持分页和筛选
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| page | Integer | 否 | 页码，默认为1 |
| pageSize | Integer | 否 | 每页记录数，默认为10 |
| medicineId | Integer | 否 | 药品ID |
| batchNumber | String | 否 | 批号，支持模糊查询 |
| status | String | 否 | 库存状态 |
| expiryDateStart | Date | 否 | 有效期开始日期 |
| expiryDateEnd | Date | 否 | 有效期结束日期 |

- **成功响应**:
```json
{
  "success": true,
  "message": "获取药品库存列表成功",
  "data": {
    "total": 50,
    "list": [
      {
        "id": 1,
        "medicine_id": 1,
        "batch_number": "20250101",
        "quantity": 1000,
        "status": "in_stock",
        "unit_price": 15.8,
        "location": "货架A1-3",
        "production_date": "2025-01-01T00:00:00.000Z",
        "expiry_date": "2027-01-01T00:00:00.000Z",
        "created_at": "2025-01-01T08:00:00.000Z",
        "updated_at": "2025-01-01T08:00:00.000Z",
        "medicine": {
          "id": 1,
          "name": "阿莫西林胶囊",
          "specification": "0.25g*24粒",
          "unit": "盒"
        }
      }
    ],
    "page": 1,
    "pageSize": 10
  }
}
```

#### 获取药品库存详情

- **URL**: `/stock/:id`
- **方法**: `GET`
- **描述**: 获取指定ID的药品库存详情
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| id | Integer | 是 | 库存记录ID |

- **成功响应**:
```json
{
  "success": true,
  "message": "获取药品库存详情成功",
  "data": {
    "id": 1,
    "medicine_id": 1,
    "batch_number": "20250101",
    "quantity": 1000,
    "status": "in_stock",
    "unit_price": 15.8,
    "location": "货架A1-3",
    "production_date": "2025-01-01T00:00:00.000Z",
    "expiry_date": "2027-01-01T00:00:00.000Z",
    "created_at": "2025-01-01T08:00:00.000Z",
    "updated_at": "2025-01-01T08:00:00.000Z",
    "medicine": {
      "id": 1,
      "name": "阿莫西林胶囊",
      "specification": "0.25g*24粒",
      "manufacturer": "哈药集团制药总厂",
      "unit": "盒",
      "category": "抗生素"
    }
  }
}
```

### 出入库管理

#### 药品入库

- **URL**: `/stock/in`
- **方法**: `POST`
- **描述**: 药品入库操作
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| medicine_id | Integer | 是 | 药品ID |
| batch_number | String | 是 | 批号 |
| quantity | Integer | 是 | 入库数量 |
| unit_price | Decimal | 否 | 单价 |
| production_date | Date | 是 | 生产日期 |
| expiry_date | Date | 是 | 有效期 |
| location | String | 否 | 存放位置 |
| remark | String | 否 | 备注 |
| source | String | 否 | 来源 |

- **成功响应**:
```json
{
  "success": true,
  "message": "药品入库成功",
  "data": {
    "stock": {
      "id": 1,
      "medicine_id": 1,
      "batch_number": "20250101",
      "quantity": 1000,
      "status": "in_stock",
      "unit_price": 15.8,
      "location": "货架A1-3",
      "production_date": "2025-01-01T00:00:00.000Z",
      "expiry_date": "2027-01-01T00:00:00.000Z",
      "created_at": "2025-01-01T08:00:00.000Z",
      "updated_at": "2025-01-01T08:00:00.000Z"
    },
    "record": {
      "id": 1,
      "medicine_id": 1,
      "batch_number": "20250101",
      "quantity": 1000,
      "record_type": "IN",
      "operator_id": 1,
      "operator": "张三",
      "remark": "药品入库",
      "source_destination": "供应商A",
      "record_time": "2025-01-01T08:00:00.000Z"
    }
  }
}
```

#### 普通药品出库

- **URL**: `/stock/out`
- **方法**: `POST`
- **描述**: 普通药品出库操作
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| medicine_id | Integer | 是 | 药品ID |
| batch_number | String | 是 | 批号 |
| quantity | Integer | 是 | 出库数量 |
| remark | String | 否 | 备注 |
| destination | String | 否 | 目的地 |

- **成功响应**:
```json
{
  "success": true,
  "message": "药品出库成功",
  "data": {
    "medicine_id": 1,
    "batch_number": "20250101",
    "medicine_name": "阿莫西林胶囊",
    "quantity_before": 1000,
    "quantity_out": 200,
    "quantity_after": 800,
    "record": {
      "id": 2,
      "medicine_id": 1,
      "batch_number": "20250101",
      "quantity": -200,
      "record_type": "OUT",
      "operator_id": 1,
      "operator": "张三",
      "remark": "药品出库",
      "source_destination": "内科",
      "record_time": "2025-01-02T08:00:00.000Z"
    }
  }
}
```

#### 处方出库

- **URL**: `/stock/prescription-out`
- **方法**: `POST`
- **描述**: 通过医生开具的处方进行药品出库操作
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| medicine_id | Integer | 是 | 药品ID |
| batch_number | String | 是 | 批号 |
| quantity | Integer | 是 | 出库数量 |
| prescription_id | Integer | 是 | 处方ID |
| patient_id | Integer | 否 | 患者ID |
| patient_name | String | 是 | 患者姓名 |
| medical_record_id | String | 否 | 病历号 |
| department | String | 否 | 科室名称 |
| remark | String | 否 | 备注 |

- **成功响应**:
```json
{
  "success": true,
  "message": "处方出库成功",
  "data": {
    "medicine_id": 1,
    "batch_number": "20250101",
    "medicine_name": "阿莫西林胶囊",
    "quantity_before": 1000,
    "quantity_out": 200,
    "quantity_after": 800,
    "prescription_id": 123,
    "patient_name": "李四",
    "medical_record_id": "MR20250504001",
    "record": {
      "id": 3,
      "medicine_id": 1,
      "batch_number": "20250101",
      "quantity": -200,
      "record_type": "PRESCRIPTION",
      "operator_id": 1,
      "operator": "张三",
      "remark": "处方出库",
      "source_destination": "内科",
      "prescription_id": 123,
      "patient_id": 456,
      "patient_name": "李四",
      "medical_record_id": "MR20250504001",
      "record_time": "2025-01-02T08:00:00.000Z"
    }
  }
}
```

#### 库存调整

- **URL**: `/stock/adjust`
- **方法**: `POST`
- **描述**: 药品库存调整操作
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| medicine_id | Integer | 是 | 药品ID |
| batch_number | String | 是 | 批号 |
| new_quantity | Integer | 是 | 调整后的数量 |
| remark | String | 否 | 备注 |

- **成功响应**:
```json
{
  "success": true,
  "message": "库存调整成功",
  "data": {
    "medicine_id": 1,
    "batch_number": "20250101",
    "quantity_before": 800,
    "quantity_change": 50,
    "quantity_after": 850
  }
}
```

#### 获取出入库记录

- **URL**: `/stock/records`
- **方法**: `GET`
- **描述**: 获取药品出入库记录，支持分页和筛选
- **请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| page | Integer | 否 | 页码，默认为1 |
| pageSize | Integer | 否 | 每页记录数，默认为10 |
| medicineId | Integer | 否 | 药品ID |
| batchNumber | String | 否 | 批号，支持模糊查询 |
| recordType | String | 否 | 记录类型：IN-入库，OUT-出库，ADJUST-调整，RETURN-退货，EXPIRED-过期，PRESCRIPTION-处方出库 |
| startDate | Date | 否 | 开始日期 |
| endDate | Date | 否 | 结束日期 |
| operatorId | Integer | 否 | 操作人ID |
| sourceDestination | String | 否 | 来源或目的地，支持模糊查询 |

- **成功响应**:
```json
{
  "success": true,
  "message": "获取药品出入库记录成功",
  "data": {
    "total": 100,
    "list": [
      {
        "id": 2,
        "medicine_id": 1,
        "batch_number": "20250101",
        "quantity": -200,
        "record_type": "OUT",
        "operator_id": 1,
        "operator": "张三",
        "remark": "药品出库",
        "source_destination": "内科",
        "record_time": "2025-01-02T08:00:00.000Z",
        "created_at": "2025-01-02T08:00:00.000Z",
        "updated_at": "2025-01-02T08:00:00.000Z",
        "medicine": {
          "id": 1,
          "name": "阿莫西林胶囊",
          "specification": "0.25g*24粒",
          "unit": "盒",
          "manufacturer": "哈药集团制药总厂"
        },
        "operator_info": {
          "id": 1,
          "username": "zhangsan",
          "realname": "张三",
          "phone": "13800138000"
        }
      },
      {
        "id": 1,
        "medicine_id": 1,
        "batch_number": "20250101",
        "quantity": 1000,
        "record_type": "IN",
        "operator_id": 1,
        "operator": "张三",
        "remark": "药品入库",
        "source_destination": "供应商A",
        "record_time": "2025-01-01T08:00:00.000Z",
        "created_at": "2025-01-01T08:00:00.000Z",
        "updated_at": "2025-01-01T08:00:00.000Z",
        "medicine": {
          "id": 1,
          "name": "阿莫西林胶囊",
          "specification": "0.25g*24粒",
          "unit": "盒",
          "manufacturer": "哈药集团制药总厂"
        },
        "operator_info": {
          "id": 1,
          "username": "zhangsan",
          "realname": "张三",
          "phone": "13800138000"
        }
      }
    ],
    "page": 1,
    "pageSize": 10
  }
}
```

## 错误码说明

| 错误码 | 描述 |
| ------ | ---- |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 所有涉及数量的操作都使用事务确保数据一致性
2. 药品入库时会检查有效期，过期药品不允许入库
3. 药品出库时会检查库存是否足够
4. 所有出入库操作都会记录详细信息，包括操作人、时间、数量等
5. API 接口返回的时间格式为 ISO 8601 标准格式
