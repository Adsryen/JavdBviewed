# 预览图轨（TrickPlay）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Videos/{itemId}/Trickplay/{width}/{index}.jpg` | GetTrickplayTileImage | Gets a trickplay tile image. |
| GET | `/Videos/{itemId}/Trickplay/{width}/tiles.m3u8` | GetTrickplayHlsPlaylist | Gets an image tiles playlist for trickplay. |

---

## GetTrickplayTileImage

### 基本信息
**Path：** GET 服务器地址 + /Videos/{itemId}/Trickplay/{width}/{index}.jpg

**Method：** GET

**接口描述：** Gets a trickplay tile image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| width | 是 | integer |  | The width of a single tile. |
| index | 是 | integer |  | The index of the desired tile. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| mediaSourceId | 否 | string |  | The media version id, if using an alternate version. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Tile image not found at specified index. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetTrickplayHlsPlaylist

### 基本信息
**Path：** GET 服务器地址 + /Videos/{itemId}/Trickplay/{width}/tiles.m3u8

**Method：** GET

**接口描述：** Gets an image tiles playlist for trickplay.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |
| width | 是 | integer |  | The width of a single tile. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| mediaSourceId | 否 | string |  | The media version id, if using an alternate version. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Tiles playlist returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

