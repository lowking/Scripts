/*
阿里云盘签到-lowking-v1.1.0

按下面配置完之后，打开阿里云盘获取token（如获取不到，等一段时间再打开），下面配置只验证过surge的，其他的自行测试
⚠️只测试过surge没有其他app自行测试

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 阿里云盘签到
https://auth.aliyundrive.com/v2/account/token
阿里云盘签到cookie = requires-body=1,type=http-response,pattern=https:\/\/auth.aliyundrive.com\/v2\/account\/token,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/ali/aliYunPanCheckIn.js
阿里云盘签到 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/ali/aliYunPanCheckIn.js

[MITM]
hostname = %APPEND% auth.aliyundrive.com
*/
const lk = new ToolKit(`阿里云盘签到`, `AliYunPanCheckIn`, {"httpApi": "ffff@10.0.0.19:6166"})
const aliYunPanTokenKey = 'lkAliYunPanTokenKey'
let aliYunPanToken = lk.getVal(aliYunPanTokenKey, '')
const aliYunPanRefreshTokenKey = 'lkAliYunPanRefreshTokenKey'
let aliYunPanRefreshToken = lk.getVal(aliYunPanRefreshTokenKey, '')
const checkSignInRepeatKey = 'aliYunPanSignInRepeat'
const checkSignInRepeat = lk.getVal(checkSignInRepeatKey, '')
const joinTeamRepeatKey = 'aliYunPanJoinTeamRepeat'
const joinTeamRepeat = lk.getVal(joinTeamRepeatKey, -1)
lk.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 D/C501C6D2-FAF6-4DA8-B65B-7B8B392901EB"

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/aliYunPana.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/aliYunPan.png"
            ],
            "settings": [
                {
                    "id": aliYunPanTokenKey,
                    "name": "阿里云盘token",
                    "val": "",
                    "type": "text",
                    "desc": "阿里云盘token"
                }, {
                    "id": aliYunPanRefreshTokenKey,
                    "name": "阿里云盘refresh_token",
                    "val": "",
                    "type": "text",
                    "desc": "阿里云盘refresh_token"
                }
            ],
            "keys": [aliYunPanTokenKey, aliYunPanRefreshTokenKey]
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/ali/aliYunPanCheckIn.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all()
    }
}

function getCookie() {
    if (lk.isGetCookie(/\/v2\/account\/token/)) {
        lk.log(`开始获取cookie`)
        let data = lk.getResponseBody()
        // lk.log(`获取到的cookie：${data}`)
        try {
            data = JSON.parse(data)
            let refreshToken = data["refresh_token"]
            if (refreshToken) {
                lk.setVal(aliYunPanRefreshTokenKey, refreshToken)
                lk.appendNotifyInfo('🎉成功获取阿里云盘refresh_token，可以关闭相应脚本')
            } else {
                lk.execFail()
                lk.appendNotifyInfo('❌获取阿里云盘token失败，请稍后再试')
            }
        } catch (e) {
            lk.execFail()
            lk.appendNotifyInfo('❌获取阿里云盘token失败')
        }
        lk.msg('')
    }
}

