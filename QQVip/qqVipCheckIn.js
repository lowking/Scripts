/*
QQ会员成长值-lowking-v1.1

按下面配置完之后，手机qq进入左侧会员，滑动即可
⚠️注：发现cookie存活时间较短，增加isEnableNotifyForGetCookie，用来控制获取cookie时的通知，默认关闭通知

************************
Surge 4.2.0+ 脚本配置:
************************

[Script]
# > qq会员成长值签到
qq会员获取cookie = type=http-request,pattern=https:\/\/proxy.vac.qq.com\/cgi-bin\/srfentry.fcgi,script-path=qqVipCheckIn.js
qq会员签到 = type=cron,cronexp="0 0 0,1 * * ?",wake-system=1,script-path=qqVipCheckIn.js

[mitm]
hostname = proxy.vac.qq.com

************************
QuantumultX 本地脚本配置:
************************

[rewrite_local]
#qq会员获取cookie
https:\/\/proxy.vac.qq.com\/cgi-bin\/srfentry.fcgi? url script-request-header qqVipCheckIn.js

[task_local]
0 0 0,1 * * ? qqVipCheckIn.js

[mitm]
hostname= proxy.vac.qq.com

************************
LOON 本地脚本配置:
************************

[Script]
http-request https:\/\/proxy.vac.qq.com\/cgi-bin\/srfentry.fcgi script-path=https://raw.githubusercontent.com/lowking/Scripts/master/QQVip/qqVipCheckIn.js, timeout=10, tag=qq会员获取
cron "0 0 0,1 * * *" script-path=https://raw.githubusercontent.com/lowking/Scripts/master/QQVip/qqVipCheckIn.js, tag=qq会员签到

mitm= proxy.vac.qq.com
*/
const signHeaderKey = 'lkQQSignHeaderKey'
const lk = nobyda()
const isEnableLog = !lk.getVal('lkIsEnableLogQQVip') ? true : JSON.parse(lk.getVal('lkIsEnableLogQQVip'))
const isEnableNotifyForGetCookie = !lk.getVal('lkIsEnableNotifyForGetCookie') ? false : JSON.parse(lk.getVal('lkIsEnableNotifyForGetCookie'))
const isDeleteAllCookie = !lk.getVal('lkIsDeleteAllCookie') ? false : JSON.parse(lk.getVal('lkIsDeleteAllCookie'))
const isEnableGetCookie = !lk.getVal('lkIsEnableGetCookieQQVIP') ? true : JSON.parse(lk.getVal('lkIsEnableGetCookieQQVIP'))
const signurlVal = `https://iyouxi3.vip.qq.com/ams3.0.php?actid=403490&g_tk=`
const mainTitle = `QQ会员成长值签到`
var notifyInfo = ``
var accounts = !lk.getVal(signHeaderKey) ? [] : JSON.parse(lk.getVal(signHeaderKey))
// accounts = []

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
    if ($request && $request.method != 'OPTIONS' && url.match(/\/cgi-bin\/srfentry/)) {
        try {
            const qqheader = JSON.stringify($request.headers.Cookie)
            lk.log(qqheader)
            if (!!qqheader) {
                let obj = {
                    qq: Number(getCookieProp(qqheader, `uin`).substring(1)),
                    skey: getCookieProp(qqheader, `skey`),
                    cookie: qqheader
                }
                //判断当前qq信息是否持久化
                if (accounts.length > 0) {
                    for (var i in accounts) {
                        if (accounts[i].qq == obj.qq) {
                            accounts.splice(i, 1);
                        }
                    }
                }
                accounts.push(obj)
                lk.setValueForKey(signHeaderKey, JSON.stringify(accounts))
                lk.log(`${JSON.stringify(accounts)}`)
                lk.log(`${lk.getVal(signHeaderKey)}`)
                if (isEnableNotifyForGetCookie) {
                    lk.msg(mainTitle, ``, `${autoComplete(obj.qq, ``, ``, ` `, `10`, `0`, true, 3, 3, `*`)}获取cookie成功🎉`)
                }
            }
        } catch (e) {
            lk.msg(mainTitle, ``, `获取cookie失败，请重试❌`)
        }
    }
    lk.done()
}

