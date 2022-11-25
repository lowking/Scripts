/*
hifini签到-lowking-v1.0

按下面配置完之后，打开https://www.hifini.com/my.htm获取cookie

hostname = *.hifini.com

************************
Surge 4.2.0+ 脚本配置:
************************
[Script]
# > hifini签到
hifini签到cookie = type=http-request,pattern=https:\/\/www.hifini.com\/my.htm,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js
hifini签到 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js


************************
QuantumultX 本地脚本配置:
************************
[rewrite_local]
#hifini签到cookie
https:\/\/www.hifini.com\/my.htm url script-request-header https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js

[task_local]
0 10 0 * * ? https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js


************************
LOON 本地脚本配置:
************************

[Script]
http-request https:\/\/www.hifini.com\/my.htm script-path=https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js, timeout=10, tag=hifini签到cookie
cron "0 10 0 * * ?" script-path=https://raw.githubusercontent.com/lowking/Scripts/master/hifini/hifiniSign.js, tag=hifini签到

*/

const lk = new ToolKit(`hifini签到`, `HifiniSignIn`)
const hifiniCookieKey = 'lkHifiniCookieKey'
const hifiniIsTakeTheFirst = 'lkHifiniIsTakeTheFirst'
const hifiniTakeTheFirstCount = 'lkHifiniTakeTheFirstCount'
const hifiniRunType = 'lkHifiniRunType'
const hifiniSec = 'lkHifiniSec'
const hifiniMsec = 'lkHifiniMsec'
const timeIntervalKey = 'lkHifiniTimeInterval'
const hifiniCookie = !lk.getVal(hifiniCookieKey) ? '' : lk.getVal(hifiniCookieKey)
const isTakeTheFirst = !lk.getVal(hifiniIsTakeTheFirst) ? false : JSON.parse(lk.getVal(hifiniIsTakeTheFirst))
const takeTheFirstCount = !lk.getVal(hifiniTakeTheFirstCount) ? 20 : lk.getVal(hifiniTakeTheFirstCount)
const runType = !lk.getVal(hifiniRunType) ? "1" : lk.getVal(hifiniRunType)
const sec = !lk.getVal(hifiniSec) ? 59 : lk.getVal(hifiniSec)
const msec = !lk.getVal(hifiniMsec) ? 0 : lk.getVal(hifiniMsec)
const timeInterval = !lk.getVal(timeIntervalKey) ? 100 : lk.getVal(timeIntervalKey)

if (!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        // 构建boxjs数据写入订阅
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/hifinisignin-dark.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/hifinisignin.png"
            ],
            "settings": [
                {
                    "id": hifiniCookieKey,
                    "name": "hifini cookie",
                    "val": "",
                    "type": "text",
                    "desc": "hifini cookie"
                }, {
                    "id": hifiniIsTakeTheFirst,
                    "name": "是否抢签到第一",
                    "val": false,
                    "type": "boolean",
                    "desc": "默认关闭"
                }, {
                    "id": hifiniTakeTheFirstCount,
                    "name": "抢签到第一并发数",
                    "val": 20,
                    "type": "number",
                    "desc": "默认20"
                }, {
                    "id": hifiniSec,
                    "name": "抢签到等待至xx秒",
                    "val": 59,
                    "type": "number",
                    "desc": "默认59s"
                }, {
                    "id": hifiniMsec,
                    "name": "抢签到等待至xxx毫秒",
                    "val": 0,
                    "type": "number",
                    "desc": "默认0ms"
                }, {
                    "id": timeIntervalKey,
                    "name": "设定固定时间间隔",
                    "val": 100,
                    "type": "number",
                    "desc": "默认100ms"
                }, {
                    "id": hifiniRunType,
                    "name": "运行脚本方式",
                    "val": "1",
                    "type": "radios",
                    "items": [
                        {
                            "key": "1",
                            "label": "并发执行"
                        },
                        {
                            "key": "2",
                            "label": "顺序执行"
                        },
                        {
                            "key": "3",
                            "label": "固定时间间隔顺序执行"
                        }
                    ],
                    "desc": "默认并发执行"
                }
            ],
            "keys": [hifiniCookieKey]
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/hifini/hifiniSign.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all()
    }
}

