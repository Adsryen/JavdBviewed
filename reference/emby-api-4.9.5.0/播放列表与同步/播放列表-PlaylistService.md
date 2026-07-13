# 播放列表（PlaylistService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放列表与同步
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：7

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Playlists` | postPlaylists | Creates a new playlist |
| GET | `/Playlists/{Id}/AddToPlaylistInfo` | getPlaylistsByIdAddtoplaylistinfo | Gets add to playlist info |
| DELETE | `/Playlists/{Id}/Items` | deletePlaylistsByIdItems | Removes items from a playlist |
| GET | `/Playlists/{Id}/Items` | getPlaylistsByIdItems | Gets the original items of a playlist |
| POST | `/Playlists/{Id}/Items` | postPlaylistsByIdItems | Adds items to a playlist |
| POST | `/Playlists/{Id}/Items/{ItemId}/Move/{NewIndex}` | postPlaylistsByIdItemsByItemidMoveByNewindex | Moves a playlist item |
| POST | `/Playlists/{Id}/Items/Delete` | postPlaylistsByIdItemsDelete | Removes items from a playlist |

---

## postPlaylists

### 基本信息
**Path：** POST 服务器地址 + /Playlists

**Method：** POST

**接口描述：** Creates a new playlist

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 否 | string |  | The name of the new playlist. |
| Ids | 否 | string |  | Item Ids to add to the playlist |
| MediaType | 否 | string |  | The playlist media type |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PlaylistCreationResult object. | Playlists.PlaylistCreationResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Playlists.PlaylistCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Name | string |  |
| ItemAddedCount | integer |  |


**200 字段说明（Playlists.PlaylistCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Name | string |  |
| ItemAddedCount | integer |  |


---

## getPlaylistsByIdAddtoplaylistinfo

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{Id}/AddToPlaylistInfo

**Method：** GET

**接口描述：** Gets add to playlist info

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | User Id |
| Ids | 是 | string |  | Item id, comma delimited |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a AddToPlaylistInfo object. | Playlists.AddToPlaylistInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Playlists.AddToPlaylistInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemCount | integer |  |
| ContainsDuplicates | boolean |  |


**200 字段说明（Playlists.AddToPlaylistInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemCount | integer |  |
| ContainsDuplicates | boolean |  |


---

## deletePlaylistsByIdItems

### 基本信息
**Path：** DELETE 服务器地址 + /Playlists/{Id}/Items

**Method：** DELETE

**接口描述：** Removes items from a playlist

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| EntryIds | 是 | string |  |  |


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

## getPlaylistsByIdItems

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{Id}/Items

**Method：** GET

**接口描述：** Gets the original items of a playlist

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | User Id |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<BaseItemDto> object. | QueryResult_BaseItemDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


---

## postPlaylistsByIdItems

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{Id}/Items

**Method：** POST

**接口描述：** Adds items to a playlist

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | User Id |
| Ids | 是 | string |  | Item id, comma delimited |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a AddToPlaylistResult object. | Playlists.AddToPlaylistResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Playlists.AddToPlaylistResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ItemAddedCount | integer |  |


**200 字段说明（Playlists.AddToPlaylistResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ItemAddedCount | integer |  |


---

## postPlaylistsByIdItemsByItemidMoveByNewindex

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{Id}/Items/{ItemId}/Move/{NewIndex}

**Method：** POST

**接口描述：** Moves a playlist item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemId | 是 | integer |  | ItemId |
| Id | 是 | string |  |  |
| NewIndex | 是 | integer |  | NewIndex |


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

## postPlaylistsByIdItemsDelete

### 基本信息
**Path：** POST 服务器地址 + /Playlists/{Id}/Items/Delete

**Method：** POST

**接口描述：** Removes items from a playlist

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| EntryIds | 是 | string |  |  |


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

