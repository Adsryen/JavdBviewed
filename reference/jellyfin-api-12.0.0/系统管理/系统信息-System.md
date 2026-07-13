# 系统信息（System）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：19

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/ClientLog/Document` | LogFile | Upload a document. |
| GET | `/GetUtcTime` | GetUtcTime | Gets the current UTC time. |
| GET | `/System/ActivityLog/Entries` | GetLogEntries | Gets activity log entries. |
| GET | `/System/Configuration` | GetConfiguration | Gets application configuration. |
| POST | `/System/Configuration` | UpdateConfiguration | Updates application configuration. |
| GET | `/System/Configuration/{key}` | GetNamedConfiguration | Gets a named configuration. |
| POST | `/System/Configuration/{key}` | UpdateNamedConfiguration | Updates named configuration. |
| POST | `/System/Configuration/Branding` | UpdateBrandingConfiguration | Updates branding configuration. |
| GET | `/System/Configuration/MetadataOptions/Default` | GetDefaultMetadataOptions | Gets a default MetadataOptions object. |
| GET | `/System/Endpoint` | GetEndpointInfo | Gets information about the request endpoint. |
| GET | `/System/Info` | GetSystemInfo | Gets information about the server. |
| GET | `/System/Info/Public` | GetPublicSystemInfo | Gets public information about the server. |
| GET | `/System/Info/Storage` | GetSystemStorage | Gets information about the server. |
| GET | `/System/Logs` | GetServerLogs | Gets a list of available server log files. |
| GET | `/System/Logs/Log` | GetLogFile | Gets a log file. |
| GET | `/System/Ping` | GetPingSystem | Pings the system. |
| POST | `/System/Ping` | PostPingSystem | Pings the system. |
| POST | `/System/Restart` | RestartApplication | Restarts the application. |
| POST | `/System/Shutdown` | ShutdownApplication | Shuts down the application. |

---

## LogFile

### 基本信息
**Path：** POST 服务器地址 + /ClientLog/Document

**Method：** POST

**接口描述：** Upload a document.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- Content-Type：`text/plain`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Document saved. | ClientLogDocumentResponseDto |
| 401 | Unauthorized |  |
| 403 | Event logging disabled. | ProblemDetails |
| 413 | Upload size too large. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ClientLogDocumentResponseDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| FileName | string | Gets the resulting filename. |


**200 字段说明（ClientLogDocumentResponseDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| FileName | string | Gets the resulting filename. |


**200 字段说明（ClientLogDocumentResponseDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| FileName | string | Gets the resulting filename. |


---

## GetUtcTime

### 基本信息
**Path：** GET 服务器地址 + /GetUtcTime

**Method：** GET

**接口描述：** Gets the current UTC time.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Time returned. | UtcTimeResponse |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UtcTimeResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RequestReceptionTime | string | Gets the UTC time when request has been received. |
| ResponseTransmissionTime | string | Gets the UTC time when response has been sent. |


**200 字段说明（UtcTimeResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RequestReceptionTime | string | Gets the UTC time when request has been received. |
| ResponseTransmissionTime | string | Gets the UTC time when response has been sent. |


**200 字段说明（UtcTimeResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| RequestReceptionTime | string | Gets the UTC time when request has been received. |
| ResponseTransmissionTime | string | Gets the UTC time when response has been sent. |


---

## GetLogEntries

### 基本信息
**Path：** GET 服务器地址 + /System/ActivityLog/Entries

**Method：** GET

**接口描述：** Gets activity log entries.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| startIndex | 否 | integer |  | The record index to start at. All items with a lower index will be dropped from the results. |
| limit | 否 | integer |  | The maximum number of records to return. |
| minDate | 否 | string |  | The minimum date. |
| maxDate | 否 | string |  | The maximum date. |
| hasUserId | 否 | boolean |  | Filter log entries if it has user id, or not. |
| name | 否 | string |  | Filter by name. |
| overview | 否 | string |  | Filter by overview. |
| shortOverview | 否 | string |  | Filter by short overview. |
| type | 否 | string |  | Filter by type. |
| itemId | 否 | string |  | Filter by item id. |
| username | 否 | string |  | Filter by username. |
| severity | 否 | string enum(Trace|Debug|Information|Warning|Error|Critical|None) |  | Filter by log severity. |
| sortBy | 否 | ActivityLogSortBy[] |  | Specify one or more sort orders. Format: SortBy=Name,Type. |
| sortOrder | 否 | SortOrder[] |  | Sort Order.. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Activity log returned. | ActivityLogEntryQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ActivityLogEntryQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ActivityLogEntry[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（ActivityLogEntryQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ActivityLogEntry[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（ActivityLogEntryQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | ActivityLogEntry[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## GetConfiguration

### 基本信息
**Path：** GET 服务器地址 + /System/Configuration

**Method：** GET

**接口描述：** Gets application configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Application configuration returned. | ServerConfiguration |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（ServerConfiguration）**

| 名称 | 类型 | 备注 |
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


**200 字段说明（ServerConfiguration）**

| 名称 | 类型 | 备注 |
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


**200 字段说明（ServerConfiguration）**

| 名称 | 类型 | 备注 |
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


---

## UpdateConfiguration

### 基本信息
**Path：** POST 服务器地址 + /System/Configuration

**Method：** POST

**接口描述：** Updates application configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Configuration.
- Content-Type：`application/json`
- Schema：`ServerConfiguration`
- Content-Type：`text/json`
- Schema：`ServerConfiguration`
- Content-Type：`application/*+json`
- Schema：`ServerConfiguration`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Configuration updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetNamedConfiguration

### 基本信息
**Path：** GET 服务器地址 + /System/Configuration/{key}

**Method：** GET

**接口描述：** Gets a named configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| key | 是 | string |  | Configuration key. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Configuration returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateNamedConfiguration

### 基本信息
**Path：** POST 服务器地址 + /System/Configuration/{key}

**Method：** POST

**接口描述：** Updates named configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| key | 是 | string |  | Configuration key. |


**Body**

- 是否必须：是
- 描述：Configuration.
- Content-Type：`application/json`
- Content-Type：`text/json`
- Content-Type：`application/*+json`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Named configuration updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateBrandingConfiguration

### 基本信息
**Path：** POST 服务器地址 + /System/Configuration/Branding

**Method：** POST

**接口描述：** Updates branding configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Branding configuration.
- Content-Type：`application/json`
- Schema：`BrandingOptionsDto`
- Content-Type：`text/json`
- Schema：`BrandingOptionsDto`
- Content-Type：`application/*+json`
- Schema：`BrandingOptionsDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Branding configuration updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetDefaultMetadataOptions

### 基本信息
**Path：** GET 服务器地址 + /System/Configuration/MetadataOptions/Default

**Method：** GET

**接口描述：** Gets a default MetadataOptions object.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Metadata options returned. | MetadataOptions |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（MetadataOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemType | string|null |  |
| DisabledMetadataSavers | string[] |  |
| LocalMetadataReaderOrder | string[] |  |
| DisabledMetadataFetchers | string[] |  |
| MetadataFetcherOrder | string[] |  |
| DisabledImageFetchers | string[] |  |
| ImageFetcherOrder | string[] |  |


**200 字段说明（MetadataOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemType | string|null |  |
| DisabledMetadataSavers | string[] |  |
| LocalMetadataReaderOrder | string[] |  |
| DisabledMetadataFetchers | string[] |  |
| MetadataFetcherOrder | string[] |  |
| DisabledImageFetchers | string[] |  |
| ImageFetcherOrder | string[] |  |


**200 字段说明（MetadataOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemType | string|null |  |
| DisabledMetadataSavers | string[] |  |
| LocalMetadataReaderOrder | string[] |  |
| DisabledMetadataFetchers | string[] |  |
| MetadataFetcherOrder | string[] |  |
| DisabledImageFetchers | string[] |  |
| ImageFetcherOrder | string[] |  |


---

## GetEndpointInfo

### 基本信息
**Path：** GET 服务器地址 + /System/Endpoint

**Method：** GET

**接口描述：** Gets information about the request endpoint.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | EndPointInfo |
| 401 | Unauthorized |  |
| 403 | User does not have permission to get endpoint information. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（EndPointInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsLocal | boolean |  |
| IsInNetwork | boolean |  |


**200 字段说明（EndPointInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsLocal | boolean |  |
| IsInNetwork | boolean |  |


**200 字段说明（EndPointInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| IsLocal | boolean |  |
| IsInNetwork | boolean |  |


---

## GetSystemInfo

### 基本信息
**Path：** GET 服务器地址 + /System/Info

**Method：** GET

**接口描述：** Gets information about the server.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | SystemInfo |
| 401 | Unauthorized |  |
| 403 | User does not have permission to retrieve information. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（SystemInfo）**

| 名称 | 类型 | 备注 |
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


**200 字段说明（SystemInfo）**

| 名称 | 类型 | 备注 |
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


**200 字段说明（SystemInfo）**

| 名称 | 类型 | 备注 |
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


---

## GetPublicSystemInfo

### 基本信息
**Path：** GET 服务器地址 + /System/Info/Public

**Method：** GET

**接口描述：** Gets public information about the server.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | PublicSystemInfo |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PublicSystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string|null | Gets or sets the local address. |
| ServerName | string|null | Gets or sets the name of the server. |
| Version | string|null | Gets or sets the server version. |
| ProductName | string|null | Gets or sets the product name. This is the AssemblyProduct name. |
| OperatingSystem | string|null | Gets or sets the operating system. |
| Id | string|null | Gets or sets the id. |
| StartupWizardCompleted | boolean|null | Gets or sets a value indicating whether the startup wizard is completed. |


**200 字段说明（PublicSystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string|null | Gets or sets the local address. |
| ServerName | string|null | Gets or sets the name of the server. |
| Version | string|null | Gets or sets the server version. |
| ProductName | string|null | Gets or sets the product name. This is the AssemblyProduct name. |
| OperatingSystem | string|null | Gets or sets the operating system. |
| Id | string|null | Gets or sets the id. |
| StartupWizardCompleted | boolean|null | Gets or sets a value indicating whether the startup wizard is completed. |


**200 字段说明（PublicSystemInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LocalAddress | string|null | Gets or sets the local address. |
| ServerName | string|null | Gets or sets the name of the server. |
| Version | string|null | Gets or sets the server version. |
| ProductName | string|null | Gets or sets the product name. This is the AssemblyProduct name. |
| OperatingSystem | string|null | Gets or sets the operating system. |
| Id | string|null | Gets or sets the id. |
| StartupWizardCompleted | boolean|null | Gets or sets a value indicating whether the startup wizard is completed. |


---

## GetSystemStorage

### 基本信息
**Path：** GET 服务器地址 + /System/Info/Storage

**Method：** GET

**接口描述：** Gets information about the server.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | SystemStorageDto |
| 401 | Unauthorized |  |
| 403 | User does not have permission to retrieve information. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（SystemStorageDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ProgramDataFolder | FolderStorageDto | Gets or sets the Storage information of the program data folder. |
| WebFolder | FolderStorageDto | Gets or sets the Storage information of the web UI resources folder. |
| ImageCacheFolder | FolderStorageDto | Gets or sets the Storage information of the folder where images are cached. |
| CacheFolder | FolderStorageDto | Gets or sets the Storage information of the cache folder. |
| LogFolder | FolderStorageDto | Gets or sets the Storage information of the folder where logfiles are saved to. |
| InternalMetadataFolder | FolderStorageDto | Gets or sets the Storage information of the folder where metadata is stored. |
| TranscodingTempFolder | FolderStorageDto | Gets or sets the Storage information of the transcoding cache. |
| Libraries | LibraryStorageDto[] | Gets or sets the storage informations of all libraries. |


**200 字段说明（SystemStorageDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ProgramDataFolder | FolderStorageDto | Gets or sets the Storage information of the program data folder. |
| WebFolder | FolderStorageDto | Gets or sets the Storage information of the web UI resources folder. |
| ImageCacheFolder | FolderStorageDto | Gets or sets the Storage information of the folder where images are cached. |
| CacheFolder | FolderStorageDto | Gets or sets the Storage information of the cache folder. |
| LogFolder | FolderStorageDto | Gets or sets the Storage information of the folder where logfiles are saved to. |
| InternalMetadataFolder | FolderStorageDto | Gets or sets the Storage information of the folder where metadata is stored. |
| TranscodingTempFolder | FolderStorageDto | Gets or sets the Storage information of the transcoding cache. |
| Libraries | LibraryStorageDto[] | Gets or sets the storage informations of all libraries. |


**200 字段说明（SystemStorageDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ProgramDataFolder | FolderStorageDto | Gets or sets the Storage information of the program data folder. |
| WebFolder | FolderStorageDto | Gets or sets the Storage information of the web UI resources folder. |
| ImageCacheFolder | FolderStorageDto | Gets or sets the Storage information of the folder where images are cached. |
| CacheFolder | FolderStorageDto | Gets or sets the Storage information of the cache folder. |
| LogFolder | FolderStorageDto | Gets or sets the Storage information of the folder where logfiles are saved to. |
| InternalMetadataFolder | FolderStorageDto | Gets or sets the Storage information of the folder where metadata is stored. |
| TranscodingTempFolder | FolderStorageDto | Gets or sets the Storage information of the transcoding cache. |
| Libraries | LibraryStorageDto[] | Gets or sets the storage informations of all libraries. |


---

## GetServerLogs

### 基本信息
**Path：** GET 服务器地址 + /System/Logs

**Method：** GET

**接口描述：** Gets a list of available server log files.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | LogFile[] |
| 401 | Unauthorized |  |
| 403 | User does not have permission to get server logs. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLogFile

### 基本信息
**Path：** GET 服务器地址 + /System/Logs/Log

**Method：** GET

**接口描述：** Gets a log file.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | The name of the log file to get. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Log file retrieved. | string |
| 401 | Unauthorized |  |
| 403 | User does not have permission to get log files. | ProblemDetails |
| 404 | Could not find a log file with the name. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPingSystem

### 基本信息
**Path：** GET 服务器地址 + /System/Ping

**Method：** GET

**接口描述：** Pings the system.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostPingSystem

### 基本信息
**Path：** POST 服务器地址 + /System/Ping

**Method：** POST

**接口描述：** Pings the system.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Information retrieved. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RestartApplication

### 基本信息
**Path：** POST 服务器地址 + /System/Restart

**Method：** POST

**接口描述：** Restarts the application.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Server restarted. |  |
| 401 | Unauthorized |  |
| 403 | User does not have permission to restart server. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ShutdownApplication

### 基本信息
**Path：** POST 服务器地址 + /System/Shutdown

**Method：** POST

**接口描述：** Shuts down the application.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Server shut down. |  |
| 401 | Unauthorized |  |
| 403 | User does not have permission to shutdown server. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

