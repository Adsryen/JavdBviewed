# 直播电视（LiveTvService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：直播电视
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：61

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/LiveTv/AvailableRecordingOptions` | getLivetvAvailablerecordingoptions | Gets available recording options |
| DELETE | `/LiveTv/ChannelMappingOptions` | deleteLivetvChannelmappingoptions |  |
| GET | `/LiveTv/ChannelMappingOptions` | getLivetvChannelmappingoptions |  |
| HEAD | `/LiveTv/ChannelMappingOptions` | headLivetvChannelmappingoptions |  |
| POST | `/LiveTv/ChannelMappingOptions` | postLivetvChannelmappingoptions |  |
| PUT | `/LiveTv/ChannelMappingOptions` | putLivetvChannelmappingoptions |  |
| DELETE | `/LiveTv/ChannelMappings` | deleteLivetvChannelmappings |  |
| GET | `/LiveTv/ChannelMappings` | getLivetvChannelmappings |  |
| HEAD | `/LiveTv/ChannelMappings` | headLivetvChannelmappings |  |
| POST | `/LiveTv/ChannelMappings` | postLivetvChannelmappings |  |
| PUT | `/LiveTv/ChannelMappings` | putLivetvChannelmappings |  |
| GET | `/LiveTv/Channels` | getLivetvChannels | Gets available live tv channels. |
| GET | `/LiveTv/Channels/{Id}` | getLivetvChannelsById | Gets a live tv channel |
| GET | `/LiveTv/ChannelTags` | getLivetvChanneltags | Gets live tv channel tags |
| GET | `/LiveTv/ChannelTags/Prefixes` | getLivetvChanneltagsPrefixes | Gets live tv channel tag prefixes |
| GET | `/LiveTv/EPG` | getLivetvEPG | Gets the epg. |
| GET | `/LiveTv/Folder` | getLivetvFolder | Gets the top level live tv folder |
| GET | `/LiveTv/GuideInfo` | getLivetvGuideinfo | Gets guide info |
| GET | `/LiveTv/Info` | getLivetvInfo | Gets available live tv services. |
| DELETE | `/LiveTv/ListingProviders` | deleteLivetvListingproviders | Deletes a listing provider |
| GET | `/LiveTv/ListingProviders` | getLivetvListingproviders | Gets current listing providers |
| POST | `/LiveTv/ListingProviders` | postLivetvListingproviders | Adds a listing provider |
| GET | `/LiveTv/ListingProviders/Available` | getLivetvListingprovidersAvailable | Gets listing provider |
| GET | `/LiveTv/ListingProviders/Default` | getLivetvListingprovidersDefault |  |
| POST | `/LiveTv/ListingProviders/Delete` | postLivetvListingprovidersDelete | Deletes a listing provider |
| GET | `/LiveTv/ListingProviders/Lineups` | getLivetvListingprovidersLineups | Gets available lineups |
| GET | `/LiveTv/Manage/Channels` | getLivetvManageChannels | Gets the channel management list |
| POST | `/LiveTv/Manage/Channels/{Id}/Disabled` | postLivetvManageChannelsByIdDisabled | Sets a channel disabled or not |
| POST | `/LiveTv/Manage/Channels/{Id}/SortIndex` | postLivetvManageChannelsByIdSortindex | Sets a channel sort index |
| GET | `/LiveTv/Programs` | getLivetvPrograms | Gets available live tv epgs.. |
| POST | `/LiveTv/Programs` | postLivetvPrograms | Gets available live tv epgs.. |
| GET | `/LiveTv/Programs/Recommended` | getLivetvProgramsRecommended | Gets available live tv epgs.. |
| GET | `/LiveTv/Recordings` | getLivetvRecordings | Gets live tv recordings |
| DELETE | `/LiveTv/Recordings/{Id}` | deleteLivetvRecordingsById | Deletes a live tv recording |
| GET | `/LiveTv/Recordings/{Id}` | getLivetvRecordingsById | Gets a live tv recording |
| POST | `/LiveTv/Recordings/{Id}/Delete` | postLivetvRecordingsByIdDelete | Deletes a live tv recording |
| GET | `/LiveTv/Recordings/Folders` | getLivetvRecordingsFolders | Gets recording folders |
| GET | `/LiveTv/Recordings/Groups` | getLivetvRecordingsGroups | Gets live tv recording groups |
| GET | `/LiveTv/Recordings/Series` | getLivetvRecordingsSeries | Gets live tv recordings |
| GET | `/LiveTv/SeriesTimers` | getLivetvSeriestimers | Gets live tv series timers |
| POST | `/LiveTv/SeriesTimers` | postLivetvSeriestimers | Creates a live tv series timer |
| DELETE | `/LiveTv/SeriesTimers/{Id}` | deleteLivetvSeriestimersById | Cancels a live tv series timer |
| GET | `/LiveTv/SeriesTimers/{Id}` | getLivetvSeriestimersById | Gets a live tv series timer |
| POST | `/LiveTv/SeriesTimers/{Id}` | postLivetvSeriestimersById | Updates a live tv series timer |
| POST | `/LiveTv/SeriesTimers/{Id}/Delete` | postLivetvSeriestimersByIdDelete | Cancels a live tv series timer |
| GET | `/LiveTv/Timers` | getLivetvTimers | Gets live tv timers |
| POST | `/LiveTv/Timers` | postLivetvTimers | Creates a live tv timer |
| DELETE | `/LiveTv/Timers/{Id}` | deleteLivetvTimersById | Cancels a live tv timer |
| GET | `/LiveTv/Timers/{Id}` | getLivetvTimersById | Gets a live tv timer |
| POST | `/LiveTv/Timers/{Id}` | postLivetvTimersById | Updates a live tv timer |
| POST | `/LiveTv/Timers/{Id}/Delete` | postLivetvTimersByIdDelete | Cancels a live tv timer |
| GET | `/LiveTv/Timers/Defaults` | getLivetvTimersDefaults | Gets default values for a new timer |
| DELETE | `/LiveTv/TunerHosts` | deleteLivetvTunerhosts | Deletes a tuner host |
| GET | `/LiveTv/TunerHosts` | getLivetvTunerhosts | Gets tuner hosts |
| POST | `/LiveTv/TunerHosts` | postLivetvTunerhosts | Adds a tuner host |
| GET | `/LiveTv/TunerHosts/Default/{Type}` | getLivetvTunerhostsDefaultByType | Gets tuner hosts |
| POST | `/LiveTv/TunerHosts/Delete` | postLivetvTunerhostsDelete | Deletes a tuner host |
| GET | `/LiveTv/TunerHosts/Types` | getLivetvTunerhostsTypes |  |
| POST | `/LiveTv/Tuners/{Id}/Reset` | postLivetvTunersByIdReset | Resets a tv tuner |
| GET | `/LiveTv/Tuners/Discover` | getLivetvTunersDiscover |  |
| GET | `/LiveTv/Tuners/Discvover` | getLivetvTunersDiscvover |  |

---

## getLivetvAvailablerecordingoptions

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/AvailableRecordingOptions

**Method：** GET

**接口描述：** Gets available recording options

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a AvailableRecordingOptions object. | Api.AvailableRecordingOptions |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Api.AvailableRecordingOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RecordingFolders | Api.NameIdDescriptionPair[] |  |
| MovieRecordingFolders | Api.NameIdDescriptionPair[] |  |
| SeriesRecordingFolders | Api.NameIdDescriptionPair[] |  |


**200 字段说明（Api.AvailableRecordingOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RecordingFolders | Api.NameIdDescriptionPair[] |  |
| MovieRecordingFolders | Api.NameIdDescriptionPair[] |  |
| SeriesRecordingFolders | Api.NameIdDescriptionPair[] |  |


---

## deleteLivetvChannelmappingoptions

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/ChannelMappingOptions

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## getLivetvChannelmappingoptions

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ChannelMappingOptions

**Method：** GET

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## headLivetvChannelmappingoptions

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/ChannelMappingOptions

**Method：** HEAD

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## postLivetvChannelmappingoptions

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/ChannelMappingOptions

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## putLivetvChannelmappingoptions

### 基本信息
**Path：** PUT 服务器地址 + /LiveTv/ChannelMappingOptions

**Method：** PUT

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## deleteLivetvChannelmappings

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/ChannelMappings

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## getLivetvChannelmappings

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ChannelMappings

**Method：** GET

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## headLivetvChannelmappings

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/ChannelMappings

**Method：** HEAD

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


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

## postLivetvChannelmappings

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/ChannelMappings

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


**Body**

- 是否必须：是
- 描述：SetChannelMapping
- Content-Type：`application/json`
- Schema：`Api.SetChannelMapping`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannelId | string |  |
| ProviderChannelId | string |  |

- Content-Type：`application/xml`
- Schema：`Api.SetChannelMapping`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannelId | string |  |
| ProviderChannelId | string |  |



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

## putLivetvChannelmappings

### 基本信息
**Path：** PUT 服务器地址 + /LiveTv/ChannelMappings

**Method：** PUT

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProviderId | 是 | string |  | Provider id |


**Body**

- 是否必须：是
- 描述：SetChannelMapping
- Content-Type：`application/json`
- Schema：`Api.SetChannelMapping`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannelId | string |  |
| ProviderChannelId | string |  |

- Content-Type：`application/xml`
- Schema：`Api.SetChannelMapping`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannelId | string |  |
| ProviderChannelId | string |  |



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

## getLivetvChannels

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Channels

**Method：** GET

**接口描述：** Gets available live tv channels.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Type | 否 | LiveTv.ChannelType |  | Optional filter by channel type. |
| IsLiked | 否 | boolean|null |  | Filter by channels that are liked, or not. |
| IsDisliked | 否 | boolean|null |  | Filter by channels that are disliked, or not. |
| EnableFavoriteSorting | 否 | boolean |  | Incorporate favorite and like status into channel sorting. |
| AddCurrentProgram | 否 | boolean |  | Optional. Adds current program info to each channel |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


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

## getLivetvChannelsById

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Channels/{Id}

**Method：** GET

**接口描述：** Gets a live tv channel

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Channel Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | Optional attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a BaseItemDto object. | BaseItemDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ServerId | string |  |
| Id | string |  |
| Guid | string |  |
| Etag | string |  |
| Prefix | string |  |
| TunerName | string |  |
| PlaylistItemId | string |  |
| DateCreated | string|null |  |
| DateModified | string|null |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| AverageFrameRate | number|null |  |
| RealFrameRate | number|null |  |
| ExtraType | string |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| CanEditItems | boolean|null |  |
| SupportsResume | boolean|null |  |
| PresentationUniqueKey | string |  |
| PreferredMetadataLanguage | string |  |
| PreferredMetadataCountryCode | string |  |
| SupportsSync | boolean|null |  |
| SyncStatus | SyncJobItemStatus |  |
| CanManageAccess | boolean|null |  |
| CanLeaveContent | boolean|null |  |
| CanMakePublic | boolean|null |  |
| Container | string |  |
| SortName | string |  |
| ForcedSortName | string |  |
| Video3DFormat | Video3DFormat |  |
| PremiereDate | string|null |  |
| ExternalUrls | ExternalUrl[] |  |
| MediaSources | MediaSourceInfo[] |  |
| CriticRating | number|null |  |
| GameSystemId | integer|null |  |
| AsSeries | boolean|null |  |
| GameSystem | string |  |
| ProductionLocations | string[] |  |
| Path | string |  |
| OfficialRating | string |  |
| CustomRating | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| Overview | string |  |
| Taglines | string[] |  |
| Genres | string[] |  |
| CommunityRating | number|null |  |
| RunTimeTicks | integer|null |  |
| Size | integer|null |  |
| FileName | string |  |
| Bitrate | integer|null |  |
| ProductionYear | integer|null |  |
| Number | string |  |
| ChannelNumber | string |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| RemoteTrailers | MediaUrl[] |  |
| ProviderIds | ProviderIdDictionary |  |
| IsFolder | boolean|null |  |
| ParentId | string |  |
| Type | string |  |
| People | BaseItemPerson[] |  |
| Studios | NameLongIdPair[] |  |
| GenreItems | NameLongIdPair[] |  |
| TagItems | NameLongIdPair[] |  |
| ParentLogoItemId | string |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| LocalTrailerCount | integer|null |  |
| UserData | UserItemDataDto |  |
| RecursiveItemCount | integer|null |  |
| ChildCount | integer|null |  |
| SeasonCount | integer|null |  |
| SeriesName | string |  |
| SeriesId | string |  |
| SeasonId | string |  |
| SpecialFeatureCount | integer|null |  |
| DisplayPreferencesId | string |  |
| Status | string |  |
| AirDays | DayOfWeek[] |  |
| Tags | string[] |  |
| PrimaryImageAspectRatio | number|null |  |
| Artists | string[] |  |
| ArtistItems | NameIdPair[] |  |
| Composers | NameIdPair[] |  |
| Album | string |  |
| CollectionType | string |  |
| DisplayOrder | string |  |
| AlbumId | string |  |
| AlbumPrimaryImageTag | string |  |
| SeriesPrimaryImageTag | string |  |
| AlbumArtist | string |  |
| AlbumArtists | NameIdPair[] |  |
| SeasonName | string |  |
| MediaStreams | MediaStream[] |  |
| PartCount | integer|null |  |
| ImageTags | object |  |
| BackdropImageTags | string[] |  |
| ParentLogoImageTag | string |  |
| SeriesStudio | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| Chapters | ChapterInfo[] |  |
| LocationType | LocationType |  |
| MediaType | string |  |
| EndDate | string|null |  |
| LockedFields | MetadataFields[] |  |
| LockData | boolean|null |  |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string |  |
| CameraModel | string |  |
| Software | string |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | Drawing.ImageOrientation |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string |  |
| ChannelPrimaryImageTag | string |  |
| StartDate | string|null |  |
| CompletionPercentage | number|null |  |
| IsRepeat | boolean|null |  |
| IsNew | boolean|null |  |
| EpisodeTitle | string |  |
| IsMovie | boolean|null |  |
| IsSports | boolean|null |  |
| IsSeries | boolean|null |  |
| IsLive | boolean|null |  |
| IsNews | boolean|null |  |
| IsKids | boolean|null |  |
| IsPremiere | boolean|null |  |
| TimerType | LiveTv.TimerType |  |
| Disabled | boolean|null |  |
| ManagementId | string |  |
| TimerId | string |  |
| CurrentProgram | BaseItemDto |  |
| MovieCount | integer|null |  |
| SeriesCount | integer|null |  |
| AlbumCount | integer|null |  |
| SongCount | integer|null |  |
| MusicVideoCount | integer|null |  |
| Subviews | string[] |  |
| ListingsProviderId | string |  |
| ListingsChannelId | string |  |
| ListingsPath | string |  |
| ListingsId | string |  |
| ListingsChannelName | string |  |
| ListingsChannelNumber | string |  |
| AffiliateCallSign | string |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ServerId | string |  |
| Id | string |  |
| Guid | string |  |
| Etag | string |  |
| Prefix | string |  |
| TunerName | string |  |
| PlaylistItemId | string |  |
| DateCreated | string|null |  |
| DateModified | string|null |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| AverageFrameRate | number|null |  |
| RealFrameRate | number|null |  |
| ExtraType | string |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| CanEditItems | boolean|null |  |
| SupportsResume | boolean|null |  |
| PresentationUniqueKey | string |  |
| PreferredMetadataLanguage | string |  |
| PreferredMetadataCountryCode | string |  |
| SupportsSync | boolean|null |  |
| SyncStatus | SyncJobItemStatus |  |
| CanManageAccess | boolean|null |  |
| CanLeaveContent | boolean|null |  |
| CanMakePublic | boolean|null |  |
| Container | string |  |
| SortName | string |  |
| ForcedSortName | string |  |
| Video3DFormat | Video3DFormat |  |
| PremiereDate | string|null |  |
| ExternalUrls | ExternalUrl[] |  |
| MediaSources | MediaSourceInfo[] |  |
| CriticRating | number|null |  |
| GameSystemId | integer|null |  |
| AsSeries | boolean|null |  |
| GameSystem | string |  |
| ProductionLocations | string[] |  |
| Path | string |  |
| OfficialRating | string |  |
| CustomRating | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| Overview | string |  |
| Taglines | string[] |  |
| Genres | string[] |  |
| CommunityRating | number|null |  |
| RunTimeTicks | integer|null |  |
| Size | integer|null |  |
| FileName | string |  |
| Bitrate | integer|null |  |
| ProductionYear | integer|null |  |
| Number | string |  |
| ChannelNumber | string |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| RemoteTrailers | MediaUrl[] |  |
| ProviderIds | ProviderIdDictionary |  |
| IsFolder | boolean|null |  |
| ParentId | string |  |
| Type | string |  |
| People | BaseItemPerson[] |  |
| Studios | NameLongIdPair[] |  |
| GenreItems | NameLongIdPair[] |  |
| TagItems | NameLongIdPair[] |  |
| ParentLogoItemId | string |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| LocalTrailerCount | integer|null |  |
| UserData | UserItemDataDto |  |
| RecursiveItemCount | integer|null |  |
| ChildCount | integer|null |  |
| SeasonCount | integer|null |  |
| SeriesName | string |  |
| SeriesId | string |  |
| SeasonId | string |  |
| SpecialFeatureCount | integer|null |  |
| DisplayPreferencesId | string |  |
| Status | string |  |
| AirDays | DayOfWeek[] |  |
| Tags | string[] |  |
| PrimaryImageAspectRatio | number|null |  |
| Artists | string[] |  |
| ArtistItems | NameIdPair[] |  |
| Composers | NameIdPair[] |  |
| Album | string |  |
| CollectionType | string |  |
| DisplayOrder | string |  |
| AlbumId | string |  |
| AlbumPrimaryImageTag | string |  |
| SeriesPrimaryImageTag | string |  |
| AlbumArtist | string |  |
| AlbumArtists | NameIdPair[] |  |
| SeasonName | string |  |
| MediaStreams | MediaStream[] |  |
| PartCount | integer|null |  |
| ImageTags | object |  |
| BackdropImageTags | string[] |  |
| ParentLogoImageTag | string |  |
| SeriesStudio | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| Chapters | ChapterInfo[] |  |
| LocationType | LocationType |  |
| MediaType | string |  |
| EndDate | string|null |  |
| LockedFields | MetadataFields[] |  |
| LockData | boolean|null |  |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string |  |
| CameraModel | string |  |
| Software | string |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | Drawing.ImageOrientation |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string |  |
| ChannelPrimaryImageTag | string |  |
| StartDate | string|null |  |
| CompletionPercentage | number|null |  |
| IsRepeat | boolean|null |  |
| IsNew | boolean|null |  |
| EpisodeTitle | string |  |
| IsMovie | boolean|null |  |
| IsSports | boolean|null |  |
| IsSeries | boolean|null |  |
| IsLive | boolean|null |  |
| IsNews | boolean|null |  |
| IsKids | boolean|null |  |
| IsPremiere | boolean|null |  |
| TimerType | LiveTv.TimerType |  |
| Disabled | boolean|null |  |
| ManagementId | string |  |
| TimerId | string |  |
| CurrentProgram | BaseItemDto |  |
| MovieCount | integer|null |  |
| SeriesCount | integer|null |  |
| AlbumCount | integer|null |  |
| SongCount | integer|null |  |
| MusicVideoCount | integer|null |  |
| Subviews | string[] |  |
| ListingsProviderId | string |  |
| ListingsChannelId | string |  |
| ListingsPath | string |  |
| ListingsId | string |  |
| ListingsChannelName | string |  |
| ListingsChannelNumber | string |  |
| AffiliateCallSign | string |  |


---

## getLivetvChanneltags

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ChannelTags

**Method：** GET

**接口描述：** Gets live tv channel tags

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


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

## getLivetvChanneltagsPrefixes

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ChannelTags/Prefixes

**Method：** GET

**接口描述：** Gets live tv channel tag prefixes

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TagItem[] object. | Api.TagItem[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLivetvEPG

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/EPG

**Method：** GET

**接口描述：** Gets the epg.

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Type | 否 | LiveTv.ChannelType |  | Optional filter by channel type. |
| IsLiked | 否 | boolean|null |  | Filter by channels that are liked, or not. |
| IsDisliked | 否 | boolean|null |  | Filter by channels that are disliked, or not. |
| EnableFavoriteSorting | 否 | boolean |  | Incorporate favorite and like status into channel sorting. |
| AddCurrentProgram | 否 | boolean |  | Optional. Adds current program info to each channel |
| ChannelIds | 否 | string |  | The channels to return guide information for. |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<EpgRow> object. | QueryResult_Api.EpgRow |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_Api.EpgRow）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | Api.EpgRow[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_Api.EpgRow）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | Api.EpgRow[] |  |
| TotalRecordCount | integer |  |


---

## getLivetvFolder

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Folder

**Method：** GET

**接口描述：** Gets the top level live tv folder

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a BaseItemDto object. | BaseItemDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ServerId | string |  |
| Id | string |  |
| Guid | string |  |
| Etag | string |  |
| Prefix | string |  |
| TunerName | string |  |
| PlaylistItemId | string |  |
| DateCreated | string|null |  |
| DateModified | string|null |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| AverageFrameRate | number|null |  |
| RealFrameRate | number|null |  |
| ExtraType | string |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| CanEditItems | boolean|null |  |
| SupportsResume | boolean|null |  |
| PresentationUniqueKey | string |  |
| PreferredMetadataLanguage | string |  |
| PreferredMetadataCountryCode | string |  |
| SupportsSync | boolean|null |  |
| SyncStatus | SyncJobItemStatus |  |
| CanManageAccess | boolean|null |  |
| CanLeaveContent | boolean|null |  |
| CanMakePublic | boolean|null |  |
| Container | string |  |
| SortName | string |  |
| ForcedSortName | string |  |
| Video3DFormat | Video3DFormat |  |
| PremiereDate | string|null |  |
| ExternalUrls | ExternalUrl[] |  |
| MediaSources | MediaSourceInfo[] |  |
| CriticRating | number|null |  |
| GameSystemId | integer|null |  |
| AsSeries | boolean|null |  |
| GameSystem | string |  |
| ProductionLocations | string[] |  |
| Path | string |  |
| OfficialRating | string |  |
| CustomRating | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| Overview | string |  |
| Taglines | string[] |  |
| Genres | string[] |  |
| CommunityRating | number|null |  |
| RunTimeTicks | integer|null |  |
| Size | integer|null |  |
| FileName | string |  |
| Bitrate | integer|null |  |
| ProductionYear | integer|null |  |
| Number | string |  |
| ChannelNumber | string |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| RemoteTrailers | MediaUrl[] |  |
| ProviderIds | ProviderIdDictionary |  |
| IsFolder | boolean|null |  |
| ParentId | string |  |
| Type | string |  |
| People | BaseItemPerson[] |  |
| Studios | NameLongIdPair[] |  |
| GenreItems | NameLongIdPair[] |  |
| TagItems | NameLongIdPair[] |  |
| ParentLogoItemId | string |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| LocalTrailerCount | integer|null |  |
| UserData | UserItemDataDto |  |
| RecursiveItemCount | integer|null |  |
| ChildCount | integer|null |  |
| SeasonCount | integer|null |  |
| SeriesName | string |  |
| SeriesId | string |  |
| SeasonId | string |  |
| SpecialFeatureCount | integer|null |  |
| DisplayPreferencesId | string |  |
| Status | string |  |
| AirDays | DayOfWeek[] |  |
| Tags | string[] |  |
| PrimaryImageAspectRatio | number|null |  |
| Artists | string[] |  |
| ArtistItems | NameIdPair[] |  |
| Composers | NameIdPair[] |  |
| Album | string |  |
| CollectionType | string |  |
| DisplayOrder | string |  |
| AlbumId | string |  |
| AlbumPrimaryImageTag | string |  |
| SeriesPrimaryImageTag | string |  |
| AlbumArtist | string |  |
| AlbumArtists | NameIdPair[] |  |
| SeasonName | string |  |
| MediaStreams | MediaStream[] |  |
| PartCount | integer|null |  |
| ImageTags | object |  |
| BackdropImageTags | string[] |  |
| ParentLogoImageTag | string |  |
| SeriesStudio | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| Chapters | ChapterInfo[] |  |
| LocationType | LocationType |  |
| MediaType | string |  |
| EndDate | string|null |  |
| LockedFields | MetadataFields[] |  |
| LockData | boolean|null |  |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string |  |
| CameraModel | string |  |
| Software | string |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | Drawing.ImageOrientation |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string |  |
| ChannelPrimaryImageTag | string |  |
| StartDate | string|null |  |
| CompletionPercentage | number|null |  |
| IsRepeat | boolean|null |  |
| IsNew | boolean|null |  |
| EpisodeTitle | string |  |
| IsMovie | boolean|null |  |
| IsSports | boolean|null |  |
| IsSeries | boolean|null |  |
| IsLive | boolean|null |  |
| IsNews | boolean|null |  |
| IsKids | boolean|null |  |
| IsPremiere | boolean|null |  |
| TimerType | LiveTv.TimerType |  |
| Disabled | boolean|null |  |
| ManagementId | string |  |
| TimerId | string |  |
| CurrentProgram | BaseItemDto |  |
| MovieCount | integer|null |  |
| SeriesCount | integer|null |  |
| AlbumCount | integer|null |  |
| SongCount | integer|null |  |
| MusicVideoCount | integer|null |  |
| Subviews | string[] |  |
| ListingsProviderId | string |  |
| ListingsChannelId | string |  |
| ListingsPath | string |  |
| ListingsId | string |  |
| ListingsChannelName | string |  |
| ListingsChannelNumber | string |  |
| AffiliateCallSign | string |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ServerId | string |  |
| Id | string |  |
| Guid | string |  |
| Etag | string |  |
| Prefix | string |  |
| TunerName | string |  |
| PlaylistItemId | string |  |
| DateCreated | string|null |  |
| DateModified | string|null |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| AverageFrameRate | number|null |  |
| RealFrameRate | number|null |  |
| ExtraType | string |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| CanEditItems | boolean|null |  |
| SupportsResume | boolean|null |  |
| PresentationUniqueKey | string |  |
| PreferredMetadataLanguage | string |  |
| PreferredMetadataCountryCode | string |  |
| SupportsSync | boolean|null |  |
| SyncStatus | SyncJobItemStatus |  |
| CanManageAccess | boolean|null |  |
| CanLeaveContent | boolean|null |  |
| CanMakePublic | boolean|null |  |
| Container | string |  |
| SortName | string |  |
| ForcedSortName | string |  |
| Video3DFormat | Video3DFormat |  |
| PremiereDate | string|null |  |
| ExternalUrls | ExternalUrl[] |  |
| MediaSources | MediaSourceInfo[] |  |
| CriticRating | number|null |  |
| GameSystemId | integer|null |  |
| AsSeries | boolean|null |  |
| GameSystem | string |  |
| ProductionLocations | string[] |  |
| Path | string |  |
| OfficialRating | string |  |
| CustomRating | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| Overview | string |  |
| Taglines | string[] |  |
| Genres | string[] |  |
| CommunityRating | number|null |  |
| RunTimeTicks | integer|null |  |
| Size | integer|null |  |
| FileName | string |  |
| Bitrate | integer|null |  |
| ProductionYear | integer|null |  |
| Number | string |  |
| ChannelNumber | string |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| RemoteTrailers | MediaUrl[] |  |
| ProviderIds | ProviderIdDictionary |  |
| IsFolder | boolean|null |  |
| ParentId | string |  |
| Type | string |  |
| People | BaseItemPerson[] |  |
| Studios | NameLongIdPair[] |  |
| GenreItems | NameLongIdPair[] |  |
| TagItems | NameLongIdPair[] |  |
| ParentLogoItemId | string |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| LocalTrailerCount | integer|null |  |
| UserData | UserItemDataDto |  |
| RecursiveItemCount | integer|null |  |
| ChildCount | integer|null |  |
| SeasonCount | integer|null |  |
| SeriesName | string |  |
| SeriesId | string |  |
| SeasonId | string |  |
| SpecialFeatureCount | integer|null |  |
| DisplayPreferencesId | string |  |
| Status | string |  |
| AirDays | DayOfWeek[] |  |
| Tags | string[] |  |
| PrimaryImageAspectRatio | number|null |  |
| Artists | string[] |  |
| ArtistItems | NameIdPair[] |  |
| Composers | NameIdPair[] |  |
| Album | string |  |
| CollectionType | string |  |
| DisplayOrder | string |  |
| AlbumId | string |  |
| AlbumPrimaryImageTag | string |  |
| SeriesPrimaryImageTag | string |  |
| AlbumArtist | string |  |
| AlbumArtists | NameIdPair[] |  |
| SeasonName | string |  |
| MediaStreams | MediaStream[] |  |
| PartCount | integer|null |  |
| ImageTags | object |  |
| BackdropImageTags | string[] |  |
| ParentLogoImageTag | string |  |
| SeriesStudio | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| Chapters | ChapterInfo[] |  |
| LocationType | LocationType |  |
| MediaType | string |  |
| EndDate | string|null |  |
| LockedFields | MetadataFields[] |  |
| LockData | boolean|null |  |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string |  |
| CameraModel | string |  |
| Software | string |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | Drawing.ImageOrientation |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string |  |
| ChannelPrimaryImageTag | string |  |
| StartDate | string|null |  |
| CompletionPercentage | number|null |  |
| IsRepeat | boolean|null |  |
| IsNew | boolean|null |  |
| EpisodeTitle | string |  |
| IsMovie | boolean|null |  |
| IsSports | boolean|null |  |
| IsSeries | boolean|null |  |
| IsLive | boolean|null |  |
| IsNews | boolean|null |  |
| IsKids | boolean|null |  |
| IsPremiere | boolean|null |  |
| TimerType | LiveTv.TimerType |  |
| Disabled | boolean|null |  |
| ManagementId | string |  |
| TimerId | string |  |
| CurrentProgram | BaseItemDto |  |
| MovieCount | integer|null |  |
| SeriesCount | integer|null |  |
| AlbumCount | integer|null |  |
| SongCount | integer|null |  |
| MusicVideoCount | integer|null |  |
| Subviews | string[] |  |
| ListingsProviderId | string |  |
| ListingsChannelId | string |  |
| ListingsPath | string |  |
| ListingsId | string |  |
| ListingsChannelName | string |  |
| ListingsChannelNumber | string |  |
| AffiliateCallSign | string |  |


---

## getLivetvGuideinfo

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/GuideInfo

**Method：** GET

**接口描述：** Gets guide info

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a GuideInfo object. | LiveTv.GuideInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.GuideInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| StartDate | string |  |
| EndDate | string |  |


**200 字段说明（LiveTv.GuideInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| StartDate | string |  |
| EndDate | string |  |


---

## getLivetvInfo

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Info

**Method：** GET

**接口描述：** Gets available live tv services.

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a LiveTvInfo object. | LiveTv.LiveTvInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.LiveTvInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsEnabled | boolean |  |
| EnabledUsers | string[] |  |


**200 字段说明（LiveTv.LiveTvInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsEnabled | boolean |  |
| EnabledUsers | string[] |  |


---

## deleteLivetvListingproviders

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/ListingProviders

**Method：** DELETE

**接口描述：** Deletes a listing provider

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 否 | string |  | Provider id |


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

## getLivetvListingproviders

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders

**Method：** GET

**接口描述：** Gets current listing providers

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ChannelId | 是 | string |  | Channel id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ListingsProviderInfo[] object. | LiveTv.ListingsProviderInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postLivetvListingproviders

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/ListingProviders

**Method：** POST

**接口描述：** Adds a listing provider

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：ListingsProviderInfo:
- Content-Type：`application/json`
- Schema：`LiveTv.ListingsProviderInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| SetupUrl | string |  |
| Id | string |  |
| Type | string |  |
| Username | string |  |
| Password | string |  |
| ListingsId | string |  |
| ZipCode | string |  |
| Country | string |  |
| Path | string |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| TvgShiftTicks | integer |  |
| MoviePrefix | string |  |
| PreferredLanguage | string |  |
| UserAgent | string |  |
| DataVersion | string |  |

- Content-Type：`application/xml`
- Schema：`LiveTv.ListingsProviderInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| SetupUrl | string |  |
| Id | string |  |
| Type | string |  |
| Username | string |  |
| Password | string |  |
| ListingsId | string |  |
| ZipCode | string |  |
| Country | string |  |
| Path | string |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| TvgShiftTicks | integer |  |
| MoviePrefix | string |  |
| PreferredLanguage | string |  |
| UserAgent | string |  |
| DataVersion | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ListingsProviderInfo object. | LiveTv.ListingsProviderInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| SetupUrl | string |  |
| Id | string |  |
| Type | string |  |
| Username | string |  |
| Password | string |  |
| ListingsId | string |  |
| ZipCode | string |  |
| Country | string |  |
| Path | string |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| TvgShiftTicks | integer |  |
| MoviePrefix | string |  |
| PreferredLanguage | string |  |
| UserAgent | string |  |
| DataVersion | string |  |


**200 字段说明（LiveTv.ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| SetupUrl | string |  |
| Id | string |  |
| Type | string |  |
| Username | string |  |
| Password | string |  |
| ListingsId | string |  |
| ZipCode | string |  |
| Country | string |  |
| Path | string |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| TvgShiftTicks | integer |  |
| MoviePrefix | string |  |
| PreferredLanguage | string |  |
| UserAgent | string |  |
| DataVersion | string |  |


---

## getLivetvListingprovidersAvailable

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders/Available

**Method：** GET

**接口描述：** Gets listing provider

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ListingProviderTypeInfo[] object. | Api.ListingProviderTypeInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLivetvListingprovidersDefault

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders/Default

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ListingsProviderInfo object. | LiveTv.ListingsProviderInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| SetupUrl | string |  |
| Id | string |  |
| Type | string |  |
| Username | string |  |
| Password | string |  |
| ListingsId | string |  |
| ZipCode | string |  |
| Country | string |  |
| Path | string |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| TvgShiftTicks | integer |  |
| MoviePrefix | string |  |
| PreferredLanguage | string |  |
| UserAgent | string |  |
| DataVersion | string |  |


**200 字段说明（LiveTv.ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| SetupUrl | string |  |
| Id | string |  |
| Type | string |  |
| Username | string |  |
| Password | string |  |
| ListingsId | string |  |
| ZipCode | string |  |
| Country | string |  |
| Path | string |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| TvgShiftTicks | integer |  |
| MoviePrefix | string |  |
| PreferredLanguage | string |  |
| UserAgent | string |  |
| DataVersion | string |  |


---

## postLivetvListingprovidersDelete

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/ListingProviders/Delete

**Method：** POST

**接口描述：** Deletes a listing provider

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 否 | string |  | Provider id |


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

## getLivetvListingprovidersLineups

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders/Lineups

**Method：** GET

**接口描述：** Gets available lineups

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 否 | string |  | Provider id |
| Type | 否 | string |  | Provider Type |
| Location | 否 | string |  | Location |
| Country | 否 | string |  | Country |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<NameIdPair> object. | NameIdPair[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLivetvManageChannels

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Manage/Channels

**Method：** GET

**接口描述：** Gets the channel management list

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Name, StartDate |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |


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

## postLivetvManageChannelsByIdDisabled

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Manage/Channels/{Id}/Disabled

**Method：** POST

**接口描述：** Sets a channel disabled or not

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：SetChannelDisabled
- Content-Type：`application/json`
- Schema：`Api.SetChannelDisabled`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ManagementId | string |  |
| Disabled | boolean |  |

- Content-Type：`application/xml`
- Schema：`Api.SetChannelDisabled`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ManagementId | string |  |
| Disabled | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<ChannelManagementInfo> object. | QueryResult_ChannelManagementInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_ChannelManagementInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ChannelManagementInfo[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_ChannelManagementInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ChannelManagementInfo[] |  |
| TotalRecordCount | integer |  |


---

## postLivetvManageChannelsByIdSortindex

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Manage/Channels/{Id}/SortIndex

**Method：** POST

**接口描述：** Sets a channel sort index

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：SetChannelSortIndex
- Content-Type：`application/json`
- Schema：`Api.SetChannelSortIndex`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ManagementId | string |  |
| NewIndex | integer |  |

- Content-Type：`application/xml`
- Schema：`Api.SetChannelSortIndex`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ManagementId | string |  |
| NewIndex | integer |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<ChannelManagementInfo> object. | QueryResult_ChannelManagementInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_ChannelManagementInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ChannelManagementInfo[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_ChannelManagementInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ChannelManagementInfo[] |  |
| TotalRecordCount | integer |  |


---

## getLivetvPrograms

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Programs

**Method：** GET

**接口描述：** Gets available live tv epgs..

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ChannelIds | 否 | string |  | The channels to return guide information for. |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


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

## postLivetvPrograms

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Programs

**Method：** POST

**接口描述：** Gets available live tv epgs..

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ChannelIds | 否 | string |  | The channels to return guide information for. |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


**Body**

- 是否必须：是
- 描述：BaseItemsRequest:
- Content-Type：`application/json`
- Schema：`Api.BaseItemsRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IsSpecialEpisode | boolean|null |  |
| Is4K | boolean|null |  |
| MinDateCreated | string|null |  |
| MaxDateCreated | string|null |  |
| EnableTotalRecordCount | boolean |  |
| MatchAnyWord | boolean |  |
| IsDuplicate | boolean|null |  |
| Name | string |  |
| RecordingKeyword | string |  |
| RecordingKeywordType | LiveTv.KeywordType |  |
| RandomSeed | integer |  |
| GenreIds | string |  |
| CollectionIds | string |  |
| TagIds | string |  |
| ExcludeTagIds | string |  |
| ItemPersonTypes | PersonType[] |  |
| ExcludeArtistIds | string |  |
| AlbumArtistIds | string |  |
| ComposerArtistIds | string |  |
| ContributingArtistIds | string |  |
| AlbumIds | string |  |
| OuterIds | string |  |
| ListItemIds | string |  |
| AudioLanguages | string |  |
| SubtitleLanguages | string |  |
| CanEditItems | boolean|null |  |
| GroupItemsInto | Library.ItemLinkType |  |
| IsStandaloneSpecial | boolean|null |  |
| MinWidth | integer|null |  |
| MinHeight | integer|null |  |
| MaxWidth | integer|null |  |
| MaxHeight | integer|null |  |
| GroupProgramsBySeries | boolean |  |
| GroupByPresentationUniqueKey | boolean|null |  |
| AirDays | DayOfWeek[] |  |
| IsAiring | boolean|null |  |
| HasAired | boolean|null |  |
| CollectionTypes | string |  |
| ExcludeSources | string[] |  |

