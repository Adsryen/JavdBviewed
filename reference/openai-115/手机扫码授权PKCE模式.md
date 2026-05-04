此模式适用于无后端服务的第三方客户端，使用 OAuth 2.0 + PKCE 模式授权，无需提供 AppSecret。

<img src="https://cdn.nlark.com/yuque/0/2025/png/35757497/1743573053666-53382bea-461d-47a6-bfbf-515effc8cb83.png" width="1102" title="" crop="0,0,1,1" id="u58e8601a" class="ne-image">

## <font style="color:rgba(13, 27, 62, 0.65);">1.获取设备码和二维码内容</font>
使用接口返回的 <font style="color:rgba(13, 27, 62, 0.65);">data.qrcode </font>作为二维码的内容，在第三方客户端展示二维码，用于给115客户端扫码授权。

### <font style="color:rgba(39, 56, 72, 0.85);">基本信息</font>
**<font style="color:rgba(13, 27, 62, 0.65);">接口名称：</font>**

<font style="color:rgba(13, 27, 62, 0.65);">设备码方式授权</font>



**<font style="color:rgba(13, 27, 62, 0.65);">接口路径：</font>**

<font style="color:rgb(16, 142, 233);background-color:rgb(210, 234, 251);">POST</font><font style="color:rgba(13, 27, 62, 0.65);"> https://passportapi.115.com/open/authDeviceCode</font>

### <font style="color:rgb(64, 64, 64);">请求参数</font>
**<font style="color:rgb(57, 56, 56);">Headers</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">参数值</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">Content-Type</font> | <font style="color:rgb(57, 56, 56);">application/x-www-form-urlencoded</font> | <font style="color:rgb(57, 56, 56);">是</font> | | |


**<font style="color:rgb(57, 56, 56);">Body</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">参数类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">client_id</font> | <font style="color:rgb(57, 56, 56);">text</font> | <font style="color:rgb(57, 56, 56);">是</font> | | <font style="color:rgb(57, 56, 56);">APP ID</font> |
| <font style="color:rgb(57, 56, 56);">code_challenge</font> | <font style="color:rgb(57, 56, 56);">text</font> | <font style="color:rgb(57, 56, 56);">是</font> | THHodGWg-FZfv8XYz7QArNGIK_aVomSHPldlSOTUtkw | <font style="color:rgb(57, 56, 56);">PKCE 相关参数，计算如下：</font><br/><font style="color:rgb(57, 56, 56);">$code_verifier = <43~128为随机字符串>;</font><br/><font style="color:rgb(57, 56, 56);">$code_challenge = url_safe(base64_encode(sha256($code_verifier)));</font><br/><font style="color:rgb(57, 56, 56);">注意 hash 的结果是二进制格式</font> |
| <font style="color:rgb(57, 56, 56);">code_challenge_method</font> | <font style="color:rgb(57, 56, 56);"></font> | <font style="color:rgb(57, 56, 56);">是</font> | sha256 | <font style="color:rgb(57, 56, 56);">计算 code_challenge 的 hash算法，支持 md5, sha1, sha256</font> |




### <font style="color:rgb(64, 64, 64);">返回数据</font>
| <font style="color:rgb(57, 56, 56);">名称</font> | <font style="color:rgb(57, 56, 56);">类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">默认值</font> | <font style="color:rgb(57, 56, 56);">备注</font> | <font style="color:rgb(57, 56, 56);">其他信息</font> |
| --- | --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">state</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">code</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">message</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">data</font> | <font style="color:rgb(57, 56, 56);">object</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">uid</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">设备码</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">time</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">校验用的时间戳，轮询设备码状态用到</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">qrcode</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">二维码内容，第三方客户端需要根据此内容生成设备二维码，提供给115客户端扫码</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">sign</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">校验用的签名，轮询设备码状态用到</font> | |
| <font style="color:rgb(57, 56, 56);">error</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">errno</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |




## <font style="color:rgba(13, 27, 62, 0.65);">2.轮询二维码状态</font>
此为长轮询接口。注意：当二维码状态没有更新时，此接口不会立即响应，直到接口超时或者二维码状态有更新。

### <font style="color:rgba(39, 56, 72, 0.85);">基本信息</font>
**接口名称：**

轮询二维码状态



**接口路径：**

<font style="color:rgb(0, 168, 84);background-color:rgb(207, 239, 223);">GET</font> https://qrcodeapi.115.com/get/status/



