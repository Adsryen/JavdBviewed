# 通用音频流（UniversalAudioService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Audio/{Id}/universal` | getAudioByIdUniversal | Gets an audio stream |
| HEAD | `/Audio/{Id}/universal` | headAudioByIdUniversal | Gets an audio stream |
| GET | `/Audio/{Id}/universal.{Container}` | getAudioByIdUniversalByContainer | Gets an audio stream |
| HEAD | `/Audio/{Id}/universal.{Container}` | headAudioByIdUniversalByContainer | Gets an audio stream |

---

## getAudioByIdUniversal

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/universal

**Method：** GET

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |


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

## headAudioByIdUniversal

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/universal

**Method：** HEAD

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |


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

## getAudioByIdUniversalByContainer

### 基本信息
**Path：** GET 服务器地址 + /Audio/{Id}/universal.{Container}

**Method：** GET

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Container | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |


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

## headAudioByIdUniversalByContainer

### 基本信息
**Path：** HEAD 服务器地址 + /Audio/{Id}/universal.{Container}

**Method：** HEAD

**接口描述：** Gets an audio stream

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Container | 是 | string |  |  |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DeviceId | 否 | string |  | The device id of the client requesting. Used to stop encoding processes when needed. |
| StartTimeTicks | 否 | integer|null |  | Optional. Specify a starting offset, in ticks. 1ms = 10000 ticks. |


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

