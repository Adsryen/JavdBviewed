# 条目更新（ItemUpdateService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：媒体库与条目
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Items/{ItemId}` | postItemsByItemid | Updates an item |
| GET | `/Items/{ItemId}/MetadataEditor` | getItemsByItemidMetadataeditor | Gets metadata editor info for an item |

---

## postItemsByItemid

### 基本信息
**Path：** POST 服务器地址 + /Items/{ItemId}

**Method：** POST

**接口描述：** Updates an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemId | 是 | string |  | The id of the item |


**Body**

- 是否必须：是
- 描述：BaseItemDto:
- Content-Type：`application/json`
- Schema：`BaseItemDto`

| 字段 | 类型 | 备注 |
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

- Content-Type：`application/xml`
- Schema：`BaseItemDto`

| 字段 | 类型 | 备注 |
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

## getItemsByItemidMetadataeditor

### 基本信息
**Path：** GET 服务器地址 + /Items/{ItemId}/MetadataEditor

**Method：** GET

**接口描述：** Gets metadata editor info for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemId | 是 | string |  | The id of the item |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a MetadataEditorInfo object. | MetadataEditorInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（MetadataEditorInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ParentalRatingOptions | ParentalRating[] |  |
| Countries | Globalization.CountryInfo[] |  |
| Cultures | Globalization.CultureDto[] |  |
| ExternalIdInfos | ExternalIdInfo[] |  |
| PersonExternalIdInfos | ExternalIdInfo[] |  |


**200 字段说明（MetadataEditorInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ParentalRatingOptions | ParentalRating[] |  |
| Countries | Globalization.CountryInfo[] |  |
| Cultures | Globalization.CultureDto[] |  |
| ExternalIdInfos | ExternalIdInfo[] |  |
| PersonExternalIdInfos | ExternalIdInfo[] |  |


---

