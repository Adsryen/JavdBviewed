# 运行环境（EnvironmentService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：8

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Environment/DefaultDirectoryBrowser` | getEnvironmentDefaultdirectorybrowser | Gets the parent path of a given path |
| GET | `/Environment/DirectoryContents` | getEnvironmentDirectorycontents | Gets the contents of a given directory in the file system |
| POST | `/Environment/DirectoryContents` | postEnvironmentDirectorycontents | Gets the contents of a given directory in the file system |
| GET | `/Environment/Drives` | getEnvironmentDrives | Gets available drives from the server's file system |
| GET | `/Environment/NetworkDevices` | getEnvironmentNetworkdevices | Gets a list of devices on the network |
| GET | `/Environment/NetworkShares` | getEnvironmentNetworkshares | Gets shares from a network device |
| GET | `/Environment/ParentPath` | getEnvironmentParentpath | Gets the parent path of a given path |
| POST | `/Environment/ValidatePath` | postEnvironmentValidatepath | Gets the contents of a given directory in the file system |

---

## getEnvironmentDefaultdirectorybrowser

### 基本信息
**Path：** GET 服务器地址 + /Environment/DefaultDirectoryBrowser

**Method：** GET

**接口描述：** Gets the parent path of a given path

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DefaultDirectoryBrowserInfo object. | DefaultDirectoryBrowserInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（DefaultDirectoryBrowserInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Path | string |  |


**200 字段说明（DefaultDirectoryBrowserInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Path | string |  |


---

## getEnvironmentDirectorycontents

### 基本信息
**Path：** GET 服务器地址 + /Environment/DirectoryContents

**Method：** GET

**接口描述：** Gets the contents of a given directory in the file system

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Path | 是 | string |  |  |
| IncludeFiles | 否 | boolean |  | An optional filter to include or exclude files from the results. true/false |
| IncludeDirectories | 否 | boolean |  | An optional filter to include or exclude folders from the results. true/false |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<FileSystemEntryInfo> object. | IO.FileSystemEntryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postEnvironmentDirectorycontents

### 基本信息
**Path：** POST 服务器地址 + /Environment/DirectoryContents

**Method：** POST

**接口描述：** Gets the contents of a given directory in the file system

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Path | 是 | string |  |  |
| IncludeFiles | 否 | boolean |  | An optional filter to include or exclude files from the results. true/false |
| IncludeDirectories | 否 | boolean |  | An optional filter to include or exclude folders from the results. true/false |


**Body**

- 是否必须：是
- 描述：GetDirectoryContents
- Content-Type：`application/json`
- Schema：`GetDirectoryContents`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Username | string |  |
| Password | string |  |

- Content-Type：`application/xml`
- Schema：`GetDirectoryContents`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Username | string |  |
| Password | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<FileSystemEntryInfo> object. | IO.FileSystemEntryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getEnvironmentDrives

### 基本信息
**Path：** GET 服务器地址 + /Environment/Drives

**Method：** GET

**接口描述：** Gets available drives from the server's file system

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<FileSystemEntryInfo> object. | IO.FileSystemEntryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getEnvironmentNetworkdevices

### 基本信息
**Path：** GET 服务器地址 + /Environment/NetworkDevices

**Method：** GET

**接口描述：** Gets a list of devices on the network

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<FileSystemEntryInfo> object. | IO.FileSystemEntryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getEnvironmentNetworkshares

### 基本信息
**Path：** GET 服务器地址 + /Environment/NetworkShares

**Method：** GET

**接口描述：** Gets shares from a network device

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Path | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<FileSystemEntryInfo> object. | IO.FileSystemEntryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getEnvironmentParentpath

### 基本信息
**Path：** GET 服务器地址 + /Environment/ParentPath

**Method：** GET

**接口描述：** Gets the parent path of a given path

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Path | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a String object. | string |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postEnvironmentValidatepath

### 基本信息
**Path：** POST 服务器地址 + /Environment/ValidatePath

**Method：** POST

**接口描述：** Gets the contents of a given directory in the file system

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Path | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：ValidatePath
- Content-Type：`application/json`
- Schema：`ValidatePath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ValidateWriteable | boolean |  |
| IsFile | boolean|null |  |
| Username | string |  |
| Password | string |  |

- Content-Type：`application/xml`
- Schema：`ValidatePath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ValidateWriteable | boolean |  |
| IsFile | boolean|null |  |
| Username | string |  |
| Password | string |  |



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

