/*
Jump游戏价格监控-lowking-v1.2.1

⚠️只测试过surge没有其他app自行测试

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > Jump游戏价格监控
Jump游戏价格监控cookie = requires-body=0,type=http-request,pattern=https:\/\/switch\.jumpvg\.com\/jump\/app\/conf,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/jump/jumpPrice.js
Jump游戏价格监控 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/jump/jumpPrice.js

[MITM]
hostname = %APPEND% switch.jumpvg.com
*/
const lk = new ToolKit(`Jump游戏价格监控`, `JumpPrice`, {"httpApi": "ffff@10.0.0.6:6166"})
const domain = "https://switch.jumpvg.com"
const jumpHeaderKey = 'jumpHeaderKey'
const jumpDifferenceLowestPercentKey = 'jumpDifferenceLowestPercentp'
const countryKey = 'jumpCountry'
let header = lk.getVal(jumpHeaderKey)
let differenceLowestPercent = Number(lk.getVal(jumpDifferenceLowestPercentKey, 0.15))
let country = `,${lk.getVal(countryKey, "Steam国区,日本,美国")},`

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/jump.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/jump.png"
            ],
            "settings": [
                {
                    "id": jumpDifferenceLowestPercentKey,
                    "name": "过滤 史低折扣-当前折扣 <= 该值的游戏",
                    "val": 0.15,
                    "type": "number",
                    "desc": "写小数，默认：0.15，如：0.8-0.7<=0.15。避免一直等史低，错过差一点史低的价格"
                },
                {
                    "id": countryKey,
                    "name": "监控区服",
                    "val": "Steam国区,日本,美国",
                    "type": "text",
                    "desc": "要监控哪些区服，可以先运行一次看看日志。默认值：Steam国区,日本,美国"
                },
            ],
            "keys": [jumpHeaderKey, jumpDifferenceLowestPercentKey, countryKey],
            "script_timeout": 5
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/jump/jumpPrice.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all().catch((err) => {
            lk.logErr(err)
            lk.execFail()
            lk.msg(``, err)
        }).finally(() => {
            lk.done()
        })
    }
}

function getCookie() {
    if (lk.isMatch(/\/jump\/app\/conf/)) {
        lk.log(`开始获取cookie`)
        if ($request.headers) {
            lk.setVal(jumpHeaderKey, $request.headers.s())
            lk.appendNotifyInfo('🎉成功获取cookie，可以关闭相应脚本')
        } else {
            lk.appendNotifyInfo("❌获取cookie失败")
        }
    }
    lk.msg(``)
    lk.done()
}

async function all() {
    if (!header) {
        throw "⚠️请先打开jump app获取cookie"
    }
    let headers = header.o()
    await getUserInfo(headers).then(([userInfo, t]) => {
        if (!userInfo?.data?.userId) {
            throw `❌${userInfo?.msg || t + "失败"}，请重新获取token`
        }
        return userInfo
    }).then(async (userInfo) => {
        return await getGamePlatforms(userInfo.data.userId, headers).then(([platforms, t]) => {
            if (!(platforms?.code == 0 && platforms.data.length > 0)) {
                throw `❌${userInfo?.msg || t + "失败"}`
            }
            return {
                platforms: platforms.data,
                userId: userInfo.data.userId
            }
        })
    }).then(async ({platforms, userId}) => {
        for (const platform of platforms) {
            await dealPlatform(platform, userId, headers)
        }
    })
}

