/*
索尼俱乐部签到-lowking-v1.0
配置好之后打开https://www.sonystyle.com.cn/content/dam/sonystyle-club/index.html#/index2
登录之后点击签到获取cookie

[MITM]
hostname = www.sonystyle.com.cn

************************
Surge 4.2.0+ 脚本配置:
************************
[Script]
# > 索尼俱乐部签到
索尼俱乐部签到cookie = type=http-request,pattern=https:\/\/www.sonystyle.com.cn\/eSolverOmniChannel\/account\/signupPoints.do,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js
索尼俱乐部签到 = type=cron,cronexp="0 0 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js




************************
QuantumultX 脚本配置:
************************
[rewrite_local]
#索尼俱乐部签到cookie
https:\/\/www.sonystyle.com.cn\/eSolverOmniChannel\/account\/signupPoints.do url script-request-header https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js

[task_local]
0 0 0 * * ? https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js




************************
LOON 脚本配置:
************************
[Script]
http-request https:\/\/www.sonystyle.com.cn\/eSolverOmniChannel\/account\/signupPoints.do script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js, timeout=10, tag=索尼俱乐部签到cookie
cron "0 0 0 * * *" script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js, tag=索尼俱乐部签到

*/
const sonyClubTokenKey = 'lkSonyClubToken'
const lk = nobyda()
const isEnableLog = !lk.getVal('lkIsEnableLogSonyClub') ? true : JSON.parse(lk.getVal('lkIsEnableLogSonyClub'))
const signurlVal = `https://www.sonystyle.com.cn/eSolverOmniChannel/account/signupPoints.do?channel=WAP&access_token=`
const mainTitle = `索尼俱乐部签到`
var notifyInfo = ``
var sonyClubToken = !lk.getVal(sonyClubTokenKey) ? `` : JSON.parse(lk.getVal(sonyClubTokenKey))
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`

let isGetCookie = typeof $request !== 'undefined'

if (isGetCookie) {
    if (isEnableGetCookie) {
        getCookie()
    } else {
        lk.done()
    }
} else {
    all()
}

async function all() {
    await signIn() //签到
    await notify() //通知
}

function getCookie() {
    const url = $request.url
    if ($request && $request.method != 'OPTIONS' && url.match(/\/eSolverOmniChannel\/account\/signupPoints.do/)) {
        try {
            const token = url.split("access_token=")[1].split("&")[0]
            lk.log(token)
            if (!!token) {
                lk.setValueForKey(sonyClubTokenKey, token)
                lk.msg(mainTitle, ``, `获取cookie成功🎉`)
            }
        } catch (e) {
            lk.msg(mainTitle, ``, `获取cookie失败，请重试❌`)
        }
    }
    lk.done()
}

function signIn() {
    return new Promise(async (resolve, reject) => {
        try {
            let url = {
                url: `${signurlVal}${sonyClubToken}`,
                headers: {
                    "User-Agent": userAgent
                }
            }
            lk.log(`${JSON.stringify(url)}`)
            lk.post(url, (error, response, data) => {
                try {
                    lk.log(data)
                    if (data == undefined) {
                        notifyInfo += `签到失败❌请确认cookie是否获取`
                    } else {
                        const result = JSON.parse(data)
                        if (result.resultMsg[0].code == "00") {
                            notifyInfo += `连续签到${result.resultData.successiveSignupDays}天🎉\n本次签到获得【${result.resultData.signupRankingOfDay}】成长值，共【${result.resultData.totalPoints}】成长值`
                        } else {
                            notifyInfo += `签到失败❌\n${result.resultMsg[0].message}`
                        }
                    }
                } catch (ee) {
                    throw ee
                } finally {
                    resolve()
                }
            })
        } catch (e) {
            lk.log(`${mainTitle}异常：\n${e}`)
            lk.msg(mainTitle, ``, `签到异常，请带上日志联系作者❌`)
            resolve()
        }
    })
}

function notify() {
    return new Promise((resolve, reject) => {
        if(!!notifyInfo.trim()) {
            lk.msg(`${mainTitle}结果`, ``, `${notifyInfo}`)
        }
        lk.time()
        lk.done()
        resolve()
    })
}

function nobyda(){const e=Date.now();const t=typeof $request!="undefined";const n=typeof $httpClient!="undefined";const o=typeof $task!="undefined";const r=typeof $loon!="undefined";const s=typeof $app!="undefined"&&typeof $http!="undefined";const i=typeof require=="function"&&!s;const f=(()=>{if(i){const e=require("request");return{request:e}}else{return null}})();const u=()=>{if(o)return $resource.link;if(n)return $request.url;return""};const l=()=>{if(o)return $resource.content;if(n)return $response.body;return""};const d=(e,t,r)=>{if(o)$notify(e,t,r);if(n)$notification.post(e,t,r);if(i)g(e+t+r);if(s)$push.schedule({title:e,body:t?t+"\n"+r:r})};const c=(e,t)=>{if(o)return $prefs.setValueForKey(t,e);if(n)return $persistentStore.write(t,e)};const a=e=>{if(o)return $prefs.valueForKey(e);if(n)return $persistentStore.read(e)};const p=e=>{if(e){if(e.status){e["statusCode"]=e.status}else if(e.statusCode){e["status"]=e.statusCode}}return e};const y=(e,t)=>{if(o){if(typeof e=="string")e={url:e};e["method"]="GET";$task.fetch(e).then(e=>{t(null,p(e),e.body)},e=>t(e.error,null,null))}if(n)$httpClient.get(e,(e,n,o)=>{t(e,p(n),o)});if(i){f.request(e,(e,n,o)=>{t(e,p(n),o)})}if(s){if(typeof e=="string")e={url:e};e["header"]=e["headers"];e["handler"]=function(e){let n=e.error;if(n)n=JSON.stringify(e.error);let o=e.data;if(typeof o=="object")o=JSON.stringify(e.data);t(n,p(e.response),o)};$http.get(e)}};const $=(e,t)=>{if(o){if(typeof e=="string")e={url:e};e["method"]="POST";$task.fetch(e).then(e=>{t(null,p(e),e.body)},e=>t(e.error,null,null))}if(n){$httpClient.post(e,(e,n,o)=>{t(e,p(n),o)})}if(i){f.request.post(e,(e,n,o)=>{t(e,p(n),o)})}if(s){if(typeof e=="string")e={url:e};e["header"]=e["headers"];e["handler"]=function(e){let n=e.error;if(n)n=JSON.stringify(e.error);let o=e.data;if(typeof o=="object")o=JSON.stringify(e.data);t(n,p(e.response),o)};$http.post(e)}};const g=e=>{if(isEnableLog)console.log(`\n██${e}`)};const h=()=>{const t=((Date.now()-e)/1e3).toFixed(2);return console.log(`\n██用时：${t}秒`)};const b=e=>{let r=`body`;if(t){if(o)r=`content`;if(n)r=`body`}let s={};s[r]=e;if(o)t?$done(s):null;if(n)t?$done(s):$done();if(i)g(JSON.stringify(s))};return{isRequest:t,isJSBox:s,isSurge:n,isQuanX:o,isLoon:r,isNode:i,getRequestUrl:u,getResponseBody:l,msg:d,setValueForKey:c,getVal:a,get:y,post:$,log:g,time:h,done:b}}