# 图像资源（ImageService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：图像
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：49

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Artists/{Name}/Images/{Type}` | getArtistsByNameImagesByType |  |
| HEAD | `/Artists/{Name}/Images/{Type}` | headArtistsByNameImagesByType |  |
| GET | `/Artists/{Name}/Images/{Type}/{Index}` | getArtistsByNameImagesByTypeByIndex |  |
| HEAD | `/Artists/{Name}/Images/{Type}/{Index}` | headArtistsByNameImagesByTypeByIndex |  |
| GET | `/GameGenres/{Name}/Images/{Type}` | getGamegenresByNameImagesByType |  |
| HEAD | `/GameGenres/{Name}/Images/{Type}` | headGamegenresByNameImagesByType |  |
| GET | `/GameGenres/{Name}/Images/{Type}/{Index}` | getGamegenresByNameImagesByTypeByIndex |  |
| HEAD | `/GameGenres/{Name}/Images/{Type}/{Index}` | headGamegenresByNameImagesByTypeByIndex |  |
| GET | `/Genres/{Name}/Images/{Type}` | getGenresByNameImagesByType |  |
| HEAD | `/Genres/{Name}/Images/{Type}` | headGenresByNameImagesByType |  |
| GET | `/Genres/{Name}/Images/{Type}/{Index}` | getGenresByNameImagesByTypeByIndex |  |
| HEAD | `/Genres/{Name}/Images/{Type}/{Index}` | headGenresByNameImagesByTypeByIndex |  |
| GET | `/Items/{Id}/Images` | getItemsByIdImages | Gets information about an item's images |
| DELETE | `/Items/{Id}/Images/{Type}` | deleteItemsByIdImagesByType |  |
| GET | `/Items/{Id}/Images/{Type}` | getItemsByIdImagesByType |  |
| HEAD | `/Items/{Id}/Images/{Type}` | headItemsByIdImagesByType |  |
| POST | `/Items/{Id}/Images/{Type}` | postItemsByIdImagesByType | Uploads an image for an item, must be base64 encoded. |
| DELETE | `/Items/{Id}/Images/{Type}/{Index}` | deleteItemsByIdImagesByTypeByIndex |  |
| GET | `/Items/{Id}/Images/{Type}/{Index}` | getItemsByIdImagesByTypeByIndex |  |
| HEAD | `/Items/{Id}/Images/{Type}/{Index}` | headItemsByIdImagesByTypeByIndex |  |
| POST | `/Items/{Id}/Images/{Type}/{Index}` | postItemsByIdImagesByTypeByIndex | Uploads an image for an item, must be base64 encoded. |
| GET | `/Items/{Id}/Images/{Type}/{Index}/{Tag}/{Format}/{MaxWidth}/{MaxHeight}/{PercentPlayed}/{UnPlayedCount}` | getItemsByIdImagesByTypeByIndexByTagByFormatByMaxwidthByMaxheightByPercentplayedByUnplayedcount |  |
| HEAD | `/Items/{Id}/Images/{Type}/{Index}/{Tag}/{Format}/{MaxWidth}/{MaxHeight}/{PercentPlayed}/{UnPlayedCount}` | headItemsByIdImagesByTypeByIndexByTagByFormatByMaxwidthByMaxheightByPercentplayedByUnplayedcount |  |
| POST | `/Items/{Id}/Images/{Type}/{Index}/Delete` | postItemsByIdImagesByTypeByIndexDelete |  |
| POST | `/Items/{Id}/Images/{Type}/{Index}/Index` | postItemsByIdImagesByTypeByIndexIndex | Updates the index for an item image |
| POST | `/Items/{Id}/Images/{Type}/{Index}/Url` | postItemsByIdImagesByTypeByIndexUrl | Updates the index for an item image |
| POST | `/Items/{Id}/Images/{Type}/Delete` | postItemsByIdImagesByTypeDelete |  |
| GET | `/MusicGenres/{Name}/Images/{Type}` | getMusicgenresByNameImagesByType |  |
| HEAD | `/MusicGenres/{Name}/Images/{Type}` | headMusicgenresByNameImagesByType |  |
| GET | `/MusicGenres/{Name}/Images/{Type}/{Index}` | getMusicgenresByNameImagesByTypeByIndex |  |
| HEAD | `/MusicGenres/{Name}/Images/{Type}/{Index}` | headMusicgenresByNameImagesByTypeByIndex |  |
| GET | `/Persons/{Name}/Images/{Type}` | getPersonsByNameImagesByType |  |
| HEAD | `/Persons/{Name}/Images/{Type}` | headPersonsByNameImagesByType |  |
| GET | `/Persons/{Name}/Images/{Type}/{Index}` | getPersonsByNameImagesByTypeByIndex |  |
| HEAD | `/Persons/{Name}/Images/{Type}/{Index}` | headPersonsByNameImagesByTypeByIndex |  |
| GET | `/Studios/{Name}/Images/{Type}` | getStudiosByNameImagesByType |  |
| HEAD | `/Studios/{Name}/Images/{Type}` | headStudiosByNameImagesByType |  |
| GET | `/Studios/{Name}/Images/{Type}/{Index}` | getStudiosByNameImagesByTypeByIndex |  |
| HEAD | `/Studios/{Name}/Images/{Type}/{Index}` | headStudiosByNameImagesByTypeByIndex |  |
| DELETE | `/Users/{Id}/Images/{Type}` | deleteUsersByIdImagesByType |  |
| GET | `/Users/{Id}/Images/{Type}` | getUsersByIdImagesByType |  |
| HEAD | `/Users/{Id}/Images/{Type}` | headUsersByIdImagesByType |  |
| POST | `/Users/{Id}/Images/{Type}` | postUsersByIdImagesByType | Uploads an image for an item, must be base64 encoded. |
| DELETE | `/Users/{Id}/Images/{Type}/{Index}` | deleteUsersByIdImagesByTypeByIndex |  |
| GET | `/Users/{Id}/Images/{Type}/{Index}` | getUsersByIdImagesByTypeByIndex |  |
| HEAD | `/Users/{Id}/Images/{Type}/{Index}` | headUsersByIdImagesByTypeByIndex |  |
| POST | `/Users/{Id}/Images/{Type}/{Index}` | postUsersByIdImagesByTypeByIndex | Uploads an image for an item, must be base64 encoded. |
| POST | `/Users/{Id}/Images/{Type}/{Index}/Delete` | postUsersByIdImagesByTypeByIndexDelete |  |
| POST | `/Users/{Id}/Images/{Type}/Delete` | postUsersByIdImagesByTypeDelete |  |

---

## getArtistsByNameImagesByType

### 基本信息
**Path：** GET 服务器地址 + /Artists/{Name}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headArtistsByNameImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /Artists/{Name}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## getArtistsByNameImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /Artists/{Name}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headArtistsByNameImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Artists/{Name}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## getGamegenresByNameImagesByType

### 基本信息
**Path：** GET 服务器地址 + /GameGenres/{Name}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headGamegenresByNameImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /GameGenres/{Name}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## getGamegenresByNameImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /GameGenres/{Name}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headGamegenresByNameImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /GameGenres/{Name}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## getGenresByNameImagesByType

### 基本信息
**Path：** GET 服务器地址 + /Genres/{Name}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headGenresByNameImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /Genres/{Name}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## getGenresByNameImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /Genres/{Name}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headGenresByNameImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Genres/{Name}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## getItemsByIdImages

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Images

**Method：** GET

**接口描述：** Gets information about an item's images

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a List<ImageInfo> object. | ImageInfo[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## deleteItemsByIdImagesByType

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{Id}/Images/{Type}

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Index | 否 | integer |  | Image Index |


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

## getItemsByIdImagesByType

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headItemsByIdImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{Id}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## postItemsByIdImagesByType

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Images/{Type}

**Method：** POST

**接口描述：** Uploads an image for an item, must be base64 encoded.

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Index | 否 | integer|null |  | Image Index |


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

## deleteItemsByIdImagesByTypeByIndex

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{Id}/Images/{Type}/{Index}

**Method：** DELETE

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


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

## getItemsByIdImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headItemsByIdImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{Id}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## postItemsByIdImagesByTypeByIndex

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Images/{Type}/{Index}

**Method：** POST

**接口描述：** Uploads an image for an item, must be base64 encoded.

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer|null |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


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

## getItemsByIdImagesByTypeByIndexByTagByFormatByMaxwidthByMaxheightByPercentplayedByUnplayedcount

### 基本信息
**Path：** GET 服务器地址 + /Items/{Id}/Images/{Type}/{Index}/{Tag}/{Format}/{MaxWidth}/{MaxHeight}/{PercentPlayed}/{UnPlayedCount}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| PercentPlayed | 是 | integer|null |  |  |
| UnPlayedCount | 是 | integer|null |  |  |
| Id | 是 | string |  | Item Id |
| MaxWidth | 是 | integer |  | The maximum image width to return. |
| MaxHeight | 是 | integer |  | The maximum image height to return. |
| Tag | 是 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| Format | 是 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headItemsByIdImagesByTypeByIndexByTagByFormatByMaxwidthByMaxheightByPercentplayedByUnplayedcount

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{Id}/Images/{Type}/{Index}/{Tag}/{Format}/{MaxWidth}/{MaxHeight}/{PercentPlayed}/{UnPlayedCount}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| PercentPlayed | 是 | integer|null |  |  |
| UnPlayedCount | 是 | integer|null |  |  |
| Id | 是 | string |  | Item Id |
| MaxWidth | 是 | integer |  | The maximum image width to return. |
| MaxHeight | 是 | integer |  | The maximum image height to return. |
| Tag | 是 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| Format | 是 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## postItemsByIdImagesByTypeByIndexDelete

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Images/{Type}/{Index}/Delete

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


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

## postItemsByIdImagesByTypeByIndexIndex

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Images/{Type}/{Index}/Index

**Method：** POST

**接口描述：** Updates the index for an item image

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |
| Index | 是 | integer |  | Image Index |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| NewIndex | 是 | integer |  | The new image index |


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

## postItemsByIdImagesByTypeByIndexUrl

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Images/{Type}/{Index}/Url

**Method：** POST

**接口描述：** Updates the index for an item image

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |
| Index | 是 | integer |  | Image Index |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Url | 是 | string |  | The url for the new image |


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

## postItemsByIdImagesByTypeDelete

### 基本信息
**Path：** POST 服务器地址 + /Items/{Id}/Images/{Type}/Delete

**Method：** POST

**接口描述：** Requires authentication as administrator

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Item Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Index | 否 | integer |  | Image Index |


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

## getMusicgenresByNameImagesByType

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/{Name}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headMusicgenresByNameImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /MusicGenres/{Name}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## getMusicgenresByNameImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/{Name}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headMusicgenresByNameImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /MusicGenres/{Name}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## getPersonsByNameImagesByType

### 基本信息
**Path：** GET 服务器地址 + /Persons/{Name}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headPersonsByNameImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /Persons/{Name}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## getPersonsByNameImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /Persons/{Name}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headPersonsByNameImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Persons/{Name}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## getStudiosByNameImagesByType

### 基本信息
**Path：** GET 服务器地址 + /Studios/{Name}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headStudiosByNameImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /Studios/{Name}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## getStudiosByNameImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /Studios/{Name}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headStudiosByNameImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Studios/{Name}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Name | 是 | string |  | Item name |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## deleteUsersByIdImagesByType

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{Id}/Images/{Type}

**Method：** DELETE

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Index | 否 | integer |  | Image Index |


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

## getUsersByIdImagesByType

### 基本信息
**Path：** GET 服务器地址 + /Users/{Id}/Images/{Type}

**Method：** GET

**接口描述：** Requires authentication as user

**官方文档：** [API Documentation: Authentication](https://dev.emby.media/doc/restapi/User-Authentication.html)

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## headUsersByIdImagesByType

### 基本信息
**Path：** HEAD 服务器地址 + /Users/{Id}/Images/{Type}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |
| Index | 否 | integer |  | Image Index |


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

## postUsersByIdImagesByType

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Images/{Type}

**Method：** POST

**接口描述：** Uploads an image for an item, must be base64 encoded.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Type | 是 | ImageType |  | Image Type |


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

## deleteUsersByIdImagesByTypeByIndex

### 基本信息
**Path：** DELETE 服务器地址 + /Users/{Id}/Images/{Type}/{Index}

**Method：** DELETE

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


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

## getUsersByIdImagesByTypeByIndex

### 基本信息
**Path：** GET 服务器地址 + /Users/{Id}/Images/{Type}/{Index}

**Method：** GET

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## headUsersByIdImagesByTypeByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Users/{Id}/Images/{Type}/{Index}

**Method：** HEAD

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| MaxWidth | 否 | integer |  | The maximum image width to return. |
| MaxHeight | 否 | integer |  | The maximum image height to return. |
| Width | 否 | integer |  | The fixed image width to return. |
| Height | 否 | integer |  | The fixed image height to return. |
| Quality | 否 | integer |  | Optional quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| Tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| CropWhitespace | 否 | boolean|null |  | Specify if whitespace should be cropped out of the image. True/False. If unspecified, whitespace will be cropped from logos and clear art. |
| EnableImageEnhancers | 否 | boolean |  | Enable or disable image enhancers such as cover art. |
| Format | 否 | string |  | Determines the output foramt of the image - original,gif,jpg,png |
| BackgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| ForegroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| AutoOrient | 否 | boolean |  | Set to true to force normalization of orientation in the event the renderer does not support it. |
| KeepAnimation | 否 | boolean |  | Set to true to retain image animation (when supported). |


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

## postUsersByIdImagesByTypeByIndex

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Images/{Type}/{Index}

**Method：** POST

**接口描述：** Uploads an image for an item, must be base64 encoded.

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Type | 是 | ImageType |  | Image Type |


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

## postUsersByIdImagesByTypeByIndexDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Images/{Type}/{Index}/Delete

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Index | 是 | integer |  | Image Index |
| Type | 是 | ImageType |  | Image Type |


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

## postUsersByIdImagesByTypeDelete

### 基本信息
**Path：** POST 服务器地址 + /Users/{Id}/Images/{Type}/Delete

**Method：** POST

**接口描述：** Requires authentication as user

**认证要求：** 用户认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | User Id |
| Type | 是 | ImageType |  | Image Type |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Index | 否 | integer |  | Image Index |


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

