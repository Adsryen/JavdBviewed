# 备份（BackupApi）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/BackupRestore/BackupInfo` | getBackuprestoreBackupinfo |  |
| POST | `/BackupRestore/Restore` | postBackuprestoreRestore |  |
| POST | `/BackupRestore/RestoreData` | postBackuprestoreRestoredata |  |

---

## getBackuprestoreBackupinfo

### 基本信息
**Path：** GET 服务器地址 + /BackupRestore/BackupInfo

**Method：** GET

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a AllBackupsInfo object. | MBBackup.Api.AllBackupsInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（MBBackup.Api.AllBackupsInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| FullBackupInfo | MBBackup.BackupInfo |  |
| LightBackups | MBBackup.BackupInfo[] |  |


**200 字段说明（MBBackup.Api.AllBackupsInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| FullBackupInfo | MBBackup.BackupInfo |  |
| LightBackups | MBBackup.BackupInfo[] |  |


---

## postBackuprestoreRestore

### 基本信息
**Path：** POST 服务器地址 + /BackupRestore/Restore

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RestoreOptions:
- Content-Type：`application/json`
- Schema：`MBBackup.Api.RestoreOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| RestoreServerId | boolean |  |
| UseFiles | string |  |

- Content-Type：`application/xml`
- Schema：`MBBackup.Api.RestoreOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| RestoreServerId | boolean |  |
| UseFiles | string |  |



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

## postBackuprestoreRestoredata

### 基本信息
**Path：** POST 服务器地址 + /BackupRestore/RestoreData

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：DataRestoreOptions:
- Content-Type：`application/json`
- Schema：`MBBackup.Api.DataRestoreOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Users | MBBackup.Api.UserRestoreInfo[] |  |

- Content-Type：`application/xml`
- Schema：`MBBackup.Api.DataRestoreOptions`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Users | MBBackup.Api.UserRestoreInfo[] |  |



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

