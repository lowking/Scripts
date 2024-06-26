/*
朴朴签到-lowking-v2.0.6

按下面配置完之后，手机朴朴短信登录获取token，下面配置只验证过surge的，其他的自行测试
⚠️只测试过surge没有其他app自行测试

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 朴朴签到
朴朴签到cookie = requires-body=1,type=http-response,pattern=https:\/\/cauth.pupuapi.com\/clientauth\/user\/verify_login,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/pupu/pupuCheckIn.js
朴朴签到 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/pupu/pupuCheckIn.js

[MITM]
hostname = %APPEND% cauth.pupuapi.com
*/
const lk = new ToolKit(`朴朴签到`, `PuPuCheckIn`, {"httpApia": "ffff@192.168.8.117:6166"})
const pupuTokenKey = 'lkPuPuTokenKey'
let pupuToken = lk.getVal(pupuTokenKey)
const pupuRefreshTokenKey = 'lkPuPuRefreshTokenKey'
let pupuRefreshToken = lk.getVal(pupuRefreshTokenKey)
lk.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 D/C501C6D2-FAF6-4DA8-B65B-7B8B392901EB"
const storeId = "f8f0656f-d30e-497a-a536-e9edec17b74d"
const pupuSec = "lkPuPuSec"
const pupuMsec = "lkPuPuMsec"
const sec = lk.getVal(pupuSec, 59)
const msec = lk.getVal(pupuMsec, 0)
const pupuRunCountKey = 'pupuRunCount'
const pupuRunCount = lk.getVal(pupuRunCountKey, 2)
const checkSignInRepeatKey = 'pupuSignInRepeat'
const checkSignInRepeat = lk.getVal(checkSignInRepeatKey)
const todayAlreadyGetCouponIdsKey = 'pupuTodayAlreadyGetCouponIds'
let todayAlreadyGetCouponIds = `,${lk.getVal(todayAlreadyGetCouponIdsKey)},`

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/pupua.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/pupu.png"
            ],
            "settings": [
                {
                    "id": pupuTokenKey,
                    "name": "朴朴token",
                    "val": "",
                    "type": "text",
                    "desc": "朴朴token"
                }, {
                    "id": pupuRefreshTokenKey,
                    "name": "朴朴refresh_token",
                    "val": "",
                    "type": "text",
                    "desc": "朴朴refresh_token"
                }, {
                    "id": pupuSec,
                    "name": "抢券等待至xx秒",
                    "val": 59,
                    "type": "number",
                    "desc": "默认59s"
                }, {
                    "id": pupuMsec,
                    "name": "抢券等待至xxx毫秒",
                    "val": 0,
                    "type": "number",
                    "desc": "默认0ms"
                }, {
                    "id": pupuRunCountKey,
                    "name": "抢签到第一并发数",
                    "val": 2,
                    "type": "number",
                    "desc": "默认2"
                }
            ],
            "keys": [pupuTokenKey, pupuRefreshTokenKey]
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/pupu/pupuCheckIn.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all()
    }
}

function getCookie() {
    if (lk.isGetCookie(/\/clientauth\/user\/verify_login/)) {
        lk.log(`开始获取cookie`)
        let data = lk.getResponseBody()
        lk.log(`获取到的cookie：${data}`)
        try {
            data = JSON.parse(data)
            lk.setVal(pupuRefreshTokenKey, data.data["refresh_token"])
            lk.appendNotifyInfo('🎉成功获取朴朴refresh_token，可以关闭相应脚本')
        } catch (e) {
            lk.appendNotifyInfo('❌获取朴朴token失败')
        }
        lk.msg('')
    }
}

