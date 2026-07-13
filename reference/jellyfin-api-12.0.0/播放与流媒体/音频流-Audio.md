# 音频流（Audio）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Audio/{itemId}/stream` | GetAudioStream | Gets an audio stream. |
| HEAD | `/Audio/{itemId}/stream` | HeadAudioStream | Gets an audio stream. |
| GET | `/Audio/{itemId}/stream.{container}` | GetAudioStreamByContainer | Gets an audio stream. |
| HEAD | `/Audio/{itemId}/stream.{container}` | HeadAudioStreamByContainer | Gets an audio stream. |
| GET | `/Audio/{itemId}/universal` | GetUniversalAudioStream | Gets an audio stream. |
| HEAD | `/Audio/{itemId}/universal` | HeadUniversalAudioStream | Gets an audio stream. |

---

## GetAudioStream

### 基本信息
**Path：** GET 服务器地址 + /Audio/{itemId}/stream

**Method：** GET

**接口描述：** Gets an audio stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| container | 否 | string |  | The audio container. |
| static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. |
| params | 否 | string |  | The streaming parameters. |
| tag | 否 | string |  | The tag. |
| deviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| playSessionId | 否 | string |  | The play session id. |
| segmentContainer | 否 | string |  | The segment container. |
| segmentLength | 否 | integer |  | The segment length. |
| minSegments | 否 | integer |  | The minimum number of segments. |
| mediaSourceId | 否 | string |  | The media version id, if playing an alternate version. |
| deviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| audioCodec | 否 | string |  | Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. |
| enableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| allowVideoStreamCopy | 否 | boolean |  | Whether or not to allow copying of the video stream url. |
| allowAudioStreamCopy | 否 | boolean |  | Whether or not to allow copying of the audio stream url. |
| audioSampleRate | 否 | integer |  | Optional. Specify a specific audio sample rate, e.g. 44100. |
| maxAudioBitDepth | 否 | integer |  | Optional. The maximum audio bit depth. |
| audioBitRate | 否 | integer |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| audioChannels | 否 | integer |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2. |
| maxAudioChannels | 否 | integer |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2. |
| profile | 否 | string |  | Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. |
| level | 否 | string |  | Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. |
| framerate | 否 | number |  | Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| maxFramerate | 否 | number |  | Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| copyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| startTimeTicks | 否 | integer |  | Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms. |
| width | 否 | integer |  | Optional. The fixed horizontal resolution of the encoded video. |
| height | 否 | integer |  | Optional. The fixed vertical resolution of the encoded video. |
| videoBitRate | 否 | integer |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| subtitleStreamIndex | 否 | integer |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| subtitleMethod | 否 | string enum(Encode|Embed|External|Hls|Drop) |  | Optional. Specify the subtitle delivery method. |
| maxRefFrames | 否 | integer |  | Optional. |
| maxVideoBitDepth | 否 | integer |  | Optional. The maximum video bit depth. |
| requireAvc | 否 | boolean |  | Optional. Whether to require avc. |
| deInterlace | 否 | boolean |  | Optional. Whether to deinterlace the video. |
| requireNonAnamorphic | 否 | boolean |  | Optional. Whether to require a non anamorphic stream. |
| transcodingMaxAudioChannels | 否 | integer |  | Optional. The maximum number of audio channels to transcode. |
| cpuCoreLimit | 否 | integer |  | Optional. The limit of how many cpu cores to use. |
| liveStreamId | 否 | string |  | The live stream id. |
| enableMpegtsM2TsMode | 否 | boolean |  | Optional. Whether to enable the MpegtsM2Ts mode. |
| videoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. |
| subtitleCodec | 否 | string |  | Optional. Specify a subtitle codec to encode to. |
| transcodeReasons | 否 | string |  | Optional. The transcoding reason. |
| audioStreamIndex | 否 | integer |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| videoStreamIndex | 否 | integer |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |
| context | 否 | string enum(Streaming|Static) |  | Optional. The MediaBrowser.Model.Dlna.EncodingContext. |
| streamOptions | 否 | object |  | Optional. The streaming options. |
| enableAudioVbrEncoding | 否 | boolean | true | Optional. Whether to enable Audio Encoding. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Audio stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadAudioStream

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{itemId}/stream

**Method：** HEAD

