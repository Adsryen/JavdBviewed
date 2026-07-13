# 同步（SyncService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：播放列表与同步
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：25

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/Sync/{ItemId}/Status` | postSyncByItemidStatus | Gets sync status for an item. |
| DELETE | `/Sync/{TargetId}/Items` | deleteSyncByTargetidItems | Cancels items from a sync target |
| POST | `/Sync/{TargetId}/Items/Delete` | postSyncByTargetidItemsDelete | Cancels items from a sync target |
| POST | `/Sync/Data` | postSyncData | Syncs data between device and server |
| POST | `/Sync/Items/Cancel` | postSyncItemsCancel | Cancels items from a sync target |
| GET | `/Sync/Items/Ready` | getSyncItemsReady | Gets ready to download sync items. |
| GET | `/Sync/JobItems` | getSyncJobitems | Gets sync job items. |
| DELETE | `/Sync/JobItems/{Id}` | deleteSyncJobitemsById | Cancels a sync job item |
| GET | `/Sync/JobItems/{Id}/AdditionalFiles` | getSyncJobitemsByIdAdditionalfiles | Gets a sync job item file |
| POST | `/Sync/JobItems/{Id}/Delete` | postSyncJobitemsByIdDelete | Cancels a sync job item |
| POST | `/Sync/JobItems/{Id}/Enable` | postSyncJobitemsByIdEnable | Enables a cancelled or queued sync job item |
| GET | `/Sync/JobItems/{Id}/File` | getSyncJobitemsByIdFile | Gets a sync job item file |
| HEAD | `/Sync/JobItems/{Id}/File` | headSyncJobitemsByIdFile | Gets a sync job item file |
| POST | `/Sync/JobItems/{Id}/MarkForRemoval` | postSyncJobitemsByIdMarkforremoval | Marks a job item for removal |
| POST | `/Sync/JobItems/{Id}/Transferred` | postSyncJobitemsByIdTransferred | Reports that a sync job item has successfully been transferred. |
| POST | `/Sync/JobItems/{Id}/UnmarkForRemoval` | postSyncJobitemsByIdUnmarkforremoval | Unmarks a job item for removal |
| GET | `/Sync/Jobs` | getSyncJobs | Gets sync jobs. |
| POST | `/Sync/Jobs` | postSyncJobs | Gets sync jobs. |
| DELETE | `/Sync/Jobs/{Id}` | deleteSyncJobsById | Cancels a sync job. |
| GET | `/Sync/Jobs/{Id}` | getSyncJobsById | Gets a sync job. |
| POST | `/Sync/Jobs/{Id}` | postSyncJobsById | Updates a sync job. |
| POST | `/Sync/Jobs/{Id}/Delete` | postSyncJobsByIdDelete | Cancels a sync job. |
| POST | `/Sync/OfflineActions` | postSyncOfflineactions | Reports an action that occurred while offline. |
| GET | `/Sync/Options` | getSyncOptions | Gets a list of available sync targets. |
| GET | `/Sync/Targets` | getSyncTargets | Gets a list of available sync targets. |

---

## postSyncByItemidStatus

### 基本信息
**Path：** POST 服务器地址 + /Sync/{ItemId}/Status

**Method：** POST

**接口描述：** Gets sync status for an item.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemId | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：SyncedItemProgress:
- Content-Type：`application/json`
- Schema：`SyncedItemProgress`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Progress | number|null |  |
| Status | SyncJobItemStatus |  |

- Content-Type：`application/xml`
- Schema：`SyncedItemProgress`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Progress | number|null |  |
| Status | SyncJobItemStatus |  |



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

## deleteSyncByTargetidItems

### 基本信息
**Path：** DELETE 服务器地址 + /Sync/{TargetId}/Items

**Method：** DELETE

**接口描述：** Cancels items from a sync target

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| TargetId | 是 | string |  | TargetId |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemIds | 否 | string |  | ItemIds |


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

## postSyncByTargetidItemsDelete

### 基本信息
**Path：** POST 服务器地址 + /Sync/{TargetId}/Items/Delete

**Method：** POST

**接口描述：** Cancels items from a sync target

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| TargetId | 是 | string |  | TargetId |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemIds | 否 | string |  | ItemIds |


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

## postSyncData

### 基本信息
**Path：** POST 服务器地址 + /Sync/Data

**Method：** POST

**接口描述：** Syncs data between device and server

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| TargetId | 是 | string |  | TargetId |


**Body**

- 是否必须：是
- 描述：SyncDataRequest:
- Content-Type：`application/json`
- Schema：`SyncDataRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LocalItemIds | string[] |  |
| InternalTargetIds | integer[] |  |

