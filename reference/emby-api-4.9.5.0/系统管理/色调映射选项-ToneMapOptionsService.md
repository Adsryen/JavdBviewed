# 色调映射选项（ToneMapOptionsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Encoding/FullToneMapOptions` | getEncodingFulltonemapoptions | Gets the tone mapping options |
| POST | `/Encoding/FullToneMapOptions` | postEncodingFulltonemapoptions | Updates the tone mapping options |
| GET | `/Encoding/PublicToneMapOptions` | getEncodingPublictonemapoptions | Gets the tone mapping options |
| POST | `/Encoding/PublicToneMapOptions` | postEncodingPublictonemapoptions | Updates the tone mapping options |

---

## getEncodingFulltonemapoptions

### 基本信息
**Path：** GET 服务器地址 + /Encoding/FullToneMapOptions

**Method：** GET

**接口描述：** Gets the tone mapping options

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

## postEncodingFulltonemapoptions

### 基本信息
**Path：** POST 服务器地址 + /Encoding/FullToneMapOptions

**Method：** POST

**接口描述：** Updates the tone mapping options

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


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

## getEncodingPublictonemapoptions

### 基本信息
**Path：** GET 服务器地址 + /Encoding/PublicToneMapOptions

**Method：** GET

**接口描述：** Gets the tone mapping options

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

## postEncodingPublictonemapoptions

### 基本信息
**Path：** POST 服务器地址 + /Encoding/PublicToneMapOptions

**Method：** POST

**接口描述：** Updates the tone mapping options

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


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

