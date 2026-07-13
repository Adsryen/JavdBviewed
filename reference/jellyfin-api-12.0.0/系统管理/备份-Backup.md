# 备份（Backup）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Backup` | ListBackups | Gets a list of all currently present backups in the backup directory. |
| POST | `/Backup/Create` | CreateBackup | Creates a new Backup. |
| GET | `/Backup/Manifest` | GetBackup | Gets the descriptor from an existing archive is present. |
| POST | `/Backup/Restore` | StartRestoreBackup | Restores to a backup by restarting the server and applying the backup. |

---

## ListBackups

### 基本信息
**Path：** GET 服务器地址 + /Backup

**Method：** GET

**接口描述：** Gets a list of all currently present backups in the backup directory.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Backups available. | BackupManifestDto[] |
| 401 | Unauthorized |  |
| 403 | User does not have permission to retrieve information. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## CreateBackup

### 基本信息
**Path：** POST 服务器地址 + /Backup/Create

**Method：** POST

**接口描述：** Creates a new Backup.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- 描述：The backup options.
- Content-Type：`application/json`
- Schema：`BackupOptionsDto`
- Content-Type：`text/json`
- Schema：`BackupOptionsDto`
- Content-Type：`application/*+json`
- Schema：`BackupOptionsDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Backup created. | BackupManifestDto |
| 401 | Unauthorized |  |
| 403 | User does not have permission to retrieve information. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BackupManifestDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |


**200 字段说明（BackupManifestDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |


**200 字段说明（BackupManifestDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |


---

## GetBackup

### 基本信息
**Path：** GET 服务器地址 + /Backup/Manifest

**Method：** GET

**接口描述：** Gets the descriptor from an existing archive is present.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| path | 是 | string |  | The data to start a restore process. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Backup archive manifest. | BackupManifestDto |
| 204 | Not a valid jellyfin Archive. |  |
| 401 | Unauthorized |  |
| 403 | User does not have permission to retrieve information. | ProblemDetails |
| 404 | Not a valid path. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BackupManifestDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |


**200 字段说明（BackupManifestDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |


**200 字段说明（BackupManifestDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ServerVersion | string | Gets or sets the jellyfin version this backup was created with. |
| BackupEngineVersion | string | Gets or sets the backup engine version this backup was created with. |
| DateCreated | string | Gets or sets the date this backup was created with. |
| Path | string | Gets or sets the path to the backup on the system. |
| Options | BackupOptionsDto | Gets or sets the contents of the backup archive. |


---

## StartRestoreBackup

### 基本信息
**Path：** POST 服务器地址 + /Backup/Restore

**Method：** POST

**接口描述：** Restores to a backup by restarting the server and applying the backup.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The data to start a restore process.
- Content-Type：`application/json`
- Schema：`BackupRestoreRequestDto`
- Content-Type：`text/json`
- Schema：`BackupRestoreRequestDto`
- Content-Type：`application/*+json`
- Schema：`BackupRestoreRequestDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Backup restore started. |  |
| 401 | Unauthorized |  |
| 403 | User does not have permission to retrieve information. | ProblemDetails |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

