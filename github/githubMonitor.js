/**
 * 2020年06月17日，此版本是推送到tg的，如不需要请用原版，地址在下面
 * ⚠️注意事项：
 * 在tg上私聊https://telegram.me/botfather，申请自己的机器人，然后把申请的机器人邀请到一个群组（需要通知的地方）
 * 具体的操作可以查看这篇文章 https://blog.csdn.net/hc13097240190/article/details/80745446
 *
 * 1、监控github仓库的commits和release。
 * 2、监控具体的文件或目录是否有更新。
 * 3、新增：可以监控多层目录里面的某个文件
 * @author: Peng-YM， toulanboy
 * 更新地址：https://raw.githubusercontent.com/Peng-YM/QuanX/master/Tasks/github.js
 * 配置方法：
 * 1. 填写github token, 在github > settings > developer settings > personal access token 里面生成一个新token。
 * 默认TOKEN用的是我自己的，请不要请求过于频繁，每天一两次即可。例如：cron "0 9 * * *"* 2. 配置仓库地址，格式如下：
 * {
 *  name: "",//填写仓库名称，可自定义
 *  file_names:[],//可选参数。若需要监控具体文件或目录，请填写路径（具体看下面示例）。
 *  url: "" //仓库的url
 * }
 * 📌 如果希望监控某个分支的Commit，请切换到该分支，直接复制URL填入；
 * 📌 如果希望监控Release，请切换至Release界面，直接复制URL填入；
 */

const lk = nobyda()
const token = !lk.getVal('lkGithubMonitorToken') ? "null" : lk.getVal('lkGithubMonitorToken')
const isEnableLog = !lk.getVal('lkGithubMonitorIsEnableLog') ? true : JSON.parse(lk.getVal('lkGithubMonitorIsEnableLog'))
if(token=="null"){
    lk.msg(`Github监控`, ``, `未获取到token❌`)
    lk.done()
}
const tgNotifyUrl = !lk.getVal('lkGithubMonitorTgNotifyUrl') ? "null" : lk.getVal('lkGithubMonitorTgNotifyUrl')
if (tgNotifyUrl == "null") {
    lk.msg(`Github监控`, ``, `请填写tg通知url❌`)
    lk.done()
}

let repositories
try {
    repositories = !lk.getVal('lkGithubMonitorRepo') ? [] : JSON.parse(lk.getVal('lkGithubMonitorRepo'))
} catch (e) {
    lk.msg(`Github监控`, ``, `监控仓库json格式错误❌`)
    lk.done()
}

const $ = API("github", false);

