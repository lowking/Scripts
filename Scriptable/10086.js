// https://gist.githubusercontent.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9/raw/bbcac348d540e452228bd85aa80a5b45bb023a65/mz_invisible_widget.js
// 这是原作者gist地址，本人就汉化，只为引用到自己修改的Scriptable中
// 10086来源GideonSenku，https://github.com/GideonSenku/Scriptable/blob/master/10086/10086.js
const $ = new ScriptableToolKit(`10086`, `10086`, {lkIsSaveLog10086: true, lkRunLimitNum10086: 300000})
const prefix = "boxjs.net" //修改成你用的域名
// 余额警告阈值
const warnFee = 20
// 流量警告阈值，只判断单位MB的，如果是kb没做处理
const warnData = 200
// 语音警告阈值
const warnVoice = 20
// 工作日和节假日标志
const workingDaysFlag = '💡'
const holidayFlag = '🎈'

const chavy_autologin_cmcc = ``

const chavy_getfee_cmcc = ``

$.KEY_autologin = "chavy_autologin_cmcc"

$.KEY_getfee = "chavy_getfee_cmcc"

const crypto = {
    scriptName: 'crypto',
    url: 'https://raw.githubusercontent.com/GideonSenku/Scriptable/master/crypto-js.min.js'
}

const now = new Date()
const minutes = now.getMinutes()
const hours = now.getHours()

async function getdata(key) {
    const url = `http://${prefix}/query/boxdata`
    const boxdata = JSON.parse(await $.get({ url }))
    if (boxdata.datas[key]) {
        return boxdata.datas[key]
    } else {
        return undefined
    }
}

if (config.runsInWidget) {
    $.log('在小组件运行')
    if (await $.checkLimit()) {
        $.execFail()
        $.saveLog()
        return false;
    }
    main()
} else {
    $.log('手动运行')
    let enter = await $.widgetEnter()
    await $.handleOperations(enter)
}

async function main() {
    let widget = new ListWidget()
    try {
        widget.backgroundImage = $.getWidgetBg()
        // Your code here
        if (now.getDate() == 1) {
            // 每个月1号维护查询不到数据
            $.log('每个月1号维护查询不到数据，直接降级处理')
            widget = await createWidget(widget, "移不动", '-', '-', '-')
        } else {
            if (true || minutes >= 0 && minutes <= 20) {
                $.CryptoJS = $.require(crypto)
                $.autologin = await getdata($.KEY_autologin)
                $.getfee = await getdata($.KEY_getfee)
                await loginapp()
                await queryfee()
                await querymeal()
                // 执行失败，降级处理
                if (!$.execStatus) {
                    $.log('整个流程有错误发生，降级处理，读取上次成功执行的数据')
                    $.log(`读取数据：${await $.getDataFile('local')}`)
                    widget = await createWidget(widget, "移不动", await $.getVal('subt', 'local', '-'), await $.getVal('flowRes', 'local', '-'), await $.getVal('voiceRes', 'local', '-'))
                } else {
                    $.log('整个流程执行正常')
                    widget = await showmsg(widget)
                }
            }
        }
        $.saveLog()
        Script.setWidget(widget)
        Script.complete()
    } catch (e) {
        // 为了不影响正常显示
        $.logErr(e)
    }
}

function showmsg(w) {
    return new Promise(async (resolve) => {
        $.log('显示信息')
        $.subt = `[话费] ${$.fee.rspBody.curFee}元`
        const res = $.meal.rspBody.qryInfoRsp[0].resourcesTotal
        const flowRes = res.find((r) => r.resourcesCode === '04')
        const voiceRes = res.find((r) => r.resourcesCode === '01')
        $.log(JSON.stringify(flowRes))
        if (flowRes) {
            const remUnit = flowRes.remUnit === '05' ? 'GB' : 'MB'
            const usedUnit = flowRes.usedUnit === '05' ? 'GB' : 'MB'
            const unit = flowRes.allUnit === '05' ? 'GB' : 'MB'
            $.flowRes = `[流量] ${flowRes.allRemainRes}${remUnit}`
        }
        if (voiceRes) {
            const remUnit = flowRes.remUnit === '01' ? '分钟' : ''
            const usedUnit = flowRes.usedUnit === '01' ? '分钟' : ''
            const allUnit = '分钟'
            $.voiceRes = `[语音] ${voiceRes.allRemainRes}${allUnit}`
        }

        let widget = await createWidget(w, "移不动", $.subt, $.flowRes, $.voiceRes)

        $.log('显示信息end')
        resolve(widget)
    })
}

