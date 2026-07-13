# 用户通知（UserNotificationsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：通知与活动
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Notifications/Services/Defaults` | getNotificationsServicesDefaults | Gets default notification info |
| POST | `/Notifications/Services/Test` | postNotificationsServicesTest | Sends a test notification |

---

## getNotificationsServicesDefaults

### 基本信息
**Path：** GET 服务器地址 + /Notifications/Services/Defaults

**Method：** GET

**接口描述：** Gets default notification info

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserNotificationInfo object. | UserNotificationInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserNotificationInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| NotifierKey | string |  |
| SetupModuleUrl | string |  |
| ServiceName | string |  |
| PluginId | string |  |
| FriendlyName | string |  |
| Id | string |  |
| Enabled | boolean |  |
| UserIds | string[] |  |
| DeviceIds | string[] |  |
| LibraryIds | string[] |  |
| EventIds | string[] |  |
| UserId | string |  |
| IsSelfNotification | boolean |  |
| GroupItems | boolean |  |
| Options | object |  |


**200 字段说明（UserNotificationInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| NotifierKey | string |  |
| SetupModuleUrl | string |  |
| ServiceName | string |  |
| PluginId | string |  |
| FriendlyName | string |  |
| Id | string |  |
| Enabled | boolean |  |
| UserIds | string[] |  |
| DeviceIds | string[] |  |
| LibraryIds | string[] |  |
| EventIds | string[] |  |
| UserId | string |  |
| IsSelfNotification | boolean |  |
| GroupItems | boolean |  |
| Options | object |  |


---

## postNotificationsServicesTest

### 基本信息
**Path：** POST 服务器地址 + /Notifications/Services/Test

**Method：** POST

**接口描述：** Sends a test notification

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：UserNotificationInfo:
- Content-Type：`application/json`
- Schema：`UserNotificationInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| NotifierKey | string |  |
| SetupModuleUrl | string |  |
| ServiceName | string |  |
| PluginId | string |  |
| FriendlyName | string |  |
| Id | string |  |
| Enabled | boolean |  |
| UserIds | string[] |  |
| DeviceIds | string[] |  |
| LibraryIds | string[] |  |
| EventIds | string[] |  |
| UserId | string |  |
| IsSelfNotification | boolean |  |
| GroupItems | boolean |  |
| Options | object |  |

- Content-Type：`application/xml`
- Schema：`UserNotificationInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| NotifierKey | string |  |
| SetupModuleUrl | string |  |
| ServiceName | string |  |
| PluginId | string |  |
| FriendlyName | string |  |
| Id | string |  |
| Enabled | boolean |  |
| UserIds | string[] |  |
| DeviceIds | string[] |  |
| LibraryIds | string[] |  |
| EventIds | string[] |  |
| UserId | string |  |
| IsSelfNotification | boolean |  |
| GroupItems | boolean |  |
| Options | object |  |



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