const parser = {
    commits: new RegExp(
        /^https:\/\/github.com\/([\w|-]+)\/([\w|-]+)(\/tree\/([\w|-]+))?$/
    ),
    releases: new RegExp(/^https:\/\/github.com\/([\w|-]+)\/([\w|-]+)\/releases/),
};
const headers = {
    Authorization: `token ${token}`,
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.141 Safari/537.36",
};
function hash(str) {
    let h = 0,
        i,
        chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        h = (h << 5) - h + chr;
        h |= 0; // Convert to 32bit integer
    }
    return String(h);
}
function parserPath(path) {
    // console.log(path.split('/'))

    if (path.match(/\//) == undefined) {
        result = []
        result.push(path)
        // console.log(result)
        return result
    }
    return path.split('/')
}
function parseURL(url) {
    try {
        let repo = undefined;
        if (url.indexOf("releases") !== -1) {
            const results = url.match(parser.releases);
            repo = {
                type: "releases",
                owner: results[1],
                repo: results[2],
            };
        } else {
            const results = url.match(parser.commits);
            repo = {
                type: "commits",
                owner: results[1],
                repo: results[2],
                branch: results[3] === undefined ? "HEAD" : results[4],
            };
        }
        $.log(repo);
        return repo;
    } catch (error) {
        $.notify("Github 监控", "", `❌ URL ${url} 解析错误！`);
        throw error;
    }
}

function needUpdate(url, timestamp) {
    const storedTimestamp = $.read(hash(url));
    $.log(`Stored Timestamp for ${hash(url)}: ` + storedTimestamp);
    return storedTimestamp === undefined || storedTimestamp !== timestamp
        ? true
        : false;
}

async function checkUpdate(item) {
    const baseURL = "https://api.github.com";
    const { name, url } = item;
    try {
        const repository = parseURL(url);
        if (repository.type === "releases") {
            await $.get({
                url: `${baseURL}/repos/${repository.owner}/${repository.repo}/releases`,
                headers,
            })
                .then((response) => {
                    const releases = JSON.parse(response.body);
                    if (releases.length > 0) {
                        // the first one is the latest release
                        const release_name = releases[0].name;
                        const author = releases[0].author.login;
                        const { published_at, body } = releases[0];
                        const notificationURL = {
                            "open-url": `https://github.com/${repository.owner}/${repository.repo}/releases`,
                            "media-url": `https://raw.githubusercontent.com/Orz-3/mini/master/Color/github.png`
                        }
                        if (needUpdate(url, published_at)) {
                            $.write(published_at, hash(url));
                            lk.tgNotify(name, "📌" + body, formatTime(published_at), notificationURL["open-url"])
                        }
                    }
                })
                .catch((e) => {
                    $.error(e);
                });
        } else {
            const { author, body, published_at, file_url } = await $.get({
                url: `${baseURL}/repos/${repository.owner}/${repository.repo}/commits/${repository.branch}`,
                headers,
            })
                .then((response) => {
                    const { commit } = JSON.parse(response.body);
                    const author = commit.committer.name;
                    const body = commit.message;
                    const published_at = commit.committer.date;
                    const file_url = commit.tree.url;
                    return { author, body, published_at, file_url };
                })
                .catch((e) => {
                    $.error(e);
                });
            $.log({ author, body, published_at, file_url });
            const notificationURL = {
                "open-url": `https://github.com/${repository.owner}/${repository.repo}/commits/${repository.branch}`,
                "media-url": `https://raw.githubusercontent.com/Orz-3/mini/master/Color/github.png`
            }
            //监控仓库是否有更新
            if (!item.hasOwnProperty("file_names")) {
                if (needUpdate(url, published_at)) {
                    // update stored timestamp
                    $.write(published_at, hash(url));
                    lk.tgNotify(name, "📌" + body, formatTime(published_at), notificationURL["open-url"])
                }
            }
            //找出具体的文件是否有更新
            else {
                const file_names = item.file_names;
                for (let i in file_names) {

                    paths = parserPath(file_names[i])
                    $.log(paths)
                    await findFile(name, file_url, paths, 0, notificationURL["open-url"])
                }
            }
        }
    } catch (e) {
        $.error(`❌ 请求错误: ${e}`);
        return;
    }
    return;
}
function findFile(name, tree_url, paths, current_pos, openUrl) {

    if (current_pos == paths.length) {
        $.notify(`🐬 [${name}]`, "", `🚫 仓库中没有该文件：${paths[paths.length-1]}`);
    }
    $.get({
        url: tree_url,
        headers
    }).then((response) => {
            const file_detail = JSON.parse(response.body);
            // console.log(file_detail)
            const file_list = file_detail.tree;
            isFind = false;
            for (let i in file_list) {
                if (file_list[i].path == paths[current_pos]) {

                    fileType = file_list[i].type
                    isDir = paths[current_pos].match(/\.(js|py|cpp|c|cpp|html|css|jar|png|jpg|bmp|exe)/) == null ? true : false;
                    $.log(`🔍正在判断：${paths[current_pos]} is a ${isDir?"directory":"file"}`)
                    if (current_pos == paths.length - 1 && fileType == 'blob' && !isDir) {
                        isFind = true;
                        let file_hash = file_list[i].sha;
                        let last_sha = $.read(hash(name + paths[current_pos]));
                        if (file_hash != last_sha) {
                            $.write(file_hash, hash(name + paths[current_pos]));
                            lk.tgNotify(`${name}`, `📌 ${paths[current_pos]}有更新`, ``, openUrl)
                        }
                        $.log(
                            `🐬 ${paths[current_pos]}：\n\tlast sha: ${last_sha}\n\tlatest sha: ${file_hash}\n\t${file_hash == last_sha ? "✅当前已是最新" : "🔅需要更新"}`
                        );
                    }
                    else if (current_pos == paths.length - 1 && fileType == 'tree' && isDir) {
                        isFind = true;
                        let file_hash = file_list[i].sha;
                        let last_sha = $.read(hash(name + paths[current_pos]));
                        if (file_hash != last_sha) {
                            $.write(file_hash, hash(name + paths[current_pos]));
                            lk.tgNotify(`${name}`, `📌 ${paths[current_pos]}有更新`, ``, openUrl)
                        }
                        $.log(
                            `🐬 ${paths[current_pos]}：\n\tlast sha: ${last_sha}\n\tlatest sha: ${file_hash}\n\t${file_hash == last_sha ? "✅当前已是最新" : "🔅需要更新"}`
                        );
                    } else if (fileType == 'tree') {
                        isFind = true;
                        tree_url = file_list[i].url
                        findFile(name, tree_url, paths, current_pos + 1, openUrl)
                    }
                }

            }
            if (isFind == false) {
                $.notify(`🐬 [${name}]`, "", `🚫 仓库中没有该文件：${paths[paths.length-1]}\n🚫 请检查你的路径是否填写正确`);
            }
        },
        (error) => {
            console.log(error)
        })
}
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${
    date.getMonth() + 1
        }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
}

