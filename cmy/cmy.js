/*
CMY机场签到-lowking-v1.0

⚠️需要订阅BoxJs之后填写帐号密码

hostname = cmy.network

************************
Surge 4.2.0+ 脚本配置:
************************
[Script]
# > CMY机场签到
朴朴签到cookie = type=http-request,pattern=https:\/\/cmy.network\/api\/user,script-path=https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js
CMY机场签到 = type=cron,cronexp="0 0 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js




************************
QuantumultX 脚本配置:
************************

[rewrite_local]
#朴朴签到cookie
https:\/\/cmy.network\/api\/user url script-request-header https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js

[task_local]
0 0 0 * * ? https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js




************************
LOON 脚本配置:
************************
[Script]
http-request https:\/\/cmy.network\/api\/user script-path=https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js, timeout=10, tag=朴朴签到cookie
cron "0 0 0 * * *" script-path=https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js, tag=CMY机场签到

*/
var token = ''
const lk = new ToolKit(`CMY机场签到`, `CmyCheckin`)
const cmyCookieKey = 'lkCmyCheckinCookie'
const cmyCookie = !lk.getVal(cmyCookieKey) ? '' : lk.getVal(cmyCookieKey)

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            keys: ["lkCmyCheckinCookie", "lkCmyCheckinLoginId", "lkCmyCheckinPassword"],
            settings:[
                {
                    "id": "lkCmyCheckinCookie",
                    "name": "cookie",
                    "val": "",
                    "type": "text",
                    "desc": "cookie"
                },
                {
                    "id": "lkCmyCheckinLoginId",
                    "name": "账号",
                    "val": "",
                    "type": "text",
                    "desc": "账号"
                },
                {
                    "id": "lkCmyCheckinPassword",
                    "name": "密码",
                    "val": "",
                    "type": "text",
                    "desc": "密码"
                }
            ],
            icons: [
                "https://cmy.network/favicon.ico",
                "https://cmy.network/favicon.ico"
            ],
            script: "https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js?type=raw",
            desc_html: "⚠️使用说明</br>详情【<a href='https://raw.githubusercontent.com/lowking/Scripts/personal/cmy/cmy.js?raw=true'><font class='red--text'>点我查看</font></a>】"
        })
        all()
    }
}

function getCookie() {
    if (lk.isGetCookie(/cmy\.network\/api\/user/)) {
        if ($request.headers.hasOwnProperty('access-token')) {
            lk.setVal(cmyCookieKey, JSON.stringify($request.headers))
            lk.appendNotifyInfo('🎉成功获取CMY-Cookie，可以关闭相应脚本')
        } else {
            lk.appendNotifyInfo('❌获取CMY-Cookie失败')
        }
        lk.msg('')
    }
}

async function all() {
    let result = ""
    if (!lk.isEmpty(cmyCookie)) {
        result = await login()
    }
    lk.log(`test${result}`)
    if (result == "ok") {
        await checkIn()
    }
    lk.msg(``)
    lk.done()
}

function login(type) {
    return new Promise( (resolve, reject) => {
        let loginId = lk.getVal("lkCmyCheckinLoginId")
        let pwd = lk.getVal("lkCmyCheckinPassword")
        let loginUrl = {
            url: `https://cmy.network/api/auth/login`,
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7,ja;q=0.6",
                "content-type": "application/json;charset=UTF-8",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
            },
            body: JSON.stringify({
                "email": loginId,
                "passwd": pwd,
                "remember_me": false
            })
        }
        lk.log(JSON.stringify(loginUrl))
        lk.post(loginUrl, async (error, response, data) => {
            try {
                lk.log(data)
                const result = JSON.parse(data)
                if (result.ret == 1) {
                    //登录成功，调用签到
                    token = result.data.token
                    lk.log(`登录成功，token：${token}`)
                    lk.execStatus = true
                    resolve("ok")
                } else {
                    lk.log(result.msg)
                    lk.appendNotifyInfo(`❌登录失败：${result.msg}`)
                    lk.execFail()
                    resolve("fail")
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`登录异常：${data}`)
                lk.execFail()
                resolve("fail")
            }
        })
    })
}

