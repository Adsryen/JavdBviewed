# 活动日志（ActivityLogService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：通知与活动
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/System/ActivityLog/Entries` | getSystemActivitylogEntries | Gets activity log entries |

---

## getSystemActivitylogEntries

### 基本信息
**Path：** GET 服务器地址 + /System/ActivityLog/Entries

**Method：** GET

**接口描述：** Gets activity log entries

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| MinDate | 否 | string|null |  | Optional. The minimum date. Format = ISO |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<ActivityLogEntry> object. | QueryResult_ActivityLogEntry |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_ActivityLogEntry）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ActivityLogEntry[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_ActivityLogEntry）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ActivityLogEntry[] |  |
| TotalRecordCount | integer |  |


---

