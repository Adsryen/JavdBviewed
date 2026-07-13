# Schema 类型索引（Jellyfin 12.0.0）

> 来自 OpenAPI components.schemas，共 357 个类型。

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `AccessSchedule` | object | An entity representing a user's access schedule. |
| `ActivityLogEntry` | object | An activity log entry. |
| `ActivityLogEntryMessage` | object | Activity log created message. |
| `ActivityLogEntryQueryResult` | object | Query result container. |
| `ActivityLogEntryStartMessage` | object | Activity log entry start message.
Data is the timing data encoded as "$initialDelay,$interval" in ms. |
| `ActivityLogEntryStopMessage` | object | Activity log entry stop message. |
| `ActivityLogSortBy` | string | Activity log sorting options. |
| `AddVirtualFolderDto` | object | Add virtual folder dto. |
| `AlbumInfo` | object |  |
| `AlbumInfoRemoteSearchQuery` | object |  |
| `AllThemeMediaResult` | object |  |
| `ArtistInfo` | object |  |
| `ArtistInfoRemoteSearchQuery` | object |  |
| `AudioSpatialFormat` | string | An enum representing formats of spatial audio. |
| `AuthenticateUserByName` | object | The authenticate user by name request body. |
| `AuthenticationInfo` | object |  |
| `AuthenticationInfoQueryResult` | object | Query result container. |
| `AuthenticationResult` | object | A class representing an authentication result. |
| `BackupManifestDto` | object | Manifest type for backups internal structure. |
| `BackupOptionsDto` | object | Defines the optional contents of the backup archive. |
| `BackupRestoreRequestDto` | object | Defines properties used to start a restore process. |
| `BaseItemDto` | object | This is strictly used as a data transfer object from the api layer.
This holds information about a BaseItem in a format that is convenient for the client. |
| `BaseItemDtoQueryResult` | object | Query result container. |
| `BaseItemKind` | string | The base item kind. |
| `BaseItemPerson` | object | This is used by the api to get information about a Person within a BaseItem. |
| `BasePluginConfiguration` | object | Class BasePluginConfiguration. |
| `BookInfo` | object |  |
| `BookInfoRemoteSearchQuery` | object |  |
| `BoxSetInfo` | object |  |
| `BoxSetInfoRemoteSearchQuery` | object |  |
| `BrandingOptionsDto` | object | The branding options DTO for API use.
This DTO excludes SplashscreenLocation to prevent it from being updated via API. |
| `BufferRequestDto` | object | Class BufferRequestDto. |
| `CastReceiverApplication` | object | The cast receiver application model. |
| `ChannelFeatures` | object |  |
| `ChannelItemSortField` | string |  |
| `ChannelMappingOptionsDto` | object | Channel mapping options dto. |
| `ChannelMediaContentType` | string |  |
| `ChannelMediaType` | string |  |
| `ChannelType` | string | Enum ChannelType. |
| `ChapterInfo` | object | Class ChapterInfo. |
| `ClientCapabilitiesDto` | object | Client capabilities dto. |
| `ClientLogDocumentResponseDto` | object | Client log document response dto. |
| `CodecProfile` | object | Defines the MediaBrowser.Model.Dlna.CodecProfile. |
| `CodecType` | string |  |
| `CollectionCreationResult` | object |  |
| `CollectionType` | string | Collection type. |
| `CollectionTypeOptions` | string | The collection type options. |
| `ConfigurationPageInfo` | object | The configuration page info. |
| `ContainerProfile` | object | Defines the MediaBrowser.Model.Dlna.ContainerProfile. |
| `CountryInfo` | object | Class CountryInfo. |
| `CreatePlaylistDto` | object | Create new playlist dto. |
| `CreateUserByName` | object | The create user by name request body. |
| `CultureDto` | object | Class CultureDto. |
| `CustomDatabaseOption` | object | The custom value option for custom database providers. |
| `CustomDatabaseOptions` | object | Defines the options for a custom database connector. |
| `DatabaseConfigurationOptions` | object | Options to configure jellyfins managed database. |
| `DatabaseLockingBehaviorTypes` | string | Defines all possible methods for locking database access for concurrent queries. |
| `DayOfWeek` | string |  |
| `DayPattern` | string |  |
| `DefaultDirectoryBrowserInfoDto` | object | Default directory browser info. |
| `DeinterlaceMethod` | string | Enum containing deinterlace methods. |
| `DeviceInfoDto` | object | A DTO representing device information. |
| `DeviceInfoDtoQueryResult` | object | Query result container. |
| `DeviceOptionsDto` | object | A dto representing custom options for a device. |
| `DeviceProfile` | object | A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.


Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
<see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
the device is able to direct play (without transcoding or remuxing),
as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't. |
| `DirectPlayProfile` | object | Defines the MediaBrowser.Model.Dlna.DirectPlayProfile. |
| `DisplayPreferencesDto` | object | Defines the display preferences for any item that supports them (usually Folders). |
| `DlnaProfileType` | string |  |
| `DownMixStereoAlgorithms` | string | An enum representing an algorithm to downmix surround sound to stereo. |
| `DynamicDayOfWeek` | string | An enum that represents a day of the week, weekdays, weekends, or all days. |
| `EmbeddedSubtitleOptions` | string | An enum representing the options to disable embedded subs. |
| `EncoderPreset` | string | Enum containing encoder presets. |
| `EncodingContext` | string |  |
| `EncodingOptions` | object | Class EncodingOptions. |
| `EndPointInfo` | object |  |
| `ExternalIdInfo` | object | Represents the external id information for serialization to the client. |
| `ExternalIdMediaType` | string | The specific media type of an MediaBrowser.Model.Providers.ExternalIdInfo. |
| `ExternalUrl` | object |  |
| `ExtraType` | string |  |
| `FileSystemEntryInfo` | object | Class FileSystemEntryInfo. |
| `FileSystemEntryType` | string | Enum FileSystemEntryType. |
| `FolderStorageDto` | object | Contains information about a specific folder. |
| `FontFile` | object | Class FontFile. |
| `ForceKeepAliveMessage` | object | Force keep alive websocket messages. |
| `ForgotPasswordAction` | string |  |
| `ForgotPasswordDto` | object | Forgot Password request body DTO. |
| `ForgotPasswordPinDto` | object | Forgot Password Pin enter request body DTO. |
| `ForgotPasswordResult` | object |  |
| `GeneralCommand` | object |  |
| `GeneralCommandMessage` | object | General command websocket message. |
| `GeneralCommandType` | string | This exists simply to identify a set of known commands. |
| `GetProgramsDto` | object | Get programs dto. |
| `GroupInfoDto` | object | Class GroupInfoDto. |
| `GroupQueueMode` | string | Enum GroupQueueMode. |
| `GroupRepeatMode` | string | Enum GroupRepeatMode. |
| `GroupShuffleMode` | string | Enum GroupShuffleMode. |
| `GroupStateType` | string | Enum GroupState. |
| `GroupStateUpdate` | object | Class GroupStateUpdate. |
| `GroupUpdate` | object | Represents the list of possible group update types |
| `GroupUpdateType` | string | Enum GroupUpdateType. |
| `GuideInfo` | object |  |
| `HardwareAccelerationType` | string | Enum containing hardware acceleration types. |
| `HlsAudioSeekStrategy` | string | An enum representing the options to seek the input audio stream when
transcoding HLS segments. |
| `IgnoreWaitRequestDto` | object | Class IgnoreWaitRequestDto. |
| `ImageFormat` | string | Enum ImageOutputFormat. |
| `ImageInfo` | object | Class ImageInfo. |
| `ImageOption` | object |  |
| `ImageOrientation` | string |  |
| `ImageProviderInfo` | object | Class ImageProviderInfo. |
| `ImageResolution` | string | Enum ImageResolution. |
| `ImageSavingConvention` | string |  |
| `ImageType` | string | Enum ImageType. |
| `InboundKeepAliveMessage` | object | Keep alive websocket messages. |
| `InboundWebSocketMessage` | object | Represents the list of possible inbound websocket types |
| `InstallationInfo` | object | Class InstallationInfo. |
| `IPlugin` | object | Defines the MediaBrowser.Common.Plugins.IPlugin. |
| `IsoType` | string | Enum IsoType. |
| `ItemCounts` | object | Class LibrarySummary. |
| `ItemFields` | string | Used to control the data that gets attached to DtoBaseItems. |
| `ItemFilter` | string | Enum ItemFilter. |
| `ItemSortBy` | string | These represent sort orders. |
| `JoinGroupRequestDto` | object | Class JoinGroupRequestDto. |
| `KeepUntil` | string |  |
| `LibraryChangedMessage` | object | Library changed message. |
| `LibraryOptionInfoDto` | object | Library option info dto. |
| `LibraryOptions` | object |  |
| `LibraryOptionsResultDto` | object | Library options result dto. |
| `LibraryStorageDto` | object | Contains informations about a libraries storage informations. |
| `LibraryTypeOptionsDto` | object | Library type options dto. |
| `LibraryUpdateInfo` | object | Class LibraryUpdateInfo. |
| `ListingsProviderInfo` | object |  |
| `LiveStreamResponse` | object |  |
| `LiveTvInfo` | object |  |
| `LiveTvOptions` | object |  |
| `LiveTvServiceInfo` | object | Class ServiceInfo. |
| `LiveTvServiceStatus` | string |  |
| `LocalizationOption` | object |  |
| `LocationType` | string | Enum LocationType. |
| `LogFile` | object |  |
| `LogLevel` | string |  |
| `LyricDto` | object | LyricResponse model. |
| `LyricLine` | object | Lyric model. |
| `LyricLineCue` | object | LyricLineCue model, holds information about the timing of words within a LyricLine. |
| `LyricMetadata` | object | LyricMetadata model. |
| `MediaAttachment` | object | Class MediaAttachment. |
| `MediaPathDto` | object | Media Path dto. |
| `MediaPathInfo` | object |  |
| `MediaProtocol` | string |  |
| `MediaSegmentDto` | object | Api model for MediaSegment's. |
| `MediaSegmentDtoQueryResult` | object | Query result container. |
| `MediaSegmentType` | string | Defines the types of content an individual Jellyfin.Database.Implementations.Entities.MediaSegment represents. |
| `MediaSourceInfo` | object |  |
| `MediaSourceType` | string |  |
| `MediaStream` | object | Class MediaStream. |
| `MediaStreamProtocol` | string | Media streaming protocol.
Lowercase for backwards compatibility. |
| `MediaStreamType` | string | Enum MediaStreamType. |
| `MediaType` | string | Media types. |
| `MediaUpdateInfoDto` | object | Media Update Info Dto. |
| `MediaUpdateInfoPathDto` | object | The media update info path. |
| `MediaUrl` | object |  |
| `MessageCommand` | object |  |
| `MetadataConfiguration` | object |  |
| `MetadataEditorInfo` | object | A class representing metadata editor information. |
| `MetadataField` | string | Enum MetadataFields. |
| `MetadataOptions` | object | Class MetadataOptions. |
| `MetadataRefreshMode` | string |  |
| `MovePlaylistItemRequestDto` | object | Class MovePlaylistItemRequestDto. |
| `MovieInfo` | object |  |
| `MovieInfoRemoteSearchQuery` | object |  |
| `MusicVideoInfo` | object |  |
| `MusicVideoInfoRemoteSearchQuery` | object |  |
| `NameGuidPair` | object |  |
| `NameIdPair` | object |  |
| `NameValuePair` | object |  |
| `NetworkConfiguration` | object | Defines the MediaBrowser.Common.Net.NetworkConfiguration. |
| `NewGroupRequestDto` | object | Class NewGroupRequestDto. |
| `NextItemRequestDto` | object | Class NextItemRequestDto. |
| `OpenLiveStreamDto` | object | Open live stream dto. |
| `OutboundKeepAliveMessage` | object | Keep alive websocket messages. |
| `OutboundWebSocketMessage` | object | Represents the list of possible outbound websocket types |
| `PackageInfo` | object | Class PackageInfo. |
| `ParentalRating` | object | Class ParentalRating. |
| `ParentalRatingScore` | object | A class representing an parental rating score. |
| `PathSubstitution` | object | Defines the MediaBrowser.Model.Configuration.PathSubstitution. |
| `PersonKind` | string | The person kind. |
| `PersonLookupInfo` | object |  |
| `PersonLookupInfoRemoteSearchQuery` | object |  |
| `PingRequestDto` | object | Class PingRequestDto. |
| `PinRedeemResult` | object |  |
| `PlayAccess` | string |  |
| `PlaybackErrorCode` | string |  |
| `PlaybackInfoDto` | object | Playback info dto. |
| `PlaybackInfoResponse` | object | Class PlaybackInfoResponse. |
| `PlaybackOrder` | string | Enum PlaybackOrder. |
| `PlaybackProgressInfo` | object | Class PlaybackProgressInfo. |
| `PlaybackRequestType` | string | Enum PlaybackRequestType. |
| `PlaybackStartInfo` | object | Class PlaybackStartInfo. |
| `PlaybackStopInfo` | object | Class PlaybackStopInfo. |
| `PlayCommand` | string | Enum PlayCommand. |
| `PlayerStateInfo` | object |  |
| `PlaylistCreationResult` | object |  |
| `PlaylistDto` | object | DTO for playlists. |
| `PlaylistUserPermissions` | object | Class to hold data on user permissions for playlists. |
| `PlayMessage` | object | Play command websocket message. |
| `PlayMethod` | string |  |
| `PlayQueueUpdate` | object | Class PlayQueueUpdate. |
| `PlayQueueUpdateReason` | string | Enum PlayQueueUpdateReason. |
| `PlayRequest` | object | Class PlayRequest. |
| `PlayRequestDto` | object | Class PlayRequestDto. |
| `PlaystateCommand` | string | Enum PlaystateCommand. |
| `PlaystateMessage` | object | Playstate message. |
| `PlaystateRequest` | object |  |
| `PluginInfo` | object | This is a serializable stub class that is used by the api to provide information about installed plugins. |
| `PluginInstallationCancelledMessage` | object | Plugin installation cancelled message. |
| `PluginInstallationCompletedMessage` | object | Plugin installation completed message. |
| `PluginInstallationFailedMessage` | object | Plugin installation failed message. |
| `PluginInstallingMessage` | object | Package installing message. |
| `PluginStatus` | string | Plugin load status. |
| `PluginUninstalledMessage` | object | Plugin uninstalled message. |
| `PreviousItemRequestDto` | object | Class PreviousItemRequestDto. |
| `ProblemDetails` | object |  |
| `ProcessPriorityClass` | string |  |
| `ProfileCondition` | object |  |
| `ProfileConditionType` | string |  |
| `ProfileConditionValue` | string |  |
| `ProgramAudio` | string |  |
| `PublicSystemInfo` | object |  |
| `QueryFilters` | object |  |
| `QueryFiltersLegacy` | object |  |
| `QueueItem` | object |  |
| `QueueRequestDto` | object | Class QueueRequestDto. |
| `QuickConnectDto` | object | The quick connect request body. |
| `QuickConnectResult` | object | Stores the state of an quick connect request. |
| `RatingType` | string |  |
| `ReadyRequestDto` | object | Class ReadyRequest. |
| `RecommendationDto` | object |  |
| `RecommendationType` | string |  |
| `RecordingStatus` | string |  |
| `RefreshProgressMessage` | object | Refresh progress message. |
| `RemoteImageInfo` | object | Class RemoteImageInfo. |
| `RemoteImageResult` | object | Class RemoteImageResult. |
| `RemoteLyricInfoDto` | object | The remote lyric info dto. |
| `RemoteSearchResult` | object |  |
| `RemoteSubtitleInfo` | object |  |
| `RemoveFromPlaylistRequestDto` | object | Class RemoveFromPlaylistRequestDto. |
| `RepeatMode` | string |  |
| `RepositoryInfo` | object | Class RepositoryInfo. |
| `RestartRequiredMessage` | object | Restart required. |
| `ScheduledTaskEndedMessage` | object | Scheduled task ended message. |
| `ScheduledTasksInfoMessage` | object | Scheduled tasks info message. |
| `ScheduledTasksInfoStartMessage` | object | Scheduled tasks info start message.
Data is the timing data encoded as "$initialDelay,$interval" in ms. |
| `ScheduledTasksInfoStopMessage` | object | Scheduled tasks info stop message. |
| `ScrollDirection` | string | An enum representing the axis that should be scrolled. |
| `SearchHint` | object | Class SearchHintResult. |
| `SearchHintResult` | object | Class SearchHintResult. |
| `SeekRequestDto` | object | Class SeekRequestDto. |
| `SendCommand` | object | Class SendCommand. |
| `SendCommandType` | string | Enum SendCommandType. |
| `SeriesInfo` | object |  |
| `SeriesInfoRemoteSearchQuery` | object |  |
| `SeriesStatus` | string | The status of a series. |
| `SeriesTimerCancelledMessage` | object | Series timer cancelled message. |
| `SeriesTimerCreatedMessage` | object | Series timer created message. |
| `SeriesTimerInfoDto` | object | Class SeriesTimerInfoDto. |
| `SeriesTimerInfoDtoQueryResult` | object | Query result container. |
| `ServerConfiguration` | object | Represents the server configuration. |
| `ServerDiscoveryInfo` | object | The server discovery info model. |
| `ServerRestartingMessage` | object | Server restarting down message. |
| `ServerShuttingDownMessage` | object | Server shutting down message. |
| `SessionInfoDto` | object | Session info DTO. |
| `SessionMessageType` | string | The different kinds of messages that are used in the WebSocket api. |
| `SessionsMessage` | object | Sessions message. |
| `SessionsStartMessage` | object | Sessions start message.
Data is the timing data encoded as "$initialDelay,$interval" in ms. |
| `SessionsStopMessage` | object | Sessions stop message. |
| `SessionUserInfo` | object | Class SessionUserInfo. |
| `SetChannelMappingDto` | object | Set channel mapping dto. |
| `SetPlaylistItemRequestDto` | object | Class SetPlaylistItemRequestDto. |
| `SetRepeatModeRequestDto` | object | Class SetRepeatModeRequestDto. |
| `SetShuffleModeRequestDto` | object | Class SetShuffleModeRequestDto. |
| `SongInfo` | object |  |
| `SortOrder` | string | An enum representing the sorting order. |
| `SpecialViewOptionDto` | object | Special view option dto. |
| `StartupConfigurationDto` | object | The startup configuration DTO. |
| `StartupRemoteAccessDto` | object | Startup remote access dto. |
| `StartupUserDto` | object | The startup user DTO. |
| `SubtitleDeliveryMethod` | string | Delivery method to use during playback of a specific subtitle format. |
| `SubtitlePlaybackMode` | string | An enum representing a subtitle playback mode. |
| `SubtitleProfile` | object | A class for subtitle profile information. |
| `SyncPlayCommandMessage` | object | Sync play command. |
| `SyncPlayGroupDoesNotExistUpdate` | object |  |
| `SyncPlayGroupJoinedUpdate` | object |  |
| `SyncPlayGroupLeftUpdate` | object |  |
| `SyncPlayGroupUpdateMessage` | object | Untyped sync play command. |
| `SyncPlayLibraryAccessDeniedUpdate` | object |  |
| `SyncPlayNotInGroupUpdate` | object |  |
| `SyncPlayPlayQueueUpdate` | object |  |
| `SyncPlayQueueItem` | object | Class QueueItem. |
| `SyncPlayStateUpdate` | object |  |
| `SyncPlayUserAccessType` | string | Enum SyncPlayUserAccessType. |
| `SyncPlayUserJoinedUpdate` | object |  |
| `SyncPlayUserLeftUpdate` | object |  |
| `SystemInfo` | object | Class SystemInfo. |
| `SystemStorageDto` | object | Contains informations about the systems storage. |
| `TaskCompletionStatus` | string | Enum TaskCompletionStatus. |
| `TaskInfo` | object | Class TaskInfo. |
| `TaskResult` | object | Class TaskExecutionInfo. |
| `TaskState` | string | Enum TaskState. |
| `TaskTriggerInfo` | object | Class TaskTriggerInfo. |
| `TaskTriggerInfoType` | string | Enum TaskTriggerInfoType. |
| `ThemeMediaResult` | object | Class ThemeMediaResult. |
| `TimerCancelledMessage` | object | Timer cancelled message. |
| `TimerCreatedMessage` | object | Timer created message. |
| `TimerEventInfo` | object |  |
| `TimerInfoDto` | object |  |
| `TimerInfoDtoQueryResult` | object | Query result container. |
| `TonemappingAlgorithm` | string | Enum containing tonemapping algorithms. |
| `TonemappingMode` | string | Enum containing tonemapping modes. |
| `TonemappingRange` | string | Enum containing tonemapping ranges. |
| `TrailerInfo` | object |  |
| `TrailerInfoRemoteSearchQuery` | object |  |
| `TranscodeReason` | string |  |
| `TranscodeSeekInfo` | string |  |
| `TranscodingInfo` | object | Class holding information on a running transcode. |
| `TranscodingProfile` | object | A class for transcoding profile information.
Note for client developers: Conditions defined in MediaBrowser.Model.Dlna.CodecProfile has higher priority and can override values defined here. |
| `TransportStreamTimestamp` | string |  |
| `TrickplayInfoDto` | object | The trickplay api model. |
| `TrickplayOptions` | object | Class TrickplayOptions. |
| `TrickplayScanBehavior` | string | Enum TrickplayScanBehavior. |
| `TunerChannelMapping` | object |  |
| `TunerHostInfo` | object |  |
| `TypeOptions` | object |  |
| `UnratedItem` | string | An enum representing an unrated item. |
| `UpdateLibraryOptionsDto` | object | Update library options dto. |
| `UpdateMediaPathRequestDto` | object | Update library options dto. |
| `UpdatePlaylistDto` | object | Update existing playlist dto. Fields set to `null` will not be updated and keep their current values. |
| `UpdatePlaylistUserDto` | object | Update existing playlist user dto. Fields set to `null` will not be updated and keep their current values. |
| `UpdateUserItemDataDto` | object | This is used by the api to get information about a item user data. |
| `UpdateUserPassword` | object | The update user password request body. |
| `UploadSubtitleDto` | object | Upload subtitles dto. |
| `UserConfiguration` | object | Class UserConfiguration. |
| `UserDataChangedMessage` | object | User data changed message. |
| `UserDataChangeInfo` | object | Class UserDataChangeInfo. |
| `UserDeletedMessage` | object | User deleted message. |
| `UserDto` | object | Class UserDto. |
| `UserItemDataDto` | object | Class UserItemDataDto. |
| `UserPolicy` | object |  |
| `UserUpdatedMessage` | object | User updated message. |
| `UtcTimeResponse` | object | Class UtcTimeResponse. |
| `ValidatePathDto` | object | Validate path object. |
| `VersionInfo` | object | Defines the MediaBrowser.Model.Updates.VersionInfo class. |
| `Video3DFormat` | string |  |
| `VideoRange` | string | An enum representing video ranges. |
| `VideoRangeType` | string | An enum representing types of video ranges. |
| `VideoType` | string | Enum VideoType. |
| `VirtualFolderInfo` | object | Used to hold information about a user's list of configured virtual folders. |
| `WebSocketMessage` | object | Represents the possible websocket types |
| `XbmcMetadataOptions` | object |  |

