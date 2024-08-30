/*
Bing积分-lowking-v2.3.5

⚠️只测试过surge没有其他app自行测试
1.3.4版本的速度更新，不然第二天无法重置执行状态，导致无法做任务
记得到boxjs里面设置每日任务重置时间，不设置默认每天早上8点

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************

[Script]
# > Bing积分
Bing积分cookie = requires-body=0,type=http-request,pattern=https:\/\/rewards\.bing\.com,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/bing/bingPoint.js
Bing积分 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,script-path=https://raw.githubusercontent.com/lowking/Scripts/master/bing/bingPoint.js

[MITM]
hostname = %APPEND% rewards.bing.com
*/
const lk = new ToolKit(`Bing积分`, `BingPoint`, {"httpApi": "ffff@10.0.0.19:6166"})
const scriptTimeout = 30
const bingPointCookieKey = 'bingPointCookieKey'
const bingSearchCookieKey = 'bingSearchCookieKey'
const bingSearchCookieMobileKey = 'bingSearchCookieMobileKey'
const searchRepeatKey = "bingSearchRepeatKey"
const searchRepeatMobileKey = "searchRepeatMobileKey"
const searchRepeatEdgeKey = "searchRepeatEdgeKey"
const searchPcCountKey = "bingSearchPcCountKey"
const searchPcAmountKey = "searchPcAmountKey"
const searchMobileCountKey = "bingSearchMobileCountKey"
const searchMobileAmountKey = "searchMobileAmountKey"
const searchEdgeCountKey = "bingSearchEdgeCountKey"
const searchEdgeAmountKey = "searchEdgeAmountKey"
const bingCachePointKey = "bingCachePointKey"
const bingIsContinueWhenZeroKey = "bingIsContinueWhenZeroKey"
const bingResetHoursKey = "bingResetHoursKey"
let bingPointHeader
let bingPointCookie = lk.getVal(bingPointCookieKey)
let bingSearchCookie = lk.getVal(bingSearchCookieKey)
let bingSearchMobileCookie = lk.getVal(bingSearchCookieMobileKey)
let isSearchRepeat = lk.getVal(searchRepeatKey)
let isSearchMobileRepeat = lk.getVal(searchRepeatMobileKey)
let isSearchEdgeRepeat = lk.getVal(searchRepeatEdgeKey)
let searchPcCount = lk.getVal(searchPcCountKey, 0)
let searchPcAmount = lk.getVal(searchPcAmountKey, 10)
let searchMobileCount = lk.getVal(searchMobileCountKey, 0)
let searchMobileAmount = lk.getVal(searchMobileAmountKey, 10)
let searchEdgeCount = lk.getVal(searchEdgeCountKey, 0)
let searchEdgeAmount = lk.getVal(searchEdgeAmountKey, 10)
let cachePoint = lk.getVal(bingCachePointKey, 0)
let isContinueWhenZero = lk.getVal(bingIsContinueWhenZeroKey, 1)
let bingResetHours = lk.getVal(bingResetHoursKey, 8)
let isAlreadySearchPc = false, isAlreadySearchMobile = false, isAlreadySearchEdge = false
let nowString = lk.formatDate(new Date(), 'yyyyMMdd')

if(!lk.isExecComm) {
    if (lk.isRequest()) {
        getCookie()
        lk.done()
    } else {
        lk.boxJsJsonBuilder({
            "icons": [
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/bingPoint.png",
                "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/bingPoint.png"
            ],
            "settings": [
                {
                    "id": bingResetHoursKey,
                    "name": "Bing每日任务重置时间",
                    "val": 8,
                    "type": "number",
                    "desc": "写小时数，默认：8"
                },
                {
                    "id": bingPointCookieKey,
                    "name": "Bing积分cookie",
                    "val": "",
                    "type": "text",
                    "desc": "Bing积分cookie"
                },
                {
                    "id": bingSearchCookieMobileKey,
                    "name": "Bing每日搜索cookie(移动端)",
                    "val": "",
                    "type": "text",
                    "desc": "请使用手机打开https://cn.bing.com/search?q=test抓去对应请求的cookie"
                },
                {
                    "id": searchMobileAmountKey,
                    "name": "Bing每日执行搜索(移动端)次数",
                    "val": 10,
                    "type": "number",
                    "desc": "Bing每日执行搜索(移动端)次数"
                },
                {
                    "id": bingSearchCookieKey,
                    "name": "Bing每日搜索cookie(PC)",
                    "val": "",
                    "type": "text",
                    "desc": "请使用电脑打开https://cn.bing.com/search?q=test抓去对应请求的cookie"
                },
                {
                    "id": searchPcAmountKey,
                    "name": "Bing每日执行搜索(PC)次数",
                    "val": 10,
                    "type": "number",
                    "desc": "Bing每日执行搜索(PC)次数"
                },
                {
                    "id": searchEdgeAmountKey,
                    "name": "Bing每日执行搜索(Edge)次数",
                    "val": 10,
                    "type": "number",
                    "desc": "Bing每日执行搜索(Edge)次数"
                }
            ],
            "keys": [bingPointCookieKey],
            "script_timeout": scriptTimeout
        }, {
            "script_url": "https://github.com/lowking/Scripts/blob/master/bing/bingPoint.js",
            "author": "@lowking",
            "repo": "https://github.com/lowking/Scripts",
        })
        all()
    }
}

