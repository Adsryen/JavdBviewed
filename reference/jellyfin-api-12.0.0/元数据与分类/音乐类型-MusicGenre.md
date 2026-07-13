# 音乐类型（MusicGenre）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：元数据与分类
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：1

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/MusicGenres/{genreName}` | GetMusicGenre | Gets a music genre, by name. |

---

## GetMusicGenre

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/{genreName}

**Method：** GET

**接口描述：** Gets a music genre, by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| genreName | 是 | string |  | The genre name. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | BaseItemDto |
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

