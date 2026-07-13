# 启动向导（Startup）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：7

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Startup/Complete` | CompleteWizard | Completes the startup wizard. |
| GET | `/Startup/Configuration` | GetStartupConfiguration | Gets the initial startup wizard configuration. |
| POST | `/Startup/Configuration` | UpdateInitialConfiguration | Sets the initial startup wizard configuration. |
| GET | `/Startup/FirstUser` | GetFirstUser_2 | Gets the first user. |
| POST | `/Startup/RemoteAccess` | SetRemoteAccess | Sets remote access and UPnP. |
| GET | `/Startup/User` | GetFirstUser | Gets the first user. |
| POST | `/Startup/User` | UpdateStartupUser | Sets the user name and password. |

---

## CompleteWizard

### 基本信息
**Path：** POST 服务器地址 + /Startup/Complete

**Method：** POST

**接口描述：** Completes the startup wizard.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Startup wizard completed. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetStartupConfiguration

### 基本信息
**Path：** GET 服务器地址 + /Startup/Configuration

**Method：** GET

**接口描述：** Gets the initial startup wizard configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Initial startup wizard configuration retrieved. | StartupConfigurationDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（StartupConfigurationDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerName | string|null | Gets or sets the server name. |
| UICulture | string|null | Gets or sets UI language culture. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| PreferredMetadataLanguage | string|null | Gets or sets the preferred language for the metadata. |


**200 字段说明（StartupConfigurationDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerName | string|null | Gets or sets the server name. |
| UICulture | string|null | Gets or sets UI language culture. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| PreferredMetadataLanguage | string|null | Gets or sets the preferred language for the metadata. |


**200 字段说明（StartupConfigurationDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerName | string|null | Gets or sets the server name. |
| UICulture | string|null | Gets or sets UI language culture. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| PreferredMetadataLanguage | string|null | Gets or sets the preferred language for the metadata. |


---

## UpdateInitialConfiguration

### 基本信息
**Path：** POST 服务器地址 + /Startup/Configuration

**Method：** POST

**接口描述：** Sets the initial startup wizard configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The updated startup configuration.
- Content-Type：`application/json`
- Schema：`StartupConfigurationDto`
- Content-Type：`text/json`
- Schema：`StartupConfigurationDto`
- Content-Type：`application/*+json`
- Schema：`StartupConfigurationDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Configuration saved. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetFirstUser_2

### 基本信息
**Path：** GET 服务器地址 + /Startup/FirstUser

**Method：** GET

**接口描述：** Gets the first user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Initial user retrieved. | StartupUserDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（StartupUserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |


**200 字段说明（StartupUserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |


**200 字段说明（StartupUserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |


---

## SetRemoteAccess

### 基本信息
**Path：** POST 服务器地址 + /Startup/RemoteAccess

**Method：** POST

**接口描述：** Sets remote access and UPnP.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The startup remote access dto.
- Content-Type：`application/json`
- Schema：`StartupRemoteAccessDto`
- Content-Type：`text/json`
- Schema：`StartupRemoteAccessDto`
- Content-Type：`application/*+json`
- Schema：`StartupRemoteAccessDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Configuration saved. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetFirstUser

### 基本信息
**Path：** GET 服务器地址 + /Startup/User

**Method：** GET

**接口描述：** Gets the first user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Initial user retrieved. | StartupUserDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（StartupUserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |


**200 字段说明（StartupUserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |


**200 字段说明（StartupUserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |


---

## UpdateStartupUser

### 基本信息
**Path：** POST 服务器地址 + /Startup/User

**Method：** POST

**接口描述：** Sets the user name and password.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：The DTO containing username and password.
- Content-Type：`application/json`
- Schema：`StartupUserDto`
- Content-Type：`text/json`
- Schema：`StartupUserDto`
- Content-Type：`application/*+json`
- Schema：`StartupUserDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Updated user name and password. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

