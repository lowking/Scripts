/*
机场订阅转化器，用于提取节点
一般机场支持UA识别返回相应格式的订阅文件，但很多是傻瓜式配置，包含了很多规则，此脚本用于提取纯节点，避免使用别人搭建的api
可用boxjs修改截取的前缀和后缀，或修改脚本prefix、suffix的值

⚠️使用转换器需手动开启，并且添加自己机场的houstname到MITM
*/

// 是否开启输出
const lk = nobyda()
const isEnable = !lk.getVal('lkIsEnableSubConverter') ? false : JSON.parse(lk.getVal('lkIsEnableSubConverter'))
const isEnableLog = !lk.getVal('lkIsEnableLogSubConverter') ? false : JSON.parse(lk.getVal('lkIsEnableLogSubConverter'))
const prefix = !lk.getVal('lkPrefixSubConverter') ? `[Proxy]` : lk.getVal('lkPrefixSubConverter')
const suffix = !lk.getVal('lkSuffixSubConverter') ? `[Proxy Group]` : lk.getVal('lkSuffixSubConverter')
const url = $request.url
let body = $response.body

if (isEnable && body.indexOf(prefix) != -1 && body.indexOf(suffix) != -1) {
    try {
        lk.log(`开始转换订阅： ${url}\n██内容：${JSON.stringify(body)}`)
        const pattern = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/;// 匹配/**/注释块
        const converted = body.substring(body.indexOf(prefix) + prefix.length, body.indexOf(suffix)).replace(pattern, ``)
        lk.log(`转换成功\n██内容：${converted}██`)
        lk.msg(`订阅转换器`, ``, `转换成功🎉`)
        lk.done({body: converted})
    } catch (e) {
        lk.msg(`订阅转换器`, ``, `转换失败❌，使用原始数据`)
        lk.done({body: body})
    }
} else {
    lk.msg(`订阅转换器`, ``, `未转换，使用原始数据`)
    lk.done({body: body})
}

function nobyda(){const t=Date.now();const e=typeof $request!="undefined";const n=typeof $httpClient!="undefined";const o=typeof $task!="undefined";const s=typeof $app!="undefined"&&typeof $http!="undefined";const r=typeof require=="function"&&!s;const i=(()=>{if(r){const t=require("request");return{request:t}}else{return null}})();const f=(t,e,i)=>{if(o)$notify(t,e,i);if(n)$notification.post(t,e,i);if(r)c(t+e+i);if(s)$push.schedule({title:t,body:e?e+"\n"+i:i})};const u=(t,e)=>{if(o)return $prefs.setValueForKey(e,t);if(n)return $persistentStore.write(e,t)};const l=t=>{if(o)return $prefs.valueForKey(t);if(n)return $persistentStore.read(t)};const d=t=>{if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t};const a=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n)$httpClient.get(t,(t,n,o)=>{e(t,d(n),o)});if(r){i.request(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.get(t)}};const p=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n){$httpClient.post(t,(t,n,o)=>{e(t,d(n),o)})}if(r){i.request.post(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.post(t)}};const c=t=>{if(isEnableLog)console.log(`\n██${t}`)};const y=()=>{const e=((Date.now()-t)/1e3).toFixed(2);return console.log(`\n██用时：${e}秒`)};const $=(t={})=>{if(o)e?$done(t):null;if(n)e?$done(t):$done()};return{isRequest:e,isJSBox:s,isNode:r,msg:f,setValueForKey:u,getVal:l,get:a,post:p,log:c,time:y,done:$}}