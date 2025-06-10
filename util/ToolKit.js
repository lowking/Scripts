/**
 * v1.4.1 build 163
 * 根据自己的习惯整合各个开发者而形成的工具包(@NobyDa, @chavyleung)
 * 兼容surge,quantumult x,loon,node环境
 * 并且加入一些好用的方法
 * 方法如下:
 *      isEmpty: 判断字符串是否是空(undefined,null,空串)
 *      getRequestUrl: 获取请求的url(目前仅支持surge和quanx)
 *      getResponseBody: 获取响应体(目前仅支持surge和quanx)
 *      boxJsJsonBuilder: 构建最简默认boxjs配置json
 *      randomString: 生成随机字符串
 *      autoComplete: 自动补齐字符串
 *      customReplace: 自定义替换
 *      toDBC: 转换全角字符
 *      hash: 字符串做hash
 *      formatDate: 格式化时间
 *      getCookieProp: 从cookie串获取属性
 *      parseHTML: html转dom,需要surge用webview引擎
 *
 * ⚠️当开启当且仅当执行失败的时候通知选项,请在执行失败的地方执行execFail()
 * ⚠️可以直接命令行执行: node util/example/ToolKitDemo.js p iphone,把脚本发送到iphone执行
 *   iphone可以通过构造函数options传入,具体用法如下
 *
 * @param scriptName 脚本名,用于通知时候的标题
 * @param scriptId 每个脚本唯一的id,用于存储持久化的时候加入key
 * @param options 传入一些参数,目前参数如下:
 *                httpApi: ffff@3.3.3.18:6166(这个是默认值,surge调试脚本用,可自行修改)
 *                         也可以传入一个对象配置传入多台设备,在不同设备运行
 *                         格式: {iphone:"ffff@3.3.3.18:6166", ipad:"ffff@3.3.3.19:6166"}
 *                targetBoxjsJsonPath: /Users/lowking/Desktop/Scripts/lowking.boxjs.json(生成boxjs配置的目标文件路径)
 */
