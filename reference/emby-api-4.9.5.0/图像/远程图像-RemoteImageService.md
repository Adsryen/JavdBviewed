# 远程图像（RemoteImageService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：图像
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Images/Remote` | getImagesRemote | Gets a remote image |
| GET | `/Items/{Id}/RemoteImages` | getItemsByIdRemoteimages | Gets available remote images for an item |
| POST | `/Items/{Id}/RemoteImages/Download` | postItemsByIdRemoteimagesDownload | Downloads a remote image for an item |
| GET | `/Items/{Id}/RemoteImages/Providers` | getItemsByIdRemoteimagesProviders | Gets available remote image providers for an item |

---

## getImagesRemote

### 基本信息
**Path：** GET 服务器地址 + /Images/Remote

**Method：** GET

**接口描述：** Gets a remote image

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ImageUrl | 是 | string |  | The image url |


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

## getItemsByIdRemoteimages

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/RemoteImages

**Method：** GET

**接口描述：** Gets available remote images for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Type | 否 | ImageType |  | The image type |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| ProviderName | 否 | string |  | Optional. The image provider to use |
| IncludeAllLanguages | 否 | boolean |  | Optional. |
| EnableSeriesImages | 否 | boolean |  | Optional. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a RemoteImageResult object. | RemoteImageResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（RemoteImageResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Images | RemoteImageInfo[] |  |
| TotalRecordCount | integer |  |
| Providers | string[] |  |


**200 字段说明（RemoteImageResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Images | RemoteImageInfo[] |  |
| TotalRecordCount | integer |  |
| Providers | string[] |  |


---

## postItemsByIdRemoteimagesDownload

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/RemoteImages/Download

**Method：** POST

**接口描述：** Downloads a remote image for an item

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Type | 是 | ImageType |  | The image type |
| ProviderName | 否 | string |  | The image provider |
| ImageUrl | 否 | string |  | The image url |


**Body**

- 是否必须：是
- 描述：BaseDownloadRemoteImage:
- Content-Type：`application/json`
- Schema：`Images.BaseDownloadRemoteImage`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ImageIndex | integer|null |  |

- Content-Type：`application/xml`
- Schema：`Images.BaseDownloadRemoteImage`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ImageIndex | integer|null |  |



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

## getItemsByIdRemoteimagesProviders

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/RemoteImages/Providers

**Method：** GET

**接口描述：** Gets available remote image providers for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<ImageProviderInfo> object. | ImageProviderInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