function getCookie() {
    if (lk.isGetCookie(/\/rewards\.bing\.com/)) {
        lk.log(`开始获取cookie`)
        let headers = Object.keys($request.headers).reduce((obj, key) => {
            obj[key.toLowerCase()] = $request.headers[key]
            return obj
        }, {})
        try {
            const bingHeader = JSON.stringify(headers.cookie)
            if (!!bingHeader) {
                lk.setVal(bingPointCookieKey, bingHeader)
                lk.appendNotifyInfo('🎉成功获取cookie，可以关闭相应脚本')
            }
        } catch (e) {
            lk.execFail()
            lk.appendNotifyInfo('❌获取bing cookie失败')
        }
    }
    lk.msg(``)
    lk.done()
}

async function dealMsg(dashBoard, newPoint) {
    return new Promise((resolve, _reject) => {
        let availablePoints = dashBoard?.dashboard?.userStatus?.availablePoints || "-"
        if (availablePoints != "-" && cachePoint) {
            lk.setVal(bingCachePointKey, JSON.stringify(availablePoints))
            let increaseAmount = availablePoints - cachePoint
            lk.prependNotifyInfo(`本次执行：${increaseAmount >= 0 ? "+" + increaseAmount : increaseAmount}`)
            lk.setVal(bingIsContinueWhenZeroKey, JSON.stringify(increaseAmount + newPoint))
        }
        resolve(`当前积分：${availablePoints}${newPoint > 0 ? "+" + newPoint : ""}   日常获得：${dashBoard?.dashboard?.userStatus?.counters?.dailyPoint[0]?.pointProgress || "-"}/${dashBoard?.dashboard?.userStatus?.counters?.dailyPoint[0]?.pointProgressMax || "-"}`)
    })
}

async function all() {
    // 每天任务重置时间到了之后，允许执行
    let isReset = lk.now.getHours() == bingResetHours
    if (isReset) {
        searchPcCount = 0
        searchMobileCount = 0
        searchEdgeCount = 0
    }
    if (!isReset && isContinueWhenZero <= 0) {
        lk.done()
        return
    }
    let msg = ``
    if (bingPointCookie == '') {
        lk.execFail()
        lk.appendNotifyInfo(`⚠️请先打开rewards.bing.com获取cookie`)
    } else {
        bingPointHeader = {}
        bingPointHeader["authority"] = 'rewards.bing.com'
        bingPointHeader["accept"] = 'application/json, text/javascript, */*; q=0.01'
        bingPointHeader["accept-language"] = 'zh-CN,zh;q=0.9'
        bingPointHeader["cookie"] = bingPointCookie
        bingPointHeader["correlation-context"] = 'v=1,ms.b.tel.market=zh-CN'
        bingPointHeader["dnt"] = '1'
        bingPointHeader["referer"] = 'https://rewards.bing.com/redeem/000899036002'
        bingPointHeader["sec-ch-ua"] = '"Chromium";v="111", "Not(A:Brand";v="8"'
        bingPointHeader["sec-ch-ua-arch"] = '"x86"'
        bingPointHeader["sec-ch-ua-bitness"] = '"64"'
        bingPointHeader["sec-ch-ua-full-version"] = '"111.0.5563.64"'
        bingPointHeader["sec-ch-ua-mobile"] = '?0'
        bingPointHeader["sec-ch-ua-platform"] = '"macOS"'
        bingPointHeader["sec-ch-ua-platform-version"] = '13.2.0'
        bingPointHeader["sec-fetch-dest"] = 'document'
        bingPointHeader["sec-fetch-mode"] = 'navigate'
        bingPointHeader["sec-fetch-site"] = 'none'
        bingPointHeader["user-agent"] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
        if (bingSearchCookie != '') {
            await searchPc()
            await lk.sleep(5000)
            await searchEdge()
        }
        await lk.sleep(5000)
        if (bingSearchMobileCookie != '') {
            await searchMobile()
        }
        await lk.sleep(2000)
        let dashBoard = await getDashBoard()
        if (dashBoard?.dashboard) {
            let newPoint = await reportAct(dashBoard)
            msg = await dealMsg(dashBoard, newPoint)
        } else {
            lk.appendNotifyInfo("❌未获取到活动信息")
        }
    }
    if (!lk.isNode()) {
        lk.log(lk.notifyInfo.join("\n"))
    }
    lk.msg(msg)
    lk.done()
}

