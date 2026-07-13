# 会话与遥控（Session）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：18

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Sessions` | GetSessions | Gets a list of sessions. |
| POST | `/Sessions/{sessionId}/Command` | SendFullGeneralCommand | Issues a full general command to a client. |
| POST | `/Sessions/{sessionId}/Command/{command}` | SendGeneralCommand | Issues a general command to a client. |
| POST | `/Sessions/{sessionId}/Message` | SendMessageCommand | Issues a command to a client to display a message to the user. |
| POST | `/Sessions/{sessionId}/Playing` | Play | Instructs a session to play an item. |
| POST | `/Sessions/{sessionId}/Playing/{command}` | SendPlaystateCommand | Issues a playstate command to a client. |
| POST | `/Sessions/{sessionId}/System/{command}` | SendSystemCommand | Issues a system command to a client. |
| DELETE | `/Sessions/{sessionId}/User/{userId}` | RemoveUserFromSession | Removes an additional user from a session. |
| POST | `/Sessions/{sessionId}/User/{userId}` | AddUserToSession | Adds an additional user to a session. |
| POST | `/Sessions/{sessionId}/Viewing` | DisplayContent | Instructs a session to browse to an item or view. |
| POST | `/Sessions/Capabilities` | PostCapabilities | Updates capabilities for a device. |
| POST | `/Sessions/Capabilities/Full` | PostFullCapabilities | Updates capabilities for a device. |
| POST | `/Sessions/Logout` | ReportSessionEnded | Reports that a session has ended. |
| POST | `/Sessions/Playing` | ReportPlaybackStart | Reports playback has started within a session. |
| POST | `/Sessions/Playing/Ping` | PingPlaybackSession | Pings a playback session. |
| POST | `/Sessions/Playing/Progress` | ReportPlaybackProgress | Reports playback progress within a session. |
| POST | `/Sessions/Playing/Stopped` | ReportPlaybackStopped | Reports playback has stopped within a session. |
| POST | `/Sessions/Viewing` | ReportViewing | Reports that a session is viewing an item. |

---

## GetSessions

### 基本信息
**Path：** GET 服务器地址 + /Sessions

**Method：** GET

**接口描述：** Gets a list of sessions.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| controllableByUserId | 否 | string |  | Filter by sessions that a given user is allowed to remote control. |
| deviceId | 否 | string |  | Filter by device Id. |
| activeWithinSeconds | 否 | integer |  | Optional. Filter by sessions that were active in the last n seconds. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | List of sessions returned. | SessionInfoDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SendFullGeneralCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/Command

**Method：** POST

**接口描述：** Issues a full general command to a client.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |


**Body**

- 是否必须：是
- 描述：The MediaBrowser.Model.Session.GeneralCommand.
- Content-Type：`application/json`
- Schema：`GeneralCommand`
- Content-Type：`text/json`
- Schema：`GeneralCommand`
- Content-Type：`application/*+json`
- Schema：`GeneralCommand`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Full general command sent to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SendGeneralCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/Command/{command}

**Method：** POST

**接口描述：** Issues a general command to a client.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |
| command | 是 | string enum(MoveUp|MoveDown|MoveLeft|MoveRight|PageUp|PageDown|PreviousLetter|NextLetter|ToggleOsd|ToggleContextMenu|Select|Back|TakeScreenshot|SendKey|SendString|GoHome|GoToSettings|VolumeUp|VolumeDown|Mute|Unmute|ToggleMute|SetVolume|SetAudioStreamIndex|SetSubtitleStreamIndex|ToggleFullscreen|DisplayContent|GoToSearch|DisplayMessage|SetRepeatMode|ChannelUp|ChannelDown|Guide|ToggleStats|PlayMediaSource|PlayTrailers|SetShuffleQueue|PlayState|PlayNext|ToggleOsdMenu|Play|SetMaxStreamingBitrate|SetPlaybackOrder) |  | The command to send. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | General command sent to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SendMessageCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/Message

**Method：** POST

**接口描述：** Issues a command to a client to display a message to the user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |


**Body**

- 是否必须：是
- 描述：The MediaBrowser.Model.Session.MessageCommand object containing Header, Message Text, and TimeoutMs.
- Content-Type：`application/json`
- Schema：`MessageCommand`
- Content-Type：`text/json`
- Schema：`MessageCommand`
- Content-Type：`application/*+json`
- Schema：`MessageCommand`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Message sent. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## Play

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/Playing

**Method：** POST

**接口描述：** Instructs a session to play an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playCommand | 是 | string enum(PlayNow|PlayNext|PlayLast|PlayInstantMix|PlayShuffle) |  | The type of play command to issue (PlayNow, PlayNext, PlayLast). Clients who have not yet implemented play next and play last may play now. |
| itemIds | 是 | string[] |  | The ids of the items to play, comma delimited. |
| startPositionTicks | 否 | integer |  | The starting position of the first item. |
| mediaSourceId | 否 | string |  | Optional. The media source id. |
| audioStreamIndex | 否 | integer |  | Optional. The index of the audio stream to play. |
| subtitleStreamIndex | 否 | integer |  | Optional. The index of the subtitle stream to play. |
| startIndex | 否 | integer |  | Optional. The start index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Instruction sent to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SendPlaystateCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/Playing/{command}

**Method：** POST

**接口描述：** Issues a playstate command to a client.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |
| command | 是 | string enum(Stop|Pause|Unpause|NextTrack|PreviousTrack|Seek|Rewind|FastForward|PlayPause) |  | The MediaBrowser.Model.Session.PlaystateCommand. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| seekPositionTicks | 否 | integer |  | The optional position ticks. |
| controllingUserId | 否 | string |  | The optional controlling user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Playstate command sent to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SendSystemCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/System/{command}

**Method：** POST

**接口描述：** Issues a system command to a client.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |
| command | 是 | string enum(MoveUp|MoveDown|MoveLeft|MoveRight|PageUp|PageDown|PreviousLetter|NextLetter|ToggleOsd|ToggleContextMenu|Select|Back|TakeScreenshot|SendKey|SendString|GoHome|GoToSettings|VolumeUp|VolumeDown|Mute|Unmute|ToggleMute|SetVolume|SetAudioStreamIndex|SetSubtitleStreamIndex|ToggleFullscreen|DisplayContent|GoToSearch|DisplayMessage|SetRepeatMode|ChannelUp|ChannelDown|Guide|ToggleStats|PlayMediaSource|PlayTrailers|SetShuffleQueue|PlayState|PlayNext|ToggleOsdMenu|Play|SetMaxStreamingBitrate|SetPlaybackOrder) |  | The command to send. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | System command sent to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## RemoveUserFromSession

### 基本信息
**Path：** DELETE 服务器地址 + /Sessions/{sessionId}/User/{userId}

**Method：** DELETE

**接口描述：** Removes an additional user from a session.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |
| userId | 是 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User removed from session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## AddUserToSession

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/User/{userId}

**Method：** POST

**接口描述：** Adds an additional user to a session.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session id. |
| userId | 是 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | User added to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DisplayContent

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{sessionId}/Viewing

**Method：** POST

**接口描述：** Instructs a session to browse to an item or view.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 是 | string |  | The session Id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemType | 是 | string enum(AggregateFolder|Audio|AudioBook|BasePluginFolder|Book|BoxSet|Channel|ChannelFolderItem|CollectionFolder|Episode|Folder|Genre|ManualPlaylistsFolder|Movie|LiveTvChannel|LiveTvProgram|MusicAlbum|MusicArtist|MusicGenre|MusicVideo|Person|Photo|PhotoAlbum|Playlist|PlaylistsFolder|Program|Recording|Season|Series|Studio|Trailer|TvChannel|TvProgram|UserRootFolder|UserView|Video|Year) |  | The type of item to browse to. |
| itemId | 是 | string |  | The Id of the item. |
| itemName | 是 | string |  | The name of the item. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Instruction sent to session. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostCapabilities

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Capabilities

**Method：** POST

**接口描述：** Updates capabilities for a device.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 否 | string |  | The session id. |
| playableMediaTypes | 否 | MediaType[] |  | A list of playable media types, comma delimited. Audio, Video, Book, Photo. |
| supportedCommands | 否 | GeneralCommandType[] |  | A list of supported remote control commands, comma delimited. |
| supportsMediaControl | 否 | boolean | false | Determines whether media can be played remotely.. |
| supportsPersistentIdentifier | 否 | boolean | true | Determines whether the device supports a unique identifier. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Capabilities posted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostFullCapabilities

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Capabilities/Full

**Method：** POST

**接口描述：** Updates capabilities for a device.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 否 | string |  | The session id. |


**Body**

- 是否必须：是
- 描述：The MediaBrowser.Model.Session.ClientCapabilities.
- Content-Type：`application/json`
- Schema：`ClientCapabilitiesDto`
- Content-Type：`text/json`
- Schema：`ClientCapabilitiesDto`
- Content-Type：`application/*+json`
- Schema：`ClientCapabilitiesDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Capabilities updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ReportSessionEnded

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Logout

**Method：** POST

**接口描述：** Reports that a session has ended.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Session end reported to server. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ReportPlaybackStart

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing

**Method：** POST

**接口描述：** Reports playback has started within a session.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：The playback start info.
- Content-Type：`application/json`
- Schema：`PlaybackStartInfo`
- Content-Type：`text/json`
- Schema：`PlaybackStartInfo`
- Content-Type：`application/*+json`
- Schema：`PlaybackStartInfo`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Playback start recorded. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PingPlaybackSession

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing/Ping

**Method：** POST

**接口描述：** Pings a playback session.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| playSessionId | 是 | string |  | Playback session id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Playback session pinged. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ReportPlaybackProgress

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing/Progress

**Method：** POST

**接口描述：** Reports playback progress within a session.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：The playback progress info.
- Content-Type：`application/json`
- Schema：`PlaybackProgressInfo`
- Content-Type：`text/json`
- Schema：`PlaybackProgressInfo`
- Content-Type：`application/*+json`
- Schema：`PlaybackProgressInfo`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Playback progress recorded. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ReportPlaybackStopped

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing/Stopped

**Method：** POST

**接口描述：** Reports playback has stopped within a session.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：The playback stop info.
- Content-Type：`application/json`
- Schema：`PlaybackStopInfo`
- Content-Type：`text/json`
- Schema：`PlaybackStopInfo`
- Content-Type：`application/*+json`
- Schema：`PlaybackStopInfo`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Playback stop recorded. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## ReportViewing

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Viewing

**Method：** POST

**接口描述：** Reports that a session is viewing an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| sessionId | 否 | string |  | The session id. |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Session reported to server. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

