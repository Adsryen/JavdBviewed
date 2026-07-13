# 媒体库浏览（LibraryService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：31

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Albums/{Id}/Similar` | getAlbumsByIdSimilar | Finds albums similar to a given album. |
| GET | `/Artists/{Id}/Similar` | getArtistsByIdSimilar | Finds albums similar to a given album. |
| GET | `/Games/{Id}/Similar` | getGamesByIdSimilar | Finds games similar to a given game. |
| DELETE | `/Items` | deleteItems | Deletes an item from the library and file system |
| DELETE | `/Items/{Id}` | deleteItemsById | Deletes an item from the library and file system |
| GET | `/Items/{Id}/Ancestors` | getItemsByIdAncestors | Gets all parents of an item |
| GET | `/Items/{Id}/CriticReviews` | getItemsByIdCriticreviews | Gets critic reviews for an item |
| POST | `/Items/{Id}/Delete` | postItemsByIdDelete | Deletes an item from the library and file system |
| GET | `/Items/{Id}/DeleteInfo` | getItemsByIdDeleteinfo | Gets delete info for an item |
| GET | `/Items/{Id}/Download` | getItemsByIdDownload | Downloads item media |
| GET | `/Items/{Id}/File` | getItemsByIdFile | Gets the original file of an item |
| GET | `/Items/{Id}/Similar` | getItemsByIdSimilar | Gets similar items |
| GET | `/Items/{Id}/ThemeMedia` | getItemsByIdThememedia | Gets theme videos and songs for an item |
| GET | `/Items/{Id}/ThemeSongs` | getItemsByIdThemesongs | Gets theme songs for an item |
| GET | `/Items/{Id}/ThemeVideos` | getItemsByIdThemevideos | Gets theme videos for an item |
| GET | `/Items/Counts` | getItemsCounts |  |
| POST | `/Items/Delete` | postItemsDelete | Deletes an item from the library and file system |
| GET | `/Items/Intros` | getItemsIntros | Gets info to debug intros |
| GET | `/Libraries/AvailableOptions` | getLibrariesAvailableoptions |  |
| POST | `/Library/Media/Updated` | postLibraryMediaUpdated | Reports that new movies have been added by an external source |
| GET | `/Library/MediaFolders` | getLibraryMediafolders | Gets all user media folders. |
| POST | `/Library/Movies/Added` | postLibraryMoviesAdded | Deprecated. Use /Library/Media/Updated |
| POST | `/Library/Movies/Updated` | postLibraryMoviesUpdated | Deprecated. Use /Library/Media/Updated |
| GET | `/Library/PhysicalPaths` | getLibraryPhysicalpaths | Gets a list of physical paths from virtual folders |
| POST | `/Library/Refresh` | postLibraryRefresh | Starts a library scan |
| GET | `/Library/SelectableMediaFolders` | getLibrarySelectablemediafolders | Gets all user media folders. |
| POST | `/Library/Series/Added` | postLibrarySeriesAdded | Deprecated. Use /Library/Media/Updated |
| POST | `/Library/Series/Updated` | postLibrarySeriesUpdated | Deprecated. Use /Library/Media/Updated |
| GET | `/Movies/{Id}/Similar` | getMoviesByIdSimilar | Finds movies and trailers similar to a given movie. |
| GET | `/Shows/{Id}/Similar` | getShowsByIdSimilar | Finds tv shows similar to a given one. |
| GET | `/Trailers/{Id}/Similar` | getTrailersByIdSimilar | Finds movies and trailers similar to a given trailer. |

---

## getAlbumsByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Albums/{Id}/Similar

**Method：** GET

**接口描述：** Finds albums similar to a given album.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getArtistsByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Artists/{Id}/Similar

**Method：** GET

**接口描述：** Finds albums similar to a given album.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getGamesByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Games/{Id}/Similar

**Method：** GET

**接口描述：** Finds games similar to a given game.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## deleteItems

### 基本信息
**Path：** DELETE 服务器地址 + /Items

**Method：** DELETE

**接口描述：** Deletes an item from the library and file system

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Ids | 是 | string |  | Ids |


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

## deleteItemsById

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{Id}

**Method：** DELETE

**接口描述：** Deletes an item from the library and file system

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getItemsByIdAncestors

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Ancestors

**Method：** GET

**接口描述：** Gets all parents of an item

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | Optional. Filter by user id, and attach user data |


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

## getItemsByIdCriticreviews

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/CriticReviews

**Method：** GET

**接口描述：** Gets critic reviews for an item

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartIndex | 否 | integer|null |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |


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

## postItemsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Delete

**Method：** POST

**接口描述：** Deletes an item from the library and file system

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getItemsByIdDeleteinfo

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/DeleteInfo

**Method：** GET

**接口描述：** Gets delete info for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DeleteInfo object. | Library.DeleteInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Library.DeleteInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Paths | string[] |  |


**200 字段说明（Library.DeleteInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Paths | string[] |  |


---

## getItemsByIdDownload

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Download

**Method：** GET

**接口描述：** Downloads item media

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getItemsByIdFile

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/File

**Method：** GET

**接口描述：** Gets the original file of an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getItemsByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Similar

**Method：** GET

**接口描述：** Gets similar items

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getItemsByIdThememedia

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/ThemeMedia

**Method：** GET

**接口描述：** Gets theme videos and songs for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| InheritFromParent | 否 | boolean |  | Determines whether or not parent items should be searched for theme media. |
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
| 200 | Operation successful. Returning a AllThemeMediaResult object. | AllThemeMediaResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（AllThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ThemeVideosResult | ThemeMediaResult |  |
| ThemeSongsResult | ThemeMediaResult |  |
| SoundtrackSongsResult | ThemeMediaResult |  |


**200 字段说明（AllThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ThemeVideosResult | ThemeMediaResult |  |
| ThemeSongsResult | ThemeMediaResult |  |
| SoundtrackSongsResult | ThemeMediaResult |  |


---

## getItemsByIdThemesongs

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/ThemeSongs

**Method：** GET

**接口描述：** Gets theme songs for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| InheritFromParent | 否 | boolean |  | Determines whether or not parent items should be searched for theme media. |
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
| 200 | Operation successful. Returning a ThemeMediaResult object. | ThemeMediaResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OwnerId | integer |  |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OwnerId | integer |  |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


---

## getItemsByIdThemevideos

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/ThemeVideos

**Method：** GET

**接口描述：** Gets theme videos for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| InheritFromParent | 否 | boolean |  | Determines whether or not parent items should be searched for theme media. |
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
| 200 | Operation successful. Returning a ThemeMediaResult object. | ThemeMediaResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OwnerId | integer |  |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（ThemeMediaResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| OwnerId | integer |  |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


---

## getItemsCounts

### 基本信息
**Path：** GET 服务器地址 + /Items/Counts

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 否 | string |  | Optional. Get counts from a specific user's library. |
| IsFavorite | 否 | boolean|null |  | Optional. Get counts of favorite items |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ItemCounts object. | ItemCounts |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（ItemCounts）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MovieCount | integer |  |
| SeriesCount | integer |  |
| EpisodeCount | integer |  |
| GameCount | integer |  |
| ArtistCount | integer |  |
| ProgramCount | integer |  |
| GameSystemCount | integer |  |
| TrailerCount | integer |  |
| SongCount | integer |  |
| AlbumCount | integer |  |
| MusicVideoCount | integer |  |
| BoxSetCount | integer |  |
| BookCount | integer |  |
| ItemCount | integer |  |


**200 字段说明（ItemCounts）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MovieCount | integer |  |
| SeriesCount | integer |  |
| EpisodeCount | integer |  |
| GameCount | integer |  |
| ArtistCount | integer |  |
| ProgramCount | integer |  |
| GameSystemCount | integer |  |
| TrailerCount | integer |  |
| SongCount | integer |  |
| AlbumCount | integer |  |
| MusicVideoCount | integer |  |
| BoxSetCount | integer |  |
| BookCount | integer |  |
| ItemCount | integer |  |


---

## postItemsDelete

### 基本信息
**Path：** POST 服务器地址 + /Items/Delete

**Method：** POST

**接口描述：** Deletes an item from the library and file system

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Ids | 是 | string |  | Ids |


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

## getItemsIntros

### 基本信息
**Path：** GET 服务器地址 + /Items/Intros

**Method：** GET

**接口描述：** Gets info to debug intros

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<IntroDebugInfo> object. | Persistence.IntroDebugInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLibrariesAvailableoptions

### 基本信息
**Path：** GET 服务器地址 + /Libraries/AvailableOptions

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a LibraryOptionsResult object. | LibraryOptionsResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LibraryOptionsResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MetadataSavers | LibraryOptionInfo[] |  |
| MetadataReaders | LibraryOptionInfo[] |  |
| SubtitleFetchers | LibraryOptionInfo[] |  |
| LyricsFetchers | LibraryOptionInfo[] |  |
| TypeOptions | LibraryTypeOptions[] |  |
| DefaultLibraryOptions | LibraryOptions |  |


**200 字段说明（LibraryOptionsResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MetadataSavers | LibraryOptionInfo[] |  |
| MetadataReaders | LibraryOptionInfo[] |  |
| SubtitleFetchers | LibraryOptionInfo[] |  |
| LyricsFetchers | LibraryOptionInfo[] |  |
| TypeOptions | LibraryTypeOptions[] |  |
| DefaultLibraryOptions | LibraryOptions |  |


---

## postLibraryMediaUpdated

### 基本信息
**Path：** POST 服务器地址 + /Library/Media/Updated

**Method：** POST

**接口描述：** Reports that new movies have been added by an external source

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：PostUpdatedMedia
- Content-Type：`application/json`
- Schema：`Library.PostUpdatedMedia`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Updates | Library.MediaUpdateInfo[] |  |

- Content-Type：`application/xml`
- Schema：`Library.PostUpdatedMedia`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Updates | Library.MediaUpdateInfo[] |  |



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

## getLibraryMediafolders

### 基本信息
**Path：** GET 服务器地址 + /Library/MediaFolders

**Method：** GET

**接口描述：** Gets all user media folders.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IsHidden | 否 | boolean|null |  | Optional. Filter by folders that are marked hidden, or not. |


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

## postLibraryMoviesAdded

### 基本信息
**Path：** POST 服务器地址 + /Library/Movies/Added

**Method：** POST

**接口描述：** Deprecated. Use /Library/Media/Updated

**认证要求：** 用户认证

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

## postLibraryMoviesUpdated

### 基本信息
**Path：** POST 服务器地址 + /Library/Movies/Updated

**Method：** POST

**接口描述：** Deprecated. Use /Library/Media/Updated

**认证要求：** 用户认证

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

## getLibraryPhysicalpaths

### 基本信息
**Path：** GET 服务器地址 + /Library/PhysicalPaths

**Method：** GET

**接口描述：** Gets a list of physical paths from virtual folders

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<String> object. | string[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postLibraryRefresh

### 基本信息
**Path：** POST 服务器地址 + /Library/Refresh

**Method：** POST

**接口描述：** Starts a library scan

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

## getLibrarySelectablemediafolders

### 基本信息
**Path：** GET 服务器地址 + /Library/SelectableMediaFolders

**Method：** GET

**接口描述：** Gets all user media folders.

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a MediaFolder[] object. | Library.MediaFolder[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postLibrarySeriesAdded

### 基本信息
**Path：** POST 服务器地址 + /Library/Series/Added

**Method：** POST

**接口描述：** Deprecated. Use /Library/Media/Updated

**认证要求：** 用户认证

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

## postLibrarySeriesUpdated

### 基本信息
**Path：** POST 服务器地址 + /Library/Series/Updated

**Method：** POST

**接口描述：** Deprecated. Use /Library/Media/Updated

**认证要求：** 用户认证

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

## getMoviesByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Movies/{Id}/Similar

**Method：** GET

**接口描述：** Finds movies and trailers similar to a given movie.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getShowsByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Shows/{Id}/Similar

**Method：** GET

**接口描述：** Finds tv shows similar to a given one.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getTrailersByIdSimilar

### 基本信息
**Path：** GET 服务器地址 + /Trailers/{Id}/Similar

**Method：** GET

**接口描述：** Finds movies and trailers similar to a given trailer.

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