function ToolKit(scriptName, scriptId, options) {
    class Request {
        constructor(tk) {
            this.tk = tk
        }
        fetch(options, method = 'GET') {
            options = typeof options === 'string' ? { url: options } : options
            let fetcher
            switch (method) {
                case 'PUT':
                    fetcher = this.put
                    break
                case 'POST':
                    fetcher = this.post
                    break
                default:
                    fetcher = this.get
            }
            const doFetch = new Promise((resolve, reject) => {
                fetcher.call(this, options, (error, resp, data) => error ?
                    reject({
                        error,
                        resp,
                        data
                    }) :
                    resolve({
                        error,
                        resp,
                        data
                    }))
            })
            const delayFetch = (promise, timeout = 5000) => {
                return Promise.race([promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), timeout))
                ])
            }
            return options.timeout > 0 ? delayFetch(doFetch, options.timeout) : doFetch
        }

        async get(options) {
            return this.fetch.call(this.tk, options)
        }

        async post(options) {
            return this.fetch.call(this.tk, options, 'POST')
        }

        async put(options) {
            return this.fetch.call(this.tk, options, 'PUT')
        }
    }

    return new (class {
        constructor(scriptName, scriptId, options) {
            // ! 无法使用匿名函数,会导致内部this指针指向错误无法获取数据
            Object.prototype.s = function (replacer, space) {
                if (typeof this === "string") return this
                return JSON.stringify(this, replacer, space)
            }
            Object.prototype.o = function (reviver) {
                return JSON.parse(this, reviver)
            }
            Object.prototype.getIgnoreCase = function (key) {
                if (!key) throw "Key required"
                let target = this
                try {
                    if (typeof this === "string") target = JSON.stringify(this)
                } catch (e) {
                    throw "It's not a JSON object or string!"
                }
                const ret = Object.keys(target).reduce((obj, key) => {
                    obj[key.toLowerCase()] = target[key]
                    return obj
                }, {})
                return ret[key]
            }
            this.userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`
            this.prefix = `lk`
            this.name = scriptName
            this.id = scriptId
            this.req = new Request(this)
            this.data = null
            this.dataFile = this.getRealPath(`${this.prefix}${this.id}.dat`)
            this.boxJsJsonFile = this.getRealPath(`${this.prefix}${this.id}.boxjs.json`)

            // surge http api等一些扩展参数
            this.options = options

            // 命令行入参
            this.isExecComm = false

            // 默认脚本开关
            this.isEnableLog = this.getVal(`${this.prefix}IsEnableLog${this.id}`)
            this.isEnableLog = this.isEmpty(this.isEnableLog) ? true : this.isEnableLog.o()
            this.isNotifyOnlyFail = this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`)
            this.isNotifyOnlyFail = this.isEmpty(this.isNotifyOnlyFail) ? false : this.isNotifyOnlyFail.o()

            // tg通知开关
            this.isEnableTgNotify = this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`)
            this.isEnableTgNotify = this.isEmpty(this.isEnableTgNotify) ? false : this.isEnableTgNotify.o()
            this.tgNotifyUrl = this.getVal(`${this.prefix}TgNotifyUrl${this.id}`)
            this.isEnableTgNotify = this.isEnableTgNotify ? !this.isEmpty(this.tgNotifyUrl) : this.isEnableTgNotify

            // 计时部分
            this.costTotalStringKey = `${this.prefix}CostTotalString${this.id}`
            this.costTotalString = this.getVal(this.costTotalStringKey)
            this.costTotalString = this.isEmpty(this.costTotalString) ? `0,0` : this.costTotalString.replace("\"", "")
            this.costTotalMs = this.costTotalString.split(",")[0]
            this.execCount = this.costTotalString.split(",")[1]
            this.sleepTotalMs = 0

            this.logSeparator = '\n██'
            this.twoSpace = '  '
            this.now = new Date()
            this.startTime = this.now.getTime()
            this.node = (() => {
                if (this.isNode()) {
                    const request = require('request')
                    return ({ request })
                } else {
                    return (null)
                }
            })()
            this.execStatus = true
            this.notifyInfo = []

            // boxjs相关
            this.boxjsCurSessionKey = "chavy_boxjs_cur_sessions"
            this.boxjsSessionsKey = "chavy_boxjs_sessions"

            // tg消息转义配置
            this.preTgEscapeCharMapping = {
                '|\`|': ',backQuote,'
            }
            this.finalTgEscapeCharMapping = {
                ',backQuote,': '\`',
                '%2CbackQuote%2C': '\`'
            }
            this.tgEscapeCharMapping = {
                '\_': '\\_',
                '\*': '\\*',
                '\`': '\\`'
            }
            this.tgEscapeCharMappingV2 = {
                '\_': '\\_',
                '\*': '\\*',
                '\[': '\\[',
                '\]': '\\]',
                '\(': '\\(',
                '\)': '\\)',
                '\~': '\\~',
                '\`': '\\`',
                '\>': '\\>',
                '\#': '\\#',
                '\+': '\\+',
                '\-': '\\-',
                '\=': '\\=',
                '\|': '\\|',
                '\{': '\\{',
                '\}': '\\}',
                '\.': '\\.',
                '\!': '\\!'
            }
            this.log(`${this.name}, 开始执行!`)
            this.execComm()
        }

        // 当执行命令的目录不是脚本所在目录时,自动把文件路径改成指令传入的路径并返回完整文件路径
        getRealPath(fileName) {
            if (!this.isNode()) {
                return fileName
            }
            let targetPath = process.argv.slice(1, 2)[0].split("/")
            targetPath[targetPath.length - 1] = fileName
            return targetPath.join("/")
        }

        checkPath(fileName) {
            const curDirDataFilePath = this.path.resolve(fileName)
            const rootDirDataFilePath = this.path.resolve(process.cwd(), fileName)
            const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
            const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
            return { curDirDataFilePath, rootDirDataFilePath, isCurDirDataFile, isRootDirDataFile}
        }

        async execComm() {
            // 支持node命令,实现发送手机测试
            if (!this.isNode()) {
                return
            }
            this.comm = process.argv.slice(1)
            if (this.comm[1] != "p") {
                return
            }
            this.isExecComm = true
            this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本!`)
            let httpApi = this.options?.httpApi, targetDevice
            if (this.isEmpty(this?.options?.httpApi)) {
                this.log(`未设置options,使用默认值`)
                if (this.isEmpty(this?.options)) {
                    this.options = {}
                }
                this.options.httpApi = `ffff@10.0.0.6:6166`
                httpApi = this.options.httpApi
                targetDevice = httpApi.split("@")[1]
            } else {
                if (typeof httpApi == "object") {
                    targetDevice = this.isNumeric(this.comm[2]) ? this.comm[3] || "unknown" : this.comm[2]
                    if (httpApi[targetDevice]) {
                        httpApi = httpApi[targetDevice]
                    } else {
                        const keys = Object.keys(httpApi)
                        if (keys[0]) {
                            targetDevice = keys[0]
                            httpApi = httpApi[keys[0]]
                        } else {
                            httpApi = "error"
                        }
                    }
                }
                if (!/.*?@.*?:[0-9]+/.test(httpApi)) {
                    this.log(`❌httpApi格式错误!格式: ffff@3.3.3.18:6166`)
                    this.done()
                    return
                }
            }
            this.callApi(this.comm[2], targetDevice, httpApi)
        }

        callApi(timeout, targetDevice, httpApi) {
            let fname = this.comm[0]
            const [ xKey, httpApiHost ] = httpApi.split("@")
            this.log(`获取【${fname}】内容传给【${targetDevice || httpApiHost}】`)
            this.fs = this.fs ? this.fs : require('fs')
            this.path = this.path ? this.path : require('path')
            const { curDirDataFilePath, rootDirDataFilePath, isCurDirDataFile, isRootDirDataFile } = this.checkPath(fname)
            if (!(isCurDirDataFile || isRootDirDataFile)) {
                lk.done()
                return
            }
            const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath
            let options = {
                url: `http://${httpApiHost}/v1/scripting/evaluate`,
                headers: {
                    "X-Key": xKey
                },
                body: {
                    "script_text": new String(this.fs.readFileSync(datPath)),
                    "mock_type": "cron",
                    "timeout": (!this.isEmpty(timeout) && timeout > 5) ? timeout : 5
                },
                json: true
            }
            this.req.post(options).then(({ error, resp, data }) => {
                this.log(`已将脚本【${fname}】发给【${targetDevice || httpApiHost}】,执行结果: \n${this.twoSpace}error: ${error}\n${this.twoSpace}resp: ${resp?.s()}\n${this.twoSpace}data: ${this.responseDataAdapter(data)}`)
                this.done()
            }).catch((e) => {
                let logMsg = ""
                let hasProcessed = false
                if (e?.error?.code) {
                    switch (e.error.code) {
                        case "EHOSTDOWN":
                            logMsg = `请检查配置的目标设备【${targetDevice || httpApiHost}】是否在线！`;
                            hasProcessed = true;
                            break;
                        case "ECONNREFUSED":
                            logMsg = `目标设备【${targetDevice || httpApiHost}】拒绝连接，请确认服务端口已开启且可访问！`;
                            hasProcessed = true;
                            break;
                        case "EHOSTUNREACH":
                            logMsg = `无法到达目标设备【${targetDevice || httpApiHost}】，请检查网络连接和路由设置！`;
                            hasProcessed = true;
                            break;
                        case "ENETUNREACH":
                            logMsg = `网络不可达，无法访问目标设备【${targetDevice || httpApiHost}】，请检查本地网络环境！`;
                            hasProcessed = true;
                            break;
                        case "ETIMEDOUT":
                            logMsg = `连接目标设备【${targetDevice || httpApiHost}】超时，请检查网络状况或目标设备响应状态！`;
                            hasProcessed = true;
                            break;
                        case "ECONNRESET":
                            logMsg = `与目标设备【${targetDevice || httpApiHost}】的连接被重置，可能是设备重启或网络异常！`;
                            hasProcessed = true;
                            break;
                        case "ENOTFOUND":
                            logMsg = `未能解析目标设备地址【${targetDevice || httpApiHost}】，请检查配置的主机名或DNS设置！`;
                            hasProcessed = true;
                            break;
                        case "EADDRINUSE":
                            logMsg = `本地端口已被占用，无法建立与目标设备【${targetDevice || httpApiHost}】的连接！`;
                            hasProcessed = true;
                            break;
                        case "EACCES":
                            logMsg = `权限不足，无法访问目标设备【${targetDevice || httpApiHost}】！`;
                            hasProcessed = true;
                            break;
                        default:
                            hasProcessed = false;
                    }
                }
                if (!hasProcessed) {
                    throw e
                }
                this.log(logMsg)
            })
        }

        boxJsJsonBuilder(info, param) {
            if (!this.isNode()) {
                return
            }
            if (!this.isJsonObject(info) || !this.isJsonObject(param)) {
                this.log("构建BoxJsJson传入参数格式错误,请传入json对象")
                return
            }
            // 从传入参数param读取配置的boxjs的json文件路径
            let boxjsJsonPath = param?.targetBoxjsJsonPath || "/Users/lowking/Desktop/Scripts/lowking.boxjs.json"
            if (!this.fs.existsSync(boxjsJsonPath)) {
                return
            }
            this.log('using node')
            let needAppendKeys = ["settings", "keys"]
            const domain = 'https://raw.githubusercontent.com/Orz-3'
            let boxJsJson = {}
            let scritpUrl = "#lk{script_url}"
            boxJsJson.id = `${this.prefix}${this.id}`
            boxJsJson.name = this.name
            boxJsJson.desc_html = `⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`
            boxJsJson.icons = [`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`, `${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`]
            boxJsJson.keys = []
            boxJsJson.settings = [
                {
                    "id": `${this.prefix}IsEnableLog${this.id}`,
                    "name": "开启/关闭日志",
                    "val": true,
                    "type": "boolean",
                    "desc": "默认开启"
                },
                {
                    "id": `${this.prefix}NotifyOnlyFail${this.id}`,
                    "name": "只当执行失败才通知",
                    "val": false,
                    "type": "boolean",
                    "desc": "默认关闭"
                },
                {
                    "id": `${this.prefix}IsEnableTgNotify${this.id}`,
                    "name": "开启/关闭Telegram通知",
                    "val": false,
                    "type": "boolean",
                    "desc": "默认关闭"
                },
                {
                    "id": `${this.prefix}TgNotifyUrl${this.id}`,
                    "name": "Telegram通知地址",
                    "val": "",
                    "type": "text",
                    "desc": "Tg的通知地址,如: https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="
                }
            ]
            boxJsJson.author = "#lk{author}"
            boxJsJson.repo = "#lk{repo}"
            boxJsJson.script = `${scritpUrl}?raw=true`
            if (!this.isEmpty(info)) {
                for (let key of needAppendKeys) {
                    if (this.isEmpty(info[key])) {
                        break
                    }
                    // 处理传入的每项设置
                    if (key === 'settings') {
                        for (let i = 0; i < info[key].length; i++) {
                            let input = info[key][i]
                            for (let j = 0; j < boxJsJson.settings.length; j++) {
                                let def = boxJsJson.settings[j]
                                if (input.id === def.id) {
                                    // id相同,就使用外部传入的配置
                                    boxJsJson.settings.splice(j, 1)
                                }
                            }
                        }
                    }
                    boxJsJson[key] = boxJsJson[key].concat(info[key])
                    delete info[key]
                }
            }
            Object.assign(boxJsJson, info)
            this.fs = this.fs ? this.fs : require('fs')
            this.path = this.path ? this.path : require('path')
            const { curDirDataFilePath, rootDirDataFilePath, isCurDirDataFile, isRootDirDataFile } = this.checkPath(this.boxJsJsonFile)
            const jsondata = boxJsJson.s(null, '\t')
            if (isCurDirDataFile) {
                this.fs.writeFileSync(curDirDataFilePath, jsondata)
            } else if (isRootDirDataFile) {
                this.fs.writeFileSync(rootDirDataFilePath, jsondata)
            } else {
                this.fs.writeFileSync(curDirDataFilePath, jsondata)
            }

            let boxjsJson = this.fs.readFileSync(boxjsJsonPath).o()
            if (!(boxjsJson?.apps && Array.isArray(boxjsJson.apps))) {
                this.log(`⚠️请在boxjs订阅json文件中添加根属性: apps, 否则无法自动构建`)
                return
            }
            let apps = boxjsJson.apps
            let targetIdx = apps.indexOf(apps.filter((app) => {
                return app.id == boxJsJson.id
            })[0])
            if (targetIdx >= 0) {
                boxjsJson.apps[targetIdx] = boxJsJson
            } else {
                boxjsJson.apps.push(boxJsJson)
            }
            let ret = boxjsJson.s(null, 2)
            if (!this.isEmpty(param)) {
                for (const key in param) {
                    let val = param[key]
                    if (!val) {
                        switch (key) {
                            case 'author':
                                val = '@lowking'
                                break
                            case 'repo':
                                val = 'https://github.com/lowking/Scripts'
                                break
                            default:
                                continue
                        }
                    }
                    ret = ret.replaceAll(`#lk{${key}}`, val)
                }
            }
            const regex = /(?:#lk\{)(.+?)(?=\})/
            let m = regex.exec(ret)
            if (m !== null) {
                this.log(`⚠️生成BoxJs还有未配置的参数,请参考:\n${this.twoSpace}https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19\n${this.twoSpace}传入参数: `)
            }
            let loseParamSet = new Set()
            while ((m = regex.exec(ret)) !== null) {
                loseParamSet.add(m[1])
                ret = ret.replace(`#lk{${m[1]}}`, ``)
            }
            loseParamSet.forEach(p => console.log(`${this.twoSpace}${p}`))
            this.fs.writeFileSync(boxjsJsonPath, ret)
        }

        isJsonObject(obj) {
            return typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length
        }

        appendNotifyInfo(info, type) {
            if (type == 1) {
                this.notifyInfo = info
            } else {
                this.notifyInfo.push(info)
            }
        }

        prependNotifyInfo(info) {
            this.notifyInfo.splice(0, 0, info)
        }

        execFail() {
            this.execStatus = false
        }

        isRequest() {
            return typeof $request != "undefined"
        }

        isSurge() {
            return typeof $httpClient != "undefined"
        }

        isQuanX() {
            return typeof $task != "undefined"
        }

        isLoon() {
            return typeof $loon != "undefined"
        }

        isJSBox() {
            return typeof $app != "undefined" && typeof $http != "undefined"
        }

        isStash() {
            return 'undefined' !== typeof $environment && $environment['stash-version']
        }

        isNode() {
            return typeof require == "function" && !this.isJSBox()
        }

        sleep(ms) {
            this.sleepTotalMs += ms
            return new Promise((resolve) => setTimeout(resolve, ms))
        }

        randomSleep(minMs, maxMs) {
            return this.sleep(this.randomNumber(minMs, maxMs))
        }

        randomNumber(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min)
        }

        log(message) {
            if (this.isEnableLog) console.log(`${this.logSeparator}${message}`)
        }

        logErr(message) {
            this.execStatus = true
            if (this.isEnableLog) {
                let msg = ""
                if (!this.isEmpty(message.error)) {
                    msg = `${msg}\n${this.twoSpace}${message.error.s()}`
                }
                if (!this.isEmpty(message.message)) {
                    msg = `${msg}\n${this.twoSpace}${message.message.s()}`
                }
                msg = `${this.logSeparator}${this.name}执行异常:${this.twoSpace}${msg}`
                if (message) {
                    msg = `${msg}\n${this.twoSpace}${message.s()}`
                }
                console.log(msg)
            }
        }

        replaceUseMap(mapping, message) {
            for (let key in mapping) {
                if (!mapping.hasOwnProperty(key)) {
                    continue
                }
                message = message.replaceAll(key, mapping[key])
            }
            return message
        }

        msg(subtitle, message, openUrl, mediaUrl, copyText, disappearS) {
            if (!this.isRequest() && this.isNotifyOnlyFail && this.execStatus) {
                // * 开启了当且仅当执行失败的时候通知,并且执行成功了,这时候不通知
                return
            }
            if (this.isEmpty(message)) {
                if (Array.isArray(this.notifyInfo)) {
                    message = this.notifyInfo.join("\n")
                } else {
                    message = this.notifyInfo
                }
            }
            if (this.isEmpty(message)) {
                return
            }
            if (this.isEnableTgNotify) {
                this.log(`${this.name}Tg通知开始`)
                // 处理特殊字符
                const isMarkdown = this.tgNotifyUrl && this.tgNotifyUrl.indexOf("parse_mode=Markdown") != -1
                if (isMarkdown) {
                    message = this.replaceUseMap(this.preTgEscapeCharMapping, message)
                    let targetMapping = this.tgEscapeCharMapping
                    if (this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2") != -1) {
                        targetMapping = this.tgEscapeCharMappingV2
                    }
                    message = this.replaceUseMap(targetMapping, message)
                }
                message = `📌${this.name}\n${message}`
                if (isMarkdown) {
                    message = this.replaceUseMap(this.finalTgEscapeCharMapping, message)
                }
                let u = `${this.tgNotifyUrl}${encodeURIComponent(message)}`
                this.req.get({ url: u })
            } else {
                let options = {}
                const hasOpenUrl = !this.isEmpty(openUrl)
                const hasMediaUrl = !this.isEmpty(mediaUrl)
                const hasCopyText = !this.isEmpty(copyText)
                const hasAutoDismiss = disappearS > 0
                if (this.isSurge() || this.isLoon() || this.isStash()) {
                    if (hasOpenUrl) {
                        options["url"] = openUrl
                        options["action"] = "open-url"
                    }
                    if (hasCopyText) {
                        options["text"] = copyText
                        options["action"] = "clipboard"
                    }
                    if (this.isSurge() && hasAutoDismiss) {
                        options["auto-dismiss"] = disappearS
                    }
                    if (hasMediaUrl) {
                        options["media-url"] = mediaUrl
                    }
                    $notification.post(this.name, subtitle, message, options)
                } else if (this.isQuanX()) {
                    if (hasOpenUrl) options["open-url"] = openUrl
                    if (hasMediaUrl) options["media-url"] = mediaUrl
                    $notify(this.name, subtitle, message, options)
                } else if (this.isNode()) {
                    this.log("⭐️" + this.name + "\n" + subtitle + "\n" + message)
                } else if (this.isJSBox()) {
                    $push.schedule({
                        title: this.name,
                        body: subtitle ? subtitle + "\n" + message : message
                    })
                }
            }
        }

        getVal(key, defaultValue) {
            let value
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                value = $persistentStore.read(key)
            } else if (this.isQuanX()) {
                value = $prefs.valueForKey(key)
            } else if (this.isNode()) {
                this.data = this.loadData()
                value = process.env[key] || this.data[key]
            } else {
                value = (this.data && this.data[key]) || null
            }
            return !value ? defaultValue : value
        }

        updateBoxjsSessions(key, val) {
            // * 避免死循环
            if (key == this.boxjsSessionsKey) {
                return
            }
            const boxJsId = `${this.prefix}${this.id}`
            // 先从当前会话中获取boxjs的会话id
            let boxjsCurSession = this.getVal(this.boxjsCurSessionKey, "{}").o()
            if (!boxjsCurSession.hasOwnProperty(boxJsId)) {
                return
            }
            let curSessionId = boxjsCurSession[boxJsId]
            let boxjsSessions = this.getVal(this.boxjsSessionsKey, "[]").o()
            if (boxjsSessions.length == 0) {
                return
            }
            let curSessionDatas = []
            boxjsSessions.forEach((session) => {
                if (session.id == curSessionId) {
                    curSessionDatas = session.datas
                }
            })
            if (curSessionDatas.length == 0) {
                return
            }
            // 再把修改的数据更新到对应会话中
            let isExists = false
            curSessionDatas.forEach((kv) => {
                if (kv.key == key) {
                    kv.val = val
                    isExists = true
                }
            })
            // 如果订阅更新,新增的字段不存在会话中则添加
            if (!isExists) {
                curSessionDatas.push({
                    "key": key,
                    "val": val
                })
            }
            boxjsSessions.forEach((session) => {
                if (session.id == curSessionId) {
                    session.datas = curSessionDatas
                }
            })
            this.setVal(this.boxjsSessionsKey, boxjsSessions.s())
        }

        setVal(key, val) {
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                this.updateBoxjsSessions(key, val)
                return $persistentStore.write(val, key)
            } else if (this.isQuanX()) {
                this.updateBoxjsSessions(key, val)
                return $prefs.setValueForKey(val, key)
            } else if (this.isNode()) {
                this.data = this.loadData()
                this.data[key] = val
                this.writeData()
                return true
            } else {
                return (this.data && this.data[key]) || null
            }
        }

        loadData() {
            if (!this.isNode()) {
                return {}
            }
            this.fs = this.fs ? this.fs : require('fs')
            this.path = this.path ? this.path : require('path')
            const { curDirDataFilePath, rootDirDataFilePath, isCurDirDataFile, isRootDirDataFile } = this.checkPath(this.dataFile)
            if (isCurDirDataFile || isRootDirDataFile) {
                const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath
                return this.fs.readFileSync(datPath).o()
            } else {
                return {}
            }
        }

        writeData() {
            if (!this.isNode()) {
                return
            }
            this.fs = this.fs ? this.fs : require('fs')
            this.path = this.path ? this.path : require('path')
            const { curDirDataFilePath, rootDirDataFilePath, isCurDirDataFile, isRootDirDataFile } = this.checkPath(this.dataFile)
            const jsondata = this.data.s()
            if (isCurDirDataFile) {
                this.fs.writeFileSync(curDirDataFilePath, jsondata)
            } else if (isRootDirDataFile) {
                this.fs.writeFileSync(rootDirDataFilePath, jsondata)
            } else {
                this.fs.writeFileSync(curDirDataFilePath, jsondata)
            }
        }

        responseDataAdapter(data) {
            const tabString = `${this.twoSpace}${this.twoSpace}`
            let ret = ""
            Object.keys(data).forEach((key) => {
                let lines = data[key]?.s().split("\n")
                if (key == "output") {
                    lines = lines.slice(0, -2)
                }
                ret = `${ret}\n${tabString}${key}:\n${tabString}${this.twoSpace}${lines?.join(`\n${tabString}${this.twoSpace}`)}`
            })
            return ret
        }

        statusAdapter(response) {
            if (!response) {
                return response
            }
            response.status = response?.status || response?.statusCode
            delete response.statusCode
            return response
        }

        get(options, callback = () => {}) {
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                $httpClient.get(options, (error, response, body) => {
                    callback(error, this.statusAdapter(response), body)
                })
            } else if (this.isQuanX()) {
                if (typeof options == "string") options = {
                    url: options
                }
                options["method"] = "GET"
                $task.fetch(options).then(response => {
                    callback(null, this.statusAdapter(response), response.body)
                }, reason => callback(reason.error, null, null))
            } else if (this.isNode()) {
                this.node.request(options, (error, response, body) => {
                    callback(error, this.statusAdapter(response), body)
                })
            } else if (this.isJSBox()) {
                // ! not test yet
                if (typeof options == "string") options = {
                    url: options
                }
                options["header"] = options["headers"]
                options["handler"] = function (resp) {
                    let error = resp.error
                    if (error) error = resp.error.s()
                    let body = resp.data
                    if (typeof body == "object") body = resp.data.s()
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.get(options)
            }
        }

        post(options, callback = () => {}) {
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                $httpClient.post(options, (error, response, body) => {
                    callback(error, this.statusAdapter(response), body)
                })
            } else if (this.isQuanX()) {
                if (typeof options == "string") options = {
                    url: options
                }
                options["method"] = "POST"
                $task.fetch(options).then(response => {
                    callback(null, this.statusAdapter(response), response.body)
                }, reason => callback(reason.error, null, null))
            } else if (this.isNode()) {
                this.node.request.post(options, (error, response, body) => {
                    callback(error, this.statusAdapter(response), body)
                })
            } else if (this.isJSBox()) {
                // ! not test yet
                if (typeof options == "string") options = {
                    url: options
                }
                options["header"] = options["headers"]
                options["handler"] = function (resp) {
                    let error = resp.error
                    if (error) error = resp.error.s()
                    let body = resp.data
                    if (typeof body == "object") body = resp.data.s()
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.post(options)
            }
        }

        put(options, callback = () => {}) {
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                options.method = "PUT"
                $httpClient.put(options, (error, response, body) => {
                    callback(error, this.statusAdapter(response), body)
                })
            } else if (this.isQuanX()) {
                // ! not test yet
                if (typeof options == "string") options = {
                    url: options
                }
                options["method"] = "PUT"
                $task.fetch(options).then(response => {
                    callback(null, this.statusAdapter(response), response.body)
                }, reason => callback(reason.error, null, null))
            } else if (this.isNode()) {
                options.method = "PUT"
                this.node.request.put(options, (error, response, body) => {
                    callback(error, this.statusAdapter(response), body)
                })
            } else if (this.isJSBox()) {
                // ! not test yet
                if (typeof options == "string") options = {
                    url: options
                }
                options["header"] = options["headers"]
                options["handler"] = function (resp) {
                    let error = resp.error
                    if (error) error = resp.error.s()
                    let body = resp.data
                    if (typeof body == "object") body = resp.data.s()
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.post(options)
            }
        }

        sum(a, b) {
            let aa = Array.from(a, Number), bb = Array.from(b, Number), ret = [], c = 0,
                i = Math.max(a.length, b.length)
            while (i--) {
                c += (aa.pop() || 0) + (bb.pop() || 0)
                ret.unshift(c % 10)
                c = Math.floor(c / 10)
            }
            while (c) {
                ret.unshift(c % 10)
                c = Math.floor(c / 10)
            }
            return ret.join('')
        }

        costTime() {
            let info = `${this.name}, 执行完毕!`
            if (this.isNode() && this.isExecComm) {
                info = `指令【${this.comm[1]}】执行完毕!`
            }
            const endTime = new Date().getTime()
            const ms = endTime - this.startTime
            const costTime = ms / 1000
            const count = this.sum(this.execCount, "1")
            const total = this.sum(this.costTotalMs, ms.s())
            const average = ((Number(total) / Number(count)) / 1000).toFixed(4)
            info = `${info}\n${this.twoSpace}耗时【${costTime}】秒(含休眠${this.sleepTotalMs ? (this.sleepTotalMs / 1000).toFixed(4) : 0}秒)`
            info = `${info}\n${this.twoSpace}总共执行【${count}】次,平均耗时【${average}】秒`
            info = `${info}\n${this.twoSpace}ToolKit.`
            this.log(info)
            this.setVal(this.costTotalStringKey, `${total},${count}`.s())
        }

        done(value = {}) {
            this.costTime()
            if (this.isSurge() || this.isQuanX() || this.isLoon() || this.isStash()) {
                $done(value)
            }
        }

        getRequestUrl() {
            return $request.url
        }

        getResponseBody() {
            return $response.body
        }

        isMatch(reg) {
            return !!($request.method != 'OPTIONS' && this.getRequestUrl().match(reg))
        }

        isEmpty(obj) {
            return typeof obj == "undefined" || obj == null || obj.s() == "{}" || obj == "" || obj.s() == '""' || obj.s() == "null" || obj.s() == "undefined" || obj.length === 0
        }

        isNumeric(s) {
            return !isNaN(parseFloat(s)) && isFinite(s)
        }

        randomString(len, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890') {
            len = len || 32
            let maxPos = chars.length
            let pwd = ''
            for (let i = 0; i < len; i++) {
                pwd += chars.charAt(Math.floor(Math.random() * maxPos))
            }
            return pwd
        }

        /**
         * 自动补齐字符串
         * @param str 原始字符串
         * @param prefix 前缀
         * @param suffix 后缀
         * @param fill 补齐用字符
         * @param len 目标补齐长度,不包含前后缀
         * @param direction 方向: 0往后补齐
         * @param ifCode 是否打码
         * @param clen 打码长度
         * @param startIndex 起始坐标
         * @param cstr 打码字符
         * @returns {*}
         */
        autoComplete(str, prefix, suffix, fill, len, direction, ifCode, clen, startIndex, cstr) {
            str += ``
            if (str.length < len) {
                while (str.length < len) {
                    if (direction == 0) {
                        str += fill
                    } else {
                        str = fill + str
                    }
                }
            }
            if (ifCode) {
                let temp = ``
                for (let i = 0; i < clen; i++) {
                    temp += cstr
                }
                str = str.substring(0, startIndex) + temp + str.substring(clen + startIndex)
            }
            str = prefix + str + suffix
            return this.toDBC(str)
        }

        /**
         * @param str 源字符串 "#{code}, #{value}"
         * @param param 用于替换的数据,结构如下
         * @param prefix 前缀 "#{"
         * @param suffix 后缀 "}"
         * {
         *     "code": 1,
         *     "value": 2
         * }
         * 按上面的传入,输出为"1, 2"
         * 对应的#{code}用param里面code的值替换,#{value}也是
         * @returns {*|void|string}
         */
        customReplace(str, param, prefix, suffix) {
            try {
                if (this.isEmpty(prefix)) {
                    prefix = "#{"
                }
                if (this.isEmpty(suffix)) {
                    suffix = "}"
                }

                for (let i in param) {
                    str = str.replace(`${prefix}${i}${suffix}`, param[i])
                }
            } catch (e) {
                this.logErr(e)
            }

            return str
        }

        toDBC(txtstring) {
            let tmp = ""
            for (let i = 0; i < txtstring.length; i++) {
                if (txtstring.charCodeAt(i) == 32) {
                    tmp = tmp + String.fromCharCode(12288)
                } else if (txtstring.charCodeAt(i) < 127) {
                    tmp = tmp + String.fromCharCode(txtstring.charCodeAt(i) + 65248)
                }
            }
            return tmp
        }

        hash(str) {
            let h = 0,
                i,
                chr
            for (i = 0; i < str.length; i++) {
                chr = str.charCodeAt(i)
                h = (h << 5) - h + chr
                h |= 0 // Convert to 32bit integer
            }
            return String(h)
        }

        /**
         * 时间格式化
         * @param date
         * @param format y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
         * @return {*}
         */
        formatDate(date, format) {
            let o = {
                'M+': date.getMonth() + 1,
                'd+': date.getDate(),
                'H+': date.getHours(),
                'm+': date.getMinutes(),
                's+': date.getSeconds(),
                'q+': Math.floor((date.getMonth() + 3) / 3),
                'S': date.getMilliseconds()
            }
            if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
            for (let k in o)
                if (new RegExp('(' + k + ')').test(format))
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
            return format
        }

        /**
         * 从cookie串中获取属性值
         * @param ca
         * @param cname
         * @return {string}
         */
        getCookieProp(ca, cname) {
            const name = cname + "="
            ca = ca.split(";")
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i].trim()
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length).replace("\"", "").trim()
                }
            }
            return ""
        }

        /**
         * html转dom
         * @param htmlString
         * @return {HTMLElement}
         */
        parseHTML(htmlString) {
            let parser = new DOMParser();
            let document = parser.parseFromString(htmlString, 'text/html');
            return document.body;
        }
    })(scriptName, scriptId, options)
}
