# 用户数据（UserData）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：用户与偏好
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：8

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| DELETE | `/UserFavoriteItems/{itemId}` | UnmarkFavoriteItem | Unmarks item as a favorite. |
| POST | `/UserFavoriteItems/{itemId}` | MarkFavoriteItem | Marks an item as a favorite. |
| DELETE | `/UserItems/{itemId}/Rating` | DeleteUserItemRating | Deletes a user's saved personal rating for an item. |
| POST | `/UserItems/{itemId}/Rating` | UpdateUserItemRating | Updates a user's rating for an item. |
| GET | `/UserItems/{itemId}/UserData` | GetItemUserData | Get Item User Data. |
| POST | `/UserItems/{itemId}/UserData` | UpdateItemUserData | Update Item User Data. |
| DELETE | `/UserPlayedItems/{itemId}` | MarkUnplayedItem | Marks an item as unplayed for user. |
| POST | `/UserPlayedItems/{itemId}` | MarkPlayedItem | Marks an item as played for user. |

---

## UnmarkFavoriteItem

### 基本信息
**Path：** DELETE 服务器地址 + /UserFavoriteItems/{itemId}

**Method：** DELETE

**接口描述：** Unmarks item as a favorite.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item unmarked as favorite. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## MarkFavoriteItem

### 基本信息
**Path：** POST 服务器地址 + /UserFavoriteItems/{itemId}

**Method：** POST

**接口描述：** Marks an item as a favorite.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item marked as favorite. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## DeleteUserItemRating

### 基本信息
**Path：** DELETE 服务器地址 + /UserItems/{itemId}/Rating

**Method：** DELETE

**接口描述：** Deletes a user's saved personal rating for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Personal rating removed. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## UpdateUserItemRating

### 基本信息
**Path：** POST 服务器地址 + /UserItems/{itemId}/Rating

**Method：** POST

**接口描述：** Updates a user's rating for an item.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| likes | 否 | boolean |  | Whether this M:Jellyfin.Api.Controllers.UserLibraryController.UpdateUserItemRating(System.Nullable{System.Guid},System.Guid,System.Nullable{System.Boolean}) is likes. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item rating updated. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## GetItemUserData

### 基本信息
**Path：** GET 服务器地址 + /UserItems/{itemId}/UserData

**Method：** GET

**接口描述：** Get Item User Data.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | return item user data. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item is not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## UpdateItemUserData

### 基本信息
**Path：** POST 服务器地址 + /UserItems/{itemId}/UserData

**Method：** POST

**接口描述：** Update Item User Data.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | The item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | The user id. |


**Body**

- 是否必须：是
- 描述：New user data object.
- Content-Type：`application/json`
- Schema：`UpdateUserItemDataDto`
- Content-Type：`text/json`
- Schema：`UpdateUserItemDataDto`
- Content-Type：`application/*+json`
- Schema：`UpdateUserItemDataDto`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | return updated user item data. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item is not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## MarkUnplayedItem

### 基本信息
**Path：** DELETE 服务器地址 + /UserPlayedItems/{itemId}

**Method：** DELETE

**接口描述：** Marks an item as unplayed for user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item marked as unplayed. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

## MarkPlayedItem

### 基本信息
**Path：** POST 服务器地址 + /UserPlayedItems/{itemId}

**Method：** POST

**接口描述：** Marks an item as played for user.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| datePlayed | 否 | string |  | Optional. The date the item was played. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item marked as played. | UserItemDataDto |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


**200 字段说明（UserItemDataDto）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Rating | number|null | Gets or sets the rating. |
| PlayedPercentage | number|null | Gets or sets the played percentage. |
| UnplayedItemCount | integer|null | Gets or sets the unplayed item count. |
| PlaybackPositionTicks | integer | Gets or sets the playback position ticks. |
| PlayCount | integer | Gets or sets the play count. |
| IsFavorite | boolean | Gets or sets a value indicating whether this instance is favorite. |
| Likes | boolean|null | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is likes. |
| LastPlayedDate | string|null | Gets or sets the last played date. |
| Played | boolean | Gets or sets a value indicating whether this MediaBrowser.Model.Dto.UserItemDataDto is played. |
| Key | string | Gets or sets the key. |
| ItemId | string | Gets or sets the item identifier. |


---

