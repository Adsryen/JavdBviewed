# 媒体库与条目（Library）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：媒体库与条目
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：34

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Albums/{itemId}/Similar` | GetSimilarAlbums | Gets similar items. |
| GET | `/Artists/{itemId}/Similar` | GetSimilarArtists | Gets similar items. |
| DELETE | `/Items` | DeleteItems | Deletes items from the library and filesystem. |
| GET | `/Items` | GetItems | Gets items based on a query. |
| DELETE | `/Items/{itemId}` | DeleteItem | Deletes an item from the library and filesystem. |
| GET | `/Items/{itemId}` | GetItem | Gets an item from a user's library. |
| GET | `/Items/{itemId}/Ancestors` | GetAncestors | Gets all parents of an item. |
| GET | `/Items/{itemId}/Collections` | GetItemCollections | Gets the collections that include the specified item. |
| GET | `/Items/{itemId}/Download` | GetDownload | Downloads item media. |
| GET | `/Items/{itemId}/File` | GetFile | Get the original file of an item. |
| GET | `/Items/{itemId}/Intros` | GetIntros | Gets intros to play before the main media item plays. |
| GET | `/Items/{itemId}/LocalTrailers` | GetLocalTrailers | Gets local trailers for an item. |
| POST | `/Items/{itemId}/Refresh` | RefreshItem | Refreshes metadata for an item. |
| GET | `/Items/{itemId}/Similar` | GetSimilarItems | Gets similar items. |
| GET | `/Items/{itemId}/SpecialFeatures` | GetSpecialFeatures | Gets special features for an item. |
| GET | `/Items/{itemId}/ThemeMedia` | GetThemeMedia | Get theme songs and videos for an item. |
| GET | `/Items/{itemId}/ThemeSongs` | GetThemeSongs | Get theme songs for an item. |
| GET | `/Items/{itemId}/ThemeVideos` | GetThemeVideos | Get theme videos for an item. |
| GET | `/Items/Counts` | GetItemCounts | Get item counts. |
| GET | `/Items/Latest` | GetLatestMedia | Gets latest media. |
| GET | `/Items/Root` | GetRootFolder | Gets the root folder from a user's library. |
| GET | `/Libraries/AvailableOptions` | GetLibraryOptionsInfo | Gets the library options info. |
| POST | `/Library/Media/Updated` | PostUpdatedMedia | Reports that new movies have been added by an external source. |
| GET | `/Library/MediaFolders` | GetMediaFolders | Gets all user media folders. |
| POST | `/Library/Movies/Added` | PostAddedMovies | Reports that new movies have been added by an external source. |
| POST | `/Library/Movies/Updated` | PostUpdatedMovies | Reports that new movies have been added by an external source. |
| GET | `/Library/PhysicalPaths` | GetPhysicalPaths | Gets a list of physical paths from virtual folders. |
| POST | `/Library/Refresh` | RefreshLibrary | Starts a library scan. |
| POST | `/Library/Series/Added` | PostAddedSeries | Reports that new episodes of a series have been added by an external source. |
| POST | `/Library/Series/Updated` | PostUpdatedSeries | Reports that new episodes of a series have been added by an external source. |
| GET | `/Movies/{itemId}/Similar` | GetSimilarMovies | Gets similar items. |
| GET | `/Shows/{itemId}/Similar` | GetSimilarShows | Gets similar items. |
| GET | `/Trailers/{itemId}/Similar` | GetSimilarTrailers | Gets similar items. |
| GET | `/UserItems/Resume` | GetResumeItems | Gets items based on a query. |

---

## GetSimilarAlbums

### 基本信息
**Path：** GET 服务器地址 + /Albums/{itemId}/Similar

**Method：** GET

**接口描述：** Gets similar items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| excludeArtistIds | 否 | string[] |  | Exclude artist ids. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Similar items returned. | BaseItemDtoQueryResult |
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

## GetSimilarArtists

### 基本信息
**Path：** GET 服务器地址 + /Artists/{itemId}/Similar

**Method：** GET

**接口描述：** Gets similar items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| excludeArtistIds | 否 | string[] |  | Exclude artist ids. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Similar items returned. | BaseItemDtoQueryResult |
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

## DeleteItems

### 基本信息
**Path：** DELETE 服务器地址 + /Items

**Method：** DELETE

**接口描述：** Deletes items from the library and filesystem.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ids | 否 | string[] |  | The item ids. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Items deleted. |  |
| 401 | Unauthorized access. | ProblemDetails |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItems

### 基本信息
**Path：** GET 服务器地址 + /Items

**Method：** GET

**接口描述：** Gets items based on a query.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id supplied as query parameter; this is required when not using an API key. |
| maxOfficialRating | 否 | string |  | Optional filter by maximum official rating (PG, PG-13, TV-MA, etc). |
| hasThemeSong | 否 | boolean |  | Optional filter by items with theme songs. |
| hasThemeVideo | 否 | boolean |  | Optional filter by items with theme videos. |
| hasSubtitles | 否 | boolean |  | Optional filter by items with subtitles. |
| hasSpecialFeature | 否 | boolean |  | Optional filter by items with special features. |
| hasTrailer | 否 | boolean |  | Optional filter by items with trailers. |
| adjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| indexNumber | 否 | integer |  | Optional filter by index number. |
| parentIndexNumber | 否 | integer |  | Optional filter by parent index number. |
| hasParentalRating | 否 | boolean |  | Optional filter by items that have or do not have a parental rating. |
| isHd | 否 | boolean |  | Optional filter by items that are HD or not. |
| is4K | 否 | boolean |  | Optional filter by items that are 4K or not. |
| locationTypes | 否 | LocationType[] |  | Optional. If specified, results will be filtered based on LocationType. This allows multiple, comma delimited. |
| excludeLocationTypes | 否 | LocationType[] |  | Optional. If specified, results will be filtered based on the LocationType. This allows multiple, comma delimited. |
| isMissing | 否 | boolean |  | Optional filter by items that are missing episodes or not. |
| isUnaired | 否 | boolean |  | Optional filter by items that are unaired episodes or not. |
| minCommunityRating | 否 | number |  | Optional filter by minimum community rating. |
| minCriticRating | 否 | number |  | Optional filter by minimum critic rating. |
| minPremiereDate | 否 | string |  | Optional. The minimum premiere date. Format = ISO. |
| minDateLastSaved | 否 | string |  | Optional. The minimum last saved date. Format = ISO. |
| minDateLastSavedForUser | 否 | string |  | Optional. The minimum last saved date for the current user. Format = ISO. |
| maxPremiereDate | 否 | string |  | Optional. The maximum premiere date. Format = ISO. |
| hasOverview | 否 | boolean |  | Optional filter by items that have an overview or not. |
| hasImdbId | 否 | boolean |  | Optional filter by items that have an IMDb id or not. |
| hasTmdbId | 否 | boolean |  | Optional filter by items that have a TMDb id or not. |
| hasTvdbId | 否 | boolean |  | Optional filter by items that have a TVDb id or not. |
| isMovie | 否 | boolean |  | Optional filter for live tv movies. |
| isSeries | 否 | boolean |  | Optional filter for live tv series. |
| isNews | 否 | boolean |  | Optional filter for live tv news. |
| isKids | 否 | boolean |  | Optional filter for live tv kids. |
| isSports | 否 | boolean |  | Optional filter for live tv sports. |
| excludeItemIds | 否 | string[] |  | Optional. If specified, results will be filtered by excluding item ids. This allows multiple, comma delimited. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| recursive | 否 | boolean |  | When searching within folders, this determines whether or not the search will be recursive. true/false. |
| searchTerm | 否 | string |  | Optional. Filter based on a search term. |
| sortOrder | 否 | SortOrder[] |  | Sort Order - Ascending, Descending. |
| parentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines. |
| excludeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. |
| includeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on the item type. This allows multiple, comma delimited. |
| filters | 否 | ItemFilter[] |  | Optional. Specify additional filters to apply. This allows multiple, comma delimited. Options: IsFolder, IsNotFolder, IsUnplayed, IsPlayed, IsFavorite, IsResumable, Likes, Dislikes. |
| isFavorite | 否 | boolean |  | Optional filter by items that are marked as favorite, or not. |
| mediaTypes | 否 | MediaType[] |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| imageTypes | 否 | ImageType[] |  | Optional. If specified, results will be filtered based on those containing image types. This allows multiple, comma delimited. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. |
| isPlayed | 否 | boolean |  | Optional filter by items that are played, or not. |
| genres | 否 | string[] |  | Optional. If specified, results will be filtered based on genre. This allows multiple, pipe delimited. |
| officialRatings | 否 | string[] |  | Optional. If specified, results will be filtered based on OfficialRating. This allows multiple, pipe delimited. |
| tags | 否 | string[] |  | Optional. If specified, results will be filtered based on tag. This allows multiple, pipe delimited. |
| years | 否 | integer[] |  | Optional. If specified, results will be filtered based on production year. This allows multiple, comma delimited. |
| enableUserData | 否 | boolean |  | Optional, include user data. |
| imageTypeLimit | 否 | integer |  | Optional, the max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| person | 否 | string |  | Optional. If specified, results will be filtered to include only those containing the specified person. |
| personIds | 否 | string[] |  | Optional. If specified, results will be filtered to include only those containing the specified person id. |
| personTypes | 否 | string[] |  | Optional. If specified, along with Person, results will be filtered to include only those containing the specified person and PersonType. Allows multiple, comma-delimited. |
| studios | 否 | string[] |  | Optional. If specified, results will be filtered based on studio. This allows multiple, pipe delimited. |
| artists | 否 | string[] |  | Optional. If specified, results will be filtered based on artists. This allows multiple, pipe delimited. |
| excludeArtistIds | 否 | string[] |  | Optional. If specified, results will be filtered based on artist id. This allows multiple, pipe delimited. |
| artistIds | 否 | string[] |  | Optional. If specified, results will be filtered to include only those containing the specified artist id. |
| albumArtistIds | 否 | string[] |  | Optional. If specified, results will be filtered to include only those containing the specified album artist id. |
| contributingArtistIds | 否 | string[] |  | Optional. If specified, results will be filtered to include only those containing the specified contributing artist id. |
| albums | 否 | string[] |  | Optional. If specified, results will be filtered based on album. This allows multiple, pipe delimited. |
| albumIds | 否 | string[] |  | Optional. If specified, results will be filtered based on album id. This allows multiple, pipe delimited. |
| ids | 否 | string[] |  | Optional. If specific items are needed, specify a list of item id's to retrieve. This allows multiple, comma delimited. |
| videoTypes | 否 | VideoType[] |  | Optional filter by VideoType (videofile, dvd, bluray, iso). Allows multiple, comma delimited. |
| minOfficialRating | 否 | string |  | Optional filter by minimum official rating (PG, PG-13, TV-MA, etc). |
| isLocked | 否 | boolean |  | Optional filter by items that are locked. |
| isPlaceHolder | 否 | boolean |  | Optional filter by items that are placeholders. |
| hasOfficialRating | 否 | boolean |  | Optional filter by items that have official ratings. |
| collapseBoxSetItems | 否 | boolean |  | Whether or not to hide items behind their boxsets. |
| minWidth | 否 | integer |  | Optional. Filter by the minimum width of the item. |
| minHeight | 否 | integer |  | Optional. Filter by the minimum height of the item. |
| maxWidth | 否 | integer |  | Optional. Filter by the maximum width of the item. |
| maxHeight | 否 | integer |  | Optional. Filter by the maximum height of the item. |
| is3D | 否 | boolean |  | Optional filter by items that are 3D, or not. |
| seriesStatus | 否 | SeriesStatus[] |  | Optional filter by Series Status. Allows multiple, comma delimited. |
| nameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| nameStartsWith | 否 | string |  | Optional filter by items whose name is sorted equally than a given input string. |
| nameLessThan | 否 | string |  | Optional filter by items whose name is equally or lesser than a given input string. |
| studioIds | 否 | string[] |  | Optional. If specified, results will be filtered based on studio id. This allows multiple, pipe delimited. |
| genreIds | 否 | string[] |  | Optional. If specified, results will be filtered based on genre id. This allows multiple, pipe delimited. |
| audioLanguages | 否 | string[] |  | Optional. If specified, results will be filtered based on audio language. This allows multiple, comma delimited values. |
| subtitleLanguages | 否 | string[] |  | Optional. If specified, results will be filtered based on subtitle language. This allows multiple, comma delimited values. |
| enableTotalRecordCount | 否 | boolean | true | Optional. Enable the total record count. |
| enableImages | 否 | boolean | true | Optional, include image information in output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | BaseItemDtoQueryResult |
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

## DeleteItem

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{itemId}

**Method：** DELETE

**接口描述：** Deletes an item from the library and filesystem.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Item deleted. |  |
| 401 | Unauthorized access. | ProblemDetails |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItem

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}

**Method：** GET

**接口描述：** Gets an item from a user's library.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item returned. | BaseItemDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| Id | string | Gets or sets the id. |
| Etag | string|null | Gets or sets the etag. |
| SourceType | string|null | Gets or sets the type of the source. |
| PlaylistItemId | string|null | Gets or sets the playlist item identifier. |
| DateCreated | string|null | Gets or sets the date created. |
| DateLastMediaAdded | string|null |  |
| ExtraType | string enum(Unknown|Clip|Trailer|BehindTheScenes|DeletedScene|Interview|Scene|Sample|ThemeSong|ThemeVideo|Featurette|Short) |  |
| AirsBeforeSeasonNumber | integer|null |  |
| AirsAfterSeasonNumber | integer|null |  |
| AirsBeforeEpisodeNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| HasLyrics | boolean|null |  |
| HasSubtitles | boolean|null |  |
| PreferredMetadataLanguage | string|null |  |
| PreferredMetadataCountryCode | string|null |  |
| Container | string|null |  |
| SortName | string|null | Gets or sets the name of the sort. |
| ForcedSortName | string|null |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) | Gets or sets the video3 D format. |
| PremiereDate | string|null | Gets or sets the premiere date. |
| ExternalUrls | ExternalUrl[] | Gets or sets the external urls. |
| MediaSources | MediaSourceInfo[] | Gets or sets the media versions. |
| CriticRating | number|null | Gets or sets the critic rating. |
| ProductionLocations | string[] |  |
| Path | string|null | Gets or sets the path. |
| EnableMediaSourceDisplay | boolean|null |  |
| OfficialRating | string|null | Gets or sets the official rating. |
| CustomRating | string|null | Gets or sets the custom rating. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null |  |
| Overview | string|null | Gets or sets the overview. |
| Taglines | string[] | Gets or sets the taglines. |
| Genres | string[] | Gets or sets the genres. |
| CommunityRating | number|null | Gets or sets the community rating. |
| CumulativeRunTimeTicks | integer|null | Gets or sets the cumulative run time ticks. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| PlayAccess | string enum(Full|None) | Gets or sets the play access. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| ProductionYear | integer|null | Gets or sets the production year. |
| IsPlaceHolder | boolean|null | Gets or sets a value indicating whether this instance is place holder. |
| Number | string|null | Gets or sets the number. |
| ChannelNumber | string|null |  |
| IndexNumber | integer|null | Gets or sets the index number. |
| IndexNumberEnd | integer|null | Gets or sets the index number end. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| RemoteTrailers | MediaUrl[] | Gets or sets the trailer urls. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| IsHD | boolean|null | Gets or sets a value indicating whether this instance is HD. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| ParentId | string|null | Gets or sets the parent id. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| People | BaseItemPerson[] | Gets or sets the people. |
| Studios | NameGuidPair[] | Gets or sets the studios. |
| GenreItems | NameGuidPair[] |  |
| ParentLogoItemId | string|null | Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one. |
| ParentBackdropItemId | string|null | Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| LocalTrailerCount | integer|null | Gets or sets the local trailer count. |
| UserData | UserItemDataDto | Gets or sets the user data for this item based on the user it's being requested for. |
| RecursiveItemCount | integer|null | Gets or sets the recursive item count. |
| ChildCount | integer|null | Gets or sets the child count. |
| SeriesName | string|null | Gets or sets the name of the series. |
| SeriesId | string|null | Gets or sets the series id. |
| SeasonId | string|null | Gets or sets the season identifier. |
| SpecialFeatureCount | integer|null | Gets or sets the special feature count. |
| DisplayPreferencesId | string|null | Gets or sets the display preferences id. |
| Status | string|null | Gets or sets the status. |
| AirTime | string|null | Gets or sets the air time. |
| AirDays | DayOfWeek[] | Gets or sets the air days. |
| Tags | string[] | Gets or sets the tags. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio, after image enhancements. |
| Artists | string[] | Gets or sets the artists. |
| ArtistItems | NameGuidPair[] | Gets or sets the artist items. |
| Album | string|null | Gets or sets the album. |
| CollectionType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the type of the collection. |
| DisplayOrder | string|null | Gets or sets the display order. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumPrimaryImageTag | string|null | Gets or sets the album image tag. |
| SeriesPrimaryImageTag | string|null | Gets or sets the series primary image tag. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| AlbumArtists | NameGuidPair[] | Gets or sets the album artists. |
| SeasonName | string|null | Gets or sets the name of the season. |
| MediaStreams | MediaStream[] | Gets or sets the media streams. |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) | Gets or sets the type of the video. |
| PartCount | integer|null | Gets or sets the part count. |
| MediaSourceCount | integer|null |  |
| ImageTags | object|null | Gets or sets the image tags. |
| BackdropImageTags | string[] | Gets or sets the backdrop image tags. |
| ScreenshotImageTags | string[] | Gets or sets the screenshot image tags. |
| ParentLogoImageTag | string|null | Gets or sets the parent logo image tag. |
| ParentArtItemId | string|null | Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one. |
| ParentArtImageTag | string|null | Gets or sets the parent art image tag. |
| SeriesThumbImageTag | string|null | Gets or sets the series thumb image tag. |
| ImageBlurHashes | object|null | Gets or sets the blurhashes for the image tags.
Maps image type to dictionary mapping image tag to blurhash value. |
| SeriesStudio | string|null | Gets or sets the series studio. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |
| Chapters | ChapterInfo[] | Gets or sets the chapters. |
| Trickplay | object|null | Gets or sets the trickplay manifest. |
| LocationType | string enum(FileSystem|Remote|Virtual|Offline) | Gets or sets the type of the location. |
| IsoType | string enum(Dvd|BluRay) | Gets or sets the type of the iso. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| EndDate | string|null | Gets or sets the end date. |
| LockedFields | MetadataField[] | Gets or sets the locked fields. |
| TrailerCount | integer|null | Gets or sets the trailer count. |
| MovieCount | integer|null | Gets or sets the movie count. |
| SeriesCount | integer|null | Gets or sets the series count. |
| ProgramCount | integer|null |  |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| SongCount | integer|null | Gets or sets the song count. |
| AlbumCount | integer|null | Gets or sets the album count. |
| ArtistCount | integer|null |  |
| MusicVideoCount | integer|null | Gets or sets the music video count. |
| LockData | boolean|null | Gets or sets a value indicating whether [enable internet providers]. |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string|null |  |
| CameraModel | string|null |  |
| Software | string|null |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | string enum(TopLeft|TopRight|BottomRight|BottomLeft|LeftTop|RightTop|RightBottom|LeftBottom) |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ProgramId | string|null | Gets or sets the program identifier. |
| ChannelPrimaryImageTag | string|null | Gets or sets the channel primary image tag. |
| StartDate | string|null | Gets or sets the start date of the recording, in UTC. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| IsRepeat | boolean|null | Gets or sets a value indicating whether this instance is repeat. |
| EpisodeTitle | string|null | Gets or sets the episode title. |
| ChannelType | string enum(TV|Radio) | Gets or sets the type of the channel. |
| Audio | string enum(Mono|Stereo|Dolby|DolbyDigital|Thx|Atmos) | Gets or sets the audio. |
| IsMovie | boolean|null | Gets or sets a value indicating whether this instance is movie. |
| IsSports | boolean|null | Gets or sets a value indicating whether this instance is sports. |
| IsSeries | boolean|null | Gets or sets a value indicating whether this instance is series. |
| IsLive | boolean|null | Gets or sets a value indicating whether this instance is live. |
| IsNews | boolean|null | Gets or sets a value indicating whether this instance is news. |
| IsKids | boolean|null | Gets or sets a value indicating whether this instance is kids. |
| IsPremiere | boolean|null | Gets or sets a value indicating whether this instance is premiere. |
| TimerId | string|null | Gets or sets the timer identifier. |
| NormalizationGain | number|null | Gets or sets the gain required for audio normalization. |
| AlbumNormalizationGain | number|null | Gets or sets the gain required for audio normalization. This field is inherited from music album normalization gain. |
| CurrentProgram | BaseItemDto | Gets or sets the current program. |
| OriginalLanguage | string|null |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| Id | string | Gets or sets the id. |
| Etag | string|null | Gets or sets the etag. |
| SourceType | string|null | Gets or sets the type of the source. |
| PlaylistItemId | string|null | Gets or sets the playlist item identifier. |
| DateCreated | string|null | Gets or sets the date created. |
| DateLastMediaAdded | string|null |  |
| ExtraType | string enum(Unknown|Clip|Trailer|BehindTheScenes|DeletedScene|Interview|Scene|Sample|ThemeSong|ThemeVideo|Featurette|Short) |  |
| AirsBeforeSeasonNumber | integer|null |  |
| AirsAfterSeasonNumber | integer|null |  |
| AirsBeforeEpisodeNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| HasLyrics | boolean|null |  |
| HasSubtitles | boolean|null |  |
| PreferredMetadataLanguage | string|null |  |
| PreferredMetadataCountryCode | string|null |  |
| Container | string|null |  |
| SortName | string|null | Gets or sets the name of the sort. |
| ForcedSortName | string|null |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) | Gets or sets the video3 D format. |
| PremiereDate | string|null | Gets or sets the premiere date. |
| ExternalUrls | ExternalUrl[] | Gets or sets the external urls. |
| MediaSources | MediaSourceInfo[] | Gets or sets the media versions. |
| CriticRating | number|null | Gets or sets the critic rating. |
| ProductionLocations | string[] |  |
| Path | string|null | Gets or sets the path. |
| EnableMediaSourceDisplay | boolean|null |  |
| OfficialRating | string|null | Gets or sets the official rating. |
| CustomRating | string|null | Gets or sets the custom rating. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null |  |
| Overview | string|null | Gets or sets the overview. |
| Taglines | string[] | Gets or sets the taglines. |
| Genres | string[] | Gets or sets the genres. |
| CommunityRating | number|null | Gets or sets the community rating. |
| CumulativeRunTimeTicks | integer|null | Gets or sets the cumulative run time ticks. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| PlayAccess | string enum(Full|None) | Gets or sets the play access. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| ProductionYear | integer|null | Gets or sets the production year. |
| IsPlaceHolder | boolean|null | Gets or sets a value indicating whether this instance is place holder. |
| Number | string|null | Gets or sets the number. |
| ChannelNumber | string|null |  |
| IndexNumber | integer|null | Gets or sets the index number. |
| IndexNumberEnd | integer|null | Gets or sets the index number end. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| RemoteTrailers | MediaUrl[] | Gets or sets the trailer urls. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| IsHD | boolean|null | Gets or sets a value indicating whether this instance is HD. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| ParentId | string|null | Gets or sets the parent id. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| People | BaseItemPerson[] | Gets or sets the people. |
| Studios | NameGuidPair[] | Gets or sets the studios. |
| GenreItems | NameGuidPair[] |  |
| ParentLogoItemId | string|null | Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one. |
| ParentBackdropItemId | string|null | Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| LocalTrailerCount | integer|null | Gets or sets the local trailer count. |
| UserData | UserItemDataDto | Gets or sets the user data for this item based on the user it's being requested for. |
| RecursiveItemCount | integer|null | Gets or sets the recursive item count. |
| ChildCount | integer|null | Gets or sets the child count. |
| SeriesName | string|null | Gets or sets the name of the series. |
| SeriesId | string|null | Gets or sets the series id. |
| SeasonId | string|null | Gets or sets the season identifier. |
| SpecialFeatureCount | integer|null | Gets or sets the special feature count. |
| DisplayPreferencesId | string|null | Gets or sets the display preferences id. |
| Status | string|null | Gets or sets the status. |
| AirTime | string|null | Gets or sets the air time. |
| AirDays | DayOfWeek[] | Gets or sets the air days. |
| Tags | string[] | Gets or sets the tags. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio, after image enhancements. |
| Artists | string[] | Gets or sets the artists. |
| ArtistItems | NameGuidPair[] | Gets or sets the artist items. |
| Album | string|null | Gets or sets the album. |
| CollectionType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the type of the collection. |
| DisplayOrder | string|null | Gets or sets the display order. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumPrimaryImageTag | string|null | Gets or sets the album image tag. |
| SeriesPrimaryImageTag | string|null | Gets or sets the series primary image tag. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| AlbumArtists | NameGuidPair[] | Gets or sets the album artists. |
| SeasonName | string|null | Gets or sets the name of the season. |
| MediaStreams | MediaStream[] | Gets or sets the media streams. |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) | Gets or sets the type of the video. |
| PartCount | integer|null | Gets or sets the part count. |
| MediaSourceCount | integer|null |  |
| ImageTags | object|null | Gets or sets the image tags. |
| BackdropImageTags | string[] | Gets or sets the backdrop image tags. |
| ScreenshotImageTags | string[] | Gets or sets the screenshot image tags. |
| ParentLogoImageTag | string|null | Gets or sets the parent logo image tag. |
| ParentArtItemId | string|null | Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one. |
| ParentArtImageTag | string|null | Gets or sets the parent art image tag. |
| SeriesThumbImageTag | string|null | Gets or sets the series thumb image tag. |
| ImageBlurHashes | object|null | Gets or sets the blurhashes for the image tags.
Maps image type to dictionary mapping image tag to blurhash value. |
| SeriesStudio | string|null | Gets or sets the series studio. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |
| Chapters | ChapterInfo[] | Gets or sets the chapters. |
| Trickplay | object|null | Gets or sets the trickplay manifest. |
| LocationType | string enum(FileSystem|Remote|Virtual|Offline) | Gets or sets the type of the location. |
| IsoType | string enum(Dvd|BluRay) | Gets or sets the type of the iso. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| EndDate | string|null | Gets or sets the end date. |
| LockedFields | MetadataField[] | Gets or sets the locked fields. |
| TrailerCount | integer|null | Gets or sets the trailer count. |
| MovieCount | integer|null | Gets or sets the movie count. |
| SeriesCount | integer|null | Gets or sets the series count. |
| ProgramCount | integer|null |  |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| SongCount | integer|null | Gets or sets the song count. |
| AlbumCount | integer|null | Gets or sets the album count. |
| ArtistCount | integer|null |  |
| MusicVideoCount | integer|null | Gets or sets the music video count. |
| LockData | boolean|null | Gets or sets a value indicating whether [enable internet providers]. |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string|null |  |
| CameraModel | string|null |  |
| Software | string|null |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | string enum(TopLeft|TopRight|BottomRight|BottomLeft|LeftTop|RightTop|RightBottom|LeftBottom) |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ProgramId | string|null | Gets or sets the program identifier. |
| ChannelPrimaryImageTag | string|null | Gets or sets the channel primary image tag. |
| StartDate | string|null | Gets or sets the start date of the recording, in UTC. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| IsRepeat | boolean|null | Gets or sets a value indicating whether this instance is repeat. |
| EpisodeTitle | string|null | Gets or sets the episode title. |
| ChannelType | string enum(TV|Radio) | Gets or sets the type of the channel. |
| Audio | string enum(Mono|Stereo|Dolby|DolbyDigital|Thx|Atmos) | Gets or sets the audio. |
| IsMovie | boolean|null | Gets or sets a value indicating whether this instance is movie. |
| IsSports | boolean|null | Gets or sets a value indicating whether this instance is sports. |
| IsSeries | boolean|null | Gets or sets a value indicating whether this instance is series. |
| IsLive | boolean|null | Gets or sets a value indicating whether this instance is live. |
| IsNews | boolean|null | Gets or sets a value indicating whether this instance is news. |
| IsKids | boolean|null | Gets or sets a value indicating whether this instance is kids. |
| IsPremiere | boolean|null | Gets or sets a value indicating whether this instance is premiere. |
| TimerId | string|null | Gets or sets the timer identifier. |
| NormalizationGain | number|null | Gets or sets the gain required for audio normalization. |
| AlbumNormalizationGain | number|null | Gets or sets the gain required for audio normalization. This field is inherited from music album normalization gain. |
| CurrentProgram | BaseItemDto | Gets or sets the current program. |
| OriginalLanguage | string|null |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| Id | string | Gets or sets the id. |
| Etag | string|null | Gets or sets the etag. |
| SourceType | string|null | Gets or sets the type of the source. |
| PlaylistItemId | string|null | Gets or sets the playlist item identifier. |
| DateCreated | string|null | Gets or sets the date created. |
| DateLastMediaAdded | string|null |  |
| ExtraType | string enum(Unknown|Clip|Trailer|BehindTheScenes|DeletedScene|Interview|Scene|Sample|ThemeSong|ThemeVideo|Featurette|Short) |  |
| AirsBeforeSeasonNumber | integer|null |  |
| AirsAfterSeasonNumber | integer|null |  |
| AirsBeforeEpisodeNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| HasLyrics | boolean|null |  |
| HasSubtitles | boolean|null |  |
| PreferredMetadataLanguage | string|null |  |
| PreferredMetadataCountryCode | string|null |  |
| Container | string|null |  |
| SortName | string|null | Gets or sets the name of the sort. |
| ForcedSortName | string|null |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) | Gets or sets the video3 D format. |
| PremiereDate | string|null | Gets or sets the premiere date. |
| ExternalUrls | ExternalUrl[] | Gets or sets the external urls. |
| MediaSources | MediaSourceInfo[] | Gets or sets the media versions. |
| CriticRating | number|null | Gets or sets the critic rating. |
| ProductionLocations | string[] |  |
| Path | string|null | Gets or sets the path. |
| EnableMediaSourceDisplay | boolean|null |  |
| OfficialRating | string|null | Gets or sets the official rating. |
| CustomRating | string|null | Gets or sets the custom rating. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null |  |
| Overview | string|null | Gets or sets the overview. |
| Taglines | string[] | Gets or sets the taglines. |
| Genres | string[] | Gets or sets the genres. |
| CommunityRating | number|null | Gets or sets the community rating. |
| CumulativeRunTimeTicks | integer|null | Gets or sets the cumulative run time ticks. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| PlayAccess | string enum(Full|None) | Gets or sets the play access. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| ProductionYear | integer|null | Gets or sets the production year. |
| IsPlaceHolder | boolean|null | Gets or sets a value indicating whether this instance is place holder. |
| Number | string|null | Gets or sets the number. |
| ChannelNumber | string|null |  |
| IndexNumber | integer|null | Gets or sets the index number. |
| IndexNumberEnd | integer|null | Gets or sets the index number end. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| RemoteTrailers | MediaUrl[] | Gets or sets the trailer urls. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| IsHD | boolean|null | Gets or sets a value indicating whether this instance is HD. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| ParentId | string|null | Gets or sets the parent id. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| People | BaseItemPerson[] | Gets or sets the people. |
| Studios | NameGuidPair[] | Gets or sets the studios. |
| GenreItems | NameGuidPair[] |  |
| ParentLogoItemId | string|null | Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one. |
| ParentBackdropItemId | string|null | Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| LocalTrailerCount | integer|null | Gets or sets the local trailer count. |
| UserData | UserItemDataDto | Gets or sets the user data for this item based on the user it's being requested for. |
| RecursiveItemCount | integer|null | Gets or sets the recursive item count. |
| ChildCount | integer|null | Gets or sets the child count. |
| SeriesName | string|null | Gets or sets the name of the series. |
| SeriesId | string|null | Gets or sets the series id. |
| SeasonId | string|null | Gets or sets the season identifier. |
| SpecialFeatureCount | integer|null | Gets or sets the special feature count. |
| DisplayPreferencesId | string|null | Gets or sets the display preferences id. |
| Status | string|null | Gets or sets the status. |
| AirTime | string|null | Gets or sets the air time. |
| AirDays | DayOfWeek[] | Gets or sets the air days. |
| Tags | string[] | Gets or sets the tags. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio, after image enhancements. |
| Artists | string[] | Gets or sets the artists. |
| ArtistItems | NameGuidPair[] | Gets or sets the artist items. |
| Album | string|null | Gets or sets the album. |
| CollectionType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the type of the collection. |
| DisplayOrder | string|null | Gets or sets the display order. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumPrimaryImageTag | string|null | Gets or sets the album image tag. |
| SeriesPrimaryImageTag | string|null | Gets or sets the series primary image tag. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| AlbumArtists | NameGuidPair[] | Gets or sets the album artists. |
| SeasonName | string|null | Gets or sets the name of the season. |
| MediaStreams | MediaStream[] | Gets or sets the media streams. |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) | Gets or sets the type of the video. |
| PartCount | integer|null | Gets or sets the part count. |
| MediaSourceCount | integer|null |  |
| ImageTags | object|null | Gets or sets the image tags. |
| BackdropImageTags | string[] | Gets or sets the backdrop image tags. |
| ScreenshotImageTags | string[] | Gets or sets the screenshot image tags. |
| ParentLogoImageTag | string|null | Gets or sets the parent logo image tag. |
| ParentArtItemId | string|null | Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one. |
| ParentArtImageTag | string|null | Gets or sets the parent art image tag. |
| SeriesThumbImageTag | string|null | Gets or sets the series thumb image tag. |
| ImageBlurHashes | object|null | Gets or sets the blurhashes for the image tags.
Maps image type to dictionary mapping image tag to blurhash value. |
| SeriesStudio | string|null | Gets or sets the series studio. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |
| Chapters | ChapterInfo[] | Gets or sets the chapters. |
| Trickplay | object|null | Gets or sets the trickplay manifest. |
| LocationType | string enum(FileSystem|Remote|Virtual|Offline) | Gets or sets the type of the location. |
| IsoType | string enum(Dvd|BluRay) | Gets or sets the type of the iso. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| EndDate | string|null | Gets or sets the end date. |
| LockedFields | MetadataField[] | Gets or sets the locked fields. |
| TrailerCount | integer|null | Gets or sets the trailer count. |
| MovieCount | integer|null | Gets or sets the movie count. |
| SeriesCount | integer|null | Gets or sets the series count. |
| ProgramCount | integer|null |  |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| SongCount | integer|null | Gets or sets the song count. |
| AlbumCount | integer|null | Gets or sets the album count. |
| ArtistCount | integer|null |  |
| MusicVideoCount | integer|null | Gets or sets the music video count. |
| LockData | boolean|null | Gets or sets a value indicating whether [enable internet providers]. |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string|null |  |
| CameraModel | string|null |  |
| Software | string|null |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | string enum(TopLeft|TopRight|BottomRight|BottomLeft|LeftTop|RightTop|RightBottom|LeftBottom) |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ProgramId | string|null | Gets or sets the program identifier. |
| ChannelPrimaryImageTag | string|null | Gets or sets the channel primary image tag. |
| StartDate | string|null | Gets or sets the start date of the recording, in UTC. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| IsRepeat | boolean|null | Gets or sets a value indicating whether this instance is repeat. |
| EpisodeTitle | string|null | Gets or sets the episode title. |
| ChannelType | string enum(TV|Radio) | Gets or sets the type of the channel. |
| Audio | string enum(Mono|Stereo|Dolby|DolbyDigital|Thx|Atmos) | Gets or sets the audio. |
| IsMovie | boolean|null | Gets or sets a value indicating whether this instance is movie. |
| IsSports | boolean|null | Gets or sets a value indicating whether this instance is sports. |
| IsSeries | boolean|null | Gets or sets a value indicating whether this instance is series. |
| IsLive | boolean|null | Gets or sets a value indicating whether this instance is live. |
| IsNews | boolean|null | Gets or sets a value indicating whether this instance is news. |
| IsKids | boolean|null | Gets or sets a value indicating whether this instance is kids. |
| IsPremiere | boolean|null | Gets or sets a value indicating whether this instance is premiere. |
| TimerId | string|null | Gets or sets the timer identifier. |
| NormalizationGain | number|null | Gets or sets the gain required for audio normalization. |
| AlbumNormalizationGain | number|null | Gets or sets the gain required for audio normalization. This field is inherited from music album normalization gain. |
| CurrentProgram | BaseItemDto | Gets or sets the current program. |
| OriginalLanguage | string|null |  |


---

## GetAncestors

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Ancestors

**Method：** GET

**接口描述：** Gets all parents of an item.

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


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item parents returned. | BaseItemDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItemCollections

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Collections

**Method：** GET

**接口描述：** Gets the collections that include the specified item.

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
| startIndex | 否 | integer |  | Optional. The index of the first record in the output. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Collections returned. | BaseItemDtoQueryResult |
| 401 | User context missing. |  |
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

## GetDownload

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Download

**Method：** GET

**接口描述：** Downloads item media.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Media downloaded. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetFile

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/File

**Method：** GET

**接口描述：** Get the original file of an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | File stream returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetIntros

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Intros

**Method：** GET

**接口描述：** Gets intros to play before the main media item plays.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Intros returned. | BaseItemDtoQueryResult |
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

## GetLocalTrailers

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/LocalTrailers

**Method：** GET

**接口描述：** Gets local trailers for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | An Microsoft.AspNetCore.Mvc.OkResult containing the item's local trailers. | BaseItemDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RefreshItem

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/Refresh

**Method：** POST

**接口描述：** Refreshes metadata for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| metadataRefreshMode | 否 | string enum(None|ValidationOnly|Default|FullRefresh) | None | (Optional) Specifies the metadata refresh mode. |
| imageRefreshMode | 否 | string enum(None|ValidationOnly|Default|FullRefresh) | None | (Optional) Specifies the image refresh mode. |
| replaceAllMetadata | 否 | boolean | false | (Optional) Determines if metadata should be replaced. Only applicable if mode is FullRefresh. |
| replaceAllImages | 否 | boolean | false | (Optional) Determines if images should be replaced. Only applicable if mode is FullRefresh. |
| regenerateTrickplay | 否 | boolean | false | (Optional) Determines if trickplay images should be replaced. Only applicable if mode is FullRefresh. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Item metadata refresh queued. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item to refresh not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSimilarItems

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Similar

**Method：** GET

**接口描述：** Gets similar items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| excludeArtistIds | 否 | string[] |  | Exclude artist ids. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Similar items returned. | BaseItemDtoQueryResult |
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

## GetSpecialFeatures

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/SpecialFeatures

**Method：** GET

**接口描述：** Gets special features for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Special features returned. | BaseItemDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetThemeMedia

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/ThemeMedia

**Method：** GET

**接口描述：** Get theme songs and videos for an item.

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
| inheritFromParent | 否 | boolean | false | Optional. Determines whether or not parent items should be searched for theme media. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. |
| sortOrder | 否 | SortOrder[] |  | Optional. Sort Order - Ascending, Descending. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Theme songs and videos returned. | AllThemeMediaResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（AllThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ThemeVideosResult | ThemeMediaResult | Class ThemeMediaResult. |
| ThemeSongsResult | ThemeMediaResult | Class ThemeMediaResult. |
| SoundtrackSongsResult | ThemeMediaResult | Class ThemeMediaResult. |


**200 字段说明（AllThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ThemeVideosResult | ThemeMediaResult | Class ThemeMediaResult. |
| ThemeSongsResult | ThemeMediaResult | Class ThemeMediaResult. |
| SoundtrackSongsResult | ThemeMediaResult | Class ThemeMediaResult. |


**200 字段说明（AllThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ThemeVideosResult | ThemeMediaResult | Class ThemeMediaResult. |
| ThemeSongsResult | ThemeMediaResult | Class ThemeMediaResult. |
| SoundtrackSongsResult | ThemeMediaResult | Class ThemeMediaResult. |


---

## GetThemeSongs

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/ThemeSongs

**Method：** GET

**接口描述：** Get theme songs for an item.

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
| inheritFromParent | 否 | boolean | false | Optional. Determines whether or not parent items should be searched for theme media. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. |
| sortOrder | 否 | SortOrder[] |  | Optional. Sort Order - Ascending, Descending. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Theme songs returned. | ThemeMediaResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |


**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |


**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |


---

## GetThemeVideos

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/ThemeVideos

**Method：** GET

**接口描述：** Get theme videos for an item.

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
| inheritFromParent | 否 | boolean | false | Optional. Determines whether or not parent items should be searched for theme media. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. |
| sortOrder | 否 | SortOrder[] |  | Optional. Sort Order - Ascending, Descending. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Theme videos returned. | ThemeMediaResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |


**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |


**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |


---

## GetItemCounts

### 基本信息
**Path：** GET 服务器地址 + /Items/Counts

**Method：** GET

**接口描述：** Get item counts.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Get counts from a specific user's library. |
| isFavorite | 否 | boolean |  | Optional. Get counts of favorite items. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item counts returned. | ItemCounts |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ItemCounts）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MovieCount | integer | Gets or sets the movie count. |
| SeriesCount | integer | Gets or sets the series count. |
| EpisodeCount | integer | Gets or sets the episode count. |
| ArtistCount | integer | Gets or sets the artist count. |
| ProgramCount | integer | Gets or sets the program count. |
| TrailerCount | integer | Gets or sets the trailer count. |
| SongCount | integer | Gets or sets the song count. |
| AlbumCount | integer | Gets or sets the album count. |
| MusicVideoCount | integer | Gets or sets the music video count. |
| BoxSetCount | integer | Gets or sets the box set count. |
| BookCount | integer | Gets or sets the book count. |
| ItemCount | integer | Gets or sets the item count. |


**200 字段说明（ItemCounts）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MovieCount | integer | Gets or sets the movie count. |
| SeriesCount | integer | Gets or sets the series count. |
| EpisodeCount | integer | Gets or sets the episode count. |
| ArtistCount | integer | Gets or sets the artist count. |
| ProgramCount | integer | Gets or sets the program count. |
| TrailerCount | integer | Gets or sets the trailer count. |
| SongCount | integer | Gets or sets the song count. |
| AlbumCount | integer | Gets or sets the album count. |
| MusicVideoCount | integer | Gets or sets the music video count. |
| BoxSetCount | integer | Gets or sets the box set count. |
| BookCount | integer | Gets or sets the book count. |
| ItemCount | integer | Gets or sets the item count. |


**200 字段说明（ItemCounts）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MovieCount | integer | Gets or sets the movie count. |
| SeriesCount | integer | Gets or sets the series count. |
| EpisodeCount | integer | Gets or sets the episode count. |
| ArtistCount | integer | Gets or sets the artist count. |
| ProgramCount | integer | Gets or sets the program count. |
| TrailerCount | integer | Gets or sets the trailer count. |
| SongCount | integer | Gets or sets the song count. |
| AlbumCount | integer | Gets or sets the album count. |
| MusicVideoCount | integer | Gets or sets the music video count. |
| BoxSetCount | integer | Gets or sets the box set count. |
| BookCount | integer | Gets or sets the book count. |
| ItemCount | integer | Gets or sets the item count. |


---

## GetLatestMedia

### 基本信息
**Path：** GET 服务器地址 + /Items/Latest

**Method：** GET

**接口描述：** Gets latest media.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| parentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| includeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. |
| isPlayed | 否 | boolean |  | Filter by items that are played, or not. |
| enableImages | 否 | boolean |  | Optional. include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. the max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| enableUserData | 否 | boolean |  | Optional. include user data. |
| limit | 否 | integer | 20 | Return item limit. |
| groupItems | 否 | boolean | true | Whether or not to group items into a parent container. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Latest media returned. | BaseItemDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetRootFolder

### 基本信息
**Path：** GET 服务器地址 + /Items/Root

**Method：** GET

**接口描述：** Gets the root folder from a user's library.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Root folder returned. | BaseItemDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| Id | string | Gets or sets the id. |
| Etag | string|null | Gets or sets the etag. |
| SourceType | string|null | Gets or sets the type of the source. |
| PlaylistItemId | string|null | Gets or sets the playlist item identifier. |
| DateCreated | string|null | Gets or sets the date created. |
| DateLastMediaAdded | string|null |  |
| ExtraType | string enum(Unknown|Clip|Trailer|BehindTheScenes|DeletedScene|Interview|Scene|Sample|ThemeSong|ThemeVideo|Featurette|Short) |  |
| AirsBeforeSeasonNumber | integer|null |  |
| AirsAfterSeasonNumber | integer|null |  |
| AirsBeforeEpisodeNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| HasLyrics | boolean|null |  |
| HasSubtitles | boolean|null |  |
| PreferredMetadataLanguage | string|null |  |
| PreferredMetadataCountryCode | string|null |  |
| Container | string|null |  |
| SortName | string|null | Gets or sets the name of the sort. |
| ForcedSortName | string|null |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) | Gets or sets the video3 D format. |
| PremiereDate | string|null | Gets or sets the premiere date. |
| ExternalUrls | ExternalUrl[] | Gets or sets the external urls. |
| MediaSources | MediaSourceInfo[] | Gets or sets the media versions. |
| CriticRating | number|null | Gets or sets the critic rating. |
| ProductionLocations | string[] |  |
| Path | string|null | Gets or sets the path. |
| EnableMediaSourceDisplay | boolean|null |  |
| OfficialRating | string|null | Gets or sets the official rating. |
| CustomRating | string|null | Gets or sets the custom rating. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null |  |
| Overview | string|null | Gets or sets the overview. |
| Taglines | string[] | Gets or sets the taglines. |
| Genres | string[] | Gets or sets the genres. |
| CommunityRating | number|null | Gets or sets the community rating. |
| CumulativeRunTimeTicks | integer|null | Gets or sets the cumulative run time ticks. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| PlayAccess | string enum(Full|None) | Gets or sets the play access. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| ProductionYear | integer|null | Gets or sets the production year. |
| IsPlaceHolder | boolean|null | Gets or sets a value indicating whether this instance is place holder. |
| Number | string|null | Gets or sets the number. |
| ChannelNumber | string|null |  |
| IndexNumber | integer|null | Gets or sets the index number. |
| IndexNumberEnd | integer|null | Gets or sets the index number end. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| RemoteTrailers | MediaUrl[] | Gets or sets the trailer urls. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| IsHD | boolean|null | Gets or sets a value indicating whether this instance is HD. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| ParentId | string|null | Gets or sets the parent id. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| People | BaseItemPerson[] | Gets or sets the people. |
| Studios | NameGuidPair[] | Gets or sets the studios. |
| GenreItems | NameGuidPair[] |  |
| ParentLogoItemId | string|null | Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one. |
| ParentBackdropItemId | string|null | Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| LocalTrailerCount | integer|null | Gets or sets the local trailer count. |
| UserData | UserItemDataDto | Gets or sets the user data for this item based on the user it's being requested for. |
| RecursiveItemCount | integer|null | Gets or sets the recursive item count. |
| ChildCount | integer|null | Gets or sets the child count. |
| SeriesName | string|null | Gets or sets the name of the series. |
| SeriesId | string|null | Gets or sets the series id. |
| SeasonId | string|null | Gets or sets the season identifier. |
| SpecialFeatureCount | integer|null | Gets or sets the special feature count. |
| DisplayPreferencesId | string|null | Gets or sets the display preferences id. |
| Status | string|null | Gets or sets the status. |
| AirTime | string|null | Gets or sets the air time. |
| AirDays | DayOfWeek[] | Gets or sets the air days. |
| Tags | string[] | Gets or sets the tags. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio, after image enhancements. |
| Artists | string[] | Gets or sets the artists. |
| ArtistItems | NameGuidPair[] | Gets or sets the artist items. |
| Album | string|null | Gets or sets the album. |
| CollectionType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the type of the collection. |
| DisplayOrder | string|null | Gets or sets the display order. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumPrimaryImageTag | string|null | Gets or sets the album image tag. |
| SeriesPrimaryImageTag | string|null | Gets or sets the series primary image tag. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| AlbumArtists | NameGuidPair[] | Gets or sets the album artists. |
| SeasonName | string|null | Gets or sets the name of the season. |
| MediaStreams | MediaStream[] | Gets or sets the media streams. |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) | Gets or sets the type of the video. |
| PartCount | integer|null | Gets or sets the part count. |
| MediaSourceCount | integer|null |  |
| ImageTags | object|null | Gets or sets the image tags. |
| BackdropImageTags | string[] | Gets or sets the backdrop image tags. |
| ScreenshotImageTags | string[] | Gets or sets the screenshot image tags. |
| ParentLogoImageTag | string|null | Gets or sets the parent logo image tag. |
| ParentArtItemId | string|null | Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one. |
| ParentArtImageTag | string|null | Gets or sets the parent art image tag. |
| SeriesThumbImageTag | string|null | Gets or sets the series thumb image tag. |
| ImageBlurHashes | object|null | Gets or sets the blurhashes for the image tags.
Maps image type to dictionary mapping image tag to blurhash value. |
| SeriesStudio | string|null | Gets or sets the series studio. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |
| Chapters | ChapterInfo[] | Gets or sets the chapters. |
| Trickplay | object|null | Gets or sets the trickplay manifest. |
| LocationType | string enum(FileSystem|Remote|Virtual|Offline) | Gets or sets the type of the location. |
| IsoType | string enum(Dvd|BluRay) | Gets or sets the type of the iso. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| EndDate | string|null | Gets or sets the end date. |
| LockedFields | MetadataField[] | Gets or sets the locked fields. |
| TrailerCount | integer|null | Gets or sets the trailer count. |
| MovieCount | integer|null | Gets or sets the movie count. |
| SeriesCount | integer|null | Gets or sets the series count. |
| ProgramCount | integer|null |  |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| SongCount | integer|null | Gets or sets the song count. |
| AlbumCount | integer|null | Gets or sets the album count. |
| ArtistCount | integer|null |  |
| MusicVideoCount | integer|null | Gets or sets the music video count. |
| LockData | boolean|null | Gets or sets a value indicating whether [enable internet providers]. |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string|null |  |
| CameraModel | string|null |  |
| Software | string|null |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | string enum(TopLeft|TopRight|BottomRight|BottomLeft|LeftTop|RightTop|RightBottom|LeftBottom) |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ProgramId | string|null | Gets or sets the program identifier. |
| ChannelPrimaryImageTag | string|null | Gets or sets the channel primary image tag. |
| StartDate | string|null | Gets or sets the start date of the recording, in UTC. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| IsRepeat | boolean|null | Gets or sets a value indicating whether this instance is repeat. |
| EpisodeTitle | string|null | Gets or sets the episode title. |
| ChannelType | string enum(TV|Radio) | Gets or sets the type of the channel. |
| Audio | string enum(Mono|Stereo|Dolby|DolbyDigital|Thx|Atmos) | Gets or sets the audio. |
| IsMovie | boolean|null | Gets or sets a value indicating whether this instance is movie. |
| IsSports | boolean|null | Gets or sets a value indicating whether this instance is sports. |
| IsSeries | boolean|null | Gets or sets a value indicating whether this instance is series. |
| IsLive | boolean|null | Gets or sets a value indicating whether this instance is live. |
| IsNews | boolean|null | Gets or sets a value indicating whether this instance is news. |
| IsKids | boolean|null | Gets or sets a value indicating whether this instance is kids. |
| IsPremiere | boolean|null | Gets or sets a value indicating whether this instance is premiere. |
| TimerId | string|null | Gets or sets the timer identifier. |
| NormalizationGain | number|null | Gets or sets the gain required for audio normalization. |
| AlbumNormalizationGain | number|null | Gets or sets the gain required for audio normalization. This field is inherited from music album normalization gain. |
| CurrentProgram | BaseItemDto | Gets or sets the current program. |
| OriginalLanguage | string|null |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| Id | string | Gets or sets the id. |
| Etag | string|null | Gets or sets the etag. |
| SourceType | string|null | Gets or sets the type of the source. |
| PlaylistItemId | string|null | Gets or sets the playlist item identifier. |
| DateCreated | string|null | Gets or sets the date created. |
| DateLastMediaAdded | string|null |  |
| ExtraType | string enum(Unknown|Clip|Trailer|BehindTheScenes|DeletedScene|Interview|Scene|Sample|ThemeSong|ThemeVideo|Featurette|Short) |  |
| AirsBeforeSeasonNumber | integer|null |  |
| AirsAfterSeasonNumber | integer|null |  |
| AirsBeforeEpisodeNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| HasLyrics | boolean|null |  |
| HasSubtitles | boolean|null |  |
| PreferredMetadataLanguage | string|null |  |
| PreferredMetadataCountryCode | string|null |  |
| Container | string|null |  |
| SortName | string|null | Gets or sets the name of the sort. |
| ForcedSortName | string|null |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) | Gets or sets the video3 D format. |
| PremiereDate | string|null | Gets or sets the premiere date. |
| ExternalUrls | ExternalUrl[] | Gets or sets the external urls. |
| MediaSources | MediaSourceInfo[] | Gets or sets the media versions. |
| CriticRating | number|null | Gets or sets the critic rating. |
| ProductionLocations | string[] |  |
| Path | string|null | Gets or sets the path. |
| EnableMediaSourceDisplay | boolean|null |  |
| OfficialRating | string|null | Gets or sets the official rating. |
| CustomRating | string|null | Gets or sets the custom rating. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null |  |
| Overview | string|null | Gets or sets the overview. |
| Taglines | string[] | Gets or sets the taglines. |
| Genres | string[] | Gets or sets the genres. |
| CommunityRating | number|null | Gets or sets the community rating. |
| CumulativeRunTimeTicks | integer|null | Gets or sets the cumulative run time ticks. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| PlayAccess | string enum(Full|None) | Gets or sets the play access. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| ProductionYear | integer|null | Gets or sets the production year. |
| IsPlaceHolder | boolean|null | Gets or sets a value indicating whether this instance is place holder. |
| Number | string|null | Gets or sets the number. |
| ChannelNumber | string|null |  |
| IndexNumber | integer|null | Gets or sets the index number. |
| IndexNumberEnd | integer|null | Gets or sets the index number end. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| RemoteTrailers | MediaUrl[] | Gets or sets the trailer urls. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| IsHD | boolean|null | Gets or sets a value indicating whether this instance is HD. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| ParentId | string|null | Gets or sets the parent id. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| People | BaseItemPerson[] | Gets or sets the people. |
| Studios | NameGuidPair[] | Gets or sets the studios. |
| GenreItems | NameGuidPair[] |  |
| ParentLogoItemId | string|null | Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one. |
| ParentBackdropItemId | string|null | Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| LocalTrailerCount | integer|null | Gets or sets the local trailer count. |
| UserData | UserItemDataDto | Gets or sets the user data for this item based on the user it's being requested for. |
| RecursiveItemCount | integer|null | Gets or sets the recursive item count. |
| ChildCount | integer|null | Gets or sets the child count. |
| SeriesName | string|null | Gets or sets the name of the series. |
| SeriesId | string|null | Gets or sets the series id. |
| SeasonId | string|null | Gets or sets the season identifier. |
| SpecialFeatureCount | integer|null | Gets or sets the special feature count. |
| DisplayPreferencesId | string|null | Gets or sets the display preferences id. |
| Status | string|null | Gets or sets the status. |
| AirTime | string|null | Gets or sets the air time. |
| AirDays | DayOfWeek[] | Gets or sets the air days. |
| Tags | string[] | Gets or sets the tags. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio, after image enhancements. |
| Artists | string[] | Gets or sets the artists. |
| ArtistItems | NameGuidPair[] | Gets or sets the artist items. |
| Album | string|null | Gets or sets the album. |
| CollectionType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the type of the collection. |
| DisplayOrder | string|null | Gets or sets the display order. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumPrimaryImageTag | string|null | Gets or sets the album image tag. |
| SeriesPrimaryImageTag | string|null | Gets or sets the series primary image tag. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| AlbumArtists | NameGuidPair[] | Gets or sets the album artists. |
| SeasonName | string|null | Gets or sets the name of the season. |
| MediaStreams | MediaStream[] | Gets or sets the media streams. |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) | Gets or sets the type of the video. |
| PartCount | integer|null | Gets or sets the part count. |
| MediaSourceCount | integer|null |  |
| ImageTags | object|null | Gets or sets the image tags. |
| BackdropImageTags | string[] | Gets or sets the backdrop image tags. |
| ScreenshotImageTags | string[] | Gets or sets the screenshot image tags. |
| ParentLogoImageTag | string|null | Gets or sets the parent logo image tag. |
| ParentArtItemId | string|null | Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one. |
| ParentArtImageTag | string|null | Gets or sets the parent art image tag. |
| SeriesThumbImageTag | string|null | Gets or sets the series thumb image tag. |
| ImageBlurHashes | object|null | Gets or sets the blurhashes for the image tags.
Maps image type to dictionary mapping image tag to blurhash value. |
| SeriesStudio | string|null | Gets or sets the series studio. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |
| Chapters | ChapterInfo[] | Gets or sets the chapters. |
| Trickplay | object|null | Gets or sets the trickplay manifest. |
| LocationType | string enum(FileSystem|Remote|Virtual|Offline) | Gets or sets the type of the location. |
| IsoType | string enum(Dvd|BluRay) | Gets or sets the type of the iso. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| EndDate | string|null | Gets or sets the end date. |
| LockedFields | MetadataField[] | Gets or sets the locked fields. |
| TrailerCount | integer|null | Gets or sets the trailer count. |
| MovieCount | integer|null | Gets or sets the movie count. |
| SeriesCount | integer|null | Gets or sets the series count. |
| ProgramCount | integer|null |  |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| SongCount | integer|null | Gets or sets the song count. |
| AlbumCount | integer|null | Gets or sets the album count. |
| ArtistCount | integer|null |  |
| MusicVideoCount | integer|null | Gets or sets the music video count. |
| LockData | boolean|null | Gets or sets a value indicating whether [enable internet providers]. |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string|null |  |
| CameraModel | string|null |  |
| Software | string|null |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | string enum(TopLeft|TopRight|BottomRight|BottomLeft|LeftTop|RightTop|RightBottom|LeftBottom) |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ProgramId | string|null | Gets or sets the program identifier. |
| ChannelPrimaryImageTag | string|null | Gets or sets the channel primary image tag. |
| StartDate | string|null | Gets or sets the start date of the recording, in UTC. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| IsRepeat | boolean|null | Gets or sets a value indicating whether this instance is repeat. |
| EpisodeTitle | string|null | Gets or sets the episode title. |
| ChannelType | string enum(TV|Radio) | Gets or sets the type of the channel. |
| Audio | string enum(Mono|Stereo|Dolby|DolbyDigital|Thx|Atmos) | Gets or sets the audio. |
| IsMovie | boolean|null | Gets or sets a value indicating whether this instance is movie. |
| IsSports | boolean|null | Gets or sets a value indicating whether this instance is sports. |
| IsSeries | boolean|null | Gets or sets a value indicating whether this instance is series. |
| IsLive | boolean|null | Gets or sets a value indicating whether this instance is live. |
| IsNews | boolean|null | Gets or sets a value indicating whether this instance is news. |
| IsKids | boolean|null | Gets or sets a value indicating whether this instance is kids. |
| IsPremiere | boolean|null | Gets or sets a value indicating whether this instance is premiere. |
| TimerId | string|null | Gets or sets the timer identifier. |
| NormalizationGain | number|null | Gets or sets the gain required for audio normalization. |
| AlbumNormalizationGain | number|null | Gets or sets the gain required for audio normalization. This field is inherited from music album normalization gain. |
| CurrentProgram | BaseItemDto | Gets or sets the current program. |
| OriginalLanguage | string|null |  |


**200 字段说明（BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| Id | string | Gets or sets the id. |
| Etag | string|null | Gets or sets the etag. |
| SourceType | string|null | Gets or sets the type of the source. |
| PlaylistItemId | string|null | Gets or sets the playlist item identifier. |
| DateCreated | string|null | Gets or sets the date created. |
| DateLastMediaAdded | string|null |  |
| ExtraType | string enum(Unknown|Clip|Trailer|BehindTheScenes|DeletedScene|Interview|Scene|Sample|ThemeSong|ThemeVideo|Featurette|Short) |  |
| AirsBeforeSeasonNumber | integer|null |  |
| AirsAfterSeasonNumber | integer|null |  |
| AirsBeforeEpisodeNumber | integer|null |  |
| CanDelete | boolean|null |  |
| CanDownload | boolean|null |  |
| HasLyrics | boolean|null |  |
| HasSubtitles | boolean|null |  |
| PreferredMetadataLanguage | string|null |  |
| PreferredMetadataCountryCode | string|null |  |
| Container | string|null |  |
| SortName | string|null | Gets or sets the name of the sort. |
| ForcedSortName | string|null |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) | Gets or sets the video3 D format. |
| PremiereDate | string|null | Gets or sets the premiere date. |
| ExternalUrls | ExternalUrl[] | Gets or sets the external urls. |
| MediaSources | MediaSourceInfo[] | Gets or sets the media versions. |
| CriticRating | number|null | Gets or sets the critic rating. |
| ProductionLocations | string[] |  |
| Path | string|null | Gets or sets the path. |
| EnableMediaSourceDisplay | boolean|null |  |
| OfficialRating | string|null | Gets or sets the official rating. |
| CustomRating | string|null | Gets or sets the custom rating. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null |  |
| Overview | string|null | Gets or sets the overview. |
| Taglines | string[] | Gets or sets the taglines. |
| Genres | string[] | Gets or sets the genres. |
| CommunityRating | number|null | Gets or sets the community rating. |
| CumulativeRunTimeTicks | integer|null | Gets or sets the cumulative run time ticks. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| PlayAccess | string enum(Full|None) | Gets or sets the play access. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| ProductionYear | integer|null | Gets or sets the production year. |
| IsPlaceHolder | boolean|null | Gets or sets a value indicating whether this instance is place holder. |
| Number | string|null | Gets or sets the number. |
| ChannelNumber | string|null |  |
| IndexNumber | integer|null | Gets or sets the index number. |
| IndexNumberEnd | integer|null | Gets or sets the index number end. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| RemoteTrailers | MediaUrl[] | Gets or sets the trailer urls. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| IsHD | boolean|null | Gets or sets a value indicating whether this instance is HD. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| ParentId | string|null | Gets or sets the parent id. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| People | BaseItemPerson[] | Gets or sets the people. |
| Studios | NameGuidPair[] | Gets or sets the studios. |
| GenreItems | NameGuidPair[] |  |
| ParentLogoItemId | string|null | Gets or sets whether the item has a logo, this will hold the Id of the Parent that has one. |
| ParentBackdropItemId | string|null | Gets or sets whether the item has any backdrops, this will hold the Id of the Parent that has one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| LocalTrailerCount | integer|null | Gets or sets the local trailer count. |
| UserData | UserItemDataDto | Gets or sets the user data for this item based on the user it's being requested for. |
| RecursiveItemCount | integer|null | Gets or sets the recursive item count. |
| ChildCount | integer|null | Gets or sets the child count. |
| SeriesName | string|null | Gets or sets the name of the series. |
| SeriesId | string|null | Gets or sets the series id. |
| SeasonId | string|null | Gets or sets the season identifier. |
| SpecialFeatureCount | integer|null | Gets or sets the special feature count. |
| DisplayPreferencesId | string|null | Gets or sets the display preferences id. |
| Status | string|null | Gets or sets the status. |
| AirTime | string|null | Gets or sets the air time. |
| AirDays | DayOfWeek[] | Gets or sets the air days. |
| Tags | string[] | Gets or sets the tags. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio, after image enhancements. |
| Artists | string[] | Gets or sets the artists. |
| ArtistItems | NameGuidPair[] | Gets or sets the artist items. |
| Album | string|null | Gets or sets the album. |
| CollectionType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the type of the collection. |
| DisplayOrder | string|null | Gets or sets the display order. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumPrimaryImageTag | string|null | Gets or sets the album image tag. |
| SeriesPrimaryImageTag | string|null | Gets or sets the series primary image tag. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| AlbumArtists | NameGuidPair[] | Gets or sets the album artists. |
| SeasonName | string|null | Gets or sets the name of the season. |
| MediaStreams | MediaStream[] | Gets or sets the media streams. |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) | Gets or sets the type of the video. |
| PartCount | integer|null | Gets or sets the part count. |
| MediaSourceCount | integer|null |  |
| ImageTags | object|null | Gets or sets the image tags. |
| BackdropImageTags | string[] | Gets or sets the backdrop image tags. |
| ScreenshotImageTags | string[] | Gets or sets the screenshot image tags. |
| ParentLogoImageTag | string|null | Gets or sets the parent logo image tag. |
| ParentArtItemId | string|null | Gets or sets whether the item has fan art, this will hold the Id of the Parent that has one. |
| ParentArtImageTag | string|null | Gets or sets the parent art image tag. |
| SeriesThumbImageTag | string|null | Gets or sets the series thumb image tag. |
| ImageBlurHashes | object|null | Gets or sets the blurhashes for the image tags.
Maps image type to dictionary mapping image tag to blurhash value. |
| SeriesStudio | string|null | Gets or sets the series studio. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |
| Chapters | ChapterInfo[] | Gets or sets the chapters. |
| Trickplay | object|null | Gets or sets the trickplay manifest. |
| LocationType | string enum(FileSystem|Remote|Virtual|Offline) | Gets or sets the type of the location. |
| IsoType | string enum(Dvd|BluRay) | Gets or sets the type of the iso. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| EndDate | string|null | Gets or sets the end date. |
| LockedFields | MetadataField[] | Gets or sets the locked fields. |
| TrailerCount | integer|null | Gets or sets the trailer count. |
| MovieCount | integer|null | Gets or sets the movie count. |
| SeriesCount | integer|null | Gets or sets the series count. |
| ProgramCount | integer|null |  |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| SongCount | integer|null | Gets or sets the song count. |
| AlbumCount | integer|null | Gets or sets the album count. |
| ArtistCount | integer|null |  |
| MusicVideoCount | integer|null | Gets or sets the music video count. |
| LockData | boolean|null | Gets or sets a value indicating whether [enable internet providers]. |
| Width | integer|null |  |
| Height | integer|null |  |
| CameraMake | string|null |  |
| CameraModel | string|null |  |
| Software | string|null |  |
| ExposureTime | number|null |  |
| FocalLength | number|null |  |
| ImageOrientation | string enum(TopLeft|TopRight|BottomRight|BottomLeft|LeftTop|RightTop|RightBottom|LeftBottom) |  |
| Aperture | number|null |  |
| ShutterSpeed | number|null |  |
| Latitude | number|null |  |
| Longitude | number|null |  |
| Altitude | number|null |  |
| IsoSpeedRating | integer|null |  |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ProgramId | string|null | Gets or sets the program identifier. |
| ChannelPrimaryImageTag | string|null | Gets or sets the channel primary image tag. |
| StartDate | string|null | Gets or sets the start date of the recording, in UTC. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| IsRepeat | boolean|null | Gets or sets a value indicating whether this instance is repeat. |
| EpisodeTitle | string|null | Gets or sets the episode title. |
| ChannelType | string enum(TV|Radio) | Gets or sets the type of the channel. |
| Audio | string enum(Mono|Stereo|Dolby|DolbyDigital|Thx|Atmos) | Gets or sets the audio. |
| IsMovie | boolean|null | Gets or sets a value indicating whether this instance is movie. |
| IsSports | boolean|null | Gets or sets a value indicating whether this instance is sports. |
| IsSeries | boolean|null | Gets or sets a value indicating whether this instance is series. |
| IsLive | boolean|null | Gets or sets a value indicating whether this instance is live. |
| IsNews | boolean|null | Gets or sets a value indicating whether this instance is news. |
| IsKids | boolean|null | Gets or sets a value indicating whether this instance is kids. |
| IsPremiere | boolean|null | Gets or sets a value indicating whether this instance is premiere. |
| TimerId | string|null | Gets or sets the timer identifier. |
| NormalizationGain | number|null | Gets or sets the gain required for audio normalization. |
| AlbumNormalizationGain | number|null | Gets or sets the gain required for audio normalization. This field is inherited from music album normalization gain. |
| CurrentProgram | BaseItemDto | Gets or sets the current program. |
| OriginalLanguage | string|null |  |


---

## GetLibraryOptionsInfo

### 基本信息
**Path：** GET 服务器地址 + /Libraries/AvailableOptions

**Method：** GET

**接口描述：** Gets the library options info.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| libraryContentType | 否 | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) |  | Library content type. |
| isNewLibrary | 否 | boolean | false | Whether this is a new library. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Library options info returned. | LibraryOptionsResultDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LibraryOptionsResultDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MetadataSavers | LibraryOptionInfoDto[] | Gets or sets the metadata savers. |
| MetadataReaders | LibraryOptionInfoDto[] | Gets or sets the metadata readers. |
| SubtitleFetchers | LibraryOptionInfoDto[] | Gets or sets the subtitle fetchers. |
| LyricFetchers | LibraryOptionInfoDto[] | Gets or sets the list of lyric fetchers. |
| MediaSegmentProviders | LibraryOptionInfoDto[] | Gets or sets the list of MediaSegment Providers. |
| TypeOptions | LibraryTypeOptionsDto[] | Gets or sets the type options. |


**200 字段说明（LibraryOptionsResultDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MetadataSavers | LibraryOptionInfoDto[] | Gets or sets the metadata savers. |
| MetadataReaders | LibraryOptionInfoDto[] | Gets or sets the metadata readers. |
| SubtitleFetchers | LibraryOptionInfoDto[] | Gets or sets the subtitle fetchers. |
| LyricFetchers | LibraryOptionInfoDto[] | Gets or sets the list of lyric fetchers. |
| MediaSegmentProviders | LibraryOptionInfoDto[] | Gets or sets the list of MediaSegment Providers. |
| TypeOptions | LibraryTypeOptionsDto[] | Gets or sets the type options. |


**200 字段说明（LibraryOptionsResultDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MetadataSavers | LibraryOptionInfoDto[] | Gets or sets the metadata savers. |
| MetadataReaders | LibraryOptionInfoDto[] | Gets or sets the metadata readers. |
| SubtitleFetchers | LibraryOptionInfoDto[] | Gets or sets the subtitle fetchers. |
| LyricFetchers | LibraryOptionInfoDto[] | Gets or sets the list of lyric fetchers. |
| MediaSegmentProviders | LibraryOptionInfoDto[] | Gets or sets the list of MediaSegment Providers. |
| TypeOptions | LibraryTypeOptionsDto[] | Gets or sets the type options. |


---

## PostUpdatedMedia

### 基本信息
**Path：** POST 服务器地址 + /Library/Media/Updated

**Method：** POST

**接口描述：** Reports that new movies have been added by an external source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The update paths.
- Content-Type：`application/json`
- Schema：`MediaUpdateInfoDto`
- Content-Type：`text/json`
- Schema：`MediaUpdateInfoDto`
- Content-Type：`application/*+json`
- Schema：`MediaUpdateInfoDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Report success. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMediaFolders

### 基本信息
**Path：** GET 服务器地址 + /Library/MediaFolders

**Method：** GET

**接口描述：** Gets all user media folders.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| isHidden | 否 | boolean |  | Optional. Filter by folders that are marked hidden, or not. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Media folders returned. | BaseItemDtoQueryResult |
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

## PostAddedMovies

### 基本信息
**Path：** POST 服务器地址 + /Library/Movies/Added

**Method：** POST

**接口描述：** Reports that new movies have been added by an external source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tmdbId | 否 | string |  | The tmdbId. |
| imdbId | 否 | string |  | The imdbId. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Report success. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostUpdatedMovies

### 基本信息
**Path：** POST 服务器地址 + /Library/Movies/Updated

**Method：** POST

**接口描述：** Reports that new movies have been added by an external source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tmdbId | 否 | string |  | The tmdbId. |
| imdbId | 否 | string |  | The imdbId. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Report success. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPhysicalPaths

### 基本信息
**Path：** GET 服务器地址 + /Library/PhysicalPaths

**Method：** GET

**接口描述：** Gets a list of physical paths from virtual folders.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Physical paths returned. | string[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RefreshLibrary

### 基本信息
**Path：** POST 服务器地址 + /Library/Refresh

**Method：** POST

**接口描述：** Starts a library scan.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Library scan started. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostAddedSeries

### 基本信息
**Path：** POST 服务器地址 + /Library/Series/Added

**Method：** POST

**接口描述：** Reports that new episodes of a series have been added by an external source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tvdbId | 否 | string |  | The tvdbId. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Report success. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostUpdatedSeries

### 基本信息
**Path：** POST 服务器地址 + /Library/Series/Updated

**Method：** POST

**接口描述：** Reports that new episodes of a series have been added by an external source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tvdbId | 否 | string |  | The tvdbId. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Report success. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSimilarMovies

### 基本信息
**Path：** GET 服务器地址 + /Movies/{itemId}/Similar

**Method：** GET

**接口描述：** Gets similar items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| excludeArtistIds | 否 | string[] |  | Exclude artist ids. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Similar items returned. | BaseItemDtoQueryResult |
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

## GetSimilarShows

### 基本信息
**Path：** GET 服务器地址 + /Shows/{itemId}/Similar

**Method：** GET

**接口描述：** Gets similar items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| excludeArtistIds | 否 | string[] |  | Exclude artist ids. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Similar items returned. | BaseItemDtoQueryResult |
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

## GetSimilarTrailers

### 基本信息
**Path：** GET 服务器地址 + /Trailers/{itemId}/Similar

**Method：** GET

**接口描述：** Gets similar items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| excludeArtistIds | 否 | string[] |  | Exclude artist ids. |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Similar items returned. | BaseItemDtoQueryResult |
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

## GetResumeItems

### 基本信息
**Path：** GET 服务器地址 + /UserItems/Resume

**Method：** GET

**接口描述：** Gets items based on a query.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |
| startIndex | 否 | integer |  | The start index. |
| limit | 否 | integer |  | The item limit. |
| searchTerm | 否 | string |  | The search term. |
| parentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines. |
| mediaTypes | 否 | MediaType[] |  | Optional. Filter by MediaType. Allows multiple, comma delimited. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| excludeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimited. |
| includeItemTypes | 否 | BaseItemKind[] |  | Optional. If specified, results will be filtered based on the item type. This allows multiple, comma delimited. |
| enableTotalRecordCount | 否 | boolean | true | Optional. Enable the total record count. |
| enableImages | 否 | boolean | true | Optional. Include image information in output. |
| excludeActiveSessions | 否 | boolean | false | Optional. Whether to exclude the currently active sessions. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Items returned. | BaseItemDtoQueryResult |
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