async function createWidget(w, pretitle, title, subtitle, other) {
    $.log('创建widget')

    // 保存成功执行的数据
    if (title != '-') {
        $.setVal('subt', title, 'local')
        $.setVal('flowRes', subtitle, 'local')
        $.setVal('voiceRes', other, 'local')
        $.log(`写入数据：${await $.getDataFile('local')}`)
    }
    const bgColor = new LinearGradient()
    bgColor.colors = [new Color("#001A27"), new Color("#00334e")]
    bgColor.locations = [0.0, 1.0]

    // 获取第二天是否工作日
    let targetDate = new Date()
    let isWD = await $.isWorkingDays(new Date(targetDate.setDate(now.getDate() + 1)))
    $.log(`设置标题-${pretitle}${isWD}`)
    let normalColor = new Color("#ccc")
    let preTxt = w.addText(pretitle + isWD)
    let preColor = normalColor
    preTxt.textColor = preColor
    preTxt.font = Font.boldSystemFont(18)
    // preTxt.applyHeadlineTextStyling()
    w.addSpacer(7)
    // preTxt.applySubheadlineTextStyling()


    $.log('设置话费')
    let titleTxt = w.addText(title)
    let warnColor = new Color("#82632C")
    let normalFontSize = 14
    const sp = 3
    preColor = normalColor
    if (Number(title.replace('元', '').substring(title.indexOf(']') + 1)) < warnFee) {
        preColor = warnColor
    }
    titleTxt.textColor = preColor
    titleTxt.font = Font.systemFont(14)
    titleTxt.textSize = normalFontSize
    w.addSpacer(sp)


    $.log('设置流量')
    let subTxt = w.addText(subtitle)
    preColor = normalColor
    if (subtitle.indexOf('MB') && Number(subtitle.replace('MB', '').substring(subtitle.indexOf(']') + 1)) < warnData) {
        preColor = warnColor
    }
    subTxt.textColor = preColor
    subTxt.font = Font.systemFont(14)
    subTxt.textSize = normalFontSize
    w.addSpacer(sp)

    $.log('设置语音')
    let otherTxt = w.addText(other)
    preColor = normalColor
    if (other.indexOf('分钟') && Number(other.replace('分钟', '').substring(other.indexOf(']') + 1)) < warnVoice) {
        preColor = warnColor
    }
    otherTxt.textColor = preColor
    otherTxt.font = Font.systemFont(14)
    otherTxt.textSize = normalFontSize
    w.addSpacer(sp)

    $.log('设置更新时间')
    let minTxt = w.addText(`${$.execStatus?'':'⚬'}更新于：${hours > 9 ? hours : "0" + hours}:${minutes > 9 ? minutes : "0" + minutes}`)
    minTxt.textColor = new Color("#777")
    minTxt.font = Font.systemFont(11)
    minTxt.textSize = 11
    w.addSpacer(sp)

    w.presentSmall()
    $.log('创建widget end')
    return w
}

function loginapp() {
    return new Promise((resolve) => {
        $.log('登录开始')
        const url = $.autologin
            ? JSON.parse($.autologin)
            : JSON.parse(chavy_autologin_cmcc)
        $.post(url, (resp, data) => {
            $.log('登录接口响应返回')
            try {
                $.setck = resp.headers["Set-Cookie"]
                $.log('登录完成')
            } catch (e) {
                $.log('登录异常')
                $.logErr(e)
                $.log(resp)
            } finally {
                resolve()
            }
        })
    })
}

