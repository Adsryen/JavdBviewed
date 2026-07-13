# 类型标签（GenresService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：元数据与分类
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Genres` | getGenres | Gets all genres from a given item, folder, or the entire library |
| GET | `/Genres/{Name}` | getGenresByName | Gets a genre, by name |

---

## getGenres

### 基本信息
**Path：** GET 服务器地址 + /Genres

**Method：** GET

**接口描述：** Gets all genres from a given item, folder, or the entire library

**官方文档：** [API Documentation: Items by name](https://dev.emby.media/doc/restapi/Items-by-Name.html)

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

## getGenresByName

### 基本信息
**Path：** GET 服务器地址 + /Genres/{Name}

**Method：** GET

**接口描述：** Gets a genre, by name

**官方文档：** [API Documentation: Items by name](https://dev.emby.media/doc/restapi/Items-by-Name.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | The genre name |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | Optional. Filter by user id, and attach user data |


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

