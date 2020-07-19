/**
 * 根据自己的习惯整合各个开发者而形成的工具包（@NobyDa, @chavyleung）
 * 兼容surge，quantumult x，loon，node环境
 * 并且加入一些好用的方法
 * 方法如下：
 *      isEmpty： 判断字符串是否是空（undefined，null，空串）
 *      getRequestUrl： 获取请求的url（目前仅支持surge和quanx）
 *      getResponseBody： 获取响应体（目前仅支持surge和quanx）
 *      boxJsJsonBuilder：构建最简默认boxjs配置json
 *
 * ⚠️当开启当且仅当执行失败的时候通知选项，请在执行失败的地方执行execFail()
 *
 * @param scriptName 脚本名，用于通知时候的标题
 * @param scriptId 每个脚本唯一的id，用于存储持久化的时候加入key
 * @constructor
 */
function ToolKit(scriptName, scriptId) {
    return new (class {
        constructor(scriptName, scriptId) {
            this.prefix = `lk`
            this.name = scriptName
            this.id = scriptId
            this.data = null
            this.dataFile = `${this.prefix}${this.id}.dat`
            this.boxJsJsonFile = `${this.prefix}${this.id}.boxjs.json`
            this.isEnableLog = this.getVal(`${this.prefix}IsEnableLog${this.id}`)
            this.isEnableLog = this.isEmpty(this.isEnableLog) ? true : JSON.parse(this.isEnableLog)
            this.isNotifyOnlyFail = this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`)
            this.isNotifyOnlyFail = this.isEmpty(this.isNotifyOnlyFail) ? false : JSON.parse(this.isNotifyOnlyFail)
            this.logSeparator = '\n██'
            this.startTime = new Date().getTime()
            this.node = (() => {
                if (this.isNode()) {
                    const request = require('request');
                    return ({request})
                } else {
                    return (null)
                }
            })()
            this.execStatus = true
            this.notifyInfo = []
            this.log(`${this.name}, 开始执行!`)
        }

        boxJsJsonBuilder(info) {
            let needAppendKeys = ["keys", "settings"]
            const domain = 'https://raw.githubusercontent.com/Orz-3'
            let boxJsJson = {}
            boxJsJson.id = `${this.prefix}${this.id}`
            boxJsJson.name = this.name
            boxJsJson.icons = [`${domain}/mini/master/${this.id.toLocaleLowerCase()}.png`,`${domain}/task/master/${this.id.toLocaleLowerCase()}.png`]
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
                }
            ]
            boxJsJson.author = "@lowking"
            boxJsJson.repo = "https://github.com/lowking/Scripts"
            //除了settings和keys追加，其他的都覆盖
            for (let i in needAppendKeys) {
                let key = needAppendKeys[i]
                if (!this.isEmpty(info[key])) {
                    boxJsJson[key] = boxJsJson[key].concat(info[key]);
                }
                delete info[key]
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
            }
        }

        appendNotifyInfo(info, type) {
            if (type == 1) {
                this.notifyInfo = info
            } else {
                this.notifyInfo.push(info)
            }
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

        isNode() {
            return typeof require == "function" && !this.isJSBox()
        }

        sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time))
        }

        log(message) {
            if (this.isEnableLog) console.log(`${this.logSeparator}${message}`)
        }

        msg(subtitle, message) {
            if (this.isNotifyOnlyFail && this.execStatus) {
                //开启了当且仅当执行失败的时候通知，并且执行成功了，这时候不通知
            }else{
                if (this.isEmpty(message)) {
                    if (Array.isArray(this.notifyInfo)) {
                        message = this.notifyInfo.join("\n");
                    } else {
                        message = this.notifyInfo
                    }
                }
                if (this.isQuanX()) $notify(this.name, subtitle, message);
                if (this.isSurge()) $notification.post(this.name, subtitle, message)
                if (this.isNode()) this.log("⭐️" + this.name + subtitle + message)
                if (this.isJSBox()) $push.schedule({
                    title: this.name,
                    body: subtitle ? subtitle + "\n" + message : message
                })
            }
        }

        getVal(key) {
            if (this.isSurge() || this.isLoon()) {
                return $persistentStore.read(key)
            } else if (this.isQuanX()) {
                return $prefs.valueForKey(key)
            } else if (this.isNode()) {
                this.data = this.loadData()
                return this.data[key]
            } else {
                return (this.data && this.data[key]) || null
            }
        }

        setVal(key, val) {
            if (this.isSurge() || this.isLoon()) {
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
            if (this.isSurge()) $httpClient.get(options, (error, response, body) => {
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
                    let error = resp.error;
                    if (error) error = JSON.stringify(resp.error)
                    let body = resp.data;
                    if (typeof body == "object") body = JSON.stringify(resp.data);
                    callback(error, this.adapterStatus(resp.response), body)
                };
                $http.get(options);
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
            if (this.isSurge()) {
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
                    let error = resp.error;
                    if (error) error = JSON.stringify(resp.error)
                    let body = resp.data;
                    if (typeof body == "object") body = JSON.stringify(resp.data)
                    callback(error, this.adapterStatus(resp.response), body)
                }
                $http.post(options);
            }
        }

        done(value) {
            const endTime = new Date().getTime()
            const costTime = (endTime - this.startTime) / 1000
            this.log(`${this.name}执行完毕！耗时【${costTime}】秒`)
            let key = `body`
            if (this.isRequest()) {
                if (this.isQuanX()) key = `content`
                if (this.isSurge()) key = `body`
            }
            let obj = {}
            obj[key] = value
            if (this.isQuanX()) this.isRequest() ? $done(obj) : null
            if (this.isSurge()) this.isRequest() ? $done(obj) : $done()
            if (this.isNode()) this.log(JSON.stringify(obj))
        }

        getRequestUrl() {
            if (this.isQuanX()) return $resource.link
            if (this.isSurge()) return $request.url
            return ""
        }

        getResponseBody() {
            if (this.isQuanX()) return $resource.content
            if (this.isSurge()) return $response.body
            return ""
        }

        isEmpty(obj) {
            if(typeof obj == "undefined" || obj == null || obj == ""){
                return true;
            }else{
                return false;
            }
        }
    })(scriptName, scriptId)
}