async function all() {
    let hasNeedSendNotify = true
    if (pupuRefreshToken == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先打开朴朴短信验证码登录获取refresh_token`)
    } else {
        await refreshToken()
        let hasAlreadySignIn = await signIn()
        lk.log(`已领取券：${todayAlreadyGetCouponIds}`)
        let requestCount = await getCouponList()
        // await share()
        lk.log(`是否已经签到：${hasAlreadySignIn == 1}`)
        lk.log(`请求领券次数：${requestCount}`)
        hasNeedSendNotify = !(requestCount == 0 && hasAlreadySignIn == 1)
        if (hasNeedSendNotify) {
            await getScore()
        }
    }
    if (hasNeedSendNotify) {
        lk.msg(``)
    }
    lk.done()
}

function getCouponList() {
    return new Promise((resolve, _reject) => {
        const t = '获取券列表'
        let requestCount = 0
        let url = {
            url: 'https://j1.pupuapi.com/client/coupon?type=1&store_id=' + storeId,
            headers: {
                Authorization: pupuToken,
                "Content-Type": "application/json; charset=utf-8",
            },
        }
        lk.get(url, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.errcode == 0) {
                        dataObj = dataObj.data
                        // 等待到整点执行
                        let now = new Date()
                        if (now.getMinutes() > 57) {
                            let preSec = -1
                            while (1) {
                                let nsec = now.getSeconds()
                                let nmsec = now.getMilliseconds()
                                if (nsec >= sec && nmsec >= msec || nsec < preSec) {
                                    lk.log("跳出等待")
                                    break
                                }
                                lk.log(`${nsec}.${nmsec}等待中。。。`)
                                preSec = nsec
                                await lk.sleep(50)
                                now = new Date()
                            }
                        }
                        let couponListFunc = []
                        for (let curCount = 0; curCount < pupuRunCount; curCount++) {
                            for (let i = 0; i  < dataObj.items.length; i++) {
                                const item = dataObj.items[i];
                                lk.log(JSON.stringify(item))
                                if (todayAlreadyGetCouponIds.indexOf(`,${item["discount_id"]},`) != -1) {
                                    lk.log(`该券今天已经领取，跳过`)
                                    continue
                                }
                                requestCount++
                                couponListFunc.push(getCoupon(item["discount_id"], item["discount_group_id"], item["style_info"]["condition_amount_desc"], item["discount_amount"]/100))
                            }
                        }
                        await Promise.all(couponListFunc).then(res => {
                            res.sort()
                            res.reverse()
                            let preCounponName = ""
                            let toNextCoupon = false
                            let getResSet = new Set()
                            let todayAlreadyGetCouponIdSet = new Set()
                            for (let i = 0; i < res.length; i++) {
                                const ret = res[i];
                                let msg = ret.split("\n")
                                let counponName = msg[0]
                                let getRes = msg[1]
                                let discountId = msg[2]
                                if (counponName != preCounponName) {
                                    toNextCoupon = false
                                    getResSet.forEach((s) => {
                                        lk.appendNotifyInfo(s)
                                    })
                                    getResSet = new Set()
                                    lk.appendNotifyInfo(counponName)
                                }
                                if (getRes.indexOf("成功") != -1) {
                                    toNextCoupon = true
                                    if (todayAlreadyGetCouponIds.indexOf(`,${discountId},`) == -1) {
                                        todayAlreadyGetCouponIdSet.add(discountId)
                                    }
                                } else if (toNextCoupon) {
                                    if (i >= res.length - 1) {
                                        getResSet.forEach((s) => {
                                            lk.appendNotifyInfo(s)
                                        })
                                    }
                                    continue
                                }
                                getResSet.add(getRes)

                                preCounponName = counponName
                                if (i >= res.length - 1) {
                                    getResSet.forEach((s) => {
                                        lk.appendNotifyInfo(s)
                                    })
                                }
                            }
                            if (todayAlreadyGetCouponIdSet.size > 0) {
                                lk.setVal(todayAlreadyGetCouponIdsKey, Array.from(todayAlreadyGetCouponIdSet).join(","))
                            }
                        })
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(dataObj.errmsg)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`朴朴返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve(requestCount)
            }
        })
    })
}

