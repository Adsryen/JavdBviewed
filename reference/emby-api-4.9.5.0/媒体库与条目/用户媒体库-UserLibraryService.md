# 用户媒体库（UserLibraryService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：19

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Items/{Id}/MakePrivate` | postItemsByIdMakeprivate | Makes an item private |
| POST | `/Items/{Id}/MakePublic` | postItemsByIdMakepublic | Makes an item public to all users |
| POST | `/Items/Access` | postItemsAccess | Updates user item access |
| POST | `/Items/Shared/Leave` | postItemsSharedLeave | Leaves a shared item |
| GET | `/LiveTv/Programs/{Id}` | getLivetvProgramsById | Gets a live tv program |
| DELETE | `/Users/{UserId}/FavoriteItems/{Id}` | deleteUsersByUseridFavoriteitemsById | Unmarks an item as a favorite |
| POST | `/Users/{UserId}/FavoriteItems/{Id}` | postUsersByUseridFavoriteitemsById | Marks an item as a favorite |
| POST | `/Users/{UserId}/FavoriteItems/{Id}/Delete` | postUsersByUseridFavoriteitemsByIdDelete | Unmarks an item as a favorite |
| GET | `/Users/{UserId}/Items/{Id}` | getUsersByUseridItemsById | Gets an item from a user's library |
| POST | `/Users/{UserId}/Items/{Id}/HideFromResume` | postUsersByUseridItemsByIdHidefromresume | Updates a user's hide from resume for an item |
| GET | `/Users/{UserId}/Items/{Id}/Intros` | getUsersByUseridItemsByIdIntros | Gets intros to play before the main media item plays |
| GET | `/Users/{UserId}/Items/{Id}/LocalTrailers` | getUsersByUseridItemsByIdLocaltrailers | Gets local trailers for an item |
| DELETE | `/Users/{UserId}/Items/{Id}/Rating` | deleteUsersByUseridItemsByIdRating | Deletes a user's saved personal rating for an item |
| POST | `/Users/{UserId}/Items/{Id}/Rating` | postUsersByUseridItemsByIdRating | Updates a user's rating for an item |
| POST | `/Users/{UserId}/Items/{Id}/Rating/Delete` | postUsersByUseridItemsByIdRatingDelete | Deletes a user's saved personal rating for an item |
| GET | `/Users/{UserId}/Items/{Id}/SpecialFeatures` | getUsersByUseridItemsByIdSpecialfeatures | Gets special features for an item |
| GET | `/Users/{UserId}/Items/Latest` | getUsersByUseridItemsLatest | Gets latest media |
| GET | `/Users/{UserId}/Items/Root` | getUsersByUseridItemsRoot | Gets the root folder from a user's library |
| GET | `/Videos/{Id}/AdditionalParts` | getVideosByIdAdditionalparts | Gets additional parts for a video. |

---

## postItemsByIdMakeprivate

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/MakePrivate

**Method：** POST

**接口描述：** Makes an item private

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

## postItemsByIdMakepublic

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/MakePublic

**Method：** POST

**接口描述：** Makes an item public to all users

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

## postItemsAccess

### 基本信息
**Path：** POST 服务器地址 + /Items/Access

**Method：** POST

**接口描述：** Updates user item access

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：UpdateUserItemAccess
- Content-Type：`application/json`
- Schema：`UserLibrary.UpdateUserItemAccess`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemIds | string[] |  |
| UserIds | string[] |  |
| ItemAccess | UserItemShareLevel |  |

- Content-Type：`application/xml`
- Schema：`UserLibrary.UpdateUserItemAccess`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemIds | string[] |  |
| UserIds | string[] |  |
| ItemAccess | UserItemShareLevel |  |



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

## postItemsSharedLeave

### 基本信息
**Path：** POST 服务器地址 + /Items/Shared/Leave

**Method：** POST

**接口描述：** Leaves a shared item

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：LeaveSharedItems
- Content-Type：`application/json`
- Schema：`UserLibrary.LeaveSharedItems`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemIds | string[] |  |
| UserId | string |  |

- Content-Type：`application/xml`
- Schema：`UserLibrary.LeaveSharedItems`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemIds | string[] |  |
| UserId | string |  |



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

## getLivetvProgramsById

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Programs/{Id}

**Method：** GET

**接口描述：** Gets a live tv program

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## deleteUsersByUseridFavoriteitemsById

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{UserId}/FavoriteItems/{Id}

**Method：** DELETE

**接口描述：** Unmarks an item as a favorite

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## postUsersByUseridFavoriteitemsById

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/FavoriteItems/{Id}

**Method：** POST

**接口描述：** Marks an item as a favorite

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## postUsersByUseridFavoriteitemsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/FavoriteItems/{Id}/Delete

**Method：** POST

**接口描述：** Unmarks an item as a favorite

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## getUsersByUseridItemsById

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Items/{Id}

**Method：** GET

**接口描述：** Gets an item from a user's library

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


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

## postUsersByUseridItemsByIdHidefromresume

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/Items/{Id}/HideFromResume

**Method：** POST

**接口描述：** Updates a user's hide from resume for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Hide | 是 | boolean |  | Whether the item should be hidden from reusme or not. true/false |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## getUsersByUseridItemsByIdIntros

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Items/{Id}/Intros

**Method：** GET

**接口描述：** Gets intros to play before the main media item plays

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |


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

## getUsersByUseridItemsByIdLocaltrailers

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Items/{Id}/LocalTrailers

**Method：** GET

**接口描述：** Gets local trailers for an item

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |


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

## deleteUsersByUseridItemsByIdRating

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{UserId}/Items/{Id}/Rating

**Method：** DELETE

**接口描述：** Deletes a user's saved personal rating for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## postUsersByUseridItemsByIdRating

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/Items/{Id}/Rating

**Method：** POST

**接口描述：** Updates a user's rating for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Likes | 是 | boolean |  | Whether the user likes the item or not. true/false |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## postUsersByUseridItemsByIdRatingDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/Items/{Id}/Rating/Delete

**Method：** POST

**接口描述：** Deletes a user's saved personal rating for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserItemDataDto object. | UserItemDataDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null |  |
| PlayedPercentage | number|null |  |
| UnplayedItemCount | integer|null |  |
| PlaybackPositionTicks | integer |  |
| PlayCount | integer|null |  |
| IsFavorite | boolean |  |
| LastPlayedDate | string|null |  |
| Played | boolean |  |
| Key | string |  |
| ItemId | string |  |
| ServerId | string |  |


---

## getUsersByUseridItemsByIdSpecialfeatures

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Items/{Id}/SpecialFeatures

**Method：** GET

**接口描述：** Gets special features for an item

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Id | 是 | string |  | Movie Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |


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

## getUsersByUseridItemsLatest

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Items/Latest

**Method：** GET

**接口描述：** Gets latest media

**官方文档：** [API Documentation: Latest Items](https://dev.emby.media/doc/restapi/Latest-Items.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Limit | 否 | integer |  | Limit |
| ParentId | 否 | string |  | Specify this to localize the search to a specific item or folder. Omit to use the root |
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, SortName, Studios, Taglines |
| IncludeItemTypes | 否 | string |  | Optional. If specified, results will be filtered based on item type. This allows multiple, comma delimeted. |
| MediaTypes | 否 | string |  | Optional filter by MediaType. Allows multiple, comma delimited. |
| IsFolder | 否 | boolean|null |  | Filter by items that are folders, or not. |
| IsPlayed | 否 | boolean|null |  | Filter by items that are played, or not. |
| GroupItems | 否 | boolean |  | Whether or not to group items into a parent container. |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |


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

## getUsersByUseridItemsRoot

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/Items/Root

**Method：** GET

**接口描述：** Gets the root folder from a user's library

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


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

## getVideosByIdAdditionalparts

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/AdditionalParts

**Method：** GET

**接口描述：** Gets additional parts for a video.

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
| Fields | 否 | string |  | Optional. Specify additional fields of information to return in the output. This allows multiple, comma delimeted. Options: Budget, Chapters, DateCreated, Genres, HomePageUrl, IndexOptions, MediaStreams, Overview, ParentId, Path, People, ProviderIds, PrimaryImageAspectRatio, Revenue, SortName, Studios, Taglines, TrailerUrls |
| EnableImages | 否 | boolean|null |  | Optional, include image information in output |
| ImageTypeLimit | 否 | integer|null |  | Optional, the max number of images to return, per image type |
| EnableImageTypes | 否 | string |  | Optional. The image types to include in the output. |
| EnableUserData | 否 | boolean|null |  | Optional, include user data |


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

