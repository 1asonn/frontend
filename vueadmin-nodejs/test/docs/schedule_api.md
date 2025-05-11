# 排班管理模块API文档

## 数据模型

### 排班信息 (Schedule)

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | Integer | 排班ID，主键 |
| employee_id | Integer | 职工ID，外键关联用户表 |
| department_id | Integer | 部门ID，外键关联部门表 |
| monday | String | 周一排班信息 |
| tuesday | String | 周二排班信息 |
| wednesday | String | 周三排班信息 |
| thursday | String | 周四排班信息 |
| friday | String | 周五排班信息 |
| saturday | String | 周六排班信息 |
| sunday | String | 周日排班信息 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 班次设置 (ShiftSetting)

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | Integer | 班次ID，主键 |
| name | String | 班次名称 |
| startTime | Time | 上班时间 |
| endTime | Time | 下班时间 |
| description | String | 班次描述 |
| isEnabled | Boolean | 是否启用 |
| createdBy | Integer | 创建人 ID |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### 排班班次关联 (ScheduleShift)

| 字段名 | 类型 | 描述 |
| ------ | ---- | ---- |
| id | Integer | 关联ID，主键 |
| schedule_id | Integer | 排班ID，外键关联排班表 |
| shift_id | Integer | 班次ID，外键关联班次表 |
| day_of_week | Enum | 星期几，可选值：monday, tuesday, wednesday, thursday, friday, saturday, sunday |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## API 接口

### 创建或更新排班

**接口地址**：`POST /api/schedule/schedule`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| employeeId | Integer | 是 | 职工ID |
| departmentId | Integer | 是 | 部门ID |
| shiftAssignments | Array | 否 | 班次分配数组，格式为[{day: 'monday', shiftId: 1}, ...] |

**请求示例**：

```json
{
  "employeeId": 1,
  "departmentId": 1,
  "shiftAssignments": [
    {"day": "monday", "shiftId": 1},
    {"day": "tuesday", "shiftId": 2},
    {"day": "wednesday", "shiftId": 1},
    {"day": "thursday", "shiftId": 3},
    {"day": "friday", "shiftId": 2},
    {"day": "saturday", "shiftId": 0},
    {"day": "sunday", "shiftId": 0}
  ]
}
```

> 注意：当 `shiftId` 为 0 时表示休息日

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| data | Object | 排班信息对象，包含班次关联 |
| message | String | 响应消息 |

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "employee_id": 1,
    "department_id": 1,
    "monday": "09:00-17:00",
    "tuesday": "10:00-18:00",
    "wednesday": "09:00-17:00",
    "thursday": "08:00-16:00",
    "friday": "10:00-18:00",
    "saturday": null,
    "sunday": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "schedule_shifts": [
      {
        "id": 1,
        "schedule_id": 1,
        "shift_id": 1,
        "day_of_week": "monday",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "shift": {
          "id": 1,
          "name": "早班",
          "startTime": "09:00:00",
          "endTime": "17:00:00",
          "description": "标准早班"
        }
      },
      {
        "id": 2,
        "schedule_id": 1,
        "shift_id": 2,
        "day_of_week": "tuesday",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "shift": {
          "id": 2,
          "name": "中班",
          "startTime": "10:00:00",
          "endTime": "18:00:00",
          "description": "标准中班"
        }
      }
    ]
  },
  "message": "排班保存成功"
}
```

### 获取个人排班信息

**接口地址**：`GET /api/schedule/schedule`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| includeShifts | Boolean | 否 | 是否包含班次详细信息，传入 'true' 则包含 |

**请求头**：

需要包含授权令牌：`Authorization: Bearer <token>`

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| data | Object/Object | 当includeShifts=true时，返回{schedule, shifts}对象；否则只返回schedule对象 |
| message | String | 响应消息 |

**响应示例（includeShifts=true）**：

```json
{
  "code": 200,
  "data": {
    "schedule": {
      "id": 1,
      "employee_id": 1,
      "department_id": 1,
      "monday": "09:00-17:00",
      "tuesday": "10:00-18:00",
      "wednesday": "09:00-17:00",
      "thursday": "08:00-16:00",
      "friday": "10:00-18:00",
      "saturday": null,
      "sunday": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "schedule_shifts": [...],
      "shift_mapping": {
        "monday": 1,
        "tuesday": 2,
        "wednesday": 1,
        "thursday": 3,
        "friday": 2,
        "saturday": null,
        "sunday": null
      }
    },
    "shifts": [
      {
        "id": 1,
        "name": "早班",
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "description": "标准早班"
      },
      {
        "id": 2,
        "name": "中班",
        "startTime": "10:00:00",
        "endTime": "18:00:00",
        "description": "标准中班"
      },
      {
        "id": 3,
        "name": "早早班",
        "startTime": "08:00:00",
        "endTime": "16:00:00",
        "description": "提前早班"
      }
    ]
  },
  "message": "获取排班信息成功"
}
```

### 获取部门排班信息

**接口地址**：`GET /api/schedule/getSchListBydepartment/:departmentId`

**路径参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| departmentId | Integer | 是 | 部门ID |

**查询参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| includeShifts | Boolean | 否 | 是否包含班次详细信息，传入 'true' 则包含 |

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| data | Array/Object | 当includeShifts=true时，返回{schedules, shifts}对象；否则只返回schedules数组 |
| message | String | 响应消息 |

**响应示例（includeShifts=true）**：

```json
{
  "code": 200,
  "data": {
    "schedules": [
      {
        "id": 1,
        "employee_id": 1,
        "department_id": 1,
        "monday": "09:00-17:00",
        "tuesday": "10:00-18:00",
        "wednesday": "09:00-17:00",
        "thursday": "08:00-16:00",
        "friday": "10:00-18:00",
        "saturday": null,
        "sunday": null,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "employee": {
          "id": 1,
          "username": "张三"
        },
        "schedule_shifts": [...],
        "shift_mapping": {
          "monday": 1,
          "tuesday": 2,
          "wednesday": 1,
          "thursday": 3,
          "friday": 2,
          "saturday": null,
          "sunday": null
        }
      },
      {
        "id": 2,
        "employee_id": 2,
        "department_id": 1,
        "monday": "10:00-18:00",
        "tuesday": "09:00-17:00",
        "wednesday": "10:00-18:00",
        "thursday": "09:00-17:00",
        "friday": "08:00-16:00",
        "saturday": null,
        "sunday": null,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "employee": {
          "id": 2,
          "username": "李四"
        },
        "schedule_shifts": [...],
        "shift_mapping": {
          "monday": 2,
          "tuesday": 1,
          "wednesday": 2,
          "thursday": 1,
          "friday": 3,
          "saturday": null,
          "sunday": null
        }
      }
    ],
    "shifts": [
      {
        "id": 1,
        "name": "早班",
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "description": "标准早班"
      },
      {
        "id": 2,
        "name": "中班",
        "startTime": "10:00:00",
        "endTime": "18:00:00",
        "description": "标准中班"
      },
      {
        "id": 3,
        "name": "早早班",
        "startTime": "08:00:00",
        "endTime": "16:00:00",
        "description": "提前早班"
      }
    ]
  },
  "message": "获取部门排班信息成功"
}
```

### 创建班次设置

**接口地址**：`POST /api/schedule/shift`

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| name | String | 是 | 班次名称 |
| startTime | String | 是 | 上班时间，格式为HH:mm:ss |
| endTime | String | 是 | 下班时间，格式为HH:mm:ss |
| description | String | 否 | 班次描述 |

**请求示例**：

```json
{
  "name": "早班",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "description": "标准早班时间"
}
```

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| data | Object | 创建的班次信息 |
| message | String | 响应消息 |

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "早班",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
    "description": "标准早班时间",
    "isEnabled": true,
    "createdBy": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "班次创建成功"
}
```

