# 搜索（Search）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Search/Hints` | GetSearchHints | Gets the search hint result. |

---

## GetSearchHints

### 基本信息
**Path：** GET 服务器地址 + /Search/Hints

**Method：** GET

**接口描述：** Gets the search hint result.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| userId | 否 | string |  | Optional. Supply a user id to search within a user's library or omit to search all. |
| searchTerm | 是 | string |  | The search term to filter on. |
| includeItemTypes | 否 | BaseItemKind[] |  | If specified, only results with the specified item types are returned. This allows multiple, comma delimited. |
| excludeItemTypes | 否 | BaseItemKind[] |  | If specified, results with these item types are filtered out. This allows multiple, comma delimited. |
| mediaTypes | 否 | MediaType[] |  | If specified, only results with the specified media types are returned. This allows multiple, comma delimited. |
| parentId | 否 | string |  | If specified, only children of the parent are returned. |
| isMovie | 否 | boolean |  | Optional filter for movies. |
| isSeries | 否 | boolean |  | Optional filter for series. |
| isNews | 否 | boolean |  | Optional filter for news. |
| isKids | 否 | boolean |  | Optional filter for kids. |
| isSports | 否 | boolean |  | Optional filter for sports. |
| includePeople | 否 | boolean | true | Optional filter whether to include people. |
| includeMedia | 否 | boolean | true | Optional filter whether to include media. |
| includeGenres | 否 | boolean | true | Optional filter whether to include genres. |
| includeStudios | 否 | boolean | true | Optional filter whether to include studios. |
| includeArtists | 否 | boolean | true | Optional filter whether to include artists. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Search hint returned. | SearchHintResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（SearchHintResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| SearchHints | SearchHint[] | Gets the search hints. |
| TotalRecordCount | integer | Gets the total record count. |


**200 字段说明（SearchHintResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| SearchHints | SearchHint[] | Gets the search hints. |
| TotalRecordCount | integer | Gets the total record count. |


**200 字段说明（SearchHintResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| SearchHints | SearchHint[] | Gets the search hints. |
| TotalRecordCount | integer | Gets the total record count. |


---

