/*
米哈游App自定义-lowking-v1.3.4

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > 米哈游App自定义
米哈游我的自定义 = requires-body=1,type=http-response,timeout=30,pattern=https:\/\/api-takumi-record.mihoyo.com\/game_record\/card\/api\/getGameRecordCard,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/mihoyo/miyousheCustom.js
米游社首页自定义 = requires-body=1,type=http-response,pattern=https:\/\/bbs-api.miyoushe.com\/apihub\/api\/home\/new,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/mihoyo/miyousheCustom.js
米游社首页tab自定义 = requires-body=1,type=http-response,pattern=https:\/\/bbs-api.miyoushe.com\/forum\/api\/getDiscussionByGame\?gids=8,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/mihoyo/miyousheCustom.js
米游社兑换中心过滤 = requires-body=1,type=http-response,pattern=https:\/\/bbs-api.miyoushe.com\/common\/homushop\/v1\/web\/goods\/list,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/mihoyo/miyousheCustom.js
米游社绝区零咖啡馆置顶过滤 = requires-body=1,type=http-response,pattern=https:\/\/bbs-api.miyoushe.com\/apihub\/api\/forumMain,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/mihoyo/miyousheCustom.js

[MITM]
hostname = %APPEND% api-takumi-record.mihoyo.com,
*/
const lk = new ToolKit(`米游社App自定义`, `MiyousheCustom`)
const regionGamesKey = 'regionGamesKey'
const homeTopBarKey = 'homeTopBarKey'
const homePageTabKey = 'homePageTabKey'
const goodsRegFilterKey = 'goodsRegFilterKey'
const coffeeTopPostFilterKey = 'coffeeTopPostFilterKey'
const salt6xKey = 'salt6xKey'
const saltK2Key = 'saltK2Key'
const zzzBbsCookieKey = 'zzzBbsCookieKey'
const zzzCookieKey = 'zzzCookieKey'
const appVersionKey = 'appVersionKey'
const zzzDfpKey = 'zzzDfpKey'
const regionGames = lk.getVal(regionGamesKey, "")
const homeTopBar = lk.getVal(homeTopBarKey, "")
const homePageTab = lk.getVal(homePageTabKey, "")
const goodsRegFilter = lk.getVal(goodsRegFilterKey, "")
const coffeeTopPostFilter = lk.getVal(coffeeTopPostFilterKey, "")
let salt6x = lk.getVal(salt6xKey, "t0qEgfub6cvueAPgR5m9aQWWVciEer7v")
let saltK2 = lk.getVal(saltK2Key, "rtvTthKxEyreVXQCnhluFgLXPOFKPHlA")
const zzzBbsCookie = lk.getVal(zzzBbsCookieKey)
const zzzCookie = lk.getVal(zzzCookieKey)
const appVersion = lk.getVal(appVersionKey, "2.71.1")
const zzzDfp = lk.getVal(zzzDfpKey)
const MD5 = function(d){result = M(V(Y(X(d),8*d.length)));return result.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

const main = async () => {
    if (!lk.isRequest()) {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/miyoushe.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/miyoushe.png"
            ],
            "settings": [
                {
                    "id": regionGamesKey,
                    "name": "App我的游戏卡片过滤",
                    "val": "",
                    "type": "text",
                    "desc": "请填写要保留的游戏卡片，多个用\",\"隔开：新艾利都:url,天空岛；后面的url是卡片点击跳转链接，不改可以不写"
                },
                {
                    "id": homeTopBarKey,
                    "name": "App绝区零首页顶栏",
                    "val": "",
                    "type": "text",
                    "desc": "请填写要保留的顶栏，多个用\",\"隔开：工具箱:url,签到福利；后面的url是跳转链接，不改可以不写"
                },
                {
                    "id": homePageTabKey,
                    "name": "App绝区零首页tab栏",
                    "val": "",
                    "type": "text",
                    "desc": "请填写要保留的tab栏，多个用\",\"隔开：咖啡馆,同人图。发现和官方tab无法自定义"
                },
                {
                    "id": goodsRegFilterKey,
                    "name": "App兑换中心过滤",
                    "val": "",
                    "type": "text",
                    "desc": "填写正则，多个用<>隔开，只要符合一个就显示"
                },
                {
                    "id": coffeeTopPostFilterKey,
                    "name": "绝区零咖啡馆置顶过滤",
                    "val": "",
                    "type": "text",
                    "desc": "填写正则，多个用<>隔开，只要符合一个就不显示"
                },
            ],
            "keys": [regionGamesKey, homeTopBarKey, homePageTabKey],
            "script_timeout": 10
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/mihoyo/miyousheCustom.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        return false
    }
    // 首页tab
    // https://bbs-api.miyoushe.com/forum/api/getDiscussionByGame?gids=8&version=3
    if (lk.isMatch(/\/forum\/api\/getDiscussionByGame/) && lk.isMatch(/gids=8/)) {
        let resp = lk.getResponseBody()
        resp = resp.o()
        if (resp?.retcode != 0) {
            return false
        }
        if (resp?.data?.discussion?.forums.length <= 0) {
            return false
        }
        const tabNameMap = homePageTab.split(",").reduce((acc, cur) => {
            const split = cur.split(":")
            if (split.length > 1) {
                acc[split[0]] = `${split[1]}`
            }
            acc.name = `${acc.name}${split[0]},`
            return acc
        }, {
            name: ","
        })
        let ret = resp.data.discussion.forums.reduce((acc, cur) => {
            const name = `,${cur["name"]},`
            lk.log(`tab项目：${cur["name"]}`)
            if (tabNameMap.name.includes(name)) {
                acc.push(cur)
            }
            return acc
        }, [])
        if (ret.length == 0) {
            return false
        }
        ret = sortByArray(ret, tabNameMap.name.split(","), "name")
        resp.data.discussion.forums = ret
        lk.done({body: resp.s()})
    }

    // 咖啡馆置顶帖过滤
    // https://bbs-api.miyoushe.com/apihub/api/forumMain?forum_id=57
    if (lk.isMatch(/\/apihub\/api\/forumMain/) && lk.isMatch(/forum_id=57$/)) {
        let resp = lk.getResponseBody()
        resp = resp.o()
        if (resp?.retcode != 0) {
            return false
        }
        if (resp?.data?.top_posts.length <= 0) {
            return false
        }
        let fn = []
        const regArr = coffeeTopPostFilter.split("<>")
        if (regArr.length > 0) {
            for (let i = 0; i < regArr.length; i++) {
                let regFunc = (name) => {
                    return name.match(new RegExp(regArr[i], "g"))
                }
                fn.push(regFunc)
            }
        }
        resp.data.top_posts = resp.data.top_posts.reduce((acc, cur) => {
            const subject = cur["subject"]
            let isRetain = true
            for (const f of fn) {
                if (f(subject)) {
                    isRetain = false
                    break
                }
            }
            if (isRetain) {
                acc.push(cur)
            }
            return acc
        }, [])
        lk.done({body: resp.s()})
    }

    // 兑换中心
    // https://bbs-api.miyoushe.com/common/homushop/v1/web/goods/list?app_id=1&point_sn=myb&page_size=20&page=1&game=
    if (lk.isMatch(/\/common\/homushop\/v1\/web\/goods\/list/) && lk.isMatch(/game=$/)) {
        let resp = lk.getResponseBody()
        resp = resp.o()
        if (resp?.retcode != 0) {
            return false
        }
        if (resp?.data?.list.length <= 0) {
            return false
        }
        let fn = []
        const regArr = goodsRegFilter.split("<>")
        if (regArr.length > 0) {
            for (let i = 0; i < regArr.length; i++) {
                let regFunc = (name) => {
                    return name.match(new RegExp(regArr[i], "g"))
                }
                fn.push(regFunc)
            }
        }
        resp.data.list = resp.data.list.reduce((acc, cur) => {
            const name = cur["goods_name"]
            for (const f of fn) {
                if (f(name)) {
                    acc.push(cur)
                    break
                }
            }
            return acc
        }, [])
        lk.done({body: resp.s()})
    }

    // 首页顶栏
    // https://bbs-api.miyoushe.com/apihub/api/home/new?device=iPhone16%2C1&gids=8&parts=1%2C3%2C4&version=3
    if (lk.isMatch(/\/apihub\/api\/home\/new/)) {
        let resp = lk.getResponseBody()
        resp = resp.o()
        if (resp?.retcode != 0) {
            return false
        }
        if (resp?.data?.navigator.length <= 0) {
            return false
        }
        const topBarNameMap = homeTopBar.split(",").reduce((acc, cur) => {
            const split = cur.split(":")
            if (split.length > 2) {
                acc[split[0]] = `${split[1]}:${split[2]}`
            }
            acc.topBarNames = `${acc.topBarNames}${split[0]},`
            return acc
        }, {
            topBarNames: ","
        })
        let ret = resp.data.navigator.reduce((acc, cur) => {
            const name = `,${cur["name"]},`
            lk.log(`顶栏项目：${cur["name"]}`)
            if (topBarNameMap.topBarNames.includes(name)) {
                let url = topBarNameMap[cur["name"]]
                if (url && url.startsWith("http")) {
                    cur["app_path"] = url
                }
                acc.push(cur)
            }
            return acc
        }, [])
        if (ret.length == 0) {
            return false
        }
        ret = sortByArray(ret, topBarNameMap.topBarNames.split(","), "name")
        resp.data.navigator = ret
        lk.done({body: resp.s()})
    }

    // 我的游戏卡片
    // https://api-takumi-record.mihoyo.com/game_record/card/api/getGameRecordCard?uid=
    if (lk.isMatch(/\/game_record\/card\/api\/getGameRecordCard/)) {
        let resp = lk.getResponseBody()
        resp = resp.o()
        if (resp?.retcode != 0) {
            return false
        }
        if (resp?.data?.list.length <= 0) {
            return false
        }
        const regionGamesMap = regionGames.split(",").reduce((acc, cur) => {
            const split = cur.split(":")
            if (split.length > 2) {
                acc[split[0]] = `${split[1]}:${split[2]}`
            }
            acc.regionNames = `${acc.regionNames}${split[0]},`
            return acc
        }, {
            regionNames: ","
        })
        let ret = []
        for (let card of resp.data.list) {
            const regionName = `,${card["region_name"]},`
            lk.log(`我的-卡片项目：${card["region_name"]}`)
            if (regionGamesMap.regionNames.includes(regionName)) {
                let regionUrl = regionGamesMap[card["region_name"]]
                if (regionUrl && regionUrl.startsWith("http")) {
                    card.url = regionUrl
                }
                if (regionName == ",新艾利都,") {
                    const activeDays = card.data[0].value
                    const roleId = card["game_role_id"]
                    // 获取爬塔数据
                    const indexInfo = await getIndexInfo(roleId)
                    let layer = "-"
                    if (indexInfo?.data?.stats?.climbing_tower_layer) {
                        layer = `${indexInfo?.data?.stats?.climbing_tower_layer}`
                    }
                    let climbingTowerMvpNum = "-"
                    if (indexInfo?.data?.stats?.climbing_tower_s2) {
                        let climbingTowerLayer = indexInfo?.data?.stats?.climbing_tower_s2?.climbing_tower_layer || "-"
                        climbingTowerMvpNum = indexInfo?.data?.stats?.climbing_tower_s2?.floor_mvp_num || "-"
                        layer = `${layer} / ${climbingTowerLayer}`
                    }
                    card.data[0].name = `无伤: ${climbingTowerMvpNum}`
                    card.data[0].value = layer
                    // 获取式與防卫战数据
                    let r1, r2 = []
                    const challengeInfo = await getChallengeInfo(roleId, 1)
                    if (challengeInfo?.data?.rating_list) {
                        r1 = challengeInfo.data.rating_list.reduce((acc, cur) => {
                            acc.push(`${cur.times}${cur.rating}`)
                            return acc
                        }, [])
                    }
                    card.data[2].name = "本期式與"
                    card.data[2].value = r1.length == 0 ? "-" : r1.join(" ")
                    let memoryBattleFieldScore = "-", memoryBattleFieldRankPercent = "-", memoryBattleFieldStar = "-"
                    if (indexInfo?.data?.stats?.memory_battlefield) {
                        memoryBattleFieldScore = `${indexInfo?.data?.stats?.memory_battlefield?.total_score}`
                        memoryBattleFieldRankPercent = `${(indexInfo?.data?.stats?.memory_battlefield?.rank_percent/100).toFixed(2)}%`
                        memoryBattleFieldStar = `${indexInfo?.data?.stats?.memory_battlefield?.total_star}`
                    }
                    card.data[3].name = memoryBattleFieldRankPercent == "-" ? "-" : `${memoryBattleFieldRankPercent} ${memoryBattleFieldStar}★`
                    card.data[3].value = memoryBattleFieldScore
                    // 修改区服信息，显示活跃天数
                    card["nickname"] = `${card["nickname"]} ⁽${convertNumericSymbol(activeDays, "up")}⁾⁽${convertNumericSymbol(roleId, "up")}⁾`.replaceAll(/\n/g, "")
                }
                ret.push(card)
            }
        }
        if (ret.length == 0) {
            return false
        }
        ret = sortByArray(ret, regionGamesMap.regionNames.split(","), "region_name")
        resp.data.list = ret
        lk.done({body: resp.s()})
    }
    return true
}