function dealAllPrice(game, prices, platform) {
    const gameId = game.gameId
    const discountEndTime = prices[0].discountEndTime || "unknown"
    let gameNotifyKey = `jumpPriceNotify-${gameId}`
    let isNotify = lk.getVal(gameNotifyKey, "") != discountEndTime
    const priceIndex = prices[0].price ? 0 : 1
    let info = `${platform?.platformAlias} 🎮${game?.title} ${(prices[priceIndex].price / 100).toFixed(2)}${prices[priceIndex].coinSymbol || "¥"}`
    let cover = game?.cover
    let matchCount = 0
    let isLastDay = false
    prices = prices.filter(price => {
        let hasIncludeJump = price.country.toLowerCase().indexOf("jump") != -1
        let watching = country == ",," || country.indexOf(`,${price.country},`) != -1
        lk.log(`${price.country}: ${price.leftTime}, ${hasIncludeJump}, ${watching}`)
        return price.leftTime && !hasIncludeJump && watching
    })
    if (prices.length == 0) {
        return
    }
    for (const price of prices) {
        let priceCNY = (price.price / 100).toFixed(2)
        let priceDiscountCNY = (price.priceDiscount / 100).toFixed(2)
        let lowestPriceCNY = (price.lowestPrice / 100).toFixed(2)
        let discountPercent = (price.price - price.priceDiscount) / price.price
        let lowestPercent = (price.price - price.lowestPrice) / price.price
        if (!price.lowestPrice) {
            lowestPriceCNY = priceDiscountCNY
            lowestPercent = discountPercent
        }
        if (!isLastDay && price.leftTime.trim().indexOf("1天") == 0) {
            isLastDay = true
        }
        if (lowestPercent - discountPercent <= differenceLowestPercent) {
            matchCount++
            info = `${info}\n┏${price.country}　${price.leftTime ? price.leftTime : ""}\n┣目前${priceDiscountCNY}¥(-${(discountPercent * 100).toFixed(0)}%)\n┗史低${lowestPriceCNY}¥(-${(lowestPercent * 100).toFixed(0)}%)`
        }
    }
    lk.log(`info: ${info}\nisNotify: ${isNotify}\nmatchCount: ${matchCount}\nisLastDay: ${isLastDay}\ndiscountEndTime: ${discountEndTime}`)
    // 不同活动结束时间并且符合价格条件，或者符合条件价格并且是活动最后一天才通知
    if (isNotify && matchCount || isLastDay && matchCount) {
        lk.setVal(gameNotifyKey, discountEndTime)
        if (cover) {
            lk.msg(``, info, '', cover)
        } else {
            lk.msg(``, info)
        }
    }
}

async function dealGames(games, platform, headers) {
    games = games?.data.filter(game => game?.discountOff != 0)
    for (const game of games) {
        await allPrice({...game, ...platform.moduleId}, headers).then((prices) => {
            dealAllPrice(game, prices, platform)
        })
    }
}

async function dealPlatform(platform, userId, headers) {
    if (platform?.gameNum > 0 && platform?.moduleId > 0) {
        await getGames(userId, platform.moduleId, platform?.platformAlias, headers).then(async (games) => {
            await dealGames(games, platform, headers)
        })
    }
}

async function getUserInfo(headers) {
    return new Promise((resolve, _reject) => {
        const t = '获取用户信息'
        lk.log(t)
        lk.get({
            url: `${domain}/jump/mine/userinfo`,
            headers
        }, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    data = data.o()
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                throw `❌${t}错误，请稍后再试`
            } finally {
                resolve([data, t])
            }
        })
    })
}

async function getGamePlatforms(userId, headers) {
    return new Promise((resolve, _reject) => {
        const t = '获取游戏平台列表'
        lk.log(t)
        lk.get({
            url: `${domain}/jump/favorite/count?userId=${userId}&version=3`,
            headers
        }, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    data = data.o()
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                throw `❌${t}错误，请稍后再试`
            } finally {
                resolve([data, t])
            }
        })
    })
}

