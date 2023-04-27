// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: mobile;
const scriptId = '10000'// 此id为本脚本关联配置id，如果要复制多个请修改此id
const scriptName = '10000'
var options = {}
options[`lkIsSaveLog${scriptId}`] = true
options[`lkRunLimitNum${scriptId}`] = 600000
const $ = new ScriptableToolKit(scriptName, scriptId, options)
// 小组件信息显示顺序，如：流量,语音,话费。填写到小组件参数里面
let infoOrder = "流量,语音,话费,时间".split(",")
if (typeof args.widgetParameter === "string") {
    let paramArr = args.widgetParameter.split(",")
    if (paramArr.length == 3) {
        infoOrder = paramArr
        infoOrder.push("时间")
    }
}
// 余额警告阈值
const warnFee = await $.getVal("warnFee", "icloud", 20)
// 流量警告阈值，只判断单位MB的，如果是kb没做处理
const warnData = await $.getVal("warnData", "icloud", 200)
// 语音警告阈值
const warnVoice = await $.getVal("warnVoice", "icloud", 20)
// 工作日和节假日标志图标可以下载这个app查看（https://apps.apple.com/us/app/sf-symbols-browser/id1491161336）复制名称到下面
const workingDaysFlag = 'curlybraces'
const holidayFlag = 'gamecontroller'
const fetchUri = {
    detail: 'https://e.189.cn/store/user/package_detail.do',
    balance: 'https://e.189.cn/store/user/balance_new.do',
}
const cookie = await $.getVal("cookie", "icloud", "")
const title = await $.getVal("title", "icloud", "信不过")

const now = $.now
const errFlag = "⚬ "

let subt, flowRes, voiceRes
let requestState = 1 << 1 | 1 << 2
let widget = new ListWidget()
widget.backgroundImage = $.getWidgetBg()

let lastSuccessfulRunTime = await $.getVal('lastSuccessfulRunTime', 'local', 0)
if (lastSuccessfulRunTime === 0) {
    lastSuccessfulRunTime = $.now.getTime()
    await $.setVal('lastSuccessfulRunTime', lastSuccessfulRunTime, 'local')
}

if (config.runsInWidget) {
    $.log('在小组件运行')
    if (await $.checkLimit()) {
        $.execFail()
        $.saveLog()
        // widget = await createWidget(widget, title, await $.getVal('subt', 'local', '-'), await $.getVal('flowRes', 'local', '-'), await $.getVal('voiceRes', 'local', '-'))
        return false;
    }
    await main()
} else {
    $.log('手动运行')
    let enter = await $.widgetEnter([{name:{zh:"预览",en:"Preview"}, callback: main}], true)
    await $.handleOperations(enter)
}

async function main() {
    try {
        // Your code here
        // 电信似乎没有这个限制
        if (false && now.getDate() == 1) {
            // 每个月1号维护查询不到数据
            $.log('每个月1号维护查询不到数据，直接降级处理')
            widget = await createWidget(widget, title, '-', '-', '-')
        } else {
            await queryfee()
            await querymeal()
            // 执行失败，降级处理
            if (!$.execStatus) {
                $.log('整个流程有错误发生，降级处理，读取上次成功执行的数据')
                $.log(`读取数据：${await $.getDataFile('local')}`)
                widget = await createWidget(widget, title, await $.getVal('subt', 'local', '-'), await $.getVal('flowRes', 'local', '-'), await $.getVal('voiceRes', 'local', '-'))
            } else {
                $.log('整个流程执行正常')
                $.log(`${subt}${flowRes}${voiceRes}`)
                widget = await showmsg(widget)
            }
        }
        $.saveLog()
        widget.presentSmall()
        Script.setWidget(widget)
        Script.complete()
    } catch (e) {
        // 为了不影响正常显示
        $.logErr(e)
    }
}

function showmsg(w) {
    return new Promise(async (resolve) => {
        //格式化显示的信息
        $.log('显示信息')

        let widget = await createWidget(w, title, subt, flowRes, voiceRes)

        $.log('显示信息end')
        resolve(widget)
    })
}

/**
 * 根据数据填充widget
 * @param w
 * @param pretitle  大标题
 * @param _subt      [话费]1元
 * @param _flowRes   [流量]1GB
 * @param _voiceRes  [语音]1分钟
 */
