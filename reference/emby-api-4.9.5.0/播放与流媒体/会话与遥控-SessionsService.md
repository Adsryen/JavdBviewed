# 会话与遥控（SessionsService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放与流媒体
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：20

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Auth/Keys` | getAuthKeys |  |
| POST | `/Auth/Keys` | postAuthKeys |  |
| DELETE | `/Auth/Keys/{Key}` | deleteAuthKeysByKey |  |
| POST | `/Auth/Keys/{Key}/Delete` | postAuthKeysByKeyDelete |  |
| GET | `/Auth/Providers` | getAuthProviders |  |
| GET | `/Sessions` | getSessions | Gets a list of sessions |
| POST | `/Sessions/{Id}/Command` | postSessionsByIdCommand | Issues a system command to a client |
| POST | `/Sessions/{Id}/Command/{Command}` | postSessionsByIdCommandByCommand | Issues a system command to a client |
| POST | `/Sessions/{Id}/Message` | postSessionsByIdMessage | Issues a command to a client to display a message to the user |
| POST | `/Sessions/{Id}/Playing` | postSessionsByIdPlaying | Instructs a session to play an item |
| POST | `/Sessions/{Id}/Playing/{Command}` | postSessionsByIdPlayingByCommand | Issues a playstate command to a client |
| POST | `/Sessions/{Id}/System/{Command}` | postSessionsByIdSystemByCommand | Issues a system command to a client |
| DELETE | `/Sessions/{Id}/Users/{UserId}` | deleteSessionsByIdUsersByUserid | Removes an additional user from a session |
| POST | `/Sessions/{Id}/Users/{UserId}` | postSessionsByIdUsersByUserid | Adds an additional user to a session |
| POST | `/Sessions/{Id}/Users/{UserId}/Delete` | postSessionsByIdUsersByUseridDelete | Removes an additional user from a session |
| POST | `/Sessions/{Id}/Viewing` | postSessionsByIdViewing | Instructs a session to browse to an item or view |
| POST | `/Sessions/Capabilities` | postSessionsCapabilities | Updates capabilities for a device |
| POST | `/Sessions/Capabilities/Full` | postSessionsCapabilitiesFull | Updates capabilities for a device |
| POST | `/Sessions/Logout` | postSessionsLogout | Reports that a session has ended |
| GET | `/Sessions/PlayQueue` | getSessionsPlayqueue | Gets a the current play queue from a session |

---

## getAuthKeys

### 基本信息
**Path：** GET 服务器地址 + /Auth/Keys

**Method：** GET

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| StartIndex | 否 | integer |  | Optional. The record index to start at. All items with a lower index will be dropped from the results. |
| Limit | 否 | integer|null |  | Optional. The maximum number of records to return |


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

## postAuthKeys

### 基本信息
**Path：** POST 服务器地址 + /Auth/Keys

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| App | 是 | string |  | App |


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

## deleteAuthKeysByKey

### 基本信息
**Path：** DELETE 服务器地址 + /Auth/Keys/{Key}

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Key | 是 | string |  | Auth Key |


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

## postAuthKeysByKeyDelete

### 基本信息
**Path：** POST 服务器地址 + /Auth/Keys/{Key}/Delete

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Key | 是 | string |  | Auth Key |


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

## getAuthProviders

### 基本信息
**Path：** GET 服务器地址 + /Auth/Providers

**Method：** GET

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a NameIdPair[] object. | NameIdPair[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getSessions

### 基本信息
**Path：** GET 服务器地址 + /Sessions

**Method：** GET

**接口描述：** Gets a list of sessions

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ControllableByUserId | 否 | string |  | Optional. Filter by sessions that a given user is allowed to remote control. |
| DeviceId | 否 | string |  | Optional. Filter by device id. |
| Id | 否 | string |  | Optional. Filter by session id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SessionInfo[] object. | Session.SessionInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postSessionsByIdCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Command

**Method：** POST

**接口描述：** Issues a system command to a client

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |


**Body**

- 是否必须：是
- 描述：GeneralCommand:
- Content-Type：`application/json`
- Schema：`GeneralCommand`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ControllingUserId | string |  |
| Arguments | object |  |

- Content-Type：`application/xml`
- Schema：`GeneralCommand`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Name | string |  |
| ControllingUserId | string |  |
| Arguments | object |  |



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

## postSessionsByIdCommandByCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Command/{Command}

**Method：** POST

**接口描述：** Issues a system command to a client

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| Command | 是 | string |  | The command to send. |


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

## postSessionsByIdMessage

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Message

**Method：** POST

**接口描述：** Issues a command to a client to display a message to the user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Text | 是 | string |  | The message text. |
| Header | 是 | string |  | The message header. |
| TimeoutMs | 否 | integer|null |  | The message timeout. If omitted the user will have to confirm viewing the message. |


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

## postSessionsByIdPlaying

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Playing

**Method：** POST

**接口描述：** Instructs a session to play an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemIds | 是 | integer[] |  | The ids of the items to play, comma delimited |
| StartPositionTicks | 否 | integer|null |  | The starting position of the first item. |
| PlayCommand | 是 | PlayCommand |  | The type of play command to issue (PlayNow, PlayNext, PlayLast). Clients who have not yet implemented play next and play last may play now. |


**Body**

- 是否必须：是
- 描述：PlayRequest:
- Content-Type：`application/json`
- Schema：`PlayRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ControllingUserId | string |  |
| SubtitleStreamIndex | integer|null |  |
| AudioStreamIndex | integer|null |  |
| MediaSourceId | string |  |
| StartIndex | integer|null |  |