function queryfee() {
    return new Promise((resolve) => {
        $.log('查询余额')
        const url = $.getfee ? JSON.parse($.getfee) : JSON.parse(chavy_getfee_cmcc)
        const body = JSON.parse(decrypt(url.body, "bAIgvwAuA4tbDr9d"))
        const cellNum = body.reqBody.cellNum
        const bodystr = `{"t":"${$.CryptoJS.MD5(
            $.setck
        ).toString()}","cv":"9.9.9","reqBody":{"cellNum":"${cellNum}"}}`
        url.body = encrypt(bodystr, "bAIgvwAuA4tbDr9d")
        url.headers["Cookie"] = $.setck
        url.headers["xs"] = $.CryptoJS.MD5(
            url.url + "_" + bodystr + "_Leadeon/SecurityOrganization"
        ).toString()

        $.post(url, (resp, data) => {
            $.log('查询余额响应返回')
            try {
                $.log(`解密结果：${decrypt(data, "GS7VelkJl5IT1uwQ")}`)
                $.fee = JSON.parse(decrypt(data, "GS7VelkJl5IT1uwQ"))
                $.log('查询余额结束')
            } catch (e) {
                $.log('查询余额异常')
                $.logErr(e)
                $.log(data)
                $.log(`查询余额异常，请求体：${JSON.stringify(url)}`)
            } finally {
                resolve()
            }
        })
    })
}

function querymeal() {
    return new Promise((resolve) => {
        $.log('查询套餐')
        const url = $.getfee ? JSON.parse($.getfee) : JSON.parse(chavy_getfee_cmcc)
        url.url =
            "https://clientaccess.10086.cn/biz-orange/BN/newComboMealResouceUnite/getNewComboMealResource"
        const body = JSON.parse(decrypt(url.body, "bAIgvwAuA4tbDr9d"))
        const cellNum = body.reqBody.cellNum
        const bodystr = `{"t":"${$.CryptoJS.MD5(
            $.setck
        ).toString()}","cv":"9.9.9","reqBody":{"cellNum":"${cellNum}","tag":"3"}}`
        url.body = encrypt(bodystr, "bAIgvwAuA4tbDr9d")
        url.headers["Cookie"] = $.setck
        url.headers["xs"] = $.CryptoJS.MD5(
            url.url + "_" + bodystr + "_Leadeon/SecurityOrganization"
        ).toString()
        $.post(url, (resp, data) => {
            $.log('查询套餐响应返回')
            try {
                $.meal = JSON.parse(decrypt(data, "GS7VelkJl5IT1uwQ"))
                $.log('查询套餐完成')
            } catch (e) {
                $.log('查询套餐异常')
                $.logErr(e)
                $.log(data)
                $.log(`查询套餐异常，请求体：${JSON.stringify(url)}`)
            } finally {
                resolve()
            }
        })
    })
}


function encrypt(str, key) {
    return $.CryptoJS.AES.encrypt($.CryptoJS.enc.Utf8.parse(str), $.CryptoJS.enc.Utf8.parse(key), {
        iv: $.CryptoJS.enc.Utf8.parse('9791027341711819'),
        mode: $.CryptoJS.mode.CBC,
        padding: $.CryptoJS.pad.Pkcs7
    }).toString()
}

function decrypt(str, key) {
    return $.CryptoJS.AES.decrypt(str, $.CryptoJS.enc.Utf8.parse(key), {
        iv: $.CryptoJS.enc.Utf8.parse('9791027341711819'),
        mode: $.CryptoJS.mode.CBC,
        padding: $.CryptoJS.pad.Pkcs7
    }).toString($.CryptoJS.enc.Utf8)
}

