// https://gist.githubusercontent.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9/raw/bbcac348d540e452228bd85aa80a5b45bb023a65/mz_invisible_widget.js
// 这是原作者gist地址，本人就汉化，只为引用到自己修改的Scriptable中
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: image;

// This widget was created by Max Zeryck @mzeryck

// Widgets are unique based on the name of the script.

const prefix = "boxjs.net" //修改成你用的域名
const $ = importModule('Env')
// 余额警告阈值
const warnFee = 20
// 流量警告阈值，只判断单位MB的，如果是kb没做处理
const warnData = 200
// 语音警告阈值
const warnVoice = 20

const chavy_autologin_cmcc = ``

const chavy_getfee_cmcc = ``

const isRunWidget = false

$.KEY_autologin = "chavy_autologin_cmcc"

$.KEY_getfee = "chavy_getfee_cmcc"

const crypto = {
    moduleName: 'crypto-js',
    url: 'https://raw.githubusercontent.com/GideonSenku/Scriptable/master/crypto-js.min.js'
}

const now = new Date()
const minutes = now.getMinutes()
const hours = now.getHours()

const filename = Script.name() + ".jpg"
const files = FileManager.local()
const path = files.joinPath(files.documentsDirectory(), filename)
// zh_CN, en
const lang = "zh_CN"
const msg = {
    "zh_CN": [
        "在开始之前，先进入主屏幕，进入图标排列模式。滑到最右边的空白页，并进行截图。",
        "看起来你选择的图片不是iPhone的截图，或者你的iPhone不支持。请换一张图片再试一次。",
        "你想创建什么尺寸的widget？",
        "你想把widget放在哪里？",
        " (请注意，您的设备只支持两行小部件，所以中间和底部的选项是一样的)。",
        "widget的背景图已裁切完成，想在Scriptable内部使用还是导出到相册？",
        "已经截图，继续",
        "退出去截图",
        "小","中","大",
        "顶部左边","顶部右边","中间左边","中间右边","底部左边","底部右边",
        "顶部","中间","底部",
        "在Scriptable内部使用","导出到相册"
    ],
    "en": [
        "Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.",
        "It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",
        "What size of widget are you creating?",
        "What position will it be in?",
        " (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)",
        "Your widget background is ready. Would you like to use it in a Scriptable widget or export the image?",
        "Continue",
        "Exit to Take Screenshot",
        "Small","Medium","Large",
        "Top left","Top right","Middle left","Middle right","Bottom left","Bottom right",
        "Top","Middle","Bottom",
        "Use in Scriptable","Export to Photos"
    ]
}

async function getdata(key) {
    const url = `http://${prefix}/query/boxdata`
    const boxdata = await $.get({ url })
    if (boxdata.datas[key]) {
        return boxdata.datas[key]
    } else {
        return undefined
    }
}

if (config.runsInWidget || isRunWidget) {
    let widget = new ListWidget()
    try {
        widget.backgroundImage = files.readImage(path)

        // Your code here
        if (true || minutes >= 0 && minutes <= 20) {
            $.CryptoJS = $.require(crypto)
            $.autologin = await getdata($.KEY_autologin)
            $.getfee = await getdata($.KEY_getfee)
            await loginapp()
            await queryfee()
            await querymeal()
            await showmsg(widget)
        }

        Script.setWidget(widget)
        Script.complete()
    } catch (e) {
        // 为了不影响上次正常运行的显示效果，遇到异常不抛出
    }
} else {

    // Determine if user has taken the screenshot.
    var message
    var curLang = msg[lang]
    message = curLang[0]
    let exitOptions = [curLang[6],curLang[7]]
    let shouldExit = await generateAlert(message,exitOptions)
    if (shouldExit) return

    // Get screenshot and determine phone size.
    let img = await Photos.fromLibrary()
    let height = img.size.height
    let phone = phoneSizes()[height]
    if (!phone) {
        message = curLang[1]
        await generateAlert(message,["OK"])
        return
    }

    // Prompt for widget size and position.
    message = curLang[2]
    let sizes = [curLang[8], curLang[9], curLang[10]]
    let size = await generateAlert(message,sizes)

    message = curLang[3]
    message += (height == 1136 ? curLang[4] : "")

    // Determine image crop based on phone size.
    let crop = { w: "", h: "", x: "", y: "" }
    if (size == 0) {
        crop.w = phone.small
        crop.h = phone.small
        let positions = ["Top left","Top right","Middle left","Middle right","Bottom left","Bottom right"]
        let positionsString = [curLang[11],curLang[12],curLang[13],curLang[14],curLang[15],curLang[16]]
        let position = await generateAlert(message,positionsString)

        // Convert the two words into two keys for the phone size dictionary.
        let keys = positions[position].toLowerCase().split(' ')
        crop.y = phone[keys[0]]
        crop.x = phone[keys[1]]

    } else if (size == 1) {
        crop.w = phone.medium
        crop.h = phone.small

        // Medium and large widgets have a fixed x-value.
        crop.x = phone.left
        let positions = ["Top","Middle","Bottom"]
        let positionsString = [curLang[17],curLang[18],curLang[19]]
        let position = await generateAlert(message,positionsString)
        let key = positions[position].toLowerCase()
        crop.y = phone[key]

    } else if(size == 2) {
        crop.w = phone.medium
        crop.h = phone.large
        crop.x = phone.left
        let positions = ["Top","Bottom"]
        let positionsString = [curLang[17],curLang[19]]
        let position = await generateAlert(message,positionsString)

        // Large widgets at the bottom have the "middle" y-value.
        crop.y = position ? phone.middle : phone.top
    }

    // Crop image and finalize the widget.
    let imgCrop = cropImage(img, new Rect(crop.x,crop.y,crop.w,crop.h))

    message = curLang[5]
    const exportPhotoOptions = [curLang[20],curLang[21]]
    const exportPhoto = await generateAlert(message,exportPhotoOptions)

    if (exportPhoto) {
        Photos.save(imgCrop)
    } else {
        files.writeImage(path,imgCrop)
    }

    Script.complete()
}

