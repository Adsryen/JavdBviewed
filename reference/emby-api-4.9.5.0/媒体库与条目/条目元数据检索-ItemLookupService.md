# 条目元数据检索（ItemLookupService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：14

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/{Id}/ExternalIdInfos` | getItemsByIdExternalidinfos | Gets external id infos for an item |
| POST | `/Items/Metadata/Reset` | postItemsMetadataReset | Resets metadata for one or more items |
| POST | `/Items/RemoteSearch/Apply/{Id}` | postItemsRemotesearchApplyById | Applies search criteria to an item and refreshes metadata |
| POST | `/Items/RemoteSearch/Book` | postItemsRemotesearchBook |  |
| POST | `/Items/RemoteSearch/BoxSet` | postItemsRemotesearchBoxset |  |
| POST | `/Items/RemoteSearch/Game` | postItemsRemotesearchGame |  |
| GET | `/Items/RemoteSearch/Image` | getItemsRemotesearchImage | Gets a remote image |
| POST | `/Items/RemoteSearch/Movie` | postItemsRemotesearchMovie |  |
| POST | `/Items/RemoteSearch/MusicAlbum` | postItemsRemotesearchMusicalbum |  |
| POST | `/Items/RemoteSearch/MusicArtist` | postItemsRemotesearchMusicartist |  |
| POST | `/Items/RemoteSearch/MusicVideo` | postItemsRemotesearchMusicvideo |  |
| POST | `/Items/RemoteSearch/Person` | postItemsRemotesearchPerson |  |
| POST | `/Items/RemoteSearch/Series` | postItemsRemotesearchSeries |  |
| POST | `/Items/RemoteSearch/Trailer` | postItemsRemotesearchTrailer |  |

---

## getItemsByIdExternalidinfos

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/ExternalIdInfos

**Method：** GET

**接口描述：** Gets external id infos for an item

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<ExternalIdInfo> object. | ExternalIdInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsMetadataReset

### 基本信息
**Path：** POST 服务器地址 + /Items/Metadata/Reset

**Method：** POST

**接口描述：** Resets metadata for one or more items

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemIds | 是 | string |  | The item ids |


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

## postItemsRemotesearchApplyById

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Apply/{Id}

**Method：** POST

**接口描述：** Applies search criteria to an item and refreshes metadata

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | The item id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ReplaceAllImages | 否 | boolean |  | Whether or not to replace all images |


**Body**

- 是否必须：是
- 描述：RemoteSearchResult:
- Content-Type：`application/json`
- Schema：`RemoteSearchResult`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ProviderIds | ProviderIdDictionary |  |
| ProductionYear | integer|null |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| StartDate | string|null |  |
| EndDate | string|null |  |
| ImageUrl | string |  |
| SearchProviderName | string |  |
| GameSystem | string |  |
| Overview | string |  |
| DisambiguationComment | string |  |
| AlbumArtist | RemoteSearchResult |  |
| Artists | RemoteSearchResult[] |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchResult`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ProviderIds | ProviderIdDictionary |  |
| ProductionYear | integer|null |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| StartDate | string|null |  |
| EndDate | string|null |  |
| ImageUrl | string |  |
| SearchProviderName | string |  |
| GameSystem | string |  |
| Overview | string |  |
| DisambiguationComment | string |  |
| AlbumArtist | RemoteSearchResult |  |
| Artists | RemoteSearchResult[] |  |



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

## postItemsRemotesearchBook

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Book

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_BookInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | BookInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_BookInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | BookInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchBoxset

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/BoxSet

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_ItemLookupInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | ItemLookupInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_ItemLookupInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | ItemLookupInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchGame

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Game

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_GameInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | GameInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_GameInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | GameInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getItemsRemotesearchImage

### 基本信息
**Path：** GET 服务器地址 + /Items/RemoteSearch/Image

**Method：** GET

**接口描述：** Gets a remote image

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ImageUrl | 是 | string |  | The image url |
| ProviderName | 是 | string |  |  |


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

## postItemsRemotesearchMovie

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Movie

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_MovieInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | MovieInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_MovieInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | MovieInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchMusicalbum

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/MusicAlbum

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_AlbumInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | AlbumInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_AlbumInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | AlbumInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchMusicartist

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/MusicArtist

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_ArtistInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | ArtistInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_ArtistInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | ArtistInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchMusicvideo

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/MusicVideo

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_MusicVideoInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | MusicVideoInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_MusicVideoInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | MusicVideoInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchPerson

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Person

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_PersonLookupInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | PersonLookupInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_PersonLookupInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | PersonLookupInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchSeries

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Series

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_SeriesInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | SeriesInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_SeriesInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | SeriesInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsRemotesearchTrailer

### 基本信息
**Path：** POST 服务器地址 + /Items/RemoteSearch/Trailer

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RemoteSearchQuery`1:
- Content-Type：`application/json`
- Schema：`RemoteSearchQuery_TrailerInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | TrailerInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |

- Content-Type：`application/xml`
- Schema：`RemoteSearchQuery_TrailerInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | TrailerInfo |  |
| ItemId | integer |  |
| SearchProviderName | string |  |
| Providers | string[] |  |
| IncludeDisabledProviders | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<RemoteSearchResult> object. | RemoteSearchResult[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

