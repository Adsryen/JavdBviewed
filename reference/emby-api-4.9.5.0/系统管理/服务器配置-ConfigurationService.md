# 服务器配置（ConfigurationService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/System/Configuration` | getSystemConfiguration | Gets application configuration |
| POST | `/System/Configuration` | postSystemConfiguration | Updates application configuration |
| GET | `/System/Configuration/{Key}` | getSystemConfigurationByKey | Gets a named configuration |
| POST | `/System/Configuration/{Key}` | postSystemConfigurationByKey | Updates named configuration |
| POST | `/System/Configuration/Partial` | postSystemConfigurationPartial | Updates application configuration |

---

## getSystemConfiguration

### 基本信息
**Path：** GET 服务器地址 + /System/Configuration

**Method：** GET

**接口描述：** Gets application configuration

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ServerConfiguration object. | ServerConfiguration |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（ServerConfiguration）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| EnableUPnP | boolean |  |
| PublicPort | integer |  |
| PublicHttpsPort | integer |  |
| HttpServerPortNumber | integer |  |
| HttpsPortNumber | integer |  |
| EnableHttps | boolean |  |
| CertificatePath | string |  |
| CertificatePassword | string |  |
| IsPortAuthorized | boolean |  |
| AutoRunWebApp | boolean |  |
| EnableRemoteAccess | boolean |  |
| LogAllQueryTimes | boolean |  |
| DisableOutgoingIPv6 | boolean |  |
| EnableCaseSensitiveItemIds | boolean |  |
| MetadataPath | string |  |
| MetadataNetworkPath | string |  |
| PreferredMetadataLanguage | string |  |
| MetadataCountryCode | string |  |
| SortRemoveWords | string[] |  |
| LibraryMonitorDelaySeconds | integer |  |
| EnableDashboardResponseCaching | boolean |  |
| DashboardSourcePath | string |  |
| ImageSavingConvention | ImageSavingConvention |  |
| EnableAutomaticRestart | boolean |  |
| ServerName | string |  |
| PreferredDetectedRemoteAddressFamily | Net.Sockets.AddressFamily |  |
| WanDdns | string |  |
| UICulture | string |  |
| RemoteClientBitrateLimit | integer |  |
| LocalNetworkSubnets | string[] |  |
| LocalNetworkAddresses | string[] |  |
| EnableExternalContentInSuggestions | boolean |  |
| RequireHttps | boolean |  |
| IsBehindProxy | boolean |  |
| RemoteIPFilter | string[] |  |
| IsRemoteIPFilterBlacklist | boolean |  |
| ImageExtractionTimeoutMs | integer |  |
| PathSubstitutions | PathSubstitution[] |  |
| UninstalledPlugins | string[] |  |
| CollapseVideoFolders | boolean |  |
| EnableOriginalTrackTitles | boolean |  |
| VacuumDatabaseOnStartup | boolean |  |
| SimultaneousStreamLimit | integer |  |
| DatabaseCacheSizeMB | integer |  |
| EnableSqLiteMmio | boolean |  |
| PlaylistsUpgradedToM3U | boolean |  |
| ImageExtractorUpgraded1 | boolean |  |
| EnablePeopleLetterSubFolders | boolean |  |
| OptimizeDatabaseOnShutdown | boolean |  |
| DatabaseAnalysisLimit | integer |  |
| MaxLibraryDatabaseConnections | integer |  |
| MaxAuthDbConnections | integer |  |
| MaxOtherDbConnections | integer |  |
| DisableAsyncIO | boolean |  |
| MigratedToUserItemShares8 | boolean |  |
| MigratedLibraryOptionsToDb | boolean |  |
| AllowLegacyLocalNetworkPassword | boolean |  |
| EnableSavedMetadataForPeople | boolean |  |
| TvChannelsRefreshed | boolean |  |
| ProxyHeaderMode | ProxyHeaderMode |  |
| IsInMaintenanceMode | boolean |  |
| MaintenanceModeMessage | string |  |
| EnableDebugLevelLogging | boolean |  |
| RevertDebugLogging | string |  |
| EnableAutoUpdate | boolean |  |
| LogFileRetentionDays | integer |  |
| RunAtStartup | boolean |  |
| IsStartupWizardCompleted | boolean |  |
| CachePath | string |  |