- Content-Type：`application/xml`
- Schema：`Api.BaseItemsRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IsSpecialEpisode | boolean|null |  |
| Is4K | boolean|null |  |
| MinDateCreated | string|null |  |
| MaxDateCreated | string|null |  |
| EnableTotalRecordCount | boolean |  |
| MatchAnyWord | boolean |  |
| IsDuplicate | boolean|null |  |
| Name | string |  |
| RecordingKeyword | string |  |
| RecordingKeywordType | LiveTv.KeywordType |  |
| RandomSeed | integer |  |
| GenreIds | string |  |
| CollectionIds | string |  |
| TagIds | string |  |
| ExcludeTagIds | string |  |
| ItemPersonTypes | PersonType[] |  |
| ExcludeArtistIds | string |  |
| AlbumArtistIds | string |  |
| ComposerArtistIds | string |  |
| ContributingArtistIds | string |  |
| AlbumIds | string |  |
| OuterIds | string |  |
| ListItemIds | string |  |
| AudioLanguages | string |  |
| SubtitleLanguages | string |  |
| CanEditItems | boolean|null |  |
| GroupItemsInto | Library.ItemLinkType |  |
| IsStandaloneSpecial | boolean|null |  |
| MinWidth | integer|null |  |
| MinHeight | integer|null |  |
| MaxWidth | integer|null |  |
| MaxHeight | integer|null |  |
| GroupProgramsBySeries | boolean |  |
| GroupByPresentationUniqueKey | boolean|null |  |
| AirDays | DayOfWeek[] |  |
| IsAiring | boolean|null |  |
| HasAired | boolean|null |  |
| CollectionTypes | string |  |
| ExcludeSources | string[] |  |



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

## getLivetvProgramsRecommended

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Programs/Recommended

**Method：** GET

**接口描述：** Gets available live tv epgs..

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


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

## getLivetvRecordings

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings

**Method：** GET

**接口描述：** Gets live tv recordings

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ChannelId | 否 | string |  | Optional filter by channel id. |
| Status | 否 | LiveTv.RecordingStatus |  | Optional filter by recording status. |
| IsInProgress | 否 | boolean|null |  | Optional filter by recordings that are in progress, or not. |
| SeriesTimerId | 否 | string |  | Optional filter by recordings belonging to a series timer |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


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

## deleteLivetvRecordingsById

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/Recordings/{Id}

**Method：** DELETE

**接口描述：** Deletes a live tv recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Recording Id |


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

## getLivetvRecordingsById

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings/{Id}

**Method：** GET

**接口描述：** Gets a live tv recording

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Recording Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | Optional attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a BaseItemDto object. | BaseItemDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ServerId | string |  |
| Id | string |  |
| Guid | string |  |
| Etag | string |  |
| Prefix | string |  |
| TunerName | string |  |
| PlaylistItemId | string |  |
| DateCreated | string|null |  |
| DateModified | string|null |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| AverageFrameRate | number|null |  |
| RealFrameRate | number|null |  |
| ExtraType | string |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| CanEditItems | boolean|null |  |
| SupportsResume | boolean|null |  |
| PresentationUniqueKey | string |  |
| PreferredMetadataLanguage | string |  |
| PreferredMetadataCountryCode | string |  |
| SupportsSync | boolean|null |  |
| SyncStatus | SyncJobItemStatus |  |
| CanManageAccess | boolean|null |  |
| CanLeaveContent | boolean|null |  |
| CanMakePublic | boolean|null |  |
| Container | string |  |
| SortName | string |  |
| ForcedSortName | string |  |
| Video3DFormat | Video3DFormat |  |
| PremiereDate | string|null |  |
| ExternalUrls | ExternalUrl[] |  |
| MediaSources | MediaSourceInfo[] |  |
| CriticRating | number|null |  |
| GameSystemId | integer|null |  |
| AsSeries | boolean|null |  |
| GameSystem | string |  |
| ProductionLocations | string[] |  |
| Path | string |  |
| OfficialRating | string |  |
| CustomRating | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| Overview | string |  |
| Taglines | string[] |  |
| Genres | string[] |  |
| CommunityRating | number|null |  |
| RunTimeTicks | integer|null |  |
| Size | integer|null |  |
| FileName | string |  |
| Bitrate | integer|null |  |
| ProductionYear | integer|null |  |
| Number | string |  |
| ChannelNumber | string |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| RemoteTrailers | MediaUrl[] |  |
| ProviderIds | ProviderIdDictionary |  |
| IsFolder | boolean|null |  |
| ParentId | string |  |
| Type | string |  |
| People | BaseItemPerson[] |  |
| Studios | NameLongIdPair[] |  |
| GenreItems | NameLongIdPair[] |  |
| TagItems | NameLongIdPair[] |  |
| ParentLogoItemId | string |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| LocalTrailerCount | integer|null |  |
| UserData | UserItemDataDto |  |
| RecursiveItemCount | integer|null |  |
| ChildCount | integer|null |  |
| SeasonCount | integer|null |  |
| SeriesName | string |  |
| SeriesId | string |  |
| SeasonId | string |  |
| SpecialFeatureCount | integer|null |  |
| DisplayPreferencesId | string |  |
| Status | string |  |
| AirDays | DayOfWeek[] |  |
| Tags | string[] |  |
| PrimaryImageAspectRatio | number|null |  |
| Artists | string[] |  |
| ArtistItems | NameIdPair[] |  |
| Composers | NameIdPair[] |  |
| Album | string |  |
| CollectionType | string |  |
| DisplayOrder | string |  |
| AlbumId | string |  |
| AlbumPrimaryImageTag | string |  |
| SeriesPrimaryImageTag | string |  |
| AlbumArtist | string |  |
| AlbumArtists | NameIdPair[] |  |
| SeasonName | string |  |
| MediaStreams | MediaStream[] |  |
| PartCount | integer|null |  |
| ImageTags | object |  |
| BackdropImageTags | string[] |  |
| ParentLogoImageTag | string |  |
| SeriesStudio | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| Chapters | ChapterInfo[] |  |
| LocationType | LocationType |  |
| MediaType | string |  |
| EndDate | string|null |  |
| LockedFields | MetadataFields[] |  |
| LockData | boolean|null |  |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string |  |
| CameraModel | string |  |
| Software | string |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | Drawing.ImageOrientation |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string |  |
| ChannelPrimaryImageTag | string |  |
| StartDate | string|null |  |
| CompletionPercentage | number|null |  |
| IsRepeat | boolean|null |  |
| IsNew | boolean|null |  |
| EpisodeTitle | string |  |
| IsMovie | boolean|null |  |
| IsSports | boolean|null |  |
| IsSeries | boolean|null |  |
| IsLive | boolean|null |  |
| IsNews | boolean|null |  |
| IsKids | boolean|null |  |
| IsPremiere | boolean|null |  |
| TimerType | LiveTv.TimerType |  |
| Disabled | boolean|null |  |
| ManagementId | string |  |
| TimerId | string |  |
| CurrentProgram | BaseItemDto |  |
| MovieCount | integer|null |  |
| SeriesCount | integer|null |  |
| AlbumCount | integer|null |  |
| SongCount | integer|null |  |
| MusicVideoCount | integer|null |  |
| Subviews | string[] |  |
| ListingsProviderId | string |  |
| ListingsChannelId | string |  |
| ListingsPath | string |  |
| ListingsId | string |  |
| ListingsChannelName | string |  |
| ListingsChannelNumber | string |  |
| AffiliateCallSign | string |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| OriginalTitle | string |  |
| ServerId | string |  |
| Id | string |  |
| Guid | string |  |
| Etag | string |  |
| Prefix | string |  |
| TunerName | string |  |
| PlaylistItemId | string |  |
| DateCreated | string|null |  |
| DateModified | string|null |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| AverageFrameRate | number|null |  |
| RealFrameRate | number|null |  |
| ExtraType | string |  |
| SortIndexNumber | integer|null |  |
| SortParentIndexNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| CanEditItems | boolean|null |  |
| SupportsResume | boolean|null |  |
| PresentationUniqueKey | string |  |
| PreferredMetadataLanguage | string |  |
| PreferredMetadataCountryCode | string |  |
| SupportsSync | boolean|null |  |
| SyncStatus | SyncJobItemStatus |  |
| CanManageAccess | boolean|null |  |
| CanLeaveContent | boolean|null |  |
| CanMakePublic | boolean|null |  |
| Container | string |  |
| SortName | string |  |
| ForcedSortName | string |  |
| Video3DFormat | Video3DFormat |  |
| PremiereDate | string|null |  |
| ExternalUrls | ExternalUrl[] |  |
| MediaSources | MediaSourceInfo[] |  |
| CriticRating | number|null |  |
| GameSystemId | integer|null |  |
| AsSeries | boolean|null |  |
| GameSystem | string |  |
| ProductionLocations | string[] |  |
| Path | string |  |
| OfficialRating | string |  |
| CustomRating | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| Overview | string |  |
| Taglines | string[] |  |
| Genres | string[] |  |
| CommunityRating | number|null |  |
| RunTimeTicks | integer|null |  |
| Size | integer|null |  |
| FileName | string |  |
| Bitrate | integer|null |  |
| ProductionYear | integer|null |  |
| Number | string |  |
| ChannelNumber | string |  |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| RemoteTrailers | MediaUrl[] |  |
| ProviderIds | ProviderIdDictionary |  |
| IsFolder | boolean|null |  |
| ParentId | string |  |
| Type | string |  |
| People | BaseItemPerson[] |  |
| Studios | NameLongIdPair[] |  |
| GenreItems | NameLongIdPair[] |  |
| TagItems | NameLongIdPair[] |  |
| ParentLogoItemId | string |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| LocalTrailerCount | integer|null |  |
| UserData | UserItemDataDto |  |
| RecursiveItemCount | integer|null |  |
| ChildCount | integer|null |  |
| SeasonCount | integer|null |  |
| SeriesName | string |  |
| SeriesId | string |  |
| SeasonId | string |  |
| SpecialFeatureCount | integer|null |  |
| DisplayPreferencesId | string |  |
| Status | string |  |
| AirDays | DayOfWeek[] |  |
| Tags | string[] |  |
| PrimaryImageAspectRatio | number|null |  |
| Artists | string[] |  |
| ArtistItems | NameIdPair[] |  |
| Composers | NameIdPair[] |  |
| Album | string |  |
| CollectionType | string |  |
| DisplayOrder | string |  |
| AlbumId | string |  |
| AlbumPrimaryImageTag | string |  |
| SeriesPrimaryImageTag | string |  |
| AlbumArtist | string |  |
| AlbumArtists | NameIdPair[] |  |
| SeasonName | string |  |
| MediaStreams | MediaStream[] |  |
| PartCount | integer|null |  |
| ImageTags | object |  |
| BackdropImageTags | string[] |  |
| ParentLogoImageTag | string |  |
| SeriesStudio | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| Chapters | ChapterInfo[] |  |
| LocationType | LocationType |  |
| MediaType | string |  |
| EndDate | string|null |  |
| LockedFields | MetadataFields[] |  |
| LockData | boolean|null |  |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string |  |
| CameraModel | string |  |
| Software | string |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | Drawing.ImageOrientation |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string |  |
| ChannelPrimaryImageTag | string |  |
| StartDate | string|null |  |
| CompletionPercentage | number|null |  |
| IsRepeat | boolean|null |  |
| IsNew | boolean|null |  |
| EpisodeTitle | string |  |
| IsMovie | boolean|null |  |
| IsSports | boolean|null |  |
| IsSeries | boolean|null |  |
| IsLive | boolean|null |  |
| IsNews | boolean|null |  |
| IsKids | boolean|null |  |
| IsPremiere | boolean|null |  |
| TimerType | LiveTv.TimerType |  |
| Disabled | boolean|null |  |
| ManagementId | string |  |
| TimerId | string |  |
| CurrentProgram | BaseItemDto |  |
| MovieCount | integer|null |  |
| SeriesCount | integer|null |  |
| AlbumCount | integer|null |  |
| SongCount | integer|null |  |
| MusicVideoCount | integer|null |  |
| Subviews | string[] |  |
| ListingsProviderId | string |  |
| ListingsChannelId | string |  |
| ListingsPath | string |  |
| ListingsId | string |  |
| ListingsChannelName | string |  |
| ListingsChannelNumber | string |  |
| AffiliateCallSign | string |  |


---

## postLivetvRecordingsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Recordings/{Id}/Delete

**Method：** POST

**接口描述：** Deletes a live tv recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Recording Id |


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

## getLivetvRecordingsFolders

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings/Folders

**Method：** GET

**接口描述：** Gets recording folders

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ArtistType | 否 | string |  | Artist or AlbumArtist |
| MaxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| HasThemeSong | 否 | boolean|null |  | Optional filter by items with theme songs. |
| HasThemeVideo | 否 | boolean|null |  | Optional filter by items with theme videos. |
| HasSubtitles | 否 | boolean|null |  | Optional filter by items with subtitles. |
| HasSpecialFeature | 否 | boolean|null |  | Optional filter by items with special features. |
| HasTrailer | 否 | boolean|null |  | Optional filter by items with trailers. |
| IsSpecialSeason | 否 | boolean|null |  | Optional. Filter by special season. |
| AdjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| StartItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| MinIndexNumber | 否 | integer|null |  | Optional filter by minimum index number. |
| MinStartDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxStartDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinEndDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxEndDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| MinPlayers | 否 | integer|null |  | Optional filter by minimum number of game players. |
| MaxPlayers | 否 | integer|null |  | Optional filter by maximum number of game players. |
| ParentIndexNumber | 否 | integer|null |  | Optional filter by parent index number. |
| HasParentalRating | 否 | boolean|null |  | Optional filter by items that have or do not have a parental rating |
| IsHD | 否 | boolean|null |  | Optional filter by items that are HD or not. |
| IsUnaired | 否 | boolean|null |  | Optional filter by items that are unaired episodes or not. |
| MinCommunityRating | 否 | number|null |  | Optional filter by minimum community rating. |
| MinCriticRating | 否 | number|null |  | Optional filter by minimum critic rating. |
| AiredDuringSeason | 否 | integer|null |  | Gets all episodes that aired during a season, including specials. |
| MinPremiereDate | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSaved | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MinDateLastSavedForUser | 否 | string|null |  | Optional. The minimum premiere date. Format = ISO |
| MaxPremiereDate | 否 | string|null |  | Optional. The maximum premiere date. Format = ISO |
| HasOverview | 否 | boolean|null |  | Optional filter by items that have an overview or not. |
| HasImdbId | 否 | boolean|null |  | Optional filter by items that have an imdb id or not. |
| HasTmdbId | 否 | boolean|null |  | Optional filter by items that have a tmdb id or not. |
| HasTvdbId | 否 | boolean|null |  | Optional filter by items that have a tvdb id or not. |
| ExcludeItemIds | 否 | string |  | Optional. If specified, results will be filtered by exxcluding item ids. This allows multiple, comma delimeted. |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| Recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false |
| SearchTerm | 否 | string |  | Enter a search term to perform a search request |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines |
| ExcludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| AnyProviderIdEquals | 否 | string |  | Optional. If specified, result will be filtered to contain only items which match at least one of the specified IDs. Each provider ID must be in the form 'prov.id', e.g. 'imdb.tt123456'. This allows multiple, comma delimeted value pairs. |
| Filters | 否 | string |  | Optional. Specify additional filters to apply. This allows multiple, comma delimeted. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes |
| IsFavorite | 否 | boolean|null |  | Optional filter by items that are marked as favorite, or not. |
| IsMovie | 否 | boolean|null |  | Optional filter for movies. |
| IsSeries | 否 | boolean|null |  | Optional filter for series. |
| IsFolder | 否 | boolean|null |  | Optional filter for folders. |
| IsNews | 否 | boolean|null |  | Optional filter for news. |
| IsKids | 否 | boolean|null |  | Optional filter for kids. |
| IsSports | 否 | boolean|null |  | Optional filter for sports. |
| IsNew | 否 | boolean|null |  | Optional filter for IsNew. |
| IsPremiere | 否 | boolean|null |  | Optional filter for IsPremiere. |
| IsNewOrPremiere | 否 | boolean|null |  | Optional filter for IsNewOrPremiere. |
| IsRepeat | 否 | boolean|null |  | Optional filter for IsRepeat. |
| ProjectToMedia | 否 | boolean |  | ProjectToMedia |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| ImageTypes | 否 | string |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| SortBy | 否 | string |  | Optional. Specify one or more sort orders, comma delimeted. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime |
| IsPlayed | 否 | boolean|null |  | Optional filter by items that are played, or not. |
| Genres | 否 | string |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimeted. |
| OfficialRatings | 否 | string |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimeted. |
| Tags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| ExcludeTags | 否 | string |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimeted. |
| Years | 否 | string |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimeted. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| Person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonIds | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| PersonTypes | 否 | string |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited |
| Studios | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| StudioIds | 否 | string |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimeted. |
| Artists | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| ArtistIds | 否 | string |  | Optional. If specified, results will be filtered based on artist. This allows multiple, pipe delimeted. |
| Albums | 否 | string |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimeted. |
| Ids | 否 | string |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| VideoTypes | 否 | string |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimeted. |
| Containers | 否 | string |  | Optional filter by Container. Allows multiple, comma delimeted. |
| AudioCodecs | 否 | string |  | Optional filter by AudioCodec. Allows multiple, comma delimeted. |
| AudioLayouts | 否 | string |  | Optional filter by AudioLayout. Allows multiple, comma delimeted. |
| VideoCodecs | 否 | string |  | Optional filter by VideoCodec. Allows multiple, comma delimeted. |
| ExtendedVideoTypes | 否 | string |  | Optional filter by ExtendedVideoType. Allows multiple, comma delimeted. |
| SubtitleCodecs | 否 | string |  | Optional filter by SubtitleCodec. Allows multiple, comma delimeted. |
| Path | 否 | string |  | Optional filter by Path. |
| UserId | 否 | string |  | User Id |
| MinOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| IsLocked | 否 | boolean|null |  | Optional filter by items that are locked. |
| IsPlaceHolder | 否 | boolean|null |  | Optional filter by items that are placeholders |
| HasOfficialRating | 否 | boolean|null |  | Optional filter by items that have official ratings |
| GroupItemsIntoCollections | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| Is3D | 否 | boolean|null |  | Optional filter by items that are 3D, or not. |
| SeriesStatus | 否 | string |  | Optional filter by Series Status. Allows multiple, comma delimeted. |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| ArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| AlbumArtistStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| NameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| NameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a BaseItemDto[] object. | BaseItemDto[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLivetvRecordingsGroups

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings/Groups

**Method：** GET

**接口描述：** Gets live tv recording groups

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

## getLivetvRecordingsSeries

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings/Series

**Method：** GET

**接口描述：** Gets live tv recordings

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

## getLivetvSeriestimers

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/SeriesTimers

**Method：** GET

**接口描述：** Gets live tv series timers

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SortBy | 否 | string |  | Optional. Sort by SortName or Priority |
| SortOrder | 否 | SortOrder |  | Optional. Sort in Ascending or Descending order |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<SeriesTimerInfoDto> object. | QueryResult_LiveTv.SeriesTimerInfoDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_LiveTv.SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | LiveTv.SeriesTimerInfoDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_LiveTv.SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | LiveTv.SeriesTimerInfoDto[] |  |
| TotalRecordCount | integer |  |


---

## postLivetvSeriestimers

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/SeriesTimers

**Method：** POST

**接口描述：** Creates a live tv series timer

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：SeriesTimerInfo:
- Content-Type：`application/json`
- Schema：`LiveTv.SeriesTimerInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ChannelId | string |  |
| ChannelIds | string[] |  |
| ParentFolderId | integer |  |
| ProgramId | string |  |
| ServiceName | string |  |
| Overview | string |  |
| StartDate | string |  |
| EndDate | string |  |
| RecordAnyTime | boolean |  |
| KeepUpTo | integer |  |
| KeepUntil | LiveTv.KeepUntil |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordNewOnly | boolean |  |
| Days | DayOfWeek[] |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| IsPostPaddingRequired | boolean |  |
| SeriesId | string |  |
| ProviderIds | ProviderIdDictionary |  |
| MaxRecordingSeconds | integer |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Name | string |  |