**接口描述：** Gets an audio stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| container | 否 | string |  | The audio container. |
| static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. |
| params | 否 | string |  | The streaming parameters. |
| tag | 否 | string |  | The tag. |
| deviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| playSessionId | 否 | string |  | The play session id. |
| segmentContainer | 否 | string |  | The segment container. |
| segmentLength | 否 | integer |  | The segment length. |
| minSegments | 否 | integer |  | The minimum number of segments. |
| mediaSourceId | 否 | string |  | The media version id, if playing an alternate version. |
| deviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| audioCodec | 否 | string |  | Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. |
| enableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| allowVideoStreamCopy | 否 | boolean |  | Whether or not to allow copying of the video stream url. |
| allowAudioStreamCopy | 否 | boolean |  | Whether or not to allow copying of the audio stream url. |
| audioSampleRate | 否 | integer |  | Optional. Specify a specific audio sample rate, e.g. 44100. |
| maxAudioBitDepth | 否 | integer |  | Optional. The maximum audio bit depth. |
| audioBitRate | 否 | integer |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| audioChannels | 否 | integer |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2. |
| maxAudioChannels | 否 | integer |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2. |
| profile | 否 | string |  | Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. |
| level | 否 | string |  | Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. |
| framerate | 否 | number |  | Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| maxFramerate | 否 | number |  | Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| copyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| startTimeTicks | 否 | integer |  | Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms. |
| width | 否 | integer |  | Optional. The fixed horizontal resolution of the encoded video. |
| height | 否 | integer |  | Optional. The fixed vertical resolution of the encoded video. |
| videoBitRate | 否 | integer |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| subtitleStreamIndex | 否 | integer |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| subtitleMethod | 否 | string enum(Encode|Embed|External|Hls|Drop) |  | Optional. Specify the subtitle delivery method. |
| maxRefFrames | 否 | integer |  | Optional. |
| maxVideoBitDepth | 否 | integer |  | Optional. The maximum video bit depth. |
| requireAvc | 否 | boolean |  | Optional. Whether to require avc. |
| deInterlace | 否 | boolean |  | Optional. Whether to deinterlace the video. |
| requireNonAnamorphic | 否 | boolean |  | Optional. Whether to require a non anamorphic stream. |
| transcodingMaxAudioChannels | 否 | integer |  | Optional. The maximum number of audio channels to transcode. |
| cpuCoreLimit | 否 | integer |  | Optional. The limit of how many cpu cores to use. |
| liveStreamId | 否 | string |  | The live stream id. |
| enableMpegtsM2TsMode | 否 | boolean |  | Optional. Whether to enable the MpegtsM2Ts mode. |
| videoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. |
| subtitleCodec | 否 | string |  | Optional. Specify a subtitle codec to encode to. |
| transcodeReasons | 否 | string |  | Optional. The transcoding reason. |
| audioStreamIndex | 否 | integer |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| videoStreamIndex | 否 | integer |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |
| context | 否 | string enum(Streaming|Static) |  | Optional. The MediaBrowser.Model.Dlna.EncodingContext. |
| streamOptions | 否 | object |  | Optional. The streaming options. |
| enableAudioVbrEncoding | 否 | boolean | true | Optional. Whether to enable Audio Encoding. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Audio stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetAudioStreamByContainer

### 基本信息
**Path：** GET 服务器地址 + /Audio/{itemId}/stream.{container}

**Method：** GET

**接口描述：** Gets an audio stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| container | 是 | string |  | The audio container. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. |
| params | 否 | string |  | The streaming parameters. |
| tag | 否 | string |  | The tag. |
| deviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| playSessionId | 否 | string |  | The play session id. |
| segmentContainer | 否 | string |  | The segment container. |
| segmentLength | 否 | integer |  | The segment length. |
| minSegments | 否 | integer |  | The minimum number of segments. |
| mediaSourceId | 否 | string |  | The media version id, if playing an alternate version. |
| deviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| audioCodec | 否 | string |  | Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. |
| enableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| allowVideoStreamCopy | 否 | boolean |  | Whether or not to allow copying of the video stream url. |
| allowAudioStreamCopy | 否 | boolean |  | Whether or not to allow copying of the audio stream url. |
| audioSampleRate | 否 | integer |  | Optional. Specify a specific audio sample rate, e.g. 44100. |
| maxAudioBitDepth | 否 | integer |  | Optional. The maximum audio bit depth. |
| audioBitRate | 否 | integer |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| audioChannels | 否 | integer |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2. |
| maxAudioChannels | 否 | integer |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2. |
| profile | 否 | string |  | Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. |
| level | 否 | string |  | Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. |
| framerate | 否 | number |  | Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| maxFramerate | 否 | number |  | Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| copyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| startTimeTicks | 否 | integer |  | Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms. |
| width | 否 | integer |  | Optional. The fixed horizontal resolution of the encoded video. |
| height | 否 | integer |  | Optional. The fixed vertical resolution of the encoded video. |
| videoBitRate | 否 | integer |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| subtitleStreamIndex | 否 | integer |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| subtitleMethod | 否 | string enum(Encode|Embed|External|Hls|Drop) |  | Optional. Specify the subtitle delivery method. |
| maxRefFrames | 否 | integer |  | Optional. |
| maxVideoBitDepth | 否 | integer |  | Optional. The maximum video bit depth. |
| requireAvc | 否 | boolean |  | Optional. Whether to require avc. |
| deInterlace | 否 | boolean |  | Optional. Whether to deinterlace the video. |
| requireNonAnamorphic | 否 | boolean |  | Optional. Whether to require a non anamorphic stream. |
| transcodingMaxAudioChannels | 否 | integer |  | Optional. The maximum number of audio channels to transcode. |
| cpuCoreLimit | 否 | integer |  | Optional. The limit of how many cpu cores to use. |
| liveStreamId | 否 | string |  | The live stream id. |
| enableMpegtsM2TsMode | 否 | boolean |  | Optional. Whether to enable the MpegtsM2Ts mode. |
| videoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. |
| subtitleCodec | 否 | string |  | Optional. Specify a subtitle codec to encode to. |
| transcodeReasons | 否 | string |  | Optional. The transcoding reason. |
| audioStreamIndex | 否 | integer |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| videoStreamIndex | 否 | integer |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |
| context | 否 | string enum(Streaming|Static) |  | Optional. The MediaBrowser.Model.Dlna.EncodingContext. |
| streamOptions | 否 | object |  | Optional. The streaming options. |
| enableAudioVbrEncoding | 否 | boolean | true | Optional. Whether to enable Audio Encoding. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Audio stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadAudioStreamByContainer

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{itemId}/stream.{container}

