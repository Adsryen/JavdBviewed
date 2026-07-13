# 合集（CollectionService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Collections` | postCollections | Creates a new collection |
| DELETE | `/Collections/{Id}/Items` | deleteCollectionsByIdItems | Removes items from a collection |
| POST | `/Collections/{Id}/Items` | postCollectionsByIdItems | Adds items to a collection |
| POST | `/Collections/{Id}/Items/Delete` | postCollectionsByIdItemsDelete | Removes items from a collection |

---

## postCollections

### 基本信息
**Path：** POST 服务器地址 + /Collections

**Method：** POST

**接口描述：** Creates a new collection

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IsLocked | 否 | boolean |  | Whether or not to lock the new collection. |
| Name | 否 | string |  | The name of the new collection. |
| ParentId | 否 | string |  | Optional - create the collection within a specific folder |
| Ids | 否 | string |  | Item Ids to add to the collection |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a CollectionCreationResult object. | Collections.CollectionCreationResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Collections.CollectionCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Name | string |  |


**200 字段说明（Collections.CollectionCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Name | string |  |


---

## deleteCollectionsByIdItems

### 基本信息
**Path：** DELETE 服务器地址 + /Collections/{Id}/Items

**Method：** DELETE

**接口描述：** Removes items from a collection

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Ids | 是 | string |  | Item id, comma delimited |


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

## postCollectionsByIdItems

### 基本信息
**Path：** POST 服务器地址 + /Collections/{Id}/Items

**Method：** POST

**接口描述：** Adds items to a collection

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Ids | 是 | string |  | Item id, comma delimited |


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

## postCollectionsByIdItemsDelete

### 基本信息
**Path：** POST 服务器地址 + /Collections/{Id}/Items/Delete

**Method：** POST

**接口描述：** Removes items from a collection

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Ids | 是 | string |  | Item id, comma delimited |


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

