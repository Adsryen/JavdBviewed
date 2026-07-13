# 频道（Channel）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：直播电视
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Channels` | GetChannels | Gets available channels. |
| GET | `/Channels/{channelId}/Features` | GetChannelFeatures | Get channel features. |
| GET | `/Channels/{channelId}/Items` | GetChannelItems | Get channel items. |
| GET | `/Channels/Features` | GetAllChannelFeatures | Get all channel features. |
| GET | `/Channels/Items/Latest` | GetLatestChannelItems | Gets latest channel items. |

---

## GetChannels

### 基本信息
**Path：** GET 服务器地址 + /Channels

**Method：** GET

**接口描述：** Gets available channels.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User Id to filter by. Use System.Guid.Empty to not filter by user. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| supportsLatestItems | 否 | boolean |  | Optional. Filter by channels that support getting latest items. |
| supportsMediaDeletion | 否 | boolean |  | Optional. Filter by channels that support media deletion. |
| isFavorite | 否 | boolean |  | Optional. Filter by channels that are favorite. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Channels returned. | BaseItemDtoQueryResult |
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

## GetChannelFeatures

### 基本信息
**Path：** GET 服务器地址 + /Channels/{channelId}/Features

**Method：** GET

**接口描述：** Get channel features.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| channelId | 是 | string |  | Channel id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Channel features returned. | ChannelFeatures |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ChannelFeatures）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name. |
| Id | string | Gets or sets the identifier. |
| CanSearch | boolean | Gets or sets a value indicating whether this instance can search. |
| MediaTypes | ChannelMediaType[] | Gets or sets the media types. |
| ContentTypes | ChannelMediaContentType[] | Gets or sets the content types. |
| MaxPageSize | integer|null | Gets or sets the maximum number of records the channel allows retrieving at a time. |
| AutoRefreshLevels | integer|null | Gets or sets the automatic refresh levels. |
| DefaultSortFields | ChannelItemSortField[] | Gets or sets the default sort orders. |
| SupportsSortOrderToggle | boolean | Gets or sets a value indicating whether a sort ascending/descending toggle is supported. |
| SupportsLatestMedia | boolean | Gets or sets a value indicating whether [supports latest media]. |
| CanFilter | boolean | Gets or sets a value indicating whether this instance can filter. |
| SupportsContentDownloading | boolean | Gets or sets a value indicating whether [supports content downloading]. |


**200 字段说明（ChannelFeatures）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name. |
| Id | string | Gets or sets the identifier. |
| CanSearch | boolean | Gets or sets a value indicating whether this instance can search. |
| MediaTypes | ChannelMediaType[] | Gets or sets the media types. |
| ContentTypes | ChannelMediaContentType[] | Gets or sets the content types. |
| MaxPageSize | integer|null | Gets or sets the maximum number of records the channel allows retrieving at a time. |
| AutoRefreshLevels | integer|null | Gets or sets the automatic refresh levels. |
| DefaultSortFields | ChannelItemSortField[] | Gets or sets the default sort orders. |
| SupportsSortOrderToggle | boolean | Gets or sets a value indicating whether a sort ascending/descending toggle is supported. |
| SupportsLatestMedia | boolean | Gets or sets a value indicating whether [supports latest media]. |
| CanFilter | boolean | Gets or sets a value indicating whether this instance can filter. |
| SupportsContentDownloading | boolean | Gets or sets a value indicating whether [supports content downloading]. |


**200 字段说明（ChannelFeatures）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name. |
| Id | string | Gets or sets the identifier. |
| CanSearch | boolean | Gets or sets a value indicating whether this instance can search. |
| MediaTypes | ChannelMediaType[] | Gets or sets the media types. |
| ContentTypes | ChannelMediaContentType[] | Gets or sets the content types. |
| MaxPageSize | integer|null | Gets or sets the maximum number of records the channel allows retrieving at a time. |
| AutoRefreshLevels | integer|null | Gets or sets the automatic refresh levels. |
| DefaultSortFields | ChannelItemSortField[] | Gets or sets the default sort orders. |
| SupportsSortOrderToggle | boolean | Gets or sets a value indicating whether a sort ascending/descending toggle is supported. |
| SupportsLatestMedia | boolean | Gets or sets a value indicating whether [supports latest media]. |
| CanFilter | boolean | Gets or sets a value indicating whether this instance can filter. |
| SupportsContentDownloading | boolean | Gets or sets a value indicating whether [supports content downloading]. |


---

## GetChannelItems

### 基本信息
**Path：** GET 服务器地址 + /Channels/{channelId}/Items

**Method：** GET

**接口描述：** Get channel items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| channelId | 是 | string |  | Channel Id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| folderId | 否 | string |  | Optional. Folder Id. |
| userId | 否 | string |  | Optional. User Id. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| sortOrder | 否 | SortOrder[] |  | Optional. Sort Order - Ascending,Descending. |
| filters | 否 | ItemFilter[] |  | Optional. Specify additional filters to apply. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Specify one or more sort orders, comma delimited. Options: Album, AlbumArtist, Artist, Budget, CommunityRating, CriticRating, DateCreated, DatePlayed, PlayCount, PremiereDate, ProductionYear, SortName, Random, Revenue, Runtime. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Channel items returned. | BaseItemDtoQueryResult |
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

## GetAllChannelFeatures

### 基本信息
**Path：** GET 服务器地址 + /Channels/Features

**Method：** GET

**接口描述：** Get all channel features.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | All channel features returned. | ChannelFeatures[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLatestChannelItems

### 基本信息
**Path：** GET 服务器地址 + /Channels/Items/Latest

**Method：** GET

**接口描述：** Gets latest channel items.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. User Id. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| filters | 否 | ItemFilter[] |  | Optional. Specify additional filters to apply. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| channelIds | 否 | string[] |  | Optional. Specify one or more channel id's, comma delimited. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Latest channel items returned. | BaseItemDtoQueryResult |
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

