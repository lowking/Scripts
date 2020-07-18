/*
索尼俱乐部签到-lowking-v1.2

⚠️v1.2之后需要订阅BoxJs之后填写帐号密码

************************
Surge 4.2.0+ 脚本配置:
************************
[Script]
# > 索尼俱乐部签到
索尼俱乐部签到 = type=cron,cronexp="0 0 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js




************************
QuantumultX 脚本配置:
************************
[task_local]
0 0 0 * * ? https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js




************************
LOON 脚本配置:
************************
[Script]
cron "0 0 0 * * *" script-path=https://raw.githubusercontent.com/lowking/Scripts/master/sony/sonyClub.js, tag=索尼俱乐部签到

*/
const sonyClubTokenKey = 'lkSonyClubToken'
const lk = nobyda()
const isEnableLog = !lk.getVal('lkIsEnableLogSonyClub') ? true : JSON.parse(lk.getVal('lkIsEnableLogSonyClub'))
const signurlVal = `https://www.sonystyle.com.cn/eSolverOmniChannel/account/signupPoints.do?channel=WAP&access_token=`
const mainTitle = `索尼俱乐部签到`
var notifyInfo = ``
var sonyClubToken = !lk.getVal(sonyClubTokenKey) ? `` : lk.getVal(sonyClubTokenKey)
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`

all()

async function all() {
    await signIn() //签到
    await notify() //通知
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
            lk.post(url, async (error, response, data) => {
                try {
                    lk.log(data)
                    if (data == undefined) {
                        lk.log(`进入自动登录`)
                        // notifyInfo += `签到失败❌请确认cookie是否获取`
                        // 不通知直接登录获取token
                        if (loginCount > 3) {
                            notifyInfo += `登录尝试3次，均失败❌请确认帐号密码是否正确！`
                        }else{
                            await loginSonyClub()
                        }
                    } else {
                        const result = JSON.parse(data)
                        if (result.resultMsg[0].code == "00") {
                            notifyInfo += `连续签到${result.resultData.successiveSignupDays}天🎉\n本次签到获得【${result.resultData.signupRankingOfDay}】成长值，共【${result.resultData.totalPoints}】成长值`
                        } else if (result.resultMsg[0].code == "99") {
                            notifyInfo += `重复签到🔁`
                        } else if (result.resultMsg[0].code == "98") {
                            if (loginCount > 3) {
                                notifyInfo += `登录尝试3次，均失败❌请确认帐号密码是否正确！`
                            }else{
                                await loginSonyClub()
                            }
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
            return resolve()
        }
    })
}

var loginCount = 0
async function loginSonyClub() {
    ++loginCount
    return new Promise(async (resolve, reject) => {
        lk.log(`第${loginCount}次尝试登录`)
        let loginId = lk.getVal("lkSonyClubLoginId")
        let pwd = lk.getVal("lkSonyClubPassword")
        if (lk.isEmpty(loginId) || lk.isEmpty(pwd)) {
            notifyInfo += `请到BoxJs填写帐号密码⚠️`
            return resolve()
        }
        let loginUrl = {
            url: `https://www.sonystyle.com.cn/eSolverOmniChannel/account/login.do`,
            headers: {
                "User-Agent": userAgent,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "channel": "WAP",
                "loginID": loginId,
                "password": pwd
            })
        };
        try {
            lk.log(JSON.stringify(loginUrl))
            lk.post(loginUrl, async (error, response, data) => {
                try {
                    lk.log(data)
                    if (data == undefined) {
                        if (loginCount > 3) {
                            notifyInfo += `登录尝试3次，均失败❌请确认帐号密码是否正确！`
                            return resolve()
                        } else {
                            await loginSonyClub()
                        }
                    } else {
                        const result = JSON.parse(data)
                        if (result.resultMsg[0].code == "00") {
                            //登录成功，调用签到
                            let accessToken = result.resultData["access_token"]
                            lk.log(`登录成功，token：${accessToken}`)
                            lk.setValueForKey(sonyClubTokenKey, accessToken)
                            sonyClubToken = accessToken
                            await signIn()
                        } else {
                            notifyInfo += `登录失败❌\n${result.resultMsg[0].message}`
                            return resolve()
                        }
                    }
                } finally {
                    resolve()
                }
            })
        } catch (e) {
            throw e
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
        return resolve()
    })
}

function nobyda(){const e=Date.now();const t=typeof $request!="undefined";const n=typeof $httpClient!="undefined";const o=typeof $task!="undefined";const r=typeof $loon!="undefined";const s=typeof $app!="undefined"&&typeof $http!="undefined";const i=typeof require=="function"&&!s;const f=(()=>{if(i){const e=require("request");return{request:e}}else{return null}})();const u=()=>{if(o)return $resource.link;if(n)return $request.url;return""};const l=()=>{if(o)return $resource.content;if(n)return $response.body;return""};const d=(e,t,r)=>{if(o)$notify(e,t,r);if(n)$notification.post(e,t,r);if(i)g(e+t+r);if(s)$push.schedule({title:e,body:t?t+"\n"+r:r})};const c=(e,t)=>{if(o)return $prefs.setValueForKey(t,e);if(n)return $persistentStore.write(t,e)};const a=e=>{if(o)return $prefs.valueForKey(e);if(n)return $persistentStore.read(e)};const p=e=>{if(e){if(e.status){e["statusCode"]=e.status}else if(e.statusCode){e["status"]=e.statusCode}}return e};const y=(e,t)=>{if(o){if(typeof e=="string")e={url:e};e["method"]="GET";$task.fetch(e).then(e=>{t(null,p(e),e.body)},e=>t(e.error,null,null))}if(n)$httpClient.get(e,(e,n,o)=>{t(e,p(n),o)});if(i){f.request(e,(e,n,o)=>{t(e,p(n),o)})}if(s){if(typeof e=="string")e={url:e};e["header"]=e["headers"];e["handler"]=function(e){let n=e.error;if(n)n=JSON.stringify(e.error);let o=e.data;if(typeof o=="object")o=JSON.stringify(e.data);t(n,p(e.response),o)};$http.get(e)}};const $=(e,t)=>{if(o){if(typeof e=="string")e={url:e};e["method"]="POST";$task.fetch(e).then(e=>{t(null,p(e),e.body)},e=>t(e.error,null,null))}if(n){$httpClient.post(e,(e,n,o)=>{t(e,p(n),o)})}if(i){f.request.post(e,(e,n,o)=>{t(e,p(n),o)})}if(s){if(typeof e=="string")e={url:e};e["header"]=e["headers"];e["handler"]=function(e){let n=e.error;if(n)n=JSON.stringify(e.error);let o=e.data;if(typeof o=="object")o=JSON.stringify(e.data);t(n,p(e.response),o)};$http.post(e)}};const g=e=>{if(isEnableLog)console.log(`\n██${e}`)};const h=()=>{const t=((Date.now()-e)/1e3).toFixed(2);return console.log(`\n██用时：${t}秒`)};const b=e=>{let r=`body`;if(t){if(o)r=`content`;if(n)r=`body`}let s={};s[r]=e;if(o)t?$done(s):null;if(n)t?$done(s):$done();if(i)g(JSON.stringify(s))};const q=e=>{if(typeof e=="undefined"||e==null||e==""){return true}else{return false}};const S=e=>{return new Promise(t=>setTimeout(t,e))};return{isRequest:t,isJSBox:s,isSurge:n,isQuanX:o,isLoon:r,isNode:i,getRequestUrl:u,getResponseBody:l,msg:d,setValueForKey:c,getVal:a,get:y,post:$,log:g,time:h,done:b,isEmpty:q,wait:S}}