const getHeader = () => {
    let reqHeaders = Object.keys($request.headers).reduce((obj, key) => {
        obj[key.toLowerCase()] = $request.headers[key]
        return obj
    }, {})
    let respHeaders = Object.keys($response.headers).reduce((obj, key) => {
        obj[key.toLowerCase()] = $response.headers[key]
        return obj
    }, {})
    reqHeaders.cookie = `${reqHeaders.cookie}${respHeaders["set-cookie"]}`
    return reqHeaders
}

const getIndexInfo = async (roleId) => {
    lk.log(`正在获取${roleId}的战绩信息`)
    let queryString = `role_id=${roleId}&server=prod_gf_cn`
    let headers = {
        referer: "https://app.mihoyo.com",
        "x-rpc-device_fp": zzzDfp,
        "x-rpc-client_type": 2,
        "x-rpc-app_version": appVersion,
        ds: getDs("", "", queryString),
        cookie: `${zzzCookie}${zzzBbsCookie}`
    }
    return await lk.req.get({
        url: `https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz/index?${queryString}`,
        headers
    }).then(({error, resp, data}) => {
        return data.o()
    })
}

const getChallengeInfo = async (roleId, scheduleType) => {
    lk.log(`正在获取${roleId}的挑战信息`)
    let queryString = `role_id=${roleId}&schedule_type=${scheduleType}&server=prod_gf_cn`
    let headers = {
        referer: "https://app.mihoyo.com",
        "x-rpc-device_fp": zzzDfp,
        "x-rpc-client_type": 2,
        "x-rpc-app_version": appVersion,
        ds: getDs("", "", queryString),
        cookie: `${zzzCookie}${zzzBbsCookie}`
    }
    return await lk.req.get({
        url: `https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz/challenge?${queryString}`,
        headers
    }).then(({error, resp, data}) => {
        return data.o()
    })
}

