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
        try {
            const bingHeader = JSON.stringify($request.headers.cookie)
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
function ToolKit(t,s,i){return new class{constructor(t,s,i){this.tgEscapeCharMapping={"&":"＆","#":"＃"};this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`;this.prefix=`lk`;this.name=t;this.id=s;this.data=null;this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`);this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`);this.options=i;this.isExecComm=false;this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`);this.isEnableLog=this.isEmpty(this.isEnableLog)?true:JSON.parse(this.isEnableLog);this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`);this.isNotifyOnlyFail=this.isEmpty(this.isNotifyOnlyFail)?false:JSON.parse(this.isNotifyOnlyFail);this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`);this.isEnableTgNotify=this.isEmpty(this.isEnableTgNotify)?false:JSON.parse(this.isEnableTgNotify);this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`);this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify;this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`;this.costTotalString=this.getVal(this.costTotalStringKey);this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',"");this.costTotalMs=this.costTotalString.split(",")[0];this.execCount=this.costTotalString.split(",")[1];this.costTotalMs=this.isEmpty(this.costTotalMs)?0:parseInt(this.costTotalMs);this.execCount=this.isEmpty(this.execCount)?0:parseInt(this.execCount);this.logSeparator="\n██";this.now=new Date;this.startTime=this.now.getTime();this.node=(()=>{if(this.isNode()){const t=require("request");return{request:t}}else{return null}})();this.execStatus=true;this.notifyInfo=[];this.log(`${this.name}, 开始执行!`);this.execComm()}getRealPath(t){if(this.isNode()){let s=process.argv.slice(1,2)[0].split("/");s[s.length-1]=t;return s.join("/")}return t}async execComm(){if(this.isNode()){this.comm=process.argv.slice(1);let t=false;if(this.comm[1]=="p"){this.isExecComm=true;this.log(`开始执行指令【${this.comm[1]}】=> 发送到手机测试脚本！`);if(this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)){this.log(`未设置options，使用默认值`);if(this.isEmpty(this.options)){this.options={}}this.options.httpApi=`ffff@10.0.0.9:6166`}else{if(!/.*?@.*?:[0-9]+/.test(this.options.httpApi)){t=true;this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`);this.done()}}if(!t){this.callApi(this.comm[2])}}}}callApi(t){let s=this.comm[0];this.log(`获取【${s}】内容传给手机`);let i="";this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const e=this.path.resolve(s);const o=this.path.resolve(process.cwd(),s);const h=this.fs.existsSync(e);const r=!h&&this.fs.existsSync(o);if(h||r){const t=h?e:o;try{i=this.fs.readFileSync(t)}catch(t){i=""}}else{i=""}let n={url:`http://${this.options.httpApi.split("@")[1]}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${i}`,mock_type:"cron",timeout:!this.isEmpty(t)&&t>5?t:5},json:true};this.post(n,(t,i,e)=>{this.log(`已将脚本【${s}】发给手机！`);this.done()})}getCallerFileNameAndLine(){let t;try{throw Error("")}catch(s){t=s}const s=t.stack;const i=s.split("\n");let e=1;if(e!==0){const t=i[e];this.path=this.path?this.path:require("path");return`[${t.substring(t.lastIndexOf(this.path.sep)+1,t.lastIndexOf(":"))}]`}else{return"[-]"}}getFunName(t){var s=t.toString();s=s.substr("function ".length);s=s.substr(0,s.indexOf("("));return s}boxJsJsonBuilder(t,s){if(this.isNode()){let i="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(s&&s.hasOwnProperty("target_boxjs_json_path")){i=s["target_boxjs_json_path"]}if(!this.fs.existsSync(i)){return}if(!this.isJsonObject(t)||!this.isJsonObject(s)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}this.log("using node");let e=["settings","keys"];const o="https://raw.githubusercontent.com/Orz-3";let h={};let r="#lk{script_url}";if(s&&s.hasOwnProperty("script_url")){r=this.isEmpty(s["script_url"])?"#lk{script_url}":s["script_url"]}h.id=`${this.prefix}${this.id}`;h.name=this.name;h.desc_html=`⚠️使用说明</br>详情【<a href='${r}?raw=true'><font class='red--text'>点我查看</font></a>】`;h.icons=[`${o}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${o}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`];h.keys=[];h.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:true,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:false,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}];h.author="#lk{author}";h.repo="#lk{repo}";h.script=`${r}?raw=true`;if(!this.isEmpty(t)){for(let s in e){let i=e[s];if(!this.isEmpty(t[i])){if(i==="settings"){for(let s=0;s<t[i].length;s++){let e=t[i][s];for(let t=0;t<h.settings.length;t++){let s=h.settings[t];if(e.id===s.id){h.settings.splice(t,1)}}}}h[i]=h[i].concat(t[i])}delete t[i]}}Object.assign(h,t);if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.boxJsJsonFile);const e=this.path.resolve(process.cwd(),this.boxJsJsonFile);const o=this.fs.existsSync(t);const r=!o&&this.fs.existsSync(e);const n=JSON.stringify(h,null,"\t");if(o){this.fs.writeFileSync(t,n)}else if(r){this.fs.writeFileSync(e,n)}else{this.fs.writeFileSync(t,n)}let a=JSON.parse(this.fs.readFileSync(i));if(a.hasOwnProperty("apps")&&Array.isArray(a["apps"])&&a["apps"].length>0){let t=a.apps;let e=t.indexOf(t.filter(t=>{return t.id==h.id})[0]);if(e>=0){a.apps[e]=h}else{a.apps.push(h)}let o=JSON.stringify(a,null,2);if(!this.isEmpty(s)){for(const t in s){let i="";if(s.hasOwnProperty(t)){i=s[t]}else if(t==="author"){i="@lowking"}else if(t==="repo"){i="https://github.com/lowking/Scripts"}o=o.replace(`#lk{${t}}`,i)}}const r=/(?:#lk\{)(.+?)(?=\})/;let n=r.exec(o);if(n!==null){this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L18传入参数：\n`)}let l=new Set;while((n=r.exec(o))!==null){l.add(n[1]);o=o.replace(`#lk{${n[1]}}`,``)}l.forEach(t=>{console.log(`${t} `)});this.fs.writeFileSync(i,o)}}}}isJsonObject(t){return typeof t=="object"&&Object.prototype.toString.call(t).toLowerCase()=="[object object]"&&!t.length}appendNotifyInfo(t,s){if(s==1){this.notifyInfo=t}else{this.notifyInfo.push(t)}}prependNotifyInfo(t){this.notifyInfo.splice(0,0,t)}execFail(){this.execStatus=false}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!==typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(t){return new Promise(s=>setTimeout(s,t))}log(t){if(this.isEnableLog)console.log(`${this.logSeparator}${t}`)}logErr(t){this.execStatus=true;if(this.isEnableLog){console.log(`${this.logSeparator}${this.name}执行异常:`);console.log(t);console.log(`\n${t.message}`)}}msg(t,s,i,e){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus){}else{if(this.isEmpty(s)){if(Array.isArray(this.notifyInfo)){s=this.notifyInfo.join("\n")}else{s=this.notifyInfo}}if(!this.isEmpty(s)){if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);for(let t in this.tgEscapeCharMapping){if(!this.tgEscapeCharMapping.hasOwnProperty(t)){continue}s=s.replace(t,this.tgEscapeCharMapping[t])}this.get({url:encodeURI(`${this.tgNotifyUrl}📌${this.name}\n${s}`)},(t,s,i)=>{this.log(`Tg通知完毕`)})}else{let o={};const h=!this.isEmpty(i);const r=!this.isEmpty(e);if(this.isQuanX()){if(h)o["open-url"]=i;if(r)o["media-url"]=e;$notify(this.name,t,s,o)}if(this.isSurge()||this.isStash()){if(h)o["url"]=i;$notification.post(this.name,t,s,o)}if(this.isNode())this.log("⭐️"+this.name+"\n"+t+"\n"+s);if(this.isJSBox())$push.schedule({title:this.name,body:t?t+"\n"+s:s})}}}}getVal(t,s=""){let i;if(this.isSurge()||this.isLoon()||this.isStash()){i=$persistentStore.read(t)}else if(this.isQuanX()){i=$prefs.valueForKey(t)}else if(this.isNode()){this.data=this.loadData();i=process.env[t]||this.data[t]}else{i=this.data&&this.data[t]||null}return!i?s:i}setVal(t,s){if(this.isSurge()||this.isLoon()||this.isStash()){return $persistentStore.write(s,t)}else if(this.isQuanX()){return $prefs.setValueForKey(s,t)}else if(this.isNode()){this.data=this.loadData();this.data[t]=s;this.writeData();return true}else{return this.data&&this.data[t]||null}}loadData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);if(i||e){const e=i?t:s;try{return JSON.parse(this.fs.readFileSync(e))}catch(t){return{}}}else return{}}else return{}}writeData(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs");this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile);const s=this.path.resolve(process.cwd(),this.dataFile);const i=this.fs.existsSync(t);const e=!i&&this.fs.existsSync(s);const o=JSON.stringify(this.data);if(i){this.fs.writeFileSync(t,o)}else if(e){this.fs.writeFileSync(s,o)}else{this.fs.writeFileSync(t,o)}}}adapterStatus(t){if(t){if(t.status){t["statusCode"]=t.status}else if(t.statusCode){t["status"]=t.statusCode}}return t}get(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="GET";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash())$httpClient.get(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)});if(this.isNode()){this.node.request(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.get(t)}}post(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="POST";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash()){$httpClient.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){this.node.request.post(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}put(t,s=(()=>{})){if(this.isQuanX()){if(typeof t=="string")t={url:t};t["method"]="PUT";$task.fetch(t).then(t=>{s(null,this.adapterStatus(t),t.body)},t=>s(t.error,null,null))}if(this.isSurge()||this.isLoon()||this.isStash()){t.method="PUT";$httpClient.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isNode()){t.method="PUT";this.node.request.put(t,(t,i,e)=>{s(t,this.adapterStatus(i),e)})}if(this.isJSBox()){if(typeof t=="string")t={url:t};t["header"]=t["headers"];t["handler"]=function(t){let i=t.error;if(i)i=JSON.stringify(t.error);let e=t.data;if(typeof e=="object")e=JSON.stringify(t.data);s(i,this.adapterStatus(t.response),e)};$http.post(t)}}costTime(){let t=`${this.name}执行完毕！`;if(this.isNode()&&this.isExecComm){t=`指令【${this.comm[1]}】执行完毕！`}const s=(new Date).getTime();const i=s-this.startTime;const e=i/1e3;this.execCount++;this.costTotalMs+=i;this.log(`${t}耗时【${e}】秒\n总共执行【${this.execCount}】次，平均耗时【${(this.costTotalMs/this.execCount/1e3).toFixed(4)}】秒`);this.setVal(this.costTotalStringKey,JSON.stringify(`${this.costTotalMs},${this.execCount}`))}done(t={}){this.costTime();if(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash()){$done(t)}}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isGetCookie(t){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(t))}isEmpty(t){return typeof t=="undefined"||t==null||t==""||t=="null"||t=="undefined"||t.length===0}randomString(t){t=t||32;var s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";var i=s.length;var e="";for(let o=0;o<t;o++){e+=s.charAt(Math.floor(Math.random()*i))}return e}autoComplete(t,s,i,e,o,h,r,n,a,l){t+=``;if(t.length<o){while(t.length<o){if(h==0){t+=e}else{t=e+t}}}if(r){let s=``;for(var f=0;f<n;f++){s+=l}t=t.substring(0,a)+s+t.substring(n+a)}t=s+t+i;return this.toDBC(t)}customReplace(t,s,i,e){try{if(this.isEmpty(i)){i="#{"}if(this.isEmpty(e)){e="}"}for(let o in s){t=t.replace(`${i}${o}${e}`,s[o])}}catch(t){this.logErr(t)}return t}toDBC(t){var s="";for(var i=0;i<t.length;i++){if(t.charCodeAt(i)==32){s=s+String.fromCharCode(12288)}else if(t.charCodeAt(i)<127){s=s+String.fromCharCode(t.charCodeAt(i)+65248)}}return s}hash(t){let s=0,i,e;for(i=0;i<t.length;i++){e=t.charCodeAt(i);s=(s<<5)-s+e;s|=0}return String(s)}formatDate(t,s){let i={"M+":t.getMonth()+1,"d+":t.getDate(),"H+":t.getHours(),"m+":t.getMinutes(),"s+":t.getSeconds(),"q+":Math.floor((t.getMonth()+3)/3),S:t.getMilliseconds()};if(/(y+)/.test(s))s=s.replace(RegExp.$1,(t.getFullYear()+"").substr(4-RegExp.$1.length));for(let t in i)if(new RegExp("("+t+")").test(s))s=s.replace(RegExp.$1,RegExp.$1.length==1?i[t]:("00"+i[t]).substr((""+i[t]).length));return s}}(t,s,i)}
//ToolKit-end
