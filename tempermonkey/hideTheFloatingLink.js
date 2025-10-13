// ==UserScript==
// @name         隐藏左下角悬浮链接,并且配置网址打开链接方式
// @namespace    http://tampermonkey.net/
// @author       lowking
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==
(function() {
    'use strict';

    // 开发者模式,用来显示日志
    const devMode = false
    GM_info.script.version = "1.0.4"
    // 鼠标移到链接上,搜索其父节点的深度
    const searchDepth = 5
    let currentUrl;

    // 某些网址的a标签有自己的处理方式,不需要用到脚本的点击事件,一般配置能够动态加载数据不希望新页面打开或者刷新页码的
    const specialElementExclusion = {
        "[10|192|193|172|100|17|127]\.": [
            "all"// 本地ip
        ],
        "https:\/\/dash.cloudflare.com\/": [
            "all"// cf所有
        ],
        "https:\/\/www.youtube.com\/watch\?": [
            "#endpoint",// 油管章节跳转
        ],
        "https:\/\/www.douyu.com\/directory\/myFollow": [
            "#copy-cookie-btn",// 自用插件,复制douyu cookie
        ],
        "https:\/\/www.itdog.cn\/http\/#global_region": [
            "a.nav-link",// 测速区域的地区选择
        ],
        "https:\/\/gamebanana.com\/.*\/": [
            "a.PrimaryPreview",// 详情页的主图
            "a.SecondaryPreview",// 详情页的附图
        ],
        "https:\/\/www.bilibili.com": [
            "a[data-v-1e1051ac].header-dynamic__box--right",// 顶部动态列表的稍后再看
            "div.gm-card-switcher",// 稍后再看左边的加号
            "span.gm-hover",// 稍后再看右下角的浮动按钮
            "a.gm-entry-list-item",// 稍后再看插件的列表
        ],
        "https:\/\/github.com\/search": [
            "a[data-size]",// github搜索左边
        ],
        "https:\/\/zzz.liyin.space\/achievement": [
            "a[data-v-95413f33]",// 成就横幅点击
        ],
        "https:\/\/x.com\/": [
            "a[role=tab]",// 顶上多标签
            "a[aria-label]",// 侧边栏
        ],
        "http:\/\/.*.mynetgear.com:32400\/web\/index.html#!\/": [
            "a.user-select-container",// 登录页选登录账号
        ]
    }

    // 打开链接的方式,_blank:新标签页打开,_self:当前标签页打开
    const openTarget = {
        "https:\/\/github.com\/search": "_blank",
        "https:\\/\\/www.youtube.com\\/$": "_blank",
        "https:\\/\\/gamebanana.com\\/games": "_blank",
        "https:\\/\\/greasyfork.org\\/.*/scripts\\?": "_blank",
        "https:\\/\\/greasyfork.org\\/.*/scripts$": "_blank",
    }

    const whetherSelectorMatches = (target, selector, depth = 0) => {
        if (depth >= searchDepth) return
        ++depth
        let selectorTargets
        let matched = false
        selectorTargets = target.parentNode.querySelectorAll(selector)
        log(depth, " query selector: ", selector, selectorTargets)
        selectorTargets.forEach((e) => {
            if (e === target) {
                matched = true
                return false
            }
        })
        log(matched, target, selectorTargets)
        if (!matched) {
            let targetParent = target?.parentNode
            if (targetParent) {
                return whetherSelectorMatches(targetParent, selector, depth)
            }
        }
        return matched
    }

    const isExclude = (e) => {
        let target
        try {
            target = e?.target?.tagName === "A" ? e.target : e.target.closest('a')
        } catch (err) {
            target = e.target
            log(err)
        }
        log(e.target, target)
        log("Enter", currentUrl)
        for (const key in specialElementExclusion) {
            log("regex", key)
            if (!new RegExp(key).test(currentUrl)) continue
            const selectors = specialElementExclusion[key]
            for (const selector of selectors) {
                // 配置了all,直接返回
                if (selector === "all") return true
                let matched = false
                matched = whetherSelectorMatches(target, selector)
                if (matched) return true
            }
            log()
        }
        return false
    }

    const getConfigOpenTarget = () => {
        for (const key in openTarget) {
            const isMatch = new RegExp(key).test(currentUrl)
            log(currentUrl, key, isMatch, openTarget[key])
            if (isMatch) return openTarget[key]
        }
        return ""
    }

    const prefix = `[HTFL ${GM_info.script.version}]`
    const log = (...args) => {
        if (!devMode) return
        console.log(prefix, ...args)
    }

    const n = 2
    const colorCalculation = (color, value) => {
        const regexp = /[0-9]{1,3}/g
        const res = color.match(regexp)
        const r = parseInt(res[0])
        const g = parseInt(res[1])
        const b = parseInt(res[2])
        let finalR = r+value
        let finalG = g+value
        let finalB = b+value
        if (finalR > 255 || finalG > 255 || finalB > 255 ) {
            finalR = finalR - (value * n)
            finalG = finalG - (value * n)
            finalB = finalB - (value * n)
        }
        return `rgb(${finalR}, ${finalG}, ${finalB})`
    }

    const openNewBackgroundTab = (href) => {
        let a = document.createElement("a");
        a.href = href;
        let evt = document.createEvent("MouseEvents");
        //the tenth parameter of initMouseEvent sets ctrl key
        evt.initMouseEvent("click", true, true, window,
            0, 0, 0, 0, 0,
            false, false, false, true,
            0, null);
        a.dispatchEvent(evt)
    }

    // 存储原始链接数据
    const linkStore = new WeakMap()

    // 主处理函数
    const handleLink = (link, depth = 0) => {
        if (depth >= searchDepth) return
        ++depth
        if (!link) return
        // 向上查找所有父节点是a的,也修改,有的元素是a嵌套a的,必须把父节点以上的所有a都修改了
        let parentNode = link.parentNode
        switch (parentNode?.tagName) {
            case "A":
                handleLink(parentNode, depth)
                break
            case "BODY":
                break
            default:
                handleLink(parentNode?.parentNode, depth)
        }

        if (!link.href || linkStore.has(link) || link?.tagName !== "A") return;

        const clickHandler = (e) => {
            const link = e?.target?.tagName === "A" ? e.target : e.target.closest('a')
            const data = linkStore.get(link)
            try {
                log("clicked", link, data)
                link.setAttribute("href", data.href)
                // 根据配置判断是否阻断原事件
                if (isExclude(e) || e?.button !== 0) return // 只处理左键点击
                e.stopPropagation()
                e.preventDefault()
                if (e.shiftKey && e.metaKey) {
                    window.open(data.href, '_blank')
                    return
                }
                if (e.metaKey) {
                    openNewBackgroundTab(data.href)
                    return
                }
                // 从配置获取打开方式
                const configOpenTarget = getConfigOpenTarget()
                if (configOpenTarget) {
                    log("open by config", configOpenTarget)
                    window.open(data.href, configOpenTarget)
                    return
                }
                if (data?.target === '_blank') {
                    log("open by data target", data.target)
                    window.open(data.href, '_blank')
                    restoreLink(link)
                } else {
                    log("finally open self")
                    location.href = data.href
                }
            } finally {
                linkStore.set(link, data)
                link.setAttribute("original_href", link.getAttribute("href") || link.getAttribute("original_href"))
                setTimeout(() => {
                    link.removeAttribute("href")
                }, 100)
                log("finally", data)
            }
        }

        const originalColor = window.getComputedStyle(link).color
        // 保存原始数据
        linkStore.set(link, {
            href: link.href,
            target: link.target,
            color: originalColor, // 保存原始颜色
            events: link.events || [],
        });

        // 添加originalHref保存原始url,给copylinkaddress插件使用
        link.setAttribute('original_href', link.href);
        // 关键点：完全移除href属性
        link.removeAttribute('href');
        link.style.color = originalColor; // 强制保持原始颜色

        // 添加视觉样式修复
        link.style.cursor = 'pointer';

        // 添加点击事件处理
        if (!link.getAttribute('htfl_click')) {
            link.setAttribute('htfl_click', "1");
            link.addEventListener('click', clickHandler, true);
            linkStore.get(link).events.push(['click', clickHandler]);
        }
        const data = linkStore.get(link);
        log(data)
    };

    // 恢复原始链接
    const restoreLink = (link) => {
        if (!link) return
        // 向上查找所有父节点是a的,也修改,有的元素是a嵌套a的,必须把父节点以上的所有a都修改了
        let parentNode = link.parentNode
        switch(parentNode?.tagName){
            case "A":
                restoreLink(parentNode)
                break
            case "BODY":
                break
            default:
                restoreLink(parentNode?.parentNode)
        }

        log("Mouse out")
        const data = linkStore.get(link);
        if (!data) return;
        log(data)
        // 移除事件监听
        data.events.forEach(([type, handler]) => {
            link.removeEventListener(type, handler);
        });

        // 恢复属性
        link.href = data.href;
        link.removeAttribute('original_href');
        if (data?.target) link.target = data.target;
        link.style.color = data.color; // 清除颜色强制样式

        linkStore.delete(link);
        link.style.cursor = '';
        if (!link.getAttribute('style')) link.removeAttribute('style')
    };

    // 事件监听
    document.addEventListener('mouseover', (e) => {
        try {
            const link = e?.target?.tagName === "A" ? e.target : e.target.closest('a')
            log("Mouse over", link)
            const data = linkStore.get(link)
            if (!data && link) {
                handleLink(link)
                const originalColor = window.getComputedStyle(link).color
                const finalColor = colorCalculation(originalColor, 15)
                link.style.color = finalColor
            }
        } catch (err) {}
    }, true);

    document.addEventListener('mouseout', (e) => {
        const link = e?.target?.tagName === "A" ? e.target : e.target.closest('a')
        log("Mouse out", link)
        if (link) restoreLink(link)
    }, true);

    // 处理初始链接
    const initLinks = () => {
        currentUrl = window.location.href
        setTimeout(() => {
            document.querySelectorAll('a[href]').forEach((link) => {
                handleLink(link)
                restoreLink(link)
            });
        }, 10)
    };

    // 动态内容监听
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    node.querySelectorAll('a[href]').forEach((link) => {
                        handleLink(link)
                        restoreLink(link)
                    });
                }
            });
        });
    });

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLinks);
    } else {
        initLinks();
    }
    observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['href']
    });
})();