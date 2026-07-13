# 运行环境（Environment）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Environment/DefaultDirectoryBrowser` | GetDefaultDirectoryBrowser | Get Default directory browser. |
| GET | `/Environment/DirectoryContents` | GetDirectoryContents | Gets the contents of a given directory in the file system. |
| GET | `/Environment/Drives` | GetDrives | Gets available drives from the server's file system. |
| GET | `/Environment/ParentPath` | GetParentPath | Gets the parent path of a given path. |
| POST | `/Environment/ValidatePath` | ValidatePath | Validates path. |

---

## GetDefaultDirectoryBrowser

### 基本信息
**Path：** GET 服务器地址 + /Environment/DefaultDirectoryBrowser

**Method：** GET

**接口描述：** Get Default directory browser.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Default directory browser returned. | DefaultDirectoryBrowserInfoDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（DefaultDirectoryBrowserInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Path | string|null | Gets or sets the path. |


**200 字段说明（DefaultDirectoryBrowserInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Path | string|null | Gets or sets the path. |


**200 字段说明（DefaultDirectoryBrowserInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Path | string|null | Gets or sets the path. |


---

## GetDirectoryContents

### 基本信息
**Path：** GET 服务器地址 + /Environment/DirectoryContents

**Method：** GET

**接口描述：** Gets the contents of a given directory in the file system.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| path | 是 | string |  | The path. |
| includeFiles | 否 | boolean | false | An optional filter to include or exclude files from the results. true/false. |
| includeDirectories | 否 | boolean | false | An optional filter to include or exclude folders from the results. true/false. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Directory contents returned. | FileSystemEntryInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetDrives

### 基本信息
**Path：** GET 服务器地址 + /Environment/Drives

**Method：** GET

**接口描述：** Gets available drives from the server's file system.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | List of entries returned. | FileSystemEntryInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetParentPath

### 基本信息
**Path：** GET 服务器地址 + /Environment/ParentPath

**Method：** GET

**接口描述：** Gets the parent path of a given path.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| path | 是 | string |  | The path. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ValidatePath

### 基本信息
**Path：** POST 服务器地址 + /Environment/ValidatePath

**Method：** POST

**接口描述：** Validates path.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Validate request object.
- Content-Type：`application/json`
- Schema：`ValidatePathDto`
- Content-Type：`text/json`
- Schema：`ValidatePathDto`
- Content-Type：`application/*+json`
- Schema：`ValidatePathDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Path validated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Path not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

