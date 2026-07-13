# 媒体库结构（LibraryStructure）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：8

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Library/VirtualFolders` | RemoveVirtualFolder | Removes a virtual folder. |
| GET | `/Library/VirtualFolders` | GetVirtualFolders | Gets all virtual folders. |
| POST | `/Library/VirtualFolders` | AddVirtualFolder | Adds a virtual folder. |
| POST | `/Library/VirtualFolders/LibraryOptions` | UpdateLibraryOptions | Update library options. |
| POST | `/Library/VirtualFolders/Name` | RenameVirtualFolder | Renames a virtual folder. |
| DELETE | `/Library/VirtualFolders/Paths` | RemoveMediaPath | Remove a media path. |
| POST | `/Library/VirtualFolders/Paths` | AddMediaPath | Add a media path to a library. |
| POST | `/Library/VirtualFolders/Paths/Update` | UpdateMediaPath | Updates a media path. |

---

## RemoveVirtualFolder

### 基本信息
**Path：** DELETE 服务器地址 + /Library/VirtualFolders

**Method：** DELETE

**接口描述：** Removes a virtual folder.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The name of the folder. |
| refreshLibrary | 否 | boolean | false | Whether to refresh the library. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Folder removed. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Folder not found. |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetVirtualFolders

### 基本信息
**Path：** GET 服务器地址 + /Library/VirtualFolders

**Method：** GET

**接口描述：** Gets all virtual folders.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Virtual folders retrieved. | VirtualFolderInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AddVirtualFolder

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders

**Method：** POST

**接口描述：** Adds a virtual folder.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The name of the virtual folder. |
| collectionType | 否 | string enum(movies|tvshows|music|musicvideos|homevideos|boxsets|books|mixed) |  | The type of the collection. |
| paths | 否 | string[] |  | The paths of the virtual folder. |
| refreshLibrary | 否 | boolean | false | Whether to refresh the library. |


**Body**

- 是否必须：否
- 描述：The library options.
- Content-Type：`application/json`
- Schema：`AddVirtualFolderDto`
- Content-Type：`text/json`
- Schema：`AddVirtualFolderDto`
- Content-Type：`application/*+json`
- Schema：`AddVirtualFolderDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Folder added. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateLibraryOptions

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/LibraryOptions

**Method：** POST

**接口描述：** Update library options.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：The library name and options.
- Content-Type：`application/json`
- Schema：`UpdateLibraryOptionsDto`
- Content-Type：`text/json`
- Schema：`UpdateLibraryOptionsDto`
- Content-Type：`application/*+json`
- Schema：`UpdateLibraryOptionsDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Library updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RenameVirtualFolder

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Name

**Method：** POST

**接口描述：** Renames a virtual folder.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The name of the virtual folder. |
| newName | 否 | string |  | The new name. |
| refreshLibrary | 否 | boolean | false | Whether to refresh the library. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Folder renamed. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Library doesn't exist. | ProblemDetails |
| 409 | Library already exists. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RemoveMediaPath

### 基本信息
**Path：** DELETE 服务器地址 + /Library/VirtualFolders/Paths

**Method：** DELETE

**接口描述：** Remove a media path.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The name of the library. |
| path | 否 | string |  | The path to remove. |
| refreshLibrary | 否 | boolean | false | Whether to refresh the library. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Media path removed. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AddMediaPath

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Paths

**Method：** POST

**接口描述：** Add a media path to a library.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| refreshLibrary | 否 | boolean | false | Whether to refresh the library. |


**Body**

- 是否必须：是
- 描述：The media path dto.
- Content-Type：`application/json`
- Schema：`MediaPathDto`
- Content-Type：`text/json`
- Schema：`MediaPathDto`
- Content-Type：`application/*+json`
- Schema：`MediaPathDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Media path added. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateMediaPath

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Paths/Update

**Method：** POST

**接口描述：** Updates a media path.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The name of the library and path infos.
- Content-Type：`application/json`
- Schema：`UpdateMediaPathRequestDto`
- Content-Type：`text/json`
- Schema：`UpdateMediaPathRequestDto`
- Content-Type：`application/*+json`
- Schema：`UpdateMediaPathRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Media path updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

