# 用户视图（UserView）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/UserViews` | GetUserViews | Get user views. |
| GET | `/UserViews/GroupingOptions` | GetGroupingOptions | Get user view grouping options. |

---

## GetUserViews

### 基本信息
**Path：** GET 服务器地址 + /UserViews

**Method：** GET

**接口描述：** Get user views.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| includeExternalContent | 否 | boolean |  | Whether or not to include external views such as channels or live tv. |
| presetViews | 否 | CollectionType[] |  | Preset views. |
| includeHidden | 否 | boolean | false | Whether or not to include hidden content. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User views returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## GetGroupingOptions

### 基本信息
**Path：** GET 服务器地址 + /UserViews/GroupingOptions

**Method：** GET

**接口描述：** Get user view grouping options.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User view grouping options returned. | SpecialViewOptionDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | User not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

