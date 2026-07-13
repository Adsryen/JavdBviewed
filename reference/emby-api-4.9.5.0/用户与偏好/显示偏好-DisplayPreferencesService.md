# 显示偏好（DisplayPreferencesService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：用户与偏好
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：5

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/DisplayPreferences/{DisplayPreferencesId}` | postDisplaypreferencesByDisplaypreferencesid | Updates a user's display preferences for an item |
| GET | `/DisplayPreferences/{Id}` | getDisplaypreferencesById | Gets a user's display preferences for an item |
| GET | `/UserSettings/{UserId}` | getUsersettingsByUserid | Gets user settings |
| POST | `/UserSettings/{UserId}` | postUsersettingsByUserid | Updates a user's display preferences for an item |
| POST | `/UserSettings/{UserId}/Partial` | postUsersettingsByUseridPartial | Updates a user's display preferences for an item |

---

## postDisplaypreferencesByDisplaypreferencesid

### 基本信息
**Path：** POST 服务器地址 + /DisplayPreferences/{DisplayPreferencesId}

**Method：** POST

**接口描述：** Updates a user's display preferences for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| DisplayPreferencesId | 是 | string |  | DisplayPreferences Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


**Body**

- 是否必须：是
- 描述：DisplayPreferences:
- Content-Type：`application/json`
- Schema：`DisplayPreferences`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| SortBy | string |  |
| CustomPrefs | object |  |
| SortOrder | SortOrder |  |
| Client | string |  |

- Content-Type：`application/xml`
- Schema：`DisplayPreferences`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| SortBy | string |  |
| CustomPrefs | object |  |
| SortOrder | SortOrder |  |
| Client | string |  |



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

## getDisplaypreferencesById

### 基本信息
**Path：** GET 服务器地址 + /DisplayPreferences/{Id}

**Method：** GET

**接口描述：** Gets a user's display preferences for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |
| Client | 是 | string |  | Client |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DisplayPreferences object. | DisplayPreferences |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（DisplayPreferences）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| SortBy | string |  |
| CustomPrefs | object |  |
| SortOrder | SortOrder |  |
| Client | string |  |


**200 字段说明（DisplayPreferences）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string |  |
| SortBy | string |  |
| CustomPrefs | object |  |
| SortOrder | SortOrder |  |
| Client | string |  |


---

## getUsersettingsByUserid

### 基本信息
**Path：** GET 服务器地址 + /UserSettings/{UserId}

**Method：** GET

**接口描述：** Gets user settings

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a Dictionary<String,String> object. | object |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postUsersettingsByUserid

### 基本信息
**Path：** POST 服务器地址 + /UserSettings/{UserId}

**Method：** POST

**接口描述：** Updates a user's display preferences for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


**Body**

- 是否必须：是
- 描述：UserSettings:
- Content-Type：`application/json`
- Schema：`string[]`
- Content-Type：`application/xml`
- Schema：`string[]`


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

## postUsersettingsByUseridPartial

### 基本信息
**Path：** POST 服务器地址 + /UserSettings/{UserId}/Partial

**Method：** POST

**接口描述：** Updates a user's display preferences for an item

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| UserId | 是 | string |  | User Id |


**Body**

- 是否必须：是
- 描述：Binary stream
- Content-Type：`application/octet-stream`
- Schema：`string`


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