- Content-Type：`application/xml`
- Schema：`SyncDataRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| LocalItemIds | string[] |  |
| InternalTargetIds | integer[] |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SyncDataResponse object. | SyncDataResponse |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（SyncDataResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemIdsToRemove | string[] |  |


**200 字段说明（SyncDataResponse）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ItemIdsToRemove | string[] |  |


---

## postSyncItemsCancel

### 基本信息
**Path：** POST 服务器地址 + /Sync/Items/Cancel

**Method：** POST

**接口描述：** Cancels items from a sync target

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| ItemIds | 否 | string |  | ItemIds |


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

## getSyncItemsReady

### 基本信息
**Path：** GET 服务器地址 + /Sync/Items/Ready

**Method：** GET

**接口描述：** Gets ready to download sync items.

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| TargetId | 是 | string |  | TargetId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<SyncedItem> object. | SyncedItem[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getSyncJobitems

### 基本信息
**Path：** GET 服务器地址 + /Sync/JobItems

**Method：** GET

**接口描述：** Gets sync job items.

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| TargetId | 是 | string |  | TargetId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<SyncJobItem> object. | QueryResult_SyncJobItem |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_SyncJobItem）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SyncJobItem[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_SyncJobItem）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SyncJobItem[] |  |
| TotalRecordCount | integer |  |


---

## deleteSyncJobitemsById

### 基本信息
**Path：** DELETE 服务器地址 + /Sync/JobItems/{Id}

**Method：** DELETE

**接口描述：** Cancels a sync job item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## getSyncJobitemsByIdAdditionalfiles

### 基本信息
**Path：** GET 服务器地址 + /Sync/JobItems/{Id}/AdditionalFiles

**Method：** GET

**接口描述：** Gets a sync job item file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Name |


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

## postSyncJobitemsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Sync/JobItems/{Id}/Delete

**Method：** POST

**接口描述：** Cancels a sync job item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## postSyncJobitemsByIdEnable

### 基本信息
**Path：** POST 服务器地址 + /Sync/JobItems/{Id}/Enable

**Method：** POST

**接口描述：** Enables a cancelled or queued sync job item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## getSyncJobitemsByIdFile

### 基本信息
**Path：** GET 服务器地址 + /Sync/JobItems/{Id}/File

**Method：** GET

**接口描述：** Gets a sync job item file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## headSyncJobitemsByIdFile

### 基本信息
**Path：** HEAD 服务器地址 + /Sync/JobItems/{Id}/File

**Method：** HEAD

**接口描述：** Gets a sync job item file

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## postSyncJobitemsByIdMarkforremoval

### 基本信息
**Path：** POST 服务器地址 + /Sync/JobItems/{Id}/MarkForRemoval

**Method：** POST

**接口描述：** Marks a job item for removal

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## postSyncJobitemsByIdTransferred

### 基本信息
**Path：** POST 服务器地址 + /Sync/JobItems/{Id}/Transferred

**Method：** POST

**接口描述：** Reports that a sync job item has successfully been transferred.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## postSyncJobitemsByIdUnmarkforremoval

### 基本信息
**Path：** POST 服务器地址 + /Sync/JobItems/{Id}/UnmarkForRemoval

**Method：** POST

**接口描述：** Unmarks a job item for removal

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## getSyncJobs

### 基本信息
**Path：** GET 服务器地址 + /Sync/Jobs

**Method：** GET

**接口描述：** Gets sync jobs.

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a QueryResult<SyncJob> object. | QueryResult_SyncJob |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（QueryResult_SyncJob）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SyncJob[] |  |
| TotalRecordCount | integer |  |


**200 字段说明（QueryResult_SyncJob）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Items | SyncJob[] |  |
| TotalRecordCount | integer |  |


---

## postSyncJobs

### 基本信息
**Path：** POST 服务器地址 + /Sync/Jobs

**Method：** POST

**接口描述：** Gets sync jobs.

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：SyncJobRequest:
- Content-Type：`application/json`
- Schema：`SyncJobRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TargetId | string |  |
| ItemIds | string[] |  |
| Category | SyncCategory |  |
| ParentId | string |  |
| Quality | string |  |
| Profile | string |  |
| Container | string |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| Name | string |  |
| UserId | string |  |
| UnwatchedOnly | boolean |  |
| SyncNewContent | boolean |  |
| ItemLimit | integer|null |  |
| Bitrate | integer|null |  |
| Downloaded | boolean |  |

- Content-Type：`application/xml`
- Schema：`SyncJobRequest`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| TargetId | string |  |
| ItemIds | string[] |  |
| Category | SyncCategory |  |
| ParentId | string |  |
| Quality | string |  |
| Profile | string |  |
| Container | string |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| Name | string |  |
| UserId | string |  |
| UnwatchedOnly | boolean |  |
| SyncNewContent | boolean |  |
| ItemLimit | integer|null |  |
| Bitrate | integer|null |  |
| Downloaded | boolean |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SyncJobCreationResult object. | SyncJobCreationResult |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（SyncJobCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Job | SyncJob |  |
| JobItems | SyncJobItem[] |  |


**200 字段说明（SyncJobCreationResult）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Job | SyncJob |  |
| JobItems | SyncJobItem[] |  |


---

## deleteSyncJobsById

### 基本信息
**Path：** DELETE 服务器地址 + /Sync/Jobs/{Id}

**Method：** DELETE

**接口描述：** Cancels a sync job.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## getSyncJobsById

### 基本信息
**Path：** GET 服务器地址 + /Sync/Jobs/{Id}

**Method：** GET