const sortByArray = (source, refer, key) => {
    const elements = source.reduce((acc, cur) => {
        acc[cur[key]] = cur
        return acc
    }, {})
    return refer.reduce((acc, cur) => {
        const element = elements[cur]
        if (element) {
            acc.push(element)
        }
        return acc
    }, [])
}

const numMap = {
    "up": ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"],
    "down": ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"],
}
const convertNumericSymbol = (s, type) => {
    let ret = []
    for (const char of s.split("")) {
        ret.push(numMap[type][Number(char)])
    }
    if (ret) {
        return ret.join("")
    }
    return s
}

const getDs = (task, body="", query="") => {
    let randomStr = lk.randomString(6)
    let timestamp = Math.floor(Date.now() / 1000)
    let sign, ds, str
    switch (task) {
        case "signIn":
            const randomInt = Math.floor(Math.random() * (200000 - 100001) + 100001)
            str = `salt=${salt6x}&t=${timestamp}&r=${randomInt}&b=${body}&q=${query}`
            sign = MD5(str)
            ds = `${timestamp},${randomInt},${sign}`
            break
        case "dailyCheckin":
            str = `salt=${salt6x}&t=${timestamp}&r=${randomStr}`
            if (body || query) {
                str = `${str}&b=${body}&q=${query}`
            }
            sign = MD5(str)
            ds = `${timestamp},${randomStr},${sign}`
            break
        default:
            str = `salt=${saltK2}&t=${timestamp}&r=${randomStr}`
            if (body || query) {
                str = `${str}&b=${body}&q=${query}`
            }
            sign = MD5(str)
            ds = `${timestamp},${randomStr},${sign}`
    }
    lk.log(`getDs: task: ${task}, body: ${body}, query: ${query}, str: ${str}`)

    return ds
}