//ScriptableToolKit-start
function ScriptableToolKit(scriptName,scriptId,options){return new class{constructor(scriptName,scriptId,options){this.isLimited=false;this.checkLimit();this.local=FileManager.local();this.icloud=FileManager.iCloud();this.curDateCache=this.local.joinPath(this.local.documentsDirectory(),"curDateCache");this.options=options;this.tgEscapeCharMapping={"&":"＆"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=scriptName;this.id=scriptId;this.data=null;this.dataFile=`${this.prefix}${this.id}.json`;this.bgImgPath=`${this.prefix}${this.id}Bg.jpg`;this.bgImgPath=this.local.joinPath(this.local.documentsDirectory(),this.bgImgPath);this.lang=Device.language();this.msg={zh:{s0:"在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。",s1:"看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。",s2:"你想创建什么尺寸的widget？",s3:"你想把widget放在哪里？",s4:" (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。",s5:"widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？",s6:"已经截图，继续",s7:"退出去截图",s8:"小",s9:"中",s10:"大",s11:"顶部左边",s12:"顶部右边",s13:"中间左边",s14:"中间右边",s15:"底部左边",s16:"底部右边",s17:"顶部",s18:"中间",s19:"底部",s20:"在Scriptable内部使用",s21:"导出到相册",s22:"填写遮罩层颜色。（格式：#000000）",s23:"颜色（格式：#000000）",s24:"填写遮罩层不透明度（0-1之间）",s25:"0-1之间",s26:"确定",s27:"取消",s28:"预览widget",s29:"设置widget背景",s30:"入口",s31:"你用的是哪个型号？",s32:"退出",s33:"清除缓存",s34:"开始清除缓存",s35:"清除缓存完成"},en:{s0:"Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.",s1:"It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",s2:"What size of widget are you creating?",s3:"What position will it be in?",s4:" (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)",s5:"Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?",s6:"Continue",s7:"Exit to Take Screenshot",s8:"Small",s9:"Medium",s10:"Large",s11:"Top left",s12:"Top right",s13:"Middle left",s14:"Middle right",s15:"Bottom left",s16:"Bottom right",s17:"Top",s18:"Middle",s19:"Bottom",s20:"Use in Scriptable",s21:"Export to Photos",s22:"Fill in the mask layer color. (Format: #000000)",s23:"Color.(Format: #000000)",s24:"Fill in the mask layer opacity (between 0-1)",s25:"between 0-1",s26:"Confirm",s27:"Cancel",s28:"Preview widget",s29:"Setting widget background",s30:"ENTER",s31:"What type of iPhone do you have?",s32:"Exit",s33:"Clean cache",s34:"Clean cache started",s35:"Clean cache finished"}};this.curLang=this.msg[this.lang]||this.msg.en;this.isSaveLog=this.getResultByKey(`${this.prefix}IsSaveLog${this.id}`,false);this.isEnableLog=this.getResultByKey(`${this.prefix}IsEnableLog${this.id}`,true);this.logDir=this.icloud.documentsDirectory()+"/lklogs/"+this.id;this.logSeparator="\n██";this.now=new Date;this.execStatus=true;this.notifyInfo=[];this.operations=[]}async checkLimit(){const lastRunningTime=await this.getVal(`${this.prefix}LastRunningTime${this.id}`,"local",0);const runLimitNum=this.getResultByKey(`${this.prefix}RunLimitNum${this.id}`,3e5);this.log(`上次运行时间：${lastRunningTime}，运行频率限制：${runLimitNum}`);if(lastRunningTime>=0){if(this.now.getTime()-lastRunningTime<=runLimitNum){this.appendNotifyInfo("限制运行");this.isLimited=true}else{await this.setVal(`${this.prefix}LastRunningTime${this.id}`,this.now.getTime(),"local")}}return this.isLimited}getResultByKey(key,defaultValue){if(!this.options){return defaultValue}const val=this.options[key];if(this.isEmpty(val)){return defaultValue}else{return val}}appendNotifyInfo(info,type){if(type==1){this.notifyInfo=info}else{this.notifyInfo.push(`${this.logSeparator}${this.formatDate(new Date,"yyyy-MM-dd HH:mm:ss.S")}█${info}`)}}saveLog(){if(this.isSaveLog){let message;if(Array.isArray(this.notifyInfo)){message=this.notifyInfo.join("")}else{message=this.notifyInfo}if(!this.icloud.isDirectory(this.logDir)){this.icloud.createDirectory(this.logDir,true)}this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now,"yyyyMMddHHmmss")}.log`,message)}}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=false}sleep(time){return new Promise(resolve=>setTimeout(resolve,time))}log(message){if(this.isEnableLog)console.log(`${this.logSeparator}${JSON.stringify(message)}`);this.appendNotifyInfo(message)}logErr(message){this.execStatus=false;if(this.isEnableLog){console.warn(`${this.logSeparator}${this.name}执行异常:`);console.warn(message);console.warn(`\n${message.message}`)}}getContainer(key){return key=="local"?this.local:this.icloud}async getVal(key,container,defaultValue){let containerInstance=this.getContainer(container);let data="";try{let realDataFile=containerInstance.joinPath(containerInstance.documentsDirectory(),this.dataFile);if(!containerInstance.fileExists(realDataFile)){await this.setVal(key,defaultValue,container);return defaultValue}data=await containerInstance.readString(realDataFile);data=JSON.parse(data)}catch(e){throw e}if(data.hasOwnProperty(key)){return data[key]}else{await this.setVal(key,defaultValue,container);return defaultValue}}async getDataFile(container){let containerInstance=this.getContainer(container);let data="";try{let realDataFile=containerInstance.joinPath(containerInstance.documentsDirectory(),this.dataFile);if(!containerInstance.fileExists(realDataFile)){return Promise.resolve("")}data=await containerInstance.readString(realDataFile)}catch(e){throw e}return Promise.resolve(data)}async saveImage(fileName,image,container){let containerInstance=this.getContainer(container);let imagePath=containerInstance.joinPath(containerInstance.documentsDirectory(),`${this.prefix}${this.id}/${fileName}`);let imageDir=imagePath.substring(0,imagePath.lastIndexOf("/")+1);if(!containerInstance.isDirectory(imageDir)){containerInstance.createDirectory(imageDir,true)}containerInstance.writeImage(imagePath,image)}async getImage(fileName,container){let containerInstance=this.getContainer(container);let imagePath=containerInstance.joinPath(containerInstance.documentsDirectory(),`${this.prefix}${this.id}/${fileName}`);if(!containerInstance.fileExists(imagePath)){this.logErr(`file not exist: ${imagePath}`);return false}return await containerInstance.readImage(imagePath)}async setVal(key,val,container){let containerInstance=this.getContainer(container);let data;let realDataFile=containerInstance.joinPath(containerInstance.documentsDirectory(),this.dataFile);try{if(!containerInstance.fileExists(realDataFile)){data={}}else{data=await containerInstance.readString(realDataFile);data=JSON.parse(data)}}catch(e){data={}}data[key]=val;await containerInstance.writeString(realDataFile,JSON.stringify(data))}async get(options,callback=(()=>{})){let request=new Request("");request.url=options.url;request.method="GET";request.headers=options.headers;try{const result=await request.loadString();callback(request.response,result);return result}catch(e){this.logErr(e);callback(undefined,undefined)}}async post(options,callback=(()=>{})){let request=new Request("");request.url=options.url;request.body=options.body;request.method="POST";request.headers=options.headers;request.timeout=5e3;try{const result=await request.loadString();callback(request.response,result);return result}catch(e){this.logErr(e);callback(undefined,undefined)}}async loadScript({scriptName:scriptName,url:url}){this.log(`获取脚本【${scriptName}】`);const content=await this.get({url:url});this.icloud.writeString(`${this.icloud.documentsDirectory()}/${scriptName}.js`,content);this.log(`获取脚本【${scriptName}】完成🎉`)}require({scriptName:scriptName,url:url="",reload:reload=false}){if(this.icloud.fileExists(this.icloud.joinPath(this.icloud.documentsDirectory(),`${scriptName}.js`))&&!reload){this.log(`引用脚本【${scriptName}】`);return importModule(scriptName)}else{this.loadScript({scriptName:scriptName,url:url});this.log(`引用脚本【${scriptName}】`);return importModule(scriptName)}}async generateInputAlert(message,field,defaultValue){let result=[];let alert=new Alert;alert.message=message;alert.addTextField(field,defaultValue);alert.addCancelAction(this.curLang.s27);alert.addAction(this.curLang.s26);result[0]=await alert.presentAlert();result[1]=alert.textFieldValue(0);return result}async generateAlert(message,options){let alert=new Alert;alert.message=message;for(const option of options){alert.addAction(option)}return await alert.presentAlert()}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"}isWorkingDays(now,workingDaysFlag="curlybraces",holidayFlag="gamecontroller"){return new Promise(async(resolve,reject)=>{let sp="≈";const d=this.formatDate(now,"yyyy-MM-dd");let resultStr=0;try{let curDate=await this.getVal("curDateCache","local","fff");let curDateErrorTime=await this.getVal("curDateCacheErrorTime","local",this.now.getTime());let isPreError=!this.isEmpty(curDateErrorTime)&&Number(curDateErrorTime)+5*60*1e3<this.now.getTime();if(!isPreError&&d==curDate.split(sp)[0]&&curDate.split(sp)[1]!="❌"){resultStr=curDate.split(sp)[1];this.log("already request")}else{this.log("send request");const url={url:"http://timor.tech/api/holiday/info/"+d};await this.get(url,(resp,data)=>{if(data.indexOf("<")==0){resultStr="❌"}else{resultStr=JSON.parse(data);if(resultStr.code==-1){resultStr="❌"}else{resultStr=resultStr.type.type}}})}}catch(e){resultStr="❌";this.logErr(e)}finally{await this.setVal("curDateCache",`${d}${sp}${resultStr}`,"local");if(resultStr=="❌"){resolve(resultStr);this.log("写入运行错误时间，5分钟后重新请求！");this.setVal("curDateCache","","local");this.setVal("curDateCacheErrorTime",`${this.now.getTime()}`,"local")}else{this.setVal("curDateCacheErrorTime","","local");this.setVal("curDateCache",`${d}${sp}${resultStr}`,"local");resolve(resultStr==0||resultStr==3?workingDaysFlag:holidayFlag)}}})}randomString(len){len=len||32;var $chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var maxPos=$chars.length;var pwd="";for(let i=0;i<len;i++){pwd+=$chars.charAt(Math.floor(Math.random()*maxPos))}return pwd}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};if(/(y+)/.test(format))format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length));for(let k in o)if(new RegExp("("+k+")").test(format))format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length));return format}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){str+=``;if(str.length<len){while(str.length<len){if(direction==0){str+=fill}else{str=fill+str}}}if(ifCode){let temp=``;for(var i=0;i<clen;i++){temp+=cstr}str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}str=prefix+str+suffix;return this.toDBC(str)}customReplace(str,param,prefix,suffix){try{if(this.isEmpty(prefix)){prefix="#{"}if(this.isEmpty(suffix)){suffix="}"}for(let i in param){str=str.replace(`${prefix}${i}${suffix}`,param[i])}}catch(e){this.logErr(e)}return str}toDBC(txtstring){var tmp="";for(var i=0;i<txtstring.length;i++){if(txtstring.charCodeAt(i)==32){tmp=tmp+String.fromCharCode(12288)}else if(txtstring.charCodeAt(i)<127){tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248)}}return tmp}getWidgetBg(){return this.local.readImage(this.bgImgPath)}phoneSizes(){return{2868:{small:510,medium:1092,large:1146,left:114,right:696,top:276,middle:912,bottom:1548},2796:{small:510,medium:1092,large:1146,left:99,right:681,top:282,middle:918,bottom:1554},2556:{small:474,medium:1014,large:1062,left:82,right:622,top:270,middle:858,bottom:1446},2778:{small:510,medium:1092,large:1146,left:96,right:678,top:246,middle:882,bottom:1518},2532:{small:474,medium:1014,large:1062,left:78,right:618,top:231,middle:819,bottom:1407},2688:{small:507,medium:1080,large:1137,left:81,right:654,top:228,middle:858,bottom:1488},1792:{small:338,medium:720,large:758,left:54,right:436,top:160,middle:580,bottom:1e3},2436:{x:{small:465,medium:987,large:1035,left:69,right:591,top:213,middle:783,bottom:1353},mini:{small:465,medium:987,large:1035,left:69,right:591,top:231,middle:801,bottom:1371}},2208:{small:471,medium:1044,large:1071,left:99,right:672,top:114,middle:696,bottom:1278},1334:{small:296,medium:642,large:648,left:54,right:400,top:60,middle:412,bottom:764},1136:{small:282,medium:584,large:622,left:30,right:332,top:59,middle:399,bottom:399},1624:{small:310,medium:658,large:690,left:46,right:394,top:142,middle:522,bottom:902},2001:{small:444,medium:963,large:972,left:81,right:600,top:90,middle:618,bottom:1146}}}remove(path){this.local.remove(path)}cropImage(img,rect,color,opacity){let draw=new DrawContext;draw.size=new Size(rect.width,rect.height);draw.drawImageAtPoint(img,new Point(-rect.x,-rect.y));draw.setFillColor(new Color(color,Number(opacity)));draw.fillRect(new Rect(0,0,img.size["width"],img.size["height"]));return draw.getImage()}async widgetCutBg(){var message;message=this.curLang.s0;let exitOptions=[this.curLang.s6,this.curLang.s7];let shouldExit=await this.generateAlert(message,exitOptions);if(shouldExit)return;let img=await Photos.fromLibrary();let height=img.size.height;let phone=this.phoneSizes()[height];if(!phone){message=this.curLang.s1;await this.generateAlert(message,["OK"]);return}if(height==2436){message=this.curLang.s31;let types=["iPhone 12 mini","iPhone 11 Pro, XS, X"];let typeIndex=await this.generateAlert(message,types);let type=typeIndex==0?"mini":"x";phone=phone[type]}message=this.curLang.s2;let sizes=[this.curLang.s8,this.curLang.s9,this.curLang.s10];let size=await this.generateAlert(message,sizes);message=this.curLang.s3;message+=height==1136?this.curLang.s4:"";let crop={w:"",h:"",x:"",y:""};if(size==0){crop.w=phone.small;crop.h=phone.small;let positions=["Top left","Top right","Middle left","Middle right","Bottom left","Bottom right"];let positionsString=[this.curLang.s11,this.curLang.s12,this.curLang.s13,this.curLang.s14,this.curLang.s15,this.curLang.s16];let position=await this.generateAlert(message,positionsString);let keys=positions[position].toLowerCase().split(" ");crop.y=phone[keys[0]];crop.x=phone[keys[1]]}else if(size==1){crop.w=phone.medium;crop.h=phone.small;crop.x=phone.left;let positions=["Top","Middle","Bottom"];let positionsString=[this.curLang.s17,this.curLang.s18,this.curLang.s19];let position=await this.generateAlert(message,positionsString);let key=positions[position].toLowerCase();crop.y=phone[key]}else if(size==2){crop.w=phone.medium;crop.h=phone.large;crop.x=phone.left;let positionsString=[this.curLang.s17,this.curLang.s19];let position=await this.generateAlert(message,positionsString);crop.y=position?phone.middle:phone.top}let maskLayerColor=await this.generateInputAlert(this.curLang.s22,this.curLang.s23,"#000000");if(maskLayerColor[0]==-1)return;let opacity=await this.generateInputAlert(this.curLang.s24,this.curLang.s25,"0.1");if(opacity[0]==-1)return;let imgCrop=this.cropImage(img,new Rect(crop.x,crop.y,crop.w,crop.h),maskLayerColor[1],opacity[1]);message=this.curLang.s5;const exportPhotoOptions=[this.curLang.s20,this.curLang.s21];const exportPhoto=await this.generateAlert(message,exportPhotoOptions);if(exportPhoto){Photos.save(imgCrop)}else{this.local.writeImage(this.bgImgPath,imgCrop)}Script.complete()}async widgetEnter(customEnter,isReset){await this.setVal("lastRunningTime",0,"local");let options=[this.curLang.s28,this.curLang.s29,this.curLang.s33];if(Array.isArray(customEnter)){let customEnterNames=customEnter.map((item,index)=>{return item.name[this.lang]});let customEnterCallback=customEnter.map((item,index)=>{return item.callback});if(isReset){options=customEnterNames}else{this.operations.push({callback:main});this.operations.push({callback:function(){$.widgetCutBg()}});this.operations.push({callback:function(){$.cleanCache()}});options=options.concat(customEnterNames)}customEnterCallback.forEach(callback=>{this.operations.push({callback:callback})})}options.push(this.curLang.s32);this.operations.push({callback:function(){}});return await this.generateAlert(this.curLang.s30,options)}async handleOperations(index){await this.operations[index].callback()}cleanCache(){this.log(this.curLang.s34);let filePath=this.local.joinPath(this.local.documentsDirectory(),this.dataFile);if(this.local.fileExists(filePath)){this.local.remove(filePath)}filePath=this.bgImgPath;if(this.local.fileExists(filePath)){this.local.remove(filePath)}this.log(this.curLang.s35)}formatTimeDuring(total,lang="zh",n=0){total=Number(total);let zhUnitArr=["毫秒","秒","分钟","小时","天","月","年"];let enUnitArr=["ms","s","min","h","d","m","y"];let scaleArr=[1e3,60,60,24,30,12,100];let len=total;if(len>scaleArr[n]){len=total/scaleArr[n];return this.formatTimeDuring(len,lang,++n)}else{let unit=zhUnitArr[n];if(lang==="en"){unit=enUnitArr[n]}return len.toFixed(2)+""+unit}}fileLengthFormat(total,unit="",toByte=false){total=Number(total);var unitArr=["","KB","MB","GB","TB","PB","EB","ZB"];var n=0;try{n=unitArr.indexOf(unit)}catch(e){throw e}if(toByte){if(n==0){return total}return this.fileLengthFormat(total*1024,unitArr[--n],true)}var len=total;if(len>1e3){len=total/1024;return this.fileLengthFormat(len,unitArr[++n])}else{if(n==0){return len.toFixed(2)}return len.toFixed(2)+" "+unitArr[n]}}}(scriptName,scriptId,options)}
//ScriptableToolKit-end
