# 图像资源（Image）

> Jellyfin API 版本：`12.0.0` · 文档目录：`jellyfin-api-12.0.0`
> 分类：图像
> 来源：Jellyfin 官方 OpenAPI（[https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json](https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json)）
> 规范版本：12.0.0 · 接口数：37

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Artists/{name}/Images/{imageType}/{imageIndex}` | GetArtistImage | Get artist image by name. |
| HEAD | `/Artists/{name}/Images/{imageType}/{imageIndex}` | HeadArtistImage | Get artist image by name. |
| DELETE | `/Branding/Splashscreen` | DeleteCustomSplashscreen | Delete a custom splashscreen. |
| GET | `/Branding/Splashscreen` | GetSplashscreen | Generates or gets the splashscreen. |
| POST | `/Branding/Splashscreen` | UploadCustomSplashscreen | Uploads a custom splashscreen.
The body is expected to the image contents base64 encoded. |
| GET | `/Genres/{name}/Images/{imageType}` | GetGenreImage | Get genre image by name. |
| HEAD | `/Genres/{name}/Images/{imageType}` | HeadGenreImage | Get genre image by name. |
| GET | `/Genres/{name}/Images/{imageType}/{imageIndex}` | GetGenreImageByIndex | Get genre image by name. |
| HEAD | `/Genres/{name}/Images/{imageType}/{imageIndex}` | HeadGenreImageByIndex | Get genre image by name. |
| GET | `/Items/{itemId}/Images` | GetItemImageInfos | Get item image infos. |
| DELETE | `/Items/{itemId}/Images/{imageType}` | DeleteItemImage | Delete an item's image. |
| GET | `/Items/{itemId}/Images/{imageType}` | GetItemImage | Gets the item's image. |
| HEAD | `/Items/{itemId}/Images/{imageType}` | HeadItemImage | Gets the item's image. |
| POST | `/Items/{itemId}/Images/{imageType}` | SetItemImage | Set item image. |
| DELETE | `/Items/{itemId}/Images/{imageType}/{imageIndex}` | DeleteItemImageByIndex | Delete an item's image. |
| GET | `/Items/{itemId}/Images/{imageType}/{imageIndex}` | GetItemImageByIndex | Gets the item's image. |
| HEAD | `/Items/{itemId}/Images/{imageType}/{imageIndex}` | HeadItemImageByIndex | Gets the item's image. |
| POST | `/Items/{itemId}/Images/{imageType}/{imageIndex}` | SetItemImageByIndex | Set item image. |
| GET | `/Items/{itemId}/Images/{imageType}/{imageIndex}/{tag}/{format}/{maxWidth}/{maxHeight}/{percentPlayed}/{unplayedCount}` | GetItemImage2 | Gets the item's image. |
| HEAD | `/Items/{itemId}/Images/{imageType}/{imageIndex}/{tag}/{format}/{maxWidth}/{maxHeight}/{percentPlayed}/{unplayedCount}` | HeadItemImage2 | Gets the item's image. |
| POST | `/Items/{itemId}/Images/{imageType}/{imageIndex}/Index` | UpdateItemImageIndex | Updates the index for an item image. |
| GET | `/MusicGenres/{name}/Images/{imageType}` | GetMusicGenreImage | Get music genre image by name. |
| HEAD | `/MusicGenres/{name}/Images/{imageType}` | HeadMusicGenreImage | Get music genre image by name. |
| GET | `/MusicGenres/{name}/Images/{imageType}/{imageIndex}` | GetMusicGenreImageByIndex | Get music genre image by name. |
| HEAD | `/MusicGenres/{name}/Images/{imageType}/{imageIndex}` | HeadMusicGenreImageByIndex | Get music genre image by name. |
| GET | `/Persons/{name}/Images/{imageType}` | GetPersonImage | Get person image by name. |
| HEAD | `/Persons/{name}/Images/{imageType}` | HeadPersonImage | Get person image by name. |
| GET | `/Persons/{name}/Images/{imageType}/{imageIndex}` | GetPersonImageByIndex | Get person image by name. |
| HEAD | `/Persons/{name}/Images/{imageType}/{imageIndex}` | HeadPersonImageByIndex | Get person image by name. |
| GET | `/Studios/{name}/Images/{imageType}` | GetStudioImage | Get studio image by name. |
| HEAD | `/Studios/{name}/Images/{imageType}` | HeadStudioImage | Get studio image by name. |
| GET | `/Studios/{name}/Images/{imageType}/{imageIndex}` | GetStudioImageByIndex | Get studio image by name. |
| HEAD | `/Studios/{name}/Images/{imageType}/{imageIndex}` | HeadStudioImageByIndex | Get studio image by name. |
| DELETE | `/UserImage` | DeleteUserImage | Delete the user's image. |
| GET | `/UserImage` | GetUserImage | Get user profile image. |
| HEAD | `/UserImage` | HeadUserImage | Get user profile image. |
| POST | `/UserImage` | PostUserImage | Sets the user image. |

---

## GetArtistImage

### 基本信息
**Path：** GET 服务器地址 + /Artists/{name}/Images/{imageType}/{imageIndex}

**Method：** GET

**接口描述：** Get artist image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Artist name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadArtistImage

### 基本信息
**Path：** HEAD 服务器地址 + /Artists/{name}/Images/{imageType}/{imageIndex}

**Method：** HEAD

**接口描述：** Get artist image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Artist name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DeleteCustomSplashscreen

### 基本信息
**Path：** DELETE 服务器地址 + /Branding/Splashscreen

**Method：** DELETE

**接口描述：** Delete a custom splashscreen.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Successfully deleted the custom splashscreen. |  |
| 401 | Unauthorized |  |
| 403 | User does not have permission to delete splashscreen.. |  |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetSplashscreen

### 基本信息
**Path：** GET 服务器地址 + /Branding/Splashscreen

**Method：** GET

**接口描述：** Generates or gets the splashscreen.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Splashscreen returned successfully. | string |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UploadCustomSplashscreen

### 基本信息
**Path：** POST 服务器地址 + /Branding/Splashscreen

**Method：** POST

**接口描述：** Uploads a custom splashscreen.
The body is expected to the image contents base64 encoded.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：否
- Content-Type：`image/*`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Successfully uploaded new splashscreen. |  |
| 400 | Error reading MimeType from uploaded image. | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | User does not have permission to upload splashscreen.. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetGenreImage

### 基本信息
**Path：** GET 服务器地址 + /Genres/{name}/Images/{imageType}

**Method：** GET

**接口描述：** Get genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadGenreImage

### 基本信息
**Path：** HEAD 服务器地址 + /Genres/{name}/Images/{imageType}

**Method：** HEAD

**接口描述：** Get genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetGenreImageByIndex

### 基本信息
**Path：** GET 服务器地址 + /Genres/{name}/Images/{imageType}/{imageIndex}

**Method：** GET

**接口描述：** Get genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadGenreImageByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Genres/{name}/Images/{imageType}/{imageIndex}

**Method：** HEAD

**接口描述：** Get genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItemImageInfos

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Images

**Method：** GET

**接口描述：** Get item image infos.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Item images returned. | ImageInfo[] |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DeleteItemImage

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{itemId}/Images/{imageType}

**Method：** DELETE

**接口描述：** Delete an item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| imageIndex | 否 | integer |  | The image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItemImage

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Images/{imageType}

**Method：** GET

**接口描述：** Gets the item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadItemImage

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{itemId}/Images/{imageType}

**Method：** HEAD

**接口描述：** Gets the item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SetItemImage

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/Images/{imageType}

**Method：** POST

**接口描述：** Set item image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Body**

- 是否必须：否
- Content-Type：`image/*`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image saved. |  |
| 400 | Bad Request | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DeleteItemImageByIndex

### 基本信息
**Path：** DELETE 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}

**Method：** DELETE

**接口描述：** Delete an item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | The image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image deleted. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItemImageByIndex

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}

**Method：** GET

**接口描述：** Gets the item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadItemImageByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}

**Method：** HEAD

**接口描述：** Gets the item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Optional. The MediaBrowser.Model.Drawing.ImageFormat of the returned image. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## SetItemImageByIndex

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}

**Method：** POST

**接口描述：** Set item image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | (Unused) Image index. |


**Body**

- 是否必须：否
- Content-Type：`image/*`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image saved. |  |
| 400 | Bad Request | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetItemImage2

### 基本信息
**Path：** GET 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}/{tag}/{format}/{maxWidth}/{maxHeight}/{percentPlayed}/{unplayedCount}

**Method：** GET

**接口描述：** Gets the item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| maxWidth | 是 | integer |  | The maximum image width to return. |
| maxHeight | 是 | integer |  | The maximum image height to return. |
| tag | 是 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 是 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| percentPlayed | 是 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 是 | integer |  | Optional. Unplayed count overlay to render. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadItemImage2

### 基本信息
**Path：** HEAD 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}/{tag}/{format}/{maxWidth}/{maxHeight}/{percentPlayed}/{unplayedCount}

**Method：** HEAD

**接口描述：** Gets the item's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| maxWidth | 是 | integer |  | The maximum image width to return. |
| maxHeight | 是 | integer |  | The maximum image height to return. |
| tag | 是 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 是 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| percentPlayed | 是 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 是 | integer |  | Optional. Unplayed count overlay to render. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## UpdateItemImageIndex

### 基本信息
**Path：** POST 服务器地址 + /Items/{itemId}/Images/{imageType}/{imageIndex}/Index

**Method：** POST

**接口描述：** Updates the index for an item image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| itemId | 是 | string |  | Item id. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Old image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| newIndex | 是 | integer |  | New image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image index updated. |  |
| 401 | Unauthorized |  |
| 403 | Forbidden |  |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMusicGenreImage

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/{name}/Images/{imageType}

**Method：** GET

**接口描述：** Get music genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Music genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadMusicGenreImage

### 基本信息
**Path：** HEAD 服务器地址 + /MusicGenres/{name}/Images/{imageType}

**Method：** HEAD

**接口描述：** Get music genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Music genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetMusicGenreImageByIndex

### 基本信息
**Path：** GET 服务器地址 + /MusicGenres/{name}/Images/{imageType}/{imageIndex}

**Method：** GET

**接口描述：** Get music genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Music genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadMusicGenreImageByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /MusicGenres/{name}/Images/{imageType}/{imageIndex}

**Method：** HEAD

**接口描述：** Get music genre image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Music genre name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPersonImage

### 基本信息
**Path：** GET 服务器地址 + /Persons/{name}/Images/{imageType}

**Method：** GET

**接口描述：** Get person image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Person name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadPersonImage

### 基本信息
**Path：** HEAD 服务器地址 + /Persons/{name}/Images/{imageType}

**Method：** HEAD

**接口描述：** Get person image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Person name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetPersonImageByIndex

### 基本信息
**Path：** GET 服务器地址 + /Persons/{name}/Images/{imageType}/{imageIndex}

**Method：** GET

**接口描述：** Get person image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Person name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadPersonImageByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Persons/{name}/Images/{imageType}/{imageIndex}

**Method：** HEAD

**接口描述：** Get person image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Person name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetStudioImage

### 基本信息
**Path：** GET 服务器地址 + /Studios/{name}/Images/{imageType}

**Method：** GET

**接口描述：** Get studio image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Studio name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadStudioImage

### 基本信息
**Path：** HEAD 服务器地址 + /Studios/{name}/Images/{imageType}

**Method：** HEAD

**接口描述：** Get studio image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Studio name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |
| imageIndex | 否 | integer |  | Image index. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetStudioImageByIndex

### 基本信息
**Path：** GET 服务器地址 + /Studios/{name}/Images/{imageType}/{imageIndex}

**Method：** GET

**接口描述：** Get studio image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Studio name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadStudioImageByIndex

### 基本信息
**Path：** HEAD 服务器地址 + /Studios/{name}/Images/{imageType}/{imageIndex}

**Method：** HEAD

**接口描述：** Get studio image by name.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| name | 是 | string |  | Studio name. |
| imageType | 是 | string enum(Primary|Art|Backdrop|Banner|Logo|Thumb|Disc|Box|Screenshot|Menu|Chapter|BoxRear|Profile) |  | Image type. |
| imageIndex | 是 | integer |  | Image index. |


**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |
| maxWidth | 否 | integer |  | The maximum image width to return. |
| maxHeight | 否 | integer |  | The maximum image height to return. |
| percentPlayed | 否 | number |  | Optional. Percent to render for the percent played overlay. |
| unplayedCount | 否 | integer |  | Optional. Unplayed count overlay to render. |
| width | 否 | integer |  | The fixed image width to return. |
| height | 否 | integer |  | The fixed image height to return. |
| quality | 否 | integer |  | Optional. Quality setting, from 0-100. Defaults to 90 and should suffice in most cases. |
| fillWidth | 否 | integer |  | Width of box to fill. |
| fillHeight | 否 | integer |  | Height of box to fill. |
| blur | 否 | integer |  | Optional. Blur image. |
| backgroundColor | 否 | string |  | Optional. Apply a background color for transparent images. |
| foregroundLayer | 否 | string |  | Optional. Apply a foreground layer on top of the image. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## DeleteUserImage

### 基本信息
**Path：** DELETE 服务器地址 + /UserImage

**Method：** DELETE

**接口描述：** Delete the user's image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User Id. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image deleted. |  |
| 401 | Unauthorized |  |
| 403 | User does not have permission to delete the image. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## GetUserImage

### 基本信息
**Path：** GET 服务器地址 + /UserImage

**Method：** GET

**接口描述：** Get user profile image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 400 | User id not provided. | ProblemDetails |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## HeadUserImage

### 基本信息
**Path：** HEAD 服务器地址 + /UserImage

**Method：** HEAD

**接口描述：** Get user profile image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User id. |
| tag | 否 | string |  | Optional. Supply the cache tag from the item object to receive strong caching headers. |
| format | 否 | string enum(Bmp|Gif|Jpg|Png|Webp|Svg) |  | Determines the output format of the image - original,gif,jpg,png. |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Image stream returned. | string |
| 400 | User id not provided. | ProblemDetails |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

## PostUserImage

### 基本信息
**Path：** POST 服务器地址 + /UserImage

**Method：** POST

**接口描述：** Sets the user image.

**认证要求：** 见接口描述 / CustomAuthentication

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| userId | 否 | string |  | User Id. |


**Body**

- 是否必须：否
- Content-Type：`image/*`
- Schema：`string`


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 204 | Image updated. |  |
| 400 | Bad Request | ProblemDetails |
| 401 | Unauthorized |  |
| 403 | User does not have permission to delete the image. | ProblemDetails |
| 404 | Item not found. | ProblemDetails |
| 503 | The server is currently starting or is temporarily not available. |  |

---

