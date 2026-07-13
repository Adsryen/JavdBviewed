# 条目刷新（ItemRefreshService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Items/{Id}/Refresh` | postItemsByIdRefresh | Refreshes metadata for an item |

---

## postItemsByIdRefresh

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Refresh

**Method：** POST

**接口描述：** Refreshes metadata for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Recursive | 否 | boolean |  | Indicates if the refresh should occur recursively. |
| MetadataRefreshMode | 否 | MetadataRefreshMode |  | Specifies the metadata refresh mode |
| ImageRefreshMode | 否 | MetadataRefreshMode |  | Specifies the image refresh mode |
| ReplaceAllMetadata | 否 | boolean |  | Determines if metadata should be replaced. Only applicable if mode is FullRefresh |
| ReplaceAllImages | 否 | boolean |  | Determines if images should be replaced. Only applicable if mode is FullRefresh |


**Body**

- 是否必须：是
- 描述：BaseRefreshRequest:
- Content-Type：`application/json`
- Schema：`BaseRefreshRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ReplaceThumbnailImages | boolean |  |

- Content-Type：`application/xml`
- Schema：`BaseRefreshRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ReplaceThumbnailImages | boolean |  |



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

