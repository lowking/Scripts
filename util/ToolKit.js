/**
 * 根据自己的习惯整合各个开发者而形成的工具包（@NobyDa, @chavyleung）
 * 兼容surge，quantumult x，loon，node环境
 * 并且加入一些好用的方法
 * 方法如下：
 *      isEmpty： 判断字符串是否是空（undefined，null，空串）
 *      getRequestUrl： 获取请求的url（目前仅支持surge和quanx）
 *      getResponseBody： 获取响应体（目前仅支持surge和quanx）
 *      boxJsJsonBuilder：构建最简默认boxjs配置json
 *      randomString： 生成随机字符串
 *      autoComplete： 自动补齐字符串
 *      customReplace： 自定义替换
 *      hash： 字符串做hash
 *
 * ⚠️当开启当且仅当执行失败的时候通知选项，请在执行失败的地方执行execFail()
 *
 * @param scriptName 脚本名，用于通知时候的标题
 * @param scriptId 每个脚本唯一的id，用于存储持久化的时候加入key
 * @param options 传入一些参数，目前参数如下；
 *                                      httpApi=ffff@3.3.3.18:6166（这个是默认值，本人surge调试脚本用，可自行修改）
 *                                      target_boxjs_json_path=/Users/lowking/Desktop/Scripts/lowking.boxjs.json（生成boxjs配置的目标文件路径）
 * @constructor
 */
