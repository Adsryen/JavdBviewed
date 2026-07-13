# 显示偏好（DisplayPreference）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：用户与偏好
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/DisplayPreferences/{displayPreferencesId}` | GetDisplayPreferences | Get Display Preferences. |
| POST | `/DisplayPreferences/{displayPreferencesId}` | UpdateDisplayPreferences | Update Display Preferences. |

---

## GetDisplayPreferences

### 基本信息
**Path：** GET 服务器地址 + /DisplayPreferences/{displayPreferencesId}

**Method：** GET

**接口描述：** Get Display Preferences.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| displayPreferencesId | 是 | string |  | Display preferences id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| client | 是 | string |  | Client. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Display preferences retrieved. | DisplayPreferencesDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（DisplayPreferencesDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the user id. |
| ViewType | string|null | Gets or sets the type of the view. |
| SortBy | string|null | Gets or sets the sort by. |
| IndexBy | string|null | Gets or sets the index by. |
| RememberIndexing | boolean | Gets or sets a value indicating whether [remember indexing]. |
| PrimaryImageHeight | integer | Gets or sets the height of the primary image. |
| PrimaryImageWidth | integer | Gets or sets the width of the primary image. |
| CustomPrefs | object | Gets or sets the custom prefs. |
| ScrollDirection | string enum(Horizontal|Vertical) | An enum representing the axis that should be scrolled. |
| ShowBackdrop | boolean | Gets or sets a value indicating whether to show backdrops on this item. |
| RememberSorting | boolean | Gets or sets a value indicating whether [remember sorting]. |
| SortOrder | string enum(Ascending|Descending) | An enum representing the sorting order. |
| ShowSidebar | boolean | Gets or sets a value indicating whether [show sidebar]. |
| Client | string|null | Gets or sets the client. |


**200 字段说明（DisplayPreferencesDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the user id. |
| ViewType | string|null | Gets or sets the type of the view. |
| SortBy | string|null | Gets or sets the sort by. |
| IndexBy | string|null | Gets or sets the index by. |
| RememberIndexing | boolean | Gets or sets a value indicating whether [remember indexing]. |
| PrimaryImageHeight | integer | Gets or sets the height of the primary image. |
| PrimaryImageWidth | integer | Gets or sets the width of the primary image. |
| CustomPrefs | object | Gets or sets the custom prefs. |
| ScrollDirection | string enum(Horizontal|Vertical) | An enum representing the axis that should be scrolled. |
| ShowBackdrop | boolean | Gets or sets a value indicating whether to show backdrops on this item. |
| RememberSorting | boolean | Gets or sets a value indicating whether [remember sorting]. |
| SortOrder | string enum(Ascending|Descending) | An enum representing the sorting order. |
| ShowSidebar | boolean | Gets or sets a value indicating whether [show sidebar]. |
| Client | string|null | Gets or sets the client. |


**200 字段说明（DisplayPreferencesDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Id | string|null | Gets or sets the user id. |
| ViewType | string|null | Gets or sets the type of the view. |
| SortBy | string|null | Gets or sets the sort by. |
| IndexBy | string|null | Gets or sets the index by. |
| RememberIndexing | boolean | Gets or sets a value indicating whether [remember indexing]. |
| PrimaryImageHeight | integer | Gets or sets the height of the primary image. |
| PrimaryImageWidth | integer | Gets or sets the width of the primary image. |
| CustomPrefs | object | Gets or sets the custom prefs. |
| ScrollDirection | string enum(Horizontal|Vertical) | An enum representing the axis that should be scrolled. |
| ShowBackdrop | boolean | Gets or sets a value indicating whether to show backdrops on this item. |
| RememberSorting | boolean | Gets or sets a value indicating whether [remember sorting]. |
| SortOrder | string enum(Ascending|Descending) | An enum representing the sorting order. |
| ShowSidebar | boolean | Gets or sets a value indicating whether [show sidebar]. |
| Client | string|null | Gets or sets the client. |


---

## UpdateDisplayPreferences

### 基本信息
**Path：** POST 服务器地址 + /DisplayPreferences/{displayPreferencesId}

**Method：** POST

**接口描述：** Update Display Preferences.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| displayPreferencesId | 是 | string |  | Display preferences id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User Id. |
| client | 是 | string |  | Client. |


**Body**

- 是否必须：是
- 描述：New Display Preferences object.
- Content-Type：`application/json`
- Schema：`DisplayPreferencesDto`
- Content-Type：`text/json`
- Schema：`DisplayPreferencesDto`
- Content-Type：`application/*+json`
- Schema：`DisplayPreferencesDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Display preferences updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

