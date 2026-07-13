# 计划任务（ScheduledTaskService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/ScheduledTasks` | getScheduledtasks | Gets scheduled tasks |
| GET | `/ScheduledTasks/{Id}` | getScheduledtasksById | Gets a scheduled task, by Id |
| POST | `/ScheduledTasks/{Id}/Triggers` | postScheduledtasksByIdTriggers | Updates the triggers for a scheduled task |
| DELETE | `/ScheduledTasks/Running/{Id}` | deleteScheduledtasksRunningById | Stops a scheduled task |
| POST | `/ScheduledTasks/Running/{Id}` | postScheduledtasksRunningById | Starts a scheduled task |
| POST | `/ScheduledTasks/Running/{Id}/Delete` | postScheduledtasksRunningByIdDelete | Stops a scheduled task |

---

## getScheduledtasks

### 基本信息
**Path：** GET 服务器地址 + /ScheduledTasks

**Method：** GET

**接口描述：** Gets scheduled tasks

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IsHidden | 否 | boolean|null |  | Optional filter tasks that are hidden, or not. |
| IsEnabled | 否 | boolean|null |  | Optional filter tasks that are enabled, or not. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TaskInfo[] object. | TaskInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getScheduledtasksById

### 基本信息
**Path：** GET 服务器地址 + /ScheduledTasks/{Id}

**Method：** GET

**接口描述：** Gets a scheduled task, by Id

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TaskInfo object. | TaskInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（TaskInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| State | TaskState |  |
| CurrentProgressPercentage | number|null |  |
| Id | string |  |
| LastExecutionResult | TaskResult |  |
| Triggers | TaskTriggerInfo[] |  |
| Description | string |  |
| Category | string |  |
| IsHidden | boolean |  |
| Key | string |  |


**200 字段说明（TaskInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| State | TaskState |  |
| CurrentProgressPercentage | number|null |  |
| Id | string |  |
| LastExecutionResult | TaskResult |  |
| Triggers | TaskTriggerInfo[] |  |
| Description | string |  |
| Category | string |  |
| IsHidden | boolean |  |
| Key | string |  |


---

## postScheduledtasksByIdTriggers

### 基本信息
**Path：** POST 服务器地址 + /ScheduledTasks/{Id}/Triggers

**Method：** POST

**接口描述：** Updates the triggers for a scheduled task

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：List`1:
- Content-Type：`application/json`
- Schema：`TaskTriggerInfo[]`
- Content-Type：`application/xml`
- Schema：`TaskTriggerInfo[]`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Empty response. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## deleteScheduledtasksRunningById

### 基本信息
**Path：** DELETE 服务器地址 + /ScheduledTasks/Running/{Id}

**Method：** DELETE

**接口描述：** Stops a scheduled task

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Empty response. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postScheduledtasksRunningById

### 基本信息
**Path：** POST 服务器地址 + /ScheduledTasks/Running/{Id}

**Method：** POST

**接口描述：** Starts a scheduled task

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Empty response. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postScheduledtasksRunningByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /ScheduledTasks/Running/{Id}/Delete

**Method：** POST

**接口描述：** Stops a scheduled task

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Empty response. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

