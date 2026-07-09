### 基本信息
Path 域名 + /open/offline/torrent  


Method：POST  


接口描述：解析BT种子  


### 请求参数
### head
| 参数名称 | 参数值 | 是否必须 | 示例 |
| --- | --- | --- | --- |
| Authorization | Bearer access_token | 是 | Bearer abcdefghijklmnopqrstuvwxyz |


### **<font style="color:rgb(0, 0, 0);">Body(form-data)</font>**
| 参数名称 | 参数类型 | 是否必须 | 备注 |
| --- | --- | --- | --- |
| torrent_sha1 | string | 是 | BT种子文件sha1，需先上传到“云下载/种子文件”文件夹下(非硬性要求) |
| pick_code | string | 是 | BT种子文件提取码 |


### 返回数据说明
| 名称 | 类型 | 备注 | 其他信息 |
| --- | --- | --- | --- |
| state | boolean | | |
| message | string | | |
| code | number | | |
| data | array | | |
|   ├─ file_size | int | 任务大小 | |
|   ├─torrent_name | string | 任务名 | |
|   ├─ file_count | int | 文件数 | |
|   ├─ info_hash | string | 任务sha1 | |
|   ├─torrent_filelist | array | 文件列表 | |
|   ├─size | int | 文件大小 | |
|   ├─path | string | 文件路径 | |
|   ├─wanted | int | 文件是否默认选中 | |

