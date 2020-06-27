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
https:\/\/weibo\.com\/p\/aj\/general\/button\?ajwvr=6&api=http:\/\/i\.huati\.weibo\.com\/aj\/super\/checkin url script-request-header https://raw.githubusercontent.com/lowking/Scripts/master/weibo/weiboSTCookie.js
0 0 0,1 * * ? https://raw.githubusercontent.com/lowking/Scripts/master/weibo/weiboST.js
#超话页面强制用pc模式打开
^https?://weibo\.com/p/[0-9] url request-header (\r\n)User-Agent:.+(\r\n) request-header $1User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15

[mitm] 
hostname= weibo.com
*/
const signHeaderKey = 'lkWeiboSTSignHeaderKey'
const lk = nobyda()
const isEnableLog = !lk.getVal('lkIsEnableLogWeiboST') ? true : JSON.parse(lk.getVal('lkIsEnableLogWeiboST'))
const isClearCookie = !lk.getVal('lkIsClearCookie') ? false : JSON.parse(lk.getVal('lkIsClearCookie'))
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`
const mainTitle = `微博超话`
const userFollowSTKey = `lkUserFollowSTKey`
var notifyInfo = ``
var accounts = !lk.getVal(userFollowSTKey) ? [
        ["女流", "10080850b1c3b64e5545118a102f555513c8e2"],
        ["VVebo", "100808ea6caf9419bec340a20efc3c6aa50b65"],
        ["雀", "1008082ff97aa6fcfa3e39c3ef65fa51f0a027"],
        ["超级小桀", "10080883321dbae3ada25e5c406fccd3aaadd5"],
        ["动森", "100808a6c64b07163fe20e1a35fee1538280ed"]
    ] : JSON.parse(lk.getVal(userFollowSTKey))

async function all() {
    let cookie = lk.getVal(signHeaderKey)
    //校验cookie
    lk.log(cookie)
    lk.log(lk.getVal(userFollowSTKey))
    if (!cookie || isClearCookie || !userFollowSTKey) {
        lk.setValueForKey(signHeaderKey, ``)
        lk.msg(mainTitle, ``, isClearCookie ? `手动清除cookie` : `未获取到cookie或关注列表，请重新获取❌`)
        lk.done()
        return false
    }
    await signIn(); //签到
    await notify() //通知
}

all()

function signIn() {
    return new Promise(async (resolve, reject) => {
        for (var i in accounts) {
            let name = accounts[i][0]
            let super_id = accounts[i][1]
            await superTalkSignIn(i, name, super_id)
        }
        resolve()
    })
}

function superTalkSignIn(index, name, super_id) {
    return new Promise((resolve, reject) => {
        let super_url = {
            url: "https://weibo.com/p/aj/general/button?ajwvr=6&api=http://i.huati.weibo.com/aj/super/checkin&texta=%E7%AD%BE%E5%88%B0&textb=%E5%B7%B2%E7%AD%BE%E5%88%B0&status=0&id=" + super_id + "&location=page_100808_super_index&timezone=GMT+0800&lang=zh-cn&plat=MacIntel&ua=Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_15)%20AppleWebKit/605.1.15%20(KHTML,%20like%20Gecko)%20Version/13.0.4%20Safari/605.1.15&screen=375*812&__rnd=1576850070506",
            headers: {
                Cookie: lk.getVal(signHeaderKey),
                "User-Agent": userAgent
            }
        }
        lk.get(super_url, (error, response, data) => {
            lk.log(`\n${JSON.stringify(data)}`);
            try {
                if (error) {
                    notifyInfo += `【${name}】超话签到错误！-${error}`
                } else {
                    if (index > 0) {
                        notifyInfo += `\n`
                    }
                    var obj = JSON.parse(data);
                    var code = obj.code;
                    var msg = obj.msg;
                    if (code == 100003) { // 行为异常，需要重新验证
                        notifyInfo += `【${name}】超话签到❕${msg}${obj.data.location}`
                    } else if (code == 100000) {
                        tipMessage = obj.data.tipMessage;
                        alert_title = obj.data.alert_title;
                        alert_subtitle = obj.data.alert_subtitle;
                        notifyInfo += `【${name}】超话签到成功🎉\n${alert_title}:${alert_subtitle}`
                    } else if (code == 382004) {
                        msg = msg.replace("(382004)", "")
                        notifyInfo += `【${name}】超话${msg} 🎉`
                    } else {
                        notifyInfo += `【${name}】超话签到${msg}`
                    }
                }
            } catch (e) {
                lk.log(`超话签到异常：${e}`)
                lk.msg(mainTitle, ``, `签到失败，请重新获取cookie！`)
            } finally {
                resolve()
            }
        })
    })
}

function notify() {
    return new Promise((resolve, reject) => {
        lk.msg(`微博超话签到结果`, ``, `${notifyInfo}`)
        lk.done()
        resolve()
    })
}
function nobyda(){const t=Date.now();const e=typeof $request!="undefined";const n=typeof $httpClient!="undefined";const o=typeof $task!="undefined";const s=typeof $app!="undefined"&&typeof $http!="undefined";const r=typeof require=="function"&&!s;const i=(()=>{if(r){const t=require("request");return{request:t}}else{return null}})();const f=(t,e,i)=>{if(o)$notify(t,e,i);if(n)$notification.post(t,e,i);if(r)c(t+e+i);if(s)$push.schedule({title:t,body:e?e+"\n"+i:i})};const u=(t,e)=>{if(o)return $prefs.setValueForKey(e,t);if(n)return $persistentStore.write(e,t)};const l=t=>{if(o)return $prefs.valueForKey(t);if(n)return $persistentStore.read(t)};const d=t=>{if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t};const a=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n)$httpClient.get(t,(t,n,o)=>{e(t,d(n),o)});if(r){i.request(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.get(t)}};const p=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n){$httpClient.post(t,(t,n,o)=>{e(t,d(n),o)})}if(r){i.request.post(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.post(t)}};const c=t=>{if(isEnableLog)console.log(`\n██${t}`)};const y=()=>{const e=((Date.now()-t)/1e3).toFixed(2);return console.log(`\n██用时：${e}秒`)};const $=(t={})=>{if(o)e?$done(t):null;if(n)e?$done(t):$done()};return{isRequest:e,isJSBox:s,isNode:r,msg:f,setValueForKey:u,getVal:l,get:a,post:p,log:c,time:y,done:$}}