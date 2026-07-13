# 歌词（Lyric）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Audio/{itemId}/Lyrics` | DeleteLyrics | Deletes an external lyric file. |
| GET | `/Audio/{itemId}/Lyrics` | GetLyrics | Gets an item's lyrics. |
| POST | `/Audio/{itemId}/Lyrics` | UploadLyrics | Upload an external lyric file. |
| GET | `/Audio/{itemId}/RemoteSearch/Lyrics` | SearchRemoteLyrics | Search remote lyrics. |
| POST | `/Audio/{itemId}/RemoteSearch/Lyrics/{lyricId}` | DownloadRemoteLyrics | Downloads a remote lyric. |
| GET | `/Providers/Lyrics/{lyricId}` | GetRemoteLyrics | Gets the remote lyrics. |

---

## DeleteLyrics

### 基本信息
**Path：** DELETE 服务器地址 + /Audio/{itemId}/Lyrics

**Method：** DELETE

**接口描述：** Deletes an external lyric file.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Lyric deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLyrics

### 基本信息
**Path：** GET 服务器地址 + /Audio/{itemId}/Lyrics

**Method：** GET

**接口描述：** Gets an item's lyrics.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Lyrics returned. | LyricDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Something went wrong. No Lyrics will be returned. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


---

## UploadLyrics

### 基本信息
**Path：** POST 服务器地址 + /Audio/{itemId}/Lyrics

**Method：** POST

**接口描述：** Upload an external lyric file.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item the lyric belongs to. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| fileName | 是 | string |  | Name of the file being uploaded. |


**Body**

- 是否必须：否
- Content-Type：`text/plain`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Lyrics uploaded. | LyricDto |
| 400 | Error processing upload. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


---

## SearchRemoteLyrics

### 基本信息
**Path：** GET 服务器地址 + /Audio/{itemId}/RemoteSearch/Lyrics

**Method：** GET

**接口描述：** Search remote lyrics.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Lyrics retrieved. | RemoteLyricInfoDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DownloadRemoteLyrics

### 基本信息
**Path：** POST 服务器地址 + /Audio/{itemId}/RemoteSearch/Lyrics/{lyricId}

**Method：** POST

**接口描述：** Downloads a remote lyric.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| lyricId | 是 | string |  | The lyric id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Lyric downloaded. | LyricDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


---

## GetRemoteLyrics

### 基本信息
**Path：** GET 服务器地址 + /Providers/Lyrics/{lyricId}

**Method：** GET

**接口描述：** Gets the remote lyrics.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| lyricId | 是 | string |  | The remote provider item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | File returned. | LyricDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Lyric not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


**200 字段说明（LyricDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Metadata | LyricMetadata | Gets or sets Metadata for the lyrics. |
| Lyrics | LyricLine[] | Gets or sets a collection of individual lyric lines. |


---

