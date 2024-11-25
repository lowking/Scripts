// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: mobile;
// * 电信cookie重写：https://raw.githubusercontent.com/dompling/Script/master/10000/index.js
const scriptId = '10000'// 此id为本脚本关联配置id，如果要复制多个请修改此id
const scriptName = '10000'
var options = {}
options[`lkIsSaveLog${scriptId}`] = true
options[`lkRunLimitNum${scriptId}`] = 600000
const lk = new ScriptableToolKit(scriptName, scriptId, options)
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
const warnFee = await lk.getVal("warnFee", "icloud", 20)
// 流量警告阈值，只判断单位MB的，如果是kb没做处理
const warnData = await lk.getVal("warnData", "icloud", 200)
// 语音警告阈值
const warnVoice = await lk.getVal("warnVoice", "icloud", 20)
// * 工作日和节假日标志图标可以下载这个app查看（https://apps.apple.com/us/app/sf-symbols-browser/id1491161336）复制名称到下面
const workingDaysFlag = 'curlybraces'
const holidayFlag = 'gamecontroller.fill'
const fetchUri = {
    detail: "https://e.dlife.cn/user/package_detail.do",
    balance: "https://e.dlife.cn/user/balance.do",
}
let loginUrl = await lk.getVal("loginUrl", "icloud", "")
let cookie = await lk.getVal("cookie", "icloud", "")
const title = await lk.getVal("title", "icloud", "信不过")

const now = lk.now
const errFlag = "⚬ "

let subt, flowRes, voiceRes
let requestState = 1 << 1 | 1 << 2
let widget = new ListWidget()
widget.backgroundImage = lk.getWidgetBg()

let lastSuccessfulRunTime = await lk.getVal('lastSuccessfulRunTime', 'local', 0)
if (lastSuccessfulRunTime === 0) {
    lastSuccessfulRunTime = lk.now.getTime()
    await lk.setVal('lastSuccessfulRunTime', lastSuccessfulRunTime, 'local')
}

const updateCookie = async (loginUrl) => {
    if (loginUrl) {
        const url = loginUrl.match(/(http.+)&sign/)?.[1] || loginUrl
        const req = await new Request(url)
        await req.load()
        const setCookie = req.response.headers["Set-Cookie"]
        if (setCookie) {
            cookie = setCookie
            await lk.setVal('cookie', cookie, 'icloud')
            return
        }
        lk.logErr("请先获取cookie")
    }
}

const queryfee = () => new Promise((resolve) => {
    lk.log('查询余额')
    const url = {
        url: fetchUri.balance,
        headers: {
            cookie
        }
    }
    lk.post(url, (resp, data) => {
        lk.log('查询余额响应返回')
        try {
            lk.log(data)
            data = JSON.parse(data)
            if (data.result === 10000) {
                subt = `${parseFloat(parseInt(data.totalBalanceAvailable) / 100).toFixed(2)}¥`
            } else if (data.result === -10000) {
                subt = `已欠费`
            } else {
                throw new Error("查询余额失败")
            }
            lk.log(`查询余额结束：${subt}`)
        } catch (e) {
            requestState ^= 1 << 1
            lk.execFail()
            lk.logErr(e)
            lk.log(JSON.stringify(data))
            lk.log(`查询余额异常，请求体：${JSON.stringify(url)}`)
        } finally {
            resolve()
        }
    })
})

const formatFlow = number => {
    const n = number / 1024
    if (n < 1024) {
        return {count: n.toFixed(2), unit: 'M'}
    }
    return {count: (n / 1024).toFixed(2), unit: 'G'}
}

const getVoiceRet = data => {
    let ret = 0
    ret = data?.items[0]?.items.filter(i => i.unitTypeId == "1").reduce((acc, cur) => {
        return (acc + Number(cur.balanceAmount)) || 0
    }, ret)
    return ret
}

