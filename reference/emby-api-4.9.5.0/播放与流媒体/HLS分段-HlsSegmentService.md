# HLS分段（HlsSegmentService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/Videos/ActiveEncodings` | deleteVideosActiveencodings |  |
| POST | `/Videos/ActiveEncodings/Delete` | postVideosActiveencodingsDelete |  |

---

## deleteVideosActiveencodings

### 基本信息
**Path：** DELETE 服务器地址 + /Videos/ActiveEncodings

**Method：** DELETE

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceId | 是 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| PlaySessionId | 是 | string |  | The play session id |


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

## postVideosActiveencodingsDelete

### 基本信息
**Path：** POST 服务器地址 + /Videos/ActiveEncodings/Delete

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceId | 是 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| PlaySessionId | 是 | string |  | The play session id |


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

