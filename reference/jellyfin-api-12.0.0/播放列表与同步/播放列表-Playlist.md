# 播放列表（Playlist）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放列表与同步
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：11

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Playlists` | CreatePlaylist | Creates a new playlist. |
| GET | `/Playlists/{playlistId}` | GetPlaylist | Get a playlist. |
| POST | `/Playlists/{playlistId}` | UpdatePlaylist | Updates a playlist. |
| DELETE | `/Playlists/{playlistId}/Items` | RemoveItemFromPlaylist | Removes items from a playlist. |
| GET | `/Playlists/{playlistId}/Items` | GetPlaylistItems | Gets the original items of a playlist. |
| POST | `/Playlists/{playlistId}/Items` | AddItemToPlaylist | Adds items to a playlist. |
| POST | `/Playlists/{playlistId}/Items/{itemId}/Move/{newIndex}` | MoveItem | Moves a playlist item. |
| GET | `/Playlists/{playlistId}/Users` | GetPlaylistUsers | Get a playlist's users. |
| DELETE | `/Playlists/{playlistId}/Users/{userId}` | RemoveUserFromPlaylist | Remove a user from a playlist's users. |
| GET | `/Playlists/{playlistId}/Users/{userId}` | GetPlaylistUser | Get a playlist user. |
| POST | `/Playlists/{playlistId}/Users/{userId}` | UpdatePlaylistUser | Modify a user of a playlist's users. |

---

## CreatePlaylist

### 基本信息
**Path：** POST 服务器地址 + /Playlists

**Method：** POST

**接口描述：** Creates a new playlist.

**认证要求：** For backwards compatibility parameters can be sent via Query or Body, with Query having higher precedence.
Query parameters are obsolete.

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The playlist name. |
| ids | 否 | string[] |  | The item ids. |
| userId | 否 | string |  | The user id. |
| mediaType | 否 | string enum(Unknown|Video|Audio|Photo|Book) |  | The media type. |


**Body**

- 是否必须：否
- 描述：The create playlist payload.
- Content-Type：`application/json`
- Schema：`CreatePlaylistDto`
- Content-Type：`text/json`
- Schema：`CreatePlaylistDto`
- Content-Type：`application/*+json`
- Schema：`CreatePlaylistDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Playlist created. | PlaylistCreationResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PlaylistCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |


**200 字段说明（PlaylistCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |


**200 字段说明（PlaylistCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |


---

## GetPlaylist

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{playlistId}

**Method：** GET

**接口描述：** Get a playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | The playlist. | PlaylistDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PlaylistDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OpenAccess | boolean | Gets or sets a value indicating whether the playlist is publicly readable. |
| Shares | PlaylistUserPermissions[] | Gets or sets the share permissions. |
| ItemIds | string[] | Gets or sets the item ids. |


**200 字段说明（PlaylistDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OpenAccess | boolean | Gets or sets a value indicating whether the playlist is publicly readable. |
| Shares | PlaylistUserPermissions[] | Gets or sets the share permissions. |
| ItemIds | string[] | Gets or sets the item ids. |


**200 字段说明（PlaylistDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OpenAccess | boolean | Gets or sets a value indicating whether the playlist is publicly readable. |
| Shares | PlaylistUserPermissions[] | Gets or sets the share permissions. |
| ItemIds | string[] | Gets or sets the item ids. |


---

## UpdatePlaylist

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{playlistId}

**Method：** POST

**接口描述：** Updates a playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |


**Body**

- 是否必须：是
- 描述：The Jellyfin.Api.Models.PlaylistDtos.UpdatePlaylistDto id.
- Content-Type：`application/json`
- Schema：`UpdatePlaylistDto`
- Content-Type：`text/json`
- Schema：`UpdatePlaylistDto`
- Content-Type：`application/*+json`
- Schema：`UpdatePlaylistDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Playlist updated. |  |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RemoveItemFromPlaylist

### 基本信息
**Path：** DELETE 服务器地址 + /Playlists/{playlistId}/Items

**Method：** DELETE

**接口描述：** Removes items from a playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| entryIds | 否 | string[] |  | The item ids, comma delimited. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Items removed. |  |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPlaylistItems

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{playlistId}/Items

**Method：** GET

**接口描述：** Gets the original items of a playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Original playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## AddItemToPlaylist

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{playlistId}/Items

**Method：** POST

**接口描述：** Adds items to a playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ids | 否 | string[] |  | Item id, comma delimited. |
| position | 否 | integer |  | Optional. 0-based index where to place the items or at the end if `null`. |
| userId | 否 | string |  | The userId. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Items added to playlist. |  |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## MoveItem

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{playlistId}/Items/{itemId}/Move/{newIndex}

**Method：** POST

**接口描述：** Moves a playlist item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |
| itemId | 是 | string |  | The item id. |
| newIndex | 是 | integer |  | The new index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Item moved to new index. |  |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPlaylistUsers

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{playlistId}/Users

**Method：** GET

**接口描述：** Get a playlist's users.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Found shares. | PlaylistUserPermissions[] |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RemoveUserFromPlaylist

### 基本信息
**Path：** DELETE 服务器地址 + /Playlists/{playlistId}/Users/{userId}

**Method：** DELETE

**接口描述：** Remove a user from a playlist's users.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |
| userId | 是 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User permissions removed from playlist. |  |
| 401 | Unauthorized access. |  |
| 403 | Forbidden | ProblemDetails |
| 404 | No playlist or user permissions found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPlaylistUser

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{playlistId}/Users/{userId}

**Method：** GET

**接口描述：** Get a playlist user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |
| userId | 是 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | User permission found. | PlaylistUserPermissions |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PlaylistUserPermissions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string | Gets or sets the user id. |
| CanEdit | boolean | Gets or sets a value indicating whether the user has edit permissions. |


**200 字段说明（PlaylistUserPermissions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string | Gets or sets the user id. |
| CanEdit | boolean | Gets or sets a value indicating whether the user has edit permissions. |


**200 字段说明（PlaylistUserPermissions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string | Gets or sets the user id. |
| CanEdit | boolean | Gets or sets a value indicating whether the user has edit permissions. |


---

## UpdatePlaylistUser

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{playlistId}/Users/{userId}

**Method：** POST

**接口描述：** Modify a user of a playlist's users.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playlistId | 是 | string |  | The playlist id. |
| userId | 是 | string |  | The user id. |


**Body**

- 是否必须：是
- 描述：The Jellyfin.Api.Models.PlaylistDtos.UpdatePlaylistUserDto.
- Content-Type：`application/json`
- Schema：`UpdatePlaylistUserDto`
- Content-Type：`text/json`
- Schema：`UpdatePlaylistUserDto`
- Content-Type：`application/*+json`
- Schema：`UpdatePlaylistUserDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User's permissions modified. |  |
| 401 | Unauthorized |  |
| 403 | Access forbidden. | ProblemDetails |
| 404 | Playlist not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

