# 媒体库结构（LibraryStructureService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：10

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Library/VirtualFolders` | deleteLibraryVirtualfolders |  |
| POST | `/Library/VirtualFolders` | postLibraryVirtualfolders |  |
| POST | `/Library/VirtualFolders/Delete` | postLibraryVirtualfoldersDelete |  |
| POST | `/Library/VirtualFolders/LibraryOptions` | postLibraryVirtualfoldersLibraryoptions |  |
| POST | `/Library/VirtualFolders/Name` | postLibraryVirtualfoldersName |  |
| DELETE | `/Library/VirtualFolders/Paths` | deleteLibraryVirtualfoldersPaths |  |
| POST | `/Library/VirtualFolders/Paths` | postLibraryVirtualfoldersPaths |  |
| POST | `/Library/VirtualFolders/Paths/Delete` | postLibraryVirtualfoldersPathsDelete |  |
| POST | `/Library/VirtualFolders/Paths/Update` | postLibraryVirtualfoldersPathsUpdate |  |
| GET | `/Library/VirtualFolders/Query` | getLibraryVirtualfoldersQuery |  |

---

## deleteLibraryVirtualfolders

### 基本信息
**Path：** DELETE 服务器地址 + /Library/VirtualFolders

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

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

## postLibraryVirtualfolders

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：AddVirtualFolder
- Content-Type：`application/json`
- Schema：`Library.AddVirtualFolder`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| CollectionType | string |  |
| RefreshLibrary | boolean |  |
| Paths | string[] |  |
| LibraryOptions | LibraryOptions |  |

- Content-Type：`application/xml`
- Schema：`Library.AddVirtualFolder`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| CollectionType | string |  |
| RefreshLibrary | boolean |  |
| Paths | string[] |  |
| LibraryOptions | LibraryOptions |  |



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

## postLibraryVirtualfoldersDelete

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Delete

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoveVirtualFolder
- Content-Type：`application/json`
- Schema：`Library.RemoveVirtualFolder`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| RefreshLibrary | boolean |  |

- Content-Type：`application/xml`
- Schema：`Library.RemoveVirtualFolder`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| RefreshLibrary | boolean |  |



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

## postLibraryVirtualfoldersLibraryoptions

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/LibraryOptions

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：UpdateLibraryOptions
- Content-Type：`application/json`
- Schema：`Library.UpdateLibraryOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| LibraryOptions | LibraryOptions |  |

- Content-Type：`application/xml`
- Schema：`Library.UpdateLibraryOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| LibraryOptions | LibraryOptions |  |



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

## postLibraryVirtualfoldersName

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Name

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RenameVirtualFolder
- Content-Type：`application/json`
- Schema：`Library.RenameVirtualFolder`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| NewName | string |  |

- Content-Type：`application/xml`
- Schema：`Library.RenameVirtualFolder`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| NewName | string |  |



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

## deleteLibraryVirtualfoldersPaths

### 基本信息
**Path：** DELETE 服务器地址 + /Library/VirtualFolders/Paths

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

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

## postLibraryVirtualfoldersPaths

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Paths

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：AddMediaPath
- Content-Type：`application/json`
- Schema：`Library.AddMediaPath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Path | string |  |
| PathInfo | MediaPathInfo |  |
| RefreshLibrary | boolean |  |

- Content-Type：`application/xml`
- Schema：`Library.AddMediaPath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Path | string |  |
| PathInfo | MediaPathInfo |  |
| RefreshLibrary | boolean |  |



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

## postLibraryVirtualfoldersPathsDelete

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Paths/Delete

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoveMediaPath
- Content-Type：`application/json`
- Schema：`Library.RemoveMediaPath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Path | string |  |
| RefreshLibrary | boolean |  |

- Content-Type：`application/xml`
- Schema：`Library.RemoveMediaPath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Path | string |  |
| RefreshLibrary | boolean |  |



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

## postLibraryVirtualfoldersPathsUpdate

### 基本信息
**Path：** POST 服务器地址 + /Library/VirtualFolders/Paths/Update

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：UpdateMediaPath
- Content-Type：`application/json`
- Schema：`Library.UpdateMediaPath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| PathInfo | MediaPathInfo |  |

- Content-Type：`application/xml`
- Schema：`Library.UpdateMediaPath`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| PathInfo | MediaPathInfo |  |



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

## getLibraryVirtualfoldersQuery

### 基本信息
**Path：** GET 服务器地址 + /Library/VirtualFolders/Query

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<VirtualFolderInfo> object. | QueryResult_VirtualFolderInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_VirtualFolderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | VirtualFolderInfo[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_VirtualFolderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | VirtualFolderInfo[] |  |
| TotalRecordCount | integer |  |


---