**Method：** HEAD

**接口描述：** Gets an audio stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| container | 是 | string |  | The audio container. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| static | 否 | boolean |  | Optional. If true, the original file will be streamed statically without any encoding. Use either no url extension or the original file extension. true/false. |
| params | 否 | string |  | The streaming parameters. |
| tag | 否 | string |  | The tag. |
| deviceProfileId | 否 | string |  | Optional. The dlna device profile id to utilize. |
| playSessionId | 否 | string |  | The play session id. |
| segmentContainer | 否 | string |  | The segment container. |
| segmentLength | 否 | integer |  | The segment length. |
| minSegments | 否 | integer |  | The minimum number of segments. |
| mediaSourceId | 否 | string |  | The media version id, if playing an alternate version. |
| deviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| audioCodec | 否 | string |  | Optional. Specify an audio codec to encode to, e.g. mp3. If omitted the server will auto-select using the url's extension. |
| enableAutoStreamCopy | 否 | boolean |  | Whether or not to allow automatic stream copy if requested values match the original source. Defaults to true. |
| allowVideoStreamCopy | 否 | boolean |  | Whether or not to allow copying of the video stream url. |
| allowAudioStreamCopy | 否 | boolean |  | Whether or not to allow copying of the audio stream url. |
| audioSampleRate | 否 | integer |  | Optional. Specify a specific audio sample rate, e.g. 44100. |
| maxAudioBitDepth | 否 | integer |  | Optional. The maximum audio bit depth. |
| audioBitRate | 否 | integer |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| audioChannels | 否 | integer |  | Optional. Specify a specific number of audio channels to encode to, e.g. 2. |
| maxAudioChannels | 否 | integer |  | Optional. Specify a maximum number of audio channels to encode to, e.g. 2. |
| profile | 否 | string |  | Optional. Specify a specific an encoder profile (varies by encoder), e.g. main, baseline, high. |
| level | 否 | string |  | Optional. Specify a level for the encoder profile (varies by encoder), e.g. 3, 3.1. |
| framerate | 否 | number |  | Optional. A specific video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| maxFramerate | 否 | number |  | Optional. A specific maximum video framerate to encode to, e.g. 23.976. Generally this should be omitted unless the device has specific requirements. |
| copyTimestamps | 否 | boolean |  | Whether or not to copy timestamps when transcoding with an offset. Defaults to false. |
| startTimeTicks | 否 | integer |  | Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms. |
| width | 否 | integer |  | Optional. The fixed horizontal resolution of the encoded video. |
| height | 否 | integer |  | Optional. The fixed vertical resolution of the encoded video. |
| videoBitRate | 否 | integer |  | Optional. Specify a video bitrate to encode to, e.g. 500000. If omitted this will be left to encoder defaults. |
| subtitleStreamIndex | 否 | integer |  | Optional. The index of the subtitle stream to use. If omitted no subtitles will be used. |
| subtitleMethod | 否 | string enum(Encode|Embed|External|Hls|Drop) |  | Optional. Specify the subtitle delivery method. |
| maxRefFrames | 否 | integer |  | Optional. |
| maxVideoBitDepth | 否 | integer |  | Optional. The maximum video bit depth. |
| requireAvc | 否 | boolean |  | Optional. Whether to require avc. |
| deInterlace | 否 | boolean |  | Optional. Whether to deinterlace the video. |
| requireNonAnamorphic | 否 | boolean |  | Optional. Whether to require a non anamorphic stream. |
| transcodingMaxAudioChannels | 否 | integer |  | Optional. The maximum number of audio channels to transcode. |
| cpuCoreLimit | 否 | integer |  | Optional. The limit of how many cpu cores to use. |
| liveStreamId | 否 | string |  | The live stream id. |
| enableMpegtsM2TsMode | 否 | boolean |  | Optional. Whether to enable the MpegtsM2Ts mode. |
| videoCodec | 否 | string |  | Optional. Specify a video codec to encode to, e.g. h264. If omitted the server will auto-select using the url's extension. |
| subtitleCodec | 否 | string |  | Optional. Specify a subtitle codec to encode to. |
| transcodeReasons | 否 | string |  | Optional. The transcoding reason. |
| audioStreamIndex | 否 | integer |  | Optional. The index of the audio stream to use. If omitted the first audio stream will be used. |
| videoStreamIndex | 否 | integer |  | Optional. The index of the video stream to use. If omitted the first video stream will be used. |
| context | 否 | string enum(Streaming|Static) |  | Optional. The MediaBrowser.Model.Dlna.EncodingContext. |
| streamOptions | 否 | object |  | Optional. The streaming options. |
| enableAudioVbrEncoding | 否 | boolean | true | Optional. Whether to enable Audio Encoding. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Audio stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetUniversalAudioStream

### 基本信息
**Path：** GET 服务器地址 + /Audio/{itemId}/universal

**Method：** GET

**接口描述：** Gets an audio stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| container | 否 | string[] |  | Optional. The audio container. |
| mediaSourceId | 否 | string |  | The media version id, if playing an alternate version. |
| deviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| userId | 否 | string |  | Optional. The user id. |
| audioCodec | 否 | string |  | Optional. The audio codec to transcode to. |
| maxAudioChannels | 否 | integer |  | Optional. The maximum number of audio channels. |
| transcodingAudioChannels | 否 | integer |  | Optional. The number of how many audio channels to transcode to. |
| maxStreamingBitrate | 否 | integer |  | Optional. The maximum streaming bitrate. |
| audioBitRate | 否 | integer |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| startTimeTicks | 否 | integer |  | Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms. |
| transcodingContainer | 否 | string |  | Optional. The container to transcode to. |
| transcodingProtocol | 否 | string enum(http|hls) |  | Optional. The transcoding protocol. |
| maxAudioSampleRate | 否 | integer |  | Optional. The maximum audio sample rate. |
| maxAudioBitDepth | 否 | integer |  | Optional. The maximum audio bit depth. |
| enableRemoteMedia | 否 | boolean |  | Optional. Whether to enable remote media. |
| enableAudioVbrEncoding | 否 | boolean | true | Optional. Whether to enable Audio Encoding. |
| enableRedirection | 否 | boolean | true | Whether to enable redirection. Defaults to true. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Audio stream returned. | string |
| 302 | Redirected to remote audio stream. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadUniversalAudioStream

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{itemId}/universal

**Method：** HEAD

**接口描述：** Gets an audio stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| container | 否 | string[] |  | Optional. The audio container. |
| mediaSourceId | 否 | string |  | The media version id, if playing an alternate version. |
| deviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| userId | 否 | string |  | Optional. The user id. |
| audioCodec | 否 | string |  | Optional. The audio codec to transcode to. |
| maxAudioChannels | 否 | integer |  | Optional. The maximum number of audio channels. |
| transcodingAudioChannels | 否 | integer |  | Optional. The number of how many audio channels to transcode to. |
| maxStreamingBitrate | 否 | integer |  | Optional. The maximum streaming bitrate. |
| audioBitRate | 否 | integer |  | Optional. Specify an audio bitrate to encode to, e.g. 128000. If omitted this will be left to encoder defaults. |
| startTimeTicks | 否 | integer |  | Optional. Specify a starting offset, in ticks. 1 tick = 10000 ms. |
| transcodingContainer | 否 | string |  | Optional. The container to transcode to. |
| transcodingProtocol | 否 | string enum(http|hls) |  | Optional. The transcoding protocol. |
| maxAudioSampleRate | 否 | integer |  | Optional. The maximum audio sample rate. |
| maxAudioBitDepth | 否 | integer |  | Optional. The maximum audio bit depth. |
| enableRemoteMedia | 否 | boolean |  | Optional. Whether to enable remote media. |
| enableAudioVbrEncoding | 否 | boolean | true | Optional. Whether to enable Audio Encoding. |
| enableRedirection | 否 | boolean | true | Whether to enable redirection. Defaults to true. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Audio stream returned. | string |
| 302 | Redirected to remote audio stream. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

