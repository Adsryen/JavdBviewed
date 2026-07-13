# 用户管理（User）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：接入认证
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：10

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Users` | GetUsers | Gets a list of users. |
| POST | `/Users` | UpdateUser | Updates a user. |
| DELETE | `/Users/{userId}` | DeleteUser | Deletes a user. |
| GET | `/Users/{userId}` | GetUserById | Gets a user by Id. |
| POST | `/Users/{userId}/Policy` | UpdateUserPolicy | Updates a user policy. |
| POST | `/Users/Configuration` | UpdateUserConfiguration | Updates a user configuration. |
| GET | `/Users/Me` | GetCurrentUser | Gets the user based on auth token. |
| POST | `/Users/New` | CreateUserByName | Creates a user. |
| POST | `/Users/Password` | UpdateUserPassword | Updates a user's password. |
| GET | `/Users/Public` | GetPublicUsers | Gets a list of publicly visible users for display on a login screen. |

---

## GetUsers

### 基本信息
**Path：** GET 服务器地址 + /Users

**Method：** GET

**接口描述：** Gets a list of users.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| isHidden | 否 | boolean |  | Optional filter by IsHidden=true or false. |
| isDisabled | 否 | boolean |  | Optional filter by IsDisabled=true or false. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Users returned. | UserDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateUser

### 基本信息
**Path：** POST 服务器地址 + /Users

**Method：** POST

**接口描述：** Updates a user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |


**Body**

- 是否必须：是
- 描述：The updated user model.
- Content-Type：`application/json`
- Schema：`UserDto`
- Content-Type：`text/json`
- Schema：`UserDto`
- Content-Type：`application/*+json`
- Schema：`UserDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User updated. |  |
| 400 | User information was not supplied. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | User update forbidden. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DeleteUser

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{userId}

**Method：** DELETE

**接口描述：** Deletes a user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 是 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | User not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetUserById

### 基本信息
**Path：** GET 服务器地址 + /Users/{userId}

**Method：** GET

**接口描述：** Gets a user by Id.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 是 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User returned. | UserDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | User not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


---

## UpdateUserPolicy

### 基本信息
**Path：** POST 服务器地址 + /Users/{userId}/Policy

**Method：** POST

**接口描述：** Updates a user policy.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 是 | string |  | The user id. |


**Body**

- 是否必须：是
- 描述：The new user policy.
- Content-Type：`application/json`
- Schema：`UserPolicy`
- Content-Type：`text/json`
- Schema：`UserPolicy`
- Content-Type：`application/*+json`
- Schema：`UserPolicy`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User policy updated. |  |
| 400 | User policy was not supplied. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | User policy update forbidden. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateUserConfiguration

### 基本信息
**Path：** POST 服务器地址 + /Users/Configuration

**Method：** POST

**接口描述：** Updates a user configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |


**Body**

- 是否必须：是
- 描述：The new user configuration.
- Content-Type：`application/json`
- Schema：`UserConfiguration`
- Content-Type：`text/json`
- Schema：`UserConfiguration`
- Content-Type：`application/*+json`
- Schema：`UserConfiguration`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User configuration updated. |  |
| 401 | Unauthorized |  |
| 403 | User configuration update forbidden. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetCurrentUser

### 基本信息
**Path：** GET 服务器地址 + /Users/Me

**Method：** GET

**接口描述：** Gets the user based on auth token.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User returned. | UserDto |
| 400 | Token is not owned by a user. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


---

## CreateUserByName

### 基本信息
**Path：** POST 服务器地址 + /Users/New

**Method：** POST

**接口描述：** Creates a user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The create user by name request body.
- Content-Type：`application/json`
- Schema：`CreateUserByName`
- Content-Type：`text/json`
- Schema：`CreateUserByName`
- Content-Type：`application/*+json`
- Schema：`CreateUserByName`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User created. | UserDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |


---

## UpdateUserPassword

### 基本信息
**Path：** POST 服务器地址 + /Users/Password

**Method：** POST

**接口描述：** Updates a user's password.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |


**Body**

- 是否必须：是
- 描述：The M:Jellyfin.Api.Controllers.UserController.UpdateUserPassword(System.Nullable{System.Guid},Jellyfin.Api.Models.UserDtos.UpdateUserPassword) request.
- Content-Type：`application/json`
- Schema：`UpdateUserPassword`
- Content-Type：`text/json`
- Schema：`UpdateUserPassword`
- Content-Type：`application/*+json`
- Schema：`UpdateUserPassword`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Password successfully reset. |  |
| 401 | Unauthorized |  |
| 403 | User is not allowed to update the password. | ProblemDetails |
| 404 | User not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPublicUsers

### 基本信息
**Path：** GET 服务器地址 + /Users/Public

**Method：** GET

**接口描述：** Gets a list of publicly visible users for display on a login screen.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Public users returned. | UserDto[] |
| 503 | The server is currently starting or is temporarily not available. |  |

---