**200 字段说明（ServerConfiguration）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| EnableUPnP | boolean |  |
| PublicPort | integer |  |
| PublicHttpsPort | integer |  |
| HttpServerPortNumber | integer |  |
| HttpsPortNumber | integer |  |
| EnableHttps | boolean |  |
| CertificatePath | string |  |
| CertificatePassword | string |  |
| IsPortAuthorized | boolean |  |
| AutoRunWebApp | boolean |  |
| EnableRemoteAccess | boolean |  |
| LogAllQueryTimes | boolean |  |
| DisableOutgoingIPv6 | boolean |  |
| EnableCaseSensitiveItemIds | boolean |  |
| MetadataPath | string |  |
| MetadataNetworkPath | string |  |
| PreferredMetadataLanguage | string |  |
| MetadataCountryCode | string |  |
| SortRemoveWords | string[] |  |
| LibraryMonitorDelaySeconds | integer |  |
| EnableDashboardResponseCaching | boolean |  |
| DashboardSourcePath | string |  |
| ImageSavingConvention | ImageSavingConvention |  |
| EnableAutomaticRestart | boolean |  |
| ServerName | string |  |
| PreferredDetectedRemoteAddressFamily | Net.Sockets.AddressFamily |  |
| WanDdns | string |  |
| UICulture | string |  |
| RemoteClientBitrateLimit | integer |  |
| LocalNetworkSubnets | string[] |  |
| LocalNetworkAddresses | string[] |  |
| EnableExternalContentInSuggestions | boolean |  |
| RequireHttps | boolean |  |
| IsBehindProxy | boolean |  |
| RemoteIPFilter | string[] |  |
| IsRemoteIPFilterBlacklist | boolean |  |
| ImageExtractionTimeoutMs | integer |  |
| PathSubstitutions | PathSubstitution[] |  |
| UninstalledPlugins | string[] |  |
| CollapseVideoFolders | boolean |  |
| EnableOriginalTrackTitles | boolean |  |
| VacuumDatabaseOnStartup | boolean |  |
| SimultaneousStreamLimit | integer |  |
| DatabaseCacheSizeMB | integer |  |
| EnableSqLiteMmio | boolean |  |
| PlaylistsUpgradedToM3U | boolean |  |
| ImageExtractorUpgraded1 | boolean |  |
| EnablePeopleLetterSubFolders | boolean |  |
| OptimizeDatabaseOnShutdown | boolean |  |
| DatabaseAnalysisLimit | integer |  |
| MaxLibraryDatabaseConnections | integer |  |
| MaxAuthDbConnections | integer |  |
| MaxOtherDbConnections | integer |  |
| DisableAsyncIO | boolean |  |
| MigratedToUserItemShares8 | boolean |  |
| MigratedLibraryOptionsToDb | boolean |  |
| AllowLegacyLocalNetworkPassword | boolean |  |
| EnableSavedMetadataForPeople | boolean |  |
| TvChannelsRefreshed | boolean |  |
| ProxyHeaderMode | ProxyHeaderMode |  |
| IsInMaintenanceMode | boolean |  |
| MaintenanceModeMessage | string |  |
| EnableDebugLevelLogging | boolean |  |
| RevertDebugLogging | string |  |
| EnableAutoUpdate | boolean |  |
| LogFileRetentionDays | integer |  |
| RunAtStartup | boolean |  |
| IsStartupWizardCompleted | boolean |  |
| CachePath | string |  |


---

## postSystemConfiguration