## 字段详情

### AccessSchedule

An entity representing a user's access schedule.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets the id of this instance. |
| UserId | string | Gets the id of the associated user. |
| DayOfWeek | string enum(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Everyday|Weekday|Weekend) | Gets or sets the day of week. |
| StartHour | number | Gets or sets the start hour. |
| EndHour | number | Gets or sets the end hour. |

### ActivityLogEntry

An activity log entry.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets or sets the identifier. |
| Name | string | Gets or sets the name. |
| Overview | string|null | Gets or sets the overview. |
| ShortOverview | string|null | Gets or sets the short overview. |
| Type | string | Gets or sets the type. |
| ItemId | string|null | Gets or sets the item identifier. |
| Date | string | Gets or sets the date. |
| UserId | string | Gets or sets the user identifier. |
| UserPrimaryImageTag | string|null | Gets or sets the user primary image tag. |
| Severity | string enum(Trace|Debug|Information|Warning|Error|Critical|None) | Gets or sets the log severity. |

### ActivityLogEntryMessage

Activity log created message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | ActivityLogEntry[] | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ActivityLogEntryQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | ActivityLogEntry[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### ActivityLogEntryStartMessage

Activity log entry start message.
Data is the timing data encoded as "$initialDelay,$interval" in ms.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | string|null | Gets or sets the data. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ActivityLogEntryStopMessage

Activity log entry stop message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ActivityLogSortBy

Activity log sorting options.

枚举值：`Name`, `Overiew`, `ShortOverview`, `Type`, `DateCreated`, `Username`, `LogSeverity`

### AddVirtualFolderDto

Add virtual folder dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LibraryOptions | LibraryOptions | Gets or sets library options. |

### AlbumInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |
| AlbumArtists | string[] | Gets or sets the album artist. |
| ArtistProviderIds | object | Gets or sets the artist provider ids. |
| SongInfos | SongInfo[] |  |

### AlbumInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | AlbumInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### AllThemeMediaResult

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ThemeVideosResult | ThemeMediaResult | Class ThemeMediaResult. |
| ThemeSongsResult | ThemeMediaResult | Class ThemeMediaResult. |
| SoundtrackSongsResult | ThemeMediaResult | Class ThemeMediaResult. |

### ArtistInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |
| SongInfos | SongInfo[] |  |

### ArtistInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | ArtistInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### AudioSpatialFormat

An enum representing formats of spatial audio.

枚举值：`None`, `DolbyAtmos`, `DTSX`

### AuthenticateUserByName

The authenticate user by name request body.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Username | string|null | Gets or sets the username. |
| Pw | string|null | Gets or sets the plain text password. |

### AuthenticationInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets or sets the identifier. |
| AccessToken | string|null | Gets or sets the access token. |
| DeviceId | string|null | Gets or sets the device identifier. |
| AppName | string|null | Gets or sets the name of the application. |
| AppVersion | string|null | Gets or sets the application version. |
| DeviceName | string|null | Gets or sets the name of the device. |
| UserId | string | Gets or sets the user identifier. |
| IsActive | boolean | Gets or sets a value indicating whether this instance is active. |
| DateCreated | string | Gets or sets the date created. |
| DateRevoked | string|null | Gets or sets the date revoked. |
| DateLastActivity | string |  |
| UserName | string|null |  |

### AuthenticationInfoQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | AuthenticationInfo[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### AuthenticationResult

A class representing an authentication result.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto | Class UserDto. |
| SessionInfo | SessionInfoDto | Session info DTO. |
| AccessToken | string|null | Gets or sets the access token. |
| ServerId | string|null | Gets or sets the server id. |

### BackupManifestDto

Manifest type for backups internal structure.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |

### BackupOptionsDto

Defines the optional contents of the backup archive.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | boolean | Gets or sets a value indicating whether the archive contains the Metadata contents. |
| Trickplay | boolean | Gets or sets a value indicating whether the archive contains the Trickplay contents. |
| Subtitles | boolean | Gets or sets a value indicating whether the archive contains the Subtitle contents. |
| Database | boolean | Gets or sets a value indicating whether the archive contains the Database contents. |

### BackupRestoreRequestDto

Defines properties used to start a restore process.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ArchiveFileName | string | Gets or Sets the name of the backup archive to restore from. Must be present in MediaBrowser.Common.Configuration.IApplicationPaths.BackupPath. |

### BaseItemDto

This is strictly used as a data transfer object from the api layer.
This holds information about a BaseItem in a format that is convenient for the client.

| 字段 | 类型 | 备注 |
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

### BaseItemDtoQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### BaseItemKind

The base item kind.

枚举值：`AggregateFolder`, `Audio`, `AudioBook`, `BasePluginFolder`, `Book`, `BoxSet`, `Channel`, `ChannelFolderItem`, `CollectionFolder`, `Episode`, `Folder`, `Genre`, `ManualPlaylistsFolder`, `Movie`, `LiveTvChannel`, `LiveTvProgram`, `MusicAlbum`, `MusicArtist`, `MusicGenre`, `MusicVideo`, `Person`, `Photo`, `PhotoAlbum`, `Playlist`, `PlaylistsFolder`, `Program`, `Recording`, `Season`, `Series`, `Studio`, `Trailer`, `TvChannel`, `TvProgram`, `UserRootFolder`, `UserView`, `Video`, `Year`

### BaseItemPerson

This is used by the api to get information about a Person within a BaseItem.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Id | string | Gets or sets the identifier. |
| Role | string|null | Gets or sets the role. |
| Type | string enum(Unknown|Actor|Director|Composer|Writer|GuestStar|Producer|Conductor|Lyricist|Arranger|Engineer|Mixer|Remixer|Creator|Artist|AlbumArtist|Author|Illustrator|Penciller|Inker|Colorist|Letterer|CoverArtist|Editor|Translator|Narrator) | The person kind. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| ImageBlurHashes | object|null | Gets or sets the primary image blurhash. |

### BasePluginConfiguration

Class BasePluginConfiguration.

基础类型：`object`

### BookInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |
| SeriesName | string|null |  |

### BookInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | BookInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### BoxSetInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |

### BoxSetInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | BoxSetInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### BrandingOptionsDto

The branding options DTO for API use.
This DTO excludes SplashscreenLocation to prevent it from being updated via API.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LoginDisclaimer | string|null | Gets or sets the login disclaimer. |
| CustomCss | string|null | Gets or sets the custom CSS. |
| SplashscreenEnabled | boolean | Gets or sets a value indicating whether to enable the splashscreen. |

### BufferRequestDto

Class BufferRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| When | string | Gets or sets when the request has been made by the client. |
| PositionTicks | integer | Gets or sets the position ticks. |
| IsPlaying | boolean | Gets or sets a value indicating whether the client playback is unpaused. |
| PlaylistItemId | string | Gets or sets the playlist item identifier of the playing item. |

### CastReceiverApplication

The cast receiver application model.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string | Gets or sets the cast receiver application id. |
| Name | string | Gets or sets the cast receiver application name. |

### ChannelFeatures

| 字段 | 类型 | 备注 |
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

### ChannelItemSortField

枚举值：`Name`, `CommunityRating`, `PremiereDate`, `DateCreated`, `Runtime`, `PlayCount`, `CommunityPlayCount`

### ChannelMappingOptionsDto

Channel mapping options dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TunerChannels | TunerChannelMapping[] | Gets or sets list of tuner channels. |
| ProviderChannels | NameIdPair[] | Gets or sets list of provider channels. |
| Mappings | NameValuePair[] | Gets or sets list of mappings. |
| ProviderName | string|null | Gets or sets provider name. |

### ChannelMediaContentType

枚举值：`Clip`, `Podcast`, `Trailer`, `Movie`, `Episode`, `Song`, `MovieExtra`, `TvExtra`

### ChannelMediaType

枚举值：`Audio`, `Video`, `Photo`

### ChannelType

Enum ChannelType.

枚举值：`TV`, `Radio`

### ChapterInfo

Class ChapterInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| StartPositionTicks | integer | Gets or sets the start position ticks. |
| Name | string|null | Gets or sets the name. |
| ImagePath | string|null | Gets or sets the image path. |
| ImageDateModified | string |  |
| ImageTag | string|null |  |

### ClientCapabilitiesDto

Client capabilities dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlayableMediaTypes | MediaType[] | Gets or sets the list of playable media types. |
| SupportedCommands | GeneralCommandType[] | Gets or sets the list of supported commands. |
| SupportsMediaControl | boolean | Gets or sets a value indicating whether session supports media control. |
| SupportsPersistentIdentifier | boolean | Gets or sets a value indicating whether session supports a persistent identifier. |
| DeviceProfile | DeviceProfile | Gets or sets the device profile. |
| AppStoreUrl | string|null | Gets or sets the app store url. |
| IconUrl | string|null | Gets or sets the icon url. |

### ClientLogDocumentResponseDto

Client log document response dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| FileName | string | Gets the resulting filename. |

### CodecProfile

Defines the MediaBrowser.Model.Dlna.CodecProfile.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | string enum(Video|VideoAudio|Audio) | Gets or sets the MediaBrowser.Model.Dlna.CodecType which this container must meet. |
| Conditions | ProfileCondition[] | Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition which this profile must meet. |
| ApplyConditions | ProfileCondition[] | Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition to apply if this profile is met. |
| Codec | string|null | Gets or sets the codec(s) that this profile applies to. |
| Container | string|null | Gets or sets the container(s) which this profile will be applied to. |
| SubContainer | string|null | Gets or sets the sub-container(s) which this profile will be applied to. |

### CodecType

枚举值：`Video`, `VideoAudio`, `Audio`

### CollectionCreationResult

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |

### CollectionType

Collection type.

枚举值：`unknown`, `movies`, `tvshows`, `music`, `musicvideos`, `trailers`, `homevideos`, `boxsets`, `books`, `photos`, `livetv`, `playlists`, `folders`

### CollectionTypeOptions

The collection type options.

枚举值：`movies`, `tvshows`, `music`, `musicvideos`, `homevideos`, `boxsets`, `books`, `mixed`

### ConfigurationPageInfo

The configuration page info.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name. |
| EnableInMainMenu | boolean | Gets or sets a value indicating whether the configurations page is enabled in the main menu. |
| MenuSection | string|null | Gets or sets the menu section. |
| MenuIcon | string|null | Gets or sets the menu icon. |
| DisplayName | string|null | Gets or sets the display name. |
| PluginId | string|null | Gets or sets the plugin id. |

### ContainerProfile

Defines the MediaBrowser.Model.Dlna.ContainerProfile.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | string enum(Audio|Video|Photo|Subtitle|Lyric) | Gets or sets the MediaBrowser.Model.Dlna.DlnaProfileType which this container must meet. |
| Conditions | ProfileCondition[] | Gets or sets the list of MediaBrowser.Model.Dlna.ProfileCondition which this container will be applied to. |
| Container | string|null | Gets or sets the container(s) which this container must meet. |
| SubContainer | string|null | Gets or sets the sub container(s) which this container must meet. |

### CountryInfo

Class CountryInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| DisplayName | string|null | Gets or sets the display name. |
| TwoLetterISORegionName | string|null | Gets or sets the name of the two letter ISO region. |
| ThreeLetterISORegionName | string|null | Gets or sets the name of the three letter ISO region. |

### CreatePlaylistDto

Create new playlist dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name of the new playlist. |
| Ids | string[] | Gets or sets item ids to add to the playlist. |
| UserId | string|null | Gets or sets the user id. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Gets or sets the media type. |
| Users | PlaylistUserPermissions[] | Gets or sets the playlist users. |
| IsPublic | boolean | Gets or sets a value indicating whether the playlist is public. |

### CreateUserByName

The create user by name request body.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the username. |
| Password | string|null | Gets or sets the password. |

### CultureDto

Class CultureDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets the name. |
| DisplayName | string | Gets the display name. |
| TwoLetterISOLanguageName | string | Gets the name of the two letter ISO language. |
| ThreeLetterISOLanguageName | string|null | Gets the name of the three letter ISO language. |
| ThreeLetterISOLanguageNames | string[] |  |

### CustomDatabaseOption

The custom value option for custom database providers.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Key | string | Gets or sets the key of the value. |
| Value | string | Gets or sets the value. |

### CustomDatabaseOptions

Defines the options for a custom database connector.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PluginName | string | Gets or sets the Plugin name to search for database providers. |
| PluginAssembly | string | Gets or sets the plugin assembly to search for providers. |
| ConnectionString | string | Gets or sets the connection string for the custom database provider. |
| Options | CustomDatabaseOption[] | Gets or sets the list of extra options for the custom provider. |

### DatabaseConfigurationOptions

Options to configure jellyfins managed database.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| DatabaseType | string | Gets or Sets the type of database jellyfin should use. |
| CustomProviderOptions | CustomDatabaseOptions | Gets or sets the options required to use a custom database provider. |
| LockingBehavior | string enum(NoLock|Pessimistic|Optimistic) | Gets or Sets the kind of locking behavior jellyfin should perform. Possible options are "NoLock", "Pessimistic", "Optimistic".
Defaults to "NoLock". |

### DatabaseLockingBehaviorTypes

Defines all possible methods for locking database access for concurrent queries.

枚举值：`NoLock`, `Pessimistic`, `Optimistic`

### DayOfWeek

枚举值：`Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`

### DayPattern

枚举值：`Daily`, `Weekdays`, `Weekends`

### DefaultDirectoryBrowserInfoDto

Default directory browser info.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Path | string|null | Gets or sets the path. |

### DeinterlaceMethod

Enum containing deinterlace methods.

枚举值：`yadif`, `bwdif`

### DeviceInfoDto

A DTO representing device information.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| CustomName | string|null | Gets or sets the custom name. |
| AccessToken | string|null | Gets or sets the access token. |
| Id | string|null | Gets or sets the identifier. |
| LastUserName | string|null | Gets or sets the last name of the user. |
| AppName | string|null | Gets or sets the name of the application. |
| AppVersion | string|null | Gets or sets the application version. |
| LastUserId | string|null | Gets or sets the last user identifier. |
| DateLastActivity | string|null | Gets or sets the date last modified. |
| Capabilities | ClientCapabilitiesDto | Gets or sets the capabilities. |
| IconUrl | string|null | Gets or sets the icon URL. |

### DeviceInfoDtoQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | DeviceInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### DeviceOptionsDto

A dto representing custom options for a device.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer | Gets or sets the id. |
| DeviceId | string|null | Gets or sets the device id. |
| CustomName | string|null | Gets or sets the custom name. |

### DeviceProfile

A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.


Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
<see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
the device is able to direct play (without transcoding or remuxing),
as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name of this device profile. User profiles must have a unique name. |
| Id | string|null | Gets or sets the unique internal identifier. |
| MaxStreamingBitrate | integer|null | Gets or sets the maximum allowed bitrate for all streamed content. |
| MaxStaticBitrate | integer|null | Gets or sets the maximum allowed bitrate for statically streamed content (= direct played files). |
| MusicStreamingTranscodingBitrate | integer|null | Gets or sets the maximum allowed bitrate for transcoded music streams. |
| MaxStaticMusicBitrate | integer|null | Gets or sets the maximum allowed bitrate for statically streamed (= direct played) music files. |
| DirectPlayProfiles | DirectPlayProfile[] | Gets or sets the direct play profiles. |
| TranscodingProfiles | TranscodingProfile[] | Gets or sets the transcoding profiles. |
| ContainerProfiles | ContainerProfile[] | Gets or sets the container profiles. Failing to meet these optional conditions causes transcoding to occur. |
| CodecProfiles | CodecProfile[] | Gets or sets the codec profiles. |
| SubtitleProfiles | SubtitleProfile[] | Gets or sets the subtitle profiles. |

### DirectPlayProfile

Defines the MediaBrowser.Model.Dlna.DirectPlayProfile.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Container | string | Gets or sets the container. |
| AudioCodec | string|null | Gets or sets the audio codec. |
| VideoCodec | string|null | Gets or sets the video codec. |
| Type | string enum(Audio|Video|Photo|Subtitle|Lyric) | Gets or sets the Dlna profile type. |

### DisplayPreferencesDto

Defines the display preferences for any item that supports them (usually Folders).

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the user id. |
| ViewType | string|null | Gets or sets the type of the view. |
| SortBy | string|null | Gets or sets the sort by. |
| IndexBy | string|null | Gets or sets the index by. |
| RememberIndexing | boolean | Gets or sets a value indicating whether [remember indexing]. |
| PrimaryImageHeight | integer | Gets or sets the height of the primary image. |
| PrimaryImageWidth | integer | Gets or sets the width of the primary image. |
| CustomPrefs | object | Gets or sets the custom prefs. |
| ScrollDirection | string enum(Horizontal|Vertical) | An enum representing the axis that should be scrolled. |
| ShowBackdrop | boolean | Gets or sets a value indicating whether to show backdrops on this item. |
| RememberSorting | boolean | Gets or sets a value indicating whether [remember sorting]. |
| SortOrder | string enum(Ascending|Descending) | An enum representing the sorting order. |
| ShowSidebar | boolean | Gets or sets a value indicating whether [show sidebar]. |
| Client | string|null | Gets or sets the client. |

### DlnaProfileType

枚举值：`Audio`, `Video`, `Photo`, `Subtitle`, `Lyric`

### DownMixStereoAlgorithms

An enum representing an algorithm to downmix surround sound to stereo.

枚举值：`None`, `Dave750`, `NightmodeDialogue`, `Rfc7845`, `Ac4`

### DynamicDayOfWeek

An enum that represents a day of the week, weekdays, weekends, or all days.

枚举值：`Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Everyday`, `Weekday`, `Weekend`

### EmbeddedSubtitleOptions

An enum representing the options to disable embedded subs.

枚举值：`AllowAll`, `AllowText`, `AllowImage`, `AllowNone`

### EncoderPreset

Enum containing encoder presets.

枚举值：`auto`, `placebo`, `veryslow`, `slower`, `slow`, `medium`, `fast`, `faster`, `veryfast`, `superfast`, `ultrafast`

### EncodingContext

枚举值：`Streaming`, `Static`

### EncodingOptions

Class EncodingOptions.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EncodingThreadCount | integer | Gets or sets the thread count used for encoding. |
| TranscodingTempPath | string|null | Gets or sets the temporary transcoding path. |
| FallbackFontPath | string|null | Gets or sets the path to the fallback font. |
| EnableFallbackFont | boolean | Gets or sets a value indicating whether to use the fallback font. |
| EnableAudioVbr | boolean | Gets or sets a value indicating whether audio VBR is enabled. |
| DownMixAudioBoost | number | Gets or sets the audio boost applied when downmixing audio. |
| DownMixStereoAlgorithm | string enum(None|Dave750|NightmodeDialogue|Rfc7845|Ac4) | Gets or sets the algorithm used for downmixing audio to stereo. |
| MaxMuxingQueueSize | integer | Gets or sets the maximum size of the muxing queue. |
| EnableThrottling | boolean | Gets or sets a value indicating whether throttling is enabled. |
| ThrottleDelaySeconds | integer | Gets or sets the delay after which throttling happens. |
| EnableSegmentDeletion | boolean | Gets or sets a value indicating whether segment deletion is enabled. |
| SegmentKeepSeconds | integer | Gets or sets seconds for which segments should be kept before being deleted. |
| HardwareAccelerationType | string enum(none|amf|qsv|nvenc|v4l2m2m|vaapi|videotoolbox|rkmpp) | Gets or sets the hardware acceleration type. |
| EncoderAppPath | string|null | Gets or sets the FFmpeg path as set by the user via the UI. |
| EncoderAppPathDisplay | string|null | Gets or sets the current FFmpeg path being used by the system and displayed on the transcode page. |
| VaapiDevice | string|null | Gets or sets the VA-API device. |
| QsvDevice | string|null | Gets or sets the QSV device. |
| EnableTonemapping | boolean | Gets or sets a value indicating whether tonemapping is enabled. |
| EnableVppTonemapping | boolean | Gets or sets a value indicating whether VPP tonemapping is enabled. |
| EnableVideoToolboxTonemapping | boolean | Gets or sets a value indicating whether videotoolbox tonemapping is enabled. |
| TonemappingAlgorithm | string enum(none|clip|linear|gamma|reinhard|hable|mobius|bt2390) | Gets or sets the tone-mapping algorithm. |
| TonemappingMode | string enum(auto|max|rgb|lum|itp) | Gets or sets the tone-mapping mode. |
| TonemappingRange | string enum(auto|tv|pc) | Gets or sets the tone-mapping range. |
| TonemappingDesat | number | Gets or sets the tone-mapping desaturation. |
| TonemappingPeak | number | Gets or sets the tone-mapping peak. |
| TonemappingParam | number | Gets or sets the tone-mapping parameters. |
| VppTonemappingBrightness | number | Gets or sets the VPP tone-mapping brightness. |
| VppTonemappingContrast | number | Gets or sets the VPP tone-mapping contrast. |
| H264Crf | integer | Gets or sets the H264 CRF. |
| H265Crf | integer | Gets or sets the H265 CRF. |
| EncoderPreset | string enum(auto|placebo|veryslow|slower|slow|medium|fast|faster|veryfast|superfast|ultrafast) | Gets or sets the encoder preset. |
| DeinterlaceDoubleRate | boolean | Gets or sets a value indicating whether the framerate is doubled when deinterlacing. |
| DeinterlaceMethod | string enum(yadif|bwdif) | Gets or sets the deinterlace method. |
| EnableDecodingColorDepth10Hevc | boolean | Gets or sets a value indicating whether 10bit HEVC decoding is enabled. |
| EnableDecodingColorDepth10Vp9 | boolean | Gets or sets a value indicating whether 10bit VP9 decoding is enabled. |
| EnableDecodingColorDepth10HevcRext | boolean | Gets or sets a value indicating whether 8/10bit HEVC RExt decoding is enabled. |
| EnableDecodingColorDepth12HevcRext | boolean | Gets or sets a value indicating whether 12bit HEVC RExt decoding is enabled. |
| EnableEnhancedNvdecDecoder | boolean | Gets or sets a value indicating whether the enhanced NVDEC is enabled. |
| PreferSystemNativeHwDecoder | boolean | Gets or sets a value indicating whether the system native hardware decoder should be used. |
| EnableIntelLowPowerH264HwEncoder | boolean | Gets or sets a value indicating whether the Intel H264 low-power hardware encoder should be used. |
| EnableIntelLowPowerHevcHwEncoder | boolean | Gets or sets a value indicating whether the Intel HEVC low-power hardware encoder should be used. |
| EnableHardwareEncoding | boolean | Gets or sets a value indicating whether hardware encoding is enabled. |
| AllowHevcEncoding | boolean | Gets or sets a value indicating whether HEVC encoding is enabled. |
| AllowAv1Encoding | boolean | Gets or sets a value indicating whether AV1 encoding is enabled. |
| EnableSubtitleExtraction | boolean | Gets or sets a value indicating whether subtitle extraction is enabled. |
| SubtitleExtractionTimeoutMinutes | integer | Gets or sets the timeout for subtitle extraction in minutes. |
| HardwareDecodingCodecs | string[] | Gets or sets the codecs hardware encoding is used for. |
| AllowOnDemandMetadataBasedKeyframeExtractionForExtensions | string[] | Gets or sets the file extensions on-demand metadata based keyframe extraction is enabled for. |
| HlsAudioSeekStrategy | string enum(TrimCopiedAudio|TranscodeAudio) | Gets or sets the method used for audio seeking in HLS. |

### EndPointInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IsLocal | boolean |  |
| IsInNetwork | boolean |  |

### ExternalIdInfo

Represents the external id information for serialization to the client.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the display name of the external id provider (IE: IMDB, MusicBrainz, etc). |
| Key | string | Gets or sets the unique key for this id. This key should be unique across all providers. |
| Type | string enum(Album|AlbumArtist|Artist|BoxSet|Episode|Movie|OtherArtist|Person|ReleaseGroup|Season|Series|Track|Book|Recording) | Gets or sets the specific media type for this id. This is used to distinguish between the different
external id types for providers with multiple ids.
A null value indicates there is no specific media type associated with the external id, or this is the
default id for the external provider so there is no need to specify a type. |

### ExternalIdMediaType

The specific media type of an MediaBrowser.Model.Providers.ExternalIdInfo.

枚举值：`Album`, `AlbumArtist`, `Artist`, `BoxSet`, `Episode`, `Movie`, `OtherArtist`, `Person`, `ReleaseGroup`, `Season`, `Series`, `Track`, `Book`, `Recording`

### ExternalUrl

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Url | string|null | Gets or sets the type of the item. |

### ExtraType

枚举值：`Unknown`, `Clip`, `Trailer`, `BehindTheScenes`, `DeletedScene`, `Interview`, `Scene`, `Sample`, `ThemeSong`, `ThemeVideo`, `Featurette`, `Short`

### FileSystemEntryInfo

Class FileSystemEntryInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets the name. |
| Path | string | Gets the path. |
| Type | string enum(File|Directory|NetworkComputer|NetworkShare) | Gets the type. |

### FileSystemEntryType

Enum FileSystemEntryType.

枚举值：`File`, `Directory`, `NetworkComputer`, `NetworkShare`

### FolderStorageDto

Contains information about a specific folder.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Path | string | Gets the path of the folder in question. |
| FreeSpace | integer | Gets the free space of the underlying storage device of the Jellyfin.Api.Models.SystemInfoDtos.FolderStorageDto.Path. |
| UsedSpace | integer | Gets the used space of the underlying storage device of the Jellyfin.Api.Models.SystemInfoDtos.FolderStorageDto.Path. |
| StorageType | string|null | Gets the kind of storage device of the Jellyfin.Api.Models.SystemInfoDtos.FolderStorageDto.Path. |
| DeviceId | string|null | Gets the Device Identifier. |

### FontFile

Class FontFile.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Size | integer | Gets or sets the size. |
| DateCreated | string | Gets or sets the date created. |
| DateModified | string | Gets or sets the date modified. |

### ForceKeepAliveMessage

Force keep alive websocket messages.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | integer | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ForgotPasswordAction

枚举值：`ContactAdmin`, `PinCode`, `InNetworkRequired`

### ForgotPasswordDto

Forgot Password request body DTO.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnteredUsername | string | Gets or sets the entered username to have its password reset. |

### ForgotPasswordPinDto

Forgot Password Pin enter request body DTO.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Pin | string | Gets or sets the entered pin to have the password reset. |

### ForgotPasswordResult

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Action | string enum(ContactAdmin|PinCode|InNetworkRequired) | Gets or sets the action. |
| PinFile | string|null | Gets or sets the pin file. |
| PinExpirationDate | string|null | Gets or sets the pin expiration date. |

### GeneralCommand

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string enum(MoveUp|MoveDown|MoveLeft|MoveRight|PageUp|PageDown|PreviousLetter|NextLetter|ToggleOsd|ToggleContextMenu|Select|Back|TakeScreenshot|SendKey|SendString|GoHome|GoToSettings|VolumeUp|VolumeDown|Mute|Unmute|ToggleMute|SetVolume|SetAudioStreamIndex|SetSubtitleStreamIndex|ToggleFullscreen|DisplayContent|GoToSearch|DisplayMessage|SetRepeatMode|ChannelUp|ChannelDown|Guide|ToggleStats|PlayMediaSource|PlayTrailers|SetShuffleQueue|PlayState|PlayNext|ToggleOsdMenu|Play|SetMaxStreamingBitrate|SetPlaybackOrder) | This exists simply to identify a set of known commands. |
| ControllingUserId | string |  |
| Arguments | object |  |

### GeneralCommandMessage

General command websocket message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | GeneralCommand | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### GeneralCommandType

This exists simply to identify a set of known commands.

枚举值：`MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight`, `PageUp`, `PageDown`, `PreviousLetter`, `NextLetter`, `ToggleOsd`, `ToggleContextMenu`, `Select`, `Back`, `TakeScreenshot`, `SendKey`, `SendString`, `GoHome`, `GoToSettings`, `VolumeUp`, `VolumeDown`, `Mute`, `Unmute`, `ToggleMute`, `SetVolume`, `SetAudioStreamIndex`, `SetSubtitleStreamIndex`, `ToggleFullscreen`, `DisplayContent`, `GoToSearch`, `DisplayMessage`, `SetRepeatMode`, `ChannelUp`, `ChannelDown`, `Guide`, `ToggleStats`, `PlayMediaSource`, `PlayTrailers`, `SetShuffleQueue`, `PlayState`, `PlayNext`, `ToggleOsdMenu`, `Play`, `SetMaxStreamingBitrate`, `SetPlaybackOrder`

### GetProgramsDto

Get programs dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ChannelIds | string[] | Gets or sets the channels to return guide information for. |
| UserId | string|null | Gets or sets optional. Filter by user id. |
| MinStartDate | string|null | Gets or sets the minimum premiere start date. |
| HasAired | boolean|null | Gets or sets filter by programs that have completed airing, or not. |
| IsAiring | boolean|null | Gets or sets filter by programs that are currently airing, or not. |
| MaxStartDate | string|null | Gets or sets the maximum premiere start date. |
| MinEndDate | string|null | Gets or sets the minimum premiere end date. |
| MaxEndDate | string|null | Gets or sets the maximum premiere end date. |
| IsMovie | boolean|null | Gets or sets filter for movies. |
| IsSeries | boolean|null | Gets or sets filter for series. |
| IsNews | boolean|null | Gets or sets filter for news. |
| IsKids | boolean|null | Gets or sets filter for kids. |
| IsSports | boolean|null | Gets or sets filter for sports. |
| StartIndex | integer|null | Gets or sets the record index to start at. All items with a lower index will be dropped from the results. |
| Limit | integer|null | Gets or sets the maximum number of records to return. |
| SortBy | ItemSortBy[] | Gets or sets specify one or more sort orders, comma delimited. Options: Name, StartDate. |
| SortOrder | SortOrder[] | Gets or sets sort order. |
| Genres | string[] | Gets or sets the genres to return guide information for. |
| GenreIds | string[] | Gets or sets the genre ids to return guide information for. |
| EnableImages | boolean|null | Gets or sets include image information in output. |
| EnableTotalRecordCount | boolean | Gets or sets a value indicating whether retrieve total record count. |
| ImageTypeLimit | integer|null | Gets or sets the max number of images to return, per image type. |
| EnableImageTypes | ImageType[] | Gets or sets the image types to include in the output. |
| EnableUserData | boolean|null | Gets or sets include user data. |
| SeriesTimerId | string|null | Gets or sets filter by series timer id. |
| LibrarySeriesId | string|null | Gets or sets filter by library series id. |
| Fields | ItemFields[] | Gets or sets specify additional fields of information to return in the output. |

### GroupInfoDto

Class GroupInfoDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |

### GroupQueueMode

Enum GroupQueueMode.

枚举值：`Queue`, `QueueNext`

### GroupRepeatMode

Enum GroupRepeatMode.

枚举值：`RepeatOne`, `RepeatAll`, `RepeatNone`

### GroupShuffleMode

Enum GroupShuffleMode.

枚举值：`Sorted`, `Shuffle`

### GroupStateType

Enum GroupState.

枚举值：`Idle`, `Waiting`, `Paused`, `Playing`

### GroupStateUpdate

Class GroupStateUpdate.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the state of the group. |
| Reason | string enum(Play|SetPlaylistItem|RemoveFromPlaylist|MovePlaylistItem|Queue|Unpause|Pause|Stop|Seek|Buffer|Ready|NextItem|PreviousItem|SetRepeatMode|SetShuffleMode|Ping|IgnoreWait) | Gets the reason of the state change. |

### GroupUpdate

Represents the list of possible group update types

基础类型：`object`

### GroupUpdateType

Enum GroupUpdateType.

枚举值：`UserJoined`, `UserLeft`, `GroupJoined`, `GroupLeft`, `StateUpdate`, `PlayQueue`, `NotInGroup`, `GroupDoesNotExist`, `LibraryAccessDenied`

### GuideInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| StartDate | string | Gets or sets the start date. |
| EndDate | string | Gets or sets the end date. |

### HardwareAccelerationType

Enum containing hardware acceleration types.

枚举值：`none`, `amf`, `qsv`, `nvenc`, `v4l2m2m`, `vaapi`, `videotoolbox`, `rkmpp`

### HlsAudioSeekStrategy

An enum representing the options to seek the input audio stream when
transcoding HLS segments.

枚举值：`TrimCopiedAudio`, `TranscodeAudio`

### IgnoreWaitRequestDto

Class IgnoreWaitRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IgnoreWait | boolean | Gets or sets a value indicating whether the client should be ignored. |

### ImageFormat

Enum ImageOutputFormat.

枚举值：`Bmp`, `Gif`, `Jpg`, `Png`, `Webp`, `Svg`

### ImageInfo

Class ImageInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ImageType | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) | Gets or sets the type of the image. |
| ImageIndex | integer|null | Gets or sets the index of the image. |
| ImageTag | string|null | Gets or sets the image tag. |
| Path | string|null | Gets or sets the path. |
| BlurHash | string|null | Gets or sets the blurhash. |
| Height | integer|null | Gets or sets the height. |
| Width | integer|null | Gets or sets the width. |
| Size | integer | Gets or sets the size. |