function signIn() {
    return new Promise(async (resolve, reject) => {
        lk.log(`所有账号：${JSON.stringify(accounts)}`);
        if (!accounts || accounts.length <= 0) {
            lk.msg(mainTitle, ``, `帐号列表为空，请获取cookie之后再试❌`)
        } else {
            if (isDeleteAllCookie) {
                lk.setValueForKey(signHeaderKey, ``)
                lk.msg(mainTitle, ``, `已清除所有cookie⭕️`)
            } else {
                for (var i in accounts) {
                    lk.log(`账号：${JSON.stringify(accounts[i])}`);
                    await qqVipSignIn(i, accounts[i]);
                }
            }
        }
        resolve()
    })
}

function qqVipSignIn(index, obj) {
    return new Promise((resolve, reject) => {
        lk.log(`当前帐号：${obj.qq}`)
        let signurlValReal = signurlVal
        let realHeader = {}
        realHeader.Host = `iyouxi3.vip.qq.com`
        realHeader.Cookie = obj.cookie.replace("\"", "")
        let url = {
            url: signurlValReal + getCSRFToken(obj.skey),
            headers: realHeader
        }
        lk.get(url, (error, response, data) => {
            lk.log(`\n${data}`);
            try {
                if (index > 0) {
                    notifyInfo += `\n`
                }
                notifyInfo += `${autoComplete(obj.qq, ``, ``, ` `, `10`, `0`, true, 3, 3, `*`)}`
                if (index == 3) {
                    notifyInfo += `【左滑 '查看' 以显示签到详情】\n`
                }
                const result = JSON.parse(data)
                if (result.ret == 0) {
                    notifyInfo += `🎉`
                } else if (result.ret == 10601) {
                    notifyInfo += `🔁`
                } else {
                    notifyInfo += `❌`
                }
                notifyInfo += `\n` + result.msg
            } finally {
                resolve()
            }
        })
    })
}

function getCookieProp(ca, cname) {
    var name = cname + "="
    ca = ca.split(";")
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim()
        if (c.indexOf(name) == 0) {
            return c.substring(name.length).replace("\"", "")
        }
    }
    return ""
}

function notify() {
    return new Promise((resolve, reject) => {
        if(!!notifyInfo.trim()) {
            lk.msg(`QQ会员成长值签到结果`, ``, `${notifyInfo}`)
        }
        // 待测试
        // lk.setValueForKey(signHeaderKey, ``)
        lk.time()
        lk.done()
        resolve()
    })
}

