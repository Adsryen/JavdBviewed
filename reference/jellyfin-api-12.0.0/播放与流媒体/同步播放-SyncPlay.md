# 同步播放（SyncPlay）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：播放与流媒体
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：22

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/SyncPlay/{id}` | SyncPlayGetGroup | Gets a SyncPlay group by id. |
| POST | `/SyncPlay/Buffering` | SyncPlayBuffering | Notify SyncPlay group that member is buffering. |
| POST | `/SyncPlay/Join` | SyncPlayJoinGroup | Join an existing SyncPlay group. |
| POST | `/SyncPlay/Leave` | SyncPlayLeaveGroup | Leave the joined SyncPlay group. |
| GET | `/SyncPlay/List` | SyncPlayGetGroups | Gets all SyncPlay groups. |
| POST | `/SyncPlay/MovePlaylistItem` | SyncPlayMovePlaylistItem | Request to move an item in the playlist in SyncPlay group. |
| POST | `/SyncPlay/New` | SyncPlayCreateGroup | Create a new SyncPlay group. |
| POST | `/SyncPlay/NextItem` | SyncPlayNextItem | Request next item in SyncPlay group. |
| POST | `/SyncPlay/Pause` | SyncPlayPause | Request pause in SyncPlay group. |
| POST | `/SyncPlay/Ping` | SyncPlayPing | Update session ping. |
| POST | `/SyncPlay/PreviousItem` | SyncPlayPreviousItem | Request previous item in SyncPlay group. |
| POST | `/SyncPlay/Queue` | SyncPlayQueue | Request to queue items to the playlist of a SyncPlay group. |
| POST | `/SyncPlay/Ready` | SyncPlayReady | Notify SyncPlay group that member is ready for playback. |
| POST | `/SyncPlay/RemoveFromPlaylist` | SyncPlayRemoveFromPlaylist | Request to remove items from the playlist in SyncPlay group. |
| POST | `/SyncPlay/Seek` | SyncPlaySeek | Request seek in SyncPlay group. |
| POST | `/SyncPlay/SetIgnoreWait` | SyncPlaySetIgnoreWait | Request SyncPlay group to ignore member during group-wait. |
| POST | `/SyncPlay/SetNewQueue` | SyncPlaySetNewQueue | Request to set new playlist in SyncPlay group. |
| POST | `/SyncPlay/SetPlaylistItem` | SyncPlaySetPlaylistItem | Request to change playlist item in SyncPlay group. |
| POST | `/SyncPlay/SetRepeatMode` | SyncPlaySetRepeatMode | Request to set repeat mode in SyncPlay group. |
| POST | `/SyncPlay/SetShuffleMode` | SyncPlaySetShuffleMode | Request to set shuffle mode in SyncPlay group. |
| POST | `/SyncPlay/Stop` | SyncPlayStop | Request stop in SyncPlay group. |
| POST | `/SyncPlay/Unpause` | SyncPlayUnpause | Request unpause in SyncPlay group. |

---

## SyncPlayGetGroup

### 基本信息
**Path：** GET 服务器地址 + /SyncPlay/{id}

**Method：** GET

**接口描述：** Gets a SyncPlay group by id.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| id | 是 | string |  | The id of the group. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Group returned. | GroupInfoDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（GroupInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |


**200 字段说明（GroupInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |


**200 字段说明（GroupInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |


---

## SyncPlayBuffering

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Buffering

**Method：** POST

**接口描述：** Notify SyncPlay group that member is buffering.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The player status.
- Content-Type：`application/json`
- Schema：`BufferRequestDto`
- Content-Type：`text/json`
- Schema：`BufferRequestDto`
- Content-Type：`application/*+json`
- Schema：`BufferRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Group state update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayJoinGroup

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Join

**Method：** POST

**接口描述：** Join an existing SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The group to join.
- Content-Type：`application/json`
- Schema：`JoinGroupRequestDto`
- Content-Type：`text/json`
- Schema：`JoinGroupRequestDto`
- Content-Type：`application/*+json`
- Schema：`JoinGroupRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Group join successful. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayLeaveGroup

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Leave

**Method：** POST

**接口描述：** Leave the joined SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Group leave successful. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayGetGroups

### 基本信息
**Path：** GET 服务器地址 + /SyncPlay/List

**Method：** GET

**接口描述：** Gets all SyncPlay groups.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Groups returned. | GroupInfoDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayMovePlaylistItem

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/MovePlaylistItem

**Method：** POST

**接口描述：** Request to move an item in the playlist in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new position for the item.
- Content-Type：`application/json`
- Schema：`MovePlaylistItemRequestDto`
- Content-Type：`text/json`
- Schema：`MovePlaylistItemRequestDto`
- Content-Type：`application/*+json`
- Schema：`MovePlaylistItemRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayCreateGroup

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/New

**Method：** POST

**接口描述：** Create a new SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The settings of the new group.
- Content-Type：`application/json`
- Schema：`NewGroupRequestDto`
- Content-Type：`text/json`
- Schema：`NewGroupRequestDto`
- Content-Type：`application/*+json`
- Schema：`NewGroupRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | OK | GroupInfoDto |
| 204 | New group created. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（GroupInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |


**200 字段说明（GroupInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |


**200 字段说明（GroupInfoDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| GroupId | string | Gets the group identifier. |
| GroupName | string | Gets the group name. |
| State | string enum(Idle|Waiting|Paused|Playing) | Gets the group state. |
| Participants | string[] | Gets the participants. |
| LastUpdatedAt | string | Gets the date when this DTO has been created. |


---

## SyncPlayNextItem

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/NextItem

**Method：** POST

**接口描述：** Request next item in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The current item information.
- Content-Type：`application/json`
- Schema：`NextItemRequestDto`
- Content-Type：`text/json`
- Schema：`NextItemRequestDto`
- Content-Type：`application/*+json`
- Schema：`NextItemRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Next item update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayPause

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Pause

**Method：** POST

**接口描述：** Request pause in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Pause update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayPing

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Ping

**Method：** POST

**接口描述：** Update session ping.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new ping.
- Content-Type：`application/json`
- Schema：`PingRequestDto`
- Content-Type：`text/json`
- Schema：`PingRequestDto`
- Content-Type：`application/*+json`
- Schema：`PingRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Ping updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayPreviousItem

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/PreviousItem

**Method：** POST

**接口描述：** Request previous item in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The current item information.
- Content-Type：`application/json`
- Schema：`PreviousItemRequestDto`
- Content-Type：`text/json`
- Schema：`PreviousItemRequestDto`
- Content-Type：`application/*+json`
- Schema：`PreviousItemRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Previous item update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayQueue

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Queue

**Method：** POST

**接口描述：** Request to queue items to the playlist of a SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The items to add.
- Content-Type：`application/json`
- Schema：`QueueRequestDto`
- Content-Type：`text/json`
- Schema：`QueueRequestDto`
- Content-Type：`application/*+json`
- Schema：`QueueRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayReady

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Ready

**Method：** POST

**接口描述：** Notify SyncPlay group that member is ready for playback.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The player status.
- Content-Type：`application/json`
- Schema：`ReadyRequestDto`
- Content-Type：`text/json`
- Schema：`ReadyRequestDto`
- Content-Type：`application/*+json`
- Schema：`ReadyRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Group state update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayRemoveFromPlaylist

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/RemoveFromPlaylist

**Method：** POST

**接口描述：** Request to remove items from the playlist in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The items to remove.
- Content-Type：`application/json`
- Schema：`RemoveFromPlaylistRequestDto`
- Content-Type：`text/json`
- Schema：`RemoveFromPlaylistRequestDto`
- Content-Type：`application/*+json`
- Schema：`RemoveFromPlaylistRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlaySeek

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Seek

**Method：** POST

**接口描述：** Request seek in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new playback position.
- Content-Type：`application/json`
- Schema：`SeekRequestDto`
- Content-Type：`text/json`
- Schema：`SeekRequestDto`
- Content-Type：`application/*+json`
- Schema：`SeekRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Seek update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlaySetIgnoreWait

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/SetIgnoreWait

**Method：** POST

**接口描述：** Request SyncPlay group to ignore member during group-wait.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The settings to set.
- Content-Type：`application/json`
- Schema：`IgnoreWaitRequestDto`
- Content-Type：`text/json`
- Schema：`IgnoreWaitRequestDto`
- Content-Type：`application/*+json`
- Schema：`IgnoreWaitRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Member state updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlaySetNewQueue

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/SetNewQueue

**Method：** POST

**接口描述：** Request to set new playlist in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new playlist to play in the group.
- Content-Type：`application/json`
- Schema：`PlayRequestDto`
- Content-Type：`text/json`
- Schema：`PlayRequestDto`
- Content-Type：`application/*+json`
- Schema：`PlayRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlaySetPlaylistItem

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/SetPlaylistItem

**Method：** POST

**接口描述：** Request to change playlist item in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new item to play.
- Content-Type：`application/json`
- Schema：`SetPlaylistItemRequestDto`
- Content-Type：`text/json`
- Schema：`SetPlaylistItemRequestDto`
- Content-Type：`application/*+json`
- Schema：`SetPlaylistItemRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlaySetRepeatMode

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/SetRepeatMode

**Method：** POST

**接口描述：** Request to set repeat mode in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new repeat mode.
- Content-Type：`application/json`
- Schema：`SetRepeatModeRequestDto`
- Content-Type：`text/json`
- Schema：`SetRepeatModeRequestDto`
- Content-Type：`application/*+json`
- Schema：`SetRepeatModeRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Play queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlaySetShuffleMode

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/SetShuffleMode

**Method：** POST

**接口描述：** Request to set shuffle mode in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The new shuffle mode.
- Content-Type：`application/json`
- Schema：`SetShuffleModeRequestDto`
- Content-Type：`text/json`
- Schema：`SetShuffleModeRequestDto`
- Content-Type：`application/*+json`
- Schema：`SetShuffleModeRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Play queue update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayStop

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Stop

**Method：** POST

**接口描述：** Request stop in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Stop update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SyncPlayUnpause

### 基本信息
**Path：** POST 服务器地址 + /SyncPlay/Unpause

**Method：** POST

**接口描述：** Request unpause in SyncPlay group.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Unpause update sent to all group members. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

