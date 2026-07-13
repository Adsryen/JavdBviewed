# 条目元数据检索（ItemLookup）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：11

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/{itemId}/ExternalIdInfos` | GetExternalIdInfos | Get the item's external id info. |
| POST | `/Items/RemoteSearch/Apply/{itemId}` | ApplySearchCriteria | Applies search criteria to an item and refreshes metadata. |
| POST | `/Items/RemoteSearch/Book` | GetBookRemoteSearchResults | Get book remote search. |
| POST | `/Items/RemoteSearch/BoxSet` | GetBoxSetRemoteSearchResults | Get box set remote search. |
| POST | `/Items/RemoteSearch/Movie` | GetMovieRemoteSearchResults | Get movie remote search. |
| POST | `/Items/RemoteSearch/MusicAlbum` | GetMusicAlbumRemoteSearchResults | Get music album remote search. |
| POST | `/Items/RemoteSearch/MusicArtist` | GetMusicArtistRemoteSearchResults | Get music artist remote search. |
| POST | `/Items/RemoteSearch/MusicVideo` | GetMusicVideoRemoteSearchResults | Get music video remote search. |
| POST | `/Items/RemoteSearch/Person` | GetPersonRemoteSearchResults | Get person remote search. |
| POST | `/Items/RemoteSearch/Series` | GetSeriesRemoteSearchResults | Get series remote search. |
| POST | `/Items/RemoteSearch/Trailer` | GetTrailerRemoteSearchResults | Get trailer remote search. |

---

## GetExternalIdInfos

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/ExternalIdInfos

**Method：** GET

**接口描述：** Get the item's external id info.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | External id info retrieved. | ExternalIdInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ApplySearchCriteria

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Apply/{itemId}

**Method：** POST

**接口描述：** Applies search criteria to an item and refreshes metadata.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| replaceAllImages | 否 | boolean | true | Optional. Whether or not to replace all images. Default: True. |


**Body**

- 是否必须：是
- 描述：The remote search result.
- Content-Type：`application/json`
- Schema：`RemoteSearchResult`
- Content-Type：`text/json`
- Schema：`RemoteSearchResult`
- Content-Type：`application/*+json`
- Schema：`RemoteSearchResult`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Item metadata refreshed. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetBookRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Book

**Method：** POST

**接口描述：** Get book remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`BookInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`BookInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`BookInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Book remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetBoxSetRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/BoxSet

**Method：** POST

**接口描述：** Get box set remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`BoxSetInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`BoxSetInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`BoxSetInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Box set remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMovieRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Movie

**Method：** POST

**接口描述：** Get movie remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`MovieInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`MovieInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`MovieInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Movie remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMusicAlbumRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/MusicAlbum

**Method：** POST

**接口描述：** Get music album remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`AlbumInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`AlbumInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`AlbumInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Music album remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMusicArtistRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/MusicArtist

**Method：** POST

**接口描述：** Get music artist remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`ArtistInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`ArtistInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`ArtistInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Music artist remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMusicVideoRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/MusicVideo

**Method：** POST

**接口描述：** Get music video remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`MusicVideoInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`MusicVideoInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`MusicVideoInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Music video remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPersonRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Person

**Method：** POST

**接口描述：** Get person remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`PersonLookupInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`PersonLookupInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`PersonLookupInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Person remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSeriesRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Series

**Method：** POST

**接口描述：** Get series remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`SeriesInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`SeriesInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`SeriesInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Series remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetTrailerRemoteSearchResults

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Trailer

**Method：** POST

**接口描述：** Get trailer remote search.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Remote search query.
- Content-Type：`application/json`
- Schema：`TrailerInfoRemoteSearchQuery`
- Content-Type：`text/json`
- Schema：`TrailerInfoRemoteSearchQuery`
- Content-Type：`application/*+json`
- Schema：`TrailerInfoRemoteSearchQuery`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Trailer remote search executed. | RemoteSearchResult[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

