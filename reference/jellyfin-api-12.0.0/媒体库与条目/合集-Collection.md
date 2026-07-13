# 合集（Collection）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Collections` | CreateCollection | Creates a new collection. |
| DELETE | `/Collections/{collectionId}/Items` | RemoveFromCollection | Removes items from a collection. |
| POST | `/Collections/{collectionId}/Items` | AddToCollection | Adds items to a collection. |

---

## CreateCollection

### 基本信息
**Path：** POST 服务器地址 + /Collections

**Method：** POST

**接口描述：** Creates a new collection.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The name of the collection. |
| ids | 否 | string[] |  | Item Ids to add to the collection. |
| parentId | 否 | string |  | Optional. Create the collection within a specific folder. |
| isLocked | 否 | boolean | false | Whether or not to lock the new collection. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Collection created. | CollectionCreationResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（CollectionCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |


**200 字段说明（CollectionCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |


**200 字段说明（CollectionCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |


---

## RemoveFromCollection

### 基本信息
**Path：** DELETE 服务器地址 + /Collections/{collectionId}/Items

**Method：** DELETE

**接口描述：** Removes items from a collection.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| collectionId | 是 | string |  | The collection id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ids | 是 | string[] |  | Item ids, comma delimited. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Items removed from collection. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AddToCollection

### 基本信息
**Path：** POST 服务器地址 + /Collections/{collectionId}/Items

**Method：** POST

**接口描述：** Adds items to a collection.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| collectionId | 是 | string |  | The collection id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ids | 是 | string[] |  | Item ids, comma delimited. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Items added to collection. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