const queryMeal = () => new Promise((resolve) => {
    lk.log('查询套餐')
    const url = {
        url: fetchUri.detail,
        headers: {
            cookie: cookie
        }
    }
    lk.post(url, (resp, data) => {
        lk.log('查询套餐响应返回')
        try {
            lk.log(data)
            data = JSON.parse(data)
            if (data.result === 10000) {
                if (data.hasOwnProperty("balance")) {
                    flowRes = formatFlow(data.balance)
                    flowRes = `${flowRes.count} ${flowRes.unit}B`
                } else {
                    flowRes = '0 MB'
                }
                // flowRes = '[流量] ' + flowRes
                voiceRes = `${getVoiceRet(data)}分钟`
            } else {
                throw new Error("查询套餐失败")
            }
            lk.log(`查询套餐结束：\n${flowRes}\n${voiceRes}`)
        } catch (e) {
            requestState ^= 1 << 2
            lk.execFail()
            lk.logErr(e)
            lk.log(JSON.stringify(data))
            lk.log(`查询套餐异常，请求体：${JSON.stringify(url)}`)
        } finally {
            resolve()
        }
    })
})

const getSmallBg = async url => {
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
    return await webview.evaluateJavaScript(js, true)
}

/**
 * 根据数据填充widget
 * @param w
 * @param pretitle  大标题
 * @param _subt      [话费]1元
 * @param _flowRes   [流量]1GB
 * @param _voiceRes  [语音]1分钟
 */
