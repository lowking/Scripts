// https://gist.githubusercontent.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9/raw/bbcac348d540e452228bd85aa80a5b45bb023a65/mz_invisible_widget.js
// 这是原作者gist地址，本人就汉化，只为引用到自己修改的Scriptable中
// 10086来源GideonSenku，https://github.com/GideonSenku/Scriptable/blob/master/10086/10086.js
const $ = new ScriptableToolKit(`10086`, `10086`, {lkLang10086: 'zh_CN'})
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

const isRunWidget = true

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

if (config.runsInWidget || isRunWidget) {
    let widget = new ListWidget()
    try {
        widget.backgroundImage = $.getWidgetBg()
        // Your code here
        if (now.getDate() == 1) {
            // 每个月1号维护查询不到数据
            widget = createWidget(widget, "移不动", '-', '-', '-')
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
                    widget = createWidget(widget, "移不动", '-', '-', '-')
                }
                widget = await showmsg(widget)
            }
        }
        Script.setWidget(widget)
        Script.complete()
    } catch (e) {
        // 为了不影响正常显示
    }
} else {
    $.widgetCutBg()
}

function showmsg(w) {
    return new Promise((resolve) => {
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

        let widget = createWidget(w, "移不动", $.subt, $.flowRes, $.voiceRes)

        $.log('显示信息end')
        resolve(widget)
    })
}

async function createWidget(w, pretitle, title, subtitle, other) {
    $.log('创建widget')

    const bgColor = new LinearGradient()
    bgColor.colors = [new Color("#001A27"), new Color("#00334e")]
    bgColor.locations = [0.0, 1.0]

    // 获取第二天是否工作日
    let targetDate = new Date()
    let isWD = await $.isWorkingDays(new Date(targetDate.setDate(now.getDate() + 1)))
    let normalColor = new Color("#ccc")
    let preTxt = w.addText(pretitle + isWD)
    let preColor = normalColor
    preTxt.textColor = preColor
    preTxt.font = Font.boldSystemFont(18)
    // preTxt.applyHeadlineTextStyling()
    w.addSpacer(7)
    // preTxt.applySubheadlineTextStyling()


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


    let subTxt = w.addText(subtitle)
    preColor = normalColor
    if (subtitle.indexOf('MB') && Number(subtitle.replace('MB', '').substring(subtitle.indexOf(']') + 1)) < warnData) {
        preColor = warnColor
    }
    subTxt.textColor = preColor
    subTxt.font = Font.systemFont(14)
    subTxt.textSize = normalFontSize
    w.addSpacer(sp)

    let otherTxt = w.addText(other)
    preColor = normalColor
    if (other.indexOf('分钟') && Number(other.replace('分钟', '').substring(other.indexOf(']') + 1)) < warnVoice) {
        preColor = warnColor
    }
    otherTxt.textColor = preColor
    otherTxt.font = Font.systemFont(14)
    otherTxt.textSize = normalFontSize
    w.addSpacer(sp)

    let minTxt = w.addText(`更新于：${hours > 9 ? hours : "0" + hours}:${minutes > 9 ? minutes : "0" + minutes}`)
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
        const url = $.autologin
            ? JSON.parse($.autologin)
            : JSON.parse(chavy_autologin_cmcc)
        $.post(url, (resp, data) => {
            try {
                $.setck = resp.headers["Set-Cookie"]
                console.warn("login")
            } catch (e) {
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
            try {
                $.log(`解密结果：${decrypt(data, "GS7VelkJl5IT1uwQ")}`)
                $.fee = JSON.parse(decrypt(data, "GS7VelkJl5IT1uwQ"))
                console.warn("fee")
            } catch (e) {
                $.logErr(e)
                $.log(data)
            } finally {
                resolve()
            }
        })
    })
}