function getCoupon(discount, discountGroup, discountName, discountAmount) {
    return new Promise((resolve, _reject) => {
        const t = '抢券'
        let url = {
            url: 'https://j1.pupuapi.com/client/coupon/entity',
            headers: {
                Authorization: pupuToken,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                "discount": discount,
                "time_type": 1,
                "discount_group": discountGroup,
                "store_id": storeId,
            }),
        }
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    lk.log(data)
                    let dataObj = JSON.parse(data)
                    if (dataObj.errcode == 0) {
                        resolve(`【${discountAmount}元-${discountName}】\n ${dataObj.data}\n${discount}`)
                    } else {
                        resolve(`【${discountAmount}元-${discountName}】\n ${dataObj.errmsg}\n${discount}`)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`朴朴返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function refreshToken() {
    return new Promise((resolve, _reject) => {
        const t = '获取token'
        let url = {
            url: 'https://cauth.pupuapi.com/clientauth/user/refresh_token',
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                  "refresh_token": pupuRefreshToken
            })
        }
        lk.put(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    lk.log(data)
                    let dataObj = JSON.parse(data)
                    if (dataObj.errcode == 0) {
                        dataObj = dataObj.data
                        pupuToken = `Bearer ${dataObj["access_token"]}`
                        pupuRefreshToken = dataObj["refresh_token"]
                        lk.setVal(pupuTokenKey, pupuToken)
                        lk.setVal(pupuRefreshTokenKey, pupuRefreshToken)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(dataObj.errmsg)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`朴朴返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function getScore() {
    return new Promise((resolve, _reject) => {
        const t = '获取积分'
        let url = {
            url: 'https://j1.pupuapi.com/client/account/asserts',
            headers: {
                Authorization: pupuToken,
                "User-Agent": lk.userAgent
            }
        }
        lk.get(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.errcode == 0) {
                        dataObj = dataObj.data
                        lk.prependNotifyInfo(`🎉${t}成功，当前积分：${dataObj.coin}`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(dataObj.errmsg)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`朴朴返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function signIn() {
    return new Promise((resolve, _reject) => {
        let nowString = lk.formatDate(new Date(), 'yyyyMMdd')
        if (nowString == checkSignInRepeat) {
            lk.prependNotifyInfo('今日已经签到，无法重复签到～～')
            resolve(1)
            return
        }
        const t = '签到'
        let url = {
            url: 'https://j1.pupuapi.com/client/game/sign/v2?city_zip=350100&supplement_id=',
            headers: {
                Authorization: pupuToken,
                "User-Agent": lk.userAgent
            }
        }
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.errcode == 0) {
                        dataObj = dataObj.data
                        lk.prependNotifyInfo(`🎉${t}成功，获得【${dataObj['daily_sign_coin']}】积分`)
                        lk.setVal(checkSignInRepeatKey, nowString)
                        // 签到成功之后清除已领取券id
                        lk.setVal(todayAlreadyGetCouponIdsKey, "")
                        todayAlreadyGetCouponIds = ""
                    } else {
                        lk.execFail()
                        lk.prependNotifyInfo(dataObj.errmsg)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`朴朴返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

function share() {
    return new Promise((resolve, _reject) => {
        const t = '分享'
        let url = {
            url: 'https://j1.pupuapi.com/client/game/sign/share',
            headers: {
                Authorization: pupuToken,
                "User-Agent": lk.userAgent
            }
        }
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    let dataObj = JSON.parse(data)
                    if (dataObj.errcode == 0) {
                        dataObj = dataObj.data
                        lk.appendNotifyInfo(`🎉${t}成功`)
                    } else {
                        lk.execFail()
                        lk.appendNotifyInfo(dataObj.errmsg)
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`朴朴返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请带上日志联系作者，或稍后再试`)
            } finally {
                resolve()
            }
        })
    })
}

//ToolKit-start
function ToolKit(scriptName,scriptId,options){return new class{constructor(scriptName,scriptId,options){this.tgEscapeCharMapping={"&":"＆","#":"＃"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=scriptName;this.id=scriptId;this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=options;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const request=require("request");return{request:request}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.boxjsCurSessionKey="chavy_boxjs_cur_sessions";this.boxjsSessionsKey="chavy_boxjs_sessions";this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(fileName){if(this.isNode()){let targetPath=process.argv.slice(1,2)[0].split("/");targetPath[targetPath.length-1]=fileName;return targetPath.join("/")}return fileName}async execComm(){if(!this.isNode()){return}this.comm=process.argv.slice(1);if(this.comm[1]!="p"){return}let isHttpApiErr=false;this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.19:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){isHttpApiErr=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!isHttpApiErr){this.callApi(this.comm[2])}}callApi(timeout){let fname=this.comm[0];let httpApiHost=this.options.httpApi.split("@")[1];this.log(`获取【${fname}】内容传给【${httpApiHost}】`);let scriptStr="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(fname);const rootDirDataFilePath=this.path.resolve(process.cwd(),fname);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{scriptStr=this.fs.readFileSync(datPath)}catch(e){scriptStr=""}}else{scriptStr=""}let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${scriptStr}`,mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:true};this.post(options,(_error,_response,_data)=>{this.log(`已将脚本【${fname}】发给【${httpApiHost}】`);this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode()){return}if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}let boxjsJsonPath="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(param&&param.hasOwnProperty("target_boxjs_json_path")){boxjsJsonPath=param["target_boxjs_json_path"]}if(!this.fs.existsSync(boxjsJsonPath)){return}this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={};let scritpUrl="#lk{script_url}";if(param&&param.hasOwnProperty("script_url")){scritpUrl=this.isEmpty(param["script_url"])?"#lk{script_url}":param["script_url"]}boxJsJson.id=`${this.prefix}${this.id}`;boxJsJson.name=this.name;boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`;boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];boxJsJson.keys=[];boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];boxJsJson.author="#lk{author}";boxJsJson.repo="#lk{repo}";boxJsJson.script=`${scritpUrl}?raw=true`;if(!this.isEmpty(info)){for(let key of needAppendKeys){if(this.isEmpty(info[key])){break}if(key==="settings"){for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];if(input.id===def.id){boxJsJson.settings.splice(j,1)}}}}boxJsJson[key]=boxJsJson[key].concat(info[key]);delete info[key]}}Object.assign(boxJsJson,info);this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.boxJsJsonFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.boxJsJsonFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=JSON.stringify(boxJsJson,null,"\t");if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}let boxjsJson=JSON.parse(this.fs.readFileSync(boxjsJsonPath));if(!(boxjsJson.hasOwnProperty("apps")&&Array.isArray(boxjsJson["apps"])&&boxjsJson["apps"].length>0)){return}let apps=boxjsJson.apps;let targetIdx=apps.indexOf(apps.filter(app=>{return app.id==boxJsJson.id})[0]);if(targetIdx>=0){boxjsJson.apps[targetIdx]=boxJsJson}else{boxjsJson.apps.push(boxJsJson)}let ret=JSON.stringify(boxjsJson,null,2);if(!this.isEmpty(param)){for(const key in param){let val=param[key];if(!val){switch(key){case"author":val="@lowking";case"repo":val="https://github.com/lowking/Scripts";default:continue}}ret=ret.replace(`#lk{${key}}`,val)}}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);if(m!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19传入参数：`)}let loseParamSet=new Set;while((m=regex.exec(ret))!==null){loseParamSet.add(m[1]);ret=ret.replace(`#lk{${m[1]}}`,``)}loseParamSet.forEach(p=>{console.log(`${p} `)});this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){if(type==1){this.notifyInfo=info}else{this.notifyInfo.push(info)}}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(time){return new Promise(resolve=>setTimeout(resolve,time))}log(message){if(this.isEnableLog)console.log(`${this.logSeparator}${message}`)}logErr(message){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(message);if(!message.message){return}console.log(`\n${message.message}`)}}msg(subtitle,message,openUrl,mediaUrl,copyText,autoDismiss){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){return}if(this.isEmpty(message)){if(Array.isArray(this.notifyInfo)){message=this.notifyInfo.join("\n")}else{message=this.notifyInfo}}if(this.isEmpty(message)){return}if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let key in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(key)){continue}message=message.replace(key,this.tgEscapeCharMapping[key])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${message}`)},(_error,_statusCode,_body)=>{this.log(`Tg通知完毕`)})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl);const hasMediaUrl=!this.isEmpty(mediaUrl);const hasCopyText=!this.isEmpty(copyText);const hasAutoDismiss=autoDismiss>0;if(this.isSurge()||this.isLoon()||this.isStash()){if(hasOpenUrl){options["url"]=openUrl;options["action"]="open-url"}if(hasCopyText){options["text"]=copyText;options["action"]="clipboard"}if(this.isSurge()&&hasAutoDismiss){options["auto-dismiss"]=autoDismiss}if(hasMediaUrl){}options["media-url"]=mediaUrl;$notification.post(this.name,subtitle,message,options)}else if(this.isQuanX()){if(hasOpenUrl)options["open-url"]=openUrl;if(hasMediaUrl)options["media-url"]=mediaUrl;$notify(this.name,subtitle,message,options)}else if(this.isNode()){this.log("⭐️"+this.name+"\n"+subtitle+"\n"+message)}else if(this.isJSBox()){$push.schedule({title:this.name,body:subtitle?subtitle+"\n"+message:message})}}}getVal(key,defaultValue=""){let value;if(this.isSurge()||this.isLoon()||this.isStash()){value=$persistentStore.read(key)}else if(this.isQuanX()){value=$prefs.valueForKey(key)}else if(this.isNode()){this.data=this.loadData();value=process.env[key]||this.data[key]}else{value=this.data&&this.data[key]||null}return!value?defaultValue:value}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey){return}const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=JSON.parse(this.getVal(this.boxjsCurSessionKey,"{}"));if(!boxjsCurSession.hasOwnProperty(boxJsId)){return}let curSessionId=boxjsCurSession[boxJsId];let boxjsSessions=JSON.parse(this.getVal(this.boxjsSessionsKey,"[]"));if(boxjsSessions.length==0){return}let curSessionDatas=[];boxjsSessions.forEach(session=>{if(session.id==curSessionId){curSessionDatas=session.datas}});if(curSessionDatas.length==0){return}let isExists=false;curSessionDatas.forEach(kv=>{if(kv.key==key){kv.val=val;isExists=true}});if(!isExists){curSessionDatas.push({key:key,val:val})}boxjsSessions.forEach(session=>{if(session.id==curSessionId){session.datas=curSessionDatas}});this.setVal(this.boxjsSessionsKey,JSON.stringify(boxjsSessions))}setVal(key,val){if(this.isSurge()||this.isLoon()||this.isStash()){this.updateBoxjsSessions(key,val);return $persistentStore.write(val,key)}else if(this.isQuanX()){this.updateBoxjsSessions(key,val);return $prefs.setValueForKey(val,key)}else if(this.isNode()){this.data=this.loadData();this.data[key]=val;this.writeData();return true}else{return this.data&&this.data[key]||null}}loadData(){if(!this.isNode()){return{}}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{return JSON.parse(this.fs.readFileSync(datPath))}catch(e){return{}}}else{return{}}}writeData(){if(!this.isNode()){return}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=JSON.stringify(this.data);if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}}adapterStatus(response){if(response){if(response.status){response["statusCode"]=response.status}else if(response.statusCode){response["status"]=response.statusCode}}return response}get(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.get(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="GET";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=JSON.stringify(resp.error);let body=resp.data;if(typeof body=="object")body=JSON.stringify(resp.data);callback(error,this.adapterStatus(resp.response),body)};$http.get(options)}}post(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="POST";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=JSON.stringify(resp.error);let body=resp.data;if(typeof body=="object")body=JSON.stringify(resp.data);callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}put(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){options.method="PUT";$httpClient.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="PUT";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){options.method="PUT";this.node.request.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=JSON.stringify(resp.error);let body=resp.data;if(typeof body=="object")body=JSON.stringify(resp.data);callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}costTime(){let info=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){info=`指令【${this.comm[1]}】执行完毕！`}const endTime=(new Date).getTime();const ms=endTime-this.startTime;const costTime=ms/1e3;this.execCount++;this.costTotalMs+=ms;this.log(`${info}耗时【${costTime}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(value={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(value)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"||obj=="undefined"||obj.length===0}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length;let pwd="";for(let i=0;i<len;i++){pwd+=chars.charAt(Math.floor(Math.random()*maxPos))}return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){str+=``;if(str.length<len){while(str.length<len){if(direction==0){str+=fill}else{str=fill+str}}}if(ifCode){let temp=``;for(let i=0;i<clen;i++){temp+=cstr}str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}str=prefix+str+suffix;return this.toDBC(str)}customReplace(str,param,prefix,suffix){try{if(this.isEmpty(prefix)){prefix="#{"}if(this.isEmpty(suffix)){suffix="}"}for(let i in param){str=str.replace(`${prefix}${i}${suffix}`,param[i])}}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++){if(txtstring.charCodeAt(i)==32){tmp=tmp+String.fromCharCode(12288)}else if(txtstring.charCodeAt(i)<127){tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248)}}return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++){chr=str.charCodeAt(i);h=(h<<5)-h+chr;h|=0}return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};if(/(y+)/.test(format))format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length));for(let k in o)if(new RegExp("("+k+")").test(format))format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length));return format}}(scriptName,scriptId,options)}
//ToolKit-end
