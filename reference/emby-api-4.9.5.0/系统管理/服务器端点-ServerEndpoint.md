# 服务器端点（ServerEndpoint）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Simkl/oauth/pin` | getSimklOauthPin |  |
| GET | `/Simkl/oauth/pin/{user_code}` | getSimklOauthPinByUserCode |  |
| GET | `/Simkl/users/settings/{userId}` | getSimklUsersSettingsByUserid |  |

---

## getSimklOauthPin

### 基本信息
**Path：** GET 服务器地址 + /Simkl/oauth/pin

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a CodeResponse object. | Simkl.Api.Responses.CodeResponse |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Simkl.Api.Responses.CodeResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| result | string |  |
| device_code | string |  |
| user_code | string |  |
| verification_url | string |  |
| expires_in | integer |  |
| interval | integer |  |


**200 字段说明（Simkl.Api.Responses.CodeResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| result | string |  |
| device_code | string |  |
| user_code | string |  |
| verification_url | string |  |
| expires_in | integer |  |
| interval | integer |  |


---

## getSimklOauthPinByUserCode

### 基本信息
**Path：** GET 服务器地址 + /Simkl/oauth/pin/{user_code}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| user_code | 是 | string |  | pin to be introduced by the user |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a CodeStatusResponse object. | Simkl.Api.Responses.CodeStatusResponse |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Simkl.Api.Responses.CodeStatusResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| result | string |  |
| message | string |  |
| access_token | string |  |


**200 字段说明（Simkl.Api.Responses.CodeStatusResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| result | string |  |
| message | string |  |
| access_token | string |  |


---

## getSimklUsersSettingsByUserid

### 基本信息
**Path：** GET 服务器地址 + /Simkl/users/settings/{userId}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 是 | string |  | emby's user id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserSettings object. | Simkl.Api.Objects.UserSettings |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Simkl.Api.Objects.UserSettings）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| user | Simkl.Api.Objects.User |  |
| account | Simkl.Api.Objects.Account |  |
| error | string |  |


**200 字段说明（Simkl.Api.Objects.UserSettings）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| user | Simkl.Api.Objects.User |  |
| account | Simkl.Api.Objects.Account |  |
| error | string |  |


---

