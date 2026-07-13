# 直播电视（LiveTv）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：直播电视
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：38

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/LiveTv/ChannelMappingOptions` | GetChannelMappingOptions | Get channel mapping options. |
| POST | `/LiveTv/ChannelMappings` | SetChannelMapping | Set channel mappings. |
| GET | `/LiveTv/Channels` | GetLiveTvChannels | Gets available live tv channels. |
| GET | `/LiveTv/Channels/{channelId}` | GetChannel | Gets a live tv channel. |
| GET | `/LiveTv/GuideInfo` | GetGuideInfo | Get guide info. |
| GET | `/LiveTv/Info` | GetLiveTvInfo | Gets available live tv services. |
| DELETE | `/LiveTv/ListingProviders` | DeleteListingProvider | Delete listing provider. |
| POST | `/LiveTv/ListingProviders` | AddListingProvider | Adds a listings provider. |
| GET | `/LiveTv/ListingProviders/Default` | GetDefaultListingProvider | Gets default listings provider info. |
| GET | `/LiveTv/ListingProviders/Lineups` | GetLineups | Gets available lineups. |
| GET | `/LiveTv/ListingProviders/SchedulesDirect/Countries` | GetSchedulesDirectCountries | Gets available countries. |
| GET | `/LiveTv/LiveRecordings/{recordingId}/stream` | GetLiveRecordingFile | Gets a live tv recording stream. |
| GET | `/LiveTv/LiveStreamFiles/{streamId}/stream.{container}` | GetLiveStreamFile | Gets a live tv channel stream. |
| GET | `/LiveTv/Programs` | GetLiveTvPrograms | Gets available live tv epgs. |
| POST | `/LiveTv/Programs` | GetPrograms | Gets available live tv epgs. |
| GET | `/LiveTv/Programs/{programId}` | GetProgram | Gets a live tv program. |
| GET | `/LiveTv/Programs/Recommended` | GetRecommendedPrograms | Gets recommended live tv epgs. |
| GET | `/LiveTv/Recordings` | GetRecordings | Gets live tv recordings. |
| DELETE | `/LiveTv/Recordings/{recordingId}` | DeleteRecording | Deletes a live tv recording. |
| GET | `/LiveTv/Recordings/{recordingId}` | GetRecording | Gets a live tv recording. |
| GET | `/LiveTv/Recordings/Folders` | GetRecordingFolders | Gets recording folders. |
| GET | `/LiveTv/SeriesTimers` | GetSeriesTimers | Gets live tv series timers. |
| POST | `/LiveTv/SeriesTimers` | CreateSeriesTimer | Creates a live tv series timer. |
| DELETE | `/LiveTv/SeriesTimers/{timerId}` | CancelSeriesTimer | Cancels a live tv series timer. |
| GET | `/LiveTv/SeriesTimers/{timerId}` | GetSeriesTimer | Gets a live tv series timer. |
| POST | `/LiveTv/SeriesTimers/{timerId}` | UpdateSeriesTimer | Updates a live tv series timer. |
| GET | `/LiveTv/Timers` | GetTimers | Gets the live tv timers. |
| POST | `/LiveTv/Timers` | CreateTimer | Creates a live tv timer. |
| DELETE | `/LiveTv/Timers/{timerId}` | CancelTimer | Cancels a live tv timer. |
| GET | `/LiveTv/Timers/{timerId}` | GetTimer | Gets a timer. |
| POST | `/LiveTv/Timers/{timerId}` | UpdateTimer | Updates a live tv timer. |
| GET | `/LiveTv/Timers/Defaults` | GetDefaultTimer | Gets the default values for a new timer. |
| DELETE | `/LiveTv/TunerHosts` | DeleteTunerHost | Deletes a tuner host. |
| POST | `/LiveTv/TunerHosts` | AddTunerHost | Adds a tuner host. |
| GET | `/LiveTv/TunerHosts/Types` | GetTunerHostTypes | Get tuner host types. |
| POST | `/LiveTv/Tuners/{tunerId}/Reset` | ResetTuner | Resets a tv tuner. |
| GET | `/LiveTv/Tuners/Discover` | DiscoverTuners | Discover tuners. |
| GET | `/LiveTv/Tuners/Discvover` | DiscvoverTuners | Discover tuners. |

---

## GetChannelMappingOptions

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ChannelMappingOptions

**Method：** GET

**接口描述：** Get channel mapping options.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| providerId | 否 | string |  | Provider id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Channel mapping options returned. | ChannelMappingOptionsDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ChannelMappingOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannels | TunerChannelMapping[] | Gets or sets list of tuner channels. |
| ProviderChannels | NameIdPair[] | Gets or sets list of provider channels. |
| Mappings | NameValuePair[] | Gets or sets list of mappings. |
| ProviderName | string|null | Gets or sets provider name. |


**200 字段说明（ChannelMappingOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannels | TunerChannelMapping[] | Gets or sets list of tuner channels. |
| ProviderChannels | NameIdPair[] | Gets or sets list of provider channels. |
| Mappings | NameValuePair[] | Gets or sets list of mappings. |
| ProviderName | string|null | Gets or sets provider name. |


**200 字段说明（ChannelMappingOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannels | TunerChannelMapping[] | Gets or sets list of tuner channels. |
| ProviderChannels | NameIdPair[] | Gets or sets list of provider channels. |
| Mappings | NameValuePair[] | Gets or sets list of mappings. |
| ProviderName | string|null | Gets or sets provider name. |


---

## SetChannelMapping

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/ChannelMappings

**Method：** POST

**接口描述：** Set channel mappings.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The set channel mapping dto.
- Content-Type：`application/json`
- Schema：`SetChannelMappingDto`
- Content-Type：`text/json`
- Schema：`SetChannelMappingDto`
- Content-Type：`application/*+json`
- Schema：`SetChannelMappingDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Created channel mapping returned. | TunerChannelMapping |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（TunerChannelMapping）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null |  |
| ProviderChannelName | string|null |  |
| ProviderChannelId | string|null |  |
| Id | string|null |  |


**200 字段说明（TunerChannelMapping）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null |  |
| ProviderChannelName | string|null |  |
| ProviderChannelId | string|null |  |
| Id | string|null |  |


**200 字段说明（TunerChannelMapping）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null |  |
| ProviderChannelName | string|null |  |
| ProviderChannelId | string|null |  |
| Id | string|null |  |


---

## GetLiveTvChannels

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Channels

**Method：** GET

**接口描述：** Gets available live tv channels.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| type | 否 | string enum(TV|Radio) |  | Optional. Filter by channel type. |
| userId | 否 | string |  | Optional. Filter by user and attach user data. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| isMovie | 否 | boolean |  | Optional. Filter for movies. |
| isSeries | 否 | boolean |  | Optional. Filter for series. |
| isNews | 否 | boolean |  | Optional. Filter for news. |
| isKids | 否 | boolean |  | Optional. Filter for kids. |
| isSports | 否 | boolean |  | Optional. Filter for sports. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| isFavorite | 否 | boolean |  | Optional. Filter by channels that are favorites, or not. |
| isLiked | 否 | boolean |  | Optional. Filter by channels that are liked, or not. |
| isDisliked | 否 | boolean |  | Optional. Filter by channels that are disliked, or not. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | "Optional. The image types to include in the output. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Key to sort by. |
| sortOrder | 否 | string enum(Ascending|Descending) |  | Optional. Sort order. |
| enableFavoriteSorting | 否 | boolean | false | Optional. Incorporate favorite and like status into channel sorting. |
| addCurrentProgram | 否 | boolean | true | Optional. Adds current program info to each channel. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Available live tv channels returned. | BaseItemDtoQueryResult |
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

## GetChannel

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Channels/{channelId}

**Method：** GET

**接口描述：** Gets a live tv channel.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| channelId | 是 | string |  | Channel id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Live tv channel returned. | BaseItemDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetGuideInfo

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/GuideInfo

**Method：** GET

**接口描述：** Get guide info.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Guide info returned. | GuideInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（GuideInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| StartDate | string | Gets or sets the start date. |
| EndDate | string | Gets or sets the end date. |


**200 字段说明（GuideInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| StartDate | string | Gets or sets the start date. |
| EndDate | string | Gets or sets the end date. |


**200 字段说明（GuideInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| StartDate | string | Gets or sets the start date. |
| EndDate | string | Gets or sets the end date. |


---

## GetLiveTvInfo

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Info

**Method：** GET

**接口描述：** Gets available live tv services.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Available live tv services returned. | LiveTvInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LiveTvInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Services | LiveTvServiceInfo[] | Gets or sets the services. |
| IsEnabled | boolean | Gets or sets a value indicating whether this instance is enabled. |
| EnabledUsers | string[] | Gets or sets the enabled users. |


**200 字段说明（LiveTvInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Services | LiveTvServiceInfo[] | Gets or sets the services. |
| IsEnabled | boolean | Gets or sets a value indicating whether this instance is enabled. |
| EnabledUsers | string[] | Gets or sets the enabled users. |


**200 字段说明（LiveTvInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Services | LiveTvServiceInfo[] | Gets or sets the services. |
| IsEnabled | boolean | Gets or sets a value indicating whether this instance is enabled. |
| EnabledUsers | string[] | Gets or sets the enabled users. |


---

## DeleteListingProvider

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/ListingProviders

**Method：** DELETE

**接口描述：** Delete listing provider.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 否 | string |  | Listing provider id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Listing provider deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AddListingProvider

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/ListingProviders

**Method：** POST

**接口描述：** Adds a listings provider.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pw | 否 | string |  | Password. |
| validateListings | 否 | boolean | false | Validate listings. |
| validateLogin | 否 | boolean | false | Validate login. |


**Body**

- 是否必须：否
- 描述：New listings info.
- Content-Type：`application/json`
- Schema：`ListingsProviderInfo`
- Content-Type：`text/json`
- Schema：`ListingsProviderInfo`
- Content-Type：`application/*+json`
- Schema：`ListingsProviderInfo`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Created listings provider returned. | ListingsProviderInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Type | string|null |  |
| Username | string|null |  |
| Password | string|null |  |
| ListingsId | string|null |  |
| ZipCode | string|null |  |
| Country | string|null |  |
| Path | string|null |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| MoviePrefix | string|null |  |
| PreferredLanguage | string|null |  |
| UserAgent | string|null |  |


**200 字段说明（ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Type | string|null |  |
| Username | string|null |  |
| Password | string|null |  |
| ListingsId | string|null |  |
| ZipCode | string|null |  |
| Country | string|null |  |
| Path | string|null |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| MoviePrefix | string|null |  |
| PreferredLanguage | string|null |  |
| UserAgent | string|null |  |


**200 字段说明（ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Type | string|null |  |
| Username | string|null |  |
| Password | string|null |  |
| ListingsId | string|null |  |
| ZipCode | string|null |  |
| Country | string|null |  |
| Path | string|null |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| MoviePrefix | string|null |  |
| PreferredLanguage | string|null |  |
| UserAgent | string|null |  |


---

## GetDefaultListingProvider

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders/Default

**Method：** GET

**接口描述：** Gets default listings provider info.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Default listings provider info returned. | ListingsProviderInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Type | string|null |  |
| Username | string|null |  |
| Password | string|null |  |
| ListingsId | string|null |  |
| ZipCode | string|null |  |
| Country | string|null |  |
| Path | string|null |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| MoviePrefix | string|null |  |
| PreferredLanguage | string|null |  |
| UserAgent | string|null |  |


**200 字段说明（ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Type | string|null |  |
| Username | string|null |  |
| Password | string|null |  |
| ListingsId | string|null |  |
| ZipCode | string|null |  |
| Country | string|null |  |
| Path | string|null |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| MoviePrefix | string|null |  |
| PreferredLanguage | string|null |  |
| UserAgent | string|null |  |


**200 字段说明（ListingsProviderInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Type | string|null |  |
| Username | string|null |  |
| Password | string|null |  |
| ListingsId | string|null |  |
| ZipCode | string|null |  |
| Country | string|null |  |
| Path | string|null |  |
| EnabledTuners | string[] |  |
| EnableAllTuners | boolean |  |
| NewsCategories | string[] |  |
| SportsCategories | string[] |  |
| KidsCategories | string[] |  |
| MovieCategories | string[] |  |
| ChannelMappings | NameValuePair[] |  |
| MoviePrefix | string|null |  |
| PreferredLanguage | string|null |  |
| UserAgent | string|null |  |


---

## GetLineups

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders/Lineups

**Method：** GET

**接口描述：** Gets available lineups.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 否 | string |  | Provider id. |
| type | 否 | string |  | Provider type. |
| location | 否 | string |  | Location. |
| country | 否 | string |  | Country. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Available lineups returned. | NameIdPair[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSchedulesDirectCountries

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/ListingProviders/SchedulesDirect/Countries

**Method：** GET

**接口描述：** Gets available countries.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Available countries returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLiveRecordingFile

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveRecordings/{recordingId}/stream

**Method：** GET

**接口描述：** Gets a live tv recording stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| recordingId | 是 | string |  | Recording id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Recording stream returned. | string |
| 404 | Recording not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLiveStreamFile

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveStreamFiles/{streamId}/stream.{container}

**Method：** GET

**接口描述：** Gets a live tv channel stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| streamId | 是 | string |  | Stream id. |
| container | 是 | string |  | Container type. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Stream returned. | string |
| 404 | Stream not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLiveTvPrograms

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Programs

**Method：** GET

**接口描述：** Gets available live tv epgs.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| channelIds | 否 | string[] |  | The channels to return guide information for. |
| userId | 否 | string |  | Optional. Filter by user id. |
| minStartDate | 否 | string |  | Optional. The minimum premiere start date. |
| hasAired | 否 | boolean |  | Optional. Filter by programs that have completed airing, or not. |
| isAiring | 否 | boolean |  | Optional. Filter by programs that are currently airing, or not. |
| maxStartDate | 否 | string |  | Optional. The maximum premiere start date. |
| minEndDate | 否 | string |  | Optional. The minimum premiere end date. |
| maxEndDate | 否 | string |  | Optional. The maximum premiere end date. |
| isMovie | 否 | boolean |  | Optional. Filter for movies. |
| isSeries | 否 | boolean |  | Optional. Filter for series. |
| isNews | 否 | boolean |  | Optional. Filter for news. |
| isKids | 否 | boolean |  | Optional. Filter for kids. |
| isSports | 否 | boolean |  | Optional. Filter for sports. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| sortBy | 否 | ItemSortBy[] |  | Optional. Specify one or more sort orders, comma delimited. Options: Name, StartDate. |
| sortOrder | 否 | SortOrder[] |  | Sort Order - Ascending,Descending. |
| genres | 否 | string[] |  | The genres to return guide information for. |
| genreIds | 否 | string[] |  | The genre ids to return guide information for. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| seriesTimerId | 否 | string |  | Optional. Filter by series timer id. |
| librarySeriesId | 否 | string |  | Optional. Filter by library series id. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableTotalRecordCount | 否 | boolean | true | Retrieve total record count. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Live tv epgs returned. | BaseItemDtoQueryResult |
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

## GetPrograms

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Programs

**Method：** POST

**接口描述：** Gets available live tv epgs.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：Request body.
- Content-Type：`application/json`
- Schema：`GetProgramsDto`
- Content-Type：`text/json`
- Schema：`GetProgramsDto`
- Content-Type：`application/*+json`
- Schema：`GetProgramsDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Live tv epgs returned. | BaseItemDtoQueryResult |
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

## GetProgram

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Programs/{programId}

**Method：** GET

**接口描述：** Gets a live tv program.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| programId | 是 | string |  | Program id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Program returned. | BaseItemDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Program not found. | ProblemDetails |
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

## GetRecommendedPrograms

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Programs/Recommended

**Method：** GET

**接口描述：** Gets recommended live tv epgs.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. filter by user id. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| isAiring | 否 | boolean |  | Optional. Filter by programs that are currently airing, or not. |
| hasAired | 否 | boolean |  | Optional. Filter by programs that have completed airing, or not. |
| isSeries | 否 | boolean |  | Optional. Filter for series. |
| isMovie | 否 | boolean |  | Optional. Filter for movies. |
| isNews | 否 | boolean |  | Optional. Filter for news. |
| isKids | 否 | boolean |  | Optional. Filter for kids. |
| isSports | 否 | boolean |  | Optional. Filter for sports. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| genreIds | 否 | string[] |  | The genres to return guide information for. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableUserData | 否 | boolean |  | Optional. include user data. |
| enableTotalRecordCount | 否 | boolean | true | Retrieve total record count. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Recommended epgs returned. | BaseItemDtoQueryResult |
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

## GetRecordings

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings

**Method：** GET

**接口描述：** Gets live tv recordings.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| channelId | 否 | string |  | Optional. Filter by channel id. |
| userId | 否 | string |  | Optional. Filter by user and attach user data. |
| startIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | Optional. The maximum number of records to return. |
| status | 否 | string enum(New|InProgress|Completed|Cancelled|ConflictedOk|ConflictedNotOk|Error) |  | Optional. Filter by recording status. |
| isInProgress | 否 | boolean |  | Optional. Filter by recordings that are in progress, or not. |
| seriesTimerId | 否 | string |  | Optional. Filter by recordings belonging to a series timer. |
| enableImages | 否 | boolean |  | Optional. Include image information in output. |
| imageTypeLimit | 否 | integer |  | Optional. The max number of images to return, per image type. |
| enableImageTypes | 否 | ImageType[] |  | Optional. The image types to include in the output. |
| fields | 否 | ItemFields[] |  | Optional. Specify additional fields of information to return in the output. |
| enableUserData | 否 | boolean |  | Optional. Include user data. |
| isMovie | 否 | boolean |  | Optional. Filter for movies. |
| isSeries | 否 | boolean |  | Optional. Filter for series. |
| isKids | 否 | boolean |  | Optional. Filter for kids. |
| isSports | 否 | boolean |  | Optional. Filter for sports. |
| isNews | 否 | boolean |  | Optional. Filter for news. |
| isLibraryItem | 否 | boolean |  | Optional. Filter for is library item. |
| enableTotalRecordCount | 否 | boolean | true | Optional. Return total record count. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Live tv recordings returned. | BaseItemDtoQueryResult |
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

## DeleteRecording

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/Recordings/{recordingId}

**Method：** DELETE

**接口描述：** Deletes a live tv recording.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| recordingId | 是 | string |  | Recording id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Recording deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetRecording

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings/{recordingId}

**Method：** GET

**接口描述：** Gets a live tv recording.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| recordingId | 是 | string |  | Recording id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Recording returned. | BaseItemDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
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

## GetRecordingFolders

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Recordings/Folders

**Method：** GET

**接口描述：** Gets recording folders.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user and attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Recording folders returned. | BaseItemDtoQueryResult |
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

## GetSeriesTimers

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/SeriesTimers

**Method：** GET

**接口描述：** Gets live tv series timers.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sortBy | 否 | string |  | Optional. Sort by SortName or Priority. |
| sortOrder | 否 | string enum(Ascending|Descending) |  | Optional. Sort in Ascending or Descending order. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Timers returned. | SeriesTimerInfoDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（SeriesTimerInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SeriesTimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（SeriesTimerInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SeriesTimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（SeriesTimerInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SeriesTimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## CreateSeriesTimer

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/SeriesTimers

**Method：** POST

**接口描述：** Creates a live tv series timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：New series timer info.
- Content-Type：`application/json`
- Schema：`SeriesTimerInfoDto`
- Content-Type：`text/json`
- Schema：`SeriesTimerInfoDto`
- Content-Type：`application/*+json`
- Schema：`SeriesTimerInfoDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Series timer info created. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## CancelSeriesTimer

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/SeriesTimers/{timerId}

**Method：** DELETE

**接口描述：** Cancels a live tv series timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| timerId | 是 | string |  | Timer id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Timer cancelled. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSeriesTimer

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/SeriesTimers/{timerId}

**Method：** GET

**接口描述：** Gets a live tv series timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| timerId | 是 | string |  | Timer id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Series timer returned. | SeriesTimerInfoDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Series timer not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| RecordAnyTime | boolean | Gets or sets a value indicating whether [record any time]. |
| SkipEpisodesInLibrary | boolean |  |
| RecordAnyChannel | boolean | Gets or sets a value indicating whether [record any channel]. |
| KeepUpTo | integer |  |
| RecordNewOnly | boolean | Gets or sets a value indicating whether [record new only]. |
| Days | DayOfWeek[] | Gets or sets the days. |
| DayPattern | string enum(Daily|Weekdays|Weekends) | Gets or sets the day pattern. |
| ImageTags | object|null | Gets or sets the image tags. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |


**200 字段说明（SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| RecordAnyTime | boolean | Gets or sets a value indicating whether [record any time]. |
| SkipEpisodesInLibrary | boolean |  |
| RecordAnyChannel | boolean | Gets or sets a value indicating whether [record any channel]. |
| KeepUpTo | integer |  |
| RecordNewOnly | boolean | Gets or sets a value indicating whether [record new only]. |
| Days | DayOfWeek[] | Gets or sets the days. |
| DayPattern | string enum(Daily|Weekdays|Weekends) | Gets or sets the day pattern. |
| ImageTags | object|null | Gets or sets the image tags. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |


**200 字段说明（SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| RecordAnyTime | boolean | Gets or sets a value indicating whether [record any time]. |
| SkipEpisodesInLibrary | boolean |  |
| RecordAnyChannel | boolean | Gets or sets a value indicating whether [record any channel]. |
| KeepUpTo | integer |  |
| RecordNewOnly | boolean | Gets or sets a value indicating whether [record new only]. |
| Days | DayOfWeek[] | Gets or sets the days. |
| DayPattern | string enum(Daily|Weekdays|Weekends) | Gets or sets the day pattern. |
| ImageTags | object|null | Gets or sets the image tags. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |


---

## UpdateSeriesTimer

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/SeriesTimers/{timerId}

**Method：** POST

**接口描述：** Updates a live tv series timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| timerId | 是 | string |  | Timer id. |


**Body**

- 是否必须：否
- 描述：New series timer info.
- Content-Type：`application/json`
- Schema：`SeriesTimerInfoDto`
- Content-Type：`text/json`
- Schema：`SeriesTimerInfoDto`
- Content-Type：`application/*+json`
- Schema：`SeriesTimerInfoDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Series timer updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetTimers

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Timers

**Method：** GET

**接口描述：** Gets the live tv timers.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| channelId | 否 | string |  | Optional. Filter by channel id. |
| seriesTimerId | 否 | string |  | Optional. Filter by timers belonging to a series timer. |
| isActive | 否 | boolean |  | Optional. Filter by timers that are active. |
| isScheduled | 否 | boolean |  | Optional. Filter by timers that are scheduled. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | TimerInfoDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（TimerInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | TimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（TimerInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | TimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（TimerInfoDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | TimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## CreateTimer

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Timers

**Method：** POST

**接口描述：** Creates a live tv timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：New timer info.
- Content-Type：`application/json`
- Schema：`TimerInfoDto`
- Content-Type：`text/json`
- Schema：`TimerInfoDto`
- Content-Type：`application/*+json`
- Schema：`TimerInfoDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Timer created. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## CancelTimer

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/Timers/{timerId}

**Method：** DELETE

**接口描述：** Cancels a live tv timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| timerId | 是 | string |  | Timer id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Timer deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetTimer

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Timers/{timerId}

**Method：** GET

**接口描述：** Gets a timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| timerId | 是 | string |  | Timer id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Timer returned. | TimerInfoDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| Status | string enum(New|InProgress|Completed|Cancelled|ConflictedOk|ConflictedNotOk|Error) | Gets or sets the status. |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ExternalSeriesTimerId | string|null | Gets or sets the external series timer identifier. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| ProgramInfo | BaseItemDto | Gets or sets the program information. |


**200 字段说明（TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| Status | string enum(New|InProgress|Completed|Cancelled|ConflictedOk|ConflictedNotOk|Error) | Gets or sets the status. |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ExternalSeriesTimerId | string|null | Gets or sets the external series timer identifier. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| ProgramInfo | BaseItemDto | Gets or sets the program information. |


**200 字段说明（TimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| Status | string enum(New|InProgress|Completed|Cancelled|ConflictedOk|ConflictedNotOk|Error) | Gets or sets the status. |
| SeriesTimerId | string|null | Gets or sets the series timer identifier. |
| ExternalSeriesTimerId | string|null | Gets or sets the external series timer identifier. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| ProgramInfo | BaseItemDto | Gets or sets the program information. |


---

## UpdateTimer

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Timers/{timerId}

**Method：** POST

**接口描述：** Updates a live tv timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| timerId | 是 | string |  | Timer id. |


**Body**

- 是否必须：否
- 描述：New timer info.
- Content-Type：`application/json`
- Schema：`TimerInfoDto`
- Content-Type：`text/json`
- Schema：`TimerInfoDto`
- Content-Type：`application/*+json`
- Schema：`TimerInfoDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Timer updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetDefaultTimer

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Timers/Defaults

**Method：** GET

**接口描述：** Gets the default values for a new timer.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| programId | 否 | string |  | Optional. To attach default values based on a program. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Default values returned. | SeriesTimerInfoDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| RecordAnyTime | boolean | Gets or sets a value indicating whether [record any time]. |
| SkipEpisodesInLibrary | boolean |  |
| RecordAnyChannel | boolean | Gets or sets a value indicating whether [record any channel]. |
| KeepUpTo | integer |  |
| RecordNewOnly | boolean | Gets or sets a value indicating whether [record new only]. |
| Days | DayOfWeek[] | Gets or sets the days. |
| DayPattern | string enum(Daily|Weekdays|Weekends) | Gets or sets the day pattern. |
| ImageTags | object|null | Gets or sets the image tags. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |


**200 字段说明（SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| RecordAnyTime | boolean | Gets or sets a value indicating whether [record any time]. |
| SkipEpisodesInLibrary | boolean |  |
| RecordAnyChannel | boolean | Gets or sets a value indicating whether [record any channel]. |
| KeepUpTo | integer |  |
| RecordNewOnly | boolean | Gets or sets a value indicating whether [record new only]. |
| Days | DayOfWeek[] | Gets or sets the days. |
| DayPattern | string enum(Daily|Weekdays|Weekends) | Gets or sets the day pattern. |
| ImageTags | object|null | Gets or sets the image tags. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |


**200 字段说明（SeriesTimerInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the Id of the recording. |
| Type | string|null |  |
| ServerId | string|null | Gets or sets the server identifier. |
| ExternalId | string|null | Gets or sets the external identifier. |
| ChannelId | string | Gets or sets the channel id of the recording. |
| ExternalChannelId | string|null | Gets or sets the external channel identifier. |
| ChannelName | string|null | Gets or sets the channel name of the recording. |
| ChannelPrimaryImageTag | string|null |  |
| ProgramId | string|null | Gets or sets the program identifier. |
| ExternalProgramId | string|null | Gets or sets the external program identifier. |
| Name | string|null | Gets or sets the name of the recording. |
| Overview | string|null | Gets or sets the description of the recording. |
| StartDate | string | Gets or sets the start date of the recording, in UTC. |
| EndDate | string | Gets or sets the end date of the recording, in UTC. |
| ServiceName | string|null | Gets or sets the name of the service. |
| Priority | integer | Gets or sets the priority. |
| PrePaddingSeconds | integer | Gets or sets the pre padding seconds. |
| PostPaddingSeconds | integer | Gets or sets the post padding seconds. |
| IsPrePaddingRequired | boolean | Gets or sets a value indicating whether this instance is pre padding required. |
| ParentBackdropItemId | string|null | Gets or sets the Id of the Parent that has a backdrop if the item does not have one. |
| ParentBackdropImageTags | string[] | Gets or sets the parent backdrop image tags. |
| IsPostPaddingRequired | boolean | Gets or sets a value indicating whether this instance is post padding required. |
| KeepUntil | string enum(UntilDeleted|UntilSpaceNeeded|UntilWatched|UntilDate) |  |
| RecordAnyTime | boolean | Gets or sets a value indicating whether [record any time]. |
| SkipEpisodesInLibrary | boolean |  |
| RecordAnyChannel | boolean | Gets or sets a value indicating whether [record any channel]. |
| KeepUpTo | integer |  |
| RecordNewOnly | boolean | Gets or sets a value indicating whether [record new only]. |
| Days | DayOfWeek[] | Gets or sets the days. |
| DayPattern | string enum(Daily|Weekdays|Weekends) | Gets or sets the day pattern. |
| ImageTags | object|null | Gets or sets the image tags. |
| ParentThumbItemId | string|null | Gets or sets the parent thumb item id. |
| ParentThumbImageTag | string|null | Gets or sets the parent thumb image tag. |
| ParentPrimaryImageItemId | string|null | Gets or sets the parent primary image item identifier. |
| ParentPrimaryImageTag | string|null | Gets or sets the parent primary image tag. |


---

## DeleteTunerHost

### 基本信息
**Path：** DELETE 服务器地址 + /LiveTv/TunerHosts

**Method：** DELETE

**接口描述：** Deletes a tuner host.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 否 | string |  | Tuner host id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Tuner host deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AddTunerHost

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/TunerHosts

**Method：** POST

**接口描述：** Adds a tuner host.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：New tuner host.
- Content-Type：`application/json`
- Schema：`TunerHostInfo`
- Content-Type：`text/json`
- Schema：`TunerHostInfo`
- Content-Type：`application/*+json`
- Schema：`TunerHostInfo`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Created tuner host returned. | TunerHostInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Url | string|null |  |
| Type | string|null |  |
| DeviceId | string|null |  |
| FriendlyName | string|null |  |
| ImportFavoritesOnly | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowFmp4TranscodingContainer | boolean |  |
| AllowStreamSharing | boolean |  |
| FallbackMaxStreamingBitrate | integer |  |
| EnableStreamLooping | boolean |  |
| Source | string|null |  |
| TunerCount | integer |  |
| UserAgent | string|null |  |
| IgnoreDts | boolean |  |
| ReadAtNativeFramerate | boolean |  |


**200 字段说明（TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Url | string|null |  |
| Type | string|null |  |
| DeviceId | string|null |  |
| FriendlyName | string|null |  |
| ImportFavoritesOnly | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowFmp4TranscodingContainer | boolean |  |
| AllowStreamSharing | boolean |  |
| FallbackMaxStreamingBitrate | integer |  |
| EnableStreamLooping | boolean |  |
| Source | string|null |  |
| TunerCount | integer |  |
| UserAgent | string|null |  |
| IgnoreDts | boolean |  |
| ReadAtNativeFramerate | boolean |  |


**200 字段说明（TunerHostInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null |  |
| Url | string|null |  |
| Type | string|null |  |
| DeviceId | string|null |  |
| FriendlyName | string|null |  |
| ImportFavoritesOnly | boolean |  |
| AllowHWTranscoding | boolean |  |
| AllowFmp4TranscodingContainer | boolean |  |
| AllowStreamSharing | boolean |  |
| FallbackMaxStreamingBitrate | integer |  |
| EnableStreamLooping | boolean |  |
| Source | string|null |  |
| TunerCount | integer |  |
| UserAgent | string|null |  |
| IgnoreDts | boolean |  |
| ReadAtNativeFramerate | boolean |  |


---

## GetTunerHostTypes

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/TunerHosts/Types

**Method：** GET

**接口描述：** Get tuner host types.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Tuner host types returned. | NameIdPair[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ResetTuner

### 基本信息
**Path：** POST 服务器地址 + /LiveTv/Tuners/{tunerId}/Reset

**Method：** POST

**接口描述：** Resets a tv tuner.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tunerId | 是 | string |  | Tuner id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Tuner reset. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DiscoverTuners

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Tuners/Discover

**Method：** GET

**接口描述：** Discover tuners.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| newDevicesOnly | 否 | boolean | false | Only discover new tuners. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Tuners returned. | TunerHostInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DiscvoverTuners

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/Tuners/Discvover

**Method：** GET

**接口描述：** Discover tuners.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| newDevicesOnly | 否 | boolean | false | Only discover new tuners. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Tuners returned. | TunerHostInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