function getCookie() {
    if (lk.isGetCookie(/\/my.htm/)) {
        if ($request.headers.hasOwnProperty('Cookie')) {
            lk.setVal(hifiniCookieKey, $request.headers.Cookie)
            lk.appendNotifyInfo('🎉成功获取hifini签到cookie，可以关闭相应脚本')
        } else {
            lk.appendNotifyInfo('❌获取hifini签到cookie失败')
        }
        lk.msg('')
    }
}

async function all() {
    if (hifiniCookie == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先先根据脚本注释获取cookie`)
    } else {
        let now = new Date()
        if (isTakeTheFirst && now.getHours() == 23) {
            // 如果时间是23点，就等待0点的时候再继续
            if (now.getMinutes() > 57) {
                while (1) {
                    if (now.getHours() != 23 || (now.getSeconds() >= sec && now.getMilliseconds() >= msec)) {
                        lk.log("跳出等待")
                        break
                    }
                    lk.log("等待中。。。")
                    await lk.sleep(100)
                    now = new Date()
                }
            }
            let execArr = []
            // 尝试同时请求20次，抢签到第一
            for (let i = 0; i < takeTheFirstCount; i++) {
                if (runType == "1") {
                    // 并发执行
                    execArr.push(signIn())
                } else if (runType == "2") {
                    // 顺序执行
                    let res = await signIn()
                    if (res.indexOf("suc") > -1) {
                        lk.execStatus = true
                        lk.appendNotifyInfo([res.substring(3)], 1)
                        break
                    }
                } else if (runType == "3") {
                    // 固定间隔时间执行
                    let finalTimeInterval = timeInterval * i
                    execArr.push(new Promise((resolve, reject) => {
                        setTimeout(async function () {
                            resolve(await signIn())
                        }, finalTimeInterval)
                    }))
                }
            }
            if (runType == "1" || runType == "3") {
                await Promise.all(execArr).then(async (res) => {
                    console.log(`${res}`)
                    let sucList = res.filter(str => {
                        return str !== undefined && str.indexOf("suc") != -1
                    })
                    // 只要有一个成功，就算成功
                    if (sucList.length >= 1) {
                        lk.execStatus = true
                        // 获取返回排名最靠前的
                        const regExp = new RegExp("排名(\\d+)", '')
                        let m
                        let min = 9999999
                        let minStr = sucList[0].substring(3)
                        sucList.forEach((info) => {
                            if ((m = regExp.exec(info + "")) !== null) {
                                let number = Number(m[1])
                                if (number < min) {
                                    min = number
                                    minStr = info.substring(3)
                                }
                            }
                        })
                        lk.appendNotifyInfo([minStr], 1)
                    } else {
                        lk.execFail()
                    }
                })
            }
        } else {
            await signIn()
        }
    }
    lk.msg(``)
    lk.done()
}

function signIn() {
    return new Promise((resolve, reject) => {
        lk.log("开始签到")
        const t = '签到'
        let url = {
            url: 'https://www.hifini.com/sg_sign.htm',
            headers: {
                cookie: hifiniCookie,
                "User-Agent": lk.userAgent
            }
        }
        lk.post(url, (error, response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let msg = data.split(`<h4 class="card-title text-center mb-0">`)[1].split(`</i>`)[1].split("<")[0]
                    if (msg) {
                        lk.appendNotifyInfo(`🎉${msg.trim()}`)
                        lk.log(msg.trim())
                        resolve(`suc🎉${msg.trim()}`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(data)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
                resolve(`fail`)
            } finally {
                resolve()
            }
        })
    })
}

//ToolKit-start
function ToolKit(t,s,i){return new class{constructor(t,s,i){this.tgEscapeCharMapping={"&":"＆","#":"＃"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=s;this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=i;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.startTime=(new Date).getTime();this.node=(()=>{if(this.isNode()){const t=require("request");return{request:t}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(t){if(this.isNode()){let s=process.argv.slice(1,2)[0].split("/");s[s.length-1]=t;return s.join("/")}return t}async execComm(){if(this.isNode()){this.comm=process.argv.slice(1);let t=false;if(this.comm[1]=="p"){this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到手机测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.9:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){t=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!t){this.callApi(this.comm[2])}}}}callApi(t){let s=this.comm[0];this.log(`获取【${s}】内容传给手机`);let i="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const e=this.path.resolve(s);const o=this.path.resolve(process.cwd(),s);const h=this.fs.existsSync(e);const r=!h&&this.fs.existsSync(o);if(h||r){const t=h?e:o;try{i=this.fs.readFileSync(t)}catch(t){i=""}}else{i=""}let n={url:`http://${this.options.httpApi.split("@")[1]}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${i}`,mock_type:"cron",timeout:!this.isEmpty(t)&&t>5?t:5},json:true};this.post(n,(t,i,e)=>{this.log(`已将脚本【${s}】发给手机！`);this.done()})}getCallerFileNameAndLine(){let t;try{throw Error("")}catch(s){t=s}const s=t.stack;const i=s.split("\n");let e=1;if(e!==0){const t=i[e];this.path=this.path?this.path:require("path");return`[${t.substring(t.lastIndexOf(this.path.sep)+1,t.lastIndexOf(":"))}]`}else{return"[-]"}}getFunName(t){var s=t.toString();s=s.substr("function ".length);s=s.substr(0,s.indexOf("("));return s}boxJsJsonBuilder(t,s){if(this.isNode()){if(!this.isJsonObject(t)||!this.isJsonObject(s)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}this.log("using node");let i=["settings","keys"];const e="https://raw.githubusercontent.com/Orz-3";let o={};let h="#lk{script_url}";if(s&&s.hasOwnProperty("script_url")){h=this.isEmpty(s["script_url"])?"#lk{script_url}":s["script_url"]}o.id=`${this.prefix}${this.id}`;o.name=this.name;o.desc_html=`⚠️使用说明</br>详情【<a href='${h}?raw=true'><font class='red--text'>点我查看</font></a>】`;o.icons=[`${e}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${e}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];o.keys=[];o.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];o.author="#lk{author}";o.repo="#lk{repo}";o.script=`${h}?raw=true`;if(!this.isEmpty(t)){for(let s in i){let e=i[s];if(!this.isEmpty(t[e])){if(e==="settings"){for(let s=0;s<t[e].length;s++){let i=t[e][s];for(let t=0;t<o.settings.length;t++){let s=o.settings[t];if(i.id===s.id){o.settings.splice(t,1)}}}}o[e]=o[e].concat(t[e])}delete t[e]}}Object.assign(o,t);if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.boxJsJsonFile);const i=this.path.resolve(process.cwd(),this.boxJsJsonFile);const e=this.fs.existsSync(t);const h=!e&&this.fs.existsSync(i);const r=JSON.stringify(o,null,"\t");if(e){this.fs.writeFileSync(t,r)}else if(h){this.fs.writeFileSync(i,r)}else{this.fs.writeFileSync(t,r)}let n="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(s.hasOwnProperty("target_boxjs_json_path")){n=s["target_boxjs_json_path"]}let a=JSON.parse(this.fs.readFileSync(n));if(a.hasOwnProperty("apps")&&Array.isArray(a["apps"])&&a["apps"].length>0){let t=a.apps;let i=t.indexOf(t.filter(t=>{return t.id==o.id})[0]);if(i>=0){a.apps[i]=o}else{a.apps.push(o)}let e=JSON.stringify(a,null,2);if(!this.isEmpty(s)){for(const t in s){let i="";if(s.hasOwnProperty(t)){i=s[t]}else if(t==="author"){i="@lowking"}else if(t==="repo"){i="https://github.com/lowking/Scripts"}e=e.replace(`#lk{${t}}`,i)}}const h=/(?:#lk\{)(.+?)(?=\})/;let r=h.exec(e);if(r!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L18传入参数：\n`)}let l=new Set;while((r=h.exec(e))!==null){l.add(r[1]);e=e.replace(`#lk{${r[1]}}`,``)}l.forEach(t=>{console.log(`${t} `)});this.fs.writeFileSync(n,e)}}}}isJsonObject(t){return typeof t=="object"&&Object.prototype.toString.call(t).toLowerCase()=="[object object]"&&!t.length}appendNotifyInfo(t,s){if(s==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(t){return new Promise(s=>setTimeout(s,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}logErr(t){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}msg(t,s,i,e){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){}else{if(this.isEmpty(s)){if(Array.isArray(this.notifyInfo)){s=this.notifyInfo.join("\n")}else{s=this.notifyInfo}}if(!this.isEmpty(s)){if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let t in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(t)){continue}s=s.replace(t,this.tgEscapeCharMapping[t])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${s}`)},(t,s,i)=>{this.log(`Tg通知完毕`)})}else{let o={};const h=!this.isEmpty(i);const r=!this.isEmpty(e);if(this.isQuanX()){if(h)o["open-url"]=i;if(r)o["media-url"]=e;$notify(this.name,t,s,o)}if(this.isSurge()){if(h)o["url"]=i;$notification.post(this.name,t,s,o)}if(this.isNode())this.log("⭐️"+this.name+t+s);if(this.isJSBox())$push.schedule({title:this.name,body:t?t+"\n"+s:s})}}}}getVal(t){if(this.isSurge()||this.isLoon()){return $persistentStore.read(t)}else if(this.isQuanX()){return $prefs.valueForKey(t)}else if(this.isNode()){this.data=this.loadData();return this.data[t]}else{return this.data&&this.data[t]||null}}setVal(t,s){if(this.isSurge()||this.isLoon()){return $persistentStore.write(s,t)}else if(this.isQuanX()){return $prefs.setValueForKey(s,t)}else if(this.isNode()){this.data=this.loadData();this.data[t]=s;this.writeData();return true}else{return this.data&&this.data[t]||null}}loadData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);if(i||e){const e=i?t:s;try{return JSON.parse(this.fs.readFileSync(e))}catch(t){return{}}}else return{}}else return{}}writeData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);const o=JSON.stringify(this.data);if(i){this.fs.writeFileSync(t,o)}else if(e){this.fs.writeFileSync(s,o)}else{this.fs.writeFileSync(t,o)}}}adapterStatus(t){if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t}get(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon())$httpClient.get(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)});if(this.isNode()){this.node.request(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.get(t)}}post(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()){$httpClient.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){this.node.request.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}put(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="PUT";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()){t.method="PUT";$httpClient.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){t.method="PUT";this.node.request.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}costTime(){let t=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){t=`指令【${this.comm[1]}】执行完毕！`}const s=(new Date).getTime();const i=s-this.startTime;const e=i/1e3;this.execCount++;this.costTotalMs+=i;this.log(`${t}耗时【${e}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(t={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()){$done(t)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(t){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(t))}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"||t=="undefined"||t.length===0}randomString(t){t=t||32;var s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=s.length;var e="";for(let o=0;o<t;o++){e+=s.charAt(Math.floor(Math.random()*i))}return e}autoComplete(t,s,i,e,o,h,r,n,a,l){t+=``;if(t.length<o){while(t.length<o){if(h==0){t+=e}else{t=e+t}}}if(r){let s=``;for(var f=0;f<n;f++){s+=l}t=t.substring(0,a)+s+t.substring(n+a)}t=s+t+i;return this.toDBC(t)}customReplace(t,s,i,e){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(e)){e="}"}for(let o in s){t=t.replace(`${i}${o}${e}`,s[o])}}catch(t){this.logErr(t)}return t}toDBC(t){var s="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){s=s+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){s=s+String.fromCharCode(t.charCodeAt(i)+65248)}}return s}hash(t){let s=0,i,e;for(i=0;i<t.length;i++){e=t.charCodeAt(i);s=(s<<5)-s+e;s|=0}return String(s)}formatDate(t,s){let i={"M+":t.getMonth()+1,"d+":t.getDate(),"H+":t.getHours(),"m+":t.getMinutes(),"s+":t.getSeconds(),"q+":Math.floor((t.getMonth()+3)/3),S:t.getMilliseconds()};if(/(y+)/.test(s))s=s.replace(RegExp.$1,(t.getFullYear()+"").substr(4-RegExp.$1.length));for(let t in i)if(new RegExp("("+t+")").test(s))s=s.replace(RegExp.$1,RegExp.$1.length==1?i[t]:("00"+i[t]).substr((""+i[t]).length));return s}}(t,s,i)}
//ToolKit-end
