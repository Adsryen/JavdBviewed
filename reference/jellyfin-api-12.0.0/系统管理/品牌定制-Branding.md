# 品牌定制（Branding）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：系统管理
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Branding/Configuration` | GetBrandingOptions | Gets branding configuration. |
| GET | `/Branding/Css` | GetBrandingCss | Gets branding css. |
| GET | `/Branding/Css.css` | GetBrandingCss_2 | Gets branding css. |

---

## GetBrandingOptions

### 基本信息
**Path：** GET 服务器地址 + /Branding/Configuration

**Method：** GET

**接口描述：** Gets branding configuration.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Branding configuration returned. | BrandingOptionsDto |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（BrandingOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LoginDisclaimer | string|null | Gets or sets the login disclaimer. |
| CustomCss | string|null | Gets or sets the custom CSS. |
| SplashscreenEnabled | boolean | Gets or sets a value indicating whether to enable the splashscreen. |


**200 字段说明（BrandingOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LoginDisclaimer | string|null | Gets or sets the login disclaimer. |
| CustomCss | string|null | Gets or sets the custom CSS. |
| SplashscreenEnabled | boolean | Gets or sets a value indicating whether to enable the splashscreen. |


**200 字段说明（BrandingOptionsDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LoginDisclaimer | string|null | Gets or sets the login disclaimer. |
| CustomCss | string|null | Gets or sets the custom CSS. |
| SplashscreenEnabled | boolean | Gets or sets a value indicating whether to enable the splashscreen. |


---

## GetBrandingCss

### 基本信息
**Path：** GET 服务器地址 + /Branding/Css

**Method：** GET

**接口描述：** Gets branding css.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Branding css returned. | string |
| 204 | No branding css configured. |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetBrandingCss_2

### 基本信息
**Path：** GET 服务器地址 + /Branding/Css.css

**Method：** GET

**接口描述：** Gets branding css.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Branding css returned. | string |
| 204 | No branding css configured. |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

