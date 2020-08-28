[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)
[![LICENSE](https://img.shields.io/badge/感谢-Orz3的图标-red.svg)](https://github.com/Orz-3)
# ToolKit使用说明
### 方法汇总
boxJsJsonBuilder(info)  
参数|描述
:---|:---
info|json结构对象，用于扩充生成boxjs的json配置

appendNotifyInfo(info, type)  
参数|描述
:---|:---
info|String，传入需要记录的通知内容
type|可选项，目前可以传入1，把传入的info覆盖之前记录的通知内容

prependNotifyInfo(info)  
参数|描述
:---|:---
info|传入字符串，传入需要记录的通知内容并前置到第一行

execFail()  
|描述
|:---
|在脚本异常的位置执行，用于记录脚本最终的执行结果（是否无异常执行成功）。用于开启"当只执行成功才通知"的时候，脚本执行成功不通知

isRequest()  
|返回结果|描述
|:---|:---
|Boolean|用于判断是否是请求

getRequestUrl()  
|描述
|:---
|获取请求的url

getResponseBody()  
|描述
|:---
|获取响应体

sleep(time)  
|参数|描述
|:---|:---
|time|传入数值，用于休眠，单位ms

log(message)  
|参数|描述
|:---|:---
|message|传入字符串，日志输出

logErr(message)  
|参数|描述
|:---|:---
|message|传入catch之后的exception

msg(subtitle, message)  
|参数|描述
|:---|:---
|subtitle|传入字符串，通知的副标题。当传入``，空字符串的时候，会通知之前appendNotifyInfo()的内容
|message|可选项，传入字符串，通知的内容

getVal(key)  
|参数|描述
|:---|:---
|key|传入字符串，获取持久化的数据值

setVal(key, val)  
|参数|描述
|:---|:---
|key|传入字符串，要持久化数据的key
|val|传入字符串，要持久化的数据

get(options, callback = () => {})  
|参数|描述
|:---|:---
|options|传入get请求体，结构可参考仓库其他脚本
|callback|回调函数

post(options, callback = () => {})  
|参数|描述
|:---|:---
|options|传入post请求体，结构可参考仓库其他脚本
|callback|回调函数

done(value)  
|参数|描述
|:---|:---
|value|传入需要回传给app的数据

isEmpty(obj)  
|参数|描述
|:---|:---
|obj|传入对象，用于判断是否为空

randomString(len)  
|参数|描述
|:---|:---
|len|传入数字，用于生成len长度的随机字符串，字符串由字母和数字组成

autoComplete(str, prefix, suffix, fill, len, direction, ifCode, clen, startIndex, cstr)  
|描述
|:---
|详情查看ToolKit.js源码

customReplace(str, param, prefix, suffix)  
|描述
|:---
|详情查看ToolKit.js源码

### 部分说明
1.pc发送脚本至ios surge调试   
写法参考[ToolKitDemo](https://github.com/lowking/Scripts/blob/master/util/example/useToolKitDemo.js)，之后就可以在脚本所在的目录下执行```node ToolKitDemo.js p```，记得命令尾巴加空格p，如需重新设置脚本超时可以在后面再加入空格数字``` 10```，修改超时时间为10秒

2.生成boxjs配置json  
执行```node ToolKitDemo.js```可在当前目录下生成BoxJs配置文件（需要脚本调用boxJsJsonBuilder方法），详细实现可以查看ToolKit中的boxJsJsonBuilder方法
