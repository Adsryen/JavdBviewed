# 预告片（Trailer）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：元数据与分类
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Trailers` | GetTrailers | Finds movies and trailers similar to a given trailer. |

---

## GetTrailers

### 基本信息
**Path：** GET 服务器地址 + /Trailers

**Method：** GET

**接口描述：** Finds movies and trailers similar to a given trailer.

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
| subtitleLanguages | 否 | string[] |  | Optional. If specified, results will be filtered based on subtitale language. This allows multiple, comma delimited values. |
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