function showmsg(w) {
    return new Promise((resolve) => {
        log('显示信息')
        $.subt = `[话费] ${$.fee.rspBody.curFee}元`
        const res = $.meal.rspBody.qryInfoRsp[0].resourcesTotal
        const flowRes = res.find((r) => r.resourcesCode === '04')
        const voiceRes = res.find((r) => r.resourcesCode === '01')
        console.log(JSON.stringify(flowRes))
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

        log('显示信息end')
        resolve()
    })
}

function createWidget(w, pretitle, title, subtitle, other) {
    log('创建widget')

    const bgColor = new LinearGradient()
    bgColor.colors = [new Color("#001A27"), new Color("#00334e")]
    bgColor.locations = [0.0, 1.0]
//     w.backgroundGradient = bgColor
    //w.setPadding(0, 0, 0, 0)
//     w.centerAlignContent()

    let normalColor = new Color("#ccc")
    let preTxt = w.addText(pretitle)
    let preColor = normalColor
    preTxt.textColor = preColor
    preTxt.font = Font.boldSystemFont(18)
//     preTxt.applyHeadlineTextStyling()
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

    w.backgroundImage = files.readImage(files.joinPath(files.documentsDirectory(), filename))

    w.presentSmall()
    log('创建widget end')
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
                $.logErr(e, resp)
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
                $.fee = JSON.parse(decrypt(data, "GS7VelkJl5IT1uwQ"))
                console.warn("fee")
            } catch (e) {
                $.logErr(e, resp)
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
                $.logErr(e, resp)
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

// Generate an alert with the provided array of options.
async function generateAlert(message,options) {

    let alert = new Alert()
    alert.message = message

    for (const option of options) {
        alert.addAction(option)
    }

    let response = await alert.presentAlert()
    return response
}

// Crop an image into the specified rect.
function cropImage(img,rect) {

    let draw = new DrawContext()
    draw.size = new Size(rect.width, rect.height)

    draw.drawImageAtPoint(img,new Point(-rect.x, -rect.y))
    return draw.getImage()
}

// Pixel sizes and positions for widgets on all supported phones.
function phoneSizes() {
    let phones = {
        "2688": {
            "small":  507,
            "medium": 1080,
            "large":  1137,
            "left":  81,
            "right": 654,
            "top":    228,
            "middle": 858,
            "bottom": 1488
        },

        "1792": {
            "small":  338,
            "medium": 720,
            "large":  758,
            "left":  54,
            "right": 436,
            "top":    160,
            "middle": 580,
            "bottom": 1000
        },

        "2436": {
            "small":  465,
            "medium": 987,
            "large":  1035,
            "left":  69,
            "right": 591,
            "top":    213,
            "middle": 783,
            "bottom": 1353
        },

        "2208": {
            "small":  471,
            "medium": 1044,
            "large":  1071,
            "left":  99,
            "right": 672,
            "top":    114,
            "middle": 696,
            "bottom": 1278
        },

        "1334": {
            "small":  296,
            "medium": 642,
            "large":  648,
            "left":  54,
            "right": 400,
            "top":    60,
            "middle": 412,
            "bottom": 764
        },

        "1136": {
            "small":  282,
            "medium": 584,
            "large":  622,
            "left": 30,
            "right": 332,
            "top":  59,
            "middle": 399,
            "bottom": 399
        },
        "1624": {
            "small": 310,
            "medium": 658,
            "large": 690,
            "left": 46,
            "right": 394,
            "top": 142,
            "middle": 522,
            "bottom": 902
        }
    }
    return phones
}
