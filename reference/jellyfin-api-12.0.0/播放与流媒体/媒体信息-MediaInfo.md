# 媒体信息（MediaInfo）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/{itemId}/PlaybackInfo` | GetPlaybackInfo | Gets live playback media info for an item. |
| POST | `/Items/{itemId}/PlaybackInfo` | GetPostedPlaybackInfo | Gets live playback media info for an item. |
| POST | `/LiveStreams/Close` | CloseLiveStream | Closes a media source. |
| POST | `/LiveStreams/Open` | OpenLiveStream | Opens a media source. |
| GET | `/Playback/BitrateTest` | GetBitrateTestBytes | Tests the network with a request with the size of the bitrate. |

---

## GetPlaybackInfo

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/PlaybackInfo

**Method：** GET

**接口描述：** Gets live playback media info for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Playback info returned. | PlaybackInfoResponse |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |


**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |


**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |


---

## GetPostedPlaybackInfo

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/PlaybackInfo

**Method：** POST

**接口描述：** Gets live playback media info for an item.

**认证要求：** For backwards compatibility parameters can be sent via Query or Body, with Query having higher precedence.
Query parameters are obsolete.

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |
| maxStreamingBitrate | 否 | integer |  | The maximum streaming bitrate. |
| startTimeTicks | 否 | integer |  | The start time in ticks. |
| audioStreamIndex | 否 | integer |  | The audio stream index. |
| subtitleStreamIndex | 否 | integer |  | The subtitle stream index. |
| maxAudioChannels | 否 | integer |  | The maximum number of audio channels. |
| mediaSourceId | 否 | string |  | The media source id. |
| liveStreamId | 否 | string |  | The livestream id. |
| autoOpenLiveStream | 否 | boolean |  | Whether to auto open the livestream. |
| enableDirectPlay | 否 | boolean |  | Whether to enable direct play. Default: true. |
| enableDirectStream | 否 | boolean |  | Whether to enable direct stream. Default: true. |
| enableTranscoding | 否 | boolean |  | Whether to enable transcoding. Default: true. |
| allowVideoStreamCopy | 否 | boolean |  | Whether to allow to copy the video stream. Default: true. |
| allowAudioStreamCopy | 否 | boolean |  | Whether to allow to copy the audio stream. Default: true. |


**Body**

- 是否必须：否
- 描述：The playback info.
- Content-Type：`application/json`
- Schema：`PlaybackInfoDto`
- Content-Type：`text/json`
- Schema：`PlaybackInfoDto`
- Content-Type：`application/*+json`
- Schema：`PlaybackInfoDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Playback info returned. | PlaybackInfoResponse |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |


**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |


**200 字段说明（PlaybackInfoResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSources | MediaSourceInfo[] | Gets or sets the media sources. |
| PlaySessionId | string|null | Gets or sets the play session identifier. |
| ErrorCode | string enum(NotAllowed|NoCompatibleStream|RateLimitExceeded) | Gets or sets the error code. |


---

## CloseLiveStream

### 基本信息
**Path：** POST 服务器地址 + /LiveStreams/Close

**Method：** POST

**接口描述：** Closes a media source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| liveStreamId | 是 | string |  | The livestream id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Livestream closed. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## OpenLiveStream

### 基本信息
**Path：** POST 服务器地址 + /LiveStreams/Open

**Method：** POST

**接口描述：** Opens a media source.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| openToken | 否 | string |  | The open token. |
| userId | 否 | string |  | The user id. |
| playSessionId | 否 | string |  | The play session id. |
| maxStreamingBitrate | 否 | integer |  | The maximum streaming bitrate. |
| startTimeTicks | 否 | integer |  | The start time in ticks. |
| audioStreamIndex | 否 | integer |  | The audio stream index. |
| subtitleStreamIndex | 否 | integer |  | The subtitle stream index. |
| maxAudioChannels | 否 | integer |  | The maximum number of audio channels. |
| itemId | 否 | string |  | The item id. |
| enableDirectPlay | 否 | boolean |  | Whether to enable direct play. Default: true. |
| enableDirectStream | 否 | boolean |  | Whether to enable direct stream. Default: true. |
| alwaysBurnInSubtitleWhenTranscoding | 否 | boolean |  | Always burn-in subtitle when transcoding. |


**Body**

- 是否必须：否
- 描述：The open live stream dto.
- Content-Type：`application/json`
- Schema：`OpenLiveStreamDto`
- Content-Type：`text/json`
- Schema：`OpenLiveStreamDto`
- Content-Type：`application/*+json`
- Schema：`OpenLiveStreamDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Media source opened. | LiveStreamResponse |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LiveStreamResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSource | MediaSourceInfo |  |


**200 字段说明（LiveStreamResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSource | MediaSourceInfo |  |


**200 字段说明（LiveStreamResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| MediaSource | MediaSourceInfo |  |


---

## GetBitrateTestBytes

### 基本信息
**Path：** GET 服务器地址 + /Playback/BitrateTest

**Method：** GET

**接口描述：** Tests the network with a request with the size of the bitrate.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| size | 否 | integer | 102400 | The bitrate. Defaults to 102400. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Test buffer returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

