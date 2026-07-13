# 远程图像（RemoteImage）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：图像
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/{itemId}/RemoteImages` | GetRemoteImages | Gets available remote images for an item. |
| POST | `/Items/{itemId}/RemoteImages/Download` | DownloadRemoteImage | Downloads a remote image for an item. |
| GET | `/Items/{itemId}/RemoteImages/Providers` | GetRemoteImageProviders | Gets available remote image providers for an item. |

---

## GetRemoteImages

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/RemoteImages

**Method：** GET

**接口描述：** Gets available remote images for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item Id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| type | 否 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | The image type. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| providerName | 否 | string |  | Optional. The image provider to use. |
| includeAllLanguages | 否 | boolean | false | Optional. Include all languages. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Remote Images returned. | RemoteImageResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（RemoteImageResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Images | RemoteImageInfo[] | Gets or sets the images. |
| TotalRecordCount | integer | Gets or sets the total record count. |
| Providers | string[] | Gets or sets the providers. |


**200 字段说明（RemoteImageResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Images | RemoteImageInfo[] | Gets or sets the images. |
| TotalRecordCount | integer | Gets or sets the total record count. |
| Providers | string[] | Gets or sets the providers. |


**200 字段说明（RemoteImageResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Images | RemoteImageInfo[] | Gets or sets the images. |
| TotalRecordCount | integer | Gets or sets the total record count. |
| Providers | string[] | Gets or sets the providers. |


---

## DownloadRemoteImage

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/RemoteImages/Download

**Method：** POST

**接口描述：** Downloads a remote image for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item Id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| type | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | The image type. |
| imageUrl | 否 | string |  | The image url. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Remote image downloaded. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Remote image not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetRemoteImageProviders

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/RemoteImages/Providers

**Method：** GET

**接口描述：** Gets available remote image providers for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Returned remote image providers. | ImageProviderInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

