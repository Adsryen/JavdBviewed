# 插件包（PackageService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Packages` | getPackages | Gets available packages |
| GET | `/Packages/{Name}` | getPackagesByName | Gets a package, by name or assembly guid |
| POST | `/Packages/Installed/{Name}` | postPackagesInstalledByName | Installs a package |
| DELETE | `/Packages/Installing/{Id}` | deletePackagesInstallingById | Cancels a package installation |
| POST | `/Packages/Installing/{Id}/Delete` | postPackagesInstallingByIdDelete | Cancels a package installation |
| GET | `/Packages/Updates` | getPackagesUpdates | Gets available package updates for currently installed packages |

---

## getPackages

### 基本信息
**Path：** GET 服务器地址 + /Packages

**Method：** GET

**接口描述：** Gets available packages

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| PackageType | 否 | string |  | Optional package type filter (System/UserInstalled) |
| TargetSystems | 否 | string |  | Optional. Filter by target system type. Allows multiple, comma delimited. |
| IsPremium | 否 | boolean|null |  | Optional. Filter by premium status |
| IsAdult | 否 | boolean|null |  | Optional. Filter by package that contain adult content. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PackageInfo[] object. | PackageInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getPackagesByName

### 基本信息
**Path：** GET 服务器地址 + /Packages/{Name}

**Method：** GET

**接口描述：** Gets a package, by name or assembly guid

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | The name of the package |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| AssemblyGuid | 否 | string |  | The guid of the associated assembly |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PackageInfo object. | PackageInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（PackageInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| id | string |  |
| name | string |  |
| shortDescription | string |  |
| overview | string |  |
| isPremium | boolean |  |
| adult | boolean |  |
| richDescUrl | string |  |
| thumbImage | string |  |
| previewImage | string |  |
| type | string |  |
| targetFilename | string |  |
| owner | string |  |
| category | string |  |
| tileColor | string |  |
| featureId | string |  |
| price | number|null |  |
| targetSystem | PackageTargetSystem |  |
| guid | string |  |
| isRegistered | boolean |  |
| expDate | string |  |
| versions | PackageVersionInfo[] |  |
| enableInAppStore | boolean |  |
| installs | integer |  |


**200 字段说明（PackageInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| id | string |  |
| name | string |  |
| shortDescription | string |  |
| overview | string |  |
| isPremium | boolean |  |
| adult | boolean |  |
| richDescUrl | string |  |
| thumbImage | string |  |
| previewImage | string |  |
| type | string |  |
| targetFilename | string |  |
| owner | string |  |
| category | string |  |
| tileColor | string |  |
| featureId | string |  |
| price | number|null |  |
| targetSystem | PackageTargetSystem |  |
| guid | string |  |
| isRegistered | boolean |  |
| expDate | string |  |
| versions | PackageVersionInfo[] |  |
| enableInAppStore | boolean |  |
| installs | integer |  |


---

## postPackagesInstalledByName

### 基本信息
**Path：** POST 服务器地址 + /Packages/Installed/{Name}

**Method：** POST

**接口描述：** Installs a package

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Package name |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| AssemblyGuid | 否 | string |  | Guid of the associated assembly |
| Version | 否 | string |  | Optional version. Defaults to latest version. |
| UpdateClass | 否 | PackageVersionClass |  | Optional update class (Dev, Beta, Release). Defaults to Release. |


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

## deletePackagesInstallingById

### 基本信息
**Path：** DELETE 服务器地址 + /Packages/Installing/{Id}

**Method：** DELETE

**接口描述：** Cancels a package installation

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Installation Id |


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

## postPackagesInstallingByIdDelete

### 基本信息
**Path：** POST 服务器地址 + /Packages/Installing/{Id}/Delete

**Method：** POST

**接口描述：** Cancels a package installation

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Installation Id |


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

## getPackagesUpdates

### 基本信息
**Path：** GET 服务器地址 + /Packages/Updates

**Method：** GET

**接口描述：** Gets available package updates for currently installed packages

**认证要求：** 管理员认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| PackageType | 是 | string |  | Package type filter (System/UserInstalled) |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a PackageVersionInfo[] object. | PackageVersionInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