Promise.all(
    repositories.map(async (item) => await checkUpdate(item))
).finally(() => $.done());

// prettier-ignore
/*********************************** API *************************************/
function API(t="untitled",e=!1){return new class{constructor(t,e){this.name=t,this.debug=e,this.isQX="undefined"!=typeof $task,this.isLoon="undefined"!=typeof $loon,this.isSurge="undefined"!=typeof $httpClient&&!this.isLoon,this.isNode="function"==typeof require,this.node=(()=>this.isNode?{request:require("request"),fs:require("fs")}:null)(),this.cache=this.initCache(),this.log(`INITIAL CACHE:\n${JSON.stringify(this.cache)}`),Promise.prototype.delay=function(t){return this.then(function(e){return((t,e)=>new Promise(function(s){setTimeout(s.bind(null,e),t)}))(t,e)})}}get(t){return this.isQX?("string"==typeof t&&(t={url:t,method:"GET"}),$task.fetch(t)):new Promise((e,s)=>{this.isLoon||this.isSurge?$httpClient.get(t,(t,i,o)=>{t?s(t):e({...i,body:o})}):this.node.request(t,(t,i,o)=>{t?s(t):e({...i,status:i.statusCode,body:o})})})}post(t){return this.isQX?("string"==typeof t&&(t={url:t}),t.method="POST",$task.fetch(t)):new Promise((e,s)=>{this.isLoon||this.isSurge?$httpClient.post(t,(t,i,o)=>{t?s(t):e({...i,body:o})}):this.node.request.post(t,(t,i,o)=>{t?s(t):e({...i,status:i.statusCode,body:o})})})}initCache(){if(this.isQX)return JSON.parse($prefs.valueForKey(this.name)||"{}");if(this.isLoon||this.isSurge)return JSON.parse($persistentStore.read(this.name)||"{}");if(this.isNode){const t=`${this.name}.json`;return this.node.fs.existsSync(t)?JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(t,JSON.stringify({}),{flag:"wx"},t=>console.log(t)),{})}}persistCache(){const t=JSON.stringify(this.cache);this.log(`FLUSHING DATA:\n${t}`),this.isQX&&$prefs.setValueForKey(t,this.name),(this.isLoon||this.isSurge)&&$persistentStore.write(t,this.name),this.isNode&&this.node.fs.writeFileSync(`${this.name}.json`,t,{flag:"w"},t=>console.log(t))}write(t,e){this.log(`SET ${e} = ${t}`),this.cache[e]=t,this.persistCache()}read(t){return this.log(`READ ${t} ==> ${this.cache[t]}`),this.cache[t]}delete(t){this.log(`DELETE ${t}`),delete this.cache[t],this.persistCache()}notify(t,e,s,i){const o="string"==typeof i?i:void 0,n=s+(null==o?"":`\n${o}`);this.isQX&&(void 0!==o?$notify(t,e,s,{"open-url":o}):$notify(t,e,s,i)),this.isSurge&&$notification.post(t,e,n),this.isLoon&&$notification.post(t,e,s),this.isNode&&("undefined"==typeof $jsbox?console.log(`${t}\n${e}\n${n}\n\n`):require("push").schedule({title:t,body:e?e+"\n"+s:s}))}log(t){this.debug&&console.log(t)}info(t){console.log(t)}error(t){this.log("ERROR: "+t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){this.log("DONE"),this.isNode||$done(t)}}(t,e)}
/*****************************************************************************/
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
    const tgNotify = (who, content, time, url) => {
        let notifyInfo = "**" + who + "**\n"
            + content + "\n"
            + "at " + time + "\n"
            + (!url ? "" : "· [点击查看](" + url + ")")
        let tgEscapeCharMapping = {'&':'＆', '#':'＃'}
        for (let key in tgEscapeCharMapping) {
            if (!tgEscapeCharMapping.hasOwnProperty(key)) {
                continue
            }
            notifyInfo = notifyInfo.replace(key, tgEscapeCharMapping[key])
        }

        log(encodeURI(tgNotifyUrl + notifyInfo))
        get({
            url: encodeURI(tgNotifyUrl + notifyInfo)
        }, (error, statusCode, body) => {

        });
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
        done,
        tgNotify
    }
}