### 获取班次列表

**接口地址**：`GET /api/schedule/shifts`

**请求参数**：无

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| data | Array | 班次列表 |
| message | String | 响应消息 |

**响应示例**：

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "早班",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "description": "标准早班时间",
      "isEnabled": true,
      "createdBy": 1,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "中班",
      "startTime": "10:00:00",
      "endTime": "18:00:00",
      "description": "标准中班时间",
      "isEnabled": true,
      "createdBy": 1,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取班次列表成功"
}
```

### 更新班次设置

**接口地址**：`PUT /api/schedule/shift/:id`

**路径参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| id | Integer | 是 | 班次ID |

**请求参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| name | String | 否 | 班次名称 |
| startTime | String | 否 | 上班时间，格式为HH:mm:ss |
| endTime | String | 否 | 下班时间，格式为HH:mm:ss |
| description | String | 否 | 班次描述 |
| isEnabled | Boolean | 否 | 是否启用 |

**请求示例**：

```json
{
  "name": "早班（更新）",
  "startTime": "08:30:00",
  "endTime": "16:30:00",
  "description": "更新后的早班时间",
  "isEnabled": true
}
```

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| data | Object | 更新后的班次信息 |
| message | String | 响应消息 |

**响应示例**：

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "早班（更新）",
    "startTime": "08:30:00",
    "endTime": "16:30:00",
    "description": "更新后的早班时间",
    "isEnabled": true,
    "createdBy": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "班次更新成功"
}
```

### 删除班次设置

**接口地址**：`DELETE /api/schedule/shift/:id`

**路径参数**：

| 参数名 | 类型 | 是否必需 | 描述 |
| ------ | ---- | -------- | ---- |
| id | Integer | 是 | 班次ID |

**响应参数**：

| 参数名 | 类型 | 描述 |
| ------ | ---- | ---- |
| code | Integer | 状态码，200表示成功 |
| message | String | 响应消息 |

**响应示例**：

```json
{
  "code": 200,
  "message": "班次删除成功"
}
```

## 错误码说明

| 错误码 | 描述 |
| ------ | ---- |
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或授权失败 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 所有接口返回的数据格式统一为 `{code, data, message}`
2. 创建排班时，如果指定的职工已有排班记录，则会更新现有记录
3. 班次ID为0表示休息日
4. 获取排班信息时，可以通过includeShifts参数控制是否返回班次详细信息
5. 班次设置被删除后，相关的排班记录中的班次关联也会被删除