# 即时混播（InstantMix）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：7

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Albums/{itemId}/InstantMix` | GetInstantMixFromAlbum | Creates an instant playlist based on a given album. |
| GET | `/Artists/{itemId}/InstantMix` | GetInstantMixFromArtists | Creates an instant playlist based on a given artist. |
| GET | `/Items/{itemId}/InstantMix` | GetInstantMixFromItem | Creates an instant playlist based on a given item. |
| GET | `/MusicGenres/{name}/InstantMix` | GetInstantMixFromMusicGenreByName | Creates an instant playlist based on a given genre. |
| GET | `/MusicGenres/InstantMix` | GetInstantMixFromMusicGenreById | Creates an instant playlist based on a given genre. |
| GET | `/Playlists/{itemId}/InstantMix` | GetInstantMixFromPlaylist | Creates an instant playlist based on a given playlist. |
| GET | `/Songs/{itemId}/InstantMix` | GetInstantMixFromSong | Creates an instant playlist based on a given song. |

---

## GetInstantMixFromAlbum

### 基本信息
**Path：** GET 服务器地址 + /Albums/{itemId}/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given album.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetInstantMixFromArtists

### 基本信息
**Path：** GET 服务器地址 + /Artists/{itemId}/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given artist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetInstantMixFromItem

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetInstantMixFromMusicGenreByName

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/{name}/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given genre.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | The genre name. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
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

## GetInstantMixFromMusicGenreById

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given genre.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 是 | string |  | The item id. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetInstantMixFromPlaylist

### 基本信息
**Path：** GET 服务器地址 + /Playlists/{itemId}/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given playlist.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetInstantMixFromSong

### 基本信息
**Path：** GET 服务器地址 + /Songs/{itemId}/InstantMix

**Method：** GET

**接口描述：** Creates an instant playlist based on a given song.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Instant playlist returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

