# 系统信息（SystemService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：14

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/System/Endpoint` | getSystemEndpoint | Gets information about the request endpoint |
| GET | `/System/Info` | getSystemInfo | Gets information about the server |
| GET | `/System/Info/Public` | getSystemInfoPublic | Gets public information about the server |
| GET | `/System/Logs/{Name}` | getSystemLogsByName | Gets a log file |
| GET | `/System/Logs/{Name}/Lines` | getSystemLogsByNameLines | Gets a log file |
| GET | `/System/Logs/Query` | getSystemLogsQuery | Gets a list of available server log files |
| GET | `/System/Ping` | getSystemPing |  |
| HEAD | `/System/Ping` | headSystemPing |  |
| POST | `/System/Ping` | postSystemPing |  |
| GET | `/System/ReleaseNotes` | getSystemReleasenotes | Gets release notes |
| GET | `/System/ReleaseNotes/Versions` | getSystemReleasenotesVersions | Gets release notes |
| POST | `/System/Restart` | postSystemRestart | Restarts the application, if needed |
| POST | `/System/Shutdown` | postSystemShutdown | Shuts down the application |
| GET | `/System/WakeOnLanInfo` | getSystemWakeonlaninfo | Gets wake on lan information |

---

## getSystemEndpoint

### 基本信息
**Path：** GET 服务器地址 + /System/Endpoint

**Method：** GET

**接口描述：** Gets information about the request endpoint

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a EndPointInfo object. | Net.EndPointInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Net.EndPointInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsLocal | boolean |  |
| IsInNetwork | boolean |  |


**200 字段说明（Net.EndPointInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsLocal | boolean |  |
| IsInNetwork | boolean |  |


---

## getSystemInfo

### 基本信息
**Path：** GET 服务器地址 + /System/Info

**Method：** GET

**接口描述：** Gets information about the server

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SystemInfo object. | SystemInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（SystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| SystemUpdateLevel | PackageVersionClass |  |
| OperatingSystemDisplayName | string |  |
| PackageName | string |  |
| HasPendingRestart | boolean |  |
| IsShuttingDown | boolean |  |
| HasImageEnhancers | boolean |  |
| OperatingSystem | string |  |
| SupportsLibraryMonitor | boolean |  |
| SupportsLocalPortConfiguration | boolean |  |
| SupportsWakeServer | boolean |  |
| WebSocketPortNumber | integer |  |
| CompletedInstallations | InstallationInfo[] |  |
| CanSelfRestart | boolean |  |
| CanSelfUpdate | boolean |  |
| CanLaunchWebBrowser | boolean |  |
| ProgramDataPath | string |  |
| ItemsByNamePath | string |  |
| CachePath | string |  |
| LogPath | string |  |
| InternalMetadataPath | string |  |
| TranscodingTempPath | string |  |
| HttpServerPortNumber | integer |  |
| SupportsHttps | boolean |  |
| HttpsPortNumber | integer |  |
| HasUpdateAvailable | boolean |  |
| SupportsAutoRunAtStartup | boolean |  |
| HardwareAccelerationRequiresPremiere | boolean |  |
| WakeOnLanInfo | WakeOnLanInfo[] |  |
| IsInMaintenanceMode | boolean |  |
| LocalAddress | string |  |
| LocalAddresses | string[] |  |
| WanAddress | string |  |
| RemoteAddresses | string[] |  |
| ServerName | string |  |
| Version | string |  |
| Id | string |  |


**200 字段说明（SystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| SystemUpdateLevel | PackageVersionClass |  |
| OperatingSystemDisplayName | string |  |
| PackageName | string |  |
| HasPendingRestart | boolean |  |
| IsShuttingDown | boolean |  |
| HasImageEnhancers | boolean |  |
| OperatingSystem | string |  |
| SupportsLibraryMonitor | boolean |  |
| SupportsLocalPortConfiguration | boolean |  |
| SupportsWakeServer | boolean |  |
| WebSocketPortNumber | integer |  |
| CompletedInstallations | InstallationInfo[] |  |
| CanSelfRestart | boolean |  |
| CanSelfUpdate | boolean |  |
| CanLaunchWebBrowser | boolean |  |
| ProgramDataPath | string |  |
| ItemsByNamePath | string |  |
| CachePath | string |  |
| LogPath | string |  |
| InternalMetadataPath | string |  |
| TranscodingTempPath | string |  |
| HttpServerPortNumber | integer |  |
| SupportsHttps | boolean |  |
| HttpsPortNumber | integer |  |
| HasUpdateAvailable | boolean |  |
| SupportsAutoRunAtStartup | boolean |  |
| HardwareAccelerationRequiresPremiere | boolean |  |
| WakeOnLanInfo | WakeOnLanInfo[] |  |
| IsInMaintenanceMode | boolean |  |
| LocalAddress | string |  |
| LocalAddresses | string[] |  |
| WanAddress | string |  |
| RemoteAddresses | string[] |  |
| ServerName | string |  |
| Version | string |  |
| Id | string |  |


---

## getSystemInfoPublic

### 基本信息
**Path：** GET 服务器地址 + /System/Info/Public

**Method：** GET

**接口描述：** Gets public information about the server

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PublicSystemInfo object. | PublicSystemInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（PublicSystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string |  |
| LocalAddresses | string[] |  |
| WanAddress | string |  |
| RemoteAddresses | string[] |  |
| ServerName | string |  |
| Version | string |  |
| Id | string |  |


**200 字段说明（PublicSystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string |  |
| LocalAddresses | string[] |  |
| WanAddress | string |  |
| RemoteAddresses | string[] |  |
| ServerName | string |  |
| Version | string |  |
| Id | string |  |


---

## getSystemLogsByName

### 基本信息
**Path：** GET 服务器地址 + /System/Logs/{Name}

**Method：** GET

**接口描述：** Gets a log file

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | The log file name. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Sanitize | 否 | boolean |  | Return sanitized log |


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

## getSystemLogsByNameLines

### 基本信息
**Path：** GET 服务器地址 + /System/Logs/{Name}/Lines

**Method：** GET

**接口描述：** Gets a log file

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | The log file name. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<String> object. | QueryResult_String |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_String）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | string[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_String）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | string[] |  |
| TotalRecordCount | integer |  |


---

## getSystemLogsQuery

### 基本信息
**Path：** GET 服务器地址 + /System/Logs/Query

**Method：** GET

**接口描述：** Gets a list of available server log files

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<LogFile> object. | QueryResult_LogFile |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_LogFile）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | LogFile[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_LogFile）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | LogFile[] |  |
| TotalRecordCount | integer |  |


---

## getSystemPing

### 基本信息
**Path：** GET 服务器地址 + /System/Ping

**Method：** GET

**接口描述：** Requires authentication as user

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

## headSystemPing

### 基本信息
**Path：** HEAD 服务器地址 + /System/Ping

**Method：** HEAD

**接口描述：** Requires authentication as user

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

## postSystemPing

### 基本信息
**Path：** POST 服务器地址 + /System/Ping

**Method：** POST

**接口描述：** Requires authentication as user

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

## getSystemReleasenotes

### 基本信息
**Path：** GET 服务器地址 + /System/ReleaseNotes

**Method：** GET

**接口描述：** Gets release notes

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PackageVersionInfo object. | PackageVersionInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（PackageVersionInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| name | string |  |
| guid | string |  |
| versionStr | string |  |
| classification | PackageVersionClass |  |
| description | string |  |
| requiredVersionStr | string |  |
| sourceUrl | string |  |
| checksum | string |  |
| targetFilename | string |  |
| infoUrl | string |  |
| runtimes | string |  |
| timestamp | string|null |  |


**200 字段说明（PackageVersionInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| name | string |  |
| guid | string |  |
| versionStr | string |  |
| classification | PackageVersionClass |  |
| description | string |  |
| requiredVersionStr | string |  |
| sourceUrl | string |  |
| checksum | string |  |
| targetFilename | string |  |
| infoUrl | string |  |
| runtimes | string |  |
| timestamp | string|null |  |


---

## getSystemReleasenotesVersions

### 基本信息
**Path：** GET 服务器地址 + /System/ReleaseNotes/Versions

**Method：** GET

**接口描述：** Gets release notes

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PackageVersionInfo[] object. | PackageVersionInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postSystemRestart

### 基本信息
**Path：** POST 服务器地址 + /System/Restart

**Method：** POST

**接口描述：** Restarts the application, if needed

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

## postSystemShutdown

### 基本信息
**Path：** POST 服务器地址 + /System/Shutdown

**Method：** POST

**接口描述：** Shuts down the application

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

## getSystemWakeonlaninfo

### 基本信息
**Path：** GET 服务器地址 + /System/WakeOnLanInfo

**Method：** GET

**接口描述：** Gets wake on lan information

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a WakeOnLanInfo[] object. | WakeOnLanInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

