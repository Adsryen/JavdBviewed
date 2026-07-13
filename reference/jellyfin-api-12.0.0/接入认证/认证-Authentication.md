# 认证（Authentication）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：接入认证
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：13

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Auth/Keys` | GetKeys | Get all keys. |
| POST | `/Auth/Keys` | CreateKey | Create a new api key. |
| DELETE | `/Auth/Keys/{key}` | RevokeKey | Remove an api key. |
| GET | `/Auth/PasswordResetProviders` | GetPasswordResetProviders | Get all password reset providers. |
| GET | `/Auth/Providers` | GetAuthProviders | Get all auth providers. |
| POST | `/QuickConnect/Authorize` | AuthorizeQuickConnect | Authorizes a pending quick connect request. |
| GET | `/QuickConnect/Connect` | GetQuickConnectState | Attempts to retrieve authentication information. |
| GET | `/QuickConnect/Enabled` | GetQuickConnectEnabled | Gets the current quick connect state. |
| POST | `/QuickConnect/Initiate` | InitiateQuickConnect | Initiate a new quick connect request. |
| POST | `/Users/AuthenticateByName` | AuthenticateUserByName | Authenticates a user by name. |
| POST | `/Users/AuthenticateWithQuickConnect` | AuthenticateWithQuickConnect | Authenticates a user with quick connect. |
| POST | `/Users/ForgotPassword` | ForgotPassword | Initiates the forgot password process for a local user. |
| POST | `/Users/ForgotPassword/Pin` | ForgotPasswordPin | Redeems a forgot password pin. |

---

## GetKeys

### 基本信息
**Path：** GET 服务器地址 + /Auth/Keys

**Method：** GET

**接口描述：** Get all keys.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Api keys retrieved. | AuthenticationInfoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（AuthenticationInfoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | AuthenticationInfo[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（AuthenticationInfoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | AuthenticationInfo[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（AuthenticationInfoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | AuthenticationInfo[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## CreateKey

### 基本信息
**Path：** POST 服务器地址 + /Auth/Keys

**Method：** POST

**接口描述：** Create a new api key.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| app | 是 | string |  | Name of the app using the authentication key. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Api key created. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RevokeKey

### 基本信息
**Path：** DELETE 服务器地址 + /Auth/Keys/{key}

**Method：** DELETE

**接口描述：** Remove an api key.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| key | 是 | string |  | The access token to delete. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Api key deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPasswordResetProviders

### 基本信息
**Path：** GET 服务器地址 + /Auth/PasswordResetProviders

**Method：** GET

**接口描述：** Get all password reset providers.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Password reset providers retrieved. | NameIdPair[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetAuthProviders

### 基本信息
**Path：** GET 服务器地址 + /Auth/Providers

**Method：** GET

**接口描述：** Get all auth providers.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Auth providers retrieved. | NameIdPair[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AuthorizeQuickConnect

### 基本信息
**Path：** POST 服务器地址 + /QuickConnect/Authorize

**Method：** POST

**接口描述：** Authorizes a pending quick connect request.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| code | 是 | string |  | Quick connect code to authorize. |
| userId | 否 | string |  | The user the authorize. Access to the requested user is required. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Quick connect result authorized successfully. | boolean |
| 401 | Unauthorized |  |
| 403 | Unknown user id. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetQuickConnectState

### 基本信息
**Path：** GET 服务器地址 + /QuickConnect/Connect

**Method：** GET

**接口描述：** Attempts to retrieve authentication information.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| secret | 是 | string |  | Secret previously returned from the Initiate endpoint. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Quick connect result returned. | QuickConnectResult |
| 404 | Unknown quick connect secret. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（QuickConnectResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |


**200 字段说明（QuickConnectResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |


**200 字段说明（QuickConnectResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |


---

## GetQuickConnectEnabled

### 基本信息
**Path：** GET 服务器地址 + /QuickConnect/Enabled

**Method：** GET

**接口描述：** Gets the current quick connect state.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Quick connect state returned. | boolean |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## InitiateQuickConnect

### 基本信息
**Path：** POST 服务器地址 + /QuickConnect/Initiate

**Method：** POST

**接口描述：** Initiate a new quick connect request.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Quick connect request successfully created. | QuickConnectResult |
| 401 | Quick connect is not active on this server. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（QuickConnectResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |


**200 字段说明（QuickConnectResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |


**200 字段说明（QuickConnectResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |


---

## AuthenticateUserByName

### 基本信息
**Path：** POST 服务器地址 + /Users/AuthenticateByName

**Method：** POST

**接口描述：** Authenticates a user by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The M:Jellyfin.Api.Controllers.UserController.AuthenticateUserByName(Jellyfin.Api.Models.UserDtos.AuthenticateUserByName) request.
- Content-Type：`application/json`
- Schema：`AuthenticateUserByName`
- Content-Type：`text/json`
- Schema：`AuthenticateUserByName`
- Content-Type：`application/*+json`
- Schema：`AuthenticateUserByName`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User authenticated. | AuthenticationResult |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |


**200 字段说明（AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |


**200 字段说明（AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |


---

## AuthenticateWithQuickConnect

### 基本信息
**Path：** POST 服务器地址 + /Users/AuthenticateWithQuickConnect

**Method：** POST

**接口描述：** Authenticates a user with quick connect.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The Jellyfin.Api.Models.UserDtos.QuickConnectDto request.
- Content-Type：`application/json`
- Schema：`QuickConnectDto`
- Content-Type：`text/json`
- Schema：`QuickConnectDto`
- Content-Type：`application/*+json`
- Schema：`QuickConnectDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User authenticated. | AuthenticationResult |
| 400 | Missing token. |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |


**200 字段说明（AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |


**200 字段说明（AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |


---

## ForgotPassword

### 基本信息
**Path：** POST 服务器地址 + /Users/ForgotPassword

**Method：** POST

**接口描述：** Initiates the forgot password process for a local user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The forgot password request containing the entered username.
- Content-Type：`application/json`
- Schema：`ForgotPasswordDto`
- Content-Type：`text/json`
- Schema：`ForgotPasswordDto`
- Content-Type：`application/*+json`
- Schema：`ForgotPasswordDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Password reset process started. | ForgotPasswordResult |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ForgotPasswordResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Action | string enum(ContactAdmin|PinCode|InNetworkRequired) | Gets or sets the action. |
| PinFile | string|null | Gets or sets the pin file. |
| PinExpirationDate | string|null | Gets or sets the pin expiration date. |


**200 字段说明（ForgotPasswordResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Action | string enum(ContactAdmin|PinCode|InNetworkRequired) | Gets or sets the action. |
| PinFile | string|null | Gets or sets the pin file. |
| PinExpirationDate | string|null | Gets or sets the pin expiration date. |


**200 字段说明（ForgotPasswordResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Action | string enum(ContactAdmin|PinCode|InNetworkRequired) | Gets or sets the action. |
| PinFile | string|null | Gets or sets the pin file. |
| PinExpirationDate | string|null | Gets or sets the pin expiration date. |


---

## ForgotPasswordPin

### 基本信息
**Path：** POST 服务器地址 + /Users/ForgotPassword/Pin

**Method：** POST

**接口描述：** Redeems a forgot password pin.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The forgot password pin request containing the entered pin.
- Content-Type：`application/json`
- Schema：`ForgotPasswordPinDto`
- Content-Type：`text/json`
- Schema：`ForgotPasswordPinDto`
- Content-Type：`application/*+json`
- Schema：`ForgotPasswordPinDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Pin reset process started. | PinRedeemResult |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PinRedeemResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Success | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Users.PinRedeemResult is success. |
| UsersReset | string[] | Gets or sets the users reset. |


**200 字段说明（PinRedeemResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Success | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Users.PinRedeemResult is success. |
| UsersReset | string[] | Gets or sets the users reset. |


**200 字段说明（PinRedeemResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Success | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Users.PinRedeemResult is success. |
| UsersReset | string[] | Gets or sets the users reset. |


---

