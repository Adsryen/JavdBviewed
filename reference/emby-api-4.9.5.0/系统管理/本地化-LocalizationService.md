# 本地化（LocalizationService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：4

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Localization/Countries` | getLocalizationCountries | Gets known countries |
| GET | `/Localization/Cultures` | getLocalizationCultures | Gets known cultures |
| GET | `/Localization/Options` | getLocalizationOptions | Gets localization options |
| GET | `/Localization/ParentalRatings` | getLocalizationParentalratings | Gets known parental ratings |

---

## getLocalizationCountries

### 基本信息
**Path：** GET 服务器地址 + /Localization/Countries

**Method：** GET

**接口描述：** Gets known countries

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a CountryInfo[] object. | Globalization.CountryInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLocalizationCultures

### 基本信息
**Path：** GET 服务器地址 + /Localization/Cultures

**Method：** GET

**接口描述：** Gets known cultures

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a CultureDto[] object. | Globalization.CultureDto[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLocalizationOptions

### 基本信息
**Path：** GET 服务器地址 + /Localization/Options

**Method：** GET

**接口描述：** Gets localization options

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a LocalizatonOption[] object. | Globalization.LocalizatonOption[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## getLocalizationParentalratings

### 基本信息
**Path：** GET 服务器地址 + /Localization/ParentalRatings

**Method：** GET

**接口描述：** Gets known parental ratings

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a ParentalRating[] object. | ParentalRating[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

