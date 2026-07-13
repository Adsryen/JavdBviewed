# 播放状态（PlaystateService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：12

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Sessions/Playing` | postSessionsPlaying | Reports playback has started within a session |
| POST | `/Sessions/Playing/Ping` | postSessionsPlayingPing | Pings a playback session |
| POST | `/Sessions/Playing/Progress` | postSessionsPlayingProgress | Reports playback progress within a session |
| POST | `/Sessions/Playing/Stopped` | postSessionsPlayingStopped | Reports playback has stopped within a session |
| POST | `/Users/{UserId}/Items/{ItemId}/UserData` | postUsersByUseridItemsByItemidUserdata | Updates userdata for an item |
| DELETE | `/Users/{UserId}/PlayedItems/{Id}` | deleteUsersByUseridPlayeditemsById | Marks an item as unplayed |
| POST | `/Users/{UserId}/PlayedItems/{Id}` | postUsersByUseridPlayeditemsById | Marks an item as played |
| POST | `/Users/{UserId}/PlayedItems/{Id}/Delete` | postUsersByUseridPlayeditemsByIdDelete | Marks an item as unplayed |
| DELETE | `/Users/{UserId}/PlayingItems/{Id}` | deleteUsersByUseridPlayingitemsById | Reports that a user has stopped playing an item |
| POST | `/Users/{UserId}/PlayingItems/{Id}` | postUsersByUseridPlayingitemsById | Reports that a user has begun playing an item |
| POST | `/Users/{UserId}/PlayingItems/{Id}/Delete` | postUsersByUseridPlayingitemsByIdDelete | Reports that a user has stopped playing an item |
| POST | `/Users/{UserId}/PlayingItems/{Id}/Progress` | postUsersByUseridPlayingitemsByIdProgress | Reports a user's playback progress |

---

## postSessionsPlaying

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing

**Method：** POST

**接口描述：** Reports playback has started within a session

**官方文档：** [API Documentation: Playback Check-ins](https://dev.emby.media/doc/restapi/Playback-Check-ins.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：PlaybackStartInfo:
- Content-Type：`application/json`
- Schema：`PlaybackStartInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanSeek | boolean |  |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string |  |
| SessionId | string |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| IsPaused | boolean |  |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| IsMuted | boolean |  |
| RunTimeTicks | integer|null |  |
| PlaybackStartTimeTicks | integer|null |  |
| VolumeLevel | integer|null |  |
| Brightness | integer|null |  |
| AspectRatio | string |  |
| EventName | ProgressEvent |  |
| PlayMethod | PlayMethod |  |
| RepeatMode | RepeatMode |  |
| SleepTimerMode | SleepTimerMode |  |
| SleepTimerEndTime | string|null |  |
| Shuffle | boolean |  |
| SubtitleOffset | integer |  |
| PlaybackRate | number |  |
| PlaylistItemIds | string[] |  |
| PlaySessionId | string |  |
| ItemId | string |  |
| LiveStreamId | string |  |
| MediaSourceId | string |  |
| Item | BaseItemDto |  |
| PositionTicks | integer|null |  |