function doReportActForQuiz(title, item, rvt) {
    return new Promise((resolve, _reject) => {
        // todo 预留方法，目前官网手动都做不了都任务🤣
        const t = '做问答奖励任务：' + title
        lk.log(t)
        let ret = 0
        let url = {
            url: `https://rewards.bing.com/api/reportactivity?X-Requested-With=XMLHttpRequest&_=${lk.startTime}`,
            headers: bingPointHeader,
            body: `id=${item.name}&hash=${item.hash}&timeZone=480&activityAmount=1&__RequestVerificationToken=${rvt}`
        }
        lk.log(JSON.stringify(url))
        lk.log(JSON.stringify(item))
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    // {"activity":{"id":"3484a93d-db98-490f-998e-10e64e481de7","points":10,"quantity":1,"timestamp":"2023-03-01T22:22:39.5968778+08:00","activityType":11,"channel":"","activitySubtype":"","currencyCode":"","purchasePrice":0.0,"orderId":""},"balance":157}
                    lk.log(data)
                    data = JSON.parse(data)
                    if (data?.activity?.points) {
                        ret = 1
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`bing返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请稍后再试`)
            } finally {
                resolve(ret)
            }
        })
    })
}

function doReportActForUrlreward(title, item, rvt) {
    return new Promise((resolve, _reject) => {
        const t = '做url奖励任务：' + title
        lk.log(t)
        let ret = 0
        let url = {
            url: `https://rewards.bing.com/api/reportactivity?X-Requested-With=XMLHttpRequest&_=${lk.startTime}`,
            headers: bingPointHeader,
            body: `id=${item.name}&hash=${item.hash}&timeZone=480&activityAmount=1&__RequestVerificationToken=${rvt}`
        }
        lk.log(JSON.stringify(url))
        lk.log(JSON.stringify(item))
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    // {"activity":{"id":"3484a93d-db98-490f-998e-10e64e481de7","points":10,"quantity":1,"timestamp":"2023-03-01T22:22:39.5968778+08:00","activityType":11,"channel":"","activitySubtype":"","currencyCode":"","purchasePrice":0.0,"orderId":""},"balance":157}
                    lk.log(data)
                    data = JSON.parse(data)
                    if (data?.activity?.points) {
                        ret = 1
                    }
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`bing返回数据：${data}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请稍后再试`)
            } finally {
                resolve(ret)
            }
        })
    })
}