async function checkIn(count = 0) {
    return new Promise(async (resolve, reject) => {
        let checkInUrl = {
            url: `https://cmy.network/api/checkin`,
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7,ja;q=0.6",
                "access-token": token,
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            }
        }
        lk.log(JSON.stringify(checkInUrl))
        lk.get(checkInUrl, async (error, response, data) => {
            try {
                lk.log(data)
                const result = JSON.parse(data)
                if (result.ret == 1) {
                    //签到成功
                    lk.appendNotifyInfo(`🎉签到${result.msg}\n今天使用：${result.trafficInfo.todayUsedTraffic}\n总共使用：${result.trafficInfo.lastUsedTraffic}\n剩余流量：${result.trafficInfo.unUsedTraffic}`)
                    lk.log(`签到成功`)
                    lk.setVal(cmyCookieKey, JSON.stringify(checkInUrl.headers))
                } else if (result.ret == 0) {
                    //签到成功
                    lk.appendNotifyInfo(`🔁${result.msg}`)
                    lk.log(`重复签到`)
                    lk.setVal(cmyCookieKey, JSON.stringify(checkInUrl.headers))
                } else {
                    lk.appendNotifyInfo(`❌签到失败：${result.msg}`)
                    lk.setVal(cmyCookieKey, "")
                    if (count > 0) {
                        lk.execFail()
                        resolve()
                    } else {
                        count++
                        let result = await login()
                        if (result == "ok") {
                            await checkIn(count)
                        }
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`签到返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌签到失败，请带上日志联系作者`)
            } finally {
                resolve()
            }
        })
    })
}

