# 媒体片段（MediaSegment）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/MediaSegments/{itemId}` | GetItemSegments | Gets all media segments based on an itemId. |

---

## GetItemSegments

### 基本信息
**Path：** GET 服务器地址 + /MediaSegments/{itemId}

**Method：** GET

**接口描述：** Gets all media segments based on an itemId.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The ItemId. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| includeSegmentTypes | 否 | MediaSegmentType[] |  | Optional filter of requested segment types. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | MediaSegmentDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（MediaSegmentDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | MediaSegmentDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（MediaSegmentDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | MediaSegmentDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（MediaSegmentDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | MediaSegmentDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

