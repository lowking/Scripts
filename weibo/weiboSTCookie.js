/*
微博超话签到-lowking-v1.2(原作者NavePnow，因为通知太多进行修改，同时重构了代码)

⚠️注：获取完cookie记得把脚本禁用

************************
Surge 4.2.0+ 脚本配置:
************************

[Script]
# > 微博超话签到
微博超话获取cookie = type=http-request,pattern=https:\/\/weibo\.com\/p\/aj\/general\/button\?ajwvr=6&api=http:\/\/i\.huati\.weibo\.com\/aj\/super\/checkin,script-path=weiboSTCookie.js
微博超话签到 = type=cron,cronexp="0 0 0,1 * * ?",wake-system=1,script-path=weiboST.js

[Header Rewrite]
#超话页面强制用pc模式打开
^https?://weibo\.com/p/[0-9] header-replace User-Agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15"

[mitm]
hostname = weibo.com

************************
QuantumultX 本地脚本配置:
************************

[rewrite_local]
#微博超话签到
https:\/\/weibo\.com\/p\/aj\/general\/button\?ajwvr=6&api=http:\/\/i\.huati\.weibo\.com\/aj\/super\/checkin url script-request-header weiboSTCookie.js
0 0 0,1 * * ? weiboST.js
#超话页面强制用pc模式打开
^https?://weibo\.com/p/[0-9] url request-header (\r\n)User-Agent:.+(\r\n) request-header $1User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15

[mitm]
hostname= weibo.com
*/
const isEnableLog = true
const signHeaderKey = 'lkWeiboSTSignHeaderKey'
const lk = nobyda()
const myFollowUrl = `https://weibo.com/p/1005051760825157/myfollow?relate=interested&pids=plc_main&ajaxpagelet=1&ajaxpagelet_v6=1&__ref=%2F1760825157%2Ffollow%3Frightmod%3D1%26wvr%3D6&_t=FM_159231991868741`
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`
const userFollowSTKey = `lkUserFollowSTKey`

if ($request.headers['Cookie']) {
    var url = $request.url;
    var super_id = url.match(/id.*?(?=&loc)/)
    super_id = super_id[0].replace("id=", "")
    var cookie = $request.headers['Cookie'];
    var super_cookie = lk.setValueForKey(signHeaderKey, cookie);
    if (!super_cookie) {
        lk.msg("写入微博超话Cookie失败！", "超话id: " + super_id, "请重试")
    } else {
        lk.msg("写入微博超话Cookie成功🎉", "超话id: " + super_id, "您可以手动禁用此脚本")
    }
    //拿到cookie之后获取关注到超话列表
    lk.get({
        url: myFollowUrl,
        headers: {
            cookie: cookie,
            "User-Agent": userAgent
        }
    }, (error, statusCode, body) => {
        try {
            lk.log(cookie)
            let superTalkList = []
            body.split(`<script>parent.FM.view({`).forEach((curStr) => {
                if (curStr.indexOf(`关系列表模块`) != -1 && curStr.indexOf(`Pl_Official_RelationInterested`) != -1) {
                    lk.log(`************************${curStr}`)
                    let listStr = curStr.split(`"html":`)[1].split(`"\n})</script>`)[0]
                    // console.log(listStr)
                    listStr.split(`<a href=\\"\\/p\\/`).forEach((curST, index) => {
                        if (index > 0) {
                            let superId = curST.split(`?`)[0]
                            let screenName = curST.split(`target=\\"_blank\\">`)[1].split(`<`)[0]
                            if (screenName.indexOf(`<img class=\\"W_face_radius\\"`) == -1 && !!screenName) {
                                lk.log(`超话id：${superId}，超话名：${screenName}`);
                                superTalkList.push([screenName, superId])
                            }
                        }
                    })
                }
            })
            //持久化
            lk.log(JSON.stringify(superTalkList))
            lk.setValueForKey(userFollowSTKey, JSON.stringify(superTalkList))
            if (superTalkList.length <= 0) {
                lk.msg(`获取关注超话列表失败❌`, ``, `请重试，或者把日志完整文件发给作者`);
            } else {
                lk.msg(`获取关注超话列表成功🎉`, ``, `请禁用获取cookie脚本`);
            }
        } catch (e) {
            lk.log(`//**********************************「\n${error}\n${statusCode}\n${body}\n」**********************************/`)
            lk.msg(`获取关注的超话列表失败`, ``, `请重新获取，或者把日志完整文件发给作者`)
        }
    })
} else {
    lk.msg("写入微博超话Cookie失败！", "超话id: " + super_id, "请退出账号, 重复步骤")
}
lk.done()

function nobyda() {
    const start = Date.now()
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    const isJSBox = typeof $app != "undefined" && typeof $http != "undefined"
    const isNode = typeof require == "function" && !isJSBox;
    const node = (() => {
        if (isNode) {
            const request = require('request');
            return ({
                request
            })
        } else {
            return (null)
        }
    })()
    const msg = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message)
        if (isSurge) $notification.post(title, subtitle, message)
        if (isNode) log(title + subtitle + message)
        if (isJSBox) $push.schedule({
            title: title,
            body: subtitle ? subtitle + "\n" + message : message
        })
    }
    const setValueForKey = (key, value) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
    }
    const getVal = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
    }
    const adapterStatus = (response) => {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else if (response.statusCode) {
                response["status"] = response.statusCode
            }
        }
        return response
    }
    const get = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "GET"
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.get(options, (error, response, body) => {
            callback(error, adapterStatus(response), body)
        })
        if (isNode) {
            node.request(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isJSBox) {
            if (typeof options == "string") options = {
                url: options
            }
            options["header"] = options["headers"]
            options["handler"] = function (resp) {
                let error = resp.error;
                if (error) error = JSON.stringify(resp.error)
                let body = resp.data;
                if (typeof body == "object") body = JSON.stringify(resp.data);
                callback(error, adapterStatus(resp.response), body)
            };
            $http.get(options);
        }
    }
    const post = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "POST"
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) {
            $httpClient.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isNode) {
            node.request.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isJSBox) {
            if (typeof options == "string") options = {
                url: options
            }
            options["header"] = options["headers"]
            options["handler"] = function (resp) {
                let error = resp.error;
                if (error) error = JSON.stringify(resp.error)
                let body = resp.data;
                if (typeof body == "object") body = JSON.stringify(resp.data)
                callback(error, adapterStatus(resp.response), body)
            }
            $http.post(options);
        }
    }
    const log = (message) => {
        if (isEnableLog) console.log(`\n██${message}`)
    }
    const time = () => {
        const end = ((Date.now() - start) / 1000).toFixed(2)
        return console.log('\n签到用时: ' + end + ' 秒')
    }
    const done = (value = {}) => {
        if (isQuanX) isRequest ? $done(value) : null
        if (isSurge) isRequest ? $done(value) : $done()
    }
    return {
        isRequest,
        isJSBox,
        isNode,
        msg,
        setValueForKey,
        getVal,
        get,
        post,
        log,
        time,
        done
    }
}