- Content-Type：`application/xml`
- Schema：`LiveTv.SeriesTimerInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ChannelId | string |  |
| ChannelIds | string[] |  |
| ParentFolderId | integer |  |
| ProgramId | string |  |
| ServiceName | string |  |
| Overview | string |  |
| StartDate | string |  |
| EndDate | string |  |
| RecordAnyTime | boolean |  |
| KeepUpTo | integer |  |
| KeepUntil | LiveTv.KeepUntil |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordNewOnly | boolean |  |
| Days | DayOfWeek[] |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| IsPostPaddingRequired | boolean |  |
| SeriesId | string |  |
| ProviderIds | ProviderIdDictionary |  |
| MaxRecordingSeconds | integer |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Name | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SeriesTimerInfoDto object. | LiveTv.SeriesTimerInfoDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RecordAnyTime | boolean |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordAnyChannel | boolean |  |
| KeepUpTo | integer |  |
| MaxRecordingSeconds | integer |  |
| RecordNewOnly | boolean |  |
| ChannelIds | string[] |  |
| Days | DayOfWeek[] |  |
| ImageTags | object |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| ParentPrimaryImageItemId | string |  |
| ParentPrimaryImageTag | string |  |
| SeriesId | string |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


**200 字段说明（LiveTv.SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RecordAnyTime | boolean |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordAnyChannel | boolean |  |
| KeepUpTo | integer |  |
| MaxRecordingSeconds | integer |  |
| RecordNewOnly | boolean |  |
| ChannelIds | string[] |  |
| Days | DayOfWeek[] |  |
| ImageTags | object |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| ParentPrimaryImageItemId | string |  |
| ParentPrimaryImageTag | string |  |
| SeriesId | string |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


---

## deleteLivetvSeriestimersById

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/SeriesTimers/{Id}

**Method：** DELETE

**接口描述：** Cancels a live tv series timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Timer Id |


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

## getLivetvSeriestimersById

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/SeriesTimers/{Id}

**Method：** GET

**接口描述：** Gets a live tv series timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Timer Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TimerInfoDto object. | LiveTv.TimerInfoDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


**200 字段说明（LiveTv.TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


---

## postLivetvSeriestimersById

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/SeriesTimers/{Id}

**Method：** POST

**接口描述：** Updates a live tv series timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：SeriesTimerInfo:
- Content-Type：`application/json`
- Schema：`LiveTv.SeriesTimerInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ChannelId | string |  |
| ChannelIds | string[] |  |
| ParentFolderId | integer |  |
| ProgramId | string |  |
| ServiceName | string |  |
| Overview | string |  |
| StartDate | string |  |
| EndDate | string |  |
| RecordAnyTime | boolean |  |
| KeepUpTo | integer |  |
| KeepUntil | LiveTv.KeepUntil |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordNewOnly | boolean |  |
| Days | DayOfWeek[] |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| IsPostPaddingRequired | boolean |  |
| SeriesId | string |  |
| ProviderIds | ProviderIdDictionary |  |
| MaxRecordingSeconds | integer |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Name | string |  |