### ImageOption

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) | Gets or sets the type. |
| Limit | integer | Gets or sets the limit. |
| MinWidth | integer | Gets or sets the minimum width. |

### ImageOrientation

枚举值：`TopLeft`, `TopRight`, `BottomRight`, `BottomLeft`, `LeftTop`, `RightTop`, `RightBottom`, `LeftBottom`

### ImageProviderInfo

Class ImageProviderInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets the name. |
| SupportedImages | ImageType[] | Gets the supported image types. |

### ImageResolution

Enum ImageResolution.

枚举值：`MatchSource`, `P144`, `P240`, `P360`, `P480`, `P720`, `P1080`, `P1440`, `P2160`

### ImageSavingConvention

枚举值：`Legacy`, `Compatible`

### ImageType

Enum ImageType.

枚举值：`Primary`, `Art`, `Backdrop`, `Banner`, `Logo`, `Thumb`, `Disc`, `Box`, `Screenshot`, `Menu`, `Chapter`, `BoxRear`, `Profile`

### InboundKeepAliveMessage

Keep alive websocket messages.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### InboundWebSocketMessage

Represents the list of possible inbound websocket types

基础类型：`object`

### InstallationInfo

Class InstallationInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Guid | string | Gets or sets the Id. |
| Name | string|null | Gets or sets the name. |
| Version | string|null | Gets or sets the version. |
| Changelog | string|null | Gets or sets the changelog for this version. |
| SourceUrl | string|null | Gets or sets the source URL. |
| Checksum | string|null | Gets or sets a checksum for the binary. |
| PackageInfo | PackageInfo | Gets or sets package information for the installation. |

