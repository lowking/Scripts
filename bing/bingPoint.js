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
    if (lk.isMatch(/\/rewards\.bing\.com/)) {
        lk.log(`开始获取cookie`)
        let headers = Object.keys($request.headers).reduce((obj, key) => {
            obj[key.toLowerCase()] = $request.headers[key]
            return obj
        }, {})
        try {
            const bingHeader = headers.cookie.s()
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
            lk.setVal(bingCachePointKey, availablePoints.s())
            let increaseAmount = availablePoints - cachePoint
            lk.prependNotifyInfo(`本次执行：${increaseAmount >= 0 ? "+" + increaseAmount : increaseAmount}`)
            lk.setVal(bingIsContinueWhenZeroKey, (increaseAmount + newPoint).s())
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
        lk.log(url.s())
        lk.log(item.s())
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    // {"activity":{"id":"3484a93d-db98-490f-998e-10e64e481de7","points":10,"quantity":1,"timestamp":"2023-03-01T22:22:39.5968778+08:00","activityType":11,"channel":"","activitySubtype":"","currencyCode":"","purchasePrice":0.0,"orderId":""},"balance":157}
                    lk.log(data)
                    data = data.o()
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
        lk.log(url.s())
        lk.log(item.s())
        lk.post(url, (error, _response, data) => {
            try {
                if (error) {
                    lk.execFail()
                    lk.log(error)
                    lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                } else {
                    // {"activity":{"id":"3484a93d-db98-490f-998e-10e64e481de7","points":10,"quantity":1,"timestamp":"2023-03-01T22:22:39.5968778+08:00","activityType":11,"channel":"","activitySubtype":"","currencyCode":"","purchasePrice":0.0,"orderId":""},"balance":157}
                    lk.log(data)
                    data = data.o()
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
        let h = bingPointHeader.s().o()
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
                    lk.setVal(searchEdgeCountKey, searchEdgeCount.s())
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
        let h = bingPointHeader.s().o()
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
                    lk.setVal(searchMobileCountKey, searchMobileCount.s())
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
        let h = bingPointHeader.s().o()
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
                    lk.setVal(searchPcCountKey, searchPcCount.s())
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
        // lk.log(morePromotions.s())
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
                    let dashboard = data.split("var dashboard = ")[1].split("\n")[0].slice(0, -2).o()
                    // 和上面网页返回截取的结构一样
                    // lk.get(url, (error, _response, data) => {
                    //     if (error) {
                    //         lk.execFail()
                    //         lk.appendNotifyInfo(`❌${t}失败，请稍后再试`)
                    //         resolve({})
                    //     } else {
                    //         lk.log(dashboard.s())
                    //         dashboard = data.o()?.dashboard
                    //         lk.log(dashboard.s())
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
                lk.log(`bing返回数据：${data}\n${error}\n${_response.s()}`)
                lk.execFail()
                lk.appendNotifyInfo(`❌${t}错误，请稍后再试，或者cookie过期，请重新抓取`)
                resolve({})
            }
        })
    })
}

