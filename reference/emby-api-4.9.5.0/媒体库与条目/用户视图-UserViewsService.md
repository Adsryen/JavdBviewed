# 用户视图（UserViewsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Users/{UserId}/Views` | getUsersByUseridViews |  |

---

## getUsersByUseridViews

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Views

**Method：** GET

**接口描述：** Requires authentication as user

**官方文档：** [API Documentation: Browsing the Library](https://dev.emby.media/doc/restapi/Browsing-the-Library.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IncludeExternalContent | 是 | boolean|null |  | Whether or not to include external views such as channels or live tv |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<BaseItemDto> object. | QueryResult_BaseItemDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


---