- Content-Type：`application/xml`
- Schema：`PlayRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| ControllingUserId | string |  |
| SubtitleStreamIndex | integer|null |  |
| AudioStreamIndex | integer|null |  |
| MediaSourceId | string |  |
| StartIndex | integer|null |  |



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

## postSessionsByIdPlayingByCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Playing/{Command}

**Method：** POST

**接口描述：** Issues a playstate command to a client

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| Command | 是 | PlaystateCommand |  |  |


**Body**

- 是否必须：是
- 描述：PlaystateRequest:
- Content-Type：`application/json`
- Schema：`PlaystateRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Command | PlaystateCommand |  |
| SeekPositionTicks | integer|null |  |
| ControllingUserId | string |  |

- Content-Type：`application/xml`
- Schema：`PlaystateRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Command | PlaystateCommand |  |
| SeekPositionTicks | integer|null |  |
| ControllingUserId | string |  |



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

## postSessionsByIdSystemByCommand

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/System/{Command}

**Method：** POST

**接口描述：** Issues a system command to a client

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| Command | 是 | string |  | The command to send. |


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

## deleteSessionsByIdUsersByUserid

### 基本信息
**Path：** DELETE 服务器地址 + /Sessions/{Id}/Users/{UserId}

**Method：** DELETE

**接口描述：** Removes an additional user from a session

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| UserId | 是 | string |  | UserId Id |


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

## postSessionsByIdUsersByUserid

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Users/{UserId}

**Method：** POST

**接口描述：** Adds an additional user to a session

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| UserId | 是 | string |  | UserId Id |


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

## postSessionsByIdUsersByUseridDelete

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Users/{UserId}/Delete

**Method：** POST

**接口描述：** Removes an additional user from a session

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| UserId | 是 | string |  | UserId Id |


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

## postSessionsByIdViewing

### 基本信息
**Path：** POST 服务器地址 + /Sessions/{Id}/Viewing

**Method：** POST

**接口描述：** Instructs a session to browse to an item or view

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemType | 是 | string |  | The type of item to browse to. |
| ItemId | 是 | string |  | The Id of the item. |
| ItemName | 是 | string |  | The name of the item. |


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

## postSessionsCapabilities

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Capabilities

**Method：** POST

**接口描述：** Updates capabilities for a device

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |
| PlayableMediaTypes | 否 | string |  | A list of playable media types, comma delimited. Audio, Video, Book, Game, Photo. |
| SupportedCommands | 否 | string |  | A list of supported remote control commands, comma delimited |
| SupportsMediaControl | 否 | boolean |  | Determines whether media can be played remotely. |
| SupportsSync | 否 | boolean |  | Determines whether sync is supported. |


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

## postSessionsCapabilitiesFull

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Capabilities/Full

**Method：** POST

**接口描述：** Updates capabilities for a device

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Session Id |


**Body**

- 是否必须：是
- 描述：ClientCapabilities:
- Content-Type：`application/json`
- Schema：`ClientCapabilities`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlayableMediaTypes | string[] |  |
| SupportedCommands | string[] |  |
| SupportsMediaControl | boolean |  |
| PushToken | string |  |
| PushTokenType | string |  |
| SupportsSync | boolean |  |
| DeviceProfile | DeviceProfile |  |
| IconUrl | string |  |
| AppId | string |  |

- Content-Type：`application/xml`
- Schema：`ClientCapabilities`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PlayableMediaTypes | string[] |  |
| SupportedCommands | string[] |  |
| SupportsMediaControl | boolean |  |
| PushToken | string |  |
| PushTokenType | string |  |
| SupportsSync | boolean |  |
| DeviceProfile | DeviceProfile |  |
| IconUrl | string |  |
| AppId | string |  |



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

## postSessionsLogout

### 基本信息
**Path：** POST 服务器地址 + /Sessions/Logout

**Method：** POST

**接口描述：** Reports that a session has ended

**官方文档：** [API Documentation: Authentication](https://dev.emby.media/doc/restapi/User-Authentication.html)

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

## getSessionsPlayqueue

### 基本信息
**Path：** GET 服务器地址 + /Sessions/PlayQueue

**Method：** GET

**接口描述：** Gets a the current play queue from a session

**官方文档：** [API Documentation: Item Information](https://dev.emby.media/doc/restapi/Item-Information.html)

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 否 | string |  | Optional. Filter by session id. |
| DeviceId | 否 | string |  | Optional. Filter by device id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<BaseItemDto> object. | QueryResult_BaseItemDto |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_BaseItemDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | BaseItemDto[] |  |
| TotalRecordCount | integer |  |


---