- Content-Type：`application/xml`
- Schema：`PlaybackStartInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanSeek | boolean |  |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string |  |
| SessionId | string |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| IsPaused | boolean |  |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| IsMuted | boolean |  |
| RunTimeTicks | integer|null |  |
| PlaybackStartTimeTicks | integer|null |  |
| VolumeLevel | integer|null |  |
| Brightness | integer|null |  |
| AspectRatio | string |  |
| EventName | ProgressEvent |  |
| PlayMethod | PlayMethod |  |
| RepeatMode | RepeatMode |  |
| SleepTimerMode | SleepTimerMode |  |
| SleepTimerEndTime | string|null |  |
| Shuffle | boolean |  |
| SubtitleOffset | integer |  |
| PlaybackRate | number |  |
| PlaylistItemIds | string[] |  |
| PlaySessionId | string |  |
| ItemId | string |  |
| LiveStreamId | string |  |
| MediaSourceId | string |  |
| Item | BaseItemDto |  |
| PositionTicks | integer|null |  |



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

## postSessionsPlayingPing

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing/Ping

**Method：** POST

**接口描述：** Pings a playback session

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| PlaySessionId | 否 | string |  |  |


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

## postSessionsPlayingProgress

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing/Progress

**Method：** POST

**接口描述：** Reports playback progress within a session

**官方文档：** [API Documentation: Playback Check-ins](https://dev.emby.media/doc/restapi/Playback-Check-ins.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：PlaybackProgressInfo:
- Content-Type：`application/json`
- Schema：`PlaybackProgressInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanSeek | boolean |  |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string |  |
| SessionId | string |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| IsPaused | boolean |  |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| IsMuted | boolean |  |
| RunTimeTicks | integer|null |  |
| PlaybackStartTimeTicks | integer|null |  |
| VolumeLevel | integer|null |  |
| Brightness | integer|null |  |
| AspectRatio | string |  |
| EventName | ProgressEvent |  |
| PlayMethod | PlayMethod |  |
| RepeatMode | RepeatMode |  |
| SleepTimerMode | SleepTimerMode |  |
| SleepTimerEndTime | string|null |  |
| Shuffle | boolean |  |
| SubtitleOffset | integer |  |
| PlaybackRate | number |  |
| PlaylistItemIds | string[] |  |
| PlaySessionId | string |  |
| ItemId | string |  |
| LiveStreamId | string |  |
| MediaSourceId | string |  |
| Item | BaseItemDto |  |
| PositionTicks | integer|null |  |

- Content-Type：`application/xml`
- Schema：`PlaybackProgressInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| CanSeek | boolean |  |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string |  |
| SessionId | string |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| IsPaused | boolean |  |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| IsMuted | boolean |  |
| RunTimeTicks | integer|null |  |
| PlaybackStartTimeTicks | integer|null |  |
| VolumeLevel | integer|null |  |
| Brightness | integer|null |  |
| AspectRatio | string |  |
| EventName | ProgressEvent |  |
| PlayMethod | PlayMethod |  |
| RepeatMode | RepeatMode |  |
| SleepTimerMode | SleepTimerMode |  |
| SleepTimerEndTime | string|null |  |
| Shuffle | boolean |  |
| SubtitleOffset | integer |  |
| PlaybackRate | number |  |
| PlaylistItemIds | string[] |  |
| PlaySessionId | string |  |
| ItemId | string |  |
| LiveStreamId | string |  |
| MediaSourceId | string |  |
| Item | BaseItemDto |  |
| PositionTicks | integer|null |  |



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

## postSessionsPlayingStopped

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Playing/Stopped

**Method：** POST

**接口描述：** Reports playback has stopped within a session

**官方文档：** [API Documentation: Playback Check-ins](https://dev.emby.media/doc/restapi/Playback-Check-ins.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：PlaybackStopInfo:
- Content-Type：`application/json`
- Schema：`PlaybackStopInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string |  |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| SessionId | string |  |
| IsAutomated | boolean |  |
| Failed | boolean |  |
| NextMediaType | string |  |
| PlaySessionId | string |  |
| ItemId | string |  |
| LiveStreamId | string |  |
| MediaSourceId | string |  |
| Item | BaseItemDto |  |
| PositionTicks | integer|null |  |

- Content-Type：`application/xml`
- Schema：`PlaybackStopInfo`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| NowPlayingQueue | QueueItem[] |  |
| PlaylistItemId | string |  |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| SessionId | string |  |
| IsAutomated | boolean |  |
| Failed | boolean |  |
| NextMediaType | string |  |
| PlaySessionId | string |  |
| ItemId | string |  |
| LiveStreamId | string |  |
| MediaSourceId | string |  |
| Item | BaseItemDto |  |
| PositionTicks | integer|null |  |



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

## postUsersByUseridItemsByItemidUserdata

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/Items/{ItemId}/UserData

**Method：** POST

**接口描述：** Updates userdata for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| ItemId | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：UserItemDataDto:
- Content-Type：`application/json`
- Schema：`UserItemDataDto`

| 字段 | 类型 | 备注 |
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

- Content-Type：`application/xml`
- Schema：`UserItemDataDto`

| 字段 | 类型 | 备注 |
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

## deleteUsersByUseridPlayeditemsById

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{UserId}/PlayedItems/{Id}

**Method：** DELETE

