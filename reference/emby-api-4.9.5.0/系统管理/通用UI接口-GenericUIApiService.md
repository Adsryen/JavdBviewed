# 通用UI接口（GenericUIApiService）

> Emby 版本：`4.9.5.0` · 文档目录：`emby-api-4.9.5.0`
> 分类：系统管理
> 来源：用户 Emby Server 的官方 OpenAPI（`GET {server}/openapi.json`）
> 抓取基址：http://47.108.74.231:38096/openapi.json
> 规范版本：4.9.5.0 · 接口数：2

## 接口列表

| Method | Path | operationId | 摘要 |
| --- | --- | --- | --- |
| POST | `/UI/Command` | postUICommand | Execute a command in the context of tv setup |
| GET | `/UI/View` | getUIView | Gets UI view data |

---

## postUICommand

### 基本信息
**Path：** POST 服务器地址 + /UI/Command

**Method：** POST

**接口描述：** Execute a command in the context of tv setup

**认证要求：** 用户认证

### 请求参数

（无 Path/Query/Header 参数）


**Body**

- 是否必须：是
- 描述：RunUICommand
- Content-Type：`application/json`
- Schema：`RunUICommand`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PageId | string |  |
| CommandId | string |  |
| Data | string |  |
| ItemId | string |  |
| ClientLocale | string |  |

- Content-Type：`application/xml`
- Schema：`RunUICommand`

| 字段 | 类型 | 备注 |
| --- | --- | --- |
| PageId | string |  |
| CommandId | string |  |
| Data | string |  |
| ItemId | string |  |
| ClientLocale | string |  |



### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UIViewInfo object. | UIViewInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UIViewInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ViewId | string |  |
| PageId | string |  |
| Caption | string |  |
| SubCaption | string |  |
| PluginId | string |  |
| ViewType | Enums.UIViewType |  |
| ShowDialogFullScreen | boolean |  |
| IsInSequence | boolean |  |
| RedirectViewUrl | string |  |
| EditObjectContainer | GenericEdit.IEditObjectContainer |  |
| Commands | UICommand[] |  |
| TabPageInfos | UITabPageInfo[] |  |
| IsPageChangeInfo | boolean |  |


**200 字段说明（UIViewInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ViewId | string |  |
| PageId | string |  |
| Caption | string |  |
| SubCaption | string |  |
| PluginId | string |  |
| ViewType | Enums.UIViewType |  |
| ShowDialogFullScreen | boolean |  |
| IsInSequence | boolean |  |
| RedirectViewUrl | string |  |
| EditObjectContainer | GenericEdit.IEditObjectContainer |  |
| Commands | UICommand[] |  |
| TabPageInfos | UITabPageInfo[] |  |
| IsPageChangeInfo | boolean |  |


---

## getUIView

### 基本信息
**Path：** GET 服务器地址 + /UI/View

**Method：** GET

**接口描述：** Gets UI view data

**认证要求：** 用户认证

### 请求参数

**Query**

| 参数名称 | 是否必须 | 类型 | 示例/默认 | 备注 |
| --- | --- | --- | --- | --- |
| PageId | 是 | string |  | Id of the page controller |
| ClientLocale | 是 | string |  | Locale identifier of the client |


### 返回数据

| 状态码 | 描述 | Schema |
| --- | --- | --- |
| 200 | Operation successful. Returning a UIViewInfo object. | UIViewInfo |
| 400 |  |  |
| 401 |  |  |
| 403 |  |  |
| 404 |  |  |
| 500 |  |  |

**200 字段说明（UIViewInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ViewId | string |  |
| PageId | string |  |
| Caption | string |  |
| SubCaption | string |  |
| PluginId | string |  |
| ViewType | Enums.UIViewType |  |
| ShowDialogFullScreen | boolean |  |
| IsInSequence | boolean |  |
| RedirectViewUrl | string |  |
| EditObjectContainer | GenericEdit.IEditObjectContainer |  |
| Commands | UICommand[] |  |
| TabPageInfos | UITabPageInfo[] |  |
| IsPageChangeInfo | boolean |  |


**200 字段说明（UIViewInfo）**

| 名称 | 类型 | 备注 |
| --- | --- | --- |
| ViewId | string |  |
| PageId | string |  |
| Caption | string |  |
| SubCaption | string |  |
| PluginId | string |  |
| ViewType | Enums.UIViewType |  |
| ShowDialogFullScreen | boolean |  |
| IsInSequence | boolean |  |
| RedirectViewUrl | string |  |
| EditObjectContainer | GenericEdit.IEditObjectContainer |  |
| Commands | UICommand[] |  |
| TabPageInfos | UITabPageInfo[] |  |
| IsPageChangeInfo | boolean |  |


---