function searchEdge() {
    return new Promise(async (resolve, _reject) => {
        lk.log(`开始执行每日搜索(Edge)`)
        let isAlwaysSearch = searchEdgeCount == -1
        if (isAlwaysSearch) {
            // 总是搜索的话，赋值为0，搜索次数设置为1
            searchEdgeCount = 0
            searchEdgeAmount = 1
        }
        if (!isAlwaysSearch && nowString == isSearchEdgeRepeat && searchEdgeCount >= searchEdgeAmount) {
            lk.log(`今日搜索(Edge)已达配置上限：${searchEdgeAmount}次`)
            isAlreadySearchEdge = true
            resolve()
            return
        }
        let h = JSON.parse(JSON.stringify(bingPointHeader))
        if (nowString != isSearchEdgeRepeat || searchEdgeCount < searchEdgeAmount) {
            for (let i = searchEdgeCount; i < searchEdgeAmount; i++) {
                h["authority"] = "cn.bing.com"
                h["upgrade-insecure-requests"] = "1"
                h["accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
                h["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.63"
                h["sec-fetch-site"] = "none"
                h["sec-fetch-mode"] = "navigate"
                h["sec-fetch-user"] = "?1"
                h["sec-fetch-dest"] = "document"
                h["sec-fetch-dest"] = "document"
                h["sec-ch-ua-full-version-list"] = "Not A(Brand;v=24.0.0.0, Chromium;v=110.0.5481.177"
                h["accept-encoding"] = "UTF-8"
                h["Content-Encoding"] = "UTF-8"
                h["cookie"] = bingSearchCookie
                let url = {
                    url: `https://www.bing.com/search?q=${lk.randomString(10)}`,
                    headers: h,
                    gzip: true
                }
                lk.get(url, (error, _response, data) => {
                    ++searchEdgeCount
                })
            }

            while (searchEdgeCount < searchEdgeAmount) {
                lk.log(`waiting`)
                await lk.sleep(200)
            }
            try {
                if (!isAlwaysSearch) {
                    lk.log(`保存今天(${nowString})搜索(Edge)次数：${searchEdgeCount}`)
                    lk.setVal(searchEdgeCountKey, JSON.stringify(searchEdgeCount))
                }
                lk.setVal(searchRepeatKey, nowString)
            } catch (e) {
                lk.logErr(e)
            }
            resolve()
        } else {
            resolve()
        }
    })
}

function searchMobile() {
    return new Promise(async (resolve, _reject) => {
        lk.log(`开始执行每日搜索(移动端)`)
        let isAlwaysSearch = searchMobileCount == -1
        if (isAlwaysSearch) {
            // 总是搜索的话，赋值为0，搜索次数设置为1
            searchMobileCount = 0
            searchMobileAmount = 1
        }
        if (!isAlwaysSearch && nowString == isSearchMobileRepeat && searchMobileCount >= searchMobileAmount) {
            lk.log(`今日搜索(移动端)已达配置上限：${searchMobileAmount}次`)
            isAlreadySearchMobile = true
            resolve()
            return
        }
        let h = JSON.parse(JSON.stringify(bingPointHeader))
        if (nowString != isSearchMobileRepeat || searchMobileCount < searchMobileAmount) {
            for (let i = searchMobileCount; i < searchMobileAmount; i++) {
                h["authority"] = "cn.bing.com"
                h["accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                h["user-agent"] = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1"
                h["accept-language"] = "zh-CN,zh-Hans;q=0.9"
                h["referer"] = "https://cn.bing.com/"
                h["accept-encoding"] = "UTF-8"
                h["Content-Encoding"] = "UTF-8"
                h["cookie"] = bingSearchMobileCookie
                let searchWord = lk.randomString(10)
                let url = {
                    url: `https://cn.bing.com/search?q=${searchWord}&search=&form=QBLH&sp=-1&lq=0&pq=${searchWord}&sc=8-2&qs=n&sk=&ghsh=0&ghacc=0&ghpl=`,
                    headers: h,
                    gzip: true
                }
                lk.get(url, (error, _response, data) => {
                    ++searchMobileCount
                })
            }

            while (searchMobileCount < searchMobileAmount) {
                lk.log(`waiting`)
                await lk.sleep(200)
            }
            try {
                if (!isAlwaysSearch) {
                    lk.log(`保存今天(${nowString})搜索(移动端)次数：${searchMobileCount}`)
                    lk.setVal(searchMobileCountKey, JSON.stringify(searchMobileCount))
                }
                lk.setVal(searchRepeatMobileKey, nowString)
            } catch (e) {
                lk.logErr(e)
            }
            resolve()
        } else {
            resolve()
        }
    })
}

function searchPc() {
    return new Promise(async (resolve, _reject) => {
        lk.log(`开始执行每日搜索(PC)`)
        let isAlwaysSearch = searchPcCount == -1
        if (isAlwaysSearch) {
            // 总是搜索的话，赋值为0，搜索次数设置为1
            searchPcCount = 0
            searchPcAmount = 1
        }
        if (!isAlwaysSearch && nowString == isSearchRepeat && searchPcCount >= searchPcAmount) {
            lk.log(`今日搜索(PC)已达配置上限：${searchPcAmount}次`)
            isAlreadySearchPc = true
            resolve()
            return
        }
        let h = JSON.parse(JSON.stringify(bingPointHeader))
        if (nowString != isSearchRepeat || searchPcCount < searchPcAmount) {
            for (let i = searchPcCount; i < searchPcAmount; i++) {
                h["authority"] = "cn.bing.com"
                h["upgrade-insecure-requests"] = "1"
                h["accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
                h["sec-fetch-site"] = "none"
                h["sec-fetch-mode"] = "navigate"
                h["sec-fetch-user"] = "?1"
                h["sec-fetch-dest"] = "document"
                h["sec-fetch-dest"] = "document"
                h["sec-ch-ua-full-version-list"] = "Not A(Brand;v=24.0.0.0, Chromium;v=110.0.5481.177"
                h["accept-encoding"] = "UTF-8"
                h["Content-Encoding"] = "UTF-8"
                h["cookie"] = bingSearchCookie
                let url = {
                    url: `https://www.bing.com/search?q=${lk.randomString(10)}`,
                    headers: h,
                    gzip: true
                }
                lk.get(url, (error, _response, data) => {
                    ++searchPcCount
                })
            }

            while (searchPcCount < searchPcAmount) {
                lk.log(`waiting`)
                await lk.sleep(200)
            }
            try {
                if (!isAlwaysSearch) {
                    lk.log(`保存今天(${nowString})搜索(PC)次数：${searchPcCount}`)
                    lk.setVal(searchPcCountKey, JSON.stringify(searchPcCount))
                }
                lk.setVal(searchRepeatKey, nowString)
            } catch (e) {
                lk.logErr(e)
            }
            resolve()
        } else {
            resolve()
        }
    })
}

function reportAct(dashBoard) {
    return new Promise(async (resolve, _reject) => {
        let newPoint = 0
        let promotionalItem, morePromotions
        morePromotions = dashBoard?.dashboard?.morePromotions || []
        if ((promotionalItem = dashBoard?.dashboard?.promotionalItem)) {
            morePromotions.push(promotionalItem)
        }
        // lk.log(JSON.stringify(morePromotions))
        if (morePromotions.length > 0) {
            let todoCount = 0, sucCount = 0, failCount = 0, completeCount = 0, completePoint = 0
            morePromotions.forEach(_ = async (item) => {
                let title = item?.attributes?.title
                let point = item?.pointProgressMax
                let type = item?.attributes?.type
                if (item?.complete == false) {
                    if (point > 0) {
                        let ret = 0
                        let b = true || title == "Rewa rds 挑戰"
                        lk.log(`开始任务：${title}【${point}】\n${type}\n${b}`)
                        if (b) {
                            if (type === "urlreward") {
                                ret = await doReportActForUrlreward(title, item, dashBoard?.rvt)
                            } else if (type === "quiz") {
                                ret = -1 // await doReportActForQuiz(title, item, dashBoard?.rvt)
                            } else {
                                ret = -2
                            }
                        }
                        todoCount++
                        if (ret === 1) {
                            lk.appendNotifyInfo(`🎉${title}【${point}】`)
                            sucCount++
                            completePoint += point
                            newPoint += point
                        } else {
                            failCount++
                            lk.execFail()
                            if (ret === 0) {
                                lk.appendNotifyInfo(`❌${title}【${point}】`)
                            } else {
                                failCount--
                                lk.log(`⎌${title}【${point}】`)
                            }
                        }
                    } else {
                        todoCount++
                    }
                } else {
                    completeCount++
                    completePoint += point
                    lk.appendNotifyInfo(`✓${title}【${point}】`)
                }
            })
            let err = ""
            let totalCount = sucCount + failCount
            while (true) {
                lk.log(`total: ${morePromotions.length}, suc: ${sucCount}, fail: ${failCount}, complete: ${completeCount}, todo:${todoCount}`)
                if (todoCount + completeCount >= morePromotions.length) {
                    lk.log(`任务都做完了，退出`)
                    err = `🎉任务都做完啦，共获得${completePoint}积分`
                    break
                }
                if (new Date().getTime() - lk.startTime > scriptTimeout * 1000) {
                    lk.log(`执行超时，强制退出`)
                    err = "❌执行超时，强制退出（请添加分流切换节点）"
                    break
                }
                await lk.sleep(100)
                totalCount = sucCount + failCount
            }
            if (!err) {
                if (totalCount > 0) {
                    lk.execFail()
                    lk.prependNotifyInfo(`🎉成功：${sucCount}个，❌失败：${failCount}个`)
                } else {
                    lk.appendNotifyInfo(`🎉今天的任务都做完啦`)
                }
            } else {
                lk.prependNotifyInfo(err)
                lk.prependNotifyInfo(`🎉：${sucCount}个，❌：${failCount}个，今日已完成：${completeCount}个`)
            }
            resolve(newPoint)
        } else {
            lk.execFail()
            lk.prependNotifyInfo(`❌未获取到活动信息`)
            resolve(newPoint)
        }
    })
}

function getDashBoard() {
    return new Promise((resolve, _reject) => {
        const t = '获取面板信息'
        lk.log(`开始${t}`)
        let url = {
            url: `https://rewards.bing.com/?_=${lk.startTime}`,
            headers: bingPointHeader,
        }
        lk.get(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                    resolve({})
                } else {
                    let rvt = data.split("__RequestVerificationToken")[1].split("value=\"")[1].split("\"")[0]
                    url.url = `https://rewards.bing.com/api/getuserinfo?type=1&X-Requested-With=XMLHttpRequest&_=${lk.startTime}`
                    let dashboard = JSON.parse(data.split("var dashboard = ")[1].split("\n")[0].slice(0, -2))
                    // 和上面网页返回截取的结构一样
                    // lk.get(url, (error, _response, data) => {
                    //     if (error) {
                    //         lk.execFail()
                    //         lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                    //         resolve({})
                    //     } else {
                    //         lk.log(JSON.stringify(dashboard))
                    //         dashboard = JSON.parse(data)?.dashboard
                    //         lk.log(JSON.stringify(dashboard))
                    //         let dataObj = {
                    //             dashboard,
                    //             rvt
                    //         }
                    //         resolve(dataObj)
                    //     }
                    // })
                    let dataObj = {
                        dashboard,
                        rvt
                    }
                    resolve(dataObj)
                }
            } catch (e) {
                lk.logErr(e)
                lk.log(`bing返回数据：${data}\n${error}\n${JSON.stringify(_response)}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请稍后再试，或者cookie过期，请重新抓取`)
                resolve({})
            }
        })
    })
}

//ToolKit-start
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options==="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,response,data)=>{error?reject(error):resolve({error:error,response:response,data:data})})});const delayFetch=(promise,timeout=5e3)=>{return Promise.race([promise,new Promise((_resolve,reject)=>{setTimeout(()=>{reject(new Error("请求超时"))},timeout)})])};return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}get(options){return new Promise((resolve,_reject)=>{resolve(this.fetch.call(this.tk,options))})}post(options){return new promise((resolve,_reject)=>{resolve(this.fetch.call(this.tk,options,"POST"))})}put(options){return new promise((resolve,_reject)=>{resolve(this.fetch.call(this.tk,options,"PUT"))})}}return new class{constructor(scriptName,scriptId,options){this.tgEscapeCharMapping={"&":"＆","#":"＃"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=scriptName;this.id=scriptId;this.req=new Request(this);this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=options;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const request=require("request");return{request:request}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.boxjsCurSessionKey="chavy_boxjs_cur_sessions";this.boxjsSessionsKey="chavy_boxjs_sessions";this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(fileName){if(this.isNode()){let targetPath=process.argv.slice(1,2)[0].split("/");targetPath[targetPath.length-1]=fileName;return targetPath.join("/")}return fileName}async execComm(){if(!this.isNode()){return}this.comm=process.argv.slice(1);if(this.comm[1]!="p"){return}let isHttpApiErr=false;this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.6:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){isHttpApiErr=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!isHttpApiErr){this.callApi(this.comm[2])}}callApi(timeout){let fname=this.comm[0];let httpApiHost=this.options.httpApi.split("@")[1];this.log(`获取【${fname}】内容传给【${httpApiHost}】`);let scriptStr="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(fname);const rootDirDataFilePath=this.path.resolve(process.cwd(),fname);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{scriptStr=this.fs.readFileSync(datPath)}catch(e){scriptStr=""}}else{scriptStr=""}let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${scriptStr}`,mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:true};this.post(options,(_error,_response,_data)=>{this.log(`已将脚本【${fname}】发给【${httpApiHost}】`);this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode()){return}if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}let boxjsJsonPath="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(param&&param.hasOwnProperty("target_boxjs_json_path")){boxjsJsonPath=param["target_boxjs_json_path"]}if(!this.fs.existsSync(boxjsJsonPath)){return}this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={};let scritpUrl="#lk{script_url}";if(param&&param.hasOwnProperty("script_url")){scritpUrl=this.isEmpty(param["script_url"])?"#lk{script_url}":param["script_url"]}boxJsJson.id=`${this.prefix}${this.id}`;boxJsJson.name=this.name;boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`;boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];boxJsJson.keys=[];boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];boxJsJson.author="#lk{author}";boxJsJson.repo="#lk{repo}";boxJsJson.script=`${scritpUrl}?raw=true`;if(!this.isEmpty(info)){for(let key of needAppendKeys){if(this.isEmpty(info[key])){break}if(key==="settings"){for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];if(input.id===def.id){boxJsJson.settings.splice(j,1)}}}}boxJsJson[key]=boxJsJson[key].concat(info[key]);delete info[key]}}Object.assign(boxJsJson,info);this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.boxJsJsonFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.boxJsJsonFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=JSON.stringify(boxJsJson,null,"\t");if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}let boxjsJson=JSON.parse(this.fs.readFileSync(boxjsJsonPath));if(!(boxjsJson.hasOwnProperty("apps")&&Array.isArray(boxjsJson["apps"])&&boxjsJson["apps"].length>0)){return}let apps=boxjsJson.apps;let targetIdx=apps.indexOf(apps.filter(app=>{return app.id==boxJsJson.id})[0]);if(targetIdx>=0){boxjsJson.apps[targetIdx]=boxJsJson}else{boxjsJson.apps.push(boxJsJson)}let ret=JSON.stringify(boxjsJson,null,2);if(!this.isEmpty(param)){for(const key in param){let val=param[key];if(!val){switch(key){case"author":val="@lowking";case"repo":val="https://github.com/lowking/Scripts";default:continue}}ret=ret.replace(`#lk{${key}}`,val)}}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);if(m!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19传入参数：`)}let loseParamSet=new Set;while((m=regex.exec(ret))!==null){loseParamSet.add(m[1]);ret=ret.replace(`#lk{${m[1]}}`,``)}loseParamSet.forEach(p=>{console.log(`${p} `)});this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){if(type==1){this.notifyInfo=info}else{this.notifyInfo.push(info)}}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(time){return new Promise(resolve=>setTimeout(resolve,time))}log(message){if(this.isEnableLog)console.log(`${this.logSeparator}${message}`)}logErr(message){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(message);if(!message.message){return}console.log(`\n${message.message}`)}}msg(subtitle,message,openUrl,mediaUrl,copyText,autoDismiss){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){return}if(this.isEmpty(message)){if(Array.isArray(this.notifyInfo)){message=this.notifyInfo.join("\n")}else{message=this.notifyInfo}}if(this.isEmpty(message)){return}if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let key in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(key)){continue}message=message.replace(key,this.tgEscapeCharMapping[key])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${message}`)},(_error,_statusCode,_body)=>{this.log(`Tg通知完毕`)})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl);const hasMediaUrl=!this.isEmpty(mediaUrl);const hasCopyText=!this.isEmpty(copyText);const hasAutoDismiss=autoDismiss>0;if(this.isSurge()||this.isLoon()||this.isStash()){if(hasOpenUrl){options["url"]=openUrl;options["action"]="open-url"}if(hasCopyText){options["text"]=copyText;options["action"]="clipboard"}if(this.isSurge()&&hasAutoDismiss){options["auto-dismiss"]=autoDismiss}if(hasMediaUrl){}options["media-url"]=mediaUrl;$notification.post(this.name,subtitle,message,options)}else if(this.isQuanX()){if(hasOpenUrl)options["open-url"]=openUrl;if(hasMediaUrl)options["media-url"]=mediaUrl;$notify(this.name,subtitle,message,options)}else if(this.isNode()){this.log("⭐️"+this.name+"\n"+subtitle+"\n"+message)}else if(this.isJSBox()){$push.schedule({title:this.name,body:subtitle?subtitle+"\n"+message:message})}}}getVal(key,defaultValue=""){let value;if(this.isSurge()||this.isLoon()||this.isStash()){value=$persistentStore.read(key)}else if(this.isQuanX()){value=$prefs.valueForKey(key)}else if(this.isNode()){this.data=this.loadData();value=process.env[key]||this.data[key]}else{value=this.data&&this.data[key]||null}return!value?defaultValue:value}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey){return}const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=JSON.parse(this.getVal(this.boxjsCurSessionKey,"{}"));if(!boxjsCurSession.hasOwnProperty(boxJsId)){return}let curSessionId=boxjsCurSession[boxJsId];let boxjsSessions=JSON.parse(this.getVal(this.boxjsSessionsKey,"[]"));if(boxjsSessions.length==0){return}let curSessionDatas=[];boxjsSessions.forEach(session=>{if(session.id==curSessionId){curSessionDatas=session.datas}});if(curSessionDatas.length==0){return}let isExists=false;curSessionDatas.forEach(kv=>{if(kv.key==key){kv.val=val;isExists=true}});if(!isExists){curSessionDatas.push({key:key,val:val})}boxjsSessions.forEach(session=>{if(session.id==curSessionId){session.datas=curSessionDatas}});this.setVal(this.boxjsSessionsKey,JSON.stringify(boxjsSessions))}setVal(key,val){if(this.isSurge()||this.isLoon()||this.isStash()){this.updateBoxjsSessions(key,val);return $persistentStore.write(val,key)}else if(this.isQuanX()){this.updateBoxjsSessions(key,val);return $prefs.setValueForKey(val,key)}else if(this.isNode()){this.data=this.loadData();this.data[key]=val;this.writeData();return true}else{return this.data&&this.data[key]||null}}loadData(){if(!this.isNode()){return{}}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{return JSON.parse(this.fs.readFileSync(datPath))}catch(e){return{}}}else{return{}}}writeData(){if(!this.isNode()){return}this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile);const rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile);const isCurDirDataFile=this.fs.existsSync(curDirDataFilePath);const isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);const jsondata=JSON.stringify(this.data);if(isCurDirDataFile){this.fs.writeFileSync(curDirDataFilePath,jsondata)}else if(isRootDirDataFile){this.fs.writeFileSync(rootDirDataFilePath,jsondata)}else{this.fs.writeFileSync(curDirDataFilePath,jsondata)}}adapterStatus(response){if(response){if(response.status){response["statusCode"]=response.status}else if(response.statusCode){response["status"]=response.statusCode}}return response}get(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.get(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="GET";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=JSON.stringify(resp.error);let body=resp.data;if(typeof body=="object")body=JSON.stringify(resp.data);callback(error,this.adapterStatus(resp.response),body)};$http.get(options)}}post(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="POST";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){this.node.request.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=JSON.stringify(resp.error);let body=resp.data;if(typeof body=="object")body=JSON.stringify(resp.data);callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}put(options,callback=(()=>{})){if(this.isSurge()||this.isLoon()||this.isStash()){options.method="PUT";$httpClient.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isQuanX()){if(typeof options=="string")options={url:options};options["method"]="PUT";$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))}else if(this.isNode()){options.method="PUT";this.node.request.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})}else if(this.isJSBox()){if(typeof options=="string")options={url:options};options["header"]=options["headers"];options["handler"]=function(resp){let error=resp.error;if(error)error=JSON.stringify(resp.error);let body=resp.data;if(typeof body=="object")body=JSON.stringify(resp.data);callback(error,this.adapterStatus(resp.response),body)};$http.post(options)}}costTime(){let info=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){info=`指令【${this.comm[1]}】执行完毕！`}const endTime=(new Date).getTime();const ms=endTime-this.startTime;const costTime=ms/1e3;this.execCount++;this.costTotalMs+=ms;this.log(`${info}耗时【${costTime}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(value={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(value)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"||obj=="undefined"||obj.length===0}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length;let pwd="";for(let i=0;i<len;i++){pwd+=chars.charAt(Math.floor(Math.random()*maxPos))}return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){str+=``;if(str.length<len){while(str.length<len){if(direction==0){str+=fill}else{str=fill+str}}}if(ifCode){let temp=``;for(let i=0;i<clen;i++){temp+=cstr}str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}str=prefix+str+suffix;return this.toDBC(str)}customReplace(str,param,prefix,suffix){try{if(this.isEmpty(prefix)){prefix="#{"}if(this.isEmpty(suffix)){suffix="}"}for(let i in param){str=str.replace(`${prefix}${i}${suffix}`,param[i])}}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++){if(txtstring.charCodeAt(i)==32){tmp=tmp+String.fromCharCode(12288)}else if(txtstring.charCodeAt(i)<127){tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248)}}return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++){chr=str.charCodeAt(i);h=(h<<5)-h+chr;h|=0}return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};if(/(y+)/.test(format))format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length));for(let k in o)if(new RegExp("("+k+")").test(format))format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length));return format}}(scriptName,scriptId,options)}
//ToolKit-end
