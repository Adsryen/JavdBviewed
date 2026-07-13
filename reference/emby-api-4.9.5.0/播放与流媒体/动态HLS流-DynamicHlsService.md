# 动态HLS流（DynamicHlsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：14

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Audio/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}` | getAudioByIdHls1ByPlaylistidBySegmentidBySegmentcontainer |  |
| HEAD | `/Audio/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}` | headAudioByIdHls1ByPlaylistidBySegmentidBySegmentcontainer |  |
| GET | `/Audio/{Id}/live.m3u8` | getAudioByIdLiveM3u8 |  |
| GET | `/Audio/{Id}/main.m3u8` | getAudioByIdMainM3u8 | Gets an audio stream using HTTP live streaming. |
| GET | `/Audio/{Id}/master.m3u8` | getAudioByIdMasterM3u8 | Gets an audio stream using HTTP live streaming. |
| HEAD | `/Audio/{Id}/master.m3u8` | headAudioByIdMasterM3u8 | Gets an audio stream using HTTP live streaming. |
| GET | `/Videos/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}` | getVideosByIdHls1ByPlaylistidBySegmentidBySegmentcontainer |  |
| HEAD | `/Videos/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}` | headVideosByIdHls1ByPlaylistidBySegmentidBySegmentcontainer |  |
| GET | `/Videos/{Id}/live_subtitles.m3u8` | getVideosByIdLiveSubtitlesM3u8 | Gets an HLS subtitle playlist. |
| GET | `/Videos/{Id}/live.m3u8` | getVideosByIdLiveM3u8 |  |
| GET | `/Videos/{Id}/main.m3u8` | getVideosByIdMainM3u8 | Gets a video stream using HTTP live streaming. |
| GET | `/Videos/{Id}/master.m3u8` | getVideosByIdMasterM3u8 | Gets a video stream using HTTP live streaming. |
| HEAD | `/Videos/{Id}/master.m3u8` | headVideosByIdMasterM3u8 | Gets a video stream using HTTP live streaming. |
| GET | `/Videos/{Id}/subtitles.m3u8` | getVideosByIdSubtitlesM3u8 | Gets an HLS subtitle playlist. |

---

## getAudioByIdHls1ByPlaylistidBySegmentidBySegmentcontainer

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SegmentContainer | 是 | string |  |  |
| SegmentId | 是 | string |  |  |
| Id | 是 | string |  |  |
| PlaylistId | 是 | string |  |  |


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

## headAudioByIdHls1ByPlaylistidBySegmentidBySegmentcontainer

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SegmentContainer | 是 | string |  |  |
| SegmentId | 是 | string |  |  |
| Id | 是 | string |  |  |
| PlaylistId | 是 | string |  |  |


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

## getAudioByIdLiveM3u8

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/live.m3u8

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## getAudioByIdMainM3u8

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/main.m3u8

**Method：** GET

**接口描述：** Gets an audio stream using HTTP live streaming.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## getAudioByIdMasterM3u8

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/master.m3u8

**Method：** GET

**接口描述：** Gets an audio stream using HTTP live streaming.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## headAudioByIdMasterM3u8

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/master.m3u8

**Method：** HEAD

**接口描述：** Gets an audio stream using HTTP live streaming.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## getVideosByIdHls1ByPlaylistidBySegmentidBySegmentcontainer

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SegmentContainer | 是 | string |  |  |
| SegmentId | 是 | string |  |  |
| Id | 是 | string |  |  |
| PlaylistId | 是 | string |  |  |


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

## headVideosByIdHls1ByPlaylistidBySegmentidBySegmentcontainer

### 基本信息
**Path：** HEAD 服务器地址 + /Videos/{Id}/hls1/{PlaylistId}/{SegmentId}.{SegmentContainer}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SegmentContainer | 是 | string |  |  |
| SegmentId | 是 | string |  |  |
| Id | 是 | string |  |  |
| PlaylistId | 是 | string |  |  |


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

## getVideosByIdLiveSubtitlesM3u8

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/live_subtitles.m3u8

**Method：** GET

**接口描述：** Gets an HLS subtitle playlist.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SubtitleSegmentLength | 是 | integer |  | The subtitle segment length |
| ManifestSubtitles | 是 | string |  | The subtitle segment format |


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

## getVideosByIdLiveM3u8

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/live.m3u8

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## getVideosByIdMainM3u8

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/main.m3u8

**Method：** GET

**接口描述：** Gets a video stream using HTTP live streaming.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## getVideosByIdMasterM3u8

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/master.m3u8

**Method：** GET

**接口描述：** Gets a video stream using HTTP live streaming.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## headVideosByIdMasterM3u8

### 基本信息
**Path：** HEAD 服务器地址 + /Videos/{Id}/master.m3u8

**Method：** HEAD

**接口描述：** Gets a video stream using HTTP live streaming.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| Container | 是 | string |  | Container |
| AudioCodec | 否 | string |  | Optional. Specify a audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. Options: aac, mp3, vorbis, wma. |
| EnableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| AudioSampleRate | 否 | integer|null |  | Optional. Specify a specific audio sample rate, e.g. 44100 |
| AudioBitRate | 否 | integer|null |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| AudioChannels | 否 | integer|null |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2 |
| MaxAudioChannels | 否 | integer|null |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2 |
| Static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false |
| CopyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |
| Width | 否 | integer|null |  | Optional. The fixed horizontal resolution of the encoded video. |
| Height | 否 | integer|null |  | Optional. The fixed vertical resolution of the encoded video. |
| MaxWidth | 否 | integer|null |  | Optional. The maximum horizontal resolution of the encoded video. |
| MaxHeight | 否 | integer|null |  | Optional. The maximum vertical resolution of the encoded video. |
| VideoBitRate | 否 | integer|null |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| SubtitleStreamIndex | 否 | integer|null |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| SubtitleMethod | 否 | SubtitleDeliveryMethod |  | Optional. Specify the subtitle delivery method. |
| MaxVideoBitDepth | 否 | integer|null |  | Optional. |
| VideoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. Options: h264, mpeg4, theora, vpx, wmv. |
| AudioStreamIndex | 否 | integer|null |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| VideoStreamIndex | 否 | integer|null |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |


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

## getVideosByIdSubtitlesM3u8

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/subtitles.m3u8

**Method：** GET

**接口描述：** Gets an HLS subtitle playlist.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| SubtitleSegmentLength | 是 | integer |  | The subtitle segment length |
| ManifestSubtitles | 是 | string |  | The subtitle segment format |


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

