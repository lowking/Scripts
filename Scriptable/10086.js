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
function ScriptableToolKit(t,e,i){return new class{constructor(t,e,i){this.isLimited=false;this.checkLimit();this.local=FileManager.local();this.icloud=FileManager.iCloud();this.curDateCache=this.local.joinPath(this.local.documentsDirectory(),"curDateCache");this.options=i;this.tgEscapeCharMapping={"&":"＆"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=e;this.data=null;this.dataFile=`${this.prefix}${this.id}.json`;this.bgImgPath=`${this.prefix}${this.id}Bg.jpg`;this.bgImgPath=this.local.joinPath(this.local.documentsDirectory(),this.bgImgPath);this.lang=Device.language();this.msg={zh:{s0:"在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。",s1:"看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。",s2:"你想创建什么尺寸的widget？",s3:"你想把widget放在哪里？",s4:" (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。",s5:"widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？",s6:"已经截图，继续",s7:"退出去截图",s8:"小",s9:"中",s10:"大",s11:"顶部左边",s12:"顶部右边",s13:"中间左边",s14:"中间右边",s15:"底部左边",s16:"底部右边",s17:"顶部",s18:"中间",s19:"底部",s20:"在Scriptable内部使用",s21:"导出到相册",s22:"填写遮罩层颜色。（格式：#000000）",s23:"颜色（格式：#000000）",s24:"填写遮罩层不透明度（0-1之间）",s25:"0-1之间",s26:"确定",s27:"取消",s28:"预览widget",s29:"设置widget背景",s30:"入口",s31:"你用的是哪个型号？",s32:"退出",s33:"清除缓存",s34:"开始清除缓存",s35:"清除缓存完成"},en:{s0:"Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.",s1:"It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",s2:"What size of widget are you creating?",s3:"What position will it be in?",s4:" (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)",s5:"Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?",s6:"Continue",s7:"Exit to Take Screenshot",s8:"Small",s9:"Medium",s10:"Large",s11:"Top left",s12:"Top right",s13:"Middle left",s14:"Middle right",s15:"Bottom left",s16:"Bottom right",s17:"Top",s18:"Middle",s19:"Bottom",s20:"Use in Scriptable",s21:"Export to Photos",s22:"Fill in the mask layer color. (Format: #000000)",s23:"Color.(Format: #000000)",s24:"Fill in the mask layer opacity (between 0-1)",s25:"between 0-1",s26:"Confirm",s27:"Cancel",s28:"Preview widget",s29:"Setting widget background",s30:"ENTER",s31:"What type of iPhone do you have?",s32:"Exit",s33:"Clean cache",s34:"Clean cache started",s35:"Clean cache finished"}};this.curLang=this.msg[this.lang]||this.msg.en;this.isSaveLog=this.getResultByKey(`${this.prefix}IsSaveLog${this.id}`,false);this.isEnableLog=this.getResultByKey(`${this.prefix}IsEnableLog${this.id}`,true);this.logDir=this.icloud.documentsDirectory()+"/lklogs/"+this.id;this.logSeparator="\n██";this.now=new Date;this.execStatus=true;this.notifyInfo=[];this.operations=[]}async checkLimit(){const t=await this.getVal("lastRunningTime","local",0);const e=this.getResultByKey(`${this.prefix}RunLimitNum${this.id}`,3e5);if(t>0){if(this.now.getTime()-t<=e){this.appendNotifyInfo("限制运行");this.isLimited=true}else{await this.setVal("lastRunningTime",this.now.getTime(),"local")}}return this.isLimited}getResultByKey(t,e){if(!this.options){return e}const i=this.options[t];if(this.isEmpty(i)){return e}else{return i}}appendNotifyInfo(t,e){if(e==1){this.notifyInfo=t}else{this.notifyInfo.push(`${this.logSeparator}${this.formatDate(new Date,"yyyy-MM-dd HH:mm:ss.S")}█${t}`)}}saveLog(){if(this.isSaveLog){let t;if(Array.isArray(this.notifyInfo)){t=this.notifyInfo.join("")}else{t=this.notifyInfo}if(this.icloud.isDirectory(this.logDir)){this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now,"yyyyMMddHHmmss")}.log`,t)}else{this.icloud.createDirectory(this.logDir,true);this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now,"yyyyMMddHHmmss")}.log`,t)}}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}sleep(t){return new Promise(e=>setTimeout(e,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`);this.appendNotifyInfo(t)}logErr(t){this.execStatus=false;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}getContainer(t){return t=="local"?this.local:this.icloud}async getVal(t,e,i){let s=this.getContainer(e);let a="";try{let r=s.joinPath(s.documentsDirectory(),this.dataFile);if(!s.fileExists(r)){await this.setVal(t,i,e);return Promise.resolve(i)}a=await s.readString(r);a=JSON.parse(a)}catch(t){throw t}if(a.hasOwnProperty(t)){return Promise.resolve(a[t])}else{await this.setVal(t,i,e);return Promise.resolve(i)}}async getDataFile(t){let e=this.getContainer(t);let i="";try{let t=e.joinPath(e.documentsDirectory(),this.dataFile);if(!e.fileExists(t)){return Promise.resolve("")}i=await e.readString(t)}catch(t){throw t}return Promise.resolve(i)}async setVal(t,e,i){let s=this.getContainer(i);let a;let r=s.joinPath(s.documentsDirectory(),this.dataFile);try{if(!s.fileExists(r)){a={}}else{a=await s.readString(r);a=JSON.parse(a)}}catch(t){a={}}a[t]=e;s.writeString(r,JSON.stringify(a))}async get(t,e=(()=>{})){let i=new Request("");i.url=t.url;i.method="GET";i.headers=t.headers;const s=await i.loadString();e(i.response,s);return s}async post(t,e=(()=>{})){let i=new Request("");i.url=t.url;i.body=t.body;i.method="POST";i.headers=t.headers;const s=await i.loadString();e(i.response,s);return s}async loadScript({scriptName:t,url:e}){this.log(`获取脚本【${t}】`);const i=await this.get({url:e});this.icloud.writeString(`${this.icloud.documentsDirectory()}/${t}.js`,i);this.log(`获取脚本【${t}】完成🎉`)}require({scriptName:t,url:e="",reload:i=false}){if(this.icloud.fileExists(this.icloud.joinPath(this.icloud.documentsDirectory(),`${t}.js`))&&!i){this.log(`引用脚本【${t}】`);return importModule(t)}else{this.loadScript({scriptName:t,url:e});this.log(`引用脚本【${t}】`);return importModule(t)}}async generateInputAlert(t,e,i){let s=[];let a=new Alert;a.message=t;a.addTextField(e,i);a.addCancelAction(this.curLang.s27);a.addAction(this.curLang.s26);s[0]=await a.presentAlert();s[1]=a.textFieldValue(0);return s}async generateAlert(t,e){let i=new Alert;i.message=t;for(const t of e){i.addAction(t)}return await i.presentAlert()}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"}isWorkingDays(t){return new Promise(async(e,i)=>{let s="≈";const a=this.formatDate(t,"yyyy-MM-dd");let r=0;try{let t=await this.getVal("curDateCache","local","fff");if(a==t.split(s)[0]&&t.split(s)[1].length==1){r=t.split(s)[1];this.log("already request")}else{this.log("send request");const t={url:"http://timor.tech/api/holiday/info/"+a};await this.get(t,(t,e)=>{if(e.indexOf("<")==0){r="❌"}else{r=JSON.parse(e);if(r.code==-1){r="❌"}else{r=r.type.type}}})}}catch(t){r="❌";this.logErr(t)}finally{this.log(JSON.stringify(r));this.setVal("curDateCache",`${a+s+r}`,"local");if(r=="❌"){e(r)}else{e(r==0?workingDaysFlag:holidayFlag)}}})}randomString(t){t=t||32;var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=e.length;var s="";for(let a=0;a<t;a++){s+=e.charAt(Math.floor(Math.random()*i))}return s}formatDate(t,e){let i={"M+":t.getMonth()+1,"d+":t.getDate(),"H+":t.getHours(),"m+":t.getMinutes(),"s+":t.getSeconds(),"q+":Math.floor((t.getMonth()+3)/3),S:t.getMilliseconds()};if(/(y+)/.test(e))e=e.replace(RegExp.$1,(t.getFullYear()+"").substr(4-RegExp.$1.length));for(let t in i)if(new RegExp("("+t+")").test(e))e=e.replace(RegExp.$1,RegExp.$1.length==1?i[t]:("00"+i[t]).substr((""+i[t]).length));return e}autoComplete(t,e,i,s,a,r,l,o,n,h){t+=``;if(t.length<a){while(t.length<a){if(r==0){t+=s}else{t=s+t}}}if(l){let e=``;for(var g=0;g<o;g++){e+=h}t=t.substring(0,n)+e+t.substring(o+n)}t=e+t+i;return this.toDBC(t)}customReplace(t,e,i,s){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(s)){s="}"}for(let a in e){t=t.replace(`${i}${a}${s}`,e[a])}}catch(t){this.logErr(t)}return t}toDBC(t){var e="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){e=e+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){e=e+String.fromCharCode(t.charCodeAt(i)+65248)}}return e}getWidgetBg(){return this.local.readImage(this.bgImgPath)}phoneSizes(){return{2778:{small:510,medium:1092,large:1146,left:96,right:678,top:246,middle:882,bottom:1518},2532:{small:474,medium:1014,large:1062,left:78,right:618,top:231,middle:819,bottom:1407},2688:{small:507,medium:1080,large:1137,left:81,right:654,top:228,middle:858,bottom:1488},1792:{small:338,medium:720,large:758,left:54,right:436,top:160,middle:580,bottom:1e3},2436:{x:{small:465,medium:987,large:1035,left:69,right:591,top:213,middle:783,bottom:1353},mini:{small:465,medium:987,large:1035,left:69,right:591,top:231,middle:801,bottom:1371}},2208:{small:471,medium:1044,large:1071,left:99,right:672,top:114,middle:696,bottom:1278},1334:{small:296,medium:642,large:648,left:54,right:400,top:60,middle:412,bottom:764},1136:{small:282,medium:584,large:622,left:30,right:332,top:59,middle:399,bottom:399},1624:{small:310,medium:658,large:690,left:46,right:394,top:142,middle:522,bottom:902},2001:{small:444,medium:963,large:972,left:81,right:600,top:90,middle:618,bottom:1146}}}remove(t){this.local.remove(t)}cropImage(t,e,i,s){let a=new DrawContext;a.size=new Size(e.width,e.height);a.drawImageAtPoint(t,new Point(-e.x,-e.y));a.setFillColor(new Color(i,Number(s)));a.fillRect(new Rect(0,0,t.size["width"],t.size["height"]));return a.getImage()}async widgetCutBg(){var t;t=this.curLang.s0;let e=[this.curLang.s6,this.curLang.s7];let i=await this.generateAlert(t,e);if(i)return;let s=await Photos.fromLibrary();let a=s.size.height;let r=this.phoneSizes()[a];if(!r){t=this.curLang.s1;await this.generateAlert(t,["OK"]);return}if(a==2436){t=this.curLang.s31;let e=["iPhone 12 mini","iPhone 11 Pro, XS, X"];let i=await this.generateAlert(t,e);let s=i==0?"mini":"x";r=r[s]}t=this.curLang.s2;let l=[this.curLang.s8,this.curLang.s9,this.curLang.s10];let o=await this.generateAlert(t,l);t=this.curLang.s3;t+=a==1136?this.curLang.s4:"";let n={w:"",h:"",x:"",y:""};if(o==0){n.w=r.small;n.h=r.small;let e=["Top left","Top right","Middle left","Middle right","Bottom left","Bottom right"];let i=[this.curLang.s11,this.curLang.s12,this.curLang.s13,this.curLang.s14,this.curLang.s15,this.curLang.s16];let s=await this.generateAlert(t,i);let a=e[s].toLowerCase().split(" ");n.y=r[a[0]];n.x=r[a[1]]}else if(o==1){n.w=r.medium;n.h=r.small;n.x=r.left;let e=["Top","Middle","Bottom"];let i=[this.curLang.s17,this.curLang.s18,this.curLang.s19];let s=await this.generateAlert(t,i);let a=e[s].toLowerCase();n.y=r[a]}else if(o==2){n.w=r.medium;n.h=r.large;n.x=r.left;let e=[this.curLang.s17,this.curLang.s19];let i=await this.generateAlert(t,e);n.y=i?r.middle:r.top}let h=await this.generateInputAlert(this.curLang.s22,this.curLang.s23,"#000000");if(h[0]==-1)return;let g=await this.generateInputAlert(this.curLang.s24,this.curLang.s25,"0.1");if(g[0]==-1)return;let c=this.cropImage(s,new Rect(n.x,n.y,n.w,n.h),h[1],g[1]);t=this.curLang.s5;const u=[this.curLang.s20,this.curLang.s21];const d=await this.generateAlert(t,u);if(d){Photos.save(c)}else{this.local.writeImage(this.bgImgPath,c)}Script.complete()}async widgetEnter(t,e){await this.setVal("lastRunningTime",0,"local");let i=[this.curLang.s28,this.curLang.s29,this.curLang.s33];if(Array.isArray(t)){let s=t.map((t,e)=>{return t.name[this.lang]});let a=t.map((t,e)=>{return t.callback});if(e){i=s}else{this.operations.push({callback:main});this.operations.push({callback:function(){$.widgetCutBg()}});this.operations.push({callback:function(){$.cleanCache()}});i=i.concat(s)}a.forEach(t=>{this.operations.push({callback:t})})}i.push(this.curLang.s32);this.operations.push({callback:function(){}});return await this.generateAlert(this.curLang.s30,i)}async handleOperations(t){await this.operations[t].callback()}cleanCache(){this.log(this.curLang.s34);let t=this.local.joinPath(this.local.documentsDirectory(),this.dataFile);if(this.local.fileExists(t)){this.local.remove(t)}t=this.bgImgPath;if(this.local.fileExists(t)){this.local.remove(t)}this.log(this.curLang.s35)}}(t,e,i)}
//ScriptableToolKit-end
