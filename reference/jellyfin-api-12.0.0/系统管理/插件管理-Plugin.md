# 插件管理（Plugin）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：17

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Packages` | GetPackages | Gets available packages. |
| GET | `/Packages/{name}` | GetPackageInfo | Gets a package by name or assembly GUID. |
| POST | `/Packages/Installed/{name}` | InstallPackage | Installs a package. |
| DELETE | `/Packages/Installing/{packageId}` | CancelPackageInstallation | Cancels a package installation. |
| GET | `/Plugins` | GetPlugins | Gets a list of currently installed plugins. |
| DELETE | `/Plugins/{pluginId}` | UninstallPlugin | Uninstalls a plugin. |
| DELETE | `/Plugins/{pluginId}/{version}` | UninstallPluginByVersion | Uninstalls a plugin by version. |
| POST | `/Plugins/{pluginId}/{version}/Disable` | DisablePlugin | Disable a plugin. |
| POST | `/Plugins/{pluginId}/{version}/Enable` | EnablePlugin | Enables a disabled plugin. |
| GET | `/Plugins/{pluginId}/{version}/Image` | GetPluginImage | Gets a plugin's image. |
| GET | `/Plugins/{pluginId}/Configuration` | GetPluginConfiguration | Gets plugin configuration. |
| POST | `/Plugins/{pluginId}/Configuration` | UpdatePluginConfiguration | Updates plugin configuration. |
| POST | `/Plugins/{pluginId}/Manifest` | GetPluginManifest | Gets a plugin's manifest. |
| GET | `/Repositories` | GetRepositories | Gets all package repositories. |
| POST | `/Repositories` | SetRepositories | Sets the enabled and existing package repositories. |
| GET | `/web/ConfigurationPage` | GetDashboardConfigurationPage | Gets a dashboard configuration page. |
| GET | `/web/ConfigurationPages` | GetConfigurationPages | Gets the configuration pages. |

---

## GetPackages

### 基本信息
**Path：** GET 服务器地址 + /Packages

**Method：** GET

**接口描述：** Gets available packages.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Available packages returned. | PackageInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPackageInfo

### 基本信息
**Path：** GET 服务器地址 + /Packages/{name}

**Method：** GET

**接口描述：** Gets a package by name or assembly GUID.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | The name of the package. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| assemblyGuid | 否 | string |  | The GUID of the associated assembly. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Package retrieved. | PackageInfo |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（PackageInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| name | string | Gets or sets the name. |
| description | string | Gets or sets a long description of the plugin containing features or helpful explanations. |
| overview | string | Gets or sets a short overview of what the plugin does. |
| owner | string | Gets or sets the owner. |
| category | string | Gets or sets the category. |
| guid | string | Gets or sets the guid of the assembly associated with this plugin.
This is used to identify the proper item for automatic updates. |
| versions | VersionInfo[] | Gets or sets the versions. |
| imageUrl | string|null | Gets or sets the image url for the package. |


**200 字段说明（PackageInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| name | string | Gets or sets the name. |
| description | string | Gets or sets a long description of the plugin containing features or helpful explanations. |
| overview | string | Gets or sets a short overview of what the plugin does. |
| owner | string | Gets or sets the owner. |
| category | string | Gets or sets the category. |
| guid | string | Gets or sets the guid of the assembly associated with this plugin.
This is used to identify the proper item for automatic updates. |
| versions | VersionInfo[] | Gets or sets the versions. |
| imageUrl | string|null | Gets or sets the image url for the package. |


**200 字段说明（PackageInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| name | string | Gets or sets the name. |
| description | string | Gets or sets a long description of the plugin containing features or helpful explanations. |
| overview | string | Gets or sets a short overview of what the plugin does. |
| owner | string | Gets or sets the owner. |
| category | string | Gets or sets the category. |
| guid | string | Gets or sets the guid of the assembly associated with this plugin.
This is used to identify the proper item for automatic updates. |
| versions | VersionInfo[] | Gets or sets the versions. |
| imageUrl | string|null | Gets or sets the image url for the package. |


---

## InstallPackage

### 基本信息
**Path：** POST 服务器地址 + /Packages/Installed/{name}

**Method：** POST

**接口描述：** Installs a package.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Package name. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| assemblyGuid | 否 | string |  | GUID of the associated assembly. |
| version | 否 | string |  | Optional version. Defaults to latest version. |
| repositoryUrl | 否 | string |  | Optional. Specify the repository to install from. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Package found. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Package not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## CancelPackageInstallation

### 基本信息
**Path：** DELETE 服务器地址 + /Packages/Installing/{packageId}

**Method：** DELETE

**接口描述：** Cancels a package installation.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| packageId | 是 | string |  | Installation Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Installation cancelled. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPlugins

### 基本信息
**Path：** GET 服务器地址 + /Plugins

**Method：** GET

**接口描述：** Gets a list of currently installed plugins.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Installed plugins returned. | PluginInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UninstallPlugin

### 基本信息
**Path：** DELETE 服务器地址 + /Plugins/{pluginId}

**Method：** DELETE

**接口描述：** Uninstalls a plugin.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Plugin uninstalled. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UninstallPluginByVersion

### 基本信息
**Path：** DELETE 服务器地址 + /Plugins/{pluginId}/{version}

**Method：** DELETE

**接口描述：** Uninstalls a plugin by version.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |
| version | 是 | string |  | Plugin version. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Plugin uninstalled. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DisablePlugin

### 基本信息
**Path：** POST 服务器地址 + /Plugins/{pluginId}/{version}/Disable

**Method：** POST

**接口描述：** Disable a plugin.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |
| version | 是 | string |  | Plugin version. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Plugin disabled. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## EnablePlugin

### 基本信息
**Path：** POST 服务器地址 + /Plugins/{pluginId}/{version}/Enable

**Method：** POST

**接口描述：** Enables a disabled plugin.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |
| version | 是 | string |  | Plugin version. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Plugin enabled. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPluginImage

### 基本信息
**Path：** GET 服务器地址 + /Plugins/{pluginId}/{version}/Image

**Method：** GET

**接口描述：** Gets a plugin's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |
| version | 是 | string |  | Plugin version. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Plugin image returned. | string |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Not Found | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPluginConfiguration

### 基本信息
**Path：** GET 服务器地址 + /Plugins/{pluginId}/Configuration

**Method：** GET

**接口描述：** Gets plugin configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Plugin configuration returned. | BasePluginConfiguration |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found or plugin configuration not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdatePluginConfiguration

### 基本信息
**Path：** POST 服务器地址 + /Plugins/{pluginId}/Configuration

**Method：** POST

**接口描述：** Updates plugin configuration.

**认证要求：** Accepts plugin configuration as JSON body.

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Plugin configuration updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found or plugin does not have configuration. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPluginManifest

### 基本信息
**Path：** POST 服务器地址 + /Plugins/{pluginId}/Manifest

**Method：** POST

**接口描述：** Gets a plugin's manifest.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| pluginId | 是 | string |  | Plugin id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Plugin manifest returned. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Plugin not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetRepositories

### 基本信息
**Path：** GET 服务器地址 + /Repositories

**Method：** GET

**接口描述：** Gets all package repositories.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Package repositories returned. | RepositoryInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SetRepositories

### 基本信息
**Path：** POST 服务器地址 + /Repositories

**Method：** POST

**接口描述：** Sets the enabled and existing package repositories.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：The list of package repositories.
- Content-Type：`application/json`
- Schema：`RepositoryInfo[]`
- Content-Type：`text/json`
- Schema：`RepositoryInfo[]`
- Content-Type：`application/*+json`
- Schema：`RepositoryInfo[]`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Package repositories saved. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetDashboardConfigurationPage

### 基本信息
**Path：** GET 服务器地址 + /web/ConfigurationPage

**Method：** GET

**接口描述：** Gets a dashboard configuration page.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 否 | string |  | The name of the page. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | ConfigurationPage returned. | string |
| 404 | Plugin configuration page not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetConfigurationPages

### 基本信息
**Path：** GET 服务器地址 + /web/ConfigurationPages

**Method：** GET

**接口描述：** Gets the configuration pages.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| enableInMainMenu | 否 | boolean |  | Whether to enable in the main menu. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | ConfigurationPages returned. | ConfigurationPageInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Server still loading. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

