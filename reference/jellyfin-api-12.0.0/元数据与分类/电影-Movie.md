# 电影（Movie）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：元数据与分类
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Movies/Recommendations` | GetMovieRecommendations | Gets movie recommendations. |

---

## GetMovieRecommendations

### 基本信息
**Path：** GET 服务器地址 + /Movies/Recommendations

**Method：** GET

**接口描述：** Gets movie recommendations.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| parentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root. |
| fields | 否 | ItemFields[] |  | Optional. The fields to return. |
| categoryLimit | 否 | integer | 5 | The max number of categories to return. |
| itemLimit | 否 | integer | 8 | The max number of items to return per category. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Movie recommendations returned. | RecommendationDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

