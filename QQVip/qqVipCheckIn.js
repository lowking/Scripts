/*
QQ会员成长值-lowking-v1.7

按下面配置完之后，手机qq进入左侧会员，会员成长值页面，点击总成长值获取
⚠️注：发现cookie存活时间较短，增加isEnableNotifyForGetCookie，用来控制获取cookie时的通知，默认关闭通知

点赞排除列表数据结构如下：
{
    "qq号":[
        "要拉黑的人，写排行榜中的名字",
        "要拉黑的人，写排行榜中的名字"
    ],
    "qq号2":[
        "要拉黑的人，写排行榜中的名字",
        "要拉黑的人，写排行榜中的名字"
    ]
}

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > qq会员成长值签到
qq会员获取cookie = type=http-request,pattern=https:\/\/proxy.vac.qq.com\/cgi-bin\/srfentry.fcgi,script-path=qqVipCheckIn.js
qq会员签到 = type=cron,cronexp="0 0 0,1 * * ?",wake-system=1,script-path=qqVipCheckIn.js

[MITM]
hostname = %APPEND% proxy.vac.qq.com
*/
const signHeaderKey = 'lkQQSignHeaderKey'
const blockListKey = 'lkQQSignBlockListKey'
const lk = new ToolKit('QQ会员成长值签到', 'QQVipCheckIn')
const isEnableNotifyForGetCookie = lk.getVal('lkIsEnableNotifyForGetCookie', false).o()
const isDeleteAllCookie = lk.getVal('lkIsDeleteAllCookie', false).o()
const isEnableGetCookie = lk.getVal('lkIsEnableGetCookieQQVIP', true).o()
const signurlVal = `https://iyouxi3.vip.qq.com/ams3.0.php?actid=403490&g_tk=`
const praiseurlVal = `https://mq.vip.qq.com/m/growth/loadfrank?`
const mainTitle = `QQ会员成长值签到`
var accounts = lk.getVal(signHeaderKey, []).o()
var blockList = lk.getVal(blockListKey, {}).o()
// accounts = []

if (!lk.isExecComm) {
    if (lk.isRequest()) {
        if (isEnableGetCookie) {
            getCookie()
        } else {
            lk.done()
        }
    } else {
        all();
    }
}

async function all() {
    lk.boxJsJsonBuilder()
    await signIn() //签到
    // await withdrawRemind() //成长值储值提醒（由于每35天一次，ck有效期短，所以只做提醒）
    lk.msg(``)
    lk.done()
}

