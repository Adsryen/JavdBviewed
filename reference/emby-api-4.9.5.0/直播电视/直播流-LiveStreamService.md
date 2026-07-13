# 直播流（LiveStreamService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：直播电视
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：14

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/LiveTv/LiveRecordings/{Id}/hls/{Segment}` | getLivetvLiverecordingsByIdHlsBySegment | Gets a live recording |
| HEAD | `/LiveTv/LiveRecordings/{Id}/hls/{Segment}` | headLivetvLiverecordingsByIdHlsBySegment | Gets a live recording |
| GET | `/LiveTv/LiveRecordings/{Id}/hls/live.m3u8` | getLivetvLiverecordingsByIdHlsLiveM3u8 | Gets a live recording |
| HEAD | `/LiveTv/LiveRecordings/{Id}/hls/live.m3u8` | headLivetvLiverecordingsByIdHlsLiveM3u8 | Gets a live recording |
| GET | `/LiveTv/LiveRecordings/{Id}/hls/master.m3u8` | getLivetvLiverecordingsByIdHlsMasterM3u8 | Gets a live recording |
| HEAD | `/LiveTv/LiveRecordings/{Id}/hls/master.m3u8` | headLivetvLiverecordingsByIdHlsMasterM3u8 | Gets a live recording |
| GET | `/LiveTv/LiveRecordings/{Id}/stream` | getLivetvLiverecordingsByIdStream | Gets a live tv channel |
| GET | `/LiveTv/LiveStreamFiles/{Id}/hls/{Segment}` | getLivetvLivestreamfilesByIdHlsBySegment | Gets a live tv channel |
| HEAD | `/LiveTv/LiveStreamFiles/{Id}/hls/{Segment}` | headLivetvLivestreamfilesByIdHlsBySegment | Gets a live tv channel |
| GET | `/LiveTv/LiveStreamFiles/{Id}/hls/live.m3u8` | getLivetvLivestreamfilesByIdHlsLiveM3u8 | Gets a live tv channel |
| HEAD | `/LiveTv/LiveStreamFiles/{Id}/hls/live.m3u8` | headLivetvLivestreamfilesByIdHlsLiveM3u8 | Gets a live tv channel |
| GET | `/LiveTv/LiveStreamFiles/{Id}/hls/master.m3u8` | getLivetvLivestreamfilesByIdHlsMasterM3u8 | Gets a live tv channel |
| HEAD | `/LiveTv/LiveStreamFiles/{Id}/hls/master.m3u8` | headLivetvLivestreamfilesByIdHlsMasterM3u8 | Gets a live tv channel |
| GET | `/LiveTv/LiveStreamFiles/{Id}/stream.{Container}` | getLivetvLivestreamfilesByIdStreamByContainer | Gets a live tv channel |

---

## getLivetvLiverecordingsByIdHlsBySegment

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveRecordings/{Id}/hls/{Segment}

**Method：** GET

**接口描述：** Gets a live recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| Segment | 是 | string |  |  |


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

## headLivetvLiverecordingsByIdHlsBySegment

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/LiveRecordings/{Id}/hls/{Segment}

**Method：** HEAD

**接口描述：** Gets a live recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| Segment | 是 | string |  |  |


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

## getLivetvLiverecordingsByIdHlsLiveM3u8

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveRecordings/{Id}/hls/live.m3u8

**Method：** GET

**接口描述：** Gets a live recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## headLivetvLiverecordingsByIdHlsLiveM3u8

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/LiveRecordings/{Id}/hls/live.m3u8

**Method：** HEAD

**接口描述：** Gets a live recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## getLivetvLiverecordingsByIdHlsMasterM3u8

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveRecordings/{Id}/hls/master.m3u8

**Method：** GET

**接口描述：** Gets a live recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## headLivetvLiverecordingsByIdHlsMasterM3u8

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/LiveRecordings/{Id}/hls/master.m3u8

**Method：** HEAD

**接口描述：** Gets a live recording

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## getLivetvLiverecordingsByIdStream

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveRecordings/{Id}/stream

**Method：** GET

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## getLivetvLivestreamfilesByIdHlsBySegment

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/hls/{Segment}

**Method：** GET

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| Segment | 是 | string |  |  |


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

## headLivetvLivestreamfilesByIdHlsBySegment

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/hls/{Segment}

**Method：** HEAD

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| Segment | 是 | string |  |  |


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

## getLivetvLivestreamfilesByIdHlsLiveM3u8

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/hls/live.m3u8

**Method：** GET

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## headLivetvLivestreamfilesByIdHlsLiveM3u8

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/hls/live.m3u8

**Method：** HEAD

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## getLivetvLivestreamfilesByIdHlsMasterM3u8

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/hls/master.m3u8

**Method：** GET

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## headLivetvLivestreamfilesByIdHlsMasterM3u8

### 基本信息
**Path：** HEAD 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/hls/master.m3u8

**Method：** HEAD

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


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

## getLivetvLivestreamfilesByIdStreamByContainer

### 基本信息
**Path：** GET 服务器地址 + /LiveTv/LiveStreamFiles/{Id}/stream.{Container}

**Method：** GET

**接口描述：** Gets a live tv channel

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |
| Container | 是 | string |  |  |


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

