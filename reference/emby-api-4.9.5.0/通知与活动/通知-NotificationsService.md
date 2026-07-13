# 通知（NotificationsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：通知与活动
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Notifications/Admin` | postNotificationsAdmin | Sends a notification to all admin users |
| GET | `/Notifications/Types` | getNotificationsTypes | Gets notification types |

---

## postNotificationsAdmin

### 基本信息
**Path：** POST 服务器地址 + /Notifications/Admin

**Method：** POST

**接口描述：** Sends a notification to all admin users

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | The notification's name |
| Description | 是 | string |  | The notification's description |
| ImageUrl | 否 | string |  | The notification's image url |
| Url | 否 | string |  | The notification's info url |
| Level | 否 | string |  | The notification level |


**Body**

- 是否必须：是
- 描述：AddAdminNotification
- Content-Type：`application/json`
- Schema：`Api.AddAdminNotification`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| DisplayDateTime | boolean |  |

- Content-Type：`application/xml`
- Schema：`Api.AddAdminNotification`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| DisplayDateTime | boolean |  |



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

## getNotificationsTypes

### 基本信息
**Path：** GET 服务器地址 + /Notifications/Types

**Method：** GET

**接口描述：** Gets notification types

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a NotificationCategoryInfo[] object. | NotificationCategoryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