if(!lk.isExecComm) {
    main().catch((err) => lk.logErr(err)).then((ret) => {
        if (!ret) {
            lk.done()
        }
    })
}

// * ToolKit v1.3.2 build 144
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options=="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,resp,data)=>error?reject({error,resp,data}):resolve({error,resp,data}))}),delayFetch=(promise,timeout=5e3)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))]);return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){return typeof this=="string"?this:JSON.stringify(this,replacer,space)},Object.prototype.o=function(reviver){return JSON.parse(this,reviver)},this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`,this.prefix=`lk`,this.name=scriptName,this.id=scriptId,this.req=new Request(this),this.data=null,this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`),this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`),this.options=options,this.isExecComm=!1,this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`),this.isEnableLog=!!this.isEmpty(this.isEnableLog)||this.isEnableLog.o(),this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`),this.isNotifyOnlyFail=!this.isEmpty(this.isNotifyOnlyFail)&&this.isNotifyOnlyFail.o(),this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`),this.isEnableTgNotify=!this.isEmpty(this.isEnableTgNotify)&&this.isEnableTgNotify.o(),this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`),this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify,this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`,this.costTotalString=this.getVal(this.costTotalStringKey),this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',""),this.costTotalMs=this.costTotalString.split(",")[0],this.execCount=this.costTotalString.split(",")[1],this.sleepTotalMs=0,this.logSeparator=`
██`,this.twoSpace="  ",this.now=new Date,this.startTime=this.now.getTime(),this.node=(()=>{if(this.isNode()){const request=require("request");return{request}}return null})(),this.execStatus=!0,this.notifyInfo=[],this.boxjsCurSessionKey="chavy_boxjs_cur_sessions",this.boxjsSessionsKey="chavy_boxjs_sessions",this.preTgEscapeCharMapping={"|`|":",backQuote,"},this.finalTgEscapeCharMapping={",backQuote,":"`","%2CbackQuote%2C":"`"},this.tgEscapeCharMapping={"_":"\\_","*":"\\*","`":"\\`"},this.tgEscapeCharMappingV2={"_":"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"},this.log(`${this.name}, 开始执行!`),this.execComm()}getRealPath(fileName){if(!this.isNode())return fileName;let targetPath=process.argv.slice(1,2)[0].split("/");return targetPath[targetPath.length-1]=fileName,targetPath.join("/")}checkPath(fileName){const curDirDataFilePath=this.path.resolve(fileName),rootDirDataFilePath=this.path.resolve(process.cwd(),fileName),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);return{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}}async execComm(){if(!this.isNode())return;if(this.comm=process.argv.slice(1),this.comm[1]!="p")return;this.isExecComm=!0,this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本!`);let httpApi=this.options?.httpApi,targetDevice;if(this.isEmpty(this?.options?.httpApi))this.log(`未设置options,使用默认值`),this.isEmpty(this?.options)&&(this.options={}),this.options.httpApi=`ffff@10.0.0.6:6166`,httpApi=this.options.httpApi,targetDevice=httpApi.split("@")[1];else{if(typeof httpApi=="object")if(targetDevice=this.isNumeric(this.comm[2])?this.comm[3]||"unknown":this.comm[2],httpApi[targetDevice])httpApi=httpApi[targetDevice];else{const keys=Object.keys(httpApi);keys[0]?(targetDevice=keys[0],httpApi=httpApi[keys[0]]):httpApi="error"}if(!/.*?@.*?:[0-9]+/.test(httpApi)){this.log(`❌httpApi格式错误!格式: ffff@3.3.3.18:6166`),this.done();return}}this.callApi(this.comm[2],targetDevice,httpApi)}callApi(timeout,targetDevice,httpApi){let fname=this.comm[0];const[xKey,httpApiHost]=httpApi.split("@");this.log(`获取【${fname}】内容传给【${targetDevice||httpApiHost}】`),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(fname);if(!isCurDirDataFile&&!isRootDirDataFile){lk.done();return}const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":xKey},body:{script_text:String(this.fs.readFileSync(datPath)),mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:!0};this.req.post(options).then(({error,resp,data})=>{this.log(`已将脚本【${fname}】发给【${targetDevice}】,执行结果: 
${this.twoSpace}error: ${error}
${this.twoSpace}resp: ${resp?.s()}
${this.twoSpace}data: ${this.responseDataAdapter(data)}`),this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode())return;if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误,请传入json对象");return}let boxjsJsonPath=param?.targetBoxjsJsonPath||"/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(!this.fs.existsSync(boxjsJsonPath))return;this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={},scritpUrl="#lk{script_url}";if(boxJsJson.id=`${this.prefix}${this.id}`,boxJsJson.name=this.name,boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`,boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`],boxJsJson.keys=[],boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:!0,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址,如: https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}],boxJsJson.author="#lk{author}",boxJsJson.repo="#lk{repo}",boxJsJson.script=`${scritpUrl}?raw=true`,!this.isEmpty(info))for(let key of needAppendKeys){if(this.isEmpty(info[key]))break;if(key==="settings")for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];input.id===def.id&&boxJsJson.settings.splice(j,1)}}boxJsJson[key]=boxJsJson[key].concat(info[key]),delete info[key]}Object.assign(boxJsJson,info),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.boxJsJsonFile),jsondata=boxJsJson.s(null,"	");isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata);let boxjsJson=this.fs.readFileSync(boxjsJsonPath).o();if(!boxjsJson?.apps||!Array.isArray(boxjsJson.apps)){this.log(`⚠️请在boxjs订阅json文件中添加根属性: apps, 否则无法自动构建`);return}let apps=boxjsJson.apps,targetIdx=apps.indexOf(apps.filter(app=>app.id==boxJsJson.id)[0]);targetIdx>=0?boxjsJson.apps[targetIdx]=boxJsJson:boxjsJson.apps.push(boxJsJson);let ret=boxjsJson.s(null,2);if(!this.isEmpty(param))for(const key in param){let val=param[key];if(!val)switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}ret=ret.replaceAll(`#lk{${key}}`,val)}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);m!==null&&this.log(`⚠️生成BoxJs还有未配置的参数,请参考:
${this.twoSpace}https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19
${this.twoSpace}传入参数: `);let loseParamSet=new Set;for(;(m=regex.exec(ret))!==null;)loseParamSet.add(m[1]),ret=ret.replace(`#lk{${m[1]}}`,``);loseParamSet.forEach(p=>console.log(`${this.twoSpace}${p}`)),this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){type==1?this.notifyInfo=info:this.notifyInfo.push(info)}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=!1}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return this.sleepTotalMs+=ms,new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){this.isEnableLog&&console.log(`${this.logSeparator}${message}`)}logErr(message){if(this.execStatus=!0,this.isEnableLog){let msg="";this.isEmpty(message.error)||(msg=`${msg}
${this.twoSpace}${message.error.s()}`),this.isEmpty(message.message)||(msg=`${msg}
${this.twoSpace}${message.message.s()}`),msg=`${this.logSeparator}${this.name}执行异常:${this.twoSpace}${msg}`,message&&(msg=`${msg}
${this.twoSpace}${message.s()}`),console.log(msg)}}replaceUseMap(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key))continue;message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,disappearS){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus)return;if(this.isEmpty(message)&&(Array.isArray(this.notifyInfo)?message=this.notifyInfo.join(`
`):message=this.notifyInfo),this.isEmpty(message))return;if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);const isMarkdown=this.tgNotifyUrl&&this.tgNotifyUrl.indexOf("parse_mode=Markdown")!=-1;if(isMarkdown){message=this.replaceUseMap(this.preTgEscapeCharMapping,message);let targetMapping=this.tgEscapeCharMapping;this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2")!=-1&&(targetMapping=this.tgEscapeCharMappingV2),message=this.replaceUseMap(targetMapping,message)}message=`📌${this.name}
${message}`,isMarkdown&&(message=this.replaceUseMap(this.finalTgEscapeCharMapping,message));let u=`${this.tgNotifyUrl}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl),hasMediaUrl=!this.isEmpty(mediaUrl),hasCopyText=!this.isEmpty(copyText),hasAutoDismiss=disappearS>0;this.isSurge()||this.isLoon()||this.isStash()?(hasOpenUrl&&(options.url=openUrl,options.action="open-url"),hasCopyText&&(options.text=copyText,options.action="clipboard"),this.isSurge()&&hasAutoDismiss&&(options["auto-dismiss"]=disappearS),hasMediaUrl&&(options["media-url"]=mediaUrl),$notification.post(this.name,subtitle,message,options)):this.isQuanX()?(hasOpenUrl&&(options["open-url"]=openUrl),hasMediaUrl&&(options["media-url"]=mediaUrl),$notify(this.name,subtitle,message,options)):this.isNode()?this.log("⭐️"+this.name+`
`+subtitle+`
`+message):this.isJSBox()&&$push.schedule({title:this.name,body:subtitle?subtitle+`
`+message:message})}}getVal(key,defaultValue){let value;return this.isSurge()||this.isLoon()||this.isStash()?value=$persistentStore.read(key):this.isQuanX()?value=$prefs.valueForKey(key):this.isNode()?(this.data=this.loadData(),value=process.env[key]||this.data[key]):value=this.data&&this.data[key]||null,value||defaultValue}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey)return;const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=this.getVal(this.boxjsCurSessionKey,"{}").o();if(!boxjsCurSession.hasOwnProperty(boxJsId))return;let curSessionId=boxjsCurSession[boxJsId],boxjsSessions=this.getVal(this.boxjsSessionsKey,"[]").o();if(boxjsSessions.length==0)return;let curSessionDatas=[];if(boxjsSessions.forEach(session=>{session.id==curSessionId&&(curSessionDatas=session.datas)}),curSessionDatas.length==0)return;let isExists=!1;curSessionDatas.forEach(kv=>{kv.key==key&&(kv.val=val,isExists=!0)}),isExists||curSessionDatas.push({key,val}),boxjsSessions.forEach(session=>{session.id==curSessionId&&(session.datas=curSessionDatas)}),this.setVal(this.boxjsSessionsKey,boxjsSessions.s())}setVal(key,val){return this.isSurge()||this.isLoon()||this.isStash()?(this.updateBoxjsSessions(key,val),$persistentStore.write(val,key)):this.isQuanX()?(this.updateBoxjsSessions(key,val),$prefs.setValueForKey(val,key)):this.isNode()?(this.data=this.loadData(),this.data[key]=val,this.writeData(),!0):this.data&&this.data[key]||null}loadData(){if(!this.isNode())return{};this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.dataFile);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;return this.fs.readFileSync(datPath).o()}return{}}writeData(){if(!this.isNode())return;this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{curDirDataFilePath,rootDirDataFilePath,isCurDirDataFile,isRootDirDataFile}=this.checkPath(this.dataFile),jsondata=this.data.s();isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata)}responseDataAdapter(data){const tabString=`${this.twoSpace}${this.twoSpace}`;let ret="";return Object.keys(data).forEach(key=>{let lines=data[key]?.s().split(`
`);key=="output"&&(lines=lines.slice(0,-2)),ret=`${ret}
${tabString}${key}:
${tabString}${this.twoSpace}${lines?.join(`
${tabString}${this.twoSpace}`)}`}),ret}statusAdapter(response){return response&&(response.status=response?.status||response?.statusCode,delete response.statusCode,response)}get(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.get(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="GET",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.get(options))}post(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.post(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="POST",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request.post(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}put(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?(options.method="PUT",$httpClient.put(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)})):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="PUT",$task.fetch(options).then(response=>{callback(null,this.statusAdapter(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?(options.method="PUT",this.node.request.put(options,(error,response,body)=>{callback(error,this.statusAdapter(response),body)})):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);for(;i--;)c+=(aa.pop()||0)+(bb.pop()||0),ret.unshift(c%10),c=Math.floor(c/10);for(;c;)ret.unshift(c%10),c=Math.floor(c/10);return ret.join("")}costTime(){let info=`${this.name}, 执行完毕!`;this.isNode()&&this.isExecComm&&(info=`指令【${this.comm[1]}】执行完毕!`);const endTime=(new Date).getTime(),ms=endTime-this.startTime,costTime=ms/1e3,count=this.sum(this.execCount,"1"),total=this.sum(this.costTotalMs,ms.s()),average=(Number(total)/Number(count)/1e3).toFixed(4);info=`${info}
${this.twoSpace}耗时【${costTime}】秒(含休眠${this.sleepTotalMs?(this.sleepTotalMs/1e3).toFixed(4):0}秒)`,info=`${info}
${this.twoSpace}总共执行【${count}】次,平均耗时【${average}】秒`,info=`${info}
${this.twoSpace}ToolKit v1.3.2 build 144.`,this.log(info),this.setVal(this.costTotalStringKey,`${total},${count}`.s())}done(value={}){this.costTime(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(value)}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj.s()=="{}"||obj==""||obj.s()=='""'||obj.s()=="null"||obj.s()=="undefined"||obj.length===0}isNumeric(s){return!isNaN(parseFloat(s))&&isFinite(s)}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length,pwd="";for(let i=0;i<len;i++)pwd+=chars.charAt(Math.floor(Math.random()*maxPos));return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){if(str+=``,str.length<len)for(;str.length<len;)direction==0?str+=fill:str=fill+str;if(ifCode){let temp=``;for(let i=0;i<clen;i++)temp+=cstr;str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}return str=prefix+str+suffix,this.toDBC(str)}customReplace(str,param,prefix,suffix){try{this.isEmpty(prefix)&&(prefix="#{"),this.isEmpty(suffix)&&(suffix="}");for(let i in param)str=str.replace(`${prefix}${i}${suffix}`,param[i])}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++)txtstring.charCodeAt(i)==32?tmp=tmp+String.fromCharCode(12288):txtstring.charCodeAt(i)<127&&(tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248));return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++)chr=str.charCodeAt(i),h=(h<<5)-h+chr,h|=0;return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};/(y+)/.test(format)&&(format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(format)&&(format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length)));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0)return c.substring(name.length).replace('"',"").trim()}return""}parseHTML(htmlString){let parser=new DOMParser,document=parser.parseFromString(htmlString,"text/html");return document.body}}(scriptName,scriptId,options)}