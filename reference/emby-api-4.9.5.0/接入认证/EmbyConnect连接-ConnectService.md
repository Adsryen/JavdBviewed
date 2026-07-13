# EmbyConnect连接（ConnectService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：接入认证
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Connect/Exchange` | getConnectExchange | Gets the corresponding local user from a connect user id |
| GET | `/Connect/Pending` | getConnectPending | Creates a Connect link for a user |
| DELETE | `/Users/{Id}/Connect/Link` | deleteUsersByIdConnectLink | Removes a Connect link for a user |
| POST | `/Users/{Id}/Connect/Link` | postUsersByIdConnectLink | Creates a Connect link for a user |
| POST | `/Users/{Id}/Connect/Link/Delete` | postUsersByIdConnectLinkDelete | Removes a Connect link for a user |

---

## getConnectExchange

### 基本信息
**Path：** GET 服务器地址 + /Connect/Exchange

**Method：** GET

**接口描述：** Gets the corresponding local user from a connect user id

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ConnectUserId | 是 | string |  | ConnectUserId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ConnectAuthenticationExchangeResult object. | Connect.ConnectAuthenticationExchangeResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Connect.ConnectAuthenticationExchangeResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalUserId | string |  |
| AccessToken | string |  |


**200 字段说明（Connect.ConnectAuthenticationExchangeResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalUserId | string |  |
| AccessToken | string |  |


---

## getConnectPending

### 基本信息
**Path：** GET 服务器地址 + /Connect/Pending

**Method：** GET

**接口描述：** Creates a Connect link for a user

**认证要求：** 管理员认证

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

## deleteUsersByIdConnectLink

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{Id}/Connect/Link

**Method：** DELETE

**接口描述：** Removes a Connect link for a user

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |


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

## postUsersByIdConnectLink

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Connect/Link

**Method：** POST

**接口描述：** Creates a Connect link for a user

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ConnectUsername | 是 | string |  | Connect username |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserLinkResult object. | Connect.UserLinkResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Connect.UserLinkResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsPending | boolean |  |
| IsNewUserInvitation | boolean |  |
| GuestDisplayName | string |  |


**200 字段说明（Connect.UserLinkResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsPending | boolean |  |
| IsNewUserInvitation | boolean |  |
| GuestDisplayName | string |  |


---

## postUsersByIdConnectLinkDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Connect/Link/Delete

**Method：** POST

**接口描述：** Removes a Connect link for a user

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |


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

