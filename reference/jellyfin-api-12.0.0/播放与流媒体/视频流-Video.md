# 视频流（Video）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：8

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Videos/{itemId}/AdditionalParts` | GetAdditionalPart | Gets additional parts for a video. |
| DELETE | `/Videos/{itemId}/AlternateSources` | DeleteAlternateSources | Removes alternate video sources. |
| GET | `/Videos/{itemId}/stream` | GetVideoStream | Gets a video stream. |
| HEAD | `/Videos/{itemId}/stream` | HeadVideoStream | Gets a video stream. |
| GET | `/Videos/{itemId}/stream.{container}` | GetVideoStreamByContainer | Gets a video stream. |
| HEAD | `/Videos/{itemId}/stream.{container}` | HeadVideoStreamByContainer | Gets a video stream. |
| GET | `/Videos/{videoId}/{mediaSourceId}/Attachments/{index}` | GetAttachment | Get video attachment. |
| POST | `/Videos/MergeVersions` | MergeVersions | Merges videos into a single record. |

---

## GetAdditionalPart

### 基本信息
**Path：** GET 服务器地址 + /Videos/{itemId}/AdditionalParts

**Method：** GET

**接口描述：** Gets additional parts for a video.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | Optional. Filter by user id, and attach user data. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Additional parts returned. | BaseItemDtoQueryResult |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


**200 字段说明（BaseItemDtoQueryResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] | Gets or sets the items. |
| TotalRecordCount | integer | Gets or sets the total number of records available. |
| StartIndex | integer | Gets or sets the index of the first record in Items. |


---

## DeleteAlternateSources

### 基本信息
**Path：** DELETE 服务器地址 + /Videos/{itemId}/AlternateSources

**Method：** DELETE

**接口描述：** Removes alternate video sources.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Alternate sources deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Video not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetVideoStream

### 基本信息
**Path：** GET 服务器地址 + /Videos/{itemId}/stream

**Method：** GET

**接口描述：** Gets a video stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| container | 否 | string |  | The video container. Possible values are: ts, webm, asf, wmv, ogv, mp4, m4v, mkv, mpeg, mpg, avi, 3gp, wmv, wtv, m2ts, mov, iso, flv. |
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
| maxWidth | 否 | integer |  | Optional. The maximum horizontal resolution of the encoded video. |
| maxHeight | 否 | integer |  | Optional. The maximum vertical resolution of the encoded video. |
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
| 200 | Video stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadVideoStream

### 基本信息
**Path：** HEAD 服务器地址 + /Videos/{itemId}/stream

**Method：** HEAD

**接口描述：** Gets a video stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| container | 否 | string |  | The video container. Possible values are: ts, webm, asf, wmv, ogv, mp4, m4v, mkv, mpeg, mpg, avi, 3gp, wmv, wtv, m2ts, mov, iso, flv. |
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
| maxWidth | 否 | integer |  | Optional. The maximum horizontal resolution of the encoded video. |
| maxHeight | 否 | integer |  | Optional. The maximum vertical resolution of the encoded video. |
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
| 200 | Video stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetVideoStreamByContainer

### 基本信息
**Path：** GET 服务器地址 + /Videos/{itemId}/stream.{container}

**Method：** GET

**接口描述：** Gets a video stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| container | 是 | string |  | The video container. Possible values are: ts, webm, asf, wmv, ogv, mp4, m4v, mkv, mpeg, mpg, avi, 3gp, wmv, wtv, m2ts, mov, iso, flv. |


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
| maxWidth | 否 | integer |  | Optional. The maximum horizontal resolution of the encoded video. |
| maxHeight | 否 | integer |  | Optional. The maximum vertical resolution of the encoded video. |
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
| 200 | Video stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadVideoStreamByContainer

### 基本信息
**Path：** HEAD 服务器地址 + /Videos/{itemId}/stream.{container}

**Method：** HEAD

**接口描述：** Gets a video stream.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| container | 是 | string |  | The video container. Possible values are: ts, webm, asf, wmv, ogv, mp4, m4v, mkv, mpeg, mpg, avi, 3gp, wmv, wtv, m2ts, mov, iso, flv. |


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
| maxWidth | 否 | integer |  | Optional. The maximum horizontal resolution of the encoded video. |
| maxHeight | 否 | integer |  | Optional. The maximum vertical resolution of the encoded video. |
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
| 200 | Video stream returned. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetAttachment

### 基本信息
**Path：** GET 服务器地址 + /Videos/{videoId}/{mediaSourceId}/Attachments/{index}

**Method：** GET

**接口描述：** Get video attachment.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| videoId | 是 | string |  | Video ID. |
| mediaSourceId | 是 | string |  | Media Source ID. |
| index | 是 | integer |  | Attachment Index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Attachment retrieved. | string |
| 404 | Video or attachment not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## MergeVersions

### 基本信息
**Path：** POST 服务器地址 + /Videos/MergeVersions

**Method：** POST

**接口描述：** Merges videos into a single record.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ids | 是 | string[] |  | Item id list. This allows multiple, comma delimited. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Videos merged. |  |
| 400 | Supply at least 2 video ids. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

