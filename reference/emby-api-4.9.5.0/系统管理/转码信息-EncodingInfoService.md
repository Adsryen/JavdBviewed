# 转码信息（EncodingInfoService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Encoding/CodecConfiguration/Defaults` | getEncodingCodecconfigurationDefaults | Gets default codec configurations |
| GET | `/Encoding/CodecInformation/Video` | getEncodingCodecinformationVideo | Gets details about available video encoders and decoders |
| GET | `/Encoding/ToneMapOptions` | getEncodingTonemapoptions | Gets available tone mapping options |

---

## getEncodingCodecconfigurationDefaults

### 基本信息
**Path：** GET 服务器地址 + /Encoding/CodecConfiguration/Defaults

**Method：** GET

**接口描述：** Gets default codec configurations

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a CodecConfiguration[] object. | CodecConfiguration[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getEncodingCodecinformationVideo

### 基本信息
**Path：** GET 服务器地址 + /Encoding/CodecInformation/Video

**Method：** GET

**接口描述：** Gets details about available video encoders and decoders

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a VideoCodecBase[] object. | VideoCodecBase[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getEncodingTonemapoptions

### 基本信息
**Path：** GET 服务器地址 + /Encoding/ToneMapOptions

**Method：** GET

**接口描述：** Gets available tone mapping options

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ToneMapOptionsVisibility object. | Configuration.ToneMapping.ToneMapOptionsVisibility |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Configuration.ToneMapping.ToneMapOptionsVisibility）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ShowAdvanced | boolean |  |
| IsSoftwareToneMappingAvailable | boolean |  |
| IsAnyHardwareToneMappingAvailable | boolean |  |
| ShowNvidiaOptions | boolean |  |
| ShowQuickSyncOptions | boolean |  |
| ShowVaapiOptions | boolean |  |
| IsOpenClAvailable | boolean |  |
| IsOpenClSuperTAvailable | boolean |  |
| IsVaapiNativeAvailable | boolean |  |
| IsQuickSyncNativeAvailable | boolean |  |
| OperatingSystem | OperatingSystem |  |


**200 字段说明（Configuration.ToneMapping.ToneMapOptionsVisibility）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ShowAdvanced | boolean |  |
| IsSoftwareToneMappingAvailable | boolean |  |
| IsAnyHardwareToneMappingAvailable | boolean |  |
| ShowNvidiaOptions | boolean |  |
| ShowQuickSyncOptions | boolean |  |
| ShowVaapiOptions | boolean |  |
| IsOpenClAvailable | boolean |  |
| IsOpenClSuperTAvailable | boolean |  |
| IsVaapiNativeAvailable | boolean |  |
| IsQuickSyncNativeAvailable | boolean |  |
| OperatingSystem | OperatingSystem |  |


---