function querymeal() {
    return new Promise((resolve) => {
        const url = $.getfee ? JSON.parse($.getfee) : JSON.parse(chavy_getfee_cmcc)
        url.url =
            "https://clientaccess.10086.cn/biz-orange/BN/newComboMealResouceUnite/getNewComboMealResource"
        console.warn('meal')
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
            try {
                $.meal = JSON.parse(decrypt(data, "GS7VelkJl5IT1uwQ"))
                console.warn('meal')
            } catch (e) {
                $.logErr(e)
                $.log(data)
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
function ScriptableToolKit(t,e,i){return new class{constructor(t,e,i){this.local=FileManager.local();this.icloud=FileManager.iCloud();this.curDateCache=this.local.joinPath(this.local.documentsDirectory(),"curDateCache");this.options=i;this.tgEscapeCharMapping={"&":"＆"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=e;this.data=null;this.dataFile=`${this.prefix}${this.id}.json`;this.bgImgPath=`${this.prefix}${this.id}Bg.jpg`;this.bgImgPath=this.local.joinPath(this.local.documentsDirectory(),this.bgImgPath);this.lang=this.getResultByKey(`${this.prefix}Lang${this.id}`,"zh_CN");this.isSaveLog=this.getResultByKey(`${this.prefix}IsSaveLog${this.id}`,true);this.isEnableLog=this.getResultByKey(`${this.prefix}IsEnableLog${this.id}`,true);this.logSeparator="\n██";this.now=(new Date).getTime();this.execStatus=true;this.notifyInfo=[];this.msg={zh_CN:["在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。","看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。","你想创建什么尺寸的widget？","你想把widget放在哪里？"," (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。","widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？","已经截图，继续","退出去截图","小","中","大","顶部左边","顶部右边","中间左边","中间右边","底部左边","底部右边","顶部","中间","底部","在Scriptable内部使用","导出到相册"],en:["Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.","It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.","What size of widget are you creating?","What position will it be in?"," (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)","Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?","Continue","Exit to Take Screenshot","Small","Medium","Large","Top left","Top right","Middle left","Middle right","Bottom left","Bottom right","Top","Middle","Bottom","Use in Scriptable","Export to Photos"]}}getResultByKey(t,e){if(!this.options){return e}const i=this.options[t];if(this.isEmpty(i)){return e}else{return i}}appendNotifyInfo(t,e){if(e==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}sleep(t){return new Promise(e=>setTimeout(e,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}logErr(t){this.execStatus=false;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}getContainer(t){return t=="local"?this.local:this.icloud}async getVal(t,e,i){let o=this.getContainer(e);let r="";try{let t=o.joinPath(o.documentsDirectory(),this.dataFile);if(!o.fileExists(t)){return Promise.resolve(i)}r=await o.readString(t);r=JSON.parse(r)}catch(t){throw t}return Promise.resolve(r.hasOwnProperty(t)?r[t]:i)}async getDataFile(t){let e=this.getContainer(t);let i="";try{let t=e.joinPath(e.documentsDirectory(),this.dataFile);if(!e.fileExists(t)){return Promise.resolve("")}i=await e.readString(t)}catch(t){throw t}return Promise.resolve(i)}async setVal(t,e,i){let o=this.getContainer(i);let r;let s=o.joinPath(o.documentsDirectory(),this.dataFile);try{if(!o.fileExists(s)){r={}}else{r=await o.readString(s);r=JSON.parse(r)}}catch(t){r={}}r[t]=e;o.writeString(s,JSON.stringify(r))}async get(t,e=(()=>{})){let i=new Request("");i.url=t.url;i.method="GET";i.headers=t.headers;const o=await i.loadString();e(i.response,o);return o}async post(t,e=(()=>{})){let i=new Request("");i.url=t.url;i.body=t.body;i.method="POST";i.headers=t.headers;const o=await i.loadString();e(i.response,o);return o}async loadScript({scriptName:t,url:e}){this.log(`获取脚本【${t}】`);const i=await this.get({url:e});this.icloud.writeString(`${this.icloud.documentsDirectory()}/${t}.js`,i);this.log(`获取脚本【${t}】完成🎉`)}require({scriptName:t,url:e="",reload:i=false}){if(this.icloud.fileExists(this.icloud.joinPath(this.icloud.documentsDirectory(),`${t}.js`))&&!i){this.log(`引用脚本【${t}】`);return importModule(t)}else{this.loadScript({scriptName:t,url:e});this.log(`引用脚本【${t}】`);return importModule(t)}}async generateAlert(t,e){let i=new Alert;i.message=t;for(const t of e){i.addAction(t)}return await i.presentAlert()}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"}isWorkingDays(t){return new Promise(async(e,i)=>{const o=t.getMonth()+1>9?t.getMonth()+1:"0"+(t.getMonth()+1);const r=t.getDate()>9?t.getDate():"0"+t.getDate();const s=`${t.getFullYear()}${o}${r}`;let l=0;try{let t=await this.getVal("curDateCache","local","fff");if(s==t.split("-")[0]){l=t.split("-")[1];this.log("already request")}else{this.log("send request");const t={url:"http://tool.bitefu.net/jiari/?d="+s};await this.post(t,(t,e)=>{l=e;this.setVal("curDateCache",`${s+"-"+l}`,"local")})}}catch(t){this.logErr(t)}finally{e(l==0?workingDaysFlag:holidayFlag)}})}randomString(t){t=t||32;var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=e.length;var o="";for(let r=0;r<t;r++){o+=e.charAt(Math.floor(Math.random()*i))}return o}autoComplete(t,e,i,o,r,s,l,a,n,h){t+=``;if(t.length<r){while(t.length<r){if(s==0){t+=o}else{t=o+t}}}if(l){let e=``;for(var g=0;g<a;g++){e+=h}t=t.substring(0,n)+e+t.substring(a+n)}t=e+t+i;return this.toDBC(t)}customReplace(t,e,i,o){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(o)){o="}"}for(let r in e){t=t.replace(`${i}${r}${o}`,e[r])}}catch(t){this.logErr(t)}return t}toDBC(t){var e="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){e=e+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){e=e+String.fromCharCode(t.charCodeAt(i)+65248)}}return e}getWidgetBg(){return this.local.readImage(this.bgImgPath)}phoneSizes(){return{2688:{small:507,medium:1080,large:1137,left:81,right:654,top:228,middle:858,bottom:1488},1792:{small:338,medium:720,large:758,left:54,right:436,top:160,middle:580,bottom:1e3},2436:{small:465,medium:987,large:1035,left:69,right:591,top:213,middle:783,bottom:1353},2532:{small:474,medium:1014,large:1062,left:78,right:618,top:231,middle:819,bottom:1407},2208:{small:471,medium:1044,large:1071,left:99,right:672,top:114,middle:696,bottom:1278},1334:{small:296,medium:642,large:648,left:54,right:400,top:60,middle:412,bottom:764},1136:{small:282,medium:584,large:622,left:30,right:332,top:59,middle:399,bottom:399},1624:{small:310,medium:658,large:690,left:46,right:394,top:142,middle:522,bottom:902}}}remove(t){this.local.remove(t)}cropImage(t,e){let i=new DrawContext;i.size=new Size(e.width,e.height);i.drawImageAtPoint(t,new Point(-e.x,-e.y));return i.getImage()}async widgetCutBg(){var t;var e=this.msg[this.lang];t=e[0];let i=[e[6],e[7]];let o=await this.generateAlert(t,i);if(o)return;let r=await Photos.fromLibrary();let s=r.size.height;let l=this.phoneSizes()[s];if(!l){t=e[1];await this.generateAlert(t,["OK"]);return}t=e[2];let a=[e[8],e[9],e[10]];let n=await this.generateAlert(t,a);t=e[3];t+=s==1136?e[4]:"";let h={w:"",h:"",x:"",y:""};if(n==0){h.w=l.small;h.h=l.small;let i=["Top left","Top right","Middle left","Middle right","Bottom left","Bottom right"];let o=[e[11],e[12],e[13],e[14],e[15],e[16]];let r=await this.generateAlert(t,o);let s=i[r].toLowerCase().split(" ");h.y=l[s[0]];h.x=l[s[1]]}else if(n==1){h.w=l.medium;h.h=l.small;h.x=l.left;let i=["Top","Middle","Bottom"];let o=[e[17],e[18],e[19]];let r=await this.generateAlert(t,o);let s=i[r].toLowerCase();h.y=l[s]}else if(n==2){h.w=l.medium;h.h=l.large;h.x=l.left;let i=[e[17],e[19]];let o=await this.generateAlert(t,i);h.y=o?l.middle:l.top}let g=this.cropImage(r,new Rect(h.x,h.y,h.w,h.h));t=e[5];const d=[e[20],e[21]];const c=await this.generateAlert(t,d);if(c){Photos.save(g)}else{this.log(this.bgImgPath);this.local.writeImage(this.bgImgPath,g)}Script.complete()}}(t,e,i)}
//ScriptableToolKit-end