**接口描述：** Gets a sync job.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SyncJob object. | SyncJob |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（SyncJob）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer |  |
| TargetId | string |  |
| InternalTargetId | integer |  |
| TargetName | string |  |
| Quality | string |  |
| Bitrate | integer|null |  |
| Container | string |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| Profile | string |  |
| Category | SyncCategory |  |
| ParentId | integer |  |
| Progress | number |  |
| Name | string |  |
| Status | SyncJobStatus |  |
| UserId | integer |  |
| UnwatchedOnly | boolean |  |
| SyncNewContent | boolean |  |
| ItemLimit | integer|null |  |
| RequestedItemIds | integer[] |  |
| ItemId | integer |  |
| DateCreated | string |  |
| DateLastModified | string |  |
| ItemCount | integer |  |
| ParentName | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |


**200 字段说明（SyncJob）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer |  |
| TargetId | string |  |
| InternalTargetId | integer |  |
| TargetName | string |  |
| Quality | string |  |
| Bitrate | integer|null |  |
| Container | string |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| Profile | string |  |
| Category | SyncCategory |  |
| ParentId | integer |  |
| Progress | number |  |
| Name | string |  |
| Status | SyncJobStatus |  |
| UserId | integer |  |
| UnwatchedOnly | boolean |  |
| SyncNewContent | boolean |  |
| ItemLimit | integer|null |  |
| RequestedItemIds | integer[] |  |
| ItemId | integer |  |
| DateCreated | string |  |
| DateLastModified | string |  |
| ItemCount | integer |  |
| ParentName | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |


---

## postSyncJobsById

### 基本信息
**Path：** POST 服务器地址 + /Sync/Jobs/{Id}

**Method：** POST

**接口描述：** Updates a sync job.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | integer |  |  |


**Body**

- 是否必须：是
- 描述：SyncJob:
- Content-Type：`application/json`
- Schema：`SyncJob`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer |  |
| TargetId | string |  |
| InternalTargetId | integer |  |
| TargetName | string |  |
| Quality | string |  |
| Bitrate | integer|null |  |
| Container | string |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| Profile | string |  |
| Category | SyncCategory |  |
| ParentId | integer |  |
| Progress | number |  |
| Name | string |  |
| Status | SyncJobStatus |  |
| UserId | integer |  |
| UnwatchedOnly | boolean |  |
| SyncNewContent | boolean |  |
| ItemLimit | integer|null |  |
| RequestedItemIds | integer[] |  |
| ItemId | integer |  |
| DateCreated | string |  |
| DateLastModified | string |  |
| ItemCount | integer |  |
| ParentName | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |

- Content-Type：`application/xml`
- Schema：`SyncJob`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | integer |  |
| TargetId | string |  |
| InternalTargetId | integer |  |
| TargetName | string |  |
| Quality | string |  |
| Bitrate | integer|null |  |
| Container | string |  |
| VideoCodec | string |  |
| AudioCodec | string |  |
| Profile | string |  |
| Category | SyncCategory |  |
| ParentId | integer |  |
| Progress | number |  |
| Name | string |  |
| Status | SyncJobStatus |  |
| UserId | integer |  |
| UnwatchedOnly | boolean |  |
| SyncNewContent | boolean |  |
| ItemLimit | integer|null |  |
| RequestedItemIds | integer[] |  |
| ItemId | integer |  |
| DateCreated | string |  |
| DateLastModified | string |  |
| ItemCount | integer |  |
| ParentName | string |  |
| PrimaryImageItemId | string |  |
| PrimaryImageTag | string |  |



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

## postSyncJobsByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Sync/Jobs/{Id}/Delete

**Method：** POST

**接口描述：** Cancels a sync job.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Id |


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

## postSyncOfflineactions

### 基本信息
**Path：** POST 服务器地址 + /Sync/OfflineActions

**Method：** POST

**接口描述：** Reports an action that occurred while offline.

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：List`1:
- Content-Type：`application/json`
- Schema：`UserAction[]`
- Content-Type：`application/xml`
- Schema：`UserAction[]`


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

## getSyncOptions

### 基本信息
**Path：** GET 服务器地址 + /Sync/Options

**Method：** GET

**接口描述：** Gets a list of available sync targets.

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | UserId |
| ItemIds | 否 | string |  | ItemIds |
| ParentId | 否 | string |  | ParentId |
| TargetId | 否 | string |  | TargetId |
| Category | 否 | SyncCategory |  | Category |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a SyncDialogOptions object. | SyncDialogOptions |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（SyncDialogOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Targets | SyncTarget[] |  |
| Options | SyncJobOption[] |  |
| QualityOptions | SyncQualityOption[] |  |
| ProfileOptions | SyncProfileOption[] |  |


**200 字段说明（SyncDialogOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Targets | SyncTarget[] |  |
| Options | SyncJobOption[] |  |
| QualityOptions | SyncQualityOption[] |  |
| ProfileOptions | SyncProfileOption[] |  |


---

## getSyncTargets

### 基本信息
**Path：** GET 服务器地址 + /Sync/Targets

**Method：** GET

**接口描述：** Gets a list of available sync targets.

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | UserId |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<SyncTarget> object. | SyncTarget[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

