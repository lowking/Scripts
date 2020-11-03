// https://gist.githubusercontent.com/mzeryck/3a97ccd1e059b3afa3c6666d27a496c9/raw/bbcac348d540e452228bd85aa80a5b45bb023a65/mz_invisible_widget.js
// 这是原作者gist地址，本人就汉化，只为引用到自己修改的Scriptable中
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: image;

// This widget was created by Max Zeryck @mzeryck

// Widgets are unique based on the name of the script.
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

if (config.runsInWidget) {
    let widget = new ListWidget()
    widget.backgroundImage = files.readImage(path)

    // Your code here

    Script.setWidget(widget)
    Script.complete()
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

        "2532": {
            "small":  474,
            "medium": 1014,
            "large":  1062,
            "left":  78,
            "right": 618,
            "top":    231,
            "middle": 819,
            "bottom": 1407
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