function nobyda(){const t=Date.now();const e=typeof $request!="undefined";const n=typeof $httpClient!="undefined";const o=typeof $task!="undefined";const s=typeof $app!="undefined"&&typeof $http!="undefined";const r=typeof require=="function"&&!s;const i=(()=>{if(r){const t=require("request");return{request:t}}else{return null}})();const f=(t,e,i)=>{if(o)$notify(t,e,i);if(n)$notification.post(t,e,i);if(r)c(t+e+i);if(s)$push.schedule({title:t,body:e?e+"\n"+i:i})};const u=(t,e)=>{if(o)return $prefs.setValueForKey(e,t);if(n)return $persistentStore.write(e,t)};const l=t=>{if(o)return $prefs.valueForKey(t);if(n)return $persistentStore.read(t)};const d=t=>{if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t};const a=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n)$httpClient.get(t,(t,n,o)=>{e(t,d(n),o)});if(r){i.request(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.get(t)}};const p=(t,e)=>{if(o){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{e(null,d(t),t.body)},t=>e(t.error,null,null))}if(n){$httpClient.post(t,(t,n,o)=>{e(t,d(n),o)})}if(r){i.request.post(t,(t,n,o)=>{e(t,d(n),o)})}if(s){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let n=t.error;if(n)n=JSON.stringify(t.error);let o=t.data;if(typeof o=="object")o=JSON.stringify(t.data);e(n,d(t.response),o)};$http.post(t)}};const c=t=>{if(isEnableLog)console.log(`\n██${t}`)};const y=()=>{const e=((Date.now()-t)/1e3).toFixed(2);return console.log(`\n██用时：${e}秒`)};const $=(t={})=>{if(o)e?$done(t):null;if(n)e?$done(t):$done()};return{isRequest:e,isJSBox:s,isNode:r,msg:f,setValueForKey:u,getVal:l,get:a,post:p,log:c,time:y,done:$}}
function getCSRFToken(r){var n="5381";var t="tencentQQVIP123443safde&!%^%1282";var e=r;var a=[],o;a.push(n<<5);for(var u=0,f=e.length;u<f;++u){o=e.charAt(u).charCodeAt(0);a.push((n<<5)+o);n=o}return md5z(a.join("")+t)}function md5z(r){var n=0;var t="";var e=8;var a=32;function o(r){return p(h(S(r),r.length*e))}function u(r){return B(h(S(r),r.length*e))}function f(r){return b(h(S(r),r.length*e))}function v(r,n){return p(s(r,n))}function c(r,n){return B(s(r,n))}function i(r,n){return b(s(r,n))}function h(r,n){r[n>>5]|=128<<n%32;r[(n+64>>>9<<4)+14]=n;var t=1732584193;var e=-271733879;var o=-1732584194;var u=271733878;for(var f=0;f<r.length;f+=16){var v=t;var c=e;var i=o;var h=u;t=g(t,e,o,u,r[f+0],7,-680876936);u=g(u,t,e,o,r[f+1],12,-389564586);o=g(o,u,t,e,r[f+2],17,606105819);e=g(e,o,u,t,r[f+3],22,-1044525330);t=g(t,e,o,u,r[f+4],7,-176418897);u=g(u,t,e,o,r[f+5],12,1200080426);o=g(o,u,t,e,r[f+6],17,-1473231341);e=g(e,o,u,t,r[f+7],22,-45705983);t=g(t,e,o,u,r[f+8],7,1770035416);u=g(u,t,e,o,r[f+9],12,-1958414417);o=g(o,u,t,e,r[f+10],17,-42063);e=g(e,o,u,t,r[f+11],22,-1990404162);t=g(t,e,o,u,r[f+12],7,1804603682);u=g(u,t,e,o,r[f+13],12,-40341101);o=g(o,u,t,e,r[f+14],17,-1502002290);e=g(e,o,u,t,r[f+15],22,1236535329);t=C(t,e,o,u,r[f+1],5,-165796510);u=C(u,t,e,o,r[f+6],9,-1069501632);o=C(o,u,t,e,r[f+11],14,643717713);e=C(e,o,u,t,r[f+0],20,-373897302);t=C(t,e,o,u,r[f+5],5,-701558691);u=C(u,t,e,o,r[f+10],9,38016083);o=C(o,u,t,e,r[f+15],14,-660478335);e=C(e,o,u,t,r[f+4],20,-405537848);t=C(t,e,o,u,r[f+9],5,568446438);u=C(u,t,e,o,r[f+14],9,-1019803690);o=C(o,u,t,e,r[f+3],14,-187363961);e=C(e,o,u,t,r[f+8],20,1163531501);t=C(t,e,o,u,r[f+13],5,-1444681467);u=C(u,t,e,o,r[f+2],9,-51403784);o=C(o,u,t,e,r[f+7],14,1735328473);e=C(e,o,u,t,r[f+12],20,-1926607734);t=A(t,e,o,u,r[f+5],4,-378558);u=A(u,t,e,o,r[f+8],11,-2022574463);o=A(o,u,t,e,r[f+11],16,1839030562);e=A(e,o,u,t,r[f+14],23,-35309556);t=A(t,e,o,u,r[f+1],4,-1530992060);u=A(u,t,e,o,r[f+4],11,1272893353);o=A(o,u,t,e,r[f+7],16,-155497632);e=A(e,o,u,t,r[f+10],23,-1094730640);t=A(t,e,o,u,r[f+13],4,681279174);u=A(u,t,e,o,r[f+0],11,-358537222);o=A(o,u,t,e,r[f+3],16,-722521979);e=A(e,o,u,t,r[f+6],23,76029189);t=A(t,e,o,u,r[f+9],4,-640364487);u=A(u,t,e,o,r[f+12],11,-421815835);o=A(o,u,t,e,r[f+15],16,530742520);e=A(e,o,u,t,r[f+2],23,-995338651);t=d(t,e,o,u,r[f+0],6,-198630844);u=d(u,t,e,o,r[f+7],10,1126891415);o=d(o,u,t,e,r[f+14],15,-1416354905);e=d(e,o,u,t,r[f+5],21,-57434055);t=d(t,e,o,u,r[f+12],6,1700485571);u=d(u,t,e,o,r[f+3],10,-1894986606);o=d(o,u,t,e,r[f+10],15,-1051523);e=d(e,o,u,t,r[f+1],21,-2054922799);t=d(t,e,o,u,r[f+8],6,1873313359);u=d(u,t,e,o,r[f+15],10,-30611744);o=d(o,u,t,e,r[f+6],15,-1560198380);e=d(e,o,u,t,r[f+13],21,1309151649);t=d(t,e,o,u,r[f+4],6,-145523070);u=d(u,t,e,o,r[f+11],10,-1120210379);o=d(o,u,t,e,r[f+2],15,718787259);e=d(e,o,u,t,r[f+9],21,-343485551);t=m(t,v);e=m(e,c);o=m(o,i);u=m(u,h)}if(a==16){return Array(e,o)}else{return Array(t,e,o,u)}}function l(r,n,t,e,a,o){return m(y(m(m(n,r),m(e,o)),a),t)}function g(r,n,t,e,a,o,u){return l(n&t|~n&e,r,n,a,o,u)}function C(r,n,t,e,a,o,u){return l(n&e|t&~e,r,n,a,o,u)}function A(r,n,t,e,a,o,u){return l(n^t^e,r,n,a,o,u)}function d(r,n,t,e,a,o,u){return l(t^(n|~e),r,n,a,o,u)}function s(r,n){var t=S(r);if(t.length>16)t=h(t,r.length*e);var a=Array(16),o=Array(16);for(var u=0;u<16;u++){a[u]=t[u]^909522486;o[u]=t[u]^1549556828}var f=h(a.concat(S(n)),512+n.length*e);return h(o.concat(f),512+128)}function m(r,n){var t=(r&65535)+(n&65535);var e=(r>>16)+(n>>16)+(t>>16);return e<<16|t&65535}function y(r,n){return r<<n|r>>>32-n}function S(r){var n=Array();var t=(1<<e)-1;for(var a=0;a<r.length*e;a+=e)n[a>>5]|=(r.charCodeAt(a/e)&t)<<a%32;return n}function b(r){var n="";var t=(1<<e)-1;for(var a=0;a<r.length*32;a+=e)n+=String.fromCharCode(r[a>>5]>>>a%32&t);return n}function p(r){var t=n?"0123456789ABCDEF":"0123456789abcdef";var e="";for(var a=0;a<r.length*4;a++){e+=t.charAt(r[a>>2]>>a%4*8+4&15)+t.charAt(r[a>>2]>>a%4*8&15)}return e}function B(r){var n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var e="";for(var a=0;a<r.length*4;a+=3){var o=(r[a>>2]>>8*(a%4)&255)<<16|(r[a+1>>2]>>8*((a+1)%4)&255)<<8|r[a+2>>2]>>8*((a+2)%4)&255;for(var u=0;u<4;u++){if(a*8+u*6>r.length*32)e+=t;else e+=n.charAt(o>>6*(3-u)&63)}}return e}return o(r)}function autoComplete(r,n,t,e,a,o,u,f,v,c){r+=``;if(r.length<a){while(r.length<a){if(o==0){r+=e}else{r=e+r}}}if(u){let n=``;for(var i=0;i<f;i++){n+=c}r=r.substring(0,v)+n+r.substring(f+v)}r=n+r+t;lk.log(`补齐后：${r}`);return toDBC(r)}function toDBC(r){var n="";for(var t=0;t<r.length;t++){if(r.charCodeAt(t)==32){n=n+String.fromCharCode(12288)}else if(r.charCodeAt(t)<127){n=n+String.fromCharCode(r.charCodeAt(t)+65248)}}return n}