# 视频HLS（VideoHlsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Audio/{Id}/hls/{PlaylistId}/{SegmentId}.{SegmentContainer}` | getAudioByIdHlsByPlaylistidBySegmentidBySegmentcontainer |  |
| GET | `/Videos/{Id}/hls/{PlaylistId}/{SegmentId}.{SegmentContainer}` | getVideosByIdHlsByPlaylistidBySegmentidBySegmentcontainer |  |

---

## getAudioByIdHlsByPlaylistidBySegmentidBySegmentcontainer

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/hls/{PlaylistId}/{SegmentId}.{SegmentContainer}

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

## getVideosByIdHlsByPlaylistidBySegmentidBySegmentcontainer

### 基本信息
**Path：** GET 服务器地址 + /Videos/{Id}/hls/{PlaylistId}/{SegmentId}.{SegmentContainer}

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