function getGames(userId, moduleId, platformAlias, headers) {
    return new Promise((resolve, _reject) => {
        const t = `获取${platformAlias}游戏列表`
        lk.log(t)
        let url = {
            url: `${domain}/jump/favorite/appList`,
            headers,
            body: {
                "userId": userId,
                "offset": 0,
                "priceHigh": -1,
                "discount": 0,
                "subModuleId": 1,
                "moduleId": moduleId,
                "lowestPrice": 0,
                "limit": 100,
                "orderBy": 1
            }.s()
        }
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    data = data.o()
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                throw `❌${t}错误，请稍后再试`
            } finally {
                resolve(data)
            }
        })
    })
}

async function gameDetail(game, headers) {
    return new Promise((resolve, _reject) => {
        const t = `获取[${game?.title}]游戏详情`
        lk.log(t)
        lk.post({
            url: `${domain}/jump/game/detail?clickFrom=-1&gameId=${game.gameIdNew}&id=${game.gameId}&path=&platform=4&version=3`,
            headers,
        }, async (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    data = data.o()
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                throw `❌${t}错误，请稍后再试`
            } finally {
                resolve(data?.data)
            }
        })
    })
}

function allPrice(game, headers) {
    return new Promise((resolve, _reject) => {
        const t = `获取[${game?.title}]游戏所有价格-${game.gameId}-${game.moduleId}`
        lk.log(t)
        lk.post({
            url: `${domain}/jump/price/getAllPriceByGame?id=${game.gameId}&platform=${game.moduleId}`,
            headers,
        }, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    data = data.o()
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`返回数据：${data}`)
                lk.execFail()
                throw `❌${t}错误，请稍后再试`
            } finally {
                resolve(data?.data?.prices)
            }
        })
    })
}

