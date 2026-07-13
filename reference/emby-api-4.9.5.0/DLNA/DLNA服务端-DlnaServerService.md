# DLNA服务端（DlnaServerService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：DLNA
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：16

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Dlna/{UuId}/connectionmanager/connectionmanager` | getDlnaByUuidConnectionmanagerConnectionmanager | Gets dlna connection manager xml |
| HEAD | `/Dlna/{UuId}/connectionmanager/connectionmanager` | headDlnaByUuidConnectionmanagerConnectionmanager | Gets dlna connection manager xml |
| GET | `/Dlna/{UuId}/connectionmanager/connectionmanager.xml` | getDlnaByUuidConnectionmanagerConnectionmanagerXml | Gets dlna connection manager xml |
| HEAD | `/Dlna/{UuId}/connectionmanager/connectionmanager.xml` | headDlnaByUuidConnectionmanagerConnectionmanagerXml | Gets dlna connection manager xml |
| POST | `/Dlna/{UuId}/connectionmanager/control` | postDlnaByUuidConnectionmanagerControl | Processes a control request |
| GET | `/Dlna/{UuId}/contentdirectory/contentdirectory` | getDlnaByUuidContentdirectoryContentdirectory | Gets dlna content directory xml |
| HEAD | `/Dlna/{UuId}/contentdirectory/contentdirectory` | headDlnaByUuidContentdirectoryContentdirectory | Gets dlna content directory xml |
| GET | `/Dlna/{UuId}/contentdirectory/contentdirectory.xml` | getDlnaByUuidContentdirectoryContentdirectoryXml | Gets dlna content directory xml |
| HEAD | `/Dlna/{UuId}/contentdirectory/contentdirectory.xml` | headDlnaByUuidContentdirectoryContentdirectoryXml | Gets dlna content directory xml |
| POST | `/Dlna/{UuId}/contentdirectory/control` | postDlnaByUuidContentdirectoryControl | Processes a control request |
| GET | `/Dlna/{UuId}/description` | getDlnaByUuidDescription | Gets dlna server info |
| HEAD | `/Dlna/{UuId}/description` | headDlnaByUuidDescription | Gets dlna server info |
| GET | `/Dlna/{UuId}/description.xml` | getDlnaByUuidDescriptionXml | Gets dlna server info |
| HEAD | `/Dlna/{UuId}/description.xml` | headDlnaByUuidDescriptionXml | Gets dlna server info |
| GET | `/Dlna/{UuId}/icons/{Filename}` | getDlnaByUuidIconsByFilename | Gets a server icon |
| GET | `/Dlna/icons/{Filename}` | getDlnaIconsByFilename | Gets a server icon |

---

## getDlnaByUuidConnectionmanagerConnectionmanager

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/connectionmanager/connectionmanager

**Method：** GET

**接口描述：** Gets dlna connection manager xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## headDlnaByUuidConnectionmanagerConnectionmanager

### 基本信息
**Path：** HEAD 服务器地址 + /Dlna/{UuId}/connectionmanager/connectionmanager

**Method：** HEAD

**接口描述：** Gets dlna connection manager xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaByUuidConnectionmanagerConnectionmanagerXml

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/connectionmanager/connectionmanager.xml

**Method：** GET

**接口描述：** Gets dlna connection manager xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## headDlnaByUuidConnectionmanagerConnectionmanagerXml

### 基本信息
**Path：** HEAD 服务器地址 + /Dlna/{UuId}/connectionmanager/connectionmanager.xml

**Method：** HEAD

**接口描述：** Gets dlna connection manager xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postDlnaByUuidConnectionmanagerControl

### 基本信息
**Path：** POST 服务器地址 + /Dlna/{UuId}/connectionmanager/control

**Method：** POST

**接口描述：** Processes a control request

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaByUuidContentdirectoryContentdirectory

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/contentdirectory/contentdirectory

**Method：** GET

**接口描述：** Gets dlna content directory xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## headDlnaByUuidContentdirectoryContentdirectory

### 基本信息
**Path：** HEAD 服务器地址 + /Dlna/{UuId}/contentdirectory/contentdirectory

**Method：** HEAD

**接口描述：** Gets dlna content directory xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaByUuidContentdirectoryContentdirectoryXml

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/contentdirectory/contentdirectory.xml

**Method：** GET

**接口描述：** Gets dlna content directory xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## headDlnaByUuidContentdirectoryContentdirectoryXml

### 基本信息
**Path：** HEAD 服务器地址 + /Dlna/{UuId}/contentdirectory/contentdirectory.xml

**Method：** HEAD

**接口描述：** Gets dlna content directory xml

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postDlnaByUuidContentdirectoryControl

### 基本信息
**Path：** POST 服务器地址 + /Dlna/{UuId}/contentdirectory/control

**Method：** POST

**接口描述：** Processes a control request

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaByUuidDescription

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/description

**Method：** GET

**接口描述：** Gets dlna server info

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## headDlnaByUuidDescription

### 基本信息
**Path：** HEAD 服务器地址 + /Dlna/{UuId}/description

**Method：** HEAD

**接口描述：** Gets dlna server info

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaByUuidDescriptionXml

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/description.xml

**Method：** GET

**接口描述：** Gets dlna server info

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## headDlnaByUuidDescriptionXml

### 基本信息
**Path：** HEAD 服务器地址 + /Dlna/{UuId}/description.xml

**Method：** HEAD

**接口描述：** Gets dlna server info

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaByUuidIconsByFilename

### 基本信息
**Path：** GET 服务器地址 + /Dlna/{UuId}/icons/{Filename}

**Method：** GET

**接口描述：** Gets a server icon

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 是 | string |  | Server UuId |
| Filename | 是 | string |  | The icon filename |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getDlnaIconsByFilename

### 基本信息
**Path：** GET 服务器地址 + /Dlna/icons/{Filename}

**Method：** GET

**接口描述：** Gets a server icon

**认证要求：** 无需认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Filename | 是 | string |  | The icon filename |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UuId | 否 | string |  | Server UuId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Response content unknown. |  |
| 400 |  |  |
| 404 |  |  |
| 500 |  |  |

---

