# 筛选器（Filter）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/Filters` | GetQueryFiltersLegacy | Gets legacy query filters. |
| GET | `/Items/Filters2` | GetQueryFilters | Gets query filters. |

---

## GetQueryFiltersLegacy

### 基本信息
**Path：** GET 服务器地址 + /Items/Filters

**Method：** GET

**接口描述：** Gets legacy query filters.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. User id. |
| parentId | 否 | string |  | Optional. Parent id. |
| includeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. |
| mediaTypes | 否 | MediaType[] |  | Optional. Filter by MediaType. Allows multiple, comma delimited. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Legacy filters retrieved. | QueryFiltersLegacy |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（QueryFiltersLegacy）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Genres | string[] |  |
| Tags | string[] |  |
| OfficialRatings | string[] |  |
| Years | integer[] |  |


**200 字段说明（QueryFiltersLegacy）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Genres | string[] |  |
| Tags | string[] |  |
| OfficialRatings | string[] |  |
| Years | integer[] |  |


**200 字段说明（QueryFiltersLegacy）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Genres | string[] |  |
| Tags | string[] |  |
| OfficialRatings | string[] |  |
| Years | integer[] |  |


---

## GetQueryFilters

### 基本信息
**Path：** GET 服务器地址 + /Items/Filters2

**Method：** GET

**接口描述：** Gets query filters.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. User id. |
| parentId | 否 | string |  | Optional. Specify this to localize the search to a specific item or folder. Omit to use the root. |
| includeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. |
| isAiring | 否 | boolean |  | Optional. Is item airing. |
| isMovie | 否 | boolean |  | Optional. Is item movie. |
| isSports | 否 | boolean |  | Optional. Is item sports. |
| isKids | 否 | boolean |  | Optional. Is item kids. |
| isNews | 否 | boolean |  | Optional. Is item news. |
| isSeries | 否 | boolean |  | Optional. Is item series. |
| recursive | 否 | boolean |  | Optional. Search recursive. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Filters retrieved. | QueryFilters |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（QueryFilters）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Genres | NameGuidPair[] |  |
| Tags | string[] |  |
| AudioLanguages | NameValuePair[] |  |
| SubtitleLanguages | NameValuePair[] |  |


**200 字段说明（QueryFilters）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Genres | NameGuidPair[] |  |
| Tags | string[] |  |
| AudioLanguages | NameValuePair[] |  |
| SubtitleLanguages | NameValuePair[] |  |


**200 字段说明（QueryFilters）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Genres | NameGuidPair[] |  |
| Tags | string[] |  |
| AudioLanguages | NameValuePair[] |  |
| SubtitleLanguages | NameValuePair[] |  |


---