async function createWidget(w, pretitle, _subt, _flowRes, _voiceRes) {
    $.log('创建widget')

    // 获取第二天是否工作日
    let targetDate = new Date()
    let isWD = await $.isWorkingDays(new Date(targetDate.setDate(now.getDate() + 1)))

    // 处理需要显示差值的数据
    let diffDataKey = ''
    let preData = ''
    let diffResult = ''
    let diffSuffix = ''
    let preDiffKey = 'preDiff_'
    try {
        if (infoOrder[2] === "话费") {
            diffDataKey = 'subt'
            preDiffKey += diffDataKey
            preData = await $.getVal(diffDataKey, "local", "")
            preData = Number(preData.replace('¥', ''))
            let curData = Number(_subt.replace('¥', ''))
            if (preData || preData === 0) {
                diffResult = curData - preData
                let preDiff = await $.getVal(preDiffKey, "local", "")
                // 判断是否保持上次的差值
                if (preDiff) {
                    // 有保存，则判断本次差值是否为0，为0则显示上次保存差值
                    if (diffResult === 0) {
                        diffResult = preDiff
                    }
                }
                await $.setVal(preDiffKey, diffResult, "local")
                diffSuffix = '¥'
            }
        } else if (infoOrder[2] === "流量") {
            diffDataKey = 'flowRes'
            preDiffKey += diffDataKey
            preData = await $.getVal(diffDataKey, "local", "")
            preData = preData.split(" ")
            preData = $.fileLengthFormat(preData[0], preData[1], true)
            let curData = _flowRes.split(" ")
            curData = $.fileLengthFormat(curData[0], curData[1], true)
            if (preData || preData === 0) {
                diffResult = curData - preData
                let preDiff = await $.getVal(preDiffKey, "local", "")
                // 判断是否保持上次的差值
                if (preDiff) {
                    // 有保存，则判断本次差值是否为0，为0则显示上次保存差值
                    if (diffResult === 0) {
                        diffResult = preDiff
                    }
                }
                await $.setVal(preDiffKey, diffResult, "local")
                let tdiffResult = diffResult
                if (diffResult < 0) {
                    tdiffResult *= -1
                }
                let formatResult = $.fileLengthFormat(tdiffResult).split(" ")
                diffResult = (diffResult < 0 ? "-" : "") + formatResult[0]
                diffSuffix = formatResult.length == 2 ? formatResult[1] : "MB"
            }
        } else if (infoOrder[2] === "语音") {
            diffDataKey = 'voiceRes'
            preDiffKey += diffDataKey
            preData = await $.getVal(diffDataKey, "local", "")
            preData = Number(preData.replace('分钟', ''))
            let curData = Number(_voiceRes.replace('分钟', ''))
            if (preData || preData === 0) {
                diffResult = curData - preData
                let preDiff = await $.getVal(preDiffKey, "local", "")
                // 判断是否保持上次的差值
                if (preDiff) {
                    // 有保存，则判断本次差值是否为0，为0则显示上次保存差值
                    if (diffResult === 0) {
                        diffResult = preDiff
                    }
                }
                await $.setVal(preDiffKey, diffResult, "local")
                diffSuffix = '分钟'
            }
        }
    } catch (e) {
        $.logErr(e)
        diffResult = ''
    }
    $.log(`差值：${diffResult}`)
    // 保存成功执行的数据
    if (requestState & (1 << 1)) {
        $.log(`${_subt}`)
        await $.setVal('subt', _subt, 'local')
        $.log(`写入余额数据：${await $.getDataFile('local')}`)
    }
    if (requestState & (1 << 2)) {
        $.log(`${_flowRes}${_voiceRes}`)
        await $.setVal('flowRes', _flowRes, 'local')
        await $.setVal('voiceRes', _voiceRes, 'local')
        $.log(`写入流量语音数据：${await $.getDataFile('local')}`)
    }
    let image = await $.getImage('bg.png', 'icloud')
    let base64str = ``
    if (!image) {
        $.log(`下载背景图${$.icloud.joinPath($.icloud.documentsDirectory(), "bg.png")}`)
        image = await new Request("https://github.com/lowking/Scripts/raw/master/doc/icon/ChinaTelecom_logo.png").loadImage()
        await $.saveImage("bg.png", image, "icloud")
    }
    const obase64str = Data.fromPNG(image).toBase64String()
    const uri = await getSmallBg(`data:image/png;base64,${obase64str}`)
    base64str = uri.replace(/^data\:image\/\w+;base64,/, '')
    w.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'))
    w.backgroundImage = Image.fromData(Data.fromBase64String(base64str))
    w.setPadding(12, 12, 12, 12)


    $.log(`设置标题-${pretitle}${isWD}`)
    const titleFontSize = 24
    const titleColor = Color.dynamic(Color.black(), Color.white())
    const titleStack = w.addStack()
    titleStack.layoutVertically()
    const titleRowStack = titleStack.addStack()
    titleRowStack.centerAlignContent()
    titleRowStack.addSpacer()
    const icon = SFSymbol.named(isWD)
    icon.applyHeavyWeight()
    let titleText = titleRowStack.addText(pretitle)
    titleText.textColor = titleColor
    titleText.rightAlignText()
    titleText.font = Font.heavySystemFont(titleFontSize)
    let iconElm = titleRowStack.addImage(icon.image)
    iconElm.imageSize = new Size(titleFontSize, titleFontSize)
    iconElm.tintColor = Color.gray()

    const specs = [
        {
            fontColor: Color.gray(),
            fontStyle: Font.systemFont(10),
            addSpacer: true,
            // spacerNum: 10,
        },
        {
            fontColor: Color.gray(),
            fontStyle: Font.semiboldSystemFont(16),
        },
        {
            fontColor: Color.dynamic(Color.black(), Color.white()),
            fontStyle: Font.boldSystemFont(28),
            fontColor2: Color.gray(),
            fontStyle2: Font.boldSystemFont(16),
        },
        {
            fontColor: Color.gray(),
            fontStyle: Font.systemFont(10),
        }
    ]
    let getWarnColor = await $.getVal("warnColor", "icloud", "#ee632C")
    let warnColor = new Color(getWarnColor)
    for (let n = 0; n < infoOrder.length; n++) {
        let type = infoOrder[n]
        let currentSpec = specs[n]
        let currentColor = currentSpec.fontColor
        $.log(`${JSON.stringify(currentSpec)}`)
        if ("话费" === type) {
            $.log('设置话费')
            let feeReqState = requestState & (1 << 1)
            let _errFlag = errFlag
            if (feeReqState) {
                _subt = subt
                _errFlag = ""
            }
            let feeStack = w.addStack()
            feeStack.layoutVertically()
            let feeRowStack = feeStack.addStack()
            feeRowStack.bottomAlignContent()
            feeRowStack.addSpacer()
            let feeText = feeRowStack.addText(_errFlag + _subt.replace('¥', ''))
            if (_subt.includes('已欠费') || Number(_subt.replace('¥', '').substring(_subt.indexOf(']') + 1)) < warnFee) {
                currentColor = warnColor
            }
            feeText.font = currentSpec.fontStyle
            feeText.textColor = currentColor
            feeText.rightAlignText()
            if (n === 2) {
                let smallStack = feeRowStack.addStack()
                smallStack.centerAlignContent()
                let smallText = smallStack.addText('¥')
                smallText.font = currentSpec.fontStyle2
                smallText.textColor = currentSpec.fontColor2
                smallText.rightAlignText()
            } else {
                feeText.text += '¥'
            }
        } else if ("流量" === type) {
            $.log('设置流量')
            // 判断状态码，如果查询成功显示最新数据，否则显示失败标记⚬+上次查询成功的数据
            let flowReqState = requestState & (1 << 2)
            let _errFlag = errFlag
            if (flowReqState) {
                _flowRes = flowRes
                _errFlag = ""
            }
            let flowResArr = _flowRes.split(' ')
            let flowStack = w.addStack()
            flowStack.layoutVertically()
            let flowRowStack = flowStack.addStack()
            flowRowStack.bottomAlignContent()
            flowRowStack.addSpacer()
            let flowText = flowRowStack.addText(_errFlag + flowResArr[0])
            if (_flowRes.indexOf('MB') != -1 && Number(flowResArr[0]) < warnData) {
                currentColor = warnColor
            }
            flowText.font = currentSpec.fontStyle
            flowText.textColor = currentColor
            flowText.rightAlignText()
            if (n === 2 && flowResArr.length === 2) {
                let smallStack = flowRowStack.addStack()
                smallStack.centerAlignContent()
                let smallText = smallStack.addText(flowResArr[1])
                smallText.font = currentSpec.fontStyle2
                smallText.textColor = currentSpec.fontColor2
                smallText.rightAlignText()
            } else if (flowResArr.length === 2) {
                flowText.text += flowResArr[1]
            }
        } else if ("语音" === type) {
            $.log('设置语音')
            // 判断状态码，如果查询成功显示最新数据，否则显示失败标记⚬+上次查询成功的数据
            let voiceReqState = requestState & (1 << 2)
            let _errFlag = errFlag
            if (voiceReqState) {
                _voiceRes = voiceRes
                _errFlag = ""
            }
            let voiceNum = _voiceRes.replace('分钟', '')
            let voiceStack = w.addStack()
            voiceStack.layoutVertically()
            let voiceRowStack = voiceStack.addStack()
            voiceRowStack.bottomAlignContent()
            voiceRowStack.addSpacer()
            let voiceText = voiceRowStack.addText(_errFlag + voiceNum)
            if (_voiceRes.indexOf('分钟') && Number(voiceNum + 1) < warnVoice) {
                currentColor = warnColor
            }
            voiceText.font = currentSpec.fontStyle
            voiceText.textColor = currentColor
            voiceText.rightAlignText()
            if (n === 2) {
                let smallStack = voiceRowStack.addStack()
                smallStack.centerAlignContent()
                let smallText = smallStack.addText('分钟')
                smallText.font = currentSpec.fontStyle2
                smallText.textColor = currentSpec.fontColor2
                smallText.rightAlignText()
            } else {
                voiceText.text += '分钟'
            }
        } else if ("时间" === type) {
            $.log('设置更新时间')
            let sucTime = now
            if (!$.execStatus) {
                sucTime = new Date(await $.getVal("lastSuccessfulRunTime", "local", sucTime.getTime()))
            } else {
                await $.setVal('lastSuccessfulRunTime', sucTime.getTime(), 'local')
            }
            const minutes = sucTime.getMinutes()
            const hours = sucTime.getHours()
            let updateTimeStack = w.addStack()
            updateTimeStack.layoutVertically()
            let updateTimeRowStack = updateTimeStack.addStack()
            updateTimeRowStack.bottomAlignContent()
            updateTimeRowStack.addSpacer()
            if (n === 3 && (diffResult || diffResult === 0)) {
                let diffText = updateTimeRowStack.addText((diffResult >= 0 ? `+${Number(diffResult).toFixed(2)}` : Number(diffResult).toFixed(2)) + "" +diffSuffix)
                diffText.font = Font.boldSystemFont(10)
                diffText.textColor = diffResult >= 0 ? Color.green() : Color.red()
                diffText.leftAlignText()
                updateTimeRowStack.addSpacer(4)
            }
            const updateTimeIcon = SFSymbol.named("arrow.2.circlepath")
            updateTimeIcon.applyHeavyWeight()
            let iconElm = updateTimeRowStack.addImage(updateTimeIcon.image)
            iconElm.imageSize = new Size(11, 12)
            iconElm.tintColor = Color.gray()
            let updateTimeText = updateTimeRowStack.addText(`${hours > 9 ? hours : "0" + hours}:${minutes > 9 ? minutes : "0" + minutes}`)
            updateTimeText.font = currentSpec.fontStyle
            updateTimeText.textColor = currentColor
            updateTimeText.rightAlignText()
        }
        if (currentSpec.addSpacer) {
            if (currentSpec.spacerNum >= 0) {
                w.addSpacer(currentSpec.spacerNum)
            } else {
                w.addSpacer()
            }
        }
    }

    $.log('创建widget end')
    return w
}