const createWidget = async (w, pretitle, _subt, _flowRes, _voiceRes) => {
    lk.log('创建widget')

    // 获取第二天是否工作日
    let targetDate = new Date()
    let isWD = await lk.isWorkingDays(new Date(targetDate.setDate(now.getDate() + 1)), workingDaysFlag, holidayFlag)

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
            preData = await lk.getVal(diffDataKey, "local", "")
            preData = Number(preData.replace('¥', ''))
            let curData = Number(_subt.replace('¥', ''))
            if (preData || preData === 0) {
                diffResult = curData - preData
                let preDiff = await lk.getVal(preDiffKey, "local", "")
                // 判断是否保持上次的差值
                if (preDiff) {
                    // 有保存，则判断本次差值是否为0，为0则显示上次保存差值
                    if (diffResult === 0) {
                        diffResult = preDiff
                    }
                }
                await lk.setVal(preDiffKey, diffResult, "local")
                diffSuffix = '¥'
            }
        } else if (infoOrder[2] === "流量") {
            diffDataKey = 'flowRes'
            preDiffKey += diffDataKey
            preData = await lk.getVal(diffDataKey, "local", "")
            preData = preData.split(" ")
            preData = lk.fileLengthFormat(preData[0], preData[1], true)
            let curData = _flowRes.split(" ")
            curData = lk.fileLengthFormat(curData[0], curData[1], true)
            if (preData || preData === 0) {
                diffResult = curData - preData
                let preDiff = await lk.getVal(preDiffKey, "local", "")
                // 判断是否保持上次的差值
                if (preDiff) {
                    // 有保存，则判断本次差值是否为0，为0则显示上次保存差值
                    if (diffResult === 0) {
                        diffResult = preDiff
                    }
                }
                await lk.setVal(preDiffKey, diffResult, "local")
                let tdiffResult = diffResult
                if (diffResult < 0) {
                    tdiffResult *= -1
                }
                let formatResult = lk.fileLengthFormat(tdiffResult).split(" ")
                diffResult = (diffResult < 0 ? "-" : "") + formatResult[0]
                diffSuffix = formatResult.length == 2 ? formatResult[1] : "MB"
            }
        } else if (infoOrder[2] === "语音") {
            diffDataKey = 'voiceRes'
            preDiffKey += diffDataKey
            preData = await lk.getVal(diffDataKey, "local", "")
            preData = Number(preData.replace('分钟', ''))
            let curData = Number(_voiceRes.replace('分钟', ''))
            if (preData || preData === 0) {
                diffResult = curData - preData
                let preDiff = await lk.getVal(preDiffKey, "local", "")
                // 判断是否保持上次的差值
                if (preDiff) {
                    // 有保存，则判断本次差值是否为0，为0则显示上次保存差值
                    if (diffResult === 0) {
                        diffResult = preDiff
                    }
                }
                await lk.setVal(preDiffKey, diffResult, "local")
                diffSuffix = '分钟'
            }
        }
    } catch (e) {
        lk.logErr(e)
        diffResult = ''
    }
    lk.log(`差值：${diffResult}`)
    // 保存成功执行的数据
    if (requestState & (1 << 1)) {
        lk.log(`${_subt}`)
        await lk.setVal('subt', _subt, 'local')
        lk.log(`写入余额数据：${await lk.getDataFile('local')}`)
    }
    if (requestState & (1 << 2)) {
        lk.log(`${_flowRes}${_voiceRes}`)
        await lk.setVal('flowRes', _flowRes, 'local')
        await lk.setVal('voiceRes', _voiceRes, 'local')
        lk.log(`写入流量语音数据：${await lk.getDataFile('local')}`)
    }
    let image = await lk.getImage('bg.png', 'icloud')
    let base64str = ``
    if (!image) {
        lk.log(`下载背景图${lk.icloud.joinPath(lk.icloud.documentsDirectory(), "bg.png")}`)
        image = await new Request("https://github.com/lowking/Scripts/raw/master/doc/icon/ChinaTelecom_logo.png").loadImage()
        await lk.saveImage("bg.png", image, "icloud")
    }
    const obase64str = Data.fromPNG(image).toBase64String()
    const uri = await getSmallBg(`data:image/png;base64,${obase64str}`)
    base64str = uri.replace(/^data\:image\/\w+;base64,/, '')
    w.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'))
    w.backgroundImage = Image.fromData(Data.fromBase64String(base64str))
    w.setPadding(12, 12, 12, 12)


    lk.log(`设置标题-${pretitle}${isWD}`)
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
    let getWarnColor = await lk.getVal("warnColor", "icloud", "#ee632C")
    let warnColor = new Color(getWarnColor)
    for (let n = 0; n < infoOrder.length; n++) {
        let type = infoOrder[n]
        let currentSpec = specs[n]
        let currentColor = currentSpec.fontColor
        lk.log(`${JSON.stringify(currentSpec)}`)
        if ("话费" === type) {
            lk.log('设置话费')
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
            lk.log('设置流量')
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
            lk.log('设置语音')
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
            lk.log('设置更新时间')
            let sucTime = now
            if (!lk.execStatus) {
                sucTime = new Date(await lk.getVal("lastSuccessfulRunTime", "local", sucTime.getTime()))
            } else {
                await lk.setVal('lastSuccessfulRunTime', sucTime.getTime(), 'local')
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

    lk.log('创建widget end')
    return w
}

const show = w => new Promise(async (resolve) => {
    //格式化显示的信息
    lk.log('显示信息')
    let widget = await createWidget(w, title, subt, flowRes, voiceRes)
    lk.log('显示信息end')
    resolve(widget)
})

const main = async (isLimit) => {
    try {
        // *电信似乎没有这个限制
        if (false && now.getDate() == 1) {
            // 每个月1号维护查询不到数据
            lk.log('每个月1号维护查询不到数据，直接降级处理')
            widget = await createWidget(widget, title, '-', '-', '-')
        } else if (isLimit) {
            widget = await createWidget(widget, title, await lk.getVal('subt', 'local', '-'), await lk.getVal('flowRes', 'local', '-'), await lk.getVal('voiceRes', 'local', '-'))
        } else {
            await updateCookie(loginUrl)
            await queryfee()
            await queryMeal()
            // 执行失败，降级处理
            if (!lk.execStatus) {
                lk.log('整个流程有错误发生，降级处理，读取上次成功执行的数据')
                lk.log(`读取数据：${await lk.getDataFile('local')}`)
                widget = await createWidget(widget, title, await lk.getVal('subt', 'local', '-'), await lk.getVal('flowRes', 'local', '-'), await lk.getVal('voiceRes', 'local', '-'))
            } else {
                lk.log('整个流程执行正常')
                lk.log(`${subt}${flowRes}${voiceRes}`)
                widget = await show(widget)
            }
        }
        lk.saveLog()
        widget.presentSmall()
        Script.setWidget(widget)
        Script.complete()
    } catch (e) {
        // 为了不影响正常显示
        lk.logErr(e)
    }
}

const renderWebView = async () => {
    const webView = new WebView()
    const url = 'https://e.189.cn/index.do'
    await webView.loadURL(url)
    await webView.present(false)

    const request = new Request(fetchUri.detail)
    request.method = 'POST'
    const response = await request.loadJSON()
    lk.log(JSON.stringify(response))
    if (response.result === -10001) {
        const index = await lk.generateAlert('未获取到用户信息', [
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
        lk.log(cookie)
        await lk.setVal('cookie', cookie, 'icloud')
    }
}

if (config.runsInWidget) {
    lk.log('在小组件运行')
    await main(await lk.checkLimit())
} else {
    lk.log('手动运行')
    let enter = await lk.widgetEnter([{name:{zh:"预览",en:"Preview"}, callback: main}], true)
    await lk.handleOperations(enter)
}
//ScriptableToolKit-start
function ScriptableToolKit(scriptName,scriptId,options){return new class{constructor(scriptName,scriptId,options){this.isLimited=false;this.checkLimit();this.local=FileManager.local();this.icloud=FileManager.iCloud();this.curDateCache=this.local.joinPath(this.local.documentsDirectory(),"curDateCache");this.options=options;this.tgEscapeCharMapping={"&":"＆"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=scriptName;this.id=scriptId;this.data=null;this.dataFile=`${this.prefix}${this.id}.json`;this.bgImgPath=`${this.prefix}${this.id}Bg.jpg`;this.bgImgPath=this.local.joinPath(this.local.documentsDirectory(),this.bgImgPath);this.lang=Device.language();this.msg={zh:{s0:"在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。",s1:"看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。",s2:"你想创建什么尺寸的widget？",s3:"你想把widget放在哪里？",s4:" (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。",s5:"widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？",s6:"已经截图，继续",s7:"退出去截图",s8:"小",s9:"中",s10:"大",s11:"顶部左边",s12:"顶部右边",s13:"中间左边",s14:"中间右边",s15:"底部左边",s16:"底部右边",s17:"顶部",s18:"中间",s19:"底部",s20:"在Scriptable内部使用",s21:"导出到相册",s22:"填写遮罩层颜色。（格式：#000000）",s23:"颜色（格式：#000000）",s24:"填写遮罩层不透明度（0-1之间）",s25:"0-1之间",s26:"确定",s27:"取消",s28:"预览widget",s29:"设置widget背景",s30:"入口",s31:"你用的是哪个型号？",s32:"退出",s33:"清除缓存",s34:"开始清除缓存",s35:"清除缓存完成"},en:{s0:"Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.",s1:"It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",s2:"What size of widget are you creating?",s3:"What position will it be in?",s4:" (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)",s5:"Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?",s6:"Continue",s7:"Exit to Take Screenshot",s8:"Small",s9:"Medium",s10:"Large",s11:"Top left",s12:"Top right",s13:"Middle left",s14:"Middle right",s15:"Bottom left",s16:"Bottom right",s17:"Top",s18:"Middle",s19:"Bottom",s20:"Use in Scriptable",s21:"Export to Photos",s22:"Fill in the mask layer color. (Format: #000000)",s23:"Color.(Format: #000000)",s24:"Fill in the mask layer opacity (between 0-1)",s25:"between 0-1",s26:"Confirm",s27:"Cancel",s28:"Preview widget",s29:"Setting widget background",s30:"ENTER",s31:"What type of iPhone do you have?",s32:"Exit",s33:"Clean cache",s34:"Clean cache started",s35:"Clean cache finished"}};this.curLang=this.msg[this.lang]||this.msg.en;this.isSaveLog=this.getResultByKey(`${this.prefix}IsSaveLog${this.id}`,false);this.isEnableLog=this.getResultByKey(`${this.prefix}IsEnableLog${this.id}`,true);this.logDir=this.icloud.documentsDirectory()+"/lklogs/"+this.id;this.logSeparator="\n██";this.now=new Date;this.execStatus=true;this.notifyInfo=[];this.operations=[]}async checkLimit(){const lastRunningTime=await this.getVal(`${this.prefix}LastRunningTime${this.id}`,"local",0);const runLimitNum=this.getResultByKey(`${this.prefix}RunLimitNum${this.id}`,3e5);if(lastRunningTime>0){if(this.now.getTime()-lastRunningTime<=runLimitNum){this.appendNotifyInfo("限制运行");this.isLimited=true}else{await this.setVal(`${this.prefix}LastRunningTime${this.id}`,this.now.getTime(),"local")}}return this.isLimited}getResultByKey(key,defaultValue){if(!this.options){return defaultValue}const val=this.options[key];if(this.isEmpty(val)){return defaultValue}else{return val}}appendNotifyInfo(info,type){if(type==1){this.notifyInfo=info}else{this.notifyInfo.push(`${this.logSeparator}${this.formatDate(new Date,"yyyy-MM-dd HH:mm:ss.S")}█${info}`)}}saveLog(){if(this.isSaveLog){let message;if(Array.isArray(this.notifyInfo)){message=this.notifyInfo.join("")}else{message=this.notifyInfo}if(!this.icloud.isDirectory(this.logDir)){this.icloud.createDirectory(this.logDir,true)}this.icloud.writeString(`${this.logDir}/${this.formatDate(this.now,"yyyyMMddHHmmss")}.log`,message)}}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=false}sleep(time){return new Promise(resolve=>setTimeout(resolve,time))}log(message){if(this.isEnableLog)console.log(`${this.logSeparator}${JSON.stringify(message)}`);this.appendNotifyInfo(message)}logErr(message){this.execStatus=false;if(this.isEnableLog){console.warn(`${this.logSeparator}${this.name}执行异常:`);console.warn(message);console.warn(`\n${message.message}`)}}getContainer(key){return key=="local"?this.local:this.icloud}async getVal(key,container,defaultValue){let containerInstance=this.getContainer(container);let data="";try{let realDataFile=containerInstance.joinPath(containerInstance.documentsDirectory(),this.dataFile);if(!containerInstance.fileExists(realDataFile)){await this.setVal(key,defaultValue,container);return defaultValue}data=await containerInstance.readString(realDataFile);data=JSON.parse(data)}catch(e){throw e}if(data.hasOwnProperty(key)){return data[key]}else{await this.setVal(key,defaultValue,container);return defaultValue}}async getDataFile(container){let containerInstance=this.getContainer(container);let data="";try{let realDataFile=containerInstance.joinPath(containerInstance.documentsDirectory(),this.dataFile);if(!containerInstance.fileExists(realDataFile)){return Promise.resolve("")}data=await containerInstance.readString(realDataFile)}catch(e){throw e}return Promise.resolve(data)}async saveImage(fileName,image,container){let containerInstance=this.getContainer(container);let imagePath=containerInstance.joinPath(containerInstance.documentsDirectory(),`${this.prefix}${this.id}/${fileName}`);let imageDir=imagePath.substring(0,imagePath.lastIndexOf("/")+1);if(!containerInstance.isDirectory(imageDir)){containerInstance.createDirectory(imageDir,true)}containerInstance.writeImage(imagePath,image)}async getImage(fileName,container){let containerInstance=this.getContainer(container);let imagePath=containerInstance.joinPath(containerInstance.documentsDirectory(),`${this.prefix}${this.id}/${fileName}`);if(!containerInstance.fileExists(imagePath)){this.logErr(`file not exist: ${imagePath}`);return false}return await containerInstance.readImage(imagePath)}async setVal(key,val,container){let containerInstance=this.getContainer(container);let data;let realDataFile=containerInstance.joinPath(containerInstance.documentsDirectory(),this.dataFile);try{if(!containerInstance.fileExists(realDataFile)){data={}}else{data=await containerInstance.readString(realDataFile);data=JSON.parse(data)}}catch(e){data={}}data[key]=val;await containerInstance.writeString(realDataFile,JSON.stringify(data))}async get(options,callback=(()=>{})){let request=new Request("");request.url=options.url;request.method="GET";request.headers=options.headers;try{const result=await request.loadString();callback(request.response,result);return result}catch(e){this.logErr(e);callback(undefined,undefined)}}async post(options,callback=(()=>{})){let request=new Request("");request.url=options.url;request.body=options.body;request.method="POST";request.headers=options.headers;request.timeout=5e3;try{const result=await request.loadString();callback(request.response,result);return result}catch(e){this.logErr(e);callback(undefined,undefined)}}async loadScript({scriptName:scriptName,url:url}){this.log(`获取脚本【${scriptName}】`);const content=await this.get({url:url});this.icloud.writeString(`${this.icloud.documentsDirectory()}/${scriptName}.js`,content);this.log(`获取脚本【${scriptName}】完成🎉`)}require({scriptName:scriptName,url:url="",reload:reload=false}){if(this.icloud.fileExists(this.icloud.joinPath(this.icloud.documentsDirectory(),`${scriptName}.js`))&&!reload){this.log(`引用脚本【${scriptName}】`);return importModule(scriptName)}else{this.loadScript({scriptName:scriptName,url:url});this.log(`引用脚本【${scriptName}】`);return importModule(scriptName)}}async generateInputAlert(message,field,defaultValue){let result=[];let alert=new Alert;alert.message=message;alert.addTextField(field,defaultValue);alert.addCancelAction(this.curLang.s27);alert.addAction(this.curLang.s26);result[0]=await alert.presentAlert();result[1]=alert.textFieldValue(0);return result}async generateAlert(message,options){let alert=new Alert;alert.message=message;for(const option of options){alert.addAction(option)}return await alert.presentAlert()}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"}isWorkingDays(now,workingDaysFlag="curlybraces",holidayFlag="gamecontroller"){return new Promise(async(resolve,reject)=>{let sp="≈";const d=this.formatDate(now,"yyyy-MM-dd");let resultStr=0;try{let curDate=await this.getVal("curDateCache","local","fff");let curDateErrorTime=await this.getVal("curDateCacheErrorTime","local",this.now.getTime());let isPreError=!this.isEmpty(curDateErrorTime)&&Number(curDateErrorTime)+5*60*1e3<this.now.getTime();if(!isPreError&&d==curDate.split(sp)[0]&&curDate.split(sp)[1]!="❌"){resultStr=curDate.split(sp)[1];this.log("already request")}else{this.log("send request");const url={url:"http://timor.tech/api/holiday/info/"+d};await this.get(url,(resp,data)=>{if(data.indexOf("<")==0){resultStr="❌"}else{resultStr=JSON.parse(data);if(resultStr.code==-1){resultStr="❌"}else{resultStr=resultStr.type.type}}})}}catch(e){resultStr="❌";this.logErr(e)}finally{await this.setVal("curDateCache",`${d}${sp}${resultStr}`,"local");if(resultStr=="❌"){resolve(resultStr);this.log("写入运行错误时间，5分钟后重新请求！");this.setVal("curDateCache","","local");this.setVal("curDateCacheErrorTime",`${this.now.getTime()}`,"local")}else{this.setVal("curDateCacheErrorTime","","local");this.setVal("curDateCache",`${d}${sp}${resultStr}`,"local");resolve(resultStr==0||resultStr==3?workingDaysFlag:holidayFlag)}}})}randomString(len){len=len||32;var $chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var maxPos=$chars.length;var pwd="";for(let i=0;i<len;i++){pwd+=$chars.charAt(Math.floor(Math.random()*maxPos))}return pwd}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};if(/(y+)/.test(format))format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length));for(let k in o)if(new RegExp("("+k+")").test(format))format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length));return format}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){str+=``;if(str.length<len){while(str.length<len){if(direction==0){str+=fill}else{str=fill+str}}}if(ifCode){let temp=``;for(var i=0;i<clen;i++){temp+=cstr}str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}str=prefix+str+suffix;return this.toDBC(str)}customReplace(str,param,prefix,suffix){try{if(this.isEmpty(prefix)){prefix="#{"}if(this.isEmpty(suffix)){suffix="}"}for(let i in param){str=str.replace(`${prefix}${i}${suffix}`,param[i])}}catch(e){this.logErr(e)}return str}toDBC(txtstring){var tmp="";for(var i=0;i<txtstring.length;i++){if(txtstring.charCodeAt(i)==32){tmp=tmp+String.fromCharCode(12288)}else if(txtstring.charCodeAt(i)<127){tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248)}}return tmp}getWidgetBg(){return this.local.readImage(this.bgImgPath)}phoneSizes(){return{2868:{small:510,medium:1092,large:1146,left:114,right:696,top:276,middle:912,bottom:1548},2796:{small:510,medium:1092,large:1146,left:99,right:681,top:282,middle:918,bottom:1554},2556:{small:474,medium:1014,large:1062,left:82,right:622,top:270,middle:858,bottom:1446},2778:{small:510,medium:1092,large:1146,left:96,right:678,top:246,middle:882,bottom:1518},2532:{small:474,medium:1014,large:1062,left:78,right:618,top:231,middle:819,bottom:1407},2688:{small:507,medium:1080,large:1137,left:81,right:654,top:228,middle:858,bottom:1488},1792:{small:338,medium:720,large:758,left:54,right:436,top:160,middle:580,bottom:1e3},2436:{x:{small:465,medium:987,large:1035,left:69,right:591,top:213,middle:783,bottom:1353},mini:{small:465,medium:987,large:1035,left:69,right:591,top:231,middle:801,bottom:1371}},2208:{small:471,medium:1044,large:1071,left:99,right:672,top:114,middle:696,bottom:1278},1334:{small:296,medium:642,large:648,left:54,right:400,top:60,middle:412,bottom:764},1136:{small:282,medium:584,large:622,left:30,right:332,top:59,middle:399,bottom:399},1624:{small:310,medium:658,large:690,left:46,right:394,top:142,middle:522,bottom:902},2001:{small:444,medium:963,large:972,left:81,right:600,top:90,middle:618,bottom:1146}}}remove(path){this.local.remove(path)}cropImage(img,rect,color,opacity){let draw=new DrawContext;draw.size=new Size(rect.width,rect.height);draw.drawImageAtPoint(img,new Point(-rect.x,-rect.y));draw.setFillColor(new Color(color,Number(opacity)));draw.fillRect(new Rect(0,0,img.size["width"],img.size["height"]));return draw.getImage()}async widgetCutBg(){var message;message=this.curLang.s0;let exitOptions=[this.curLang.s6,this.curLang.s7];let shouldExit=await this.generateAlert(message,exitOptions);if(shouldExit)return;let img=await Photos.fromLibrary();let height=img.size.height;let phone=this.phoneSizes()[height];if(!phone){message=this.curLang.s1;await this.generateAlert(message,["OK"]);return}if(height==2436){message=this.curLang.s31;let types=["iPhone 12 mini","iPhone 11 Pro, XS, X"];let typeIndex=await this.generateAlert(message,types);let type=typeIndex==0?"mini":"x";phone=phone[type]}message=this.curLang.s2;let sizes=[this.curLang.s8,this.curLang.s9,this.curLang.s10];let size=await this.generateAlert(message,sizes);message=this.curLang.s3;message+=height==1136?this.curLang.s4:"";let crop={w:"",h:"",x:"",y:""};if(size==0){crop.w=phone.small;crop.h=phone.small;let positions=["Top left","Top right","Middle left","Middle right","Bottom left","Bottom right"];let positionsString=[this.curLang.s11,this.curLang.s12,this.curLang.s13,this.curLang.s14,this.curLang.s15,this.curLang.s16];let position=await this.generateAlert(message,positionsString);let keys=positions[position].toLowerCase().split(" ");crop.y=phone[keys[0]];crop.x=phone[keys[1]]}else if(size==1){crop.w=phone.medium;crop.h=phone.small;crop.x=phone.left;let positions=["Top","Middle","Bottom"];let positionsString=[this.curLang.s17,this.curLang.s18,this.curLang.s19];let position=await this.generateAlert(message,positionsString);let key=positions[position].toLowerCase();crop.y=phone[key]}else if(size==2){crop.w=phone.medium;crop.h=phone.large;crop.x=phone.left;let positionsString=[this.curLang.s17,this.curLang.s19];let position=await this.generateAlert(message,positionsString);crop.y=position?phone.middle:phone.top}let maskLayerColor=await this.generateInputAlert(this.curLang.s22,this.curLang.s23,"#000000");if(maskLayerColor[0]==-1)return;let opacity=await this.generateInputAlert(this.curLang.s24,this.curLang.s25,"0.1");if(opacity[0]==-1)return;let imgCrop=this.cropImage(img,new Rect(crop.x,crop.y,crop.w,crop.h),maskLayerColor[1],opacity[1]);message=this.curLang.s5;const exportPhotoOptions=[this.curLang.s20,this.curLang.s21];const exportPhoto=await this.generateAlert(message,exportPhotoOptions);if(exportPhoto){Photos.save(imgCrop)}else{this.local.writeImage(this.bgImgPath,imgCrop)}Script.complete()}async widgetEnter(customEnter,isReset){await this.setVal("lastRunningTime",0,"local");let options=[this.curLang.s28,this.curLang.s29,this.curLang.s33];if(Array.isArray(customEnter)){let customEnterNames=customEnter.map((item,index)=>{return item.name[this.lang]});let customEnterCallback=customEnter.map((item,index)=>{return item.callback});if(isReset){options=customEnterNames}else{this.operations.push({callback:main});this.operations.push({callback:function(){$.widgetCutBg()}});this.operations.push({callback:function(){$.cleanCache()}});options=options.concat(customEnterNames)}customEnterCallback.forEach(callback=>{this.operations.push({callback:callback})})}options.push(this.curLang.s32);this.operations.push({callback:function(){}});return await this.generateAlert(this.curLang.s30,options)}async handleOperations(index){await this.operations[index].callback()}cleanCache(){this.log(this.curLang.s34);let filePath=this.local.joinPath(this.local.documentsDirectory(),this.dataFile);if(this.local.fileExists(filePath)){this.local.remove(filePath)}filePath=this.bgImgPath;if(this.local.fileExists(filePath)){this.local.remove(filePath)}this.log(this.curLang.s35)}formatTimeDuring(total,lang="zh",n=0){total=Number(total);let zhUnitArr=["毫秒","秒","分钟","小时","天","月","年"];let enUnitArr=["ms","s","min","h","d","m","y"];let scaleArr=[1e3,60,60,24,30,12,100];let len=total;if(len>scaleArr[n]){len=total/scaleArr[n];return this.formatTimeDuring(len,lang,++n)}else{let unit=zhUnitArr[n];if(lang==="en"){unit=enUnitArr[n]}return len.toFixed(2)+""+unit}}fileLengthFormat(total,unit="",toByte=false){total=Number(total);var unitArr=["","KB","MB","GB","TB","PB","EB","ZB"];var n=0;try{n=unitArr.indexOf(unit)}catch(e){throw e}if(toByte){if(n==0){return total}return this.fileLengthFormat(total*1024,unitArr[--n],true)}var len=total;if(len>1e3){len=total/1024;return this.fileLengthFormat(len,unitArr[++n])}else{if(n==0){return len.toFixed(2)}return len.toFixed(2)+" "+unitArr[n]}}}(scriptName,scriptId,options)}
//ScriptableToolKit-end