async function all() {
    let hasNeedSendNotify = true
    if (aliYunPanRefreshToken == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先打开阿里云盘登录获取refresh_token`)
    } else {
        await refreshToken()
        let hasAlreadySignIn = await signIn()
        await joinTeam()
    }
    if (hasNeedSendNotify) {
        lk.msg(``)
    }
    lk.done()
}

function refreshToken() {
    return new Promise((resolve, _reject) => {
        const t = '获取token'
        let url = {
            url: 'https://auth.aliyundrive.com/v2/account/token',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                "grant_type": "refresh_token",
                "app_id": "pJZInNHN2dZWk8qg",
                "refresh_token": aliYunPanRefreshToken
            })
        }
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.hasOwnProperty("refresh_token")) {
                        aliYunPanToken = `Bearer ${dataObj["access_token"]}`
                        aliYunPanRefreshToken = dataObj["refresh_token"]
                        lk.setVal(aliYunPanTokenKey, aliYunPanToken)
                        lk.setVal(aliYunPanRefreshTokenKey, aliYunPanRefreshToken)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(dataObj.message)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`阿里云盘${t}返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function getReward(day) {
    return new Promise((resolve, _reject) => {
        const t = '领取奖励'
        let url = {
            url: 'https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile',
            headers: {
                "Content-Type": "application/json",
                Authorization: aliYunPanToken,
                "User-Agent": lk.userAgent
            },
            body: JSON.stringify({
                "signInDay": day
            })
        }
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌第${day}天${t}失败，请稍后再试`)
                } else {
                    lk.log(data)
                    let dataObj = JSON.parse(data)
                    if (dataObj.success) {
                        lk.appendNotifyInfo(`✓${t}(第${day}天)，${dataObj?.result?.notice}`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(`❌第${day}天${t}失败，${dataObj.message}`)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`阿里云盘${t}返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌第${day}天${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function doJoinTeam(joinTeamId) {
    return new Promise(async (resolve, _reject) => {
        const t = '加入队伍'
        let url = {
            url: 'https://member.aliyundrive.com/v1/activity/sign_in_team_pk?_rx-s=mobile',
            headers: {
                "Content-Type": "application/json",
                Authorization: aliYunPanToken,
                "User-Agent": lk.userAgent
            },
            body: JSON.stringify({
                id: joinTeamId,
                team: "blue"
            })
        }
        lk.post(url, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (!dataObj.success) {
                        lk.execFail()
                        lk.prependNotifyInfo(dataObj.message)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`阿里云盘${t}返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function joinTeam(layer = 0) {
    return new Promise(async (resolve, _reject) => {
        let firstDayOfYear = new Date(lk.now.getFullYear(), 0, 1)
        const weekOfYear = Math.ceil((Math.round((lk.now.valueOf() - firstDayOfYear.valueOf()) / 86400000) + ((firstDayOfYear.getDay() + 1) - 1)) / 7)
        // if (joinTeamRepeat == weekOfYear) {
        // }
        const t = '加入PK'
        let url = {
            url: 'https://member.aliyundrive.com/v1/activity/sign_in_team?_rx-s=mobile',
            headers: {
                "Content-Type": "application/json",
                Authorization: aliYunPanToken,
                "User-Agent": lk.userAgent
            },
            body: JSON.stringify({})
        }
        lk.post(url, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.success) {
                        let joinedTeam = dataObj?.result?.joinTeam
                        let joinTeamId = dataObj?.result?.id
                        if (joinedTeam && joinTeamId) {
                            lk.appendNotifyInfo(`🎉${t}成功\n${dataObj?.result?.period}：${dataObj?.result?.joinCount}(${dataObj?.result[joinedTeam + "WinRate"]})`)
                            lk.setVal(joinTeamRepeatKey, JSON.stringify(weekOfYear))
                        } else {
                            if (layer === 0) {
                                await doJoinTeam(joinTeamId)
                                await joinTeam(++layer)
                            } else {
                                lk.log(`请求加入队伍异常：${data}`)
                            }
                        }
                    } else {
                        lk.execFail()
                        lk.prependNotifyInfo(dataObj.message)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`阿里云盘${t}返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function signIn() {
    return new Promise(async (resolve, _reject) => {
        let nowString = lk.formatDate(new Date(), 'yyyyMMdd')
        if (nowString == checkSignInRepeat) {
            lk.prependNotifyInfo('今日已经签到，无法重复签到～～')
            resolve(1)
            return
        }
        const t = '签到'
        let url = {
            url: 'https://member.aliyundrive.com/v1/activity/sign_in_list',
            headers: {
                "Content-Type": "application/json",
                Authorization: aliYunPanToken,
                "User-Agent": lk.userAgent
            },
            body: JSON.stringify({})
        }
        lk.post(url, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.success) {
                        let prefix = ""
                        if (dataObj?.result?.signInLogs.length > 0) {
                            for (const l of dataObj.result.signInLogs) {
                                if (l?.status != "miss") {
                                    prefix = `第${l?.day}天`
                                    if (!l?.isReward) {
                                        await getReward(l?.day)
                                    }
                                }
                            }
                        }
                        lk.prependNotifyInfo(`🎉${prefix}${t}成功`)
                        lk.setVal(checkSignInRepeatKey, nowString)
                    } else {
                        lk.execFail()
                        lk.prependNotifyInfo(dataObj.message)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`阿里云盘${t}返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

//ToolKit-start
function ToolKit(t,s,i){return new class{constructor(t,s,i){this.tgEscapeCharMapping={"&":"＆","#":"＃"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=s;this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=i;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const t=require("request");return{request:t}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(t){if(this.isNode()){let s=process.argv.slice(1,2)[0].split("/");s[s.length-1]=t;return s.join("/")}return t}async execComm(){if(this.isNode()){this.comm=process.argv.slice(1);let t=false;if(this.comm[1]=="p"){this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到手机测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.9:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){t=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!t){this.callApi(this.comm[2])}}}}callApi(t){let s=this.comm[0];this.log(`获取【${s}】内容传给手机`);let i="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const e=this.path.resolve(s);const o=this.path.resolve(process.cwd(),s);const h=this.fs.existsSync(e);const r=!h&&this.fs.existsSync(o);if(h||r){const t=h?e:o;try{i=this.fs.readFileSync(t)}catch(t){i=""}}else{i=""}let n={url:`http://${this.options.httpApi.split("@")[1]}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${i}`,mock_type:"cron",timeout:!this.isEmpty(t)&&t>5?t:5},json:true};this.post(n,(t,i,e)=>{this.log(`已将脚本【${s}】发给手机！`);this.done()})}getCallerFileNameAndLine(){let t;try{throw Error("")}catch(s){t=s}const s=t.stack;const i=s.split("\n");let e=1;if(e!==0){const t=i[e];this.path=this.path?this.path:require("path");return`[${t.substring(t.lastIndexOf(this.path.sep)+1,t.lastIndexOf(":"))}]`}else{return"[-]"}}getFunName(t){var s=t.toString();s=s.substr("function ".length);s=s.substr(0,s.indexOf("("));return s}boxJsJsonBuilder(t,s){if(this.isNode()){let i="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(s&&s.hasOwnProperty("target_boxjs_json_path")){i=s["target_boxjs_json_path"]}if(!this.fs.existsSync(i)){return}if(!this.isJsonObject(t)||!this.isJsonObject(s)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}this.log("using node");let e=["settings","keys"];const o="https://raw.githubusercontent.com/Orz-3";let h={};let r="#lk{script_url}";if(s&&s.hasOwnProperty("script_url")){r=this.isEmpty(s["script_url"])?"#lk{script_url}":s["script_url"]}h.id=`${this.prefix}${this.id}`;h.name=this.name;h.desc_html=`⚠️使用说明</br>详情【<a href='${r}?raw=true'><font class='red--text'>点我查看</font></a>】`;h.icons=[`${o}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${o}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];h.keys=[];h.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];h.author="#lk{author}";h.repo="#lk{repo}";h.script=`${r}?raw=true`;if(!this.isEmpty(t)){for(let s in e){let i=e[s];if(!this.isEmpty(t[i])){if(i==="settings"){for(let s=0;s<t[i].length;s++){let e=t[i][s];for(let t=0;t<h.settings.length;t++){let s=h.settings[t];if(e.id===s.id){h.settings.splice(t,1)}}}}h[i]=h[i].concat(t[i])}delete t[i]}}Object.assign(h,t);if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.boxJsJsonFile);const e=this.path.resolve(process.cwd(),this.boxJsJsonFile);const o=this.fs.existsSync(t);const r=!o&&this.fs.existsSync(e);const n=JSON.stringify(h,null,"\t");if(o){this.fs.writeFileSync(t,n)}else if(r){this.fs.writeFileSync(e,n)}else{this.fs.writeFileSync(t,n)}let a=JSON.parse(this.fs.readFileSync(i));if(a.hasOwnProperty("apps")&&Array.isArray(a["apps"])&&a["apps"].length>0){let t=a.apps;let e=t.indexOf(t.filter(t=>{return t.id==h.id})[0]);if(e>=0){a.apps[e]=h}else{a.apps.push(h)}let o=JSON.stringify(a,null,2);if(!this.isEmpty(s)){for(const t in s){let i="";if(s.hasOwnProperty(t)){i=s[t]}else if(t==="author"){i="@lowking"}else if(t==="repo"){i="https://github.com/lowking/Scripts"}o=o.replace(`#lk{${t}}`,i)}}const r=/(?:#lk\{)(.+?)(?=\})/;let n=r.exec(o);if(n!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L18传入参数：\n`)}let l=new Set;while((n=r.exec(o))!==null){l.add(n[1]);o=o.replace(`#lk{${n[1]}}`,``)}l.forEach(t=>{console.log(`${t} `)});this.fs.writeFileSync(i,o)}}}}isJsonObject(t){return typeof t=="object"&&Object.prototype.toString.call(t).toLowerCase()=="[object object]"&&!t.length}appendNotifyInfo(t,s){if(s==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(t){return new Promise(s=>setTimeout(s,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}logErr(t){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}msg(t,s,i,e){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){}else{if(this.isEmpty(s)){if(Array.isArray(this.notifyInfo)){s=this.notifyInfo.join("\n")}else{s=this.notifyInfo}}if(!this.isEmpty(s)){if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let t in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(t)){continue}s=s.replace(t,this.tgEscapeCharMapping[t])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${s}`)},(t,s,i)=>{this.log(`Tg通知完毕`)})}else{let o={};const h=!this.isEmpty(i);const r=!this.isEmpty(e);if(this.isQuanX()){if(h)o["open-url"]=i;if(r)o["media-url"]=e;$notify(this.name,t,s,o)}if(this.isSurge()||this.isStash()){if(h)o["url"]=i;$notification.post(this.name,t,s,o)}if(this.isNode())this.log("⭐️"+this.name+"\n"+t+"\n"+s);if(this.isJSBox())$push.schedule({title:this.name,body:t?t+"\n"+s:s})}}}}getVal(t,s=""){let i;if(this.isSurge()||this.isLoon()||this.isStash()){i=$persistentStore.read(t)}else if(this.isQuanX()){i=$prefs.valueForKey(t)}else if(this.isNode()){this.data=this.loadData();i=process.env[t]||this.data[t]}else{i=this.data&&this.data[t]||null}return!i?s:i}setVal(t,s){if(this.isSurge()||this.isLoon()||this.isStash()){return $persistentStore.write(s,t)}else if(this.isQuanX()){return $prefs.setValueForKey(s,t)}else if(this.isNode()){this.data=this.loadData();this.data[t]=s;this.writeData();return true}else{return this.data&&this.data[t]||null}}loadData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);if(i||e){const e=i?t:s;try{return JSON.parse(this.fs.readFileSync(e))}catch(t){return{}}}else return{}}else return{}}writeData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);const o=JSON.stringify(this.data);if(i){this.fs.writeFileSync(t,o)}else if(e){this.fs.writeFileSync(s,o)}else{this.fs.writeFileSync(t,o)}}}adapterStatus(t){if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t}get(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash())$httpClient.get(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)});if(this.isNode()){this.node.request(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.get(t)}}post(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){this.node.request.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}put(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="PUT";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash()){t.method="PUT";$httpClient.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){t.method="PUT";this.node.request.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}costTime(){let t=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){t=`指令【${this.comm[1]}】执行完毕！`}const s=(new Date).getTime();const i=s-this.startTime;const e=i/1e3;this.execCount++;this.costTotalMs+=i;this.log(`${t}耗时【${e}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(t={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(t)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(t){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(t))}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"||t=="undefined"||t.length===0}randomString(t){t=t||32;var s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=s.length;var e="";for(let o=0;o<t;o++){e+=s.charAt(Math.floor(Math.random()*i))}return e}autoComplete(t,s,i,e,o,h,r,n,a,l){t+=``;if(t.length<o){while(t.length<o){if(h==0){t+=e}else{t=e+t}}}if(r){let s=``;for(var f=0;f<n;f++){s+=l}t=t.substring(0,a)+s+t.substring(n+a)}t=s+t+i;return this.toDBC(t)}customReplace(t,s,i,e){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(e)){e="}"}for(let o in s){t=t.replace(`${i}${o}${e}`,s[o])}}catch(t){this.logErr(t)}return t}toDBC(t){var s="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){s=s+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){s=s+String.fromCharCode(t.charCodeAt(i)+65248)}}return s}hash(t){let s=0,i,e;for(i=0;i<t.length;i++){e=t.charCodeAt(i);s=(s<<5)-s+e;s|=0}return String(s)}formatDate(t,s){let i={"M+":t.getMonth()+1,"d+":t.getDate(),"H+":t.getHours(),"m+":t.getMinutes(),"s+":t.getSeconds(),"q+":Math.floor((t.getMonth()+3)/3),S:t.getMilliseconds()};if(/(y+)/.test(s))s=s.replace(RegExp.$1,(t.getFullYear()+"").substr(4-RegExp.$1.length));for(let t in i)if(new RegExp("("+t+")").test(s))s=s.replace(RegExp.$1,RegExp.$1.length==1?i[t]:("00"+i[t]).substr((""+i[t]).length));return s}}(t,s,i)}
//ToolKit-end