//ToolKit-start
function ToolKit(t,s,i){return new class{constructor(t,s,i){this.tgEscapeCharMapping={"&":"＆"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=s;this.data=null;this.dataFile=`${this.prefix}${this.id}.dat`;this.boxJsJsonFile=`${this.prefix}${this.id}.boxjs.json`;this.options=i;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.startTime=(new Date).getTime();this.node=(()=>{if(this.isNode()){const t=require("request");return{request:t}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.log(`${this.name}, 开始执行!`);this.execComm()}async execComm(){if(this.isNode()){this.comm=process.argv.slice(2);let t=false;if(this.comm[0]=="p"){this.isExecComm=true;this.log(`开始执行指令【${this.comm[0]}】=> 发送到手机测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.9:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){t=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!t){await this.callApi(this.comm[1])}}}}callApi(t){let s=this.getCallerFileNameAndLine().split(":")[0].replace("[","");this.log(`获取【${s}】内容传给手机`);let i="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const e=this.path.resolve(s);const h=this.path.resolve(process.cwd(),s);const o=this.fs.existsSync(e);const r=!o&&this.fs.existsSync(h);if(o||r){const t=o?e:h;try{i=this.fs.readFileSync(t)}catch(t){i=""}}else{i=""}let n={url:`http://${this.options.httpApi.split("@")[1]}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${i}`,mock_type:"cron",timeout:!this.isEmpty(t)&&t>5?t:5},json:true};this.post(n,(t,i,e)=>{this.log(`已将脚本【${s}】发给手机！`);this.done()})}getCallerFileNameAndLine(){let t;try{throw Error("")}catch(s){t=s}const s=t.stack;const i=s.split("\n");let e=1;if(e!==0){const t=i[e];this.path=this.path?this.path:require("path");return`[${t.substring(t.lastIndexOf(this.path.sep)+1,t.lastIndexOf(":"))}]`}else{return"[-]"}}getFunName(t){var s=t.toString();s=s.substr("function ".length);s=s.substr(0,s.indexOf("("));return s}boxJsJsonBuilder(t){if(this.isNode()){this.log("using node");let s=["keys","settings"];const i="https://raw.githubusercontent.com/Orz-3";let e={};e.id=`${this.prefix}${this.id}`;e.name=this.name;e.desc_html="⚠️使用说明</br>详情【<a href='script_url?raw=true'><font class='red--text'>点我查看</font></a>】";e.icons=[`${i}/mini/master/${this.id.toLocaleLowerCase()}.png`,`${i}/task/master/${this.id.toLocaleLowerCase()}.png`];e.keys=[];e.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];e.author="@lowking";e.repo="https://github.com/lowking/Scripts";e.script="script_url?raw=true";if(!this.isEmpty(t)){for(let i in s){let h=s[i];if(!this.isEmpty(t[h])){e[h]=e[h].concat(t[h])}delete t[h]}}Object.assign(e,t);if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.boxJsJsonFile);const s=this.path.resolve(process.cwd(),this.boxJsJsonFile);const i=this.fs.existsSync(t);const h=!i&&this.fs.existsSync(s);const o=JSON.stringify(e,null,"\t");if(i){this.fs.writeFileSync(t,o)}else if(h){this.fs.writeFileSync(s,o)}else{this.fs.writeFileSync(t,o)}}}}appendNotifyInfo(t,s){if(s==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(t){return new Promise(s=>setTimeout(s,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}logErr(t){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}msg(t,s,i,e){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){}else{if(this.isEmpty(s)){if(Array.isArray(this.notifyInfo)){s=this.notifyInfo.join("\n")}else{s=this.notifyInfo}}if(!this.isEmpty(s)){if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let t in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(t)){continue}s=s.replace(t,this.tgEscapeCharMapping[t])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${s}`)},(t,s,i)=>{this.log(`Tg通知完毕`)})}else{let h={};const o=!this.isEmpty(i);const r=!this.isEmpty(e);if(this.isQuanX()){if(o)h["open-url"]=i;if(r)h["media-url"]=e;$notify(this.name,t,s,h)}if(this.isSurge()){if(o)h["url"]=i;$notification.post(this.name,t,s,h)}if(this.isNode())this.log("⭐️"+this.name+t+s);if(this.isJSBox())$push.schedule({title:this.name,body:t?t+"\n"+s:s})}}}}getVal(t){if(this.isSurge()||this.isLoon()){return $persistentStore.read(t)}else if(this.isQuanX()){return $prefs.valueForKey(t)}else if(this.isNode()){this.data=this.loadData();return this.data[t]}else{return this.data&&this.data[t]||null}}setVal(t,s){if(this.isSurge()||this.isLoon()){return $persistentStore.write(s,t)}else if(this.isQuanX()){return $prefs.setValueForKey(s,t)}else if(this.isNode()){this.data=this.loadData();this.data[t]=s;this.writeData();return true}else{return this.data&&this.data[t]||null}}loadData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);if(i||e){const e=i?t:s;try{return JSON.parse(this.fs.readFileSync(e))}catch(t){return{}}}else return{}}else return{}}writeData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);const h=JSON.stringify(this.data);if(i){this.fs.writeFileSync(t,h)}else if(e){this.fs.writeFileSync(s,h)}else{this.fs.writeFileSync(t,h)}}}adapterStatus(t){if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t}get(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge())$httpClient.get(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)});if(this.isNode()){this.node.request(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.get(t)}}post(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()){$httpClient.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){this.node.request.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}costTime(){let t=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){t=`指令【${this.comm[0]}】执行完毕！`}const s=(new Date).getTime();const i=s-this.startTime;const e=i/1e3;this.execCount++;this.costTotalMs+=i;this.log(`${t}耗时【${e}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(t){this.costTime();let s=`body`;if(this.isRequest()){if(this.isQuanX())s=`content`;if(this.isSurge())s=`body`}let i={};i[s]=t;if(this.isQuanX())this.isRequest()?$done(i):null;if(this.isSurge())this.isRequest()?$done(i):$done()}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(t){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(t))}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"||t=="undefined"||t.length===0}randomString(t){t=t||32;var s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=s.length;var e="";for(let h=0;h<t;h++){e+=s.charAt(Math.floor(Math.random()*i))}return e}autoComplete(t,s,i,e,h,o,r,n,a,l){t+=``;if(t.length<h){while(t.length<h){if(o==0){t+=e}else{t=e+t}}}if(r){let s=``;for(var f=0;f<n;f++){s+=l}t=t.substring(0,a)+s+t.substring(n+a)}t=s+t+i;return this.toDBC(t)}customReplace(t,s,i,e){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(e)){e="}"}for(let h in s){t=t.replace(`${i}${h}${e}`,s[h])}}catch(t){this.logErr(t)}return t}toDBC(t){var s="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){s=s+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){s=s+String.fromCharCode(t.charCodeAt(i)+65248)}}return s}}(t,s,i)}
//ToolKit-end