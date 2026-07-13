# OpenAPI规范（OpenApiService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：接入认证
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/openapi` | getOpenapi | Gets the OpenAPI 3 specifications |
| GET | `/openapi.json` | getOpenapiJson | Gets OpenAPI 3 specifications |
| GET | `/swagger` | getSwagger | Gets the swagger specifications |
| GET | `/swagger.json` | getSwaggerJson | Gets the swagger specifications |

---

## getOpenapi

### 基本信息
**Path：** GET 服务器地址 + /openapi

**Method：** GET

**接口描述：** Gets the OpenAPI 3 specifications

**认证要求：** 无需认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a String object. | string |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getOpenapiJson

### 基本信息
**Path：** GET 服务器地址 + /openapi.json

**Method：** GET

**接口描述：** Gets OpenAPI 3 specifications

**认证要求：** 无需认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a String object. | string |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getSwagger

### 基本信息
**Path：** GET 服务器地址 + /swagger

**Method：** GET

**接口描述：** Gets the swagger specifications

**认证要求：** 无需认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a String object. | string |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getSwaggerJson

### 基本信息
**Path：** GET 服务器地址 + /swagger.json

**Method：** GET

**接口描述：** Gets the swagger specifications

**认证要求：** 无需认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a String object. | string |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

