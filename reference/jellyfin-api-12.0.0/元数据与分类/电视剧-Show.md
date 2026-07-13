# 电视剧（Show）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：元数据与分类
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Shows/{seriesId}/Episodes` | GetEpisodes | Gets episodes for a tv season. |
| GET | `/Shows/{seriesId}/Seasons` | GetSeasons | Gets seasons for a tv series. |
| GET | `/Shows/NextUp` | GetNextUp | Gets a list of next up episodes. |
| GET | `/Shows/Upcoming` | GetUpcomingEpisodes | Gets a list of upcoming episodes. |

---

## GetEpisodes

### 基本信息
**Path：** GET 服务器地址 + /Shows/{seriesId}/Episodes

**Method：** GET

**接口描述：** Gets episodes for a tv season.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| seriesId | 是 | string |  | The series id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |
| season | 否 | integer |  | Optional filter by season number. |
| seasonId | 否 | string |  | Optional. Filter by season id. |
| isMissing | 否 | boolean |  | Optional. Filter by items that are missing episodes or not. |
| adjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| startItemId | 否 | string |  | Optional. Skip through the list until a given item is found. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| enableImages | 否 | boolean |  | Optional, include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional, the max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| sortBy | 否 | string enum(Default|AiredEpisodeOrder|Album|AlbumArtist|Artist|DateCreated|OfficialRating|DatePlayed|PremiereDate|StartDate|SortName|Name|Random|Runtime|CommunityRating|ProductionYear|PlayCount|CriticRating|IsFolder|IsUnplayed|IsPlayed|SeriesSortName|VideoBitRate|AirTime|Studio|IsFavoriteOrLiked|DateLastContentAdded|SeriesDatePlayed|ParentIndexNumber|IndexNumber) |  | Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
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

## GetSeasons

### 基本信息
**Path：** GET 服务器地址 + /Shows/{seriesId}/Seasons

**Method：** GET

**接口描述：** Gets seasons for a tv series.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| seriesId | 是 | string |  | The series id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimited. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls. |
| isSpecialSeason | 否 | boolean |  | Optional. Filter by special season. |
| isMissing | 否 | boolean |  | Optional. Filter by items that are missing episodes or not. |
| adjacentTo | 否 | string |  | Optional. Return items that are siblings of a supplied item. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
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

## GetNextUp

### 基本信息
**Path：** GET 服务器地址 + /Shows/NextUp

**Method：** GET

**接口描述：** Gets a list of next up episodes.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id of the user to get the next up episodes for. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| seriesId | 否 | string |  | Optional. Filter by series id. |
| parentId | 否 | string |  | Optional. Specify this to localize the search to a specific item or folder. Omit to use the root. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| nextUpDateCutoff | 否 | string |  | Optional. Starting date of shows to show in Next Up section. |
| enableTotalRecordCount | 否 | boolean | true | Whether to enable the total records count. Defaults to true. |
| enableResumable | 否 | boolean | true | Whether to include resumable episodes in next up results. |
| enableRewatching | 否 | boolean | false | Whether to include watched episodes in next up results. |


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

## GetUpcomingEpisodes

### 基本信息
**Path：** GET 服务器地址 + /Shows/Upcoming

**Method：** GET

**接口描述：** Gets a list of upcoming episodes.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id of the user to get the upcoming episodes for. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| parentId | 否 | string |  | Optional. Specify this to localize the search to a specific item or folder. Omit to use the root. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |


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

