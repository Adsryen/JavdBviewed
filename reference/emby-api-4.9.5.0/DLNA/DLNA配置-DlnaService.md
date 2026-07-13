# DLNA配置（DlnaService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：DLNA
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：6

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| GET | `/Dlna/ProfileInfos` | getDlnaProfileinfos | Gets a list of profiles |
| POST | `/Dlna/Profiles` | postDlnaProfiles | Creates a profile |
| DELETE | `/Dlna/Profiles/{Id}` | deleteDlnaProfilesById | Deletes a profile |
| GET | `/Dlna/Profiles/{Id}` | getDlnaProfilesById | Gets a single profile |
| POST | `/Dlna/Profiles/{Id}` | postDlnaProfilesById | Updates a profile |
| GET | `/Dlna/Profiles/Default` | getDlnaProfilesDefault | Gets the default profile |

---

## getDlnaProfileinfos

### 基本信息
**Path：** GET 服务器地址 + /Dlna/ProfileInfos

**Method：** GET

**接口描述：** Gets a list of profiles

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DlnaProfile[] object. | Dlna.Profiles.DlnaProfile[] |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

---

## postDlnaProfiles

### 基本信息
**Path：** POST 服务器地址 + /Dlna/Profiles

**Method：** POST

**接口描述：** Creates a profile

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：DlnaProfile:
- Content-Type：`application/json`
- Schema：`Dlna.Profiles.DlnaProfile`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |

- Content-Type：`application/xml`
- Schema：`Dlna.Profiles.DlnaProfile`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |



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

## deleteDlnaProfilesById

### 基本信息
**Path：** DELETE 服务器地址 + /Dlna/Profiles/{Id}

**Method：** DELETE

**接口描述：** Deletes a profile

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Profile Id |


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

## getDlnaProfilesById

### 基本信息
**Path：** GET 服务器地址 + /Dlna/Profiles/{Id}

**Method：** GET

**接口描述：** Gets a single profile

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  | Profile Id |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DlnaProfile object. | Dlna.Profiles.DlnaProfile |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Dlna.Profiles.DlnaProfile）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |


**200 字段说明（Dlna.Profiles.DlnaProfile）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |


---

## postDlnaProfilesById

### 基本信息
**Path：** POST 服务器地址 + /Dlna/Profiles/{Id}

**Method：** POST

**接口描述：** Updates a profile

**认证要求：** 管理员认证

### 请求参数

**Path**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| Id | 是 | string |  |  |


**Body**

- 是否必须：是
- 描述：DlnaProfile:
- Content-Type：`application/json`
- Schema：`Dlna.Profiles.DlnaProfile`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |

- Content-Type：`application/xml`
- Schema：`Dlna.Profiles.DlnaProfile`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |



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

## getDlnaProfilesDefault

### 基本信息
**Path：** GET 服务器地址 + /Dlna/Profiles/Default

**Method：** GET

**接口描述：** Gets the default profile

**认证要求：** 管理员认证

### 请求参数

（无 Path/Query/Header 参数）


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a DlnaProfile object. | Dlna.Profiles.DlnaProfile |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（Dlna.Profiles.DlnaProfile）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |


**200 字段说明（Dlna.Profiles.DlnaProfile）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| Type | Dlna.Profiles.DeviceProfileType |  |
| Path | string |  |
| UserId | string |  |
| AlbumArtPn | string |  |
| MaxAlbumArtWidth | integer |  |
| MaxAlbumArtHeight | integer |  |
| MaxIconWidth | integer|null |  |
| MaxIconHeight | integer|null |  |
| FriendlyName | string |  |
| Manufacturer | string |  |
| ManufacturerUrl | string |  |
| ModelName | string |  |
| ModelDescription | string |  |
| ModelNumber | string |  |
| ModelUrl | string |  |
| SerialNumber | string |  |
| EnableAlbumArtInDidl | boolean |  |
| EnableSingleAlbumArtLimit | boolean |  |
| EnableSingleSubtitleLimit | boolean |  |
| ProtocolInfo | string |  |
| TimelineOffsetSeconds | integer |  |
| RequiresPlainVideoItems | boolean |  |
| RequiresPlainFolders | boolean |  |
| IgnoreTranscodeByteRangeRequests | boolean |  |
| SupportsSamsungBookmark | boolean |  |
| Identification | Dlna.Profiles.DeviceIdentification |  |
| ProtocolInfoDetection | Dlna.Profiles.ProtocolInfoDetection |  |
| Name | string |  |
| Id | string |  |
| SupportedMediaTypes | string |  |
| MaxStreamingBitrate | integer|null |  |
| MusicStreamingTranscodingBitrate | integer|null |  |
| MaxStaticMusicBitrate | integer|null |  |
| DeclaredFeatures | string[] |  |
| DirectPlayProfiles | DirectPlayProfile[] |  |
| TranscodingProfiles | TranscodingProfile[] |  |
| ContainerProfiles | ContainerProfile[] |  |
| CodecProfiles | CodecProfile[] |  |
| ResponseProfiles | ResponseProfile[] |  |
| SubtitleProfiles | SubtitleProfile[] |  |


---