// * ToolKit v1.3.2 build 144
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options=="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,resp,data)=>error?reject({error,resp,data}):resolve({error,resp,data}))}),delayFetch=(promise,timeout=5e3)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))]);return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){return typeof this=="string"?this:JSON.stringify(this,replacer,space)},Object.prototype.o=function(reviver){return JSON.parse(this,reviver)},this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`,this.prefix=`lk`,this.name=scriptName,this.id=scriptId,this.req=new Request(this),this.data=null,this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`),this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`),this.options=options,this.isExecComm=!1,this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`),this.isEnableLog=!!this.isEmpty(this.isEnableLog)||this.isEnableLog.o(),this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`),this.isNotifyOnlyFail=!this.isEmpty(this.isNotifyOnlyFail)&&this.isNotifyOnlyFail.o(),this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`),this.isEnableTgNotify=!this.isEmpty(this.isEnableTgNotify)&&this.isEnableTgNotify.o(),this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`),this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify,this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`,this.costTotalString=this.getVal(this.costTotalStringKey),this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',""),this.costTotalMs=this.costTotalString.split(",")[0],this.execCount=this.costTotalString.split(",")[1],this.sleepTotalMs=0,this.logSeparator=`
██`,this.twoSpace="  ",this.now=new Date,this.startTime=this.now.getTime(),this.node=(()=>{if(this.isNode()){const request=require("request");return{request}}return null})(),this.execStatus=!0,this.notifyInfo=[],this.boxjsCurSessionKey="chavy_boxjs_cur_sessions",this.boxjsSessionsKey="chavy_boxjs_sessions",this.preTgEscapeCharMapping={"|`|":",backQuote,"},this.finalTgEscapeCharMapping={",backQuote,":"`","%2CbackQuote%2C":"`"},this.tgEscapeCharMapping={"_":"\\_","*":"\\*","`":"\\`"},this.tgEscapeCharMappingV2={"_":"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"},this.log(`${this.name}, 开始执行!`),this.execComm()}getRealPath(fileName){if(!this.isNode())return fileName;let targetPath=process.argv.slice(1,2)[0].split("/");return targetPath[targetPath.length-1]=fileName,targetPath.join("/")}checkPath(fileName){const curDirDataFilePath=this.path.resolve(fileName),rootDirDataFilePath=this.path.resolve(process.cwd(),fileName),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);return{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}}async execComm(){if(!this.isNode())return;if(this.comm=process.argv.slice(1),this.comm[1]!="p")return;this.isExecComm=!0,this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本!`);let httpApi=this.options?.httpApi,targetDevice;if(this.isEmpty(this?.options?.httpApi))this.log(`未设置options,使用默认值`),this.isEmpty(this?.options)&&(this.options={}),this.options.httpApi=`ffff@10.0.0.6:6166`,httpApi=this.options.httpApi,targetDevice=httpApi.split("@")[1];else{if(typeof httpApi=="object")if(targetDevice=this.isNumeric(this.comm[2])?this.comm[3]||"unknown":this.comm[2],httpApi[targetDevice])httpApi=httpApi[targetDevice];else{const keys=Object.keys(httpApi);keys[0]?(targetDevice=keys[0],httpApi=httpApi[keys[0]]):httpApi="error"}if(!/.*?@.*?:[0-9]+/.test(httpApi)){this.log(`❌httpApi格式错误!格式: ffff@3.3.3.18:6166`),this.done();return}}this.callApi(this.comm[2],targetDevice,httpApi)}callApi(timeout,targetDevice,httpApi){let fname=this.comm[0];const[xKey,httpApiHost]=httpApi.split("@");this.log(`获取【${fname}】内容传给【${targetDevice||httpApiHost}】`),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(fname);if(!isCurDirDataFile&&!isRootDirDataFile){lk.done();return}const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":xKey},body:{script_text:String(this.fs.readFileSync(datPath)),mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:!0};this.req.post(options).then(({error,resp,data})=>{this.log(`已将脚本【${fname}】发给【${targetDevice}】,执行结果: 
${this.twoSpace}error: ${error}
${this.twoSpace}resp: ${resp?.s()}
${this.twoSpace}data: ${this.responseDataAdapter(data)}`),this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode())return;if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误,请传入json对象");return}let boxjsJsonPath=param?.targetBoxjsJsonPath||"/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(!this.fs.existsSync(boxjsJsonPath))return;this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={},scritpUrl="#lk{script_url}";if(boxJsJson.id=`${this.prefix}${this.id}`,boxJsJson.name=this.name,boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`,boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`],boxJsJson.keys=[],boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:!0,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址,如: https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}],boxJsJson.author="#lk{author}",boxJsJson.repo="#lk{repo}",boxJsJson.script=`${scritpUrl}?raw=true`,!this.isEmpty(info))for(let key of needAppendKeys){if(this.isEmpty(info[key]))break;if(key==="settings")for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];input.id===def.id&&boxJsJson.settings.splice(j,1)}}boxJsJson[key]=boxJsJson[key].concat(info[key]),delete info[key]}Object.assign(boxJsJson,info),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.boxJsJsonFile),jsondata=boxJsJson.s(null,"	");isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata);let boxjsJson=this.fs.readFileSync(boxjsJsonPath).o();if(!boxjsJson?.apps||!Array.isArray(boxjsJson.apps)){this.log(`⚠️请在boxjs订阅json文件中添加根属性: apps, 否则无法自动构建`);return}let apps=boxjsJson.apps,targetIdx=apps.indexOf(apps.filter(app=>app.id==boxJsJson.id)[0]);targetIdx>=0?boxjsJson.apps[targetIdx]=boxJsJson:boxjsJson.apps.push(boxJsJson);let ret=boxjsJson.s(null,2);if(!this.isEmpty(param))for(const key in param){let val=param[key];if(!val)switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}ret=ret.replaceAll(`#lk{${key}}`,val)}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);m!==null&&this.log(`⚠️生成BoxJs还有未配置的参数,请参考:
${this.twoSpace}https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19
${this.twoSpace}传入参数: `);let loseParamSet=new Set;for(;(m=regex.exec(ret))!==null;)loseParamSet.add(m[1]),ret=ret.replace(`#lk{${m[1]}}`,``);loseParamSet.forEach(p=>console.log(`${this.twoSpace}${p}`)),this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){type==1?this.notifyInfo=info:this.notifyInfo.push(info)}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=!1}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return this.sleepTotalMs+=ms,new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){this.isEnableLog&&console.log(`${this.logSeparator}${message}`)}logErr(message){if(this.execStatus=!0,this.isEnableLog){let msg="";this.isEmpty(message.error)||(msg=`${msg}
${this.twoSpace}${message.error.s()}`),this.isEmpty(message.message)||(msg=`${msg}
${this.twoSpace}${message.message.s()}`),msg=`${this.logSeparator}${this.name}执行异常:${this.twoSpace}${msg}`,message&&(msg=`${msg}
${this.twoSpace}${message.s()}`),console.log(msg)}}replaceUseMap(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key))continue;message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,disappearS){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus)return;if(this.isEmpty(message)&&(Array.isArray(this.notifyInfo)?message=this.notifyInfo.join(`
`):message=this.notifyInfo),this.isEmpty(message))return;if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);const isMarkdown=this.tgNotifyUrl&&this.tgNotifyUrl.indexOf("parse_mode=Markdown")!=-1;if(isMarkdown){message=this.replaceUseMap(this.preTgEscapeCharMapping,message);let targetMapping=this.tgEscapeCharMapping;this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2")!=-1&&(targetMapping=this.tgEscapeCharMappingV2),message=this.replaceUseMap(targetMapping,message)}message=`📌${this.name}
${message}`,isMarkdown&&(message=this.replaceUseMap(this.finalTgEscapeCharMapping,message));let u=`${this.tgNotifyUrl}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl),hasMediaUrl=!this.isEmpty(mediaUrl),hasCopyText=!this.isEmpty(copyText),hasAutoDismiss=disappearS>0;this.isSurge()||this.isLoon()||this.isStash()?(hasOpenUrl&&(options.url=openUrl,options.action="open-url"),hasCopyText&&(options.text=copyText,options.action="clipboard"),this.isSurge()&&hasAutoDismiss&&(options["auto-dismiss"]=disappearS),hasMediaUrl&&(options["media-url"]=mediaUrl),$notification.post(this.name,subtitle,message,options)):this.isQuanX()?(hasOpenUrl&&(options["open-url"]=openUrl),hasMediaUrl&&(options["media-url"]=mediaUrl),$notify(this.name,subtitle,message,options)):this.isNode()?this.log("⭐️"+this.name+`
`+subtitle+`
`+message):this.isJSBox()&&$push.schedule({title:this.name,body:subtitle?subtitle+`
`+message:message})}}getVal(key,defaultValue){let value;return this.isSurge()||this.isLoon()||this.isStash()?value=$persistentStore.read(key):this.isQuanX()?value=$prefs.valueForKey(key):this.isNode()?(this.data=this.loadData(),value=process.env[key]||this.data[key]):value=this.data&&this.data[key]||null,value||defaultValue}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey)return;const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=this.getVal(this.boxjsCurSessionKey,"{}").o();if(!boxjsCurSession.hasOwnProperty(boxJsId))return;let curSessionId=boxjsCurSession[boxJsId],boxjsSessions=this.getVal(this.boxjsSessionsKey,"[]").o();if(boxjsSessions.length==0)return;let curSessionDatas=[];if(boxjsSessions.forEach(session=>{session.id==curSessionId&&(curSessionDatas=session.datas)}),curSessionDatas.length==0)return;let isExists=!1;curSessionDatas.forEach(kv=>{kv.key==key&&(kv.val=val,isExists=!0)}),isExists||curSessionDatas.push({key,val}),boxjsSessions.forEach(session=>{session.id==curSessionId&&(session.datas=curSessionDatas)}),this.setVal(this.boxjsSessionsKey,boxjsSessions.s())}setVal(key,val){return this.isSurge()||this.isLoon()||this.isStash()?(this.updateBoxjsSessions(key,val),$persistentStore.write(val,key)):this.isQuanX()?(this.updateBoxjsSessions(key,val),$prefs.setValueForKey(val,key)):this.isNode()?(this.data=this.loadData(),this.data[key]=val,this.writeData(),!0):this.data&&this.data[key]||null}loadData(){if(!this.isNode())return{};this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.dataFile);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;return this.fs.readFileSync(datPath).o()}return{}}writeData(){if(!this.isNode())return;this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.dataFile),jsondata=this.data.s();isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata)}responseDataAdapter(data){const tabString=`${this.twoSpace}${this.twoSpace}`;let ret="";return Object.keys(data).forEach(key=>{let lines=data[key]?.s().split(`
`);key=="output"&&(lines=lines.slice(0,-2)),ret=`${ret}
${tabString}${key}:
${tabString}${this.twoSpace}${lines?.join(`
${tabString}${this.twoSpace}`)}`}),ret}statusAdapter(response){return response&&(response.status=response?.status||response?.statusCode,delete response.statusCode,response)}get(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.get(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="GET",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.get(options))}post(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.post(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="POST",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request.post(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}put(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?(options.method="PUT",$httpClient.put(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)})):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="PUT",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?(options.method="PUT",this.node.request.put(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)})):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);for(;i--;)c+=(aa.pop()||0)+(bb.pop()||0),ret.unshift(c%10),c=Math.floor(c/10);for(;c;)ret.unshift(c%10),c=Math.floor(c/10);return ret.join("")}costTime(){let info=`${this.name}, 执行完毕!`;this.isNode()&&this.isExecComm&&(info=`指令【${this.comm[1]}】执行完毕!`);const endTime=(new Date).getTime(),ms=endTime-this.startTime,costTime=ms/1e3,count=this.sum(this.execCount,"1"),total=this.sum(this.costTotalMs,ms.s()),average=(Number(total)/Number(count)/1e3).toFixed(4);info=`${info}
${this.twoSpace}耗时【${costTime}】秒(含休眠${this.sleepTotalMs?(this.sleepTotalMs/1e3).toFixed(4):0}秒)`,info=`${info}
${this.twoSpace}总共执行【${count}】次,平均耗时【${average}】秒`,info=`${info}
${this.twoSpace}ToolKit v1.3.2 build 144.`,this.log(info),this.setVal(this.costTotalStringKey,`${total},${count}`.s())}done(value={}){this.costTime(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(value)}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj.s()=="{}"||obj==""||obj.s()=='""'||obj.s()=="null"||obj.s()=="undefined"||obj.length===0}isNumeric(s){return!isNaN(parseFloat(s))&&isFinite(s)}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length,pwd="";for(let i=0;i<len;i++)pwd+=chars.charAt(Math.floor(Math.random()*maxPos));return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){if(str+=``,str.length<len)for(;str.length<len;)direction==0?str+=fill:str=fill+str;if(ifCode){let temp=``;for(let i=0;i<clen;i++)temp+=cstr;str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}return str=prefix+str+suffix,this.toDBC(str)}customReplace(str,param,prefix,suffix){try{this.isEmpty(prefix)&&(prefix="#{"),this.isEmpty(suffix)&&(suffix="}");for(let i in param)str=str.replace(`${prefix}${i}${suffix}`,param[i])}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++)txtstring.charCodeAt(i)==32?tmp=tmp+String.fromCharCode(12288):txtstring.charCodeAt(i)<127&&(tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248));return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++)chr=str.charCodeAt(i),h=(h<<5)-h+chr,h|=0;return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};/(y+)/.test(format)&&(format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(format)&&(format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length)));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0)return c.substring(name.length).replace('"',"").trim()}return""}parseHTML(htmlString){let parser=new DOMParser,document=parser.parseFromString(htmlString,"text/html");return document.body}}(scriptName,scriptId,options)}