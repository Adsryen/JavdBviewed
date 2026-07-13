# 编解码参数（CodecParameterService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Encoding/CodecParameters` | getEncodingCodecparameters | Gets the parameters for a specified codec. |
| POST | `/Encoding/CodecParameters` | postEncodingCodecparameters | Updates the parameters for a specified codec. |

---

## getEncodingCodecparameters

### 基本信息
**Path：** GET 服务器地址 + /Encoding/CodecParameters

**Method：** GET

**接口描述：** Gets the parameters for a specified codec.

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| CodecId | 是 | string |  | Codec Id |
| ParameterContext | 是 | MediaEncoding.CodecParameterContext |  | Parameter Context |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a EditObjectContainer object. | EditObjectContainer |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（EditObjectContainer）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Object | object |  |
| DefaultObject | object |  |
| TypeName | string |  |
| EditorRoot | Editors.EditorRoot |  |


**200 字段说明（EditObjectContainer）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Object | object |  |
| DefaultObject | object |  |
| TypeName | string |  |
| EditorRoot | Editors.EditorRoot |  |


---

## postEncodingCodecparameters

### 基本信息
**Path：** POST 服务器地址 + /Encoding/CodecParameters

**Method：** POST

**接口描述：** Updates the parameters for a specified codec.

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| CodecId | 是 | string |  | Codec Id |
| ParameterContext | 是 | MediaEncoding.CodecParameterContext |  | Parameter Context |


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


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