async function getSmallBg(url) {
    const webview = new WebView()
    let js =
        `const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const { width, height } = img
            canvas.width = width
            canvas.height = height
            ctx.globalAlpha = 0.3
            ctx.drawImage(
                img,
                -width / 2 + 50,
                -height / 2 + 50,
                width,
                height
            )
            const uri = canvas.toDataURL()
            completion(uri);
        };
        img.src = '${url}'`
    const uri = await webview.evaluateJavaScript(js, true)
    return uri
}

function queryfee() {
    return new Promise((resolve) => {
        $.log('查询余额')
        const url = {
            url: fetchUri.balance,
            headers: {
                cookie: cookie
            }
        }

        $.post(url, (resp, data) => {
            $.log('查询余额响应返回')
            try {
                data = JSON.parse(data)
                if (data.result === 0) {
                    subt = `${parseFloat(parseInt(data.totalBalanceAvailable) / 100).toFixed(2)}¥`
                } else if (data.result === -10000) {
                    subt = `已欠费`
                } else {
                    throw new Error("查询余额失败")
                }
                $.log(`查询余额结束：${subt}`)
            } catch (e) {
                requestState ^= 1 << 1
                $.execFail()
                $.log('查询余额异常')
                $.logErr(e)
                $.log(JSON.stringify(data))
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
        const url = {
            url: fetchUri.detail,
            headers: {
                cookie: cookie
            }
        }
        $.post(url, (resp, data) => {
            $.log('查询套餐响应返回')
            try {
                data = JSON.parse(data)
                if (data.result === 0) {
                    if (data.hasOwnProperty("balance")) {
                        flowRes = formatFlow(data.balance)
                        flowRes = `${flowRes.count} ${flowRes.unit}B`
                    } else {
                        flowRes = '0 MB'
                    }
                    // flowRes = '[流量] ' + flowRes
                    voiceRes = data.hasOwnProperty("voiceBalance") ? `${data.voiceBalance}分钟` : '0分钟'
                } else {
                    throw new Error("查询套餐失败")
                }
                $.log(`查询套餐结束：\n${flowRes}\n${voiceRes}`)
            } catch (e) {
                requestState ^= 1 << 2
                $.execFail()
                $.log('查询套餐异常')
                $.logErr(e)
                $.log(JSON.stringify(data))
                $.log(`查询套餐异常，请求体：${JSON.stringify(url)}`)
            } finally {
                resolve()
            }
        })
    })
}

function formatFlow(number) {
    const n = number / 1024
    if (n < 1024) {
        return {count: n.toFixed(2), unit: 'M'}
    }
    return {count: (n / 1024).toFixed(2), unit: 'G'}
}

async function renderWebView() {
    const webView = new WebView()
    const url = 'https://e.189.cn/index.do'
    await webView.loadURL(url)
    await webView.present(false)

    const request = new Request(fetchUri.detail)
    request.method = 'POST'
    const response = await request.loadJSON()
    $.log(JSON.stringify(response))
    if (response.result === -10001) {
        const index = await $.generateAlert('未获取到用户信息', [
            '取消',
            '重试',
        ])
        if (index === 0) return
        await renderWebView()
    } else {
        const cookies = request.response.cookies
        let cookie
        cookie = cookies.map((item) => `${item.name}=${item.value}`)
        cookie = cookie.join('; ')
        $.log(cookie)
        await $.setVal('cookie', cookie, 'icloud')
    }
}
//ScriptableToolKit-start
function ScriptableToolKit(t,e,i){return new class{constructor(t,e,i){this.isLimited=false;this.checkLimit();this.local=FileManager.local();this.icloud=FileManager.iCloud();this.curDateCache=this.local.joinPath(this.local.documentsDirectory(),"curDateCache");this.options=i;this.tgEscapeCharMapping={"&":"＆"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=e;this.data=null;this.dataFile=`${this.prefix}${this.id}.json`;this.bgImgPath=`${this.prefix}${this.id}Bg.jpg`;this.bgImgPath=this.local.joinPath(this.local.documentsDirectory(),this.bgImgPath);this.lang=Device.language();this.msg={zh:{s0:"在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。",s1:"看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。",s2:"你想创建什么尺寸的widget？",s3:"你想把widget放在哪里？",s4:" (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。",s5:"widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？",s6:"已经截图，继续",s7:"退出去截图",s8:"小",s9:"中",s10:"大",s11:"顶部左边",s12:"顶部右边",s13:"中间左边",s14:"中间右边",s15:"底部左边",s16:"底部右边",s17:"顶部",s18:"中间",s19:"底部",s20:"在Scriptable内部使用",s21:"导出到相册",s22:"填写遮罩层颜色。（格式：#000000）",s23:"颜色（格式：#000000）",s24:"填写遮罩层不透明度（0-1之间）",s25:"0-1之间",s26:"确定",s27:"取消",s28:"预览widget",s29:"设置widget背景",s30:"入口",s31:"你用的是哪个型号？",s32:"退出",s33:"清除缓存",s34:"开始清除缓存",s35:"清除缓存完成"},en:{s0:"Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.",s1:"It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",s2:"What size of widget are you creating?",s3:"What position will it be in?",s4:" (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)",s5:"Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?",s6:"Continue",s7:"Exit to Take Screenshot",s8:"Small",s9:"Medium",s10:"Large",s11:"Top left",s12:"Top right",s13:"Middle left",s14:"Middle right",s15:"Bottom left",s16:"Bottom right",s17:"Top",s18:"Middle",s19:"Bottom",s20:"Use in Scriptable",s21:"Export to Photos",s22:"Fill in the mask layer color. (Format: #000000)",s23:"Color.(Format: #000000)",s24:"Fill in the mask layer opacity (between 0-1)",s25:"between 0-1",s26:"Confirm",s27:"Cancel",s28:"Preview widget",s29:"Setting widget background",s30:"ENTER",s31:"What type of iPhone do you have?",s32:"Exit",s33:"Clean cache",s34:"Clean cache started",s35:"Clean cache finished"}};this.curLang=this.msg[this.lang]||this.msg.en;this.isSaveLog=this.getResultByKey(`${this.prefix}IsSaveLog${this.id}`,false);this.isEnableLog=this.getResultByKey(`${this.prefix}IsEnableLog${this.id}`,true);this.logDir=this.icloud.documentsDirectory()+"/lklogs/"+this.id;this.logSeparator="\n██";this.now=new Date;this.execStatus=true;this.notifyInfo=[];this.operations=[]}async checkLimit(){const t=await this.getVal(`${this.prefix}LastRunningTime${this.id}`,"local",0);const e=this.getResultByKey(`${this.prefix}RunLimitNum${this.id}`,3e5);if(t>0){if(this.now.getTime()-t<=e){this.appendNotifyInfo("限制运行");this.isLimited=true}else{await this.setVal(`${this.prefix}LastRunningTime${this.id}`,this.now.getTime(),"local")}}return this.isLimited}getResultByKey(t,e){if(!this.options){return e}const i=this.options[t];if(this.isEmpty(i)){return e}else{return i}}appendNotifyInfo(t,e){if(e==1){this.notifyInfo=t}else{this.notifyInfo.push(`${this.logSeparator}${this.formatDate(new Date,"yyyy-MM-dd HH:mm:ss.S")}█${t}`)}}saveLog(){if(this.isSaveLog){let t;if(Array.isArray(this.notifyInfo)){t=this.notifyInfo.join("")}else{t=this.notifyInfo}if(!this.icloud.isDirectory(this.logDir)){this.icloud.createDirectory(this.logDir,true)}this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now,"yyyyMMddHHmmss")}.log`,t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}sleep(t){return new Promise(e=>setTimeout(e,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${JSON.stringify(t)}`);this.appendNotifyInfo(t)}logErr(t){this.execStatus=false;if(this.isEnableLog){console.warn(`${this.logSeparator}${this.name}执行异常:`);console.warn(t);console.warn(`\n${t.message}`)}}getContainer(t){return t=="local"?this.local:this.icloud}async getVal(t,e,i){let s=this.getContainer(e);let a="";try{let r=s.joinPath(s.documentsDirectory(),this.dataFile);if(!s.fileExists(r)){await this.setVal(t,i,e);return i}a=await s.readString(r);a=JSON.parse(a)}catch(t){throw t}if(a.hasOwnProperty(t)){return a[t]}else{await this.setVal(t,i,e);return i}}async getDataFile(t){let e=this.getContainer(t);let i="";try{let t=e.joinPath(e.documentsDirectory(),this.dataFile);if(!e.fileExists(t)){return Promise.resolve("")}i=await e.readString(t)}catch(t){throw t}return Promise.resolve(i)}async saveImage(t,e,i){let s=this.getContainer(i);let a=s.joinPath(s.documentsDirectory(),`${this.prefix}${this.id}/${t}`);let r=a.substring(0,a.lastIndexOf("/")+1);if(!s.isDirectory(r)){s.createDirectory(r,true)}s.writeImage(a,e)}async getImage(t,e){let i=this.getContainer(e);let s=i.joinPath(i.documentsDirectory(),`${this.prefix}${this.id}/${t}`);if(!i.fileExists(s)){this.logErr(`file not exist: ${s}`);return false}return await i.readImage(s)}async setVal(t,e,i){let s=this.getContainer(i);let a;let r=s.joinPath(s.documentsDirectory(),this.dataFile);try{if(!s.fileExists(r)){a={}}else{a=await s.readString(r);a=JSON.parse(a)}}catch(t){a={}}a[t]=e;await s.writeString(r,JSON.stringify(a))}async get(t,e=(()=>{})){let i=new Request("");i.url=t.url;i.method="GET";i.headers=t.headers;try{const t=await i.loadString();e(i.response,t);return t}catch(t){this.logErr(t);e(undefined,undefined)}}async post(t,e=(()=>{})){let i=new Request("");i.url=t.url;i.body=t.body;i.method="POST";i.headers=t.headers;i.timeout=5e3;try{const t=await i.loadString();e(i.response,t);return t}catch(t){this.logErr(t);e(undefined,undefined)}}async loadScript({scriptName:t,url:e}){this.log(`获取脚本【${t}】`);const i=await this.get({url:e});this.icloud.writeString(`${this.icloud.documentsDirectory()}/${t}.js`,i);this.log(`获取脚本【${t}】完成🎉`)}require({scriptName:t,url:e="",reload:i=false}){if(this.icloud.fileExists(this.icloud.joinPath(this.icloud.documentsDirectory(),`${t}.js`))&&!i){this.log(`引用脚本【${t}】`);return importModule(t)}else{this.loadScript({scriptName:t,url:e});this.log(`引用脚本【${t}】`);return importModule(t)}}async generateInputAlert(t,e,i){let s=[];let a=new Alert;a.message=t;a.addTextField(e,i);a.addCancelAction(this.curLang.s27);a.addAction(this.curLang.s26);s[0]=await a.presentAlert();s[1]=a.textFieldValue(0);return s}async generateAlert(t,e){let i=new Alert;i.message=t;for(const t of e){i.addAction(t)}return await i.presentAlert()}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"}isWorkingDays(t){return new Promise(async(e,i)=>{let s="≈";const a=this.formatDate(t,"yyyy-MM-dd");let r=0;try{let t=await this.getVal("curDateCache","local","fff");let i=await this.getVal("curDateCacheErrorTime","local",this.now.getTime());let l=!this.isEmpty(i)&&Number(i)+5*60*1e3<this.now.getTime();if(!l&&a==t.split(s)[0]&&t.split(s)[1]!="❌"){r=t.split(s)[1];this.log("already request")}else{this.log("send request");const t={url:"http://timor.tech/api/holiday/info/"+a};await this.get(t,(t,e)=>{if(e.indexOf("<")==0){r="❌"}else{r=JSON.parse(e);if(r.code==-1){r="❌"}else{r=r.type.type}}})}}catch(t){r="❌";this.logErr(t)}finally{await this.setVal("curDateCache",`${a}${s}${r}`,"local");if(r=="❌"){e(r);this.log("写入运行错误时间，5分钟后重新请求！");this.setVal("curDateCache","","local");this.setVal("curDateCacheErrorTime",`${this.now.getTime()}`,"local")}else{this.setVal("curDateCacheErrorTime","","local");this.setVal("curDateCache",`${a}${s}${r}`,"local");e(r==0?workingDaysFlag:holidayFlag)}}})}randomString(t){t=t||32;var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=e.length;var s="";for(let a=0;a<t;a++){s+=e.charAt(Math.floor(Math.random()*i))}return s}formatDate(t,e){let i={"M+":t.getMonth()+1,"d+":t.getDate(),"H+":t.getHours(),"m+":t.getMinutes(),"s+":t.getSeconds(),"q+":Math.floor((t.getMonth()+3)/3),S:t.getMilliseconds()};if(/(y+)/.test(e))e=e.replace(RegExp.$1,(t.getFullYear()+"").substr(4-RegExp.$1.length));for(let t in i)if(new RegExp("("+t+")").test(e))e=e.replace(RegExp.$1,RegExp.$1.length==1?i[t]:("00"+i[t]).substr((""+i[t]).length));return e}autoComplete(t,e,i,s,a,r,l,o,n,h){t+=``;if(t.length<a){while(t.length<a){if(r==0){t+=s}else{t=s+t}}}if(l){let e=``;for(var g=0;g<o;g++){e+=h}t=t.substring(0,n)+e+t.substring(o+n)}t=e+t+i;return this.toDBC(t)}customReplace(t,e,i,s){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(s)){s="}"}for(let a in e){t=t.replace(`${i}${a}${s}`,e[a])}}catch(t){this.logErr(t)}return t}toDBC(t){var e="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){e=e+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){e=e+String.fromCharCode(t.charCodeAt(i)+65248)}}return e}getWidgetBg(){return this.local.readImage(this.bgImgPath)}phoneSizes(){return{2796:{small:510,medium:1092,large:1146,left:99,right:681,top:282,middle:918,bottom:1554},2556:{small:474,medium:1014,large:1062,left:82,right:622,top:270,middle:858,bottom:1446},2778:{small:510,medium:1092,large:1146,left:96,right:678,top:246,middle:882,bottom:1518},2532:{small:474,medium:1014,large:1062,left:78,right:618,top:231,middle:819,bottom:1407},2688:{small:507,medium:1080,large:1137,left:81,right:654,top:228,middle:858,bottom:1488},1792:{small:338,medium:720,large:758,left:54,right:436,top:160,middle:580,bottom:1e3},2436:{x:{small:465,medium:987,large:1035,left:69,right:591,top:213,middle:783,bottom:1353},mini:{small:465,medium:987,large:1035,left:69,right:591,top:231,middle:801,bottom:1371}},2208:{small:471,medium:1044,large:1071,left:99,right:672,top:114,middle:696,bottom:1278},1334:{small:296,medium:642,large:648,left:54,right:400,top:60,middle:412,bottom:764},1136:{small:282,medium:584,large:622,left:30,right:332,top:59,middle:399,bottom:399},1624:{small:310,medium:658,large:690,left:46,right:394,top:142,middle:522,bottom:902},2001:{small:444,medium:963,large:972,left:81,right:600,top:90,middle:618,bottom:1146}}}remove(t){this.local.remove(t)}cropImage(t,e,i,s){let a=new DrawContext;a.size=new Size(e.width,e.height);a.drawImageAtPoint(t,new Point(-e.x,-e.y));a.setFillColor(new Color(i,Number(s)));a.fillRect(new Rect(0,0,t.size["width"],t.size["height"]));return a.getImage()}async widgetCutBg(){var t;t=this.curLang.s0;let e=[this.curLang.s6,this.curLang.s7];let i=await this.generateAlert(t,e);if(i)return;let s=await Photos.fromLibrary();let a=s.size.height;let r=this.phoneSizes()[a];if(!r){t=this.curLang.s1;await this.generateAlert(t,["OK"]);return}if(a==2436){t=this.curLang.s31;let e=["iPhone 12 mini","iPhone 11 Pro, XS, X"];let i=await this.generateAlert(t,e);let s=i==0?"mini":"x";r=r[s]}t=this.curLang.s2;let l=[this.curLang.s8,this.curLang.s9,this.curLang.s10];let o=await this.generateAlert(t,l);t=this.curLang.s3;t+=a==1136?this.curLang.s4:"";let n={w:"",h:"",x:"",y:""};if(o==0){n.w=r.small;n.h=r.small;let e=["Top left","Top right","Middle left","Middle right","Bottom left","Bottom right"];let i=[this.curLang.s11,this.curLang.s12,this.curLang.s13,this.curLang.s14,this.curLang.s15,this.curLang.s16];let s=await this.generateAlert(t,i);let a=e[s].toLowerCase().split(" ");n.y=r[a[0]];n.x=r[a[1]]}else if(o==1){n.w=r.medium;n.h=r.small;n.x=r.left;let e=["Top","Middle","Bottom"];let i=[this.curLang.s17,this.curLang.s18,this.curLang.s19];let s=await this.generateAlert(t,i);let a=e[s].toLowerCase();n.y=r[a]}else if(o==2){n.w=r.medium;n.h=r.large;n.x=r.left;let e=[this.curLang.s17,this.curLang.s19];let i=await this.generateAlert(t,e);n.y=i?r.middle:r.top}let h=await this.generateInputAlert(this.curLang.s22,this.curLang.s23,"#000000");if(h[0]==-1)return;let g=await this.generateInputAlert(this.curLang.s24,this.curLang.s25,"0.1");if(g[0]==-1)return;let c=this.cropImage(s,new Rect(n.x,n.y,n.w,n.h),h[1],g[1]);t=this.curLang.s5;const u=[this.curLang.s20,this.curLang.s21];const m=await this.generateAlert(t,u);if(m){Photos.save(c)}else{this.local.writeImage(this.bgImgPath,c)}Script.complete()}async widgetEnter(t,e){await this.setVal("lastRunningTime",0,"local");let i=[this.curLang.s28,this.curLang.s29,this.curLang.s33];if(Array.isArray(t)){let s=t.map((t,e)=>{return t.name[this.lang]});let a=t.map((t,e)=>{return t.callback});if(e){i=s}else{this.operations.push({callback:main});this.operations.push({callback:function(){$.widgetCutBg()}});this.operations.push({callback:function(){$.cleanCache()}});i=i.concat(s)}a.forEach(t=>{this.operations.push({callback:t})})}i.push(this.curLang.s32);this.operations.push({callback:function(){}});return await this.generateAlert(this.curLang.s30,i)}async handleOperations(t){await this.operations[t].callback()}cleanCache(){this.log(this.curLang.s34);let t=this.local.joinPath(this.local.documentsDirectory(),this.dataFile);if(this.local.fileExists(t)){this.local.remove(t)}t=this.bgImgPath;if(this.local.fileExists(t)){this.local.remove(t)}this.log(this.curLang.s35)}formatTimeDuring(t,e="zh",i=0){t=Number(t);let s=["毫秒","秒","分钟","小时","天","月","年"];let a=["ms","s","min","h","d","m","y"];let r=[1e3,60,60,24,30,12,100];let l=t;if(l>r[i]){l=t/r[i];return this.formatTimeDuring(l,e,++i)}else{let t=s[i];if(e==="en"){t=a[i]}return l.toFixed(2)+""+t}}fileLengthFormat(t,e="",i=false){t=Number(t);var s=["","KB","MB","GB","TB","PB","EB","ZB"];var a=0;try{a=s.indexOf(e)}catch(t){throw t}if(i){if(a==0){return t}return this.fileLengthFormat(t*1024,s[--a],true)}var r=t;if(r>1e3){r=t/1024;return this.fileLengthFormat(r,s[++a])}else{if(a==0){return r.toFixed(2)}return r.toFixed(2)+" "+s[a]}}}(t,e,i)}
//ScriptableToolKit-end