### IPlugin

Defines the MediaBrowser.Common.Plugins.IPlugin.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets the name of the plugin. |
| Description | string|null | Gets the Description. |
| Id | string | Gets the unique id. |
| Version | string|null | Gets the plugin version. |
| AssemblyFilePath | string|null | Gets the path to the assembly file. |
| CanUninstall | boolean | Gets a value indicating whether the plugin can be uninstalled. |
| DataFolderPath | string|null | Gets the full path to the data folder, where the plugin can store any miscellaneous files needed. |

### IsoType

Enum IsoType.

枚举值：`Dvd`, `BluRay`

### ItemCounts

Class LibrarySummary.

| 字段 | 类型 | 备注 |
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

### ItemFields

Used to control the data that gets attached to DtoBaseItems.

枚举值：`AirTime`, `CanDelete`, `CanDownload`, `ChannelInfo`, `Chapters`, `Trickplay`, `ChildCount`, `CumulativeRunTimeTicks`, `CustomRating`, `DateCreated`, `DateLastMediaAdded`, `DisplayPreferencesId`, `Etag`, `ExternalUrls`, `Genres`, `ItemCounts`, `MediaSourceCount`, `MediaSources`, `OriginalTitle`, `Overview`, `ParentId`, `Path`, `People`, `PlayAccess`, `ProductionLocations`, `ProviderIds`, `PrimaryImageAspectRatio`, `RecursiveItemCount`, `Settings`, `SeriesStudio`, `SortName`, `SpecialEpisodeNumbers`, `Studios`, `Taglines`, `Tags`, `RemoteTrailers`, `MediaStreams`, `SeasonUserData`, `DateLastRefreshed`, `DateLastSaved`, `RefreshState`, `ChannelImage`, `EnableMediaSourceDisplay`, `Width`, `Height`, `ExtraIds`, `LocalTrailerCount`, `IsHD`, `SpecialFeatureCount`

### ItemFilter

Enum ItemFilter.

枚举值：`IsFolder`, `IsNotFolder`, `IsUnplayed`, `IsPlayed`, `IsFavorite`, `IsResumable`, `Likes`, `Dislikes`, `IsFavoriteOrLikes`

### ItemSortBy

These represent sort orders.

枚举值：`Default`, `AiredEpisodeOrder`, `Album`, `AlbumArtist`, `Artist`, `DateCreated`, `OfficialRating`, `DatePlayed`, `PremiereDate`, `StartDate`, `SortName`, `Name`, `Random`, `Runtime`, `CommunityRating`, `ProductionYear`, `PlayCount`, `CriticRating`, `IsFolder`, `IsUnplayed`, `IsPlayed`, `SeriesSortName`, `VideoBitRate`, `AirTime`, `Studio`, `IsFavoriteOrLiked`, `DateLastContentAdded`, `SeriesDatePlayed`, `ParentIndexNumber`, `IndexNumber`

### JoinGroupRequestDto

Class JoinGroupRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets or sets the group identifier. |

### KeepUntil

枚举值：`UntilDeleted`, `UntilSpaceNeeded`, `UntilWatched`, `UntilDate`

### LibraryChangedMessage

Library changed message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | LibraryUpdateInfo | Class LibraryUpdateInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### LibraryOptionInfoDto

Library option info dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets name. |
| DefaultEnabled | boolean | Gets or sets a value indicating whether default enabled. |

### LibraryOptions

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Enabled | boolean |  |
| EnablePhotos | boolean |  |
| EnableRealtimeMonitor | boolean |  |
| EnableLUFSScan | boolean |  |
| EnableChapterImageExtraction | boolean |  |
| ExtractChapterImagesDuringLibraryScan | boolean |  |
| EnableTrickplayImageExtraction | boolean |  |
| ExtractTrickplayImagesDuringLibraryScan | boolean |  |
| PathInfos | MediaPathInfo[] |  |
| SaveLocalMetadata | boolean |  |
| EnableInternetProviders | boolean |  |
| EnableAutomaticSeriesGrouping | boolean |  |
| EnableEmbeddedTitles | boolean |  |
| EnableEmbeddedExtrasTitles | boolean |  |
| EnableEmbeddedEpisodeInfos | boolean |  |
| AutomaticRefreshIntervalDays | integer |  |
| PreferredMetadataLanguage | string|null | Gets or sets the preferred metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| SeasonZeroDisplayName | string |  |
| MetadataSavers | string[] |  |
| DisabledLocalMetadataReaders | string[] |  |
| LocalMetadataReaderOrder | string[] |  |
| DisabledSubtitleFetchers | string[] |  |
| SubtitleFetcherOrder | string[] |  |
| DisabledMediaSegmentProviders | string[] |  |
| MediaSegmentProviderOrder | string[] |  |
| SkipSubtitlesIfEmbeddedSubtitlesPresent | boolean |  |
| SkipSubtitlesIfAudioTrackMatches | boolean |  |
| SubtitleDownloadLanguages | string[] |  |
| RequirePerfectSubtitleMatch | boolean |  |
| SaveSubtitlesWithMedia | boolean |  |
| SaveLyricsWithMedia | boolean |  |
| SaveTrickplayWithMedia | boolean |  |
| DisabledLyricFetchers | string[] |  |
| LyricFetcherOrder | string[] |  |
| PreferNonstandardArtistsTag | boolean |  |
| UseCustomTagDelimiters | boolean |  |
| CustomTagDelimiters | string[] |  |
| DelimiterWhitelist | string[] |  |
| AutomaticallyAddToCollection | boolean |  |
| AllowEmbeddedSubtitles | string enum(AllowAll|AllowText|AllowImage|AllowNone) | An enum representing the options to disable embedded subs. |
| TypeOptions | TypeOptions[] |  |

### LibraryOptionsResultDto

Library options result dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MetadataSavers | LibraryOptionInfoDto[] | Gets or sets the metadata savers. |
| MetadataReaders | LibraryOptionInfoDto[] | Gets or sets the metadata readers. |
| SubtitleFetchers | LibraryOptionInfoDto[] | Gets or sets the subtitle fetchers. |
| LyricFetchers | LibraryOptionInfoDto[] | Gets or sets the list of lyric fetchers. |
| MediaSegmentProviders | LibraryOptionInfoDto[] | Gets or sets the list of MediaSegment Providers. |
| TypeOptions | LibraryTypeOptionsDto[] | Gets or sets the type options. |

### LibraryStorageDto

Contains informations about a libraries storage informations.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string | Gets or sets the Library Id. |
| Name | string | Gets or sets the name of the library. |
| Folders | FolderStorageDto[] | Gets or sets the storage informations about the folders used in a library. |

### LibraryTypeOptionsDto

Library type options dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | string|null | Gets or sets the type. |
| MetadataFetchers | LibraryOptionInfoDto[] | Gets or sets the metadata fetchers. |
| ImageFetchers | LibraryOptionInfoDto[] | Gets or sets the image fetchers. |
| SimilarItemProviders | LibraryOptionInfoDto[] | Gets or sets the similar item providers. |
| SupportedImageTypes | ImageType[] | Gets or sets the supported image types. |
| DefaultImageOptions | ImageOption[] | Gets or sets the default image options. |

### LibraryUpdateInfo

Class LibraryUpdateInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| FoldersAddedTo | string[] | Gets or sets the folders added to. |
| FoldersRemovedFrom | string[] | Gets or sets the folders removed from. |
| ItemsAdded | string[] | Gets or sets the items added. |
| ItemsRemoved | string[] | Gets or sets the items removed. |
| ItemsUpdated | string[] | Gets or sets the items updated. |
| CollectionFolders | string[] |  |
| IsEmpty | boolean |  |

### ListingsProviderInfo

| 字段 | 类型 | 备注 |
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

### LiveStreamResponse

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MediaSource | MediaSourceInfo |  |

### LiveTvInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Services | LiveTvServiceInfo[] | Gets or sets the services. |
| IsEnabled | boolean | Gets or sets a value indicating whether this instance is enabled. |
| EnabledUsers | string[] | Gets or sets the enabled users. |

### LiveTvOptions

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GuideDays | integer|null |  |
| RecordingPath | string|null |  |
| MovieRecordingPath | string|null |  |
| SeriesRecordingPath | string|null |  |
| EnableRecordingSubfolders | boolean |  |
| EnableOriginalAudioWithEncodedRecordings | boolean |  |
| TunerHosts | TunerHostInfo[] |  |
| ListingProviders | ListingsProviderInfo[] |  |
| PrePaddingSeconds | integer |  |
| PostPaddingSeconds | integer |  |
| MediaLocationsCreated | string[] |  |
| RecordingPostProcessor | string|null |  |
| RecordingPostProcessorArguments | string|null |  |
| SaveRecordingNFO | boolean |  |
| SaveRecordingImages | boolean |  |

### LiveTvServiceInfo

Class ServiceInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| HomePageUrl | string|null | Gets or sets the home page URL. |
| Status | string enum(Ok|Unavailable) | Gets or sets the status. |
| StatusMessage | string|null | Gets or sets the status message. |
| Version | string|null | Gets or sets the version. |
| HasUpdateAvailable | boolean | Gets or sets a value indicating whether this instance has update available. |
| IsVisible | boolean | Gets or sets a value indicating whether this instance is visible. |
| Tuners | string[] |  |

### LiveTvServiceStatus

枚举值：`Ok`, `Unavailable`

### LocalizationOption

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null |  |
| Value | string|null |  |

### LocationType

Enum LocationType.

枚举值：`FileSystem`, `Remote`, `Virtual`, `Offline`

### LogFile

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| DateCreated | string | Gets or sets the date created. |
| DateModified | string | Gets or sets the date modified. |
| Size | integer | Gets or sets the size. |
| Name | string | Gets or sets the name. |

### LogLevel

枚举值：`Trace`, `Debug`, `Information`, `Warning`, `Error`, `Critical`, `None`

### LyricDto

LyricResponse model.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |

### LyricLine

Lyric model.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Text | string | Gets the text of this lyric line. |
| Start | integer|null | Gets the start time in ticks. |
| Cues | LyricLineCue[] | Gets the time-aligned cues for the song's lyrics. |

### LyricLineCue

LyricLineCue model, holds information about the timing of words within a LyricLine.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Position | integer | Gets the start character index of the cue. |
| EndPosition | integer | Gets the end character index of the cue. |
| Start | integer | Gets the timestamp the lyric is synced to in ticks. |
| End | integer|null | Gets the end timestamp the lyric is synced to in ticks. |

### LyricMetadata

LyricMetadata model.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Artist | string|null | Gets or sets the song artist. |
| Album | string|null | Gets or sets the album this song is on. |
| Title | string|null | Gets or sets the title of the song. |
| Author | string|null | Gets or sets the author of the lyric data. |
| Length | integer|null | Gets or sets the length of the song in ticks. |
| By | string|null | Gets or sets who the LRC file was created by. |
| Offset | integer|null | Gets or sets the lyric offset compared to audio in ticks. |
| Creator | string|null | Gets or sets the software used to create the LRC file. |
| Version | string|null | Gets or sets the version of the creator used. |
| IsSynced | boolean|null | Gets or sets a value indicating whether this lyric is synced. |

### MediaAttachment

Class MediaAttachment.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Codec | string|null | Gets or sets the codec. |
| CodecTag | string|null | Gets or sets the codec tag. |
| Comment | string|null | Gets or sets the comment. |
| Index | integer | Gets or sets the index. |
| FileName | string|null | Gets or sets the filename. |
| MimeType | string|null | Gets or sets the MIME type. |
| DeliveryUrl | string|null | Gets or sets the delivery URL. |

### MediaPathDto

Media Path dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name of the library. |
| Path | string|null | Gets or sets the path to add. |
| PathInfo | MediaPathInfo | Gets or sets the path info. |

### MediaPathInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Path | string |  |

### MediaProtocol

枚举值：`File`, `Http`, `Rtmp`, `Rtsp`, `Udp`, `Rtp`, `Ftp`

### MediaSegmentDto

Api model for MediaSegment's.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string | Gets or sets the id of the media segment. |
| ItemId | string | Gets or sets the id of the associated item. |
| Type | string enum(Unknown|Commercial|Preview|Recap|Outro|Intro) | Defines the types of content an individual Jellyfin.Database.Implementations.Entities.MediaSegment represents. |
| StartTicks | integer | Gets or sets the start of the segment. |
| EndTicks | integer | Gets or sets the end of the segment. |

### MediaSegmentDtoQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | MediaSegmentDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### MediaSegmentType

Defines the types of content an individual Jellyfin.Database.Implementations.Entities.MediaSegment represents.

枚举值：`Unknown`, `Commercial`, `Preview`, `Recap`, `Outro`, `Intro`

### MediaSourceInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Protocol | string enum(File|Http|Rtmp|Rtsp|Udp|Rtp|Ftp) |  |
| Id | string|null |  |
| Path | string|null |  |
| EncoderPath | string|null |  |
| EncoderProtocol | string enum(File|Http|Rtmp|Rtsp|Udp|Rtp|Ftp) |  |
| Type | string enum(Default|Grouping|Placeholder) |  |
| Container | string|null |  |
| Size | integer|null |  |
| Name | string|null |  |
| IsRemote | boolean | Gets or sets a value indicating whether the media is remote.
Differentiate internet url vs local network. |
| ETag | string|null |  |
| RunTimeTicks | integer|null |  |
| ReadAtNativeFramerate | boolean |  |
| IgnoreDts | boolean |  |
| IgnoreIndex | boolean |  |
| GenPtsInput | boolean |  |
| SupportsTranscoding | boolean |  |
| SupportsDirectStream | boolean |  |
| SupportsDirectPlay | boolean |  |
| IsInfiniteStream | boolean |  |
| UseMostCompatibleTranscodingProfile | boolean |  |
| RequiresOpening | boolean |  |
| OpenToken | string|null |  |
| RequiresClosing | boolean |  |
| LiveStreamId | string|null |  |
| BufferMs | integer|null |  |
| RequiresLooping | boolean |  |
| SupportsProbing | boolean |  |
| VideoType | string enum(VideoFile|Iso|Dvd|BluRay) |  |
| IsoType | string enum(Dvd|BluRay) |  |
| Video3DFormat | string enum(HalfSideBySide|FullSideBySide|FullTopAndBottom|HalfTopAndBottom|MVC) |  |
| MediaStreams | MediaStream[] |  |
| MediaAttachments | MediaAttachment[] |  |
| Formats | string[] |  |
| Bitrate | integer|null |  |
| FallbackMaxStreamingBitrate | integer|null |  |
| Timestamp | string enum(None|Zero|Valid) |  |
| RequiredHttpHeaders | object|null |  |
| TranscodingUrl | string|null |  |
| TranscodingSubProtocol | string enum(http|hls) | Media streaming protocol.
Lowercase for backwards compatibility. |
| TranscodingContainer | string|null |  |
| AnalyzeDurationMs | integer|null |  |
| DefaultAudioStreamIndex | integer|null |  |
| DefaultSubtitleStreamIndex | integer|null |  |
| HasSegments | boolean |  |

### MediaSourceType

枚举值：`Default`, `Grouping`, `Placeholder`

### MediaStream