- Content-Type：`application/xml`
- Schema：`LiveTv.SeriesTimerInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ChannelId | string |  |
| ChannelIds | string[] |  |
| ParentFolderId | integer |  |
| ProgramId | string |  |
| ServiceName | string |  |
| Overview | string |  |
| StartDate | string |  |
| EndDate | string |  |
| RecordAnyTime | boolean |  |
| KeepUpTo | integer |  |
| KeepUntil | LiveTv.KeepUntil |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordNewOnly | boolean |  |
| Days | DayOfWeek[] |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| IsPostPaddingRequired | boolean |  |
| SeriesId | string |  |
| ProviderIds | ProviderIdDictionary |  |
| MaxRecordingSeconds | integer |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Name | string |  |



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

## postLivetvSeriestimersByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/SeriesTimers/{Id}/Delete

**Method：** POST

**接口描述：** Cancels a live tv series timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Timer Id |


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

## getLivetvTimers

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Timers

**Method：** GET

**接口描述：** Gets live tv timers

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ChannelId | 否 | string |  | Optional filter by channel id. |
| SeriesTimerId | 否 | string |  | Optional filter by timers belonging to a series timer |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<TimerInfoDto> object. | QueryResult_LiveTv.TimerInfoDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_LiveTv.TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | LiveTv.TimerInfoDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_LiveTv.TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | LiveTv.TimerInfoDto[] |  |
| TotalRecordCount | integer |  |


---

## postLivetvTimers

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Timers

**Method：** POST

**接口描述：** Creates a live tv timer

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：TimerInfoDto:
- Content-Type：`application/json`
- Schema：`LiveTv.TimerInfoDto`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |

- Content-Type：`application/xml`
- Schema：`LiveTv.TimerInfoDto`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |



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

## deleteLivetvTimersById

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/Timers/{Id}

**Method：** DELETE

**接口描述：** Cancels a live tv timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Timer Id |


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

## getLivetvTimersById

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Timers/{Id}

**Method：** GET

**接口描述：** Gets a live tv timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Timer Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TimerInfoDto object. | LiveTv.TimerInfoDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


**200 字段说明（LiveTv.TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


---

## postLivetvTimersById

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Timers/{Id}

**Method：** POST

**接口描述：** Updates a live tv timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：TimerInfoDto:
- Content-Type：`application/json`
- Schema：`LiveTv.TimerInfoDto`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |

- Content-Type：`application/xml`
- Schema：`LiveTv.TimerInfoDto`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Status | LiveTv.RecordingStatus |  |
| SeriesTimerId | string |  |
| RunTimeTicks | integer|null |  |
| ProgramInfo | BaseItemDto |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |



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

## postLivetvTimersByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Timers/{Id}/Delete

**Method：** POST

**接口描述：** Cancels a live tv timer

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Timer Id |


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

## getLivetvTimersDefaults

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Timers/Defaults

**Method：** GET

**接口描述：** Gets default values for a new timer

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ProgramId | 否 | string |  | Optional, to attach default values based on a program. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SeriesTimerInfoDto object. | LiveTv.SeriesTimerInfoDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RecordAnyTime | boolean |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordAnyChannel | boolean |  |
| KeepUpTo | integer |  |
| MaxRecordingSeconds | integer |  |
| RecordNewOnly | boolean |  |
| ChannelIds | string[] |  |
| Days | DayOfWeek[] |  |
| ImageTags | object |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| ParentPrimaryImageItemId | string |  |
| ParentPrimaryImageTag | string |  |
| SeriesId | string |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


**200 字段说明（LiveTv.SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RecordAnyTime | boolean |  |
| SkipEpisodesInLibrary | boolean |  |
| MatchExistingItemsWithAnyLibrary | boolean |  |
| RecordAnyChannel | boolean |  |
| KeepUpTo | integer |  |
| MaxRecordingSeconds | integer |  |
| RecordNewOnly | boolean |  |
| ChannelIds | string[] |  |
| Days | DayOfWeek[] |  |
| ImageTags | object |  |
| ParentThumbItemId | string |  |
| ParentThumbImageTag | string |  |
| ParentPrimaryImageItemId | string |  |
| ParentPrimaryImageTag | string |  |
| SeriesId | string |  |
| Keywords | LiveTv.KeywordInfo[] |  |
| TimerType | LiveTv.TimerType |  |
| Id | string |  |
| Type | string |  |
| ServerId | string |  |
| ChannelId | string |  |
| ChannelName | string |  |
| ChannelNumber | string |  |
| ChannelPrimaryImageTag | string |  |
| ProgramId | string |  |
| Name | string |  |
| Overview | string |  |
| ParentFolderId | string |  |
| StartDate | string |  |
| EndDate | string |  |
| Priority | integer |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| IsPrePaddingRequired | boolean |  |
| ParentBackdropItemId | string |  |
| ParentBackdropImageTags | string[] |  |
| IsPostPaddingRequired | boolean |  |
| KeepUntil | LiveTv.KeepUntil |  |


---

## deleteLivetvTunerhosts

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/TunerHosts

**Method：** DELETE

**接口描述：** Deletes a tuner host

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 否 | string |  | Tuner host id |


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

## getLivetvTunerhosts

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/TunerHosts

**Method：** GET

**接口描述：** Gets tuner hosts

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TunerHostInfo[] object. | LiveTv.TunerHostInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postLivetvTunerhosts

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/TunerHosts

**Method：** POST

**接口描述：** Adds a tuner host

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：TunerHostInfo:
- Content-Type：`application/json`
- Schema：`LiveTv.TunerHostInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Url | string |  |
| Type | string |  |
| DeviceId | string |  |
| FriendlyName | string |  |
| SetupUrl | string |  |
| ImportFavoritesOnly | boolean |  |
| PreferEpgChannelImages | boolean |  |
| PreferEpgChannelNumbers | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowMappingByNumber | boolean |  |
| ImportGuideData | boolean |  |
| Source | string |  |
| TunerCount | integer |  |
| UserAgent | string |  |
| Referrer | string |  |
| ProviderOptions | string |  |
| DataVersion | integer |  |

