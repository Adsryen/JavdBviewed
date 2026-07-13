# 用户管理（UserService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：接入认证
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：21

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Users/{Id}` | deleteUsersById | Deletes a user |
| GET | `/Users/{Id}` | getUsersById | Gets a user by Id |
| POST | `/Users/{Id}` | postUsersById | Updates a user |
| POST | `/Users/{Id}/Authenticate` | postUsersByIdAuthenticate | Authenticates a user |
| POST | `/Users/{Id}/Configuration` | postUsersByIdConfiguration | Updates a user configuration |
| POST | `/Users/{Id}/Configuration/Partial` | postUsersByIdConfigurationPartial | Updates a user configuration |
| POST | `/Users/{Id}/Delete` | postUsersByIdDelete | Deletes a user |
| POST | `/Users/{Id}/Password` | postUsersByIdPassword | Updates a user's password |
| POST | `/Users/{Id}/Policy` | postUsersByIdPolicy | Updates a user policy |
| DELETE | `/Users/{Id}/TrackSelections/{TrackType}` | deleteUsersByIdTrackselectionsByTracktype | Clears audio or subtitle track selections for a user |
| POST | `/Users/{Id}/TrackSelections/{TrackType}/Delete` | postUsersByIdTrackselectionsByTracktypeDelete | Clears audio or subtitle track selections for a user |
| GET | `/Users/{UserId}/TypedSettings/{Key}` | getUsersByUseridTypedsettingsByKey | Gets a typed user setting |
| POST | `/Users/{UserId}/TypedSettings/{Key}` | postUsersByUseridTypedsettingsByKey | Updates a typed user setting |
| POST | `/Users/AuthenticateByName` | postUsersAuthenticatebyname | Authenticates a user |
| POST | `/Users/ForgotPassword` | postUsersForgotpassword | Initiates the forgot password process for a local user |
| POST | `/Users/ForgotPassword/Pin` | postUsersForgotpasswordPin | Redeems a forgot password pin |
| GET | `/Users/ItemAccess` | getUsersItemaccess | Gets a list of users |
| POST | `/Users/New` | postUsersNew | Creates a user |
| GET | `/Users/Prefixes` | getUsersPrefixes | Gets a list of users |
| GET | `/Users/Public` | getUsersPublic | Gets a list of publicly visible users for display on a login screen. |
| GET | `/Users/Query` | getUsersQuery | Gets a list of users |

---

## deleteUsersById

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{Id}

**Method：** DELETE

**接口描述：** Deletes a user

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## getUsersById

### 基本信息
**Path：** GET 服务器地址 + /Users/{Id}

**Method：** GET

**接口描述：** Gets a user by Id

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserDto object. | UserDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ServerId | string |  |
| ServerName | string |  |
| Prefix | string |  |
| ConnectUserName | string |  |
| DateCreated | string|null |  |
| ConnectLinkType | Connect.UserLinkType |  |
| Id | string |  |
| PrimaryImageTag | string |  |
| HasPassword | boolean|null |  |
| HasConfiguredPassword | boolean|null |  |
| EnableAutoLogin | boolean|null |  |
| LastLoginDate | string|null |  |
| LastActivityDate | string|null |  |
| Configuration | UserConfiguration |  |
| Policy | UserPolicy |  |
| PrimaryImageAspectRatio | number|null |  |
| UserItemShareLevel | UserItemShareLevel |  |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ServerId | string |  |
| ServerName | string |  |
| Prefix | string |  |
| ConnectUserName | string |  |
| DateCreated | string|null |  |
| ConnectLinkType | Connect.UserLinkType |  |
| Id | string |  |
| PrimaryImageTag | string |  |
| HasPassword | boolean|null |  |
| HasConfiguredPassword | boolean|null |  |
| EnableAutoLogin | boolean|null |  |
| LastLoginDate | string|null |  |
| LastActivityDate | string|null |  |
| Configuration | UserConfiguration |  |
| Policy | UserPolicy |  |
| PrimaryImageAspectRatio | number|null |  |
| UserItemShareLevel | UserItemShareLevel |  |


---

## postUsersById

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}

**Method：** POST

**接口描述：** Updates a user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：UserDto:
- Content-Type：`application/json`
- Schema：`UserDto`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ServerId | string |  |
| ServerName | string |  |
| Prefix | string |  |
| ConnectUserName | string |  |
| DateCreated | string|null |  |
| ConnectLinkType | Connect.UserLinkType |  |
| Id | string |  |
| PrimaryImageTag | string |  |
| HasPassword | boolean|null |  |
| HasConfiguredPassword | boolean|null |  |
| EnableAutoLogin | boolean|null |  |
| LastLoginDate | string|null |  |
| LastActivityDate | string|null |  |
| Configuration | UserConfiguration |  |
| Policy | UserPolicy |  |
| PrimaryImageAspectRatio | number|null |  |
| UserItemShareLevel | UserItemShareLevel |  |

- Content-Type：`application/xml`
- Schema：`UserDto`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ServerId | string |  |
| ServerName | string |  |
| Prefix | string |  |
| ConnectUserName | string |  |
| DateCreated | string|null |  |
| ConnectLinkType | Connect.UserLinkType |  |
| Id | string |  |
| PrimaryImageTag | string |  |
| HasPassword | boolean|null |  |
| HasConfiguredPassword | boolean|null |  |
| EnableAutoLogin | boolean|null |  |
| LastLoginDate | string|null |  |
| LastActivityDate | string|null |  |
| Configuration | UserConfiguration |  |
| Policy | UserPolicy |  |
| PrimaryImageAspectRatio | number|null |  |
| UserItemShareLevel | UserItemShareLevel |  |



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

## postUsersByIdAuthenticate

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Authenticate

**Method：** POST

**接口描述：** Authenticates a user

**官方文档：** [API Documentation: Authentication](https://dev.emby.media/doc/restapi/User-Authentication.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：AuthenticateUser
- Content-Type：`application/json`
- Schema：`AuthenticateUser`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Pw | string |  |

- Content-Type：`application/xml`
- Schema：`AuthenticateUser`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Pw | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a AuthenticationResult object. | Authentication.AuthenticationResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Authentication.AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto |  |
| SessionInfo | Session.SessionInfo |  |
| AccessToken | string |  |
| ServerId | string |  |


**200 字段说明（Authentication.AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto |  |
| SessionInfo | Session.SessionInfo |  |
| AccessToken | string |  |
| ServerId | string |  |


---

## postUsersByIdConfiguration

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Configuration

**Method：** POST

**接口描述：** Updates a user configuration

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：UserConfiguration:
- Content-Type：`application/json`
- Schema：`UserConfiguration`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| AudioLanguagePreference | string |  |
| PlayDefaultAudioTrack | boolean |  |
| SubtitleLanguagePreference | string |  |
| ProfilePin | string |  |
| DisplayMissingEpisodes | boolean |  |
| SubtitleMode | SubtitlePlaybackMode |  |
| OrderedViews | string[] |  |
| LatestItemsExcludes | string[] |  |
| MyMediaExcludes | string[] |  |
| HidePlayedInLatest | boolean |  |
| HidePlayedInMoreLikeThis | boolean |  |
| HidePlayedInSuggestions | boolean |  |
| RememberAudioSelections | boolean |  |
| RememberSubtitleSelections | boolean |  |
| EnableNextEpisodeAutoPlay | boolean |  |
| ResumeRewindSeconds | integer |  |
| IntroSkipMode | SegmentSkipMode |  |
| EnableLocalPassword | boolean |  |

- Content-Type：`application/xml`
- Schema：`UserConfiguration`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| AudioLanguagePreference | string |  |
| PlayDefaultAudioTrack | boolean |  |
| SubtitleLanguagePreference | string |  |
| ProfilePin | string |  |
| DisplayMissingEpisodes | boolean |  |
| SubtitleMode | SubtitlePlaybackMode |  |
| OrderedViews | string[] |  |
| LatestItemsExcludes | string[] |  |
| MyMediaExcludes | string[] |  |
| HidePlayedInLatest | boolean |  |
| HidePlayedInMoreLikeThis | boolean |  |
| HidePlayedInSuggestions | boolean |  |
| RememberAudioSelections | boolean |  |
| RememberSubtitleSelections | boolean |  |
| EnableNextEpisodeAutoPlay | boolean |  |
| ResumeRewindSeconds | integer |  |
| IntroSkipMode | SegmentSkipMode |  |
| EnableLocalPassword | boolean |  |



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

## postUsersByIdConfigurationPartial

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Configuration/Partial

**Method：** POST

**接口描述：** Updates a user configuration

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## postUsersByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Delete

**Method：** POST

**接口描述：** Deletes a user

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## postUsersByIdPassword

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Password

**Method：** POST

**接口描述：** Updates a user's password

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：UpdateUserPassword
- Content-Type：`application/json`
- Schema：`UpdateUserPassword`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| NewPw | string |  |
| ResetPassword | boolean |  |

- Content-Type：`application/xml`
- Schema：`UpdateUserPassword`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| NewPw | string |  |
| ResetPassword | boolean |  |



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

## postUsersByIdPolicy

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Policy

**Method：** POST

**接口描述：** Updates a user policy

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：UserPolicy:
- Content-Type：`application/json`
- Schema：`UserPolicy`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IsAdministrator | boolean |  |
| IsHidden | boolean |  |
| IsHiddenRemotely | boolean |  |
| IsHiddenFromUnusedDevices | boolean |  |
| IsDisabled | boolean |  |
| LockedOutDate | integer |  |
| MaxParentalRating | integer|null |  |
| AllowTagOrRating | boolean |  |
| BlockedTags | string[] |  |
| IsTagBlockingModeInclusive | boolean |  |
| IncludeTags | string[] |  |
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
| AutoRemoteQuality | integer |  |
| EnablePlaybackRemuxing | boolean |  |
| EnableContentDeletion | boolean |  |
| RestrictedFeatures | string[] |  |
| EnableContentDeletionFromFolders | string[] |  |
| EnableContentDownloading | boolean |  |
| EnableSubtitleDownloading | boolean |  |
| EnableSubtitleManagement | boolean |  |
| EnableSyncTranscoding | boolean |  |
| EnableMediaConversion | boolean |  |
| EnabledChannels | string[] |  |
| EnableAllChannels | boolean |  |
| EnabledFolders | string[] |  |
| EnableAllFolders | boolean |  |
| InvalidLoginAttemptCount | integer |  |
| EnablePublicSharing | boolean |  |
| RemoteClientBitrateLimit | integer |  |
| AuthenticationProviderId | string |  |
| ExcludedSubFolders | string[] |  |
| SimultaneousStreamLimit | integer |  |
| EnabledDevices | string[] |  |
| EnableAllDevices | boolean |  |
| AllowCameraUpload | boolean |  |
| AllowSharingPersonalItems | boolean |  |

- Content-Type：`application/xml`
- Schema：`UserPolicy`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| IsAdministrator | boolean |  |
| IsHidden | boolean |  |
| IsHiddenRemotely | boolean |  |
| IsHiddenFromUnusedDevices | boolean |  |
| IsDisabled | boolean |  |
| LockedOutDate | integer |  |
| MaxParentalRating | integer|null |  |
| AllowTagOrRating | boolean |  |
| BlockedTags | string[] |  |
| IsTagBlockingModeInclusive | boolean |  |
| IncludeTags | string[] |  |
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
| AutoRemoteQuality | integer |  |
| EnablePlaybackRemuxing | boolean |  |
| EnableContentDeletion | boolean |  |
| RestrictedFeatures | string[] |  |
| EnableContentDeletionFromFolders | string[] |  |
| EnableContentDownloading | boolean |  |
| EnableSubtitleDownloading | boolean |  |
| EnableSubtitleManagement | boolean |  |
| EnableSyncTranscoding | boolean |  |
| EnableMediaConversion | boolean |  |
| EnabledChannels | string[] |  |
| EnableAllChannels | boolean |  |
| EnabledFolders | string[] |  |
| EnableAllFolders | boolean |  |
| InvalidLoginAttemptCount | integer |  |
| EnablePublicSharing | boolean |  |
| RemoteClientBitrateLimit | integer |  |
| AuthenticationProviderId | string |  |
| ExcludedSubFolders | string[] |  |
| SimultaneousStreamLimit | integer |  |
| EnabledDevices | string[] |  |
| EnableAllDevices | boolean |  |
| AllowCameraUpload | boolean |  |
| AllowSharingPersonalItems | boolean |  |



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

## deleteUsersByIdTrackselectionsByTracktype

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{Id}/TrackSelections/{TrackType}

**Method：** DELETE

**接口描述：** Clears audio or subtitle track selections for a user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| TrackType | 是 | string |  |  |


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

## postUsersByIdTrackselectionsByTracktypeDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/TrackSelections/{TrackType}/Delete

**Method：** POST

**接口描述：** Clears audio or subtitle track selections for a user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| TrackType | 是 | string |  |  |


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

## getUsersByUseridTypedsettingsByKey

### 基本信息
**Path：** GET 服务器地址 + /Users/{UserId}/TypedSettings/{Key}

**Method：** GET

**接口描述：** Gets a typed user setting

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Key | 是 | string |  | Key |
| UserId | 是 | string |  |  |


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

## postUsersByUseridTypedsettingsByKey

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/TypedSettings/{Key}

**Method：** POST

**接口描述：** Updates a typed user setting

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  |  |
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

## postUsersAuthenticatebyname

### 基本信息
**Path：** POST 服务器地址 + /Users/AuthenticateByName

**Method：** POST

**接口描述：** Authenticates a user

**官方文档：** [API Documentation: Authentication](https://dev.emby.media/doc/restapi/User-Authentication.html)

**认证要求：** 用户认证

### 请求参数

**Headers**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| X-Emby-Authorization | 是 | string |  | The authorization header can be either named 'Authorization' or 'X-Emby-Authorization'.   
It must be of the following schema:    
Emby UserId="(guid)", Client="(string)", Device="(string)", DeviceId="(string)", Version="string", Token="(string)"    
Please consult the documentation for further details. |


**Body**

- 是否必须：是
- 描述：AuthenticateUserByName
- Content-Type：`application/json`
- Schema：`AuthenticateUserByName`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Username | string |  |
| Pw | string |  |

- Content-Type：`application/xml`
- Schema：`AuthenticateUserByName`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Username | string |  |
| Pw | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a AuthenticationResult object. | Authentication.AuthenticationResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Authentication.AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto |  |
| SessionInfo | Session.SessionInfo |  |
| AccessToken | string |  |
| ServerId | string |  |


**200 字段说明（Authentication.AuthenticationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| User | UserDto |  |
| SessionInfo | Session.SessionInfo |  |
| AccessToken | string |  |
| ServerId | string |  |


---

## postUsersForgotpassword

### 基本信息
**Path：** POST 服务器地址 + /Users/ForgotPassword

**Method：** POST

**接口描述：** Initiates the forgot password process for a local user

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：ForgotPassword
- Content-Type：`application/json`
- Schema：`ForgotPassword`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnteredUsername | string |  |

- Content-Type：`application/xml`
- Schema：`ForgotPassword`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| EnteredUsername | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ForgotPasswordResult object. | ForgotPasswordResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（ForgotPasswordResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Action | ForgotPasswordAction |  |
| PinFile | string |  |
| PinExpirationDate | string|null |  |


**200 字段说明（ForgotPasswordResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Action | ForgotPasswordAction |  |
| PinFile | string |  |
| PinExpirationDate | string|null |  |


---

## postUsersForgotpasswordPin

### 基本信息
**Path：** POST 服务器地址 + /Users/ForgotPassword/Pin

**Method：** POST

**接口描述：** Redeems a forgot password pin

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：ForgotPasswordPin
- Content-Type：`application/json`
- Schema：`ForgotPasswordPin`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Pin | string |  |

- Content-Type：`application/xml`
- Schema：`ForgotPasswordPin`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Pin | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PinRedeemResult object. | PinRedeemResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（PinRedeemResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Success | boolean |  |
| UsersReset | string[] |  |


**200 字段说明（PinRedeemResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Success | boolean |  |
| UsersReset | string[] |  |


---

## getUsersItemaccess

### 基本信息
**Path：** GET 服务器地址 + /Users/ItemAccess

**Method：** GET

**接口描述：** Gets a list of users

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IsHidden | 否 | boolean|null |  | Optional filter by IsHidden=true or false |
| IsDisabled | 否 | boolean|null |  | Optional filter by IsDisabled=true or false |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<UserDto> object. | QueryResult_UserDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | UserDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | UserDto[] |  |
| TotalRecordCount | integer |  |


---

## postUsersNew

### 基本信息
**Path：** POST 服务器地址 + /Users/New

**Method：** POST

**接口描述：** Creates a user

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：CreateUserByName
- Content-Type：`application/json`
- Schema：`CreateUserByName`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| CopyFromUserId | string |  |
| UserCopyOptions | Library.UserCopyOptions[] |  |

- Content-Type：`application/xml`
- Schema：`CreateUserByName`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| CopyFromUserId | string |  |
| UserCopyOptions | Library.UserCopyOptions[] |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserDto object. | UserDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ServerId | string |  |
| ServerName | string |  |
| Prefix | string |  |
| ConnectUserName | string |  |
| DateCreated | string|null |  |
| ConnectLinkType | Connect.UserLinkType |  |
| Id | string |  |
| PrimaryImageTag | string |  |
| HasPassword | boolean|null |  |
| HasConfiguredPassword | boolean|null |  |
| EnableAutoLogin | boolean|null |  |
| LastLoginDate | string|null |  |
| LastActivityDate | string|null |  |
| Configuration | UserConfiguration |  |
| Policy | UserPolicy |  |
| PrimaryImageAspectRatio | number|null |  |
| UserItemShareLevel | UserItemShareLevel |  |


**200 字段说明（UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ServerId | string |  |
| ServerName | string |  |
| Prefix | string |  |
| ConnectUserName | string |  |
| DateCreated | string|null |  |
| ConnectLinkType | Connect.UserLinkType |  |
| Id | string |  |
| PrimaryImageTag | string |  |
| HasPassword | boolean|null |  |
| HasConfiguredPassword | boolean|null |  |
| EnableAutoLogin | boolean|null |  |
| LastLoginDate | string|null |  |
| LastActivityDate | string|null |  |
| Configuration | UserConfiguration |  |
| Policy | UserPolicy |  |
| PrimaryImageAspectRatio | number|null |  |
| UserItemShareLevel | UserItemShareLevel |  |


---

## getUsersPrefixes

### 基本信息
**Path：** GET 服务器地址 + /Users/Prefixes

**Method：** GET

**接口描述：** Gets a list of users

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IsHidden | 否 | boolean|null |  | Optional filter by IsHidden=true or false |
| IsDisabled | 否 | boolean|null |  | Optional filter by IsDisabled=true or false |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a NameIdPair[] object. | NameIdPair[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getUsersPublic

### 基本信息
**Path：** GET 服务器地址 + /Users/Public

**Method：** GET

**接口描述：** Gets a list of publicly visible users for display on a login screen.

**官方文档：** [API Documentation: Authentication](https://dev.emby.media/doc/restapi/User-Authentication.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UserDto[] object. | UserDto[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getUsersQuery

### 基本信息
**Path：** GET 服务器地址 + /Users/Query

**Method：** GET

**接口描述：** Gets a list of users

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| IsHidden | 否 | boolean|null |  | Optional filter by IsHidden=true or false |
| IsDisabled | 否 | boolean|null |  | Optional filter by IsDisabled=true or false |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |
| NameStartsWithOrGreater | 否 | string |  | Optional filter by items whose name is sorted equally or greater than a given input string. |
| SortOrder | 否 | string |  | Sort Order - Ascending,Descending |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<UserDto> object. | QueryResult_UserDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | UserDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_UserDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | UserDto[] |  |
| TotalRecordCount | integer |  |


---