// * ToolKit v1.1.2
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options=="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,response,data)=>error?reject({error,response,data}):resolve({error,response,data}))}),delayFetch=(promise,timeout=5e3)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))]);return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){return typeof this=="string"?this:JSON.stringify(this,replacer,space)},Object.prototype.o=function(reviver){return JSON.parse(this,reviver)},this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`,this.prefix=`lk`,this.name=scriptName,this.id=scriptId,this.req=new Request(this),this.data=null,this.dataFile=this.getRealPath(`${this.prefix}${this.id}.dat`),this.boxJsJsonFile=this.getRealPath(`${this.prefix}${this.id}.boxjs.json`),this.options=options,this.isExecComm=!1,this.isEnableLog=this.getVal(`${this.prefix}IsEnableLog${this.id}`),this.isEnableLog=!!this.isEmpty(this.isEnableLog)||this.isEnableLog.o(),this.isNotifyOnlyFail=this.getVal(`${this.prefix}NotifyOnlyFail${this.id}`),this.isNotifyOnlyFail=!this.isEmpty(this.isNotifyOnlyFail)&&this.isNotifyOnlyFail.o(),this.isEnableTgNotify=this.getVal(`${this.prefix}IsEnableTgNotify${this.id}`),this.isEnableTgNotify=!this.isEmpty(this.isEnableTgNotify)&&this.isEnableTgNotify.o(),this.tgNotifyUrl=this.getVal(`${this.prefix}TgNotifyUrl${this.id}`),this.isEnableTgNotify=this.isEnableTgNotify?!this.isEmpty(this.tgNotifyUrl):this.isEnableTgNotify,this.costTotalStringKey=`${this.prefix}CostTotalString${this.id}`,this.costTotalString=this.getVal(this.costTotalStringKey),this.costTotalString=this.isEmpty(this.costTotalString)?`0,0`:this.costTotalString.replace('"',""),this.costTotalMs=this.costTotalString.split(",")[0],this.execCount=this.costTotalString.split(",")[1],this.sleepTotalMs=0,this.logSeparator=`
██`,this.spaceSeparator="  ",this.now=new Date,this.startTime=this.now.getTime(),this.node=(()=>{if(this.isNode()){const request=require("request");return{request}}return null})(),this.execStatus=!0,this.notifyInfo=[],this.boxjsCurSessionKey="chavy_boxjs_cur_sessions",this.boxjsSessionsKey="chavy_boxjs_sessions",this.preTgEscapeCharMapping={"|`|":",backQuote,"},this.finalTgEscapeCharMapping={",backQuote,":"`","%2CbackQuote%2C":"`"},this.tgEscapeCharMapping={"_":"\\_","*":"\\*","`":"\\`"},this.tgEscapeCharMappingV2={"_":"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"},this.log(`${this.name}, 开始执行!`),this.execComm()}getRealPath(fileName){if(this.isNode()){let targetPath=process.argv.slice(1,2)[0].split("/");return targetPath[targetPath.length-1]=fileName,targetPath.join("/")}return fileName}async execComm(){if(!this.isNode())return;if(this.comm=process.argv.slice(1),this.comm[1]!="p")return;let isHttpApiErr=!1;this.isExecComm=!0,this.log(`开始执行指令【${this.comm[1]}】=> 发送到其他终端测试脚本！`),this.isEmpty(this.options)||this.isEmpty(this.options.httpApi)?(this.log(`未设置options，使用默认值`),this.isEmpty(this.options)&&(this.options={}),this.options.httpApi=`ffff@10.0.0.6:6166`):/.*?@.*?:[0-9]+/.test(this.options.httpApi)||(isHttpApiErr=!0,this.log(`❌httpApi格式错误！格式：ffff@3.3.3.18:6166`),this.done()),isHttpApiErr||this.callApi(this.comm[2])}callApi(timeout){let fname=this.comm[0],httpApiHost=this.options.httpApi.split("@")[1];this.log(`获取【${fname}】内容传给【${httpApiHost}】`);let scriptStr="";this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(fname),rootDirDataFilePath=this.path.resolve(process.cwd(),fname),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{scriptStr=this.fs.readFileSync(datPath)}catch{scriptStr=""}}else scriptStr="";let options={url:`http://${httpApiHost}/v1/scripting/evaluate`,headers:{"X-Key":`${this.options.httpApi.split("@")[0]}`},body:{script_text:`${scriptStr}`,mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:!0};this.post(options,()=>{this.log(`已将脚本【${fname}】发给【${httpApiHost}】`),this.done()})}boxJsJsonBuilder(info,param){if(!this.isNode())return;if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误，请传入json对象");return}let boxjsJsonPath="/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(param&&param.hasOwnProperty("targetBoxjsJsonPath")&&(boxjsJsonPath=param.targetBoxjsJsonPath),!this.fs.existsSync(boxjsJsonPath))return;this.log("using node");let needAppendKeys=["settings","keys"];const domain="https://raw.githubusercontent.com/Orz-3";let boxJsJson={},scritpUrl="#lk{script_url}";if(param&&param.hasOwnProperty("script_url")&&(scritpUrl=this.isEmpty(param.script_url)?"#lk{script_url}":param.script_url),boxJsJson.id=`${this.prefix}${this.id}`,boxJsJson.name=this.name,boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`,boxJsJson.icons=[`${domain}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${domain}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`],boxJsJson.keys=[],boxJsJson.settings=[{id:`${this.prefix}IsEnableLog${this.id}`,name:"开启/关闭日志",val:!0,type:"boolean",desc:"默认开启"},{id:`${this.prefix}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.prefix}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址，如：https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}],boxJsJson.author="#lk{author}",boxJsJson.repo="#lk{repo}",boxJsJson.script=`${scritpUrl}?raw=true`,!this.isEmpty(info))for(let key of needAppendKeys){if(this.isEmpty(info[key]))break;if(key==="settings")for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];input.id===def.id&&boxJsJson.settings.splice(j,1)}}boxJsJson[key]=boxJsJson[key].concat(info[key]),delete info[key]}Object.assign(boxJsJson,info),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.boxJsJsonFile),rootDirDataFilePath=this.path.resolve(process.cwd(),this.boxJsJsonFile),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath),jsondata=boxJsJson.s(null,"	");isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata);let boxjsJson=this.fs.readFileSync(boxjsJsonPath).o();if(!(boxjsJson.hasOwnProperty("apps")&&Array.isArray(boxjsJson.apps)&&boxjsJson.apps.length>0))return;let apps=boxjsJson.apps,targetIdx=apps.indexOf(apps.filter(app=>app.id==boxJsJson.id)[0]);targetIdx>=0?boxjsJson.apps[targetIdx]=boxJsJson:boxjsJson.apps.push(boxJsJson);let ret=boxjsJson.s(null,2);if(!this.isEmpty(param))for(const key in param){let val=param[key];if(!val)switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}ret=ret.replace(`#lk{${key}}`,val)}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);m!==null&&this.log(`生成BoxJs还有未配置的参数，请参考https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19传入参数：`);let loseParamSet=new Set;for(;(m=regex.exec(ret))!==null;)loseParamSet.add(m[1]),ret=ret.replace(`#lk{${m[1]}}`,``);loseParamSet.forEach(p=>{console.log(`${p} `)}),this.fs.writeFileSync(boxjsJsonPath,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){type==1?this.notifyInfo=info:this.notifyInfo.push(info)}prependNotifyInfo(info){this.notifyInfo.splice(0,0,info)}execFail(){this.execStatus=!1}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return this.sleepTotalMs+=ms,new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){this.isEnableLog&&console.log(`${this.logSeparator}${message}`)}logErr(message){this.execStatus=!0,this.isEnableLog&&(this.isEmpty(message.message)||(message=`${message}
${this.spaceSeparator}${message.message.s()}`),message=`${this.logSeparator}${this.name}执行异常:
${this.spaceSeparator}${message}`,console.log(message))}replaceUseMap(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key))continue;message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,autoDismiss){if(!this.isRequest()&&this.isNotifyOnlyFail&&this.execStatus)return;if(this.isEmpty(message)&&(Array.isArray(this.notifyInfo)?message=this.notifyInfo.join(`
`):message=this.notifyInfo),this.isEmpty(message))return;if(this.isEnableTgNotify){this.log(`${this.name}Tg通知开始`);const isMarkdown=this.tgNotifyUrl&&this.tgNotifyUrl.indexOf("parse_mode=Markdown")!=-1;if(isMarkdown){message=this.replaceUseMap(this.preTgEscapeCharMapping,message);let targetMapping=this.tgEscapeCharMapping;this.tgNotifyUrl.indexOf("parse_mode=MarkdownV2")!=-1&&(targetMapping=this.tgEscapeCharMappingV2),message=this.replaceUseMap(targetMapping,message)}message=`📌${this.name}
${message}`,isMarkdown&&(message=this.replaceUseMap(this.finalTgEscapeCharMapping,message));let u=`${this.tgNotifyUrl}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const hasOpenUrl=!this.isEmpty(openUrl),hasMediaUrl=!this.isEmpty(mediaUrl),hasCopyText=!this.isEmpty(copyText),hasAutoDismiss=autoDismiss>0;this.isSurge()||this.isLoon()||this.isStash()?(hasOpenUrl&&(options.url=openUrl,options.action="open-url"),hasCopyText&&(options.text=copyText,options.action="clipboard"),this.isSurge()&&hasAutoDismiss&&(options["auto-dismiss"]=autoDismiss),hasMediaUrl,options["media-url"]=mediaUrl,$notification.post(this.name,subtitle,message,options)):this.isQuanX()?(hasOpenUrl&&(options["open-url"]=openUrl),hasMediaUrl&&(options["media-url"]=mediaUrl),$notify(this.name,subtitle,message,options)):this.isNode()?this.log("⭐️"+this.name+`
`+subtitle+`
`+message):this.isJSBox()&&$push.schedule({title:this.name,body:subtitle?subtitle+`
`+message:message})}}getVal(key,defaultValue){let value;return this.isSurge()||this.isLoon()||this.isStash()?value=$persistentStore.read(key):this.isQuanX()?value=$prefs.valueForKey(key):this.isNode()?(this.data=this.loadData(),value=process.env[key]||this.data[key]):value=this.data&&this.data[key]||null,value||defaultValue}updateBoxjsSessions(key,val){if(key==this.boxjsSessionsKey)return;const boxJsId=`${this.prefix}${this.id}`;let boxjsCurSession=this.getVal(this.boxjsCurSessionKey,"{}").o();if(!boxjsCurSession.hasOwnProperty(boxJsId))return;let curSessionId=boxjsCurSession[boxJsId],boxjsSessions=this.getVal(this.boxjsSessionsKey,"[]").o();if(boxjsSessions.length==0)return;let curSessionDatas=[];if(boxjsSessions.forEach(session=>{session.id==curSessionId&&(curSessionDatas=session.datas)}),curSessionDatas.length==0)return;let isExists=!1;curSessionDatas.forEach(kv=>{kv.key==key&&(kv.val=val,isExists=!0)}),isExists||curSessionDatas.push({key,val}),boxjsSessions.forEach(session=>{session.id==curSessionId&&(session.datas=curSessionDatas)}),this.setVal(this.boxjsSessionsKey,boxjsSessions.s())}setVal(key,val){return this.isSurge()||this.isLoon()||this.isStash()?(this.updateBoxjsSessions(key,val),$persistentStore.write(val,key)):this.isQuanX()?(this.updateBoxjsSessions(key,val),$prefs.setValueForKey(val,key)):this.isNode()?(this.data=this.loadData(),this.data[key]=val,this.writeData(),!0):this.data&&this.data[key]||null}loadData(){if(!this.isNode())return{};this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile),rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath);if(isCurDirDataFile||isRootDirDataFile){const datPath=isCurDirDataFile?curDirDataFilePath:rootDirDataFilePath;try{return this.fs.readFileSync(datPath).o()}catch{return{}}}else return{}}writeData(){if(!this.isNode())return;this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const curDirDataFilePath=this.path.resolve(this.dataFile),rootDirDataFilePath=this.path.resolve(process.cwd(),this.dataFile),isCurDirDataFile=this.fs.existsSync(curDirDataFilePath),isRootDirDataFile=!isCurDirDataFile&&this.fs.existsSync(rootDirDataFilePath),jsondata=this.data.s();isCurDirDataFile?this.fs.writeFileSync(curDirDataFilePath,jsondata):isRootDirDataFile?this.fs.writeFileSync(rootDirDataFilePath,jsondata):this.fs.writeFileSync(curDirDataFilePath,jsondata)}adapterStatus(response){return response&&(response.status?response.statusCode=response.status:response.statusCode&&(response.status=response.statusCode)),response}get(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.get(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="GET",$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.get(options))}post(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="POST",$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request.post(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}put(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?(options.method="PUT",$httpClient.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="PUT",$task.fetch(options).then(response=>{callback(null,this.adapterStatus(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?(options.method="PUT",this.node.request.put(options,(error,response,body)=>{callback(error,this.adapterStatus(response),body)})):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);for(;i--;)c+=(aa.pop()||0)+(bb.pop()||0),ret.unshift(c%10),c=Math.floor(c/10);for(;c;)ret.unshift(c%10),c=Math.floor(c/10);return ret.join("")}costTime(){let info=`${this.name}, 执行完毕！`;this.isNode()&&this.isExecComm&&(info=`指令【${this.comm[1]}】执行完毕！`);const endTime=(new Date).getTime(),ms=endTime-this.startTime,costTime=ms/1e3,count=this.sum(this.execCount,"1"),total=this.sum(this.costTotalMs,ms.s()),average=(Number(total)/Number(count)/1e3).toFixed(4);this.log(`${info}
${this.spaceSeparator}耗时【${costTime}】秒（含休眠${this.sleepTotalMs?(this.sleepTotalMs/1e3).toFixed(4):0}秒）
${this.spaceSeparator}总共执行【${count}】次，平均耗时【${average}】秒`),this.setVal(this.costTotalStringKey,`${total},${count}`.s())}done(value={}){this.costTime(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(value)}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj==""||obj=="null"||obj=="undefined"||obj.length===0}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length,pwd="";for(let i=0;i<len;i++)pwd+=chars.charAt(Math.floor(Math.random()*maxPos));return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){if(str+=``,str.length<len)for(;str.length<len;)direction==0?str+=fill:str=fill+str;if(ifCode){let temp=``;for(let i=0;i<clen;i++)temp+=cstr;str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}return str=prefix+str+suffix,this.toDBC(str)}customReplace(str,param,prefix,suffix){try{this.isEmpty(prefix)&&(prefix="#{"),this.isEmpty(suffix)&&(suffix="}");for(let i in param)str=str.replace(`${prefix}${i}${suffix}`,param[i])}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++)txtstring.charCodeAt(i)==32?tmp=tmp+String.fromCharCode(12288):txtstring.charCodeAt(i)<127&&(tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248));return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++)chr=str.charCodeAt(i),h=(h<<5)-h+chr,h|=0;return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};/(y+)/.test(format)&&(format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(format)&&(format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length)));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0)return c.substring(name.length).replace('"',"").trim()}return""}}(scriptName,scriptId,options)}