## 刷新 access_token
### <font style="color:rgba(39, 56, 72, 0.85);">基本信息</font>
**接口名称：**

刷新 access_token



**接口路径：**

<font style="color:rgb(16, 142, 233);background-color:rgb(210, 234, 251);">POST</font><font style="color:rgba(13, 27, 62, 0.65);"> </font><font style="color:rgba(13, 27, 62, 0.65);">https://passportapi.115.com</font>/open/refreshToken

### <font style="color:rgba(39, 56, 72, 0.85);">备注</font>
<font style="color:rgb(85, 85, 85);">请勿频繁刷新，否则列入频控。</font>

### <font style="color:rgb(64, 64, 64);">请求参数</font>
**<font style="color:rgb(57, 56, 56);">Headers</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">参数值</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">Content-Type</font> | <font style="color:rgb(57, 56, 56);">application/x-www-form-urlencoded</font> | <font style="color:rgb(57, 56, 56);">是</font> | | |


**<font style="color:rgb(57, 56, 56);">Body</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">参数类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">refresh_token</font> | <font style="color:rgb(57, 56, 56);">text</font> | <font style="color:rgb(57, 56, 56);">是</font> | | <font style="color:rgb(57, 56, 56);">刷新的凭证</font> |


### <font style="color:rgb(64, 64, 64);">返回数据</font>
| <font style="color:rgb(57, 56, 56);">名称</font> | <font style="color:rgb(57, 56, 56);">类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">默认值</font> | <font style="color:rgb(57, 56, 56);">备注</font> | <font style="color:rgb(57, 56, 56);">其他信息</font> |
| --- | --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">state</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">code</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">message</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">data</font> | <font style="color:rgb(57, 56, 56);">object</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">access_token</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | **<font style="color:#DF2A3F;">新的</font>**<font style="color:rgb(57, 56, 56);"> access_token，同时刷新有效期</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">refresh_token</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | **<font style="color:#DF2A3F;">新的</font>**<font style="color:rgb(57, 56, 56);"> refresh_token，</font>**<font style="color:rgb(57, 56, 56);">有效期</font>**<font style="color:rgb(57, 56, 56);">不延长不改变</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">expires_in</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">access_token 有效期，单位秒</font> | <font style="color:rgb(57, 56, 56);">mock:</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">2592000</font> |
| <font style="color:rgb(57, 56, 56);">error</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">errno</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |


  

