# 设备管理（DeviceService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：接入认证
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：8

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Devices` | deleteDevices | Deletes a device |
| GET | `/Devices` | getDevices | Gets all devices |
| GET | `/Devices/CameraUploads` | getDevicesCamerauploads | Gets camera upload history for a device |
| POST | `/Devices/CameraUploads` | postDevicesCamerauploads | Uploads content |
| POST | `/Devices/Delete` | postDevicesDelete | Deletes a device |
| GET | `/Devices/Info` | getDevicesInfo | Gets info for a device |
| GET | `/Devices/Options` | getDevicesOptions | Gets options for a device |
| POST | `/Devices/Options` | postDevicesOptions | Updates device options |

---

## deleteDevices

### 基本信息
**Path：** DELETE 服务器地址 + /Devices

**Method：** DELETE

**接口描述：** Deletes a device

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Device Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDevices

### 基本信息
**Path：** GET 服务器地址 + /Devices

**Method：** GET

**接口描述：** Gets all devices

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<DeviceInfo> object. | QueryResult_Devices.DeviceInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_Devices.DeviceInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | Devices.DeviceInfo[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_Devices.DeviceInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | Devices.DeviceInfo[] |  |
| TotalRecordCount | integer |  |


---

## getDevicesCamerauploads

### 基本信息
**Path：** GET 服务器地址 + /Devices/CameraUploads

**Method：** GET

**接口描述：** Gets camera upload history for a device

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ContentUploadHistory object. | Devices.ContentUploadHistory |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Devices.ContentUploadHistory）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| DeviceId | string |  |
| FilesUploaded | Devices.LocalFileInfo[] |  |


**200 字段说明（Devices.ContentUploadHistory）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| DeviceId | string |  |
| FilesUploaded | Devices.LocalFileInfo[] |  |


---

## postDevicesCamerauploads

### 基本信息
**Path：** POST 服务器地址 + /Devices/CameraUploads

**Method：** POST

**接口描述：** Uploads content

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Album | 是 | string |  | Album |
| Name | 是 | string |  | Name |
| Id | 是 | string |  | Id |


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


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

## postDevicesDelete

### 基本信息
**Path：** POST 服务器地址 + /Devices/Delete

**Method：** POST

**接口描述：** Deletes a device

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Device Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDevicesInfo

### 基本信息
**Path：** GET 服务器地址 + /Devices/Info

**Method：** GET

**接口描述：** Gets info for a device

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Device Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DeviceInfo object. | Devices.DeviceInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Devices.DeviceInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| Id | string |  |
| InternalId | integer |  |
| ReportedDeviceId | string |  |
| LastUserName | string |  |
| AppName | string |  |
| AppVersion | string |  |
| LastUserId | string |  |
| DateLastActivity | string |  |
| IconUrl | string |  |
| IpAddress | string |  |


**200 字段说明（Devices.DeviceInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| Id | string |  |
| InternalId | integer |  |
| ReportedDeviceId | string |  |
| LastUserName | string |  |
| AppName | string |  |
| AppVersion | string |  |
| LastUserId | string |  |
| DateLastActivity | string |  |
| IconUrl | string |  |
| IpAddress | string |  |


---

## getDevicesOptions

### 基本信息
**Path：** GET 服务器地址 + /Devices/Options

**Method：** GET

**接口描述：** Gets options for a device

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Device Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DeviceOptions object. | Devices.DeviceOptions |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Devices.DeviceOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| CustomName | string |  |


**200 字段说明（Devices.DeviceOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| CustomName | string |  |


---

## postDevicesOptions

### 基本信息
**Path：** POST 服务器地址 + /Devices/Options

**Method：** POST

**接口描述：** Updates device options

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Device Id |


**Body**

- 是否必须：是
- 描述：DeviceOptions:
- Content-Type：`application/json`
- Schema：`Devices.DeviceOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CustomName | string |  |

- Content-Type：`application/xml`
- Schema：`Devices.DeviceOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CustomName | string |  |



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

