# 视频附加（VideosService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Videos/{Id}/AlternateSources` | deleteVideosByIdAlternatesources | Removes alternate video sources. |
| POST | `/Videos/{Id}/AlternateSources/Delete` | postVideosByIdAlternatesourcesDelete | Removes alternate video sources. |
| POST | `/Videos/MergeVersions` | postVideosMergeversions | Merges videos into a single record |

---

## deleteVideosByIdAlternatesources

### 基本信息
**Path：** DELETE 服务器地址 + /Videos/{Id}/AlternateSources

**Method：** DELETE

**接口描述：** Removes alternate video sources.

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## postVideosByIdAlternatesourcesDelete

### 基本信息
**Path：** POST 服务器地址 + /Videos/{Id}/AlternateSources/Delete

**Method：** POST

**接口描述：** Removes alternate video sources.

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## postVideosMergeversions

### 基本信息
**Path：** POST 服务器地址 + /Videos/MergeVersions

**Method：** POST

**接口描述：** Merges videos into a single record

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Ids | 否 | string |  | Item id list. This allows multiple, comma delimited. |


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