function getCookie() {
    const url = $request.url
    if ($request && $request.method != 'OPTIONS' && url.match(/\/cgi-bin\/srfentry/)) {
        try {
            const qqheader = $request.headers.Cookie.s()
            lk.log(qqheader)
            if (!!qqheader) {
                let obj = {
                    qq: Number(getCookieProp(qqheader, `uin`).substring(1)),
                    skey: getCookieProp(qqheader, `skey`),
                    cookie: qqheader
                }
                //判断当前qq信息是否持久化
                if (accounts.length > 0) {
                    for (var i in accounts) {
                        if (accounts[i].qq == obj.qq) {
                            accounts.splice(i, 1);
                        }
                    }
                }
                accounts.push(obj)
                lk.setVal(signHeaderKey, accounts.s())
                lk.log(`${accounts.s()}`)
                lk.log(`${lk.getVal(signHeaderKey)}`)
                if (isEnableNotifyForGetCookie) {
                    lk.appendNotifyInfo(`${lk.autoComplete(obj.qq, ``, ``, ` `, `10`, `0`, true, 3, 3, `*`)}获取cookie成功🎉`)
                }
            }
        } catch (e) {
            lk.appendNotifyInfo(`获取cookie失败，请重试❌`)
        }
    }
    lk.msg(``)
    lk.done()
}
function withdrawRemind() {
    return new Promise(async (resolve, reject) => {
        for (let i in accounts) {
            let qqheader = accounts[i].cookie
            let skey = getCookieProp(qqheader, 'skey')
            let realHeader = {
                Host: 'mp.vip.qq.com',
                Cookie: `qq_locale_id=2052; skey=${skey}; uin=${getCookieProp(qqheader, 'uin')};`,
            }
            let pskey = lk.randomString(44)
            let pstk = getPstk(pskey)
            let gtk = getCSRFToken(skey)
            let url = {
                url: encodeURI(`https://mq.vip.qq.com/m/growth/speedv3?ADTAG=vipcenter&_wvSb=1&_nav_alpha=true&_wv=1025&_wwv=132&_wvx=10&g_tk=${gtk}&ps_tk=${pstk}`),
                headers: realHeader
            }
            lk.log(url.s())
            lk.get(url, (error, response, data) => {
                lk.log(error)
                if (data.indexOf('<!') == 0) {
                    let arr = data.split('成长储值</span')
                    if (arr.length > 1) {
                        //><span class="mf-text-2">5</span>
                        let str = arr[1].split('</span')[0].replace('mf-text-2', '')
                        str = Number(str.match(/\d+/)[0])
                        if (str >= 5) {
                            lk.appendNotifyInfo(`🎉${lk.autoComplete(accounts[i].qq, ``, ``, ` `, `10`, `0`, true, 3, 3, `*`)}成长储值「${str}」可以领取了`)
                            lk.execFail()
                        }
                        lk.log(``)
                    }
                }
            })
        }
        resolve()
    })
}

function signIn() {
    return new Promise(async (resolve, reject) => {
        lk.log(`所有账号：${accounts.s()}`);
        if (!accounts || accounts.length <= 0) {
            lk.execFail()
            lk.appendNotifyInfo(`帐号列表为空，请获取cookie之后再试❌`)
        } else {
            if (isDeleteAllCookie) {
                lk.setVal(signHeaderKey, ``)
                lk.execFail()
                lk.appendNotifyInfo(`已清除所有cookie⭕️`)
            } else {
                for (let i in accounts) {
                    lk.log(`账号：${accounts[i].s()}`)
                    await qqVipSignIn(i, accounts[i])
                    // 判断运行状态，失败则continue，不继续点赞
                    if (!lk.execStatus) {
                        continue
                    }
                    continue
                    // 接口被移除，取消列表点赞
                    // todo 待解决排名列表点赞
                    let list = await praise(i, accounts[i])
                    if (list != null && list.length > 0) {
                        pcount = 0
                        arcount = 0
                        errorcount = 0
                        for (let ii = 0; ii < list.length; ii++) {
                            if (isBlock(list[ii]["memo"], accounts[i]["qq"])) {
                                lk.log(`点赞排除【${list[ii]["memo"]}】`)
                                continue
                            }
                            if (list[ii]["isPraise"] == 0) {
                                await doPraise(list[ii], accounts[i])
                            } else {
                                arcount++
                            }
                        }
                        lk.appendNotifyInfo(`🎉【${pcount}】个，🔁【${arcount}】个，❌【${errorcount}】个`)
                    }
                }
            }
        }
        resolve()
    })
}

function isBlock(name, qqno) {
    for(var key in blockList){
        if (key == qqno) {
            if (blockList[key].indexOf(name) != -1) {
                return true
            } else {
                return false
            }
        }
    }

    return false
}

var pcount = 0
var arcount = 0
var errorcount = 0
function praise(index, obj){
    return new Promise(async (resolve, reject) => {
        let qqno = lk.autoComplete(obj.qq, ``, ``, ` `, `10`, `0`, true, 3, 3, `*`)
        let pskey = lk.randomString(44)
        let pstk = getPstk(pskey)
        let gtk = getCSRFToken(obj.skey)
        let praiseurlValReal = praiseurlVal
        let realHeader = {}
        // realHeader.Host = `iyouxi3.vip.qq.com`
        realHeader.Cookie = obj.cookie + `; p_skey=${pskey}`
        realHeader.Cookie = realHeader.Cookie.replace("\"", "")
        realHeader.Cookie = realHeader.Cookie.replace("\"", "")
        realHeader.Referer = `https://mq.vip.qq.com/m/growth/rank`
        let url = {
            url: praiseurlValReal + `pn=1&g_tk=${gtk}&ps_tk=${pstk}`,
            headers: realHeader
        }
        lk.get(url, (error, response, data) => {
            let list = null
            try {
                const result = data.o()
                if (result.ret == 0) {
                    list = result.data
                } else if (result.ret == -7) {
                    lk.appendNotifyInfo(`${qqno}❌\ncookie失效，请重新获取`)
                    lk.execFail()
                } else {
                    //获取列表失败，返回
                    lk.appendNotifyInfo(`${qqno}会员点赞失败，请查看日志`)
                    lk.execFail()
                    lk.log(`当前帐号：${obj.qq}\n获取好友会员列表失败，请重新执行任务，若还是失败，请重新获取cookie`)
                }
            } catch (e) {
                lk.execFail()
                lk.log(`${qqno}的cookie失效`)
            } finally {
                resolve(list)
            }
        })
    })
}

function doPraise(item, obj){
    return new Promise(async (resolve, reject) => {
        if (item["me"] != `me`) {
            let pskey = lk.randomString(44)
            let pstk = getPstk(pskey)
            let gtk = getCSRFToken(obj.skey)
            let realHeader = {}
            realHeader.Cookie = obj.cookie + `; p_skey=${pskey}`
            realHeader.Cookie = realHeader.Cookie.replace("\"", "")
            realHeader.Cookie = realHeader.Cookie.replace("\"", "")
            realHeader.Referer = `https://mq.vip.qq.com/m/growth/rank`
            let purl = {
                url: `https://mq.vip.qq.com/m/growth/doPraise?method=0&toUin=${item["uin"]}&g_tk=${gtk}&ps_tk=${pstk}`,
                headers: realHeader
            }
            await lk.get(purl, (perror, presponse, pdata) => {
                try {
                    const presult = pdata.o()
                    if (presult.ret == 0) {
                        lk.log(`给第${item["rank"]}名：${item["memo"]}点赞成功🎉`)
                        pcount++
                    } else {
                        lk.log(`第${item["rank"]}名：${item["memo"]}点赞失败❌`)
                        lk.execFail()
                        errorcount++
                    }
                } catch (e) {
                    console.log(e)
                    resolve()
                } finally {
                    resolve()
                }
            })
        }else{
            resolve()
        }
    })
}

function qqVipSignIn(index, obj) {
    return new Promise((resolve, reject) => {
        let signurlValReal = signurlVal
        let realHeader = {}
        realHeader.Host = `iyouxi3.vip.qq.com`
        realHeader.Cookie = obj.cookie.replace("\"", "")
        let url = {
            url: signurlValReal + getCSRFToken(obj.skey),
            headers: realHeader
        }
        let notifyInfo = ''
        lk.get(url, (error, response, data) => {
            try {
                notifyInfo += `${lk.autoComplete(obj.qq, ``, ``, ` `, `10`, `0`, true, 3, 3, `*`)}`
                if (index == 3) {
                    lk.appendNotifyInfo(`【左滑 '查看' 以显示签到详情】`)
                }
                const result = data.o()
                if (result.ret == 0) {
                    notifyInfo += `🎉`
                } else if (result.ret == 10601) {
                    notifyInfo += `🔁`
                } else {
                    notifyInfo += `❌`
                    lk.execFail()
                }
                lk.appendNotifyInfo(notifyInfo)
                if (result.msg.indexOf(`火爆`) != -1) {
                    lk.appendNotifyInfo(`cookie失效，请重新获取`)
                    // 修改运行状态，外层判断失败就不继续进行点赞操作
                    lk.execFail()
                } else {
                    lk.appendNotifyInfo(result.msg.replace(/<[^>]+>/g, "").replace("{number}", "2"))
                }
            } finally {
                resolve()
            }
        })
    })
}

