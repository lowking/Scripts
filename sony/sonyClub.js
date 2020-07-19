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
const lk = new ToolKit('索尼俱乐部签到', 'SonyClub')
const signurlVal = `https://www.sonystyle.com.cn/eSolverOmniChannel/account/signupPoints.do?channel=WAP&access_token=`
var sonyClubToken = !lk.getVal(sonyClubTokenKey) ? `` : lk.getVal(sonyClubTokenKey)
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`

all()

async function all() {
    lk.boxJsJsonBuilder({"author": "@lowking"})
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
                        // 不通知直接登录获取token
                        if (loginCount > 3) {
                            lk.appendNotifyInfo(`登录尝试3次，均失败❌请确认帐号密码是否正确！`)
                            lk.execFail()
                        }else{
                            await loginSonyClub()
                        }
                    } else {
                        const result = JSON.parse(data)
                        if (result.resultMsg[0].code == "00") {
                            lk.appendNotifyInfo(`连续签到${result.resultData.successiveSignupDays}天🎉\n本次签到获得【${result.resultData.signupRankingOfDay}】成长值，共【${result.resultData.totalPoints}】成长值`)
                        } else if (result.resultMsg[0].code == "99") {
                            lk.appendNotifyInfo(`重复签到🔁`)
                        } else if (result.resultMsg[0].code == "98") {
                            if (loginCount > 3) {
                                lk.appendNotifyInfo(`登录尝试3次，均失败❌请确认帐号密码是否正确！`)
                                lk.execFail()
                            }else{
                                await loginSonyClub()
                            }
                        } else {
                            lk.appendNotifyInfo(`签到失败❌\\n${result.resultMsg[0].message}`)
                            lk.execFail()
                        }
                    }
                } catch (ee) {
                    throw ee
                } finally {
                    resolve()
                }
            })
        } catch (e) {
            lk.log(`${lk.name}异常：\n${e}`)
            lk.execFail()
            lk.msg(``, `签到异常，请带上日志联系作者❌`)
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
            lk.appendNotifyInfo(`请到BoxJs填写帐号密码⚠️`)
            lk.execFail()
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
                            lk.appendNotifyInfo(`登录尝试3次，均失败❌请确认帐号密码是否正确！`)
                            lk.execFail()
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
                            lk.setVal(sonyClubTokenKey, accessToken)
                            sonyClubToken = accessToken
                            await signIn()
                        } else {
                            lk.appendNotifyInfo(`登录失败❌\n${result.resultMsg[0].message}`)
                            lk.execFail()
                            return resolve()
                        }
                    }
                } finally {
                    resolve()
                }
            })
        } catch (e) {
            lk.execFail()
            throw e
        }
    })
}

function notify() {
    return new Promise((resolve, reject) => {
        lk.msg(``)
        lk.done()
        return resolve()
    })
}

function ToolKit(t,s){return new class{constructor(t,s){this.prefix=`lk`;this.name=t;this.id=s;this.data=null;this.dataFile=`${this.prefix}${this.id}.dat`;this.boxJsJsonFile=`${this.prefix}${this.id}.boxjs.json`;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEnableLog!=false;this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=!!this.isNotifyOnlyFail;this.logSeparator="\n██";this.startTime=(new Date).getTime();this.node=(()=>{if(this.isNode()){const t=require("request");return{request:t}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.log(`${this.name}, 开始执行!`)}boxJsJsonBuilder(t){const s="https://raw.githubusercontent.com/Orz-3";let i={};i.id=`${this.prefix}${this.id}`;i.name=this.name;i.icons=[`${s}/mini/master/${this.id.toLocaleLowerCase()}.png`,`${s}/task/master/${this.id.toLocaleLowerCase()}.png`];i.keys=[];i.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"}];i.author="@lowking";i.repo="https://github.com/lowking/Scripts";Object.assign(i,t);if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.boxJsJsonFile);const s=this.path.resolve(process.cwd(),this.boxJsJsonFile);const e=this.fs.existsSync(t);const r=!e&&this.fs.existsSync(s);const n=JSON.stringify(i);if(e){this.fs.writeFileSync(t,n)}else if(r){this.fs.writeFileSync(s,n)}else{this.fs.writeFileSync(t,n)}}}appendNotifyInfo(t,s){if(s==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(t){return new Promise(s=>setTimeout(s,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}msg(t,s){if(this.isNotifyOnlyFail&&this.execStatus){}else{if(this.isEmpty(s)){if(Array.isArray(this.notifyInfo)){s=this.notifyInfo.join("\n")}else{s=this.notifyInfo}}if(this.isQuanX())$notify(this.name,t,s);if(this.isSurge())$notification.post(this.name,t,s);if(this.isNode())this.log("⭐️"+this.name+t+s);if(this.isJSBox())$push.schedule({title:this.name,body:t?t+"\n"+s:s})}}getVal(t){if(this.isSurge()||this.isLoon()){return $persistentStore.read(t)}else if(this.isQuanX()){return $prefs.valueForKey(t)}else if(this.isNode()){this.data=this.loadData();return this.data[t]}else{return this.data&&this.data[t]||null}}setVal(t,s){if(this.isSurge()||this.isLoon()){return $persistentStore.write(s,t)}else if(this.isQuanX()){return $prefs.setValueForKey(s,t)}else if(this.isNode()){this.data=this.loadData();this.data[t]=s;this.writeData();return true}else{return this.data&&this.data[t]||null}}loadData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);if(i||e){const e=i?t:s;try{return JSON.parse(this.fs.readFileSync(e))}catch(t){return{}}}else return{}}else return{}}writeData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);const r=JSON.stringify(this.data);if(i){this.fs.writeFileSync(t,r)}else if(e){this.fs.writeFileSync(s,r)}else{this.fs.writeFileSync(t,r)}}}adapterStatus(t){if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t}get(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge())$httpClient.get(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)});if(this.isNode()){this.node.request(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.get(t)}}post(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()){$httpClient.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){this.node.request.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}done(t){const s=(new Date).getTime();const i=(s-this.startTime)/1e3;this.log(`${this.name}执行完毕！耗时【${i}】秒`);let e=`body`;if(this.isRequest()){if(this.isQuanX())e=`content`;if(this.isSurge())e=`body`}let r={};r[e]=t;if(this.isQuanX())this.isRequest()?$done(r):null;if(this.isSurge())this.isRequest()?$done(r):$done();if(this.isNode())this.log(JSON.stringify(r))}getRequestUrl(){if(this.isQuanX())return $resource.link;if(this.isSurge())return $request.url;return""}getResponseBody(){if(this.isQuanX())return $resource.content;if(this.isSurge())return $response.body;return""}isEmpty(t){if(typeof t=="undefined"||t==null||t==""){return true}else{return false}}}(t,s)}