# 设备管理（Device）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：接入认证
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Devices` | DeleteDevice | Deletes devices. |
| GET | `/Devices` | GetDevices | Get Devices. |
| GET | `/Devices/Info` | GetDeviceInfo | Get info for a device. |
| GET | `/Devices/Options` | GetDeviceOptions | Get options for a device. |
| POST | `/Devices/Options` | UpdateDeviceOptions | Update device options. |

---

## DeleteDevice

### 基本信息
**Path：** DELETE 服务器地址 + /Devices

**Method：** DELETE

**接口描述：** Deletes devices.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 否 | string[] |  | Device Ids. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Device deleted. |  |
| 400 | A requested device is invalid. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetDevices

### 基本信息
**Path：** GET 服务器地址 + /Devices

**Method：** GET

**接口描述：** Get Devices.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Gets or sets the user identifier. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Devices retrieved. | DeviceInfoDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（DeviceInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | DeviceInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（DeviceInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | DeviceInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（DeviceInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | DeviceInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## GetDeviceInfo

### 基本信息
**Path：** GET 服务器地址 + /Devices/Info

**Method：** GET

**接口描述：** Get info for a device.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 是 | string |  | Device Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Device info retrieved. | DeviceInfoDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Device not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（DeviceInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| CustomName | string|null | Gets or sets the custom name. |
| AccessToken | string|null | Gets or sets the access token. |
| Id | string|null | Gets or sets the identifier. |
| LastUserName | string|null | Gets or sets the last name of the user. |
| AppName | string|null | Gets or sets the name of the application. |
| AppVersion | string|null | Gets or sets the application version. |
| LastUserId | string|null | Gets or sets the last user identifier. |
| DateLastActivity | string|null | Gets or sets the date last modified. |
| Capabilities | ClientCapabilitiesDto | Gets or sets the capabilities. |
| IconUrl | string|null | Gets or sets the icon URL. |


**200 字段说明（DeviceInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| CustomName | string|null | Gets or sets the custom name. |
| AccessToken | string|null | Gets or sets the access token. |
| Id | string|null | Gets or sets the identifier. |
| LastUserName | string|null | Gets or sets the last name of the user. |
| AppName | string|null | Gets or sets the name of the application. |
| AppVersion | string|null | Gets or sets the application version. |
| LastUserId | string|null | Gets or sets the last user identifier. |
| DateLastActivity | string|null | Gets or sets the date last modified. |
| Capabilities | ClientCapabilitiesDto | Gets or sets the capabilities. |
| IconUrl | string|null | Gets or sets the icon URL. |


**200 字段说明（DeviceInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| CustomName | string|null | Gets or sets the custom name. |
| AccessToken | string|null | Gets or sets the access token. |
| Id | string|null | Gets or sets the identifier. |
| LastUserName | string|null | Gets or sets the last name of the user. |
| AppName | string|null | Gets or sets the name of the application. |
| AppVersion | string|null | Gets or sets the application version. |
| LastUserId | string|null | Gets or sets the last user identifier. |
| DateLastActivity | string|null | Gets or sets the date last modified. |
| Capabilities | ClientCapabilitiesDto | Gets or sets the capabilities. |
| IconUrl | string|null | Gets or sets the icon URL. |


---

## GetDeviceOptions

### 基本信息
**Path：** GET 服务器地址 + /Devices/Options

**Method：** GET

**接口描述：** Get options for a device.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 是 | string |  | Device Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Device options retrieved. | DeviceOptionsDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Device not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（DeviceOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets or sets the id. |
| DeviceId | string|null | Gets or sets the device id. |
| CustomName | string|null | Gets or sets the custom name. |


**200 字段说明（DeviceOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets or sets the id. |
| DeviceId | string|null | Gets or sets the device id. |
| CustomName | string|null | Gets or sets the custom name. |


**200 字段说明（DeviceOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets or sets the id. |
| DeviceId | string|null | Gets or sets the device id. |
| CustomName | string|null | Gets or sets the custom name. |


---

## UpdateDeviceOptions

### 基本信息
**Path：** POST 服务器地址 + /Devices/Options

**Method：** POST

**接口描述：** Update device options.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 是 | string |  | Device Id. |


**Body**

- 是否必须：是
- 描述：Device Options.
- Content-Type：`application/json`
- Schema：`DeviceOptionsDto`
- Content-Type：`text/json`
- Schema：`DeviceOptionsDto`
- Content-Type：`application/*+json`
- Schema：`DeviceOptionsDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Device options updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

