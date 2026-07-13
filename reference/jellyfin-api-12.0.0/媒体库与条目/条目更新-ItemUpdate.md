# 条目更新（ItemUpdate）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Items/{itemId}` | UpdateItem | Updates an item. |
| POST | `/Items/{itemId}/ContentType` | UpdateItemContentType | Updates an item's content type. |
| GET | `/Items/{itemId}/MetadataEditor` | GetMetadataEditorInfo | Gets metadata editor info for an item. |

---

## UpdateItem

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}

**Method：** POST

**接口描述：** Updates an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Body**

- 是否必须：是
- 描述：The new item properties.
- Content-Type：`application/json`
- Schema：`BaseItemDto`
- Content-Type：`text/json`
- Schema：`BaseItemDto`
- Content-Type：`application/*+json`
- Schema：`BaseItemDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Item updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateItemContentType

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/ContentType

**Method：** POST

**接口描述：** Updates an item's content type.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| contentType | 否 | string |  | The content type of the item. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Item content type updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMetadataEditorInfo

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/MetadataEditor

**Method：** GET

**接口描述：** Gets metadata editor info for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item metadata editor returned. | MetadataEditorInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（MetadataEditorInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ParentalRatingOptions | ParentalRating[] | Gets or sets the parental rating options. |
| Countries | CountryInfo[] | Gets or sets the countries. |
| Cultures | CultureDto[] | Gets or sets the cultures. |
| ExternalIdInfos | ExternalIdInfo[] | Gets or sets the external id infos. |
| ContentType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the content type. |
| ContentTypeOptions | NameValuePair[] | Gets or sets the content type options. |


**200 字段说明（MetadataEditorInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ParentalRatingOptions | ParentalRating[] | Gets or sets the parental rating options. |
| Countries | CountryInfo[] | Gets or sets the countries. |
| Cultures | CultureDto[] | Gets or sets the cultures. |
| ExternalIdInfos | ExternalIdInfo[] | Gets or sets the external id infos. |
| ContentType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the content type. |
| ContentTypeOptions | NameValuePair[] | Gets or sets the content type options. |


**200 字段说明（MetadataEditorInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ParentalRatingOptions | ParentalRating[] | Gets or sets the parental rating options. |
| Countries | CountryInfo[] | Gets or sets the countries. |
| Cultures | CultureDto[] | Gets or sets the cultures. |
| ExternalIdInfos | ExternalIdInfo[] | Gets or sets the external id infos. |
| ContentType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the content type. |
| ContentTypeOptions | NameValuePair[] | Gets or sets the content type options. |


---

