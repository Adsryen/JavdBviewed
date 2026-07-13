# 一起看（PartyService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Parties` | getParties | Gets a list of active parties |
| POST | `/Parties` | postParties | Creates a party |
| POST | `/Parties/{Id}/Join` | postPartiesByIdJoin | Joins a party |
| GET | `/Parties/Info` | getPartiesInfo | Gets info about the session's current party |
| POST | `/Parties/Leave` | postPartiesLeave | Leaves a party |

---

## getParties

### 基本信息
**Path：** GET 服务器地址 + /Parties

**Method：** GET

**接口描述：** Gets a list of active parties

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postParties

### 基本信息
**Path：** POST 服务器地址 + /Parties

**Method：** POST

**接口描述：** Creates a party

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PartyInfoResult object. | Session.PartyInfoResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Session.PartyInfoResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| PartyInfo | Session.PartyInfo |  |


**200 字段说明（Session.PartyInfoResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| PartyInfo | Session.PartyInfo |  |


---

## postPartiesByIdJoin

### 基本信息
**Path：** POST 服务器地址 + /Parties/{Id}/Join

**Method：** POST

**接口描述：** Joins a party

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Name |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PartyInfoResult object. | Session.PartyInfoResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Session.PartyInfoResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| PartyInfo | Session.PartyInfo |  |


**200 字段说明（Session.PartyInfoResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| PartyInfo | Session.PartyInfo |  |


---

## getPartiesInfo

### 基本信息
**Path：** GET 服务器地址 + /Parties/Info

**Method：** GET

**接口描述：** Gets info about the session's current party

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PartyInfoResult object. | Session.PartyInfoResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Session.PartyInfoResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| PartyInfo | Session.PartyInfo |  |


**200 字段说明（Session.PartyInfoResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| PartyInfo | Session.PartyInfo |  |


---

## postPartiesLeave

### 基本信息
**Path：** POST 服务器地址 + /Parties/Leave

**Method：** POST

**接口描述：** Leaves a party

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