**接口描述：** Marks an item as unplayed

**官方文档：** [API Documentation: Playback Check-ins](https://dev.emby.media/doc/restapi/Playback-Check-ins.html)

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

## postUsersByUseridPlayeditemsById

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/PlayedItems/{Id}

**Method：** POST

**接口描述：** Marks an item as played

**官方文档：** [API Documentation: Playback Check-ins](https://dev.emby.media/doc/restapi/Playback-Check-ins.html)

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
| DatePlayed | 否 | string |  | The date the item was played (if any). Format = yyyyMMddHHmmss |


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

## postUsersByUseridPlayeditemsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/PlayedItems/{Id}/Delete

**Method：** POST

**接口描述：** Marks an item as unplayed

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

## deleteUsersByUseridPlayingitemsById

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{UserId}/PlayingItems/{Id}

**Method：** DELETE

**接口描述：** Reports that a user has stopped playing an item

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
| MediaSourceId | 是 | string |  | The id of the MediaSource |
| NextMediaType | 是 | string |  | The next media type that will play |
| PositionTicks | 否 | integer|null |  | Optional. The position, in ticks, where playback stopped. 1ms = 10000 ticks. |
| LiveStreamId | 否 | string |  |  |
| PlaySessionId | 否 | string |  |  |


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

## postUsersByUseridPlayingitemsById

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/PlayingItems/{Id}

**Method：** POST

**接口描述：** Reports that a user has begun playing an item

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
| MediaSourceId | 是 | string |  | The id of the MediaSource |
| CanSeek | 否 | boolean |  | Indicates if the client can seek |
| AudioStreamIndex | 否 | integer|null |  |  |
| SubtitleStreamIndex | 否 | integer|null |  |  |
| PlayMethod | 否 | PlayMethod |  |  |
| LiveStreamId | 否 | string |  |  |
| PlaySessionId | 否 | string |  |  |


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

## postUsersByUseridPlayingitemsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/PlayingItems/{Id}/Delete

**Method：** POST

**接口描述：** Reports that a user has stopped playing an item

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
| MediaSourceId | 是 | string |  | The id of the MediaSource |
| NextMediaType | 是 | string |  | The next media type that will play |
| PositionTicks | 否 | integer|null |  | Optional. The position, in ticks, where playback stopped. 1ms = 10000 ticks. |
| LiveStreamId | 否 | string |  |  |
| PlaySessionId | 否 | string |  |  |


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

## postUsersByUseridPlayingitemsByIdProgress

### 基本信息
**Path：** POST 服务器地址 + /Users/{UserId}/PlayingItems/{Id}/Progress

**Method：** POST

**接口描述：** Reports a user's playback progress

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
| MediaSourceId | 是 | string |  | The id of the MediaSource |
| PositionTicks | 否 | integer|null |  | Optional. The current position, in ticks. 1ms = 10000 ticks. |
| IsPaused | 否 | boolean |  | Indicates if the player is paused. |
| IsMuted | 否 | boolean |  | Indicates if the player is muted. |
| AudioStreamIndex | 否 | integer|null |  |  |
| SubtitleStreamIndex | 否 | integer|null |  |  |
| VolumeLevel | 否 | integer|null |  | Scale of 0-100 |
| PlayMethod | 否 | PlayMethod |  |  |
| LiveStreamId | 否 | string |  |  |
| PlaySessionId | 否 | string |  |  |
| RepeatMode | 否 | RepeatMode |  |  |
| SubtitleOffset | 否 | integer |  |  |
| PlaybackRate | 否 | number |  |  |


**Body**

- 是否必须：是
- 描述：OnPlaybackProgress
- Content-Type：`application/json`
- Schema：`Api.OnPlaybackProgress`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| Shuffle | boolean |  |
| SleepTimerMode | SleepTimerMode |  |
| SleepTimerEndTime | string|null |  |
| EventName | ProgressEvent |  |

- Content-Type：`application/xml`
- Schema：`Api.OnPlaybackProgress`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlaylistIndex | integer |  |
| PlaylistLength | integer |  |
| Shuffle | boolean |  |
| SleepTimerMode | SleepTimerMode |  |
| SleepTimerEndTime | string|null |  |
| EventName | ProgressEvent |  |



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

