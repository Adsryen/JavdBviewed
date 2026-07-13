# 音频流（AudioService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Audio/{Id}/{StreamFileName}` | getAudioByIdByStreamfilename | Gets an audio stream |
| HEAD | `/Audio/{Id}/{StreamFileName}` | headAudioByIdByStreamfilename | Gets an audio stream |
| GET | `/Audio/{Id}/stream` | getAudioByIdStream | Gets an audio stream |
| HEAD | `/Audio/{Id}/stream` | headAudioByIdStream | Gets an audio stream |
| GET | `/Audio/{Id}/stream.{Container}` | getAudioByIdStreamByContainer | Gets an audio stream |
| HEAD | `/Audio/{Id}/stream.{Container}` | headAudioByIdStreamByContainer | Gets an audio stream |

---

## getAudioByIdByStreamfilename

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/{StreamFileName}

**Method：** GET

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StreamFileName | 是 | string |  |  |
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

## headAudioByIdByStreamfilename

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/{StreamFileName}

**Method：** HEAD

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StreamFileName | 是 | string |  |  |
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

## getAudioByIdStream

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/stream

**Method：** GET

**接口描述：** Gets an audio stream

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

## headAudioByIdStream

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/stream

**Method：** HEAD

**接口描述：** Gets an audio stream

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

## getAudioByIdStreamByContainer

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/stream.{Container}

**Method：** GET

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Container | 是 | string |  | Container |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
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

## headAudioByIdStreamByContainer

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/stream.{Container}

**Method：** HEAD

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Container | 是 | string |  | Container |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
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

