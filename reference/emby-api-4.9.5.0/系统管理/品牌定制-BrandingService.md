# 品牌定制（BrandingService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：3

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Branding/Configuration` | getBrandingConfiguration | Gets branding configuration |
| GET | `/Branding/Css` | getBrandingCss | Gets custom css |
| GET | `/Branding/Css.css` | getBrandingCssCss | Gets custom css |

---

## getBrandingConfiguration

### 基本信息
**Path：** GET 服务器地址 + /Branding/Configuration

**Method：** GET

**接口描述：** Gets branding configuration

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a BrandingOptions object. | Branding.BrandingOptions |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Branding.BrandingOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LoginDisclaimer | string |  |
| CustomCss | string |  |


**200 字段说明（Branding.BrandingOptions）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| LoginDisclaimer | string |  |
| CustomCss | string |  |


---

## getBrandingCss

### 基本信息
**Path：** GET 服务器地址 + /Branding/Css

**Method：** GET

**接口描述：** Gets custom css

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

## getBrandingCssCss

### 基本信息
**Path：** GET 服务器地址 + /Branding/Css.css

**Method：** GET

**接口描述：** Gets custom css

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


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