### <font style="color:rgb(64, 64, 64);">请求参数</font>
**<font style="color:rgb(57, 56, 56);">Query</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">uid</font> | <font style="color:rgb(57, 56, 56);">是</font> | | <font style="color:rgb(57, 56, 56);">二维码ID/设备码，从 /open/authDeviceCode 接口 data.uid 获取</font> |
| <font style="color:rgb(57, 56, 56);">time</font> | <font style="color:rgb(57, 56, 56);">是</font> | | <font style="color:rgb(57, 56, 56);">校验参数，从 /open/authDeviceCode 接口 data.time 获取</font> |
| <font style="color:rgb(57, 56, 56);">sign</font> | <font style="color:rgb(57, 56, 56);">是</font> | | <font style="color:rgb(57, 56, 56);">校验签名，从 /open/authDeviceCode 接口 data.sign 获取</font> |




### <font style="color:rgb(64, 64, 64);">返回数据</font>
| <font style="color:rgb(57, 56, 56);">名称</font> | <font style="color:rgb(57, 56, 56);">类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">默认值</font> | <font style="color:rgb(57, 56, 56);">备注</font> | <font style="color:rgb(57, 56, 56);">其他信息</font> |
| --- | --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">state</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">0.二维码无效，结束轮询；1.继续轮询；</font> | |
| <font style="color:rgb(57, 56, 56);">code</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">message</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">data</font> | <font style="color:rgb(57, 56, 56);">object</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">115客户端扫码或者输入设备码后才有值</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">msg</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">操作提示</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">status</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">二维码状态；1.扫码成功，等待确认；2.确认登录/授权，结束轮询;</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">version</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |




## 3.获取 access_token
### <font style="color:rgba(39, 56, 72, 0.85);">基本信息</font>
**接口名称：**

用设备码换取 access_token



**接口路径：**

<font style="color:rgb(16, 142, 233);background-color:rgb(210, 234, 251);">POST</font><font style="color:rgba(13, 27, 62, 0.65);"> </font>https://passportapi.115.com/open/deviceCodeToToken



### <font style="color:rgb(64, 64, 64);">请求参数</font>
**<font style="color:rgb(57, 56, 56);">Headers</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">参数值</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">Content-Type</font> | <font style="color:rgb(57, 56, 56);">application/x-www-form-urlencoded</font> | <font style="color:rgb(57, 56, 56);">是</font> | | |


**<font style="color:rgb(57, 56, 56);">Body</font>**

| <font style="color:rgb(57, 56, 56);">参数名称</font> | <font style="color:rgb(57, 56, 56);">参数类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">示例</font> | <font style="color:rgb(57, 56, 56);">备注</font> |
| --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">uid</font> | <font style="color:rgb(57, 56, 56);">text</font> | <font style="color:rgb(57, 56, 56);">是</font> | | <font style="color:rgb(57, 56, 56);">二维码ID/设备码</font> |
| <font style="color:rgb(57, 56, 56);">code_verifier</font> | <font style="color:rgb(57, 56, 56);">text</font> | <font style="color:rgb(57, 56, 56);">是</font> | IGKN6CJanWxCDPDhHZJrhswQdlcPBGLqExkhyujysXaQ4fJKBk_6dlPJo47s | <font style="color:rgb(57, 56, 56);">上一步计算 code_challenge 的原值 code_verifier</font> |


### <font style="color:rgb(64, 64, 64);">返回数据</font>
| <font style="color:rgb(57, 56, 56);">名称</font> | <font style="color:rgb(57, 56, 56);">类型</font> | <font style="color:rgb(57, 56, 56);">是否必须</font> | <font style="color:rgb(57, 56, 56);">默认值</font> | <font style="color:rgb(57, 56, 56);">备注</font> | <font style="color:rgb(57, 56, 56);">其他信息</font> |
| --- | --- | --- | --- | --- | --- |
| <font style="color:rgb(57, 56, 56);">state</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">code</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">message</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">data</font> | <font style="color:rgb(57, 56, 56);">object</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">access_token</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">用于访问资源接口的凭证</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">refresh_token</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">用于刷新 access_token，有效期1年</font> | |
| <font style="color:rgb(140, 138, 138);">├─</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">expires_in</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | <font style="color:rgb(57, 56, 56);">access_token 有效期，单位秒</font> | <font style="color:rgb(57, 56, 56);">mock:</font><font style="color:rgb(57, 56, 56);"> </font><font style="color:rgb(57, 56, 56);">7200</font> |
| <font style="color:rgb(57, 56, 56);">error</font> | <font style="color:rgb(57, 56, 56);">string</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |
| <font style="color:rgb(57, 56, 56);">errno</font> | <font style="color:rgb(57, 56, 56);">number</font> | <font style="color:rgb(57, 56, 56);">非必须</font> | | | |


  


## <font style="color:rgb(0, 0, 0);">更新记录</font>
| **更新时间** | **更新内容** |
| :---: | :---: |
| ** **<font style="color:#000000;">2025年</font>4月7日周一 | 接口 /open/authDeviceCode code_challenge 参数兼容调整，兼容 url safe |