- Content-Type：`application/xml`
- Schema：`LiveTv.TunerHostInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Url | string |  |
| Type | string |  |
| DeviceId | string |  |
| FriendlyName | string |  |
| SetupUrl | string |  |
| ImportFavoritesOnly | boolean |  |
| PreferEpgChannelImages | boolean |  |
| PreferEpgChannelNumbers | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowMappingByNumber | boolean |  |
| ImportGuideData | boolean |  |
| Source | string |  |
| TunerCount | integer |  |
| UserAgent | string |  |
| Referrer | string |  |
| ProviderOptions | string |  |
| DataVersion | integer |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TunerHostInfo object. | LiveTv.TunerHostInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Url | string |  |
| Type | string |  |
| DeviceId | string |  |
| FriendlyName | string |  |
| SetupUrl | string |  |
| ImportFavoritesOnly | boolean |  |
| PreferEpgChannelImages | boolean |  |
| PreferEpgChannelNumbers | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowMappingByNumber | boolean |  |
| ImportGuideData | boolean |  |
| Source | string |  |
| TunerCount | integer |  |
| UserAgent | string |  |
| Referrer | string |  |
| ProviderOptions | string |  |
| DataVersion | integer |  |


**200 字段说明（LiveTv.TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Url | string |  |
| Type | string |  |
| DeviceId | string |  |
| FriendlyName | string |  |
| SetupUrl | string |  |
| ImportFavoritesOnly | boolean |  |
| PreferEpgChannelImages | boolean |  |
| PreferEpgChannelNumbers | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowMappingByNumber | boolean |  |
| ImportGuideData | boolean |  |
| Source | string |  |
| TunerCount | integer |  |
| UserAgent | string |  |
| Referrer | string |  |
| ProviderOptions | string |  |
| DataVersion | integer |  |


---

## getLivetvTunerhostsDefaultByType

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/TunerHosts/Default/{Type}

**Method：** GET

**接口描述：** Gets tuner hosts

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Type | 是 | string |  | Type |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a TunerHostInfo object. | LiveTv.TunerHostInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveTv.TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Url | string |  |
| Type | string |  |
| DeviceId | string |  |
| FriendlyName | string |  |
| SetupUrl | string |  |
| ImportFavoritesOnly | boolean |  |
| PreferEpgChannelImages | boolean |  |
| PreferEpgChannelNumbers | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowMappingByNumber | boolean |  |
| ImportGuideData | boolean |  |
| Source | string |  |
| TunerCount | integer |  |
| UserAgent | string |  |
| Referrer | string |  |
| ProviderOptions | string |  |
| DataVersion | integer |  |


**200 字段说明（LiveTv.TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| Url | string |  |
| Type | string |  |
| DeviceId | string |  |
| FriendlyName | string |  |
| SetupUrl | string |  |
| ImportFavoritesOnly | boolean |  |
| PreferEpgChannelImages | boolean |  |
| PreferEpgChannelNumbers | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowMappingByNumber | boolean |  |
| ImportGuideData | boolean |  |
| Source | string |  |
| TunerCount | integer |  |
| UserAgent | string |  |
| Referrer | string |  |
| ProviderOptions | string |  |
| DataVersion | integer |  |


---

## postLivetvTunerhostsDelete

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/TunerHosts/Delete

**Method：** POST

**接口描述：** Deletes a tuner host

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 否 | string |  | Tuner host id |


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

## getLivetvTunerhostsTypes

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/TunerHosts/Types

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<NameIdPair> object. | NameIdPair[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postLivetvTunersByIdReset

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Tuners/{Id}/Reset

**Method：** POST

**接口描述：** Resets a tv tuner

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Tuner Id |


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

## getLivetvTunersDiscover

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Tuners/Discover

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<TunerHostInfo> object. | LiveTv.TunerHostInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLivetvTunersDiscvover

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Tuners/Discvover

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<TunerHostInfo> object. | LiveTv.TunerHostInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