function getCookieProp(ca, cname) {
    var name = cname + "="
    ca = ca.split(";")
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim()
        if (c.indexOf(name) == 0) {
            return c.substring(name.length).replace("\"", "")
        }
    }
    return ""
}

function notify() {
    return new Promise((resolve, reject) => {
        resolve()
    })
}

// * ToolKit v1.1.1
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options==="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,response,data)=>error?reject({error:error,response:response,data:data}):resolve({error:error,response:response,data:data}))});const delayFetch=(promise,timeout=5e3)=>{return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))])};return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){if(typeof this==="string")return this;return JSON.stringify(this,replacer,space)};Object.prototype.o=function(reviver){return JSON.parse(this,reviver)};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=scriptName;this.id=scriptId;this.req=new Request(this);this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=options;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:this.isEnableLog.o();this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:this.isNotifyOnlyFail.o();this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:this.isEnableTgNotify.o();this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.sleepTotalMs=0;this.logSeparator="\n██";this.spaceSeparator="  ";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const request=require("request");return{request:request}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.boxjsCurSessionKey="chavy_boxjs_cur_sessions";this.boxjsSessionsKey="chavy_boxjs_sessions";this.preTgEscapeCharMapping={"|`|":",backQuote,"};this.finalTgEscapeCharMapping={",backQuote,":"`","%2CbackQuote%2C":"`"};this.tgEscapeCharMapping={_:"\\_","*":"\\*","`":"\\`"};this.tgEscapeCharMappingV2={_:"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"};this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(fileName){if(this.isNode()){let targetPath=process.argv.slice(1,2)[0].split("/");targetPath[targetPath.length-1]=fileName;return targetPath.join("/")}return fileName}async execComm(){if(!this.isNode()){return}this.comm=process.argv.slice(1);if(this.comm[1]!="p"){return}let isHttpApiErr=false;this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.6:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){isHttpApiErr=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!isHttpApiErr){this.callApi(this.comm[2])}}callApi(timeout){let fname=this.comm[0];let httpApiHost=this.options.httpApi.split("@")[1];this.log(`获取【${fname}】内容传给【${httpApiHost}】`);let scriptStr="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(fname);const rootDirDataFilePath=this.path.resolve(process.cwd(),fname);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{scriptStr=this.fs.readFileSync(datPath)}catch(e){scriptStr=""}}else{scriptStr=""}let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${scriptStr}`,mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:true};this.post(options,(_error,_response,_data)=>{this.log(`已将脚本【${fname}】发给【${httpApiHost}】`);this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode()){return}if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}let boxjsJsonPath="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(param&&param.hasOwnProperty("targetBoxjsJsonPath")){boxjsJsonPath=param["targetBoxjsJsonPath"]}if(!this.fs.existsSync(boxjsJsonPath)){return}this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={};let scritpUrl="#lk{script_url}";if(param&&param.hasOwnProperty("script_url")){scritpUrl=this.isEmpty(param["script_url"])?"#lk{script_url}":param["script_url"]}boxJsJson.id=`${this.prefix}${this.id}`;boxJsJson.name=this.name;boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`;boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];boxJsJson.keys=[];boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];boxJsJson.author="#lk{author}";boxJsJson.repo="#lk{repo}";boxJsJson.script=`${scritpUrl}?raw=true`;if(!this.isEmpty(info)){for(let key of needAppendKeys){if(this.isEmpty(info[key])){break}if(key==="settings"){for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];if(input.id===def.id){boxJsJson.settings.splice(j,1)}}}}boxJsJson[key]=boxJsJson[key].concat(info[key]);delete info[key]}}Object.assign(boxJsJson,info);this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.boxJsJsonFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.boxJsJsonFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=boxJsJson.s(null,"\t");if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}let boxjsJson=this.fs.readFileSync(boxjsJsonPath).o();if(!(boxjsJson.hasOwnProperty("apps")&&Array.isArray(boxjsJson["apps"])&&boxjsJson["apps"].length>0)){return}let apps=boxjsJson.apps;let targetIdx=apps.indexOf(apps.filter(app=>{return app.id==boxJsJson.id})[0]);if(targetIdx>=0){boxjsJson.apps[targetIdx]=boxJsJson}else{boxjsJson.apps.push(boxJsJson)}let ret=boxjsJson.s(null,2);if(!this.isEmpty(param)){for(const key in param){let val=param[key];if(!val){switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}}ret=ret.replace(`#lk{${key}}`,val)}}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);if(m!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19传入参数：`)}let loseParamSet=new Set;while((m=regex.exec(ret))!==null){loseParamSet.add(m[1]);ret=ret.replace(`#lk{${m[1]}}`,``)}loseParamSet.forEach(p=>{console.log(`${p} `)});this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){if(type==1){this.notifyInfo=info}else{this.notifyInfo.push(info)}}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){this.sleepTotalMs+=ms;return new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){if(this.isEnableLog)console.log(`${this.logSeparator}${message}`)}logErr(message){this.execStatus=true;if(this.isEnableLog){if(!this.isEmpty(message.message)){message=`${message}\n${this.spaceSeparator}${message.message.s()}`}message=`${this.logSeparator}${this.name}执行异常:\n${this.spaceSeparator}${message}`;console.log(message)}}replaceUseMap(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key)){continue}message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,autoDismiss){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){return}if(this.isEmpty(message)){if(Array.isArray(this.notifyInfo)){message=this.notifyInfo.join("\n")}else{message=this.notifyInfo}}if(this.isEmpty(message)){return}if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);const isMarkdown=this.tgNotifyUrl&&this.tgNotifyUrl.indexOf("parse_mode=Markdown")!=-1;if(isMarkdown){message=this.replaceUseMap(this.preTgEscapeCharMapping,message);let targetMapping=this.tgEscapeCharMapping;if(this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2")!=-1){targetMapping=this.tgEscapeCharMappingV2}message=this.replaceUseMap(targetMapping,message)}message=`📌${this.name}\n${message}`;if(isMarkdown){message=this.replaceUseMap(this.finalTgEscapeCharMapping,message)}let u=`${this.tgNotifyUrl}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl);const hasMediaUrl=!this.isEmpty(mediaUrl);const hasCopyText=!this.isEmpty(copyText);const hasAutoDismiss=autoDismiss>0;if(this.isSurge()||this.isLoon()||this.isStash()){if(hasOpenUrl){options["url"]=openUrl;options["action"]="open-url"}if(hasCopyText){options["text"]=copyText;options["action"]="clipboard"}if(this.isSurge()&&hasAutoDismiss){options["auto-dismiss"]=autoDismiss}if(hasMediaUrl){}options["media-url"]=mediaUrl;$notification.post(this.name,subtitle,message,options)}else if(this.isQuanX()){if(hasOpenUrl)options["open-url"]=openUrl;if(hasMediaUrl)options["media-url"]=mediaUrl;$notify(this.name,subtitle,message,options)}else if(this.isNode()){this.log("⭐️"+this.name+"\n"+subtitle+"\n"+message)}else if(this.isJSBox()){$push.schedule({title:this.name,body:subtitle?subtitle+"\n"+message:message})}}}getVal(key,defaultValue){let value;if(this.isSurge()||this.isLoon()||this.isStash()){value=$persistentStore.read(key)}else if(this.isQuanX()){value=$prefs.valueForKey(key)}else if(this.isNode()){this.data=this.loadData();value=process.env[key]||this.data[key]}else{value=this.data&&this.data[key]||null}return!value?defaultValue:value}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey){return}const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=this.getVal(this.boxjsCurSessionKey,"{}").o();if(!boxjsCurSession.hasOwnProperty(boxJsId)){return}let curSessionId=boxjsCurSession[boxJsId];let boxjsSessions=this.getVal(this.boxjsSessionsKey,"[]").o();if(boxjsSessions.length==0){return}let curSessionDatas=[];boxjsSessions.forEach(session=>{if(session.id==curSessionId){curSessionDatas=session.datas}});if(curSessionDatas.length==0){return}let isExists=false;curSessionDatas.forEach(kv=>{if(kv.key==key){kv.val=val;isExists=true}});if(!isExists){curSessionDatas.push({key:key,val:val})}boxjsSessions.forEach(session=>{if(session.id==curSessionId){session.datas=curSessionDatas}});this.setVal(this.boxjsSessionsKey,boxjsSessions.s())}setVal(key,val){if(this.isSurge()||this.isLoon()||this.isStash()){this.updateBoxjsSessions(key,val);return $persistentStore.write(val,key)}else if(this.isQuanX()){this.updateBoxjsSessions(key,val);return $prefs.setValueForKey(val,key)}else if(this.isNode()){this.data=this.loadData();this.data[key]=val;this.writeData();return true}else{return this.data&&this.data[key]||null}}loadData(){if(!this.isNode()){return{}}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{return this.fs.readFileSync(datPath).o()}catch(e){return{}}}else{return{}}}writeData(){if(!this.isNode()){return}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=this.data.s();if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}}adapterStatus(response){if(response){if(response.status){response["statusCode"]=response.status}else if(response.statusCode){response["status"]=response.statusCode}}return response}get(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.get(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="GET";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=resp.error.s();let body=resp.data;if(typeof body=="object")body=resp.data.s();callback(error,this.adapterStatus(resp.response),body)};$http.get(options)}}post(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="POST";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=resp.error.s();let body=resp.data;if(typeof body=="object")body=resp.data.s();callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}put(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){options.method="PUT";$httpClient.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="PUT";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){options.method="PUT";this.node.request.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=resp.error.s();let body=resp.data;if(typeof body=="object")body=resp.data.s();callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);while(i--){c+=(aa.pop()||0)+(bb.pop()||0);ret.unshift(c%10);c=Math.floor(c/10)}while(c){ret.unshift(c%10);c=Math.floor(c/10)}return ret.join("")}costTime(){let info=`${this.name}, 执行完毕！`;if(this.isNode()&&this.isExecComm){info=`指令【${this.comm[1]}】执行完毕！`}const endTime=(new Date).getTime();const ms=endTime-this.startTime;const costTime=ms/1e3;const count=this.sum(this.execCount,"1");const total=this.sum(this.costTotalMs,ms.s());this.log(`${info}\n${this.spaceSeparator}耗时【${costTime}】秒（含休眠${this.sleepTotalMs?(this.sleepTotalMs/1e3).toFixed(4):0}秒）\n${this.spaceSeparator}总共执行【${count}】次，平均耗时【${(Number(total)/Number(this.execCount)/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,`${total},${count}`.s())}done(value={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(value)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"||obj=="undefined"||obj.length===0}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length;let pwd="";for(let i=0;i<len;i++){pwd+=chars.charAt(Math.floor(Math.random()*maxPos))}return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){str+=``;if(str.length<len){while(str.length<len){if(direction==0){str+=fill}else{str=fill+str}}}if(ifCode){let temp=``;for(let i=0;i<clen;i++){temp+=cstr}str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}str=prefix+str+suffix;return this.toDBC(str)}customReplace(str,param,prefix,suffix){try{if(this.isEmpty(prefix)){prefix="#{"}if(this.isEmpty(suffix)){suffix="}"}for(let i in param){str=str.replace(`${prefix}${i}${suffix}`,param[i])}}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++){if(txtstring.charCodeAt(i)==32){tmp=tmp+String.fromCharCode(12288)}else if(txtstring.charCodeAt(i)<127){tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248)}}return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++){chr=str.charCodeAt(i);h=(h<<5)-h+chr;h|=0}return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};if(/(y+)/.test(format))format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length));for(let k in o)if(new RegExp("("+k+")").test(format))format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0){return c.substring(name.length).replace('"',"").trim()}}return""}}(scriptName,scriptId,options)}
function getPstk(r){for(var n=5381,t=0,a=r.length;a>t;++t)n+=(n<<5)+r.charCodeAt(t);return 2147483647&n}function getCSRFToken(r){var n="5381";var t="tencentQQVIP123443safde&!%^%1282";var a=r;var e=[],u;e.push(n<<5);for(var o=0,v=a.length;o<v;++o){u=a.charAt(o).charCodeAt(0);e.push((n<<5)+u);n=u}return md5z(e.join("")+t)}function md5z(r){var n=0;var t="";var a=8;var e=32;function u(r){return z(h(k(r),r.length*a))}function o(r){return F(h(k(r),r.length*a))}function v(r){return p(h(k(r),r.length*a))}function f(r,n){return z(s(r,n))}function c(r,n){return F(s(r,n))}function i(r,n){return p(s(r,n))}function h(r,n){r[n>>5]|=128<<n%32;r[(n+64>>>9<<4)+14]=n;var t=1732584193;var a=-271733879;var u=-1732584194;var o=271733878;for(var v=0;v<r.length;v+=16){var f=t;var c=a;var i=u;var h=o;t=l(t,a,u,o,r[v+0],7,-680876936);o=l(o,t,a,u,r[v+1],12,-389564586);u=l(u,o,t,a,r[v+2],17,606105819);a=l(a,u,o,t,r[v+3],22,-1044525330);t=l(t,a,u,o,r[v+4],7,-176418897);o=l(o,t,a,u,r[v+5],12,1200080426);u=l(u,o,t,a,r[v+6],17,-1473231341);a=l(a,u,o,t,r[v+7],22,-45705983);t=l(t,a,u,o,r[v+8],7,1770035416);o=l(o,t,a,u,r[v+9],12,-1958414417);u=l(u,o,t,a,r[v+10],17,-42063);a=l(a,u,o,t,r[v+11],22,-1990404162);t=l(t,a,u,o,r[v+12],7,1804603682);o=l(o,t,a,u,r[v+13],12,-40341101);u=l(u,o,t,a,r[v+14],17,-1502002290);a=l(a,u,o,t,r[v+15],22,1236535329);t=A(t,a,u,o,r[v+1],5,-165796510);o=A(o,t,a,u,r[v+6],9,-1069501632);u=A(u,o,t,a,r[v+11],14,643717713);a=A(a,u,o,t,r[v+0],20,-373897302);t=A(t,a,u,o,r[v+5],5,-701558691);o=A(o,t,a,u,r[v+10],9,38016083);u=A(u,o,t,a,r[v+15],14,-660478335);a=A(a,u,o,t,r[v+4],20,-405537848);t=A(t,a,u,o,r[v+9],5,568446438);o=A(o,t,a,u,r[v+14],9,-1019803690);u=A(u,o,t,a,r[v+3],14,-187363961);a=A(a,u,o,t,r[v+8],20,1163531501);t=A(t,a,u,o,r[v+13],5,-1444681467);o=A(o,t,a,u,r[v+2],9,-51403784);u=A(u,o,t,a,r[v+7],14,1735328473);a=A(a,u,o,t,r[v+12],20,-1926607734);t=d(t,a,u,o,r[v+5],4,-378558);o=d(o,t,a,u,r[v+8],11,-2022574463);u=d(u,o,t,a,r[v+11],16,1839030562);a=d(a,u,o,t,r[v+14],23,-35309556);t=d(t,a,u,o,r[v+1],4,-1530992060);o=d(o,t,a,u,r[v+4],11,1272893353);u=d(u,o,t,a,r[v+7],16,-155497632);a=d(a,u,o,t,r[v+10],23,-1094730640);t=d(t,a,u,o,r[v+13],4,681279174);o=d(o,t,a,u,r[v+0],11,-358537222);u=d(u,o,t,a,r[v+3],16,-722521979);a=d(a,u,o,t,r[v+6],23,76029189);t=d(t,a,u,o,r[v+9],4,-640364487);o=d(o,t,a,u,r[v+12],11,-421815835);u=d(u,o,t,a,r[v+15],16,530742520);a=d(a,u,o,t,r[v+2],23,-995338651);t=C(t,a,u,o,r[v+0],6,-198630844);o=C(o,t,a,u,r[v+7],10,1126891415);u=C(u,o,t,a,r[v+14],15,-1416354905);a=C(a,u,o,t,r[v+5],21,-57434055);t=C(t,a,u,o,r[v+12],6,1700485571);o=C(o,t,a,u,r[v+3],10,-1894986606);u=C(u,o,t,a,r[v+10],15,-1051523);a=C(a,u,o,t,r[v+1],21,-2054922799);t=C(t,a,u,o,r[v+8],6,1873313359);o=C(o,t,a,u,r[v+15],10,-30611744);u=C(u,o,t,a,r[v+6],15,-1560198380);a=C(a,u,o,t,r[v+13],21,1309151649);t=C(t,a,u,o,r[v+4],6,-145523070);o=C(o,t,a,u,r[v+11],10,-1120210379);u=C(u,o,t,a,r[v+2],15,718787259);a=C(a,u,o,t,r[v+9],21,-343485551);t=y(t,f);a=y(a,c);u=y(u,i);o=y(o,h)}if(e==16){return Array(a,u)}else{return Array(t,a,u,o)}}function g(r,n,t,a,e,u){return y(m(y(y(n,r),y(a,u)),e),t)}function l(r,n,t,a,e,u,o){return g(n&t|~n&a,r,n,e,u,o)}function A(r,n,t,a,e,u,o){return g(n&a|t&~a,r,n,e,u,o)}function d(r,n,t,a,e,u,o){return g(n^t^a,r,n,e,u,o)}function C(r,n,t,a,e,u,o){return g(t^(n|~a),r,n,e,u,o)}function s(r,n){var t=k(r);if(t.length>16)t=h(t,r.length*a);var e=Array(16),u=Array(16);for(var o=0;o<16;o++){e[o]=t[o]^909522486;u[o]=t[o]^1549556828}var v=h(e.concat(k(n)),512+n.length*a);return h(u.concat(v),512+128)}function y(r,n){var t=(r&65535)+(n&65535);var a=(r>>16)+(n>>16)+(t>>16);return a<<16|t&65535}function m(r,n){return r<<n|r>>>32-n}function k(r){var n=Array();var t=(1<<a)-1;for(var e=0;e<r.length*a;e+=a)n[e>>5]|=(r.charCodeAt(e/a)&t)<<e%32;return n}function p(r){var n="";var t=(1<<a)-1;for(var e=0;e<r.length*32;e+=a)n+=String.fromCharCode(r[e>>5]>>>e%32&t);return n}function z(r){var t=n?"0123456789ABCDEF":"0123456789abcdef";var a="";for(var e=0;e<r.length*4;e++){a+=t.charAt(r[e>>2]>>e%4*8+4&15)+t.charAt(r[e>>2]>>e%4*8&15)}return a}function F(r){var n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var a="";for(var e=0;e<r.length*4;e+=3){var u=(r[e>>2]>>8*(e%4)&255)<<16|(r[e+1>>2]>>8*((e+1)%4)&255)<<8|r[e+2>>2]>>8*((e+2)%4)&255;for(var o=0;o<4;o++){if(e*8+o*6>r.length*32)a+=t;else a+=n.charAt(u>>6*(3-o)&63)}}return a}return u(r)}