Class MediaStream.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Codec | string|null | Gets or sets the codec. |
| CodecTag | string|null | Gets or sets the codec tag. |
| Language | string|null | Gets or sets the language. |
| ColorRange | string|null | Gets or sets the color range. |
| ColorSpace | string|null | Gets or sets the color space. |
| ColorTransfer | string|null | Gets or sets the color transfer. |
| ColorPrimaries | string|null | Gets or sets the color primaries. |
| DvVersionMajor | integer|null | Gets or sets the Dolby Vision version major. |
| DvVersionMinor | integer|null | Gets or sets the Dolby Vision version minor. |
| DvProfile | integer|null | Gets or sets the Dolby Vision profile. |
| DvLevel | integer|null | Gets or sets the Dolby Vision level. |
| RpuPresentFlag | integer|null | Gets or sets the Dolby Vision rpu present flag. |
| ElPresentFlag | integer|null | Gets or sets the Dolby Vision el present flag. |
| BlPresentFlag | integer|null | Gets or sets the Dolby Vision bl present flag. |
| DvBlSignalCompatibilityId | integer|null | Gets or sets the Dolby Vision bl signal compatibility id. |
| Rotation | integer|null | Gets or sets the Rotation in degrees. |
| Comment | string|null | Gets or sets the comment. |
| TimeBase | string|null | Gets or sets the time base. |
| CodecTimeBase | string|null | Gets or sets the codec time base. |
| Title | string|null | Gets or sets the title. |
| Hdr10PlusPresentFlag | boolean|null |  |
| VideoRange | string enum(Unknown|SDR|HDR) | An enum representing video ranges. |
| VideoRangeType | string enum(Unknown|SDR|HDR10|HLG|DOVI|DOVIWithHDR10|DOVIWithHLG|DOVIWithSDR|DOVIWithEL|DOVIWithHDR10Plus|DOVIWithELHDR10Plus|DOVIInvalid|HDR10Plus) | An enum representing types of video ranges. |
| VideoDoViTitle | string|null | Gets the video dovi title. |
| AudioSpatialFormat | string enum(None|DolbyAtmos|DTSX) | An enum representing formats of spatial audio. |
| LocalizedUndefined | string|null |  |
| LocalizedDefault | string|null |  |
| LocalizedForced | string|null |  |
| LocalizedExternal | string|null |  |
| LocalizedHearingImpaired | string|null |  |
| LocalizedLanguage | string|null |  |
| LocalizedOriginal | string|null |  |
| DisplayTitle | string|null |  |
| NalLengthSize | string|null |  |
| IsInterlaced | boolean | Gets or sets a value indicating whether this instance is interlaced. |
| IsAVC | boolean|null |  |
| ChannelLayout | string|null | Gets or sets the channel layout. |
| BitRate | integer|null | Gets or sets the bit rate. |
| BitDepth | integer|null | Gets or sets the bit depth. |
| RefFrames | integer|null | Gets or sets the reference frames. |
| PacketLength | integer|null | Gets or sets the length of the packet. |
| Channels | integer|null | Gets or sets the channels. |
| SampleRate | integer|null | Gets or sets the sample rate. |
| IsDefault | boolean | Gets or sets a value indicating whether this instance is default. |
| IsForced | boolean | Gets or sets a value indicating whether this instance is forced. |
| IsHearingImpaired | boolean | Gets or sets a value indicating whether this instance is for the hearing impaired. |
| IsOriginal | boolean | Gets or sets a value indicating whether this instance is original. |
| Height | integer|null | Gets or sets the height. |
| Width | integer|null | Gets or sets the width. |
| AverageFrameRate | number|null | Gets or sets the average frame rate. |
| RealFrameRate | number|null | Gets or sets the real frame rate. |
| ReferenceFrameRate | number|null | Gets the framerate used as reference.
Prefer AverageFrameRate, if that is null or an unrealistic value
then fallback to RealFrameRate. |
| Profile | string|null | Gets or sets the profile. |
| Type | string enum(Audio|Video|Subtitle|EmbeddedImage|Data|Lyric) | Gets or sets the type. |
| AspectRatio | string|null | Gets or sets the aspect ratio. |
| Index | integer | Gets or sets the index. |
| Score | integer|null | Gets or sets the score. |
| IsExternal | boolean | Gets or sets a value indicating whether this instance is external. |
| DeliveryMethod | string enum(Encode|Embed|External|Hls|Drop) | Gets or sets the method. |
| DeliveryUrl | string|null | Gets or sets the delivery URL. |
| IsExternalUrl | boolean|null | Gets or sets a value indicating whether this instance is external URL. |
| IsTextSubtitleStream | boolean |  |
| SupportsExternalStream | boolean | Gets or sets a value indicating whether [supports external stream]. |
| Path | string|null | Gets or sets the filename. |
| PixelFormat | string|null | Gets or sets the pixel format. |
| Level | number|null | Gets or sets the level. |
| IsAnamorphic | boolean|null | Gets or sets whether this instance is anamorphic. |

### MediaStreamProtocol

Media streaming protocol.
Lowercase for backwards compatibility.

枚举值：`http`, `hls`

### MediaStreamType

Enum MediaStreamType.

枚举值：`Audio`, `Video`, `Subtitle`, `EmbeddedImage`, `Data`, `Lyric`

### MediaType

Media types.

枚举值：`Unknown`, `Video`, `Audio`, `Photo`, `Book`

### MediaUpdateInfoDto

Media Update Info Dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Updates | MediaUpdateInfoPathDto[] | Gets or sets the list of updates. |

### MediaUpdateInfoPathDto

The media update info path.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Path | string|null | Gets or sets media path. |
| UpdateType | string|null | Gets or sets media update type.
Created, Modified, Deleted. |

### MediaUrl

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Url | string|null |  |
| Name | string|null |  |

### MessageCommand

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Header | string|null |  |
| Text | string |  |
| TimeoutMs | integer|null |  |

### MetadataConfiguration

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| UseFileCreationTimeForDateAdded | boolean |  |

### MetadataEditorInfo

A class representing metadata editor information.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ParentalRatingOptions | ParentalRating[] | Gets or sets the parental rating options. |
| Countries | CountryInfo[] | Gets or sets the countries. |
| Cultures | CultureDto[] | Gets or sets the cultures. |
| ExternalIdInfos | ExternalIdInfo[] | Gets or sets the external id infos. |
| ContentType | string enum(unknown|movies|tvshows|music|musicvideos|trailers|homevideos|boxsets|books|photos|livetv|playlists|folders) | Gets or sets the content type. |
| ContentTypeOptions | NameValuePair[] | Gets or sets the content type options. |

### MetadataField

Enum MetadataFields.

枚举值：`Cast`, `Genres`, `ProductionLocations`, `Studios`, `Tags`, `Name`, `Overview`, `Runtime`, `OfficialRating`

### MetadataOptions

Class MetadataOptions.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemType | string|null |  |
| DisabledMetadataSavers | string[] |  |
| LocalMetadataReaderOrder | string[] |  |
| DisabledMetadataFetchers | string[] |  |
| MetadataFetcherOrder | string[] |  |
| DisabledImageFetchers | string[] |  |
| ImageFetcherOrder | string[] |  |

### MetadataRefreshMode

枚举值：`None`, `ValidationOnly`, `Default`, `FullRefresh`

### MovePlaylistItemRequestDto

Class MovePlaylistItemRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistItemId | string | Gets or sets the playlist identifier of the item. |
| NewIndex | integer | Gets or sets the new position. |

### MovieInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |

### MovieInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | MovieInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### MusicVideoInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |
| Artists | string[] |  |

### MusicVideoInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | MusicVideoInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### NameGuidPair

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null |  |
| Id | string |  |

### NameIdPair

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Id | string|null | Gets or sets the identifier. |

### NameValuePair

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Value | string|null | Gets or sets the value. |

### NetworkConfiguration

Defines the MediaBrowser.Common.Net.NetworkConfiguration.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| BaseUrl | string | Gets or sets a value used to specify the URL prefix that your Jellyfin instance can be accessed at. |
| EnableHttps | boolean | Gets or sets a value indicating whether to use HTTPS. |
| RequireHttps | boolean | Gets or sets a value indicating whether the server should force connections over HTTPS. |
| CertificatePath | string | Gets or sets the filesystem path of an X.509 certificate to use for SSL. |
| CertificatePassword | string | Gets or sets the password required to access the X.509 certificate data in the file specified by MediaBrowser.Common.Net.NetworkConfiguration.CertificatePath. |
| InternalHttpPort | integer | Gets or sets the internal HTTP server port. |
| InternalHttpsPort | integer | Gets or sets the internal HTTPS server port. |
| PublicHttpPort | integer | Gets or sets the public HTTP port. |
| PublicHttpsPort | integer | Gets or sets the public HTTPS port. |
| AutoDiscovery | boolean | Gets or sets a value indicating whether Autodiscovery is enabled. |
| EnableUPnP | boolean | Gets or sets a value indicating whether to enable automatic port forwarding. |
| EnableIPv4 | boolean | Gets or sets a value indicating whether IPv6 is enabled. |
| EnableIPv6 | boolean | Gets or sets a value indicating whether IPv6 is enabled. |
| EnableRemoteAccess | boolean | Gets or sets a value indicating whether access from outside of the LAN is permitted. |
| LocalNetworkSubnets | string[] | Gets or sets the subnets that are deemed to make up the LAN. |
| LocalNetworkAddresses | string[] | Gets or sets the interface addresses which Jellyfin will bind to. If empty, all interfaces will be used. |
| KnownProxies | string[] | Gets or sets the known proxies. |
| IgnoreVirtualInterfaces | boolean | Gets or sets a value indicating whether address names that match MediaBrowser.Common.Net.NetworkConfiguration.VirtualInterfaceNames should be ignored for the purposes of binding. |
| VirtualInterfaceNames | string[] | Gets or sets a value indicating the interface name prefixes that should be ignored. The list can be comma separated and values are case-insensitive. <seealso cref="P:MediaBrowser.Common.Net.NetworkConfiguration.IgnoreVirtualInterfaces" />. |
| EnablePublishedServerUriByRequest | boolean | Gets or sets a value indicating whether the published server uri is based on information in HTTP requests. |
| PublishedServerUriBySubnet | string[] | Gets or sets the PublishedServerUriBySubnet
Gets or sets PublishedServerUri to advertise for specific subnets. |
| RemoteIPFilter | string[] | Gets or sets the filter for remote IP connectivity. Used in conjunction with <seealso cref="P:MediaBrowser.Common.Net.NetworkConfiguration.IsRemoteIPFilterBlacklist" />. |
| IsRemoteIPFilterBlacklist | boolean | Gets or sets a value indicating whether <seealso cref="P:MediaBrowser.Common.Net.NetworkConfiguration.RemoteIPFilter" /> contains a blacklist or a whitelist. Default is a whitelist. |

### NewGroupRequestDto

Class NewGroupRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupName | string | Gets or sets the group name. |

### NextItemRequestDto

Class NextItemRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistItemId | string | Gets or sets the playing item identifier. |

### OpenLiveStreamDto

Open live stream dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| OpenToken | string|null | Gets or sets the open token. |
| UserId | string|null | Gets or sets the user id. |
| PlaySessionId | string|null | Gets or sets the play session id. |
| MaxStreamingBitrate | integer|null | Gets or sets the max streaming bitrate. |
| StartTimeTicks | integer|null | Gets or sets the start time in ticks. |
| AudioStreamIndex | integer|null | Gets or sets the audio stream index. |
| SubtitleStreamIndex | integer|null | Gets or sets the subtitle stream index. |
| MaxAudioChannels | integer|null | Gets or sets the max audio channels. |
| ItemId | string|null | Gets or sets the item id. |
| EnableDirectPlay | boolean|null | Gets or sets a value indicating whether to enable direct play. |
| EnableDirectStream | boolean|null | Gets or sets a value indicating whether to enable direct stream. |
| AlwaysBurnInSubtitleWhenTranscoding | boolean|null | Gets or sets a value indicating whether always burn in subtitles when transcoding. |
| DeviceProfile | DeviceProfile | A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.


Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
<see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
the device is able to direct play (without transcoding or remuxing),
as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't. |
| DirectPlayProtocols | MediaProtocol[] | Gets or sets the device play protocols. |

### OutboundKeepAliveMessage

Keep alive websocket messages.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### OutboundWebSocketMessage

Represents the list of possible outbound websocket types

基础类型：`object`

### PackageInfo

Class PackageInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| name | string | Gets or sets the name. |
| description | string | Gets or sets a long description of the plugin containing features or helpful explanations. |
| overview | string | Gets or sets a short overview of what the plugin does. |
| owner | string | Gets or sets the owner. |
| category | string | Gets or sets the category. |
| guid | string | Gets or sets the guid of the assembly associated with this plugin.
This is used to identify the proper item for automatic updates. |
| versions | VersionInfo[] | Gets or sets the versions. |
| imageUrl | string|null | Gets or sets the image url for the package. |

### ParentalRating

Class ParentalRating.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name. |
| Value | integer|null | Gets or sets the value. |
| RatingScore | ParentalRatingScore | Gets or sets the rating score. |

### ParentalRatingScore

A class representing an parental rating score.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| score | integer | Gets or sets the score. |
| subScore | integer|null | Gets or sets the sub score. |

### PathSubstitution

Defines the MediaBrowser.Model.Configuration.PathSubstitution.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| From | string | Gets or sets the value to substitute. |
| To | string | Gets or sets the value to substitution with. |

### PersonKind

The person kind.

枚举值：`Unknown`, `Actor`, `Director`, `Composer`, `Writer`, `GuestStar`, `Producer`, `Conductor`, `Lyricist`, `Arranger`, `Engineer`, `Mixer`, `Remixer`, `Creator`, `Artist`, `AlbumArtist`, `Author`, `Illustrator`, `Penciller`, `Inker`, `Colorist`, `Letterer`, `CoverArtist`, `Editor`, `Translator`, `Narrator`

### PersonLookupInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |

### PersonLookupInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | PersonLookupInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### PingRequestDto

Class PingRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Ping | integer | Gets or sets the ping time. |

### PinRedeemResult

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Success | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Users.PinRedeemResult is success. |
| UsersReset | string[] | Gets or sets the users reset. |

### PlayAccess

枚举值：`Full`, `None`

### PlaybackErrorCode

枚举值：`NotAllowed`, `NoCompatibleStream`, `RateLimitExceeded`

### PlaybackInfoDto

Playback info dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string|null | Gets or sets the playback userId. |
| MaxStreamingBitrate | integer|null | Gets or sets the max streaming bitrate. |
| StartTimeTicks | integer|null | Gets or sets the start time in ticks. |
| AudioStreamIndex | integer|null | Gets or sets the audio stream index. |
| SubtitleStreamIndex | integer|null | Gets or sets the subtitle stream index. |
| MaxAudioChannels | integer|null | Gets or sets the max audio channels. |
| MediaSourceId | string|null | Gets or sets the media source id. |
| LiveStreamId | string|null | Gets or sets the live stream id. |
| DeviceProfile | DeviceProfile | A MediaBrowser.Model.Dlna.DeviceProfile represents a set of metadata which determines which content a certain device is able to play.


Specifically, it defines the supported <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.ContainerProfiles">containers</see> and
<see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.CodecProfiles">codecs</see> (video and/or audio, including codec profiles and levels)
the device is able to direct play (without transcoding or remuxing),
as well as which <see cref="P:MediaBrowser.Model.Dlna.DeviceProfile.TranscodingProfiles">containers/codecs to transcode to</see> in case it isn't. |
| EnableDirectPlay | boolean|null | Gets or sets a value indicating whether to enable direct play. |
| EnableDirectStream | boolean|null | Gets or sets a value indicating whether to enable direct stream. |
| EnableTranscoding | boolean|null | Gets or sets a value indicating whether to enable transcoding. |
| AllowVideoStreamCopy | boolean|null | Gets or sets a value indicating whether to enable video stream copy. |
| AllowAudioStreamCopy | boolean|null | Gets or sets a value indicating whether to allow audio stream copy. |
| AutoOpenLiveStream | boolean|null | Gets or sets a value indicating whether to auto open the live stream. |
| AlwaysBurnInSubtitleWhenTranscoding | boolean|null | Gets or sets a value indicating whether always burn in subtitles when transcoding. |

### PlaybackInfoResponse

Class PlaybackInfoResponse.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |

### PlaybackOrder

Enum PlaybackOrder.

枚举值：`Default`, `Shuffle`

### PlaybackProgressInfo

Class PlaybackProgressInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanSeek | boolean | Gets or sets a value indicating whether this instance can seek. |
| Item | BaseItemDto | Gets or sets the item. |
| ItemId | string | Gets or sets the item identifier. |
| SessionId | string|null | Gets or sets the session id. |
| MediaSourceId | string|null | Gets or sets the media version identifier. |
| AudioStreamIndex | integer|null | Gets or sets the index of the audio stream. |
| SubtitleStreamIndex | integer|null | Gets or sets the index of the subtitle stream. |
| IsPaused | boolean | Gets or sets a value indicating whether this instance is paused. |
| IsMuted | boolean | Gets or sets a value indicating whether this instance is muted. |
| PositionTicks | integer|null | Gets or sets the position ticks. |
| PlaybackStartTimeTicks | integer|null |  |
| VolumeLevel | integer|null | Gets or sets the volume level. |
| Brightness | integer|null |  |
| AspectRatio | string|null |  |
| PlayMethod | string enum(Transcode|DirectStream|DirectPlay) | Gets or sets the play method. |
| LiveStreamId | string|null | Gets or sets the live stream identifier. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| RepeatMode | string enum(RepeatNone|RepeatAll|RepeatOne) | Gets or sets the repeat mode. |
| PlaybackOrder | string enum(Default|Shuffle) | Gets or sets the playback order. |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string|null |  |

### PlaybackRequestType

Enum PlaybackRequestType.

枚举值：`Play`, `SetPlaylistItem`, `RemoveFromPlaylist`, `MovePlaylistItem`, `Queue`, `Unpause`, `Pause`, `Stop`, `Seek`, `Buffer`, `Ready`, `NextItem`, `PreviousItem`, `SetRepeatMode`, `SetShuffleMode`, `Ping`, `IgnoreWait`

### PlaybackStartInfo

Class PlaybackStartInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanSeek | boolean | Gets or sets a value indicating whether this instance can seek. |
| Item | BaseItemDto | Gets or sets the item. |
| ItemId | string | Gets or sets the item identifier. |
| SessionId | string|null | Gets or sets the session id. |
| MediaSourceId | string|null | Gets or sets the media version identifier. |
| AudioStreamIndex | integer|null | Gets or sets the index of the audio stream. |
| SubtitleStreamIndex | integer|null | Gets or sets the index of the subtitle stream. |
| IsPaused | boolean | Gets or sets a value indicating whether this instance is paused. |
| IsMuted | boolean | Gets or sets a value indicating whether this instance is muted. |
| PositionTicks | integer|null | Gets or sets the position ticks. |
| PlaybackStartTimeTicks | integer|null |  |
| VolumeLevel | integer|null | Gets or sets the volume level. |
| Brightness | integer|null |  |
| AspectRatio | string|null |  |
| PlayMethod | string enum(Transcode|DirectStream|DirectPlay) | Gets or sets the play method. |
| LiveStreamId | string|null | Gets or sets the live stream identifier. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| RepeatMode | string enum(RepeatNone|RepeatAll|RepeatOne) | Gets or sets the repeat mode. |
| PlaybackOrder | string enum(Default|Shuffle) | Gets or sets the playback order. |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string|null |  |

### PlaybackStopInfo

Class PlaybackStopInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Item | BaseItemDto | Gets or sets the item. |
| ItemId | string | Gets or sets the item identifier. |
| SessionId | string|null | Gets or sets the session id. |
| MediaSourceId | string|null | Gets or sets the media version identifier. |
| PositionTicks | integer|null | Gets or sets the position ticks. |
| LiveStreamId | string|null | Gets or sets the live stream identifier. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| Failed | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Session.PlaybackStopInfo is failed. |
| NextMediaType | string|null |  |
| PlaylistItemId | string|null |  |
| NowPlayingQueue | QueueItem[] |  |

### PlayCommand

Enum PlayCommand.

枚举值：`PlayNow`, `PlayNext`, `PlayLast`, `PlayInstantMix`, `PlayShuffle`

### PlayerStateInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PositionTicks | integer|null | Gets or sets the now playing position ticks. |
| CanSeek | boolean | Gets or sets a value indicating whether this instance can seek. |
| IsPaused | boolean | Gets or sets a value indicating whether this instance is paused. |
| IsMuted | boolean | Gets or sets a value indicating whether this instance is muted. |
| VolumeLevel | integer|null | Gets or sets the volume level. |
| AudioStreamIndex | integer|null | Gets or sets the index of the now playing audio stream. |
| SubtitleStreamIndex | integer|null | Gets or sets the index of the now playing subtitle stream. |
| MediaSourceId | string|null | Gets or sets the now playing media version identifier. |
| PlayMethod | string enum(Transcode|DirectStream|DirectPlay) | Gets or sets the play method. |
| RepeatMode | string enum(RepeatNone|RepeatAll|RepeatOne) | Gets or sets the repeat mode. |
| PlaybackOrder | string enum(Default|Shuffle) | Gets or sets the playback order. |
| LiveStreamId | string|null | Gets or sets the now playing live stream identifier. |

### PlaylistCreationResult

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |

### PlaylistDto

DTO for playlists.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| OpenAccess | boolean | Gets or sets a value indicating whether the playlist is publicly readable. |
| Shares | PlaylistUserPermissions[] | Gets or sets the share permissions. |
| ItemIds | string[] | Gets or sets the item ids. |

### PlaylistUserPermissions

Class to hold data on user permissions for playlists.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string | Gets or sets the user id. |
| CanEdit | boolean | Gets or sets a value indicating whether the user has edit permissions. |

### PlayMessage

Play command websocket message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | PlayRequest | Class PlayRequest. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PlayMethod

枚举值：`Transcode`, `DirectStream`, `DirectPlay`

### PlayQueueUpdate

Class PlayQueueUpdate.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Reason | string enum(NewPlaylist|SetCurrentItem|RemoveItems|MoveItem|Queue|QueueNext|NextItem|PreviousItem|RepeatMode|ShuffleMode) | Gets the request type that originated this update. |
| LastUpdate | string | Gets the UTC time of the last change to the playing queue. |
| Playlist | SyncPlayQueueItem[] | Gets the playlist. |
| PlayingItemIndex | integer | Gets the playing item index in the playlist. |
| StartPositionTicks | integer | Gets the start position ticks. |
| IsPlaying | boolean | Gets a value indicating whether the current item is playing. |
| ShuffleMode | string enum(Sorted|Shuffle) | Gets the shuffle mode. |
| RepeatMode | string enum(RepeatOne|RepeatAll|RepeatNone) | Gets the repeat mode. |

### PlayQueueUpdateReason

Enum PlayQueueUpdateReason.

枚举值：`NewPlaylist`, `SetCurrentItem`, `RemoveItems`, `MoveItem`, `Queue`, `QueueNext`, `NextItem`, `PreviousItem`, `RepeatMode`, `ShuffleMode`

### PlayRequest

Class PlayRequest.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemIds | string[] | Gets or sets the item ids. |
| StartPositionTicks | integer|null | Gets or sets the start position ticks that the first item should be played at. |
| PlayCommand | string enum(PlayNow|PlayNext|PlayLast|PlayInstantMix|PlayShuffle) | Gets or sets the play command. |
| ControllingUserId | string | Gets or sets the controlling user identifier. |
| SubtitleStreamIndex | integer|null |  |
| AudioStreamIndex | integer|null |  |
| MediaSourceId | string|null |  |
| StartIndex | integer|null |  |

### PlayRequestDto

Class PlayRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlayingQueue | string[] | Gets or sets the playing queue. |
| PlayingItemPosition | integer | Gets or sets the position of the playing item in the queue. |
| StartPositionTicks | integer | Gets or sets the start position ticks. |

### PlaystateCommand

Enum PlaystateCommand.

枚举值：`Stop`, `Pause`, `Unpause`, `NextTrack`, `PreviousTrack`, `Seek`, `Rewind`, `FastForward`, `PlayPause`

### PlaystateMessage

Playstate message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | PlaystateRequest | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PlaystateRequest

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Command | string enum(Stop|Pause|Unpause|NextTrack|PreviousTrack|Seek|Rewind|FastForward|PlayPause) | Enum PlaystateCommand. |
| SeekPositionTicks | integer|null |  |
| ControllingUserId | string|null | Gets or sets the controlling user identifier. |

### PluginInfo

This is a serializable stub class that is used by the api to provide information about installed plugins.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the name. |
| Version | string | Gets or sets the version. |
| ConfigurationFileName | string|null | Gets or sets the name of the configuration file. |
| Description | string | Gets or sets the description. |
| Id | string | Gets or sets the unique id. |
| CanUninstall | boolean | Gets or sets a value indicating whether the plugin can be uninstalled. |
| HasImage | boolean | Gets or sets a value indicating whether this plugin has a valid image. |
| Status | string enum(Active|Restart|Deleted|Superseded|Superceded|Malfunctioned|NotSupported|Disabled) | Gets or sets a value indicating the status of the plugin. |

### PluginInstallationCancelledMessage

Plugin installation cancelled message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | InstallationInfo | Class InstallationInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PluginInstallationCompletedMessage

Plugin installation completed message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | InstallationInfo | Class InstallationInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PluginInstallationFailedMessage

Plugin installation failed message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | InstallationInfo | Class InstallationInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PluginInstallingMessage

Package installing message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | InstallationInfo | Class InstallationInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PluginStatus

Plugin load status.

枚举值：`Active`, `Restart`, `Deleted`, `Superseded`, `Superceded`, `Malfunctioned`, `NotSupported`, `Disabled`

### PluginUninstalledMessage

Plugin uninstalled message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | PluginInfo | This is a serializable stub class that is used by the api to provide information about installed plugins. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### PreviousItemRequestDto

Class PreviousItemRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistItemId | string | Gets or sets the playing item identifier. |

### ProblemDetails

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| type | string|null |  |
| title | string|null |  |
| status | integer|null |  |
| detail | string|null |  |
| instance | string|null |  |

### ProcessPriorityClass

枚举值：`Normal`, `Idle`, `High`, `RealTime`, `BelowNormal`, `AboveNormal`

### ProfileCondition

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Condition | string enum(Equals|NotEquals|LessThanEqual|GreaterThanEqual|EqualsAny) |  |
| Property | string enum(AudioChannels|AudioBitrate|AudioProfile|Width|Height|Has64BitOffsets|PacketLength|VideoBitDepth|VideoBitrate|VideoFramerate|VideoLevel|VideoProfile|VideoTimestamp|IsAnamorphic|RefFrames|NumAudioStreams|NumVideoStreams|IsSecondaryAudio|VideoCodecTag|IsAvc|IsInterlaced|AudioSampleRate|AudioBitDepth|VideoRangeType|NumStreams|VideoRotation) |  |
| Value | string|null |  |
| IsRequired | boolean |  |

### ProfileConditionType

枚举值：`Equals`, `NotEquals`, `LessThanEqual`, `GreaterThanEqual`, `EqualsAny`

### ProfileConditionValue

枚举值：`AudioChannels`, `AudioBitrate`, `AudioProfile`, `Width`, `Height`, `Has64BitOffsets`, `PacketLength`, `VideoBitDepth`, `VideoBitrate`, `VideoFramerate`, `VideoLevel`, `VideoProfile`, `VideoTimestamp`, `IsAnamorphic`, `RefFrames`, `NumAudioStreams`, `NumVideoStreams`, `IsSecondaryAudio`, `VideoCodecTag`, `IsAvc`, `IsInterlaced`, `AudioSampleRate`, `AudioBitDepth`, `VideoRangeType`, `NumStreams`, `VideoRotation`

### ProgramAudio

枚举值：`Mono`, `Stereo`, `Dolby`, `DolbyDigital`, `Thx`, `Atmos`

### PublicSystemInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string|null | Gets or sets the local address. |
| ServerName | string|null | Gets or sets the name of the server. |
| Version | string|null | Gets or sets the server version. |
| ProductName | string|null | Gets or sets the product name. This is the AssemblyProduct name. |
| OperatingSystem | string|null | Gets or sets the operating system. |
| Id | string|null | Gets or sets the id. |
| StartupWizardCompleted | boolean|null | Gets or sets a value indicating whether the startup wizard is completed. |

### QueryFilters

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Genres | NameGuidPair[] |  |
| Tags | string[] |  |
| AudioLanguages | NameValuePair[] |  |
| SubtitleLanguages | NameValuePair[] |  |

### QueryFiltersLegacy

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Genres | string[] |  |
| Tags | string[] |  |
| OfficialRatings | string[] |  |
| Years | integer[] |  |

### QueueItem

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| PlaylistItemId | string|null |  |

### QueueRequestDto

Class QueueRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemIds | string[] | Gets or sets the items to enqueue. |
| Mode | string enum(Queue|QueueNext) | Enum GroupQueueMode. |

### QuickConnectDto

The quick connect request body.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Secret | string | Gets or sets the quick connect secret. |

### QuickConnectResult

Stores the state of an quick connect request.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Authenticated | boolean | Gets or sets a value indicating whether this request is authorized. |
| Secret | string | Gets the secret value used to uniquely identify this request. Can be used to retrieve authentication information. |
| Code | string | Gets the user facing code used so the user can quickly differentiate this request from others. |
| DeviceId | string | Gets the requesting device id. |
| DeviceName | string | Gets the requesting device name. |
| AppName | string | Gets the requesting app name. |
| AppVersion | string | Gets the requesting app version. |
| DateAdded | string | Gets or sets the DateTime that this request was created. |

### RatingType

枚举值：`Score`, `Likes`

### ReadyRequestDto

Class ReadyRequest.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| When | string | Gets or sets when the request has been made by the client. |
| PositionTicks | integer | Gets or sets the position ticks. |
| IsPlaying | boolean | Gets or sets a value indicating whether the client playback is unpaused. |
| PlaylistItemId | string | Gets or sets the playlist item identifier of the playing item. |

### RecommendationDto

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| RecommendationType | string enum(SimilarToRecentlyPlayed|SimilarToLikedItem|HasDirectorFromRecentlyPlayed|HasActorFromRecentlyPlayed|HasLikedDirector|HasLikedActor) |  |
| BaselineItemName | string|null |  |
| CategoryId | string |  |

### RecommendationType

枚举值：`SimilarToRecentlyPlayed`, `SimilarToLikedItem`, `HasDirectorFromRecentlyPlayed`, `HasActorFromRecentlyPlayed`, `HasLikedDirector`, `HasLikedActor`

### RecordingStatus

枚举值：`New`, `InProgress`, `Completed`, `Cancelled`, `ConflictedOk`, `ConflictedNotOk`, `Error`

### RefreshProgressMessage

Refresh progress message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | object|null | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### RemoteImageInfo

Class RemoteImageInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ProviderName | string|null | Gets or sets the name of the provider. |
| Url | string|null | Gets or sets the URL. |
| ThumbnailUrl | string|null | Gets or sets a url used for previewing a smaller version. |
| Height | integer|null | Gets or sets the height. |
| Width | integer|null | Gets or sets the width. |
| CommunityRating | number|null | Gets or sets the community rating. |
| VoteCount | integer|null | Gets or sets the vote count. |
| Language | string|null | Gets or sets the language. |
| Type | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) | Gets or sets the type. |
| RatingType | string enum(Score|Likes) | Gets or sets the type of the rating. |

### RemoteImageResult

Class RemoteImageResult.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Images | RemoteImageInfo[] | Gets or sets the images. |
| TotalRecordCount | integer | Gets or sets the total record count. |
| Providers | string[] | Gets or sets the providers. |

### RemoteLyricInfoDto

The remote lyric info dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string | Gets or sets the id for the lyric. |
| ProviderName | string | Gets the provider name. |
| Lyrics | LyricDto | Gets the lyrics. |

### RemoteSearchResult

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ProviderIds | object | Gets or sets the provider ids. |
| ProductionYear | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| IndexNumberEnd | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| ImageUrl | string|null |  |
| SearchProviderName | string|null |  |
| Overview | string|null |  |
| AlbumArtist | RemoteSearchResult |  |
| Artists | RemoteSearchResult[] |  |

### RemoteSubtitleInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ThreeLetterISOLanguageName | string|null |  |
| Id | string|null |  |
| ProviderName | string|null |  |
| Name | string|null |  |
| Format | string|null |  |
| Author | string|null |  |
| Comment | string|null |  |
| DateCreated | string|null |  |
| CommunityRating | number|null |  |
| FrameRate | number|null |  |
| DownloadCount | integer|null |  |
| IsHashMatch | boolean|null |  |
| AiTranslated | boolean|null |  |
| MachineTranslated | boolean|null |  |
| Forced | boolean|null |  |
| HearingImpaired | boolean|null |  |

### RemoveFromPlaylistRequestDto

Class RemoveFromPlaylistRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistItemIds | string[] | Gets or sets the playlist identifiers of the items. Ignored when clearing the playlist. |
| ClearPlaylist | boolean | Gets or sets a value indicating whether the entire playlist should be cleared. |
| ClearPlayingItem | boolean | Gets or sets a value indicating whether the playing item should be removed as well. Used only when clearing the playlist. |

### RepeatMode

枚举值：`RepeatNone`, `RepeatAll`, `RepeatOne`

### RepositoryInfo

Class RepositoryInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Url | string|null | Gets or sets the URL. |
| Enabled | boolean | Gets or sets a value indicating whether the repository is enabled. |

### RestartRequiredMessage

Restart required.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ScheduledTaskEndedMessage

Scheduled task ended message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | TaskResult | Class TaskExecutionInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ScheduledTasksInfoMessage

Scheduled tasks info message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | TaskInfo[] | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ScheduledTasksInfoStartMessage

Scheduled tasks info start message.
Data is the timing data encoded as "$initialDelay,$interval" in ms.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | string|null | Gets or sets the data. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ScheduledTasksInfoStopMessage

Scheduled tasks info stop message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ScrollDirection

An enum representing the axis that should be scrolled.

枚举值：`Horizontal`, `Vertical`

### SearchHint

Class SearchHintResult.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemId | string | Gets or sets the item id. |
| Id | string | Gets or sets the item id. |
| Name | string | Gets or sets the name. |
| MatchedTerm | string|null | Gets or sets the matched term. |
| IndexNumber | integer|null | Gets or sets the index number. |
| ProductionYear | integer|null | Gets or sets the production year. |
| ParentIndexNumber | integer|null | Gets or sets the parent index number. |
| PrimaryImageTag | string|null | Gets or sets the image tag. |
| ThumbImageTag | string|null | Gets or sets the thumb image tag. |
| ThumbImageItemId | string|null | Gets or sets the thumb image item identifier. |
| BackdropImageTag | string|null | Gets or sets the backdrop image tag. |
| BackdropImageItemId | string|null | Gets or sets the backdrop image item identifier. |
| Type | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) | The base item kind. |
| IsFolder | boolean|null | Gets or sets a value indicating whether this instance is folder. |
| RunTimeTicks | integer|null | Gets or sets the run time ticks. |
| MediaType | string enum(Unknown|Video|Audio|Photo|Book) | Media types. |
| StartDate | string|null | Gets or sets the start date. |
| EndDate | string|null | Gets or sets the end date. |
| Series | string|null | Gets or sets the series. |
| Status | string|null | Gets or sets the status. |
| Album | string|null | Gets or sets the album. |
| AlbumId | string|null | Gets or sets the album id. |
| AlbumArtist | string|null | Gets or sets the album artist. |
| Artists | string[] | Gets or sets the artists. |
| SongCount | integer|null | Gets or sets the song count. |
| EpisodeCount | integer|null | Gets or sets the episode count. |
| ChannelId | string|null | Gets or sets the channel identifier. |
| ChannelName | string|null | Gets or sets the name of the channel. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |

### SearchHintResult

Class SearchHintResult.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchHints | SearchHint[] | Gets the search hints. |
| TotalRecordCount | integer | Gets the total record count. |

### SeekRequestDto

Class SeekRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PositionTicks | integer | Gets or sets the position ticks. |

### SendCommand

Class SendCommand.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| PlaylistItemId | string | Gets the playlist identifier of the playing item. |
| When | string | Gets or sets the UTC time when to execute the command. |
| PositionTicks | integer|null | Gets the position ticks. |
| Command | string enum(Unpause|Pause|Stop|Seek) | Gets the command. |
| EmittedAt | string | Gets the UTC time when this command has been emitted. |

### SendCommandType

Enum SendCommandType.

枚举值：`Unpause`, `Pause`, `Stop`, `Seek`

### SeriesInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |

### SeriesInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | SeriesInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### SeriesStatus

The status of a series.

枚举值：`Continuing`, `Ended`, `Unreleased`

### SeriesTimerCancelledMessage

Series timer cancelled message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | TimerEventInfo | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SeriesTimerCreatedMessage

Series timer created message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | TimerEventInfo | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SeriesTimerInfoDto

Class SeriesTimerInfoDto.

| 字段 | 类型 | 备注 |
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

### SeriesTimerInfoDtoQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | SeriesTimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### ServerConfiguration

Represents the server configuration.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LogFileRetentionDays | integer | Gets or sets the number of days we should retain log files. |
| IsStartupWizardCompleted | boolean | Gets or sets a value indicating whether this instance is first run. |
| CachePath | string|null | Gets or sets the cache path. |
| PreviousVersion | string|null | Gets or sets the last known version that was ran using the configuration. |
| PreviousVersionStr | string|null | Gets or sets the stringified PreviousVersion to be stored/loaded,
because System.Version itself isn't xml-serializable. |
| EnableMetrics | boolean | Gets or sets a value indicating whether to enable prometheus metrics exporting. |
| EnableNormalizedItemByNameIds | boolean |  |
| IsPortAuthorized | boolean | Gets or sets a value indicating whether this instance is port authorized. |
| QuickConnectAvailable | boolean | Gets or sets a value indicating whether quick connect is available for use on this server. |
| EnableCaseSensitiveItemIds | boolean | Gets or sets a value indicating whether [enable case-sensitive item ids]. |
| DisableLiveTvChannelUserDataName | boolean |  |
| MetadataPath | string | Gets or sets the metadata path. |
| PreferredMetadataLanguage | string | Gets or sets the preferred metadata language. |
| MetadataCountryCode | string | Gets or sets the metadata country code. |
| SortReplaceCharacters | string[] | Gets or sets characters to be replaced with a ' ' in strings to create a sort name. |
| SortRemoveCharacters | string[] | Gets or sets characters to be removed from strings to create a sort name. |
| SortRemoveWords | string[] | Gets or sets words to be removed from strings to create a sort name. |
| MinResumePct | integer | Gets or sets the minimum percentage of an item that must be played in order for playstate to be updated. |
| MaxResumePct | integer | Gets or sets the maximum percentage of an item that can be played while still saving playstate. If this percentage is crossed playstate will be reset to the beginning and the item will be marked watched. |
| MinResumeDurationSeconds | integer | Gets or sets the minimum duration that an item must have in order to be eligible for playstate updates.. |
| MinAudiobookResume | integer | Gets or sets the minimum minutes of a book that must be played in order for playstate to be updated. |
| MaxAudiobookResume | integer | Gets or sets the remaining minutes of a book that can be played while still saving playstate. If this percentage is crossed playstate will be reset to the beginning and the item will be marked watched. |
| InactiveSessionThreshold | integer | Gets or sets the threshold in minutes after a inactive session gets closed automatically.
If set to 0 the check for inactive sessions gets disabled. |
| LibraryMonitorDelay | integer | Gets or sets the delay in seconds that we will wait after a file system change to try and discover what has been added/removed
Some delay is necessary with some items because their creation is not atomic.  It involves the creation of several
different directories and files. |
| LibraryUpdateDuration | integer | Gets or sets the duration in seconds that we will wait after a library updated event before executing the library changed notification. |
| CacheSize | integer | Gets or sets the maximum amount of items to cache. |
| ImageSavingConvention | string enum(Legacy|Compatible) | Gets or sets the image saving convention. |
| MetadataOptions | MetadataOptions[] |  |
| SkipDeserializationForBasicTypes | boolean |  |
| ServerName | string |  |
| UICulture | string |  |
| SaveMetadataHidden | boolean |  |
| ContentTypes | NameValuePair[] |  |
| RemoteClientBitrateLimit | integer |  |
| EnableFolderView | boolean |  |
| EnableGroupingMoviesIntoCollections | boolean |  |
| EnableGroupingShowsIntoCollections | boolean |  |
| DisplaySpecialsWithinSeasons | boolean |  |
| CodecsUsed | string[] |  |
| PluginRepositories | RepositoryInfo[] |  |
| EnableExternalContentInSuggestions | boolean |  |
| ImageExtractionTimeoutMs | integer |  |
| PathSubstitutions | PathSubstitution[] |  |
| EnableSlowResponseWarning | boolean | Gets or sets a value indicating whether slow server responses should be logged as a warning. |
| SlowResponseThresholdMs | integer | Gets or sets the threshold for the slow response time warning in ms. |
| CorsHosts | string[] | Gets or sets the cors hosts. |
| ActivityLogRetentionDays | integer|null | Gets or sets the number of days we should retain activity logs. |
| LibraryScanFanoutConcurrency | integer | Gets or sets the how the library scan fans out. |
| LibraryMetadataRefreshConcurrency | integer | Gets or sets the how many metadata refreshes can run concurrently. |
| AllowClientLogUpload | boolean | Gets or sets a value indicating whether clients should be allowed to upload logs. |
| DummyChapterDuration | integer | Gets or sets the dummy chapter duration in seconds, use 0 (zero) or less to disable generation altogether. |
| ChapterImageResolution | string enum(MatchSource|P144|P240|P360|P480|P720|P1080|P1440|P2160) | Gets or sets the chapter image resolution. |
| ParallelImageEncodingLimit | integer | Gets or sets the limit for parallel image encoding. |
| CastReceiverApplications | CastReceiverApplication[] | Gets or sets the list of cast receiver applications. |
| TrickplayOptions | TrickplayOptions | Gets or sets the trickplay options. |
| EnableLegacyAuthorization | boolean | Gets or sets a value indicating whether old authorization methods are allowed. |

### ServerDiscoveryInfo

The server discovery info model.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Address | string | Gets the address. |
| Id | string | Gets the server identifier. |
| Name | string | Gets the name. |
| EndpointAddress | string|null | Gets the endpoint address. |

### ServerRestartingMessage

Server restarting down message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### ServerShuttingDownMessage

Server shutting down message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SessionInfoDto

Session info DTO.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlayState | PlayerStateInfo | Gets or sets the play state. |
| AdditionalUsers | SessionUserInfo[] | Gets or sets the additional users. |
| Capabilities | ClientCapabilitiesDto | Gets or sets the client capabilities. |
| RemoteEndPoint | string|null | Gets or sets the remote end point. |
| PlayableMediaTypes | MediaType[] | Gets or sets the playable media types. |
| Id | string|null | Gets or sets the id. |
| UserId | string | Gets or sets the user id. |
| UserName | string|null | Gets or sets the username. |
| Client | string|null | Gets or sets the type of the client. |
| LastActivityDate | string | Gets or sets the last activity date. |
| LastPlaybackCheckIn | string | Gets or sets the last playback check in. |
| LastPausedDate | string|null | Gets or sets the last paused date. |
| DeviceName | string|null | Gets or sets the name of the device. |
| DeviceType | string|null | Gets or sets the type of the device. |
| NowPlayingItem | BaseItemDto | Gets or sets the now playing item. |
| NowViewingItem | BaseItemDto | Gets or sets the now viewing item. |
| DeviceId | string|null | Gets or sets the device id. |
| ApplicationVersion | string|null | Gets or sets the application version. |
| TranscodingInfo | TranscodingInfo | Gets or sets the transcoding info. |
| IsActive | boolean | Gets or sets a value indicating whether this session is active. |
| SupportsMediaControl | boolean | Gets or sets a value indicating whether the session supports media control. |
| SupportsRemoteControl | boolean | Gets or sets a value indicating whether the session supports remote control. |
| NowPlayingQueue | QueueItem[] | Gets or sets the now playing queue. |
| HasCustomDeviceName | boolean | Gets or sets a value indicating whether this session has a custom device name. |
| PlaylistItemId | string|null | Gets or sets the playlist item id. |
| ServerId | string|null | Gets or sets the server id. |
| UserPrimaryImageTag | string|null | Gets or sets the user primary image tag. |
| SupportedCommands | GeneralCommandType[] | Gets or sets the supported commands. |

### SessionMessageType

The different kinds of messages that are used in the WebSocket api.

枚举值：`ForceKeepAlive`, `GeneralCommand`, `UserDataChanged`, `Sessions`, `Play`, `SyncPlayCommand`, `SyncPlayGroupUpdate`, `Playstate`, `RestartRequired`, `ServerShuttingDown`, `ServerRestarting`, `LibraryChanged`, `UserDeleted`, `UserUpdated`, `SeriesTimerCreated`, `TimerCreated`, `SeriesTimerCancelled`, `TimerCancelled`, `RefreshProgress`, `ScheduledTaskEnded`, `PackageInstallationCancelled`, `PackageInstallationFailed`, `PackageInstallationCompleted`, `PackageInstalling`, `PackageUninstalled`, `ActivityLogEntry`, `ScheduledTasksInfo`, `ActivityLogEntryStart`, `ActivityLogEntryStop`, `SessionsStart`, `SessionsStop`, `ScheduledTasksInfoStart`, `ScheduledTasksInfoStop`, `KeepAlive`

### SessionsMessage

Sessions message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | SessionInfoDto[] | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SessionsStartMessage

Sessions start message.
Data is the timing data encoded as "$initialDelay,$interval" in ms.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | string|null | Gets or sets the data. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SessionsStopMessage

Sessions stop message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SessionUserInfo

Class SessionUserInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string | Gets or sets the user identifier. |
| UserName | string|null | Gets or sets the name of the user. |

### SetChannelMappingDto

Set channel mapping dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ProviderId | string | Gets or sets the provider id. |
| TunerChannelId | string | Gets or sets the tuner channel id. |
| ProviderChannelId | string | Gets or sets the provider channel id. |

### SetPlaylistItemRequestDto

Class SetPlaylistItemRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistItemId | string | Gets or sets the playlist identifier of the playing item. |

### SetRepeatModeRequestDto

Class SetRepeatModeRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Mode | string enum(RepeatOne|RepeatAll|RepeatNone) | Enum GroupRepeatMode. |

### SetShuffleModeRequestDto

Class SetShuffleModeRequestDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Mode | string enum(Sorted|Shuffle) | Enum GroupShuffleMode. |

### SongInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |
| AlbumArtists | string[] |  |
| Album | string|null |  |
| Artists | string[] |  |

### SortOrder

An enum representing the sorting order.

枚举值：`Ascending`, `Descending`

### SpecialViewOptionDto

Special view option dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets view option name. |
| Id | string|null | Gets or sets view option id. |

### StartupConfigurationDto

The startup configuration DTO.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ServerName | string|null | Gets or sets the server name. |
| UICulture | string|null | Gets or sets UI language culture. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| PreferredMetadataLanguage | string|null | Gets or sets the preferred language for the metadata. |

### StartupRemoteAccessDto

Startup remote access dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnableRemoteAccess | boolean | Gets or sets a value indicating whether enable remote access. |

### StartupUserDto

The startup user DTO.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the username. |
| Password | string|null | Gets or sets the user's password. |

### SubtitleDeliveryMethod

Delivery method to use during playback of a specific subtitle format.

枚举值：`Encode`, `Embed`, `External`, `Hls`, `Drop`

### SubtitlePlaybackMode

An enum representing a subtitle playback mode.

枚举值：`Default`, `Always`, `OnlyForced`, `None`, `Smart`

### SubtitleProfile

A class for subtitle profile information.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Format | string|null | Gets or sets the format. |
| Method | string enum(Encode|Embed|External|Hls|Drop) | Gets or sets the delivery method. |
| DidlMode | string|null | Gets or sets the DIDL mode. |
| Language | string|null | Gets or sets the language. |
| Container | string|null | Gets or sets the container. |

### SyncPlayCommandMessage

Sync play command.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | SendCommand | Class SendCommand. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SyncPlayGroupDoesNotExistUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | string | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayGroupJoinedUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | GroupInfoDto | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayGroupLeftUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | string | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayGroupUpdateMessage

Untyped sync play command.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | GroupUpdate | Group update data |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### SyncPlayLibraryAccessDeniedUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | string | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayNotInGroupUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | string | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayPlayQueueUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | PlayQueueUpdate | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayQueueItem

Class QueueItem.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ItemId | string | Gets the item identifier. |
| PlaylistItemId | string | Gets the playlist identifier of the item. |

### SyncPlayStateUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | GroupStateUpdate | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayUserAccessType

Enum SyncPlayUserAccessType.

枚举值：`CreateAndJoinGroups`, `JoinGroups`, `None`

### SyncPlayUserJoinedUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | string | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SyncPlayUserLeftUpdate

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| Data | string | Gets the update data. |
| Type | string enum(UserJoined|UserLeft|GroupJoined|GroupLeft|StateUpdate|PlayQueue|NotInGroup|GroupDoesNotExist|LibraryAccessDenied) | Enum GroupUpdateType. |

### SystemInfo

Class SystemInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string|null | Gets or sets the local address. |
| ServerName | string|null | Gets or sets the name of the server. |
| Version | string|null | Gets or sets the server version. |
| ProductName | string|null | Gets or sets the product name. This is the AssemblyProduct name. |
| OperatingSystem | string|null | Gets or sets the operating system. |
| Id | string|null | Gets or sets the id. |
| StartupWizardCompleted | boolean|null | Gets or sets a value indicating whether the startup wizard is completed. |
| OperatingSystemDisplayName | string|null | Gets or sets the display name of the operating system. |
| PackageName | string|null | Gets or sets the package name. |
| HasPendingRestart | boolean | Gets or sets a value indicating whether this instance has pending restart. |
| IsShuttingDown | boolean |  |
| SupportsLibraryMonitor | boolean | Gets or sets a value indicating whether [supports library monitor]. |
| WebSocketPortNumber | integer | Gets or sets the web socket port number. |
| CompletedInstallations | InstallationInfo[] | Gets or sets the completed installations. |
| CanSelfRestart | boolean | Gets or sets a value indicating whether this instance can self restart. |
| CanLaunchWebBrowser | boolean |  |
| ProgramDataPath | string|null | Gets or sets the program data path. |
| WebPath | string|null | Gets or sets the web UI resources path. |
| ItemsByNamePath | string|null | Gets or sets the items by name path. |
| CachePath | string|null | Gets or sets the cache path. |
| LogPath | string|null | Gets or sets the log path. |
| InternalMetadataPath | string|null | Gets or sets the internal metadata path. |
| TranscodingTempPath | string|null | Gets or sets the transcode path. |
| CastReceiverApplications | CastReceiverApplication[] | Gets or sets the list of cast receiver applications. |
| HasUpdateAvailable | boolean | Gets or sets a value indicating whether this instance has update available. |
| EncoderLocation | string|null |  |
| SystemArchitecture | string|null |  |

### SystemStorageDto

Contains informations about the systems storage.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ProgramDataFolder | FolderStorageDto | Gets or sets the Storage information of the program data folder. |
| WebFolder | FolderStorageDto | Gets or sets the Storage information of the web UI resources folder. |
| ImageCacheFolder | FolderStorageDto | Gets or sets the Storage information of the folder where images are cached. |
| CacheFolder | FolderStorageDto | Gets or sets the Storage information of the cache folder. |
| LogFolder | FolderStorageDto | Gets or sets the Storage information of the folder where logfiles are saved to. |
| InternalMetadataFolder | FolderStorageDto | Gets or sets the Storage information of the folder where metadata is stored. |
| TranscodingTempFolder | FolderStorageDto | Gets or sets the Storage information of the transcoding cache. |
| Libraries | LibraryStorageDto[] | Gets or sets the storage informations of all libraries. |

### TaskCompletionStatus

Enum TaskCompletionStatus.

枚举值：`Completed`, `Failed`, `Cancelled`, `Aborted`

### TaskInfo

Class TaskInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| State | string enum(Idle|Cancelling|Running) | Gets or sets the state of the task. |
| CurrentProgressPercentage | number|null | Gets or sets the progress. |
| Id | string|null | Gets or sets the id. |
| LastExecutionResult | TaskResult | Gets or sets the last execution result. |
| Triggers | TaskTriggerInfo[] | Gets or sets the triggers. |
| Description | string|null | Gets or sets the description. |
| Category | string|null | Gets or sets the category. |
| IsHidden | boolean | Gets or sets a value indicating whether this instance is hidden. |
| Key | string|null | Gets or sets the key. |

### TaskResult

Class TaskExecutionInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| StartTimeUtc | string | Gets or sets the start time UTC. |
| EndTimeUtc | string | Gets or sets the end time UTC. |
| Status | string enum(Completed|Failed|Cancelled|Aborted) | Gets or sets the status. |
| Name | string|null | Gets or sets the name. |
| Key | string|null | Gets or sets the key. |
| Id | string|null | Gets or sets the id. |
| ErrorMessage | string|null | Gets or sets the error message. |
| LongErrorMessage | string|null | Gets or sets the long error message. |

### TaskState

Enum TaskState.

枚举值：`Idle`, `Cancelling`, `Running`

### TaskTriggerInfo

Class TaskTriggerInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | string enum(DailyTrigger|WeeklyTrigger|IntervalTrigger|StartupTrigger) | Gets or sets the type. |
| TimeOfDayTicks | integer|null | Gets or sets the time of day. |
| IntervalTicks | integer|null | Gets or sets the interval. |
| DayOfWeek | string enum(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) | Gets or sets the day of week. |
| MaxRuntimeTicks | integer|null | Gets or sets the maximum runtime ticks. |

### TaskTriggerInfoType

Enum TaskTriggerInfoType.

枚举值：`DailyTrigger`, `WeeklyTrigger`, `IntervalTrigger`, `StartupTrigger`

### ThemeMediaResult

Class ThemeMediaResult.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |
| OwnerId | string | Gets or sets the owner id. |

### TimerCancelledMessage

Timer cancelled message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | TimerEventInfo | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### TimerCreatedMessage

Timer created message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | TimerEventInfo | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### TimerEventInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| ProgramId | string|null |  |

### TimerInfoDto

| 字段 | 类型 | 备注 |
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

### TimerInfoDtoQueryResult

Query result container.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Items | TimerInfoDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |

### TonemappingAlgorithm

Enum containing tonemapping algorithms.

枚举值：`none`, `clip`, `linear`, `gamma`, `reinhard`, `hable`, `mobius`, `bt2390`

### TonemappingMode

Enum containing tonemapping modes.

枚举值：`auto`, `max`, `rgb`, `lum`, `itp`

