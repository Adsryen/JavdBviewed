# 计划任务（ScheduledTask）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/ScheduledTasks` | GetTasks | Get tasks. |
| GET | `/ScheduledTasks/{taskId}` | GetTask | Get task by id. |
| POST | `/ScheduledTasks/{taskId}/Triggers` | UpdateTask | Update specified task triggers. |
| DELETE | `/ScheduledTasks/Running/{taskId}` | StopTask | Stop specified task. |
| POST | `/ScheduledTasks/Running/{taskId}` | StartTask | Start specified task. |

---

## GetTasks

### 基本信息
**Path：** GET 服务器地址 + /ScheduledTasks

**Method：** GET

**接口描述：** Get tasks.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| isHidden | 否 | boolean |  | Optional filter tasks that are hidden, or not. |
| isEnabled | 否 | boolean |  | Optional filter tasks that are enabled, or not. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Scheduled tasks retrieved. | TaskInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetTask

### 基本信息
**Path：** GET 服务器地址 + /ScheduledTasks/{taskId}

**Method：** GET

**接口描述：** Get task by id.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| taskId | 是 | string |  | Task Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Task retrieved. | TaskInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Task not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（TaskInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| State | string enum(Idle|Cancelling|Running) | Gets or sets the state of the task. |
| CurrentProgressPercentage | number|null | Gets or sets the progress. |
| Id | string|null | Gets or sets the id. |
| LastExecutionResult | TaskResult | Gets or sets the last execution result. |
| Triggers | TaskTriggerInfo[] | Gets or sets the triggers. |
| Description | string|null | Gets or sets the description. |
| Category | string|null | Gets or sets the category. |
| IsHidden | boolean | Gets or sets a value indicating whether this instance is hidden. |
| Key | string|null | Gets or sets the key. |


**200 字段说明（TaskInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| State | string enum(Idle|Cancelling|Running) | Gets or sets the state of the task. |
| CurrentProgressPercentage | number|null | Gets or sets the progress. |
| Id | string|null | Gets or sets the id. |
| LastExecutionResult | TaskResult | Gets or sets the last execution result. |
| Triggers | TaskTriggerInfo[] | Gets or sets the triggers. |
| Description | string|null | Gets or sets the description. |
| Category | string|null | Gets or sets the category. |
| IsHidden | boolean | Gets or sets a value indicating whether this instance is hidden. |
| Key | string|null | Gets or sets the key. |


**200 字段说明（TaskInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| State | string enum(Idle|Cancelling|Running) | Gets or sets the state of the task. |
| CurrentProgressPercentage | number|null | Gets or sets the progress. |
| Id | string|null | Gets or sets the id. |
| LastExecutionResult | TaskResult | Gets or sets the last execution result. |
| Triggers | TaskTriggerInfo[] | Gets or sets the triggers. |
| Description | string|null | Gets or sets the description. |
| Category | string|null | Gets or sets the category. |
| IsHidden | boolean | Gets or sets a value indicating whether this instance is hidden. |
| Key | string|null | Gets or sets the key. |


---

## UpdateTask

### 基本信息
**Path：** POST 服务器地址 + /ScheduledTasks/{taskId}/Triggers

**Method：** POST

**接口描述：** Update specified task triggers.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| taskId | 是 | string |  | Task Id. |


**Body**

- 是否必须：是
- 描述：Triggers.
- Content-Type：`application/json`
- Schema：`TaskTriggerInfo[]`
- Content-Type：`text/json`
- Schema：`TaskTriggerInfo[]`
- Content-Type：`application/*+json`
- Schema：`TaskTriggerInfo[]`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Task triggers updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Task not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## StopTask

### 基本信息
**Path：** DELETE 服务器地址 + /ScheduledTasks/Running/{taskId}

**Method：** DELETE

**接口描述：** Stop specified task.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| taskId | 是 | string |  | Task Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Task stopped. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Task not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## StartTask

### 基本信息
**Path：** POST 服务器地址 + /ScheduledTasks/Running/{taskId}

**Method：** POST

**接口描述：** Start specified task.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| taskId | 是 | string |  | Task Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Task started. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Task not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

