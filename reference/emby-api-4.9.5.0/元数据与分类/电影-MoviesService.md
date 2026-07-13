# 电影（MoviesService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：元数据与分类
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Movies/Recommendations` | getMoviesRecommendations | Gets movie recommendations |

---

## getMoviesRecommendations

### 基本信息
**Path：** GET 服务器地址 + /Movies/Recommendations

**Method：** GET

**接口描述：** Gets movie recommendations

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| CategoryLimit | 否 | integer |  | The max number of categories to return |
| ItemLimit | 否 | integer |  | The max number of items to return per category |
| UserId | 否 | string |  | Optional. Filter by user id, and attach user data |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a RecommendationDto[] object. | RecommendationDto[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