### TonemappingRange

Enum containing tonemapping ranges.

枚举值：`auto`, `tv`, `pc`

### TrailerInfo

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| OriginalTitle | string|null | Gets or sets the original title. |
| Path | string|null | Gets or sets the path. |
| MetadataLanguage | string|null | Gets or sets the metadata language. |
| MetadataCountryCode | string|null | Gets or sets the metadata country code. |
| ProviderIds | object|null | Gets or sets the provider ids. |
| Year | integer|null | Gets or sets the year. |
| IndexNumber | integer|null |  |
| ParentIndexNumber | integer|null |  |
| PremiereDate | string|null |  |
| IsAutomated | boolean |  |

### TrailerInfoRemoteSearchQuery

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| SearchInfo | TrailerInfo |  |
| ItemId | string |  |
| SearchProviderName | string|null | Gets or sets the provider name to search within if set. |
| IncludeDisabledProviders | boolean | Gets or sets a value indicating whether disabled providers should be included. |

### TranscodeReason

枚举值：`ContainerNotSupported`, `VideoCodecNotSupported`, `AudioCodecNotSupported`, `SubtitleCodecNotSupported`, `AudioIsExternal`, `SecondaryAudioNotSupported`, `VideoProfileNotSupported`, `VideoLevelNotSupported`, `VideoResolutionNotSupported`, `VideoBitDepthNotSupported`, `VideoFramerateNotSupported`, `RefFramesNotSupported`, `AnamorphicVideoNotSupported`, `InterlacedVideoNotSupported`, `AudioChannelsNotSupported`, `AudioProfileNotSupported`, `AudioSampleRateNotSupported`, `AudioBitDepthNotSupported`, `ContainerBitrateExceedsLimit`, `VideoBitrateNotSupported`, `AudioBitrateNotSupported`, `UnknownVideoStreamInfo`, `UnknownAudioStreamInfo`, `DirectPlayError`, `VideoRangeTypeNotSupported`, `VideoCodecTagNotSupported`, `StreamCountExceedsLimit`, `VideoRotationNotSupported`

### TranscodeSeekInfo

枚举值：`Auto`, `Bytes`

### TranscodingInfo

Class holding information on a running transcode.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| AudioCodec | string|null | Gets or sets the thread count used for encoding. |
| VideoCodec | string|null | Gets or sets the thread count used for encoding. |
| Container | string|null | Gets or sets the thread count used for encoding. |
| IsVideoDirect | boolean | Gets or sets a value indicating whether the video is passed through. |
| IsAudioDirect | boolean | Gets or sets a value indicating whether the audio is passed through. |
| Bitrate | integer|null | Gets or sets the bitrate. |
| Framerate | number|null | Gets or sets the framerate. |
| CompletionPercentage | number|null | Gets or sets the completion percentage. |
| Width | integer|null | Gets or sets the video width. |
| Height | integer|null | Gets or sets the video height. |
| AudioChannels | integer|null | Gets or sets the audio channels. |
| HardwareAccelerationType | string enum(none|amf|qsv|nvenc|v4l2m2m|vaapi|videotoolbox|rkmpp) | Gets or sets the hardware acceleration type. |
| TranscodeReasons | TranscodeReason[] | Gets or sets the transcode reasons. |

### TranscodingProfile

A class for transcoding profile information.
Note for client developers: Conditions defined in MediaBrowser.Model.Dlna.CodecProfile has higher priority and can override values defined here.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Container | string | Gets or sets the container. |
| Type | string enum(Audio|Video|Photo|Subtitle|Lyric) | Gets or sets the DLNA profile type. |
| VideoCodec | string | Gets or sets the video codec. |
| AudioCodec | string | Gets or sets the audio codec. |
| Protocol | string enum(http|hls) | Media streaming protocol.
Lowercase for backwards compatibility. |
| EstimateContentLength | boolean | Gets or sets a value indicating whether the content length should be estimated. |
| EnableMpegtsM2TsMode | boolean | Gets or sets a value indicating whether M2TS mode is enabled. |
| TranscodeSeekInfo | string enum(Auto|Bytes) | Gets or sets the transcoding seek info mode. |
| CopyTimestamps | boolean | Gets or sets a value indicating whether timestamps should be copied. |
| Context | string enum(Streaming|Static) | Gets or sets the encoding context. |
| EnableSubtitlesInManifest | boolean | Gets or sets a value indicating whether subtitles are allowed in the manifest. |
| MaxAudioChannels | string|null | Gets or sets the maximum audio channels. |
| MinSegments | integer | Gets or sets the minimum amount of segments. |
| SegmentLength | integer | Gets or sets the segment length. |
| BreakOnNonKeyFrames | boolean|null | Gets or sets a value indicating whether breaking the video stream on non-keyframes is supported. |
| Conditions | ProfileCondition[] | Gets or sets the profile conditions. |
| EnableAudioVbrEncoding | boolean | Gets or sets a value indicating whether variable bitrate encoding is supported. |

### TransportStreamTimestamp

枚举值：`None`, `Zero`, `Valid`

### TrickplayInfoDto

The trickplay api model.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Width | integer | Gets the width of an individual thumbnail. |
| Height | integer | Gets the height of an individual thumbnail. |
| TileWidth | integer | Gets the amount of thumbnails per row. |
| TileHeight | integer | Gets the amount of thumbnails per column. |
| ThumbnailCount | integer | Gets the total amount of non-black thumbnails. |
| Interval | integer | Gets the interval in milliseconds between each trickplay thumbnail. |
| Bandwidth | integer | Gets the peak bandwidth usage in bits per second. |

### TrickplayOptions

Class TrickplayOptions.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnableHwAcceleration | boolean | Gets or sets a value indicating whether or not to use HW acceleration. |
| EnableHwEncoding | boolean | Gets or sets a value indicating whether or not to use HW accelerated MJPEG encoding. |
| EnableKeyFrameOnlyExtraction | boolean | Gets or sets a value indicating whether to only extract key frames.
Significantly faster, but is not compatible with all decoders and/or video files. |
| ScanBehavior | string enum(Blocking|NonBlocking) | Gets or sets the behavior used by trickplay provider on library scan/update. |
| ProcessPriority | string enum(Normal|Idle|High|RealTime|BelowNormal|AboveNormal) | Gets or sets the process priority for the ffmpeg process. |
| Interval | integer | Gets or sets the interval, in ms, between each new trickplay image. |
| WidthResolutions | integer[] | Gets or sets the target width resolutions, in px, to generates preview images for. |
| TileWidth | integer | Gets or sets number of tile images to allow in X dimension. |
| TileHeight | integer | Gets or sets number of tile images to allow in Y dimension. |
| Qscale | integer | Gets or sets the ffmpeg output quality level. |
| JpegQuality | integer | Gets or sets the jpeg quality to use for image tiles. |
| ProcessThreads | integer | Gets or sets the number of threads to be used by ffmpeg. |

### TrickplayScanBehavior

Enum TrickplayScanBehavior.

枚举值：`Blocking`, `NonBlocking`

### TunerChannelMapping

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null |  |
| ProviderChannelName | string|null |  |
| ProviderChannelId | string|null |  |
| Id | string|null |  |

### TunerHostInfo

| 字段 | 类型 | 备注 |
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

### TypeOptions

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | string|null |  |
| MetadataFetchers | string[] |  |
| MetadataFetcherOrder | string[] |  |
| ImageFetchers | string[] |  |
| ImageFetcherOrder | string[] |  |
| ImageOptions | ImageOption[] |  |
| SimilarItemProviders | string[] |  |
| SimilarItemProviderOrder | string[] |  |

### UnratedItem

An enum representing an unrated item.

枚举值：`Movie`, `Trailer`, `Series`, `Music`, `Book`, `LiveTvChannel`, `LiveTvProgram`, `ChannelContent`, `Other`

### UpdateLibraryOptionsDto

Update library options dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string | Gets or sets the library item id. |
| LibraryOptions | LibraryOptions | Gets or sets library options. |

### UpdateMediaPathRequestDto

Update library options dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string | Gets or sets the library name. |
| PathInfo | MediaPathInfo | Gets or sets library folder path information. |

### UpdatePlaylistDto

Update existing playlist dto. Fields set to `null` will not be updated and keep their current values.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name of the new playlist. |
| Ids | string[] | Gets or sets item ids of the playlist. |
| Users | PlaylistUserPermissions[] | Gets or sets the playlist users. |
| IsPublic | boolean|null | Gets or sets a value indicating whether the playlist is public. |

### UpdatePlaylistUserDto

Update existing playlist user dto. Fields set to `null` will not be updated and keep their current values.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanEdit | boolean|null | Gets or sets a value indicating whether the user can edit the playlist. |

### UpdateUserItemDataDto

This is used by the api to get information about a item user data.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer|null | Gets or sets the playback position ticks. |
| PlayCount | integer|null | Gets or sets the play count. |
| IsFavorite | boolean|null | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UpdateUserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string|null | Gets or sets the key. |
| ItemId | string|null | Gets or sets the item identifier. |

### UpdateUserPassword

The update user password request body.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CurrentPassword | string|null | Gets or sets the current sha1-hashed password. |
| CurrentPw | string|null | Gets or sets the current plain text password. |
| NewPw | string|null | Gets or sets the new plain text password. |
| ResetPassword | boolean | Gets or sets a value indicating whether to reset the password. |

### UploadSubtitleDto

Upload subtitles dto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Language | string | Gets or sets the subtitle language. |
| Format | string | Gets or sets the subtitle format. |
| IsForced | boolean | Gets or sets a value indicating whether the subtitle is forced. |
| IsHearingImpaired | boolean | Gets or sets a value indicating whether the subtitle is for hearing impaired. |
| Data | string | Gets or sets the subtitle data. |

### UserConfiguration

Class UserConfiguration.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| AudioLanguagePreference | string|null | Gets or sets the audio language preference. |
| PlayDefaultAudioTrack | boolean | Gets or sets a value indicating whether [play default audio track]. |
| SubtitleLanguagePreference | string|null | Gets or sets the subtitle language preference. |
| DisplayMissingEpisodes | boolean |  |
| GroupedFolders | string[] |  |
| SubtitleMode | string enum(Default|Always|OnlyForced|None|Smart) | An enum representing a subtitle playback mode. |
| DisplayCollectionsView | boolean |  |
| EnableLocalPassword | boolean |  |
| OrderedViews | string[] |  |
| LatestItemsExcludes | string[] |  |
| MyMediaExcludes | string[] |  |
| HidePlayedInLatest | boolean |  |
| RememberAudioSelections | boolean |  |
| RememberSubtitleSelections | boolean |  |
| EnableNextEpisodeAutoPlay | boolean |  |
| CastReceiverId | string|null | Gets or sets the id of the selected cast receiver. |

### UserDataChangedMessage

User data changed message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | UserDataChangeInfo | Class UserDataChangeInfo. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### UserDataChangeInfo

Class UserDataChangeInfo.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string | Gets or sets the user id. |
| UserDataList | UserItemDataDto[] | Gets or sets the user data list. |

### UserDeletedMessage

User deleted message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | string | Gets or sets the data. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### UserDto

Class UserDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| ServerId | string|null | Gets or sets the server identifier. |
| ServerName | string|null | Gets or sets the name of the server.
This is not used by the server and is for client-side usage only. |
| Id | string | Gets or sets the id. |
| PrimaryImageTag | string|null | Gets or sets the primary image tag. |
| HasPassword | boolean|null | Gets or sets a value indicating whether this instance has password. |
| HasConfiguredPassword | boolean|null | Gets or sets a value indicating whether this instance has configured password. |
| HasConfiguredEasyPassword | boolean|null | Gets or sets a value indicating whether this instance has configured easy password. |
| EnableAutoLogin | boolean|null | Gets or sets whether async login is enabled or not. |
| LastLoginDate | string|null | Gets or sets the last login date. |
| LastActivityDate | string|null | Gets or sets the last activity date. |
| Configuration | UserConfiguration | Gets or sets the configuration. |
| Policy | UserPolicy | Gets or sets the policy. |
| PrimaryImageAspectRatio | number|null | Gets or sets the primary image aspect ratio. |

### UserItemDataDto

Class UserItemDataDto.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |

### UserPolicy

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IsAdministrator | boolean | Gets or sets a value indicating whether this instance is administrator. |
| IsHidden | boolean | Gets or sets a value indicating whether this instance is hidden. |
| EnableCollectionManagement | boolean | Gets or sets a value indicating whether this instance can manage collections. |
| EnableSubtitleManagement | boolean | Gets or sets a value indicating whether this instance can manage subtitles. |
| EnableLyricManagement | boolean | Gets or sets a value indicating whether this user can manage lyrics. |
| IsDisabled | boolean | Gets or sets a value indicating whether this instance is disabled. |
| MaxParentalRating | integer|null | Gets or sets the max parental rating. |
| MaxParentalSubRating | integer|null |  |
| BlockedTags | string[] |  |
| AllowedTags | string[] |  |
| EnableUserPreferenceAccess | boolean |  |
| AccessSchedules | AccessSchedule[] |  |
| BlockUnratedItems | UnratedItem[] |  |
| EnableRemoteControlOfOtherUsers | boolean |  |
| EnableSharedDeviceControl | boolean |  |
| EnableRemoteAccess | boolean |  |
| EnableLiveTvManagement | boolean |  |
| EnableLiveTvAccess | boolean |  |
| EnableMediaPlayback | boolean |  |
| EnableAudioPlaybackTranscoding | boolean |  |
| EnableVideoPlaybackTranscoding | boolean |  |
| EnablePlaybackRemuxing | boolean |  |
| ForceRemoteSourceTranscoding | boolean |  |
| EnableContentDeletion | boolean |  |
| EnableContentDeletionFromFolders | string[] |  |
| EnableContentDownloading | boolean |  |
| EnableSyncTranscoding | boolean | Gets or sets a value indicating whether [enable synchronize]. |
| EnableMediaConversion | boolean |  |
| EnabledDevices | string[] |  |
| EnableAllDevices | boolean |  |
| EnabledChannels | string[] |  |
| EnableAllChannels | boolean |  |
| EnabledFolders | string[] |  |
| EnableAllFolders | boolean |  |
| InvalidLoginAttemptCount | integer |  |
| LoginAttemptsBeforeLockout | integer |  |
| MaxActiveSessions | integer |  |
| EnablePublicSharing | boolean |  |
| BlockedMediaFolders | string[] |  |
| BlockedChannels | string[] |  |
| RemoteClientBitrateLimit | integer |  |
| AuthenticationProviderId | string |  |
| PasswordResetProviderId | string |  |
| SyncPlayAccess | string enum(CreateAndJoinGroups|JoinGroups|None) | Enum SyncPlayUserAccessType. |

### UserUpdatedMessage

User updated message.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Data | UserDto | Class UserDto. |
| MessageId | string | Gets or sets the message id. |
| MessageType | string enum(ForceKeepAlive|GeneralCommand|UserDataChanged|Sessions|Play|SyncPlayCommand|SyncPlayGroupUpdate|Playstate|RestartRequired|ServerShuttingDown|ServerRestarting|LibraryChanged|UserDeleted|UserUpdated|SeriesTimerCreated|TimerCreated|SeriesTimerCancelled|TimerCancelled|RefreshProgress|ScheduledTaskEnded|PackageInstallationCancelled|PackageInstallationFailed|PackageInstallationCompleted|PackageInstalling|PackageUninstalled|ActivityLogEntry|ScheduledTasksInfo|ActivityLogEntryStart|ActivityLogEntryStop|SessionsStart|SessionsStop|ScheduledTasksInfoStart|ScheduledTasksInfoStop|KeepAlive) | The different kinds of messages that are used in the WebSocket api. |

### UtcTimeResponse

Class UtcTimeResponse.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| RequestReceptionTime | string | Gets the UTC time when request has been received. |
| ResponseTransmissionTime | string | Gets the UTC time when response has been sent. |

### ValidatePathDto

Validate path object.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ValidateWritable | boolean | Gets or sets a value indicating whether validate if path is writable. |
| Path | string|null | Gets or sets the path. |
| IsFile | boolean|null | Gets or sets is path file. |

### VersionInfo

Defines the MediaBrowser.Model.Updates.VersionInfo class.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| version | string | Gets or sets the version. |
| VersionNumber | string | Gets the version as a System.Version. |
| changelog | string|null | Gets or sets the changelog for this version. |
| targetAbi | string|null | Gets or sets the ABI that this version was built against. |
| sourceUrl | string|null | Gets or sets the source URL. |
| checksum | string|null | Gets or sets a checksum for the binary. |
| timestamp | string|null | Gets or sets a timestamp of when the binary was built. |
| repositoryName | string | Gets or sets the repository name. |
| repositoryUrl | string | Gets or sets the repository url. |

### Video3DFormat

枚举值：`HalfSideBySide`, `FullSideBySide`, `FullTopAndBottom`, `HalfTopAndBottom`, `MVC`

### VideoRange

An enum representing video ranges.

枚举值：`Unknown`, `SDR`, `HDR`

### VideoRangeType

An enum representing types of video ranges.

枚举值：`Unknown`, `SDR`, `HDR10`, `HLG`, `DOVI`, `DOVIWithHDR10`, `DOVIWithHLG`, `DOVIWithSDR`, `DOVIWithEL`, `DOVIWithHDR10Plus`, `DOVIWithELHDR10Plus`, `DOVIInvalid`, `HDR10Plus`

### VideoType

Enum VideoType.

枚举值：`VideoFile`, `Iso`, `Dvd`, `BluRay`

### VirtualFolderInfo

Used to hold information about a user's list of configured virtual folders.

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string|null | Gets or sets the name. |
| Locations | string[] | Gets or sets the locations. |
| CollectionType | string enum(movies|tvshows|music|musicvideos|homevideos|boxsets|books|mixed) | Gets or sets the type of the collection. |
| LibraryOptions | LibraryOptions |  |
| ItemId | string|null | Gets or sets the item identifier. |
| PrimaryImageItemId | string|null | Gets or sets the primary image item identifier. |
| RefreshProgress | number|null |  |
| RefreshStatus | string|null |  |

### WebSocketMessage

Represents the possible websocket types

基础类型：`object`

### XbmcMetadataOptions

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| UserId | string|null |  |
| ReleaseDateFormat | string |  |
| SaveImagePathsInNfo | boolean |  |
| EnablePathSubstitution | boolean |  |
| EnableExtraThumbsDuplication | boolean |  |

