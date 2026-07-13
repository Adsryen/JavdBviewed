# 字幕（SubtitleService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：16

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Items/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}` | getItemsByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat | Gets subtitles in a specified format. |
| HEAD | `/Items/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}` | headItemsByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat | Gets subtitles in a specified format. |
| GET | `/Items/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}` | getItemsByIdByMediasourceidSubtitlesByIndexStreamByFormat | Gets subtitles in a specified format. |
| HEAD | `/Items/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}` | headItemsByIdByMediasourceidSubtitlesByIndexStreamByFormat | Gets subtitles in a specified format. |
| GET | `/Items/{Id}/RemoteSearch/Subtitles/{Language}` | getItemsByIdRemotesearchSubtitlesByLanguage |  |
| POST | `/Items/{Id}/RemoteSearch/Subtitles/{SubtitleId}` | postItemsByIdRemotesearchSubtitlesBySubtitleid |  |
| DELETE | `/Items/{Id}/Subtitles/{Index}` | deleteItemsByIdSubtitlesByIndex | Deletes an external subtitle file |
| POST | `/Items/{Id}/Subtitles/{Index}/Delete` | postItemsByIdSubtitlesByIndexDelete | Deletes an external subtitle file |
| GET | `/Providers/Subtitles/Subtitles/{Id}` | getProvidersSubtitlesSubtitlesById |  |
| GET | `/Videos/{Id}/{MediaSourceId}/Attachments/{Index}/Stream` | getVideosByIdByMediasourceidAttachmentsByIndexStream | Gets subtitles in a specified format. |
| GET | `/Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}` | getVideosByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat | Gets subtitles in a specified format. |
| HEAD | `/Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}` | headVideosByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat | Gets subtitles in a specified format. |
| GET | `/Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}` | getVideosByIdByMediasourceidSubtitlesByIndexStreamByFormat | Gets subtitles in a specified format. |
| HEAD | `/Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}` | headVideosByIdByMediasourceidSubtitlesByIndexStreamByFormat | Gets subtitles in a specified format. |
| DELETE | `/Videos/{Id}/Subtitles/{Index}` | deleteVideosByIdSubtitlesByIndex | Deletes an external subtitle file |
| POST | `/Videos/{Id}/Subtitles/{Index}/Delete` | postVideosByIdSubtitlesByIndexDelete | Deletes an external subtitle file |

---

## getItemsByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |
| StartPositionTicks | 是 | integer |  | StartPositionTicks |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## headItemsByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}

**Method：** HEAD

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |
| StartPositionTicks | 是 | integer |  | StartPositionTicks |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## getItemsByIdByMediasourceidSubtitlesByIndexStreamByFormat

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartPositionTicks | 否 | integer |  | StartPositionTicks |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## headItemsByIdByMediasourceidSubtitlesByIndexStreamByFormat

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}

**Method：** HEAD

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartPositionTicks | 否 | integer |  | StartPositionTicks |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## getItemsByIdRemotesearchSubtitlesByLanguage

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/RemoteSearch/Subtitles/{Language}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Language | 是 | string |  | Language |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MediaSourceId | 是 | string |  | MediaSourceId |
| IsPerfectMatch | 否 | boolean|null |  | IsPerfectMatch |
| IsForced | 否 | boolean|null |  | IsForced |
| IsHearingImpaired | 否 | boolean|null |  | IsHearingImpaired |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a RemoteSubtitleInfo[] object. | RemoteSubtitleInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postItemsByIdRemotesearchSubtitlesBySubtitleid

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/RemoteSearch/Subtitles/{SubtitleId}

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| SubtitleId | 是 | string |  | SubtitleId |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MediaSourceId | 是 | string |  | MediaSourceId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SubtitleDownloadResult object. | Subtitles.SubtitleDownloadResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Subtitles.SubtitleDownloadResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| NewIndex | integer|null |  |


**200 字段说明（Subtitles.SubtitleDownloadResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| NewIndex | integer|null |  |


---

## deleteItemsByIdSubtitlesByIndex

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{Id}/Subtitles/{Index}

**Method：** DELETE

**接口描述：** Deletes an external subtitle file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | The subtitle stream index |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MediaSourceId | 是 | string |  | MediaSourceId |


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

## postItemsByIdSubtitlesByIndexDelete

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Subtitles/{Index}/Delete

**Method：** POST

**接口描述：** Deletes an external subtitle file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | The subtitle stream index |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MediaSourceId | 是 | string |  | MediaSourceId |


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

## getProvidersSubtitlesSubtitlesById

### 基本信息
**Path：** GET 服务器地址 + /Providers/Subtitles/Subtitles/{Id}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


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

## getVideosByIdByMediasourceidAttachmentsByIndexStream

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/{MediaSourceId}/Attachments/{Index}/Stream

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |


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

## getVideosByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |
| StartPositionTicks | 是 | integer |  | StartPositionTicks |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## headVideosByIdByMediasourceidSubtitlesByIndexByStartpositionticksStreamByFormat

### 基本信息
**Path：** HEAD 服务器地址 + /Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/{StartPositionTicks}/Stream.{Format}

**Method：** HEAD

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |
| StartPositionTicks | 是 | integer |  | StartPositionTicks |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## getVideosByIdByMediasourceidSubtitlesByIndexStreamByFormat

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}

**Method：** GET

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartPositionTicks | 否 | integer |  | StartPositionTicks |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## headVideosByIdByMediasourceidSubtitlesByIndexStreamByFormat

### 基本信息
**Path：** HEAD 服务器地址 + /Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.{Format}

**Method：** HEAD

**接口描述：** Gets subtitles in a specified format.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| MediaSourceId | 是 | string |  | MediaSourceId |
| Index | 是 | integer |  | The subtitle stream index |
| Format | 是 | string |  | Format |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartPositionTicks | 否 | integer |  | StartPositionTicks |
| EndPositionTicks | 否 | integer|null |  | EndPositionTicks |
| CopyTimestamps | 否 | boolean |  | CopyTimestamps |


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

## deleteVideosByIdSubtitlesByIndex

### 基本信息
**Path：** DELETE 服务器地址 + /Videos/{Id}/Subtitles/{Index}

**Method：** DELETE

**接口描述：** Deletes an external subtitle file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | The subtitle stream index |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MediaSourceId | 是 | string |  | MediaSourceId |


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

## postVideosByIdSubtitlesByIndexDelete

### 基本信息
**Path：** POST 服务器地址 + /Videos/{Id}/Subtitles/{Index}/Delete

**Method：** POST

**接口描述：** Deletes an external subtitle file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | The subtitle stream index |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MediaSourceId | 是 | string |  | MediaSourceId |


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