function ToolKit(scriptName, scriptId, options) {
    return new (class {
        constructor(scriptName, scriptId, options) {
            this.tgEscapeCharMapping = {'&': '＆', '#': '＃'}
            this.userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`
            this.prefix = `lk`
            this.name = scriptName
            this.id = scriptId
            this.data = null
            this.dataFile = this.getRealPath(`${this.prefix}${this.id}.dat`)
            this.boxJsJsonFile = this.getRealPath(`${this.prefix}${this.id}.boxjs.json`)

            //surge http api等一些扩展参数
            this.options = options

            //命令行入参
            this.isExecComm = false

            //默认脚本开关
            this.isEnableLog = this.getVal(`${this.prefix}IsEnableLog${this.id}`)
            this.isEnableLog = this.isEmpty(this.isEnableLog) ? true : JSON.parse(this.isEnableLog)
            this.isNotifyOnlyFail = this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`)
            this.isNotifyOnlyFail = this.isEmpty(this.isNotifyOnlyFail) ? false : JSON.parse(this.isNotifyOnlyFail)

            //tg通知开关
            this.isEnableTgNotify = this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`)
            this.isEnableTgNotify = this.isEmpty(this.isEnableTgNotify) ? false : JSON.parse(this.isEnableTgNotify)
            this.tgNotifyUrl = this.getVal(`${this.prefix}TgNotifyUrl${this.id}`)
            this.isEnableTgNotify = this.isEnableTgNotify ? !this.isEmpty(this.tgNotifyUrl) : this.isEnableTgNotify

            //计时部分
            this.costTotalStringKey = `${this.prefix}CostTotalString${this.id}`
            this.costTotalString = this.getVal(this.costTotalStringKey)
            this.costTotalString = this.isEmpty(this.costTotalString) ? `0,0` : this.costTotalString.replace("\"", "")
            this.costTotalMs = this.costTotalString.split(",")[0]
            this.execCount = this.costTotalString.split(",")[1]
            this.costTotalMs = this.isEmpty(this.costTotalMs) ? 0 : parseInt(this.costTotalMs)
            this.execCount = this.isEmpty(this.execCount) ? 0 : parseInt(this.execCount)

            this.logSeparator = '\n██'
            this.now = new Date()
            this.startTime = this.now.getTime()
            this.node = (() => {
                if (this.isNode()) {
                    const request = require('request')
                    return ({request})
                } else {
                    return (null)
                }
            })()
            this.execStatus = true
            this.notifyInfo = []
            this.log(`${this.name}, 开始执行!`)
            this.execComm()
        }

        //当执行命令的目录不是脚本所在目录时，自动把文件路径改成指令传入的路径并返回完整文件路径
        getRealPath(fileName) {
            if (this.isNode()) {
                let targetPath = process.argv.slice(1, 2)[0].split("/")
                targetPath[targetPath.length - 1] = fileName

                return targetPath.join("/")
            }
            return fileName
        }

        async execComm() {
            //支持node命令，实现发送手机测试
            if (this.isNode()) {
                this.comm = process.argv.slice(1)
                let isHttpApiErr = false
                if (this.comm[1] == "p") {
                    this.isExecComm = true
                    //phone
                    this.log(`开始执行指令【${this.comm[1]}】=> 发送到手机测试脚本！`)
                    if (this.isEmpty(this.options) || this.isEmpty(this.options.httpApi)) {
                        this.log(`未设置options，使用默认值`)
                        //设置默认值
                        if (this.isEmpty(this.options)) {
                            this.options = {}
                        }
                        this.options.httpApi = `ffff@10.0.0.9:6166`
                    } else {
                        //判断格式
                        if (!/.*?@.*?:[0-9]+/.test(this.options.httpApi)) {
                            isHttpApiErr = true
                            this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`)
                            this.done()
                        }
                    }
                    if (!isHttpApiErr) {
                        this.callApi(this.comm[2])
                    }
                }
            }
        }

        callApi(timeout) {
            // 直接用接收到文件路径，解决在不同目录下都可以使用 node xxxx/xxx.js p 指令发送脚本给手机执行
            // let fname = this.getCallerFileNameAndLine().split(":")[0].replace("[", "")
            let fname = this.comm[0]
            this.log(`获取【${fname}】内容传给手机`)
            let scriptStr = ''
            this.fs = this.fs ? this.fs : require('fs')
            this.path = this.path ? this.path : require('path')
            const curDirDataFilePath = this.path.resolve(fname)
            const rootDirDataFilePath = this.path.resolve(process.cwd(), fname)
            const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
            const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
            if (isCurDirDataFile || isRootDirDataFile) {
                const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath
                try {
                    scriptStr = this.fs.readFileSync(datPath)
                } catch (e) {
                    scriptStr = ''
                }
            } else {
                scriptStr = ''
            }
            let options = {
                url: `http://${this.options.httpApi.split("@")[1]}/v1/scripting/evaluate`,
                headers: {
                    "X-Key": `${this.options.httpApi.split("@")[0]}`
                },
                body: {
                    "script_text": `${scriptStr}`,
                    "mock_type": "cron",
                    "timeout": (!this.isEmpty(timeout) && timeout > 5) ? timeout : 5
                },
                json: true
            }
            this.post(options, (_error, _response, _data) => {
                this.log(`已将脚本【${fname}】发给手机！`)
                this.done()
            })
        }

        getCallerFileNameAndLine() {
            let error
            try {
                throw Error('')
            } catch (err) {
                error = err
            }

            const stack = error.stack
            const stackArr = stack.split('\n')
            let callerLogIndex = 1

            if (callerLogIndex !== 0) {
                const callerStackLine = stackArr[callerLogIndex]
                this.path = this.path ? this.path : require('path')
                return `[${callerStackLine.substring(callerStackLine.lastIndexOf(this.path.sep) + 1, callerStackLine.lastIndexOf(':'))}]`
            } else {
                return '[-]'
            }
        }

        getFunName(fun) {
            var ret = fun.toString()
            ret = ret.substr('function '.length)
            ret = ret.substr(0, ret.indexOf('('))
            return ret
        }

        boxJsJsonBuilder(info, param) {
            if (this.isNode()) {
                let boxjsJsonPath = "/Users/lowking/Desktop/Scripts/lowking.boxjs.json"
                // 从传入参数param读取配置的boxjs的json文件路径
                if (param && param.hasOwnProperty("target_boxjs_json_path")) {
                    boxjsJsonPath = param["target_boxjs_json_path"]
                }
                if (!this.fs.existsSync(boxjsJsonPath)) {
                    return
                }
                if (!this.isJsonObject(info) || !this.isJsonObject(param)) {
                    this.log("构建BoxJsJson传入参数格式错误，请传入json对象")
                    return
                }
                this.log('using node')
                let needAppendKeys = ["settings", "keys"]
                const domain = 'https://raw.githubusercontent.com/Orz-3'
                let boxJsJson = {}
                let scritpUrl = '#lk{script_url}'
                if (param && param.hasOwnProperty('script_url')) {
                    scritpUrl = this.isEmpty(param['script_url']) ? "#lk{script_url}" : param['script_url']
                }
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
                        "desc": "Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="
                    }
                ]
                boxJsJson.author = "#lk{author}"
                boxJsJson.repo = "#lk{repo}"
                boxJsJson.script = `${scritpUrl}?raw=true`
                // 除了settings和keys追加，其他的都覆盖
                if (!this.isEmpty(info)) {
                    for (let i in needAppendKeys) {
                        let key = needAppendKeys[i]
                        if (!this.isEmpty(info[key])) {
                            // 处理传入的每项设置
                            if (key === 'settings') {
                                for (let i = 0; i < info[key].length; i++) {
                                    let input = info[key][i]
                                    for (let j = 0; j < boxJsJson.settings.length; j++) {
                                        let def = boxJsJson.settings[j]
                                        if (input.id === def.id) {
                                            // id相同，就使用外部传入的配置
                                            boxJsJson.settings.splice(j, 1)
                                        }
                                    }
                                }
                            }
                            boxJsJson[key] = boxJsJson[key].concat(info[key])
                        }
                        delete info[key]
                    }
                }
                Object.assign(boxJsJson, info)
                if (this.isNode()) {
                    this.fs = this.fs ? this.fs : require('fs')
                    this.path = this.path ? this.path : require('path')
                    const curDirDataFilePath = this.path.resolve(this.boxJsJsonFile)
                    const rootDirDataFilePath = this.path.resolve(process.cwd(), this.boxJsJsonFile)
                    const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
                    const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
                    const jsondata = JSON.stringify(boxJsJson, null, '\t')
                    if (isCurDirDataFile) {
                        this.fs.writeFileSync(curDirDataFilePath, jsondata)
                    } else if (isRootDirDataFile) {
                        this.fs.writeFileSync(rootDirDataFilePath, jsondata)
                    } else {
                        this.fs.writeFileSync(curDirDataFilePath, jsondata)
                    }
                    // 写到项目的boxjs订阅json中
                    let boxjsJson = JSON.parse(this.fs.readFileSync(boxjsJsonPath))
                    if (boxjsJson.hasOwnProperty("apps") && Array.isArray(boxjsJson["apps"]) && boxjsJson["apps"].length > 0) {
                        let apps = boxjsJson.apps
                        let targetIdx = apps.indexOf(apps.filter((app) => {
                            return app.id == boxJsJson.id
                        })[0])
                        if (targetIdx >= 0) {
                            boxjsJson.apps[targetIdx] = boxJsJson
                        } else {
                            boxjsJson.apps.push(boxJsJson)
                        }
                        let ret = JSON.stringify(boxjsJson, null, 2)
                        if (!this.isEmpty(param)) {
                            for (const key in param) {
                                let val = ''
                                if (param.hasOwnProperty(key)) {
                                    val = param[key]
                                } else if (key === 'author') {
                                    val = '@lowking'
                                } else if (key === 'repo') {
                                    val = 'https://github.com/lowking/Scripts'
                                }
                                ret = ret.replace(`#lk{${key}}`, val)
                            }
                        }
                        // 全部处理完毕检查是否有漏掉未配置的参数，进行提醒
                        const regex = /(?:#lk\{)(.+?)(?=\})/
                        let m = regex.exec(ret)
                        if (m !== null) {
                            this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L18传入参数：\n`)
                        }
                        let loseParamSet = new Set()
                        while ((m = regex.exec(ret)) !== null) {
                            loseParamSet.add(m[1])
                            ret = ret.replace(`#lk{${m[1]}}`, ``)
                        }
                        loseParamSet.forEach(p => {
                            console.log(`${p} `)
                        })
                        this.fs.writeFileSync(boxjsJsonPath, ret)
                    }
                }
            }
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

        sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time))
        }

        log(message) {
            if (this.isEnableLog) console.log(`${this.logSeparator}${message}`)
        }

        logErr(message) {
            this.execStatus = true
            if (this.isEnableLog) {
                console.log(`${this.logSeparator}${this.name}执行异常:`)
                console.log(message)
                console.log(`\n${message.message}`)
            }
        }

        msg(subtitle, message, openUrl, mediaUrl) {
            if (!this.isRequest() && this.isNotifyOnlyFail && this.execStatus) {
                //开启了当且仅当执行失败的时候通知，并且执行成功了，这时候不通知
            } else {
                if (this.isEmpty(message)) {
                    if (Array.isArray(this.notifyInfo)) {
                        message = this.notifyInfo.join("\n")
                    } else {
                        message = this.notifyInfo
                    }
                }
                if (!this.isEmpty(message)) {
                    if (this.isEnableTgNotify) {
                        this.log(`${this.name}Tg通知开始`)
                        //处理特殊字符
                        for (let key in this.tgEscapeCharMapping) {
                            if (!this.tgEscapeCharMapping.hasOwnProperty(key)) {
                                continue
                            }
                            message = message.replace(key, this.tgEscapeCharMapping[key])
                        }
                        this.get({
                            url: encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${message}`)
                        }, (_error, _statusCode, _body) => {
                            this.log(`Tg通知完毕`)
                        })
                    } else {
                        let options = {}
                        const hasOpenUrl = !this.isEmpty(openUrl)
                        const hasMediaUrl = !this.isEmpty(mediaUrl)

                        if (this.isQuanX()) {
                            if (hasOpenUrl) options["open-url"] = openUrl
                            if (hasMediaUrl) options["media-url"] = mediaUrl
                            $notify(this.name, subtitle, message, options)
                        }
                        if (this.isSurge() || this.isStash()) {
                            if (hasOpenUrl) options["url"] = openUrl
                            $notification.post(this.name, subtitle, message, options)
                        }
                        if (this.isNode()) this.log("⭐️" + this.name + "\n" + subtitle + "\n" + message)
                        if (this.isJSBox()) $push.schedule({
                            title: this.name,
                            body: subtitle ? subtitle + "\n" + message : message
                        })
                    }
                }
            }
        }

        getVal(key, defaultValue = "") {
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

        setVal(key, val) {
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                return $persistentStore.write(val, key)
            } else if (this.isQuanX()) {
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
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require('fs')
                this.path = this.path ? this.path : require('path')
                const curDirDataFilePath = this.path.resolve(this.dataFile)
                const rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile)
                const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
                const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
                if (isCurDirDataFile || isRootDirDataFile) {
                    const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath
                    try {
                        return JSON.parse(this.fs.readFileSync(datPath))
                    } catch (e) {
                        return {}
                    }
                } else return {}
            } else return {}
        }

        writeData() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require('fs')
                this.path = this.path ? this.path : require('path')
                const curDirDataFilePath = this.path.resolve(this.dataFile)
                const rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile)
                const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
                const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
                const jsondata = JSON.stringify(this.data)
                if (isCurDirDataFile) {
                    this.fs.writeFileSync(curDirDataFilePath, jsondata)
                } else if (isRootDirDataFile) {
                    this.fs.writeFileSync(rootDirDataFilePath, jsondata)
                } else {
                    this.fs.writeFileSync(curDirDataFilePath, jsondata)
                }
            }
        }

        adapterStatus(response) {
            if (response) {
                if (response.status) {
                    response["statusCode"] = response.status
                } else if (response.statusCode) {
                    response["status"] = response.statusCode
                }
            }
            return response
        }

        get(options, callback = () => {}) {
            if (this.isQuanX()) {
                if (typeof options == "string") options = {
                    url: options
                }
                options["method"] = "GET"
                $task.fetch(options).then(response => {
                    callback(null, this.adapterStatus(response), response.body)
                }, reason => callback(reason.error, null, null))
            }
            if (this.isSurge() || this.isLoon() || this.isStash()) $httpClient.get(options, (error, response, body) => {
                callback(error, this.adapterStatus(response), body)
            })
            if (this.isNode()) {
                this.node.request(options, (error, response, body) => {
                    callback(error, this.adapterStatus(response), body)
                })
            }
            if (this.isJSBox()) {
                if (typeof options == "string") options = {
                    url: options
                }
                options["header"] = options["headers"]
                options["handler"] = function (resp) {
                    let error = resp.error
                    if (error) error = JSON.stringify(resp.error)
                    let body = resp.data
                    if (typeof body == "object") body = JSON.stringify(resp.data)
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.get(options)
            }
        }

        post(options, callback = () => {}) {
            if (this.isQuanX()) {
                if (typeof options == "string") options = {
                    url: options
                }
                options["method"] = "POST"
                $task.fetch(options).then(response => {
                    callback(null, this.adapterStatus(response), response.body)
                }, reason => callback(reason.error, null, null))
            }
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                $httpClient.post(options, (error, response, body) => {
                    callback(error, this.adapterStatus(response), body)
                })
            }
            if (this.isNode()) {
                this.node.request.post(options, (error, response, body) => {
                    callback(error, this.adapterStatus(response), body)
                })
            }
            if (this.isJSBox()) {
                if (typeof options == "string") options = {
                    url: options
                }
                options["header"] = options["headers"]
                options["handler"] = function (resp) {
                    let error = resp.error
                    if (error) error = JSON.stringify(resp.error)
                    let body = resp.data
                    if (typeof body == "object") body = JSON.stringify(resp.data)
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.post(options)
            }
        }

        put(options, callback = () => {}) {
            if (this.isQuanX()) {
                // no test
                if (typeof options == "string") options = {
                    url: options
                }
                options["method"] = "PUT"
                $task.fetch(options).then(response => {
                    callback(null, this.adapterStatus(response), response.body)
                }, reason => callback(reason.error, null, null))
            }
            if (this.isSurge() || this.isLoon() || this.isStash()) {
                options.method = "PUT"
                $httpClient.put(options, (error, response, body) => {
                    callback(error, this.adapterStatus(response), body)
                })
            }
            if (this.isNode()) {
                options.method = "PUT"
                this.node.request.put(options, (error, response, body) => {
                    callback(error, this.adapterStatus(response), body)
                })
            }
            if (this.isJSBox()) {
                // no test
                if (typeof options == "string") options = {
                    url: options
                }
                options["header"] = options["headers"]
                options["handler"] = function (resp) {
                    let error = resp.error
                    if (error) error = JSON.stringify(resp.error)
                    let body = resp.data
                    if (typeof body == "object") body = JSON.stringify(resp.data)
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.post(options)
            }
        }

        costTime() {
            let info = `${this.name}执行完毕！`
            if (this.isNode() && this.isExecComm) {
                info = `指令【${this.comm[1]}】执行完毕！`
            }
            const endTime = new Date().getTime()
            const ms = endTime - this.startTime
            const costTime = ms / 1000
            this.execCount++
            this.costTotalMs += ms
            this.log(`${info}耗时【${costTime}】秒\n总共执行【${this.execCount}】次，平均耗时【${((this.costTotalMs / this.execCount) / 1000).toFixed(4)}】秒`)
            this.setVal(this.costTotalStringKey, JSON.stringify(`${this.costTotalMs},${this.execCount}`))
            // this.setVal(this.execCountKey, JSON.stringify(0))
            // this.setVal(this.costTotalMsKey, JSON.stringify(0))
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

        isGetCookie(reg) {
            return !!($request.method != 'OPTIONS' && this.getRequestUrl().match(reg))
        }

        isEmpty(obj) {
            return typeof obj == "undefined" || obj == null || obj == "" || obj == "null" || obj == "undefined" || obj.length === 0
        }

        randomString(len) {
            len = len || 32
            var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
            var maxPos = $chars.length
            var pwd = ''
            for (let i = 0; i < len; i++) {
                pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
            }
            return pwd
        }

        /**
         * 自动补齐字符串
         * @param str 原始字符串
         * @param prefix 前缀
         * @param suffix 后缀
         * @param fill 补齐用字符
         * @param len 目标补齐长度，不包含前后缀
         * @param direction 方向：0往后补齐
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
                for (var i = 0; i < clen; i++) {
                    temp += cstr
                }
                str = str.substring(0, startIndex) + temp + str.substring(clen + startIndex)
            }
            str = prefix + str + suffix
            return this.toDBC(str)
        }

        /**
         * @param str 源字符串 "#{code}, #{value}"
         * @param param 用于替换的数据，结构如下
         * @param prefix 前缀 "#{"
         * @param suffix 后缀 "}"
         * {
         *     "code": 1,
         *     "value": 2
         * }
         * 按上面的传入，输出为"1, 2"
         * 对应的#{code}用param里面code的值替换，#{value}也是
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
            var tmp = ""
            for (var i = 0; i < txtstring.length; i++) {
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
         * formatDate  y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
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
    })(scriptName, scriptId, options)
}
