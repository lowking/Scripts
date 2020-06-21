/*
微博超话签到-lowking-v1.3(原作者NavePnow，因为通知太多进行修改，同时重构了代码)

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
const signHeaderKey = 'lkWeiboSTSignHeaderKey'
const lk = nobyda()
const isEnableLog = !lk.getVal('lkIsEnableLogWeiboSTCookie') ? true : JSON.parse(lk.getVal('lkIsEnableLogWeiboSTCookie'))
const isEnableGetCookie = !lk.getVal('lkIsEnableGetCookieWeiboST') ? true : JSON.parse(lk.getVal('lkIsEnableGetCookieWeiboST'))
const myFollowUrl = `https://weibo.com/p/1005051760825157/myfollow?relate=interested&pids=plc_main&ajaxpagelet=1&ajaxpagelet_v6=1&__ref=%2F1760825157%2Ffollow%3Frightmod%3D1%26wvr%3D6&_t=FM_159231991868741erested__97_page`
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`
const userFollowSTKey = `lkUserFollowSTKey`
var superTalkList = []
var cookie

async function getInfo() {
    if ($request.headers['Cookie']) {
        var url = $request.url;
        var super_id = url.match(/id.*?(?=&loc)/)
        super_id = super_id[0].replace("id=", "")
        cookie = $request.headers['Cookie'];
        var super_cookie = lk.setValueForKey(signHeaderKey, cookie);
        if (!super_cookie) {
            lk.msg("写入微博超话Cookie失败！", "超话id: " + super_id, "请重试")
        } else {
            lk.msg("写入微博超话Cookie成功🎉", "超话id: " + super_id, "您可以手动禁用此脚本")
        }
        //拿到cookie之后获取关注到超话列表
        await getFollowList(1)
        //持久化
        lk.log(JSON.stringify(superTalkList))
        lk.setValueForKey(userFollowSTKey, JSON.stringify(superTalkList))
        lk.log(`获取关注超话${superTalkList.length}个`)
        lk.done()
    } else {
        lk.msg("写入微博超话Cookie失败！", "超话id: " + super_id, "请退出账号, 重复步骤")
    }
}

if (isEnableGetCookie) {
    getInfo()
} else {
    lk.done()
}

function getFollowList(page) {
    return new Promise((resolve, reject) => {
        let option = {
            url: myFollowUrl + (page > 1 ? `&Pl_Official_RelationInterested__97_page=${page}` : ``),
            headers: {
                cookie: cookie,
                "User-Agent": userAgent
            }
        }
        lk.log(JSON.stringify(option))
        lk.get(option, async (error, statusCode, body) => {
            try {
                // lk.log(body)
                let count = 0
                body.split(`<script>parent.FM.view({`).forEach((curStr) => {
                    if (curStr.indexOf(`关系列表模块`) != -1 && curStr.indexOf(`Pl_Official_RelationInterested`) != -1) {
                        // lk.log(`************************${curStr}`)
                        let listStr = curStr.split(`"html":`)[1].split(`"\n})</script>`)[0]
                        listStr.split(`<a href=\\"\\/p\\/`).forEach((curST, index) => {
                            if (index > 0) {
                                let superId = curST.split(`?`)[0]
                                let screenName = curST.split(`target=\\"_blank\\">`)[1].split(`<`)[0]
                                if (screenName.indexOf(`<img class=\\"W_face_radius\\"`) == -1 && !!screenName) {
                                    lk.log(`超话id：${superId}，超话名：${screenName}`);
                                    superTalkList.push([screenName, superId])
                                    count++
                                }
                            }
                        })
                    }
                })
                if (count >= 30) {
                    await getFollowList(++page)
                } else {
                    if (superTalkList.length <= 0) {
                        lk.msg(`获取关注超话列表失败❌`, ``, `请重试，或者把日志完整文件发给作者`);
                    } else {
                        lk.msg(`获取关注超话列表成功🎉`, ``, `请禁用获取cookie脚本`);
                    }
                }
                resolve()
            } catch (e) {
                lk.log(`//**********************************「\n${error}\n${JSON.stringify(statusCode)}\n${body}\n」**********************************/`)
                lk.msg(`获取关注的超话列表失败`, ``, `请重新获取，或者把日志完整文件发给作者`)
            }
        })
    })
}
function nobyda(){const t=Date.now();const e=typeof $request!="undefined";const n=typeof $httpClient!="undefined";const o=typeof $task!="undefined";const s=typeof $app!="undefined"&&typeof $http!="undefined";const r=typeof require=="function"&&!s;const i=(()=>{if(r){const t=require("request");return{request:t}}else{return null}})();const f=(t,e,i)=>{if(o)$notify(t,e,i);if(n)$notification.post(t,e,i);if(r)c(t+e+i);if(s)$push.schedule({title:t,body:e?e+"\n"+i:i})};const u=(t,e)=>{if(o)return $prefs.setValueForKey(e,t);if(n)return $persistentStore.write(e,t)};const l=t=>{if(o)return $prefs.valueForKey(t);if(n)return $persistentStore.read(t)};const d=t=>{if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t};const a=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n)$httpClient.get(t,(t,n,o)=>{e(t,d(n),o)});if(r){i.request(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.get(t)}};const p=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n){$httpClient.post(t,(t,n,o)=>{e(t,d(n),o)})}if(r){i.request.post(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.post(t)}};const c=t=>{if(isEnableLog)console.log(`\n██${t}`)};const y=()=>{const e=((Date.now()-t)/1e3).toFixed(2);return console.log(`\n██用时：${e}秒`)};const $=(t={})=>{if(o)e?$done(t):null;if(n)e?$done(t):$done()};return{isRequest:e,isJSBox:s,isNode:r,msg:f,setValueForKey:u,getVal:l,get:a,post:p,log:c,time:y,done:$}}