### 基本信息
**Path：** POST 服务器地址 + /System/Configuration

**Method：** POST

**接口描述：** Updates application configuration

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：ServerConfiguration:
- Content-Type：`application/json`
- Schema：`ServerConfiguration`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnableUPnP | boolean |  |
| PublicPort | integer |  |
| PublicHttpsPort | integer |  |
| HttpServerPortNumber | integer |  |
| HttpsPortNumber | integer |  |
| EnableHttps | boolean |  |
| CertificatePath | string |  |
| CertificatePassword | string |  |
| IsPortAuthorized | boolean |  |
| AutoRunWebApp | boolean |  |
| EnableRemoteAccess | boolean |  |
| LogAllQueryTimes | boolean |  |
| DisableOutgoingIPv6 | boolean |  |
| EnableCaseSensitiveItemIds | boolean |  |
| MetadataPath | string |  |
| MetadataNetworkPath | string |  |
| PreferredMetadataLanguage | string |  |
| MetadataCountryCode | string |  |
| SortRemoveWords | string[] |  |
| LibraryMonitorDelaySeconds | integer |  |
| EnableDashboardResponseCaching | boolean |  |
| DashboardSourcePath | string |  |
| ImageSavingConvention | ImageSavingConvention |  |
| EnableAutomaticRestart | boolean |  |
| ServerName | string |  |
| PreferredDetectedRemoteAddressFamily | Net.Sockets.AddressFamily |  |
| WanDdns | string |  |
| UICulture | string |  |
| RemoteClientBitrateLimit | integer |  |
| LocalNetworkSubnets | string[] |  |
| LocalNetworkAddresses | string[] |  |
| EnableExternalContentInSuggestions | boolean |  |
| RequireHttps | boolean |  |
| IsBehindProxy | boolean |  |
| RemoteIPFilter | string[] |  |
| IsRemoteIPFilterBlacklist | boolean |  |
| ImageExtractionTimeoutMs | integer |  |
| PathSubstitutions | PathSubstitution[] |  |
| UninstalledPlugins | string[] |  |
| CollapseVideoFolders | boolean |  |
| EnableOriginalTrackTitles | boolean |  |
| VacuumDatabaseOnStartup | boolean |  |
| SimultaneousStreamLimit | integer |  |
| DatabaseCacheSizeMB | integer |  |
| EnableSqLiteMmio | boolean |  |
| PlaylistsUpgradedToM3U | boolean |  |
| ImageExtractorUpgraded1 | boolean |  |
| EnablePeopleLetterSubFolders | boolean |  |
| OptimizeDatabaseOnShutdown | boolean |  |
| DatabaseAnalysisLimit | integer |  |
| MaxLibraryDatabaseConnections | integer |  |
| MaxAuthDbConnections | integer |  |
| MaxOtherDbConnections | integer |  |
| DisableAsyncIO | boolean |  |
| MigratedToUserItemShares8 | boolean |  |
| MigratedLibraryOptionsToDb | boolean |  |
| AllowLegacyLocalNetworkPassword | boolean |  |
| EnableSavedMetadataForPeople | boolean |  |
| TvChannelsRefreshed | boolean |  |
| ProxyHeaderMode | ProxyHeaderMode |  |
| IsInMaintenanceMode | boolean |  |
| MaintenanceModeMessage | string |  |
| EnableDebugLevelLogging | boolean |  |
| RevertDebugLogging | string |  |
| EnableAutoUpdate | boolean |  |
| LogFileRetentionDays | integer |  |
| RunAtStartup | boolean |  |
| IsStartupWizardCompleted | boolean |  |
| CachePath | string |  |

- Content-Type：`application/xml`
- Schema：`ServerConfiguration`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnableUPnP | boolean |  |
| PublicPort | integer |  |
| PublicHttpsPort | integer |  |
| HttpServerPortNumber | integer |  |
| HttpsPortNumber | integer |  |
| EnableHttps | boolean |  |
| CertificatePath | string |  |
| CertificatePassword | string |  |
| IsPortAuthorized | boolean |  |
| AutoRunWebApp | boolean |  |
| EnableRemoteAccess | boolean |  |
| LogAllQueryTimes | boolean |  |
| DisableOutgoingIPv6 | boolean |  |
| EnableCaseSensitiveItemIds | boolean |  |
| MetadataPath | string |  |
| MetadataNetworkPath | string |  |
| PreferredMetadataLanguage | string |  |
| MetadataCountryCode | string |  |
| SortRemoveWords | string[] |  |
| LibraryMonitorDelaySeconds | integer |  |
| EnableDashboardResponseCaching | boolean |  |
| DashboardSourcePath | string |  |
| ImageSavingConvention | ImageSavingConvention |  |
| EnableAutomaticRestart | boolean |  |
| ServerName | string |  |
| PreferredDetectedRemoteAddressFamily | Net.Sockets.AddressFamily |  |
| WanDdns | string |  |
| UICulture | string |  |
| RemoteClientBitrateLimit | integer |  |
| LocalNetworkSubnets | string[] |  |
| LocalNetworkAddresses | string[] |  |
| EnableExternalContentInSuggestions | boolean |  |
| RequireHttps | boolean |  |
| IsBehindProxy | boolean |  |
| RemoteIPFilter | string[] |  |
| IsRemoteIPFilterBlacklist | boolean |  |
| ImageExtractionTimeoutMs | integer |  |
| PathSubstitutions | PathSubstitution[] |  |
| UninstalledPlugins | string[] |  |
| CollapseVideoFolders | boolean |  |
| EnableOriginalTrackTitles | boolean |  |
| VacuumDatabaseOnStartup | boolean |  |
| SimultaneousStreamLimit | integer |  |
| DatabaseCacheSizeMB | integer |  |
| EnableSqLiteMmio | boolean |  |
| PlaylistsUpgradedToM3U | boolean |  |
| ImageExtractorUpgraded1 | boolean |  |
| EnablePeopleLetterSubFolders | boolean |  |
| OptimizeDatabaseOnShutdown | boolean |  |
| DatabaseAnalysisLimit | integer |  |
| MaxLibraryDatabaseConnections | integer |  |
| MaxAuthDbConnections | integer |  |
| MaxOtherDbConnections | integer |  |
| DisableAsyncIO | boolean |  |
| MigratedToUserItemShares8 | boolean |  |
| MigratedLibraryOptionsToDb | boolean |  |
| AllowLegacyLocalNetworkPassword | boolean |  |
| EnableSavedMetadataForPeople | boolean |  |
| TvChannelsRefreshed | boolean |  |
| ProxyHeaderMode | ProxyHeaderMode |  |
| IsInMaintenanceMode | boolean |  |
| MaintenanceModeMessage | string |  |
| EnableDebugLevelLogging | boolean |  |
| RevertDebugLogging | string |  |
| EnableAutoUpdate | boolean |  |
| LogFileRetentionDays | integer |  |
| RunAtStartup | boolean |  |
| IsStartupWizardCompleted | boolean |  |
| CachePath | string |  |



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

## getSystemConfigurationByKey

### 基本信息
**Path：** GET 服务器地址 + /System/Configuration/{Key}

**Method：** GET

**接口描述：** Gets a named configuration

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Key | 是 | string |  | Key |


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

## postSystemConfigurationByKey

### 基本信息
**Path：** POST 服务器地址 + /System/Configuration/{Key}

**Method：** POST

**接口描述：** Updates named configuration

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Key | 是 | string |  | Key |


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


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

## postSystemConfigurationPartial

### 基本信息
**Path：** POST 服务器地址 + /System/Configuration/Partial

**Method：** POST

**接口描述：** Updates application configuration

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


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

