# 本地化（Localization）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Localization/Countries` | GetCountries | Gets known countries. |
| GET | `/Localization/Cultures` | GetCultures | Gets known cultures. |
| GET | `/Localization/Options` | GetLocalizationOptions | Gets localization options. |
| GET | `/Localization/ParentalRatings` | GetParentalRatings | Gets known parental ratings. |

---

## GetCountries

### 基本信息
**Path：** GET 服务器地址 + /Localization/Countries

**Method：** GET

**接口描述：** Gets known countries.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Known countries returned. | CountryInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetCultures

### 基本信息
**Path：** GET 服务器地址 + /Localization/Cultures

**Method：** GET

**接口描述：** Gets known cultures.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Known cultures returned. | CultureDto[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetLocalizationOptions

### 基本信息
**Path：** GET 服务器地址 + /Localization/Options

**Method：** GET

**接口描述：** Gets localization options.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Localization options returned. | LocalizationOption[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetParentalRatings

### 基本信息
**Path：** GET 服务器地址 + /Localization/ParentalRatings

**Method：** GET

**接口描述：** Gets known parental ratings.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Known parental ratings returned. | ParentalRating[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

