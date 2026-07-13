# 媒体信息（MediaInfoService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/{Id}/PlaybackInfo` | getItemsByIdPlaybackinfo | Gets live playback media info for an item |
| POST | `/Items/{Id}/PlaybackInfo` | postItemsByIdPlaybackinfo | Gets live playback media info for an item |
| POST | `/LiveStreams/Close` | postLivestreamsClose | Closes a media source |
| POST | `/LiveStreams/MediaInfo` | postLivestreamsMediainfo | Gets media info for a live stream |
| POST | `/LiveStreams/Open` | postLivestreamsOpen | Opens a media source |
| GET | `/Playback/BitrateTest` | getPlaybackBitratetest |  |

---

## getItemsByIdPlaybackinfo

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/PlaybackInfo

**Method：** GET

**接口描述：** Gets live playback media info for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PlaybackInfoResponse object. | PlaybackInfoResponse |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] |  |
| PlaySessionId | string |  |
| ErrorCode | PlaybackErrorCode |  |


**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] |  |
| PlaySessionId | string |  |
| ErrorCode | PlaybackErrorCode |  |


---

## postItemsByIdPlaybackinfo

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/PlaybackInfo

**Method：** POST

**接口描述：** Gets live playback media info for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：PlaybackInfoRequest:
- Content-Type：`application/json`
- Schema：`PlaybackInfoRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| UserId | string |  |
| MaxStreamingBitrate | integer|null |  |
| StartTimeTicks | integer|null |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| MaxAudioChannels | integer|null |  |
| MediaSourceId | string |  |
| LiveStreamId | string |  |
| DeviceProfile | DeviceProfile |  |
| EnableDirectPlay | boolean |  |
| EnableDirectStream | boolean |  |
| EnableTranscoding | boolean |  |
| AllowInterlacedVideoStreamCopy | boolean |  |
| AllowVideoStreamCopy | boolean |  |
| AllowAudioStreamCopy | boolean |  |
| IsPlayback | boolean |  |
| AutoOpenLiveStream | boolean |  |
| CurrentPlaySessionId | string |  |

- Content-Type：`application/xml`
- Schema：`PlaybackInfoRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| UserId | string |  |
| MaxStreamingBitrate | integer|null |  |
| StartTimeTicks | integer|null |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| MaxAudioChannels | integer|null |  |
| MediaSourceId | string |  |
| LiveStreamId | string |  |
| DeviceProfile | DeviceProfile |  |
| EnableDirectPlay | boolean |  |
| EnableDirectStream | boolean |  |
| EnableTranscoding | boolean |  |
| AllowInterlacedVideoStreamCopy | boolean |  |
| AllowVideoStreamCopy | boolean |  |
| AllowAudioStreamCopy | boolean |  |
| IsPlayback | boolean |  |
| AutoOpenLiveStream | boolean |  |
| CurrentPlaySessionId | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PlaybackInfoResponse object. | PlaybackInfoResponse |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] |  |
| PlaySessionId | string |  |
| ErrorCode | PlaybackErrorCode |  |


**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] |  |
| PlaySessionId | string |  |
| ErrorCode | PlaybackErrorCode |  |


---

## postLivestreamsClose

### 基本信息
**Path：** POST 服务器地址 + /LiveStreams/Close

**Method：** POST

**接口描述：** Closes a media source

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| LiveStreamId | 是 | string |  | LiveStreamId |


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

## postLivestreamsMediainfo

### 基本信息
**Path：** POST 服务器地址 + /LiveStreams/MediaInfo

**Method：** POST

**接口描述：** Gets media info for a live stream

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| LiveStreamId | 是 | string |  | LiveStreamId |


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

## postLivestreamsOpen

### 基本信息
**Path：** POST 服务器地址 + /LiveStreams/Open

**Method：** POST

**接口描述：** Opens a media source

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：LiveStreamRequest:
- Content-Type：`application/json`
- Schema：`LiveStreamRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| OpenToken | string |  |
| UserId | string |  |
| PlaySessionId | string |  |
| MaxStreamingBitrate | integer|null |  |
| StartTimeTicks | integer|null |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| MaxAudioChannels | integer|null |  |
| ItemId | integer |  |
| DeviceProfile | DeviceProfile |  |
| EnableDirectPlay | boolean |  |
| EnableDirectStream | boolean |  |
| EnableTranscoding | boolean |  |
| AllowVideoStreamCopy | boolean |  |
| AllowInterlacedVideoStreamCopy | boolean |  |
| AllowAudioStreamCopy | boolean |  |

- Content-Type：`application/xml`
- Schema：`LiveStreamRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| OpenToken | string |  |
| UserId | string |  |
| PlaySessionId | string |  |
| MaxStreamingBitrate | integer|null |  |
| StartTimeTicks | integer|null |  |
| AudioStreamIndex | integer|null |  |
| SubtitleStreamIndex | integer|null |  |
| MaxAudioChannels | integer|null |  |
| ItemId | integer |  |
| DeviceProfile | DeviceProfile |  |
| EnableDirectPlay | boolean |  |
| EnableDirectStream | boolean |  |
| EnableTranscoding | boolean |  |
| AllowVideoStreamCopy | boolean |  |
| AllowInterlacedVideoStreamCopy | boolean |  |
| AllowAudioStreamCopy | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a LiveStreamResponse object. | LiveStreamResponse |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（LiveStreamResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSource | MediaSourceInfo |  |


**200 字段说明（LiveStreamResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSource | MediaSourceInfo |  |


---

## getPlaybackBitratetest

### 基本信息
**Path：** GET 服务器地址 + /Playback/BitrateTest

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Size | 是 | integer |  | Size |


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

