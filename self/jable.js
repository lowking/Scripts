// ==UserScript==
// @name         获取番号指令
// @namespace    http://tampermonkey.net/
// @version      2025-03-11
// @description  try to take over the world!
// @author       lowking
// @match        https://jable.tv/*
// @icon         http://jable.tv/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==
var x, y
const commandTemplate = "/av #avNo#"
const botToken = "bot"
const chatId = "-100"
const tgBotApi = `https://api.telegram.org/${botToken}/sendMessage?chat_id=${chatId}&parse_mode=Markdown&text=`

const send2Bot = (text) => {
    let xhr = new XMLHttpRequest()
    xhr.open("GET", `${tgBotApi}${text}`)
    xhr.send()
}

const getCommand = () => {
    const elements = document.elementsFromPoint(x, y)
    elements.forEach((e) => {
        if (e.tagName != "A") return
        let avNo = e?.href || ""
        avNo = avNo.split("/")
        avNo = avNo[avNo.length - 2]
        if (!avNo) return
        avNo = avNo.toUpperCase()
        const ret = `${commandTemplate}`.replaceAll("#avNo#", avNo)
        send2Bot(ret)
        iziToast.show({
            color: 'dark',
            icon: 'icon-contacts',
            title: ret,
            position: 'topCenter',
            transitionIn: 'flipInX',
            transitionOut: 'flipOutX',
            progressBarColor: 'rgb(0, 255, 184)',
            imageWidth: 5,
            layout:2,
            timeout: 2000,
            progressBar: true,
            iconColor: 'rgb(0, 255, 184)'
        })
    })
}

const copyText = (text) => {
    if (navigator.clipboard) {
        // clipboard api 复制
        navigator.clipboard.writeText(text);
    } else {
        var textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        // 隐藏此输入框
        textarea.style.position = 'fixed';
        textarea.style.clip = 'rect(0 0 0 0)';
        textarea.style.top = '10px';
        // 赋值
        textarea.value = text;
        // 选中
        textarea.select();
        // 复制
        document.execCommand('copy', true);
        // 移除输入框
        document.body.removeChild(textarea);
    }
}

const noticeFlowStyle = `
.iziToast-capsule {
font-size: 0;
height: auto;
max-height: 1000px;
width: 100%;
transform: translateZ(0);
backface-visibility: hidden;
transition: all .5s cubic-bezier(.25, .8, .25, 1)
}

.iziToast {
display: inline-block;
clear: both;
position: relative;
padding: 0;
font-family: Lato, arial;
font-size: 14px;
padding: 8px 50px 9px 0;
background: #eee;
border-color: #eee;
/*min-height: 54px;*/
min-height: 35px;
width: 100%;
pointer-events: all
}

.iziToast > .iziToast-progressbar {
position: absolute;
left: 0;
bottom: 0;
width: 100%;
z-index: 1;
background: hsla(0, 0%, 100%, .2)
}

.iziToast > .iziToast-progressbar > div {
height: 2px;
width: 100%;
background: rgba(0, 0, 0, .3);
border-radius: 0 0 3px 3px
}

.iziToast.iziToast-balloon:before {
content: '';
position: absolute;
right: 8px;
left: auto;
width: 0;
height: 0;
top: 100%;
border-right: 0 solid transparent;
border-left: 15px solid transparent;
border-top: 10px solid #000;
border-top-color: inherit;
border-radius: 0
}

.iziToast.iziToast-balloon .iziToast-progressbar {
top: 0;
bottom: auto
}

.iziToast.iziToast-balloon > div {
border-radius: 0 0 0 3px
}

.iziToast > .iziToast-cover {
position: absolute;
left: 0;
top: 0;
bottom: 0;
height: 100%;
margin: 0;
background-size: 100%;
background-position: 50% 50%;
background-repeat: no-repeat;
background-color: rgba(0, 0, 0, .1)
}

.iziToast > .iziToast-close {
position: absolute;
right: 0;
top: 0;
border: 0;
padding: 0;
opacity: .6;
width: 42px;
height: 100%;
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAJPAAACTwBcGfW0QAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAD3SURBVFiF1ZdtDoMgDEBfdi4PwAX8vLFn0qT7wxantojKupmQmCi8R4tSACpgjC2ICCUbEBa8ingjsU1AXRBeR8aLN64FiknswN8CYefBBDQ3whuFESy7WyQMeC0ipEI0A+0FeBvHUFN8xPaUhAH/iKoWsnXHGegy4J0yxialOfaHJAz4bhRzQzgDvdGnz4GbAonZbCQMuBm1K/kcFu8Mp1N2cFFpsxsMuJqqbIGExGl4loARajU1twskJLLhIsID7+tvUoDnIjTg5T9DPH9EBrz8rxjPzciAl9+O8SxI8CzJ8CxKFfh3ynK8Dyb8wNHM/XDqejx/AtNyPO87tNybAAAAAElFTkSuQmCC") no-repeat 50% 50%;
background-size: 8px;
cursor: pointer;
outline: none
}

.iziToast > .iziToast-close:hover {
opacity: 1
}

.iziToast > .iziToast-body {
position: relative;
padding: 0 0 0 10px;
height: 100%;
min-height: 17px;
margin: 0 0 0 16px
}

.iziToast > .iziToast-body:after {
content: "";
display: table;
clear: both
}

.iziToast > .iziToast-body > .iziToast-buttons {
min-height: 17px;
display: inline-block;
margin: 0 -2px
}

.iziToast > .iziToast-body > .iziToast-buttons > a, .iziToast > .iziToast-body > .iziToast-buttons > button {
display: inline-block;
margin: 6px 2px;
border-radius: 2px;
border: 0;
padding: 5px 10px;
font-size: 12px;
letter-spacing: .02em;
cursor: pointer;
background: rgba(0, 0, 0, .1);
color: #000
}

.iziToast > .iziToast-body > .iziToast-buttons > a:hover, .iziToast > .iziToast-body > .iziToast-buttons > button:hover {
background: rgba(0, 0, 0, .2)
}

.iziToast > .iziToast-body > .iziToast-icon {
height: 100%;
position: absolute;
left: 0;
top: 50%;
display: table;
font-size: 23px;
line-height: 24px;
margin-top: -12px;
color: #000
}

.iziToast > .iziToast-body > .iziToast-icon.ico-info {
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAG9AAABvQG676d5AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAL1QTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAguN3MAAAAD50Uk5TAAECAwQJChATFBsiJigpKiswMTY5SExdYmZocHF3gIWLkZSdn6Gpqqyws7y9wMrNz9DU5OXm7O/09/r7/P576NJaAAABQUlEQVRYw+3X507DQBBGUadAeu+k917s9GQz7/9YoASDQzy7swMSCPn+zncU70qWbBiysuPNZpw12JVO8NapxN3HDnDtEGMCTXivyQRmNjBjAqYNmL8CRCpTYQNiWolozhODM9x1HiQ05tGegIdEL0rdF3fg2q5ImvtbF0C6tPzqva8Lkro+JdAGaW3VvgaKavJ98qgCjknZPrAAZYuABCgDobLkBiwKYOE3UQBSBRQY0YAReoR7GrDHjjEHxHIIUKcCdQToUIEOAgypwBAB5lRgjgArKrBSvYVVmR7gAR7w3wGLClju+waQa3xz7ypo7V0Ezf2DoL3/IjD2d0IaWKU/gAwPyPwcEH5hFTb+eHHnv40zgLzzvPIM4Nnx1SKeOM/Q/wT6rEMIre39OsQ7xtTytl+muBcRrE6220k1KPvNK+p25cd3vT+OAAAAAElFTkSuQmCC") no-repeat 50% 50%;
background-size: 85%;
width: 24px;
height: 24px
}

.iziToast > .iziToast-body > .iziToast-icon.ico-warning {
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAABECAYAAAA4E5OyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTMyIDc5LjE1OTI4NCwgMjAxNi8wNC8xOS0xMzoxMzo0MCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMWRjNjc0NS0yZDRmLWQyNDctODczZS02Yjk4NjgzNTU0NWIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDNEMzQ3Q0M5NzA2MTFFNkEyNDU4OEU1RkRBRDkzREQiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDNEMzQ3Q0I5NzA2MTFFNkEyNDU4OEU1RkRBRDkzREQiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUuNSAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowMWRjNjc0NS0yZDRmLWQyNDctODczZS02Yjk4NjgzNTU0NWIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDFkYzY3NDUtMmQ0Zi1kMjQ3LTg3M2UtNmI5ODY4MzU1NDViIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+pK1ECgAABPFJREFUeNrsW0lrFEEUrqqeRB0j0QQiRiJojDsYXIIbLnhQEBdQBC9uFw+JeBAUQfSiqH/C5SfoVVRQXPAgKCoal6BoXNBoMIjo2OX3pkudJD2dmpmq7p6e+aBmmunprldfffXq1etqLqVkUYPz1B76ljJzLnJboiaEcz6aM9GdJYS5M2DPjyjtEZHLg4lOfLR4JXtcuQqBOuqhjpc4bFA/9UEl02BTf0UqRDBxOIcMQoP6rfIUAnU0Qx3PcJgecuo7VNIGu3orSiFQwnEfMghpda5yFAJ1zIA6HuEwlecvGahkLmzrTjwhIEOAjAc4nDvCX8nBtsK+rwkfMs4uDTL+OthDiVZIThDWonkJOdjpsPFdQhXyLwjTBTnYY4lUiE8QpgtysLNh5/NEKcQnCNNFCteeSJRCAoIwXcBKdxFsvZcIhQQEYfqcMn4qEQrRCML0ZcLEWil/XS1rhaBnT5ogw7uXPF3WQwbq6MDnNnN3lIs5T20t2yEjuIC8+Zr/kneLVMagfnuq1jm/y0ohnNesyyXDIGYi/N9TVgrhBCZoimwf7BSNKITwVoX0P8pEIc6OoWT8bVgxxQeTYfp+K6aTQkwWoAaNeIEiNQoWbc5OXDMRZQKOt9DiT/PaPqrLuP3mCRH7NRv0AX9u8iE0jXMPde5BdcWaEKCOGqrZmH3575NaXQCpdSbbYNiHiIPU63r/da8ELHBv4+OXxk2aVJ3xm2UwrzSR76Ae0wvD3TFBs4TgznvlW0bCgEo1fozVLIMF3FFdMgyjTtUdH4VAHVOhjic4rNVfqBlTCOEn7jcL9+uJhUJUAqeWRYdaU0kkYUAd7dDYDhYxyAayJXpCvMQNZ9HDSBJJlGZBDRZvfD2LDfh6z6aoCAkhYRO2TaJ4dVCiRnaw2EF2lJJEEsWRwVPoiZMspiDbyMYQFeLs9RI1scVMZaP9wAzMp9UzlubSpkmjgZkfetXGm++WFSIOlEpGSGhWttpTCNTRoJ7P1pceSFlXCKFfbeLrs6IQhMdHTJChMDHIaeNrvIE66pXN5ocMjGyBlrrMKdpZGXByIcooQyF9F9muf4F2Jkmc1cxi6ZZXqH6cT9bN4cy5Y7Iust1oChGYgxtnDBNC5THuvYp5jzpJrQtAxk0L9WSoDTpt1XKqgouLGDSbLM4I5FzpSdxYixHsJVe6m0ueZTD+loHhmywBwIyzHO29VZJThYTPsIRApy1ihAXcRvC6giUGcoXXpiKGjNpgex+H8yxa+A21n2DMpU0wP9E/yzljxw0EZEF4iKEzH+12C5p2aYOtBW+fW76gklafGa0R53ps1k1tK2japaCI4gS7RonOgM7YYLkzKAYaVcCTu+wG2yl2x7N7Of+539fUNGwLU/K9vTXMh6gNtvQErtHyFNiCut/kT0CJAVPhex58Vk/8+gNnGbXhvtG+x3eWBJxst0xG1lf5vVwwSCHomUnoGdpCnbZPCHupvP3AEHXQWuYGNLQ0BBuGvVwghqjjWEhkEKaB/LsgYFV2iNA0zzmtZa6HRAZh2MsF/xQCY9rUYivFwkcIa5m8oJcLaOH3bJBChJdui4IMwuiIyCCkRE6qMasQKBZBmDzPKhhgYbeUmQtcBWHd9uOO2OM1vWrvUGYarGxnVdRjwHyhDbafwok7ygKfubeuqEI7Y1ZpEFUKqoRUCSkEfwQYALtKyHv0Xn99AAAAAElFTkSuQmCC") no-repeat 50% 50%;
background-size: 85%;
width: 24px;
height: 24px
}

.iziToast > .iziToast-body > .iziToast-icon.ico-error {
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAG9AAABvQG676d5AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAORQTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgEmT/QAAAEt0Uk5TAAEDBQYLEBUYGxwyNTZAQkVGTVRVVldYWVpiY2Rpa3BydX+Bh4qPmZuio6SoqbCys7a6u76/wsPExcrNztLY293e4+bx8vX3+/3+EVs5KAAAAsdJREFUWMOtl2l76UAUgE8oUarUVlpqqa3XUtSulBRF/v//qZs5kwySmPPcO1+SzJk3yZx9AByGL5avNPqLzWbRb1TyMR+Qhvr0/qOfjJ/3J1WWvsmN9rrN2A9zNxK4klnpjmOVUa7xD5+66/h8cMVvP/Sr4+PWmb/7FlfuVuNWtVgo19vzgzj/fefEPwqaXzfTfsEqyZomWOTRXnuv1pJu1Hsu9iQmlvzVRpfKH1M8i9j/YbhnLnm7fIP5fc3FVNk1X1W62D+XDF0dLjjAZYf4mf65/mpeVzsHv/iHtqET+6P9di8gyR+3GhAE3H8IvK53BP/l/0/hdf3etCD6/1By/1+oySk3VwY3pUrywSBaM4Xxj/GbkeWP/sBulyw/5ND/FGkeAH0yZ8hG7CFC4CHMnkZGpLH81aXwACyy9n/V9sxEURIPCTbxfLztsPj3knjwaNyZfCwKmjQeoMZyiw9iTJgm8pBkkzHIsyjyE3lQWZ7MQ4UlfCoPMDemK9AwrmMyD21jvgF949oi81A3BH1YGNcqmYeyIVnAxrgWyTwUDNEGX1Ag81DEF7AtlMk8VHELTIl1Mg8tVCIzY5vMwxjNyBxpTuZhhY7EXPmgUnn/Dl0ZgylJ5CHNgwnDuUbkocnDGROK5qHx3rVZnTClJUg8RK2Uhkl1QuKhayVVntbDFD4ipHVeWHoEXpmJhYWXtqw0z6spljb+uA7K8qp2UlzN8j6Q5L3Ds/JuNhhyPJYEocGwWhwp/uWyxTGbLCl+Z9NkWW3e1f3XbNs8odEcuL5AHTo0mkKru866nGY0x1YXlDdTC72wg//O3JptUErWsWKS8FxsPto1xYeSfT8V3wqNbC0pZDl/urm2ZNu40x5DmugPh3m7Xi4Uq63xaifOayFnJQc61w9dnYCrne+n7vj0/urBM7V0xpepqwfPfz/6/ofDN+34/wtfWqtteombTwAAAABJRU5ErkJggg==") no-repeat 50% 50%;
background-size: 80%;
width: 24px;
height: 24px
}

.iziToast > .iziToast-body > .iziToast-icon.ico-check {
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAItAAACLQHlZp/kAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAD9QTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxQXeHgAAABR0Uk5TAAMGCCAhIiNVV1lboaTb4OHi4/zOYgETAAAAuklEQVRYhe2VyxbCIAxEg+K7FZX8/7e6EFqPp6VhZuEms793EZJBxOP5d3YkH+9njk+aLxyvmq8crzqQ/Bicd975OXuSv6UTx2d9GQwtXg2G9fkNqgZDY/5hNBia71cMzyPIGwyb+7NhMOxf02Da34bBuP/F8DiA/Kqh4/4WDV33u2DovP9qiCA/GVIE+R8D1F9fBrD/JgPcn9WA928xEP09G9D+rwb4/ygGnP8YGF4kjBwvEkje4+nMG2DWH9EwoSnuAAAAAElFTkSuQmCC") no-repeat 50% 50%;
background-size: 85%;
width: 24px;
height: 24px
}

.iziToast > .iziToast-body > strong {
padding: 0 10px 0 0;
margin: 10px 0 -10px;
line-height: 16px;
font-size: 14px;
float: left;
color: #000
}

.iziToast > .iziToast-body > p {
color: rgba(0, 0, 0, .6);
padding: 0;
margin: 10px 0;
font-size: 14px;
line-height: 16px;
text-align: left;
float: left
}

.iziToast.iziToast-animateInside .iziToast-buttons *, .iziToast.iziToast-animateInside .iziToast-icon, .iziToast.iziToast-animateInside p, .iziToast.iziToast-animateInside strong {
opacity: 0
}

.iziToast.iziToast-color-red {
background: rgba(243, 186, 189, .85);
border-color: rgba(243, 186, 189, .85)
}

.iziToast.iziToast-color-yellow {
background: hsla(55, 75%, 81%, .85);
border-color: hsla(55, 75%, 81%, .85)
}

.iziToast.iziToast-color-blue {
background: rgba(181, 225, 249, .85);
border-color: rgba(181, 225, 249, .85)
}

.iziToast.iziToast-color-green {
background: rgba(180, 241, 196, .85);
border-color: rgba(180, 241, 196, .85)
}

.iziToast.iziToast-color-dark {
background: #565c70;
border-color: #565c70
}

.iziToast.iziToast-color-dark strong {
color: #fff
}

.iziToast.iziToast-color-dark p {
color: hsla(0, 0%, 100%, .7);
font-weight: 300
}

.iziToast.iziToast-color-dark .iziToast-close {
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADdcAAA3XAUIom3gAAAAHdElNRQfgCR4OIQIPSao6AAAAwElEQVRIx72VUQ6EIAwFmz2XB+AConhjzqTJ7JeGKhLYlyx/BGdoBVpjIpMJNjgIZDKTkQHYmYfwmR2AfAqGFBcO2QjXZCd24bEggvd1KBx+xlwoDpYmvnBUUy68DYXD77ESr8WDtYqvxRex7a8oHP4Wo1Mkt5I68Mc+qYqv1h5OsZmZsQ3gj/02h6cO/KEYx29hu3R+VTTwz6D3TymIP1E8RvEiiVdZfEzicxYLiljSxKIqlnW5seitTW6uYnv/Aqh4whX3mEUrAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE2LTA5LTMwVDE0OjMzOjAyKzAyOjAwl6RMVgAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNi0wOS0zMFQxNDozMzowMiswMjowMOb59OoAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAAAAElFTkSuQmCC") no-repeat 50% 50%;
background-size: 8px
}

.iziToast.iziToast-color-dark .iziToast-icon {
color: #fff
}

.iziToast.iziToast-color-dark strong {
font-weight: 500
}

.iziToast.iziToast-color-dark .iziToast-buttons a, .iziToast.iziToast-color-dark .iziToast-buttons button {
color: #fff;
background: hsla(0, 0%, 100%, .1)
}

.iziToast.iziToast-color-dark .iziToast-buttons a:hover, .iziToast.iziToast-color-dark .iziToast-buttons button:hover {
background: hsla(0, 0%, 100%, .2)
}

.iziToast-target {
position: relative;
width: 100%;
margin: 0 auto
}

.iziToast-target .iziToast {
width: 100%
}

.iziToast-wrapper {
position: fixed;
z-index: 999999999999999;
width: 100%;
pointer-events: none;
display: flex;
flex-direction: column
}

.iziToast-wrapper .iziToast.iziToast-balloon:before {
border-right: 0 solid transparent;
border-left: 15px solid transparent;
border-top: 10px solid #000;
border-top-color: inherit;
right: 8px;
left: auto
}

.iziToast-wrapper-bottomLeft {
left: 0;
bottom: 0
}

.iziToast-wrapper-bottomLeft .iziToast.iziToast-balloon:before {
border-right: 15px solid transparent;
border-left: 0 solid transparent;
right: auto;
left: 8px
}

.iziToast-wrapper-bottomRight {
right: 0;
bottom: 0;
text-align: right
}

.iziToast-wrapper-topLeft {
left: 0;
top: 0
}

.iziToast-wrapper-topLeft .iziToast.iziToast-balloon:before {
border-right: 15px solid transparent;
border-left: 0 solid transparent;
right: auto;
left: 8px
}

.iziToast-wrapper-topRight {
top: 0;
right: 0;
text-align: right
}

.iziToast-wrapper-topCenter {
top: 0;
left: 0;
right: 0;
text-align: center
}

.iziToast-wrapper-bottomCenter, .iziToast-wrapper-center {
bottom: 0;
left: 0;
right: 0;
text-align: center
}

.iziToast-wrapper-center {
top: 0;
justify-content: center;
flex-flow: column;
align-items: center
}

.iziToast-rtl {
direction: rtl;
padding: 8px 0 9px 50px
}

.iziToast-rtl .iziToast-cover {
left: auto;
right: 0
}

.iziToast-rtl .iziToast-close {
right: auto;
left: 0
}

.iziToast-rtl .iziToast-body {
padding: 0 10px 0 0;
margin: 0 16px 0 0
}

.iziToast-rtl .iziToast-body strong {
padding: 0 0 0 10px
}

.iziToast-rtl .iziToast-body p, .iziToast-rtl .iziToast-body strong {
float: right
}

.iziToast-rtl .iziToast-body .iziToast-icon {
left: auto;
right: 0
}

@media only screen and (min-width: 568px) {
.iziToast {
    margin: 5px 0;
    border-radius: 3px;
    width: auto
}

.iziToast:after {
    content: '';
    z-index: -1;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 3px;
    box-shadow: inset 0 -10px 20px -10px rgba(0, 0, 0, .2), inset 0 0 5px rgba(0, 0, 0, .1), 0 8px 8px -5px rgba(0, 0, 0, .25)
}

.iziToast.iziToast-color-dark:after {
    box-shadow: inset 0 -10px 20px -10px hsla(0, 0%, 100%, .3), 0 10px 10px -5px rgba(0, 0, 0, .25)
}

.iziToast.iziToast-balloon .iziToast-progressbar {
    background: transparent
}

.iziToast.iziToast-balloon:after {
    box-shadow: 0 10px 10px -5px rgba(0, 0, 0, .25), inset 0 10px 20px -5px rgba(0, 0, 0, .25)
}

.iziToast-wrapper {
    padding: 10px 15px
}

.iziToast-cover {
    border-radius: 3px 0 0 3px
}
}

.revealIn {
-webkit-animation: a 1s cubic-bezier(.25, 1.6, .25, 1) both;
animation: a 1s cubic-bezier(.25, 1.6, .25, 1) both
}

@-webkit-keyframes a {
0% {
    opacity: 0;
    -webkit-transform: scale3d(.3, .3, 1)
}
to {
    opacity: 1
}
}

.slideIn {
-webkit-animation: b 1s cubic-bezier(.16, .81, .32, 1) both;
animation: b 1s cubic-bezier(.16, .81, .32, 1) both
}

@-webkit-keyframes b {
0% {
    opacity: 0;
    -webkit-transform: translateX(50px)
}
to {
    opacity: 1;
    -webkit-transform: translateX(0)
}
}

.bounceInLeft {
-webkit-animation: c .8s ease-in-out both;
animation: c .8s ease-in-out both
}

@-webkit-keyframes c {
0% {
    opacity: 0;
    -webkit-transform: translateX(280px)
}
50% {
    opacity: 1;
    -webkit-transform: translateX(-20px)
}
70% {
    -webkit-transform: translateX(10px)
}
to {
    -webkit-transform: translateX(0)
}
}

.bounceInRight {
-webkit-animation: d .8s ease-in-out both;
animation: d .8s ease-in-out both
}

@-webkit-keyframes d {
0% {
    opacity: 0;
    -webkit-transform: translateX(-280px)
}
50% {
    opacity: 1;
    -webkit-transform: translateX(20px)
}
70% {
    -webkit-transform: translateX(-10px)
}
to {
    -webkit-transform: translateX(0)
}
}

.bounceInDown {
-webkit-animation: e .7s ease-in-out both;
animation: e .7s ease-in-out both
}

@-webkit-keyframes e {
0% {
    opacity: 0;
    -webkit-transform: translateY(-200px)
}
50% {
    opacity: 1;
    -webkit-transform: translateY(10px)
}
70% {
    -webkit-transform: translateY(-5px)
}
to {
    -webkit-transform: translateY(0)
}
}

.bounceInUp {
-webkit-animation: f .7s ease-in-out both;
animation: f .7s ease-in-out both
}

@-webkit-keyframes f {
0% {
    opacity: 0;
    -webkit-transform: translateY(200px)
}
50% {
    opacity: 1;
    -webkit-transform: translateY(-10px)
}
70% {
    -webkit-transform: translateY(5px)
}
to {
    -webkit-transform: translateY(0)
}
}

.fadeIn {
-webkit-animation: g .5s ease both;
animation: g .5s ease both
}

.fadeInUp {
-webkit-animation: h .7s ease both;
animation: h .7s ease both
}

.fadeInDown {
-webkit-animation: i .7s ease both;
animation: i .7s ease both
}

.fadeInLeft {
-webkit-animation: j .9s cubic-bezier(.25, .8, .25, 1) both;
animation: j .9s cubic-bezier(.25, .8, .25, 1) both
}

.fadeInRight {
-webkit-animation: k .9s cubic-bezier(.25, .8, .25, 1) both;
animation: k .9s cubic-bezier(.25, .8, .25, 1) both
}

.flipInX {
-webkit-animation: l .9s cubic-bezier(.35, 0, .25, 1) both;
animation: l .9s cubic-bezier(.35, 0, .25, 1) both
}

.fadeOut {
-webkit-animation: m .7s ease both;
animation: m .7s ease both
}

.fadeOutDown {
-webkit-animation: n .7s cubic-bezier(.4, .45, .15, .91) both;
animation: n .7s cubic-bezier(.4, .45, .15, .91) both
}

.fadeOutUp {
-webkit-animation: o .7s cubic-bezier(.4, .45, .15, .91) both;
animation: o .7s cubic-bezier(.4, .45, .15, .91) both
}

.fadeOutLeft {
-webkit-animation: p .7s cubic-bezier(.4, .45, .15, .91) both;
animation: p .7s cubic-bezier(.4, .45, .15, .91) both
}

.fadeOutRight {
-webkit-animation: q .7s cubic-bezier(.4, .45, .15, .91) both;
animation: q .7s cubic-bezier(.4, .45, .15, .91) both
}

.flipOutX {
-webkit-backface-visibility: visible !important;
backface-visibility: visible !important;
-webkit-animation: r .7s cubic-bezier(.4, .45, .15, .91) both;
animation: r .7s cubic-bezier(.4, .45, .15, .91) both
}

@-webkit-keyframes a {
0% {
    opacity: 0;
    transform: scale3d(.3, .3, 1)
}
to {
    opacity: 1
}
}

@keyframes a {
0% {
    opacity: 0;
    transform: scale3d(.3, .3, 1)
}
to {
    opacity: 1
}
}

@-webkit-keyframes b {
0% {
    opacity: 0;
    transform: translateX(50px)
}
to {
    opacity: 1;
    transform: translateX(0)
}
}

@keyframes b {
0% {
    opacity: 0;
    transform: translateX(50px)
}
to {
    opacity: 1;
    transform: translateX(0)
}
}

@-webkit-keyframes c {
0% {
    opacity: 0;
    transform: translateX(280px)
}
50% {
    opacity: 1;
    transform: translateX(-20px)
}
70% {
    transform: translateX(10px)
}
to {
    transform: translateX(0)
}
}

@keyframes c {
0% {
    opacity: 0;
    transform: translateX(280px)
}
50% {
    opacity: 1;
    transform: translateX(-20px)
}
70% {
    transform: translateX(10px)
}
to {
    transform: translateX(0)
}
}

@-webkit-keyframes d {
0% {
    opacity: 0;
    transform: translateX(-280px)
}
50% {
    opacity: 1;
    transform: translateX(20px)
}
70% {
    transform: translateX(-10px)
}
to {
    transform: translateX(0)
}
}

@keyframes d {
0% {
    opacity: 0;
    transform: translateX(-280px)
}
50% {
    opacity: 1;
    transform: translateX(20px)
}
70% {
    transform: translateX(-10px)
}
to {
    transform: translateX(0)
}
}

@-webkit-keyframes e {
0% {
    opacity: 0;
    transform: translateY(-200px)
}
50% {
    opacity: 1;
    transform: translateY(10px)
}
70% {
    transform: translateY(-5px)
}
to {
    transform: translateY(0)
}
}

@keyframes e {
0% {
    opacity: 0;
    transform: translateY(-200px)
}
50% {
    opacity: 1;
    transform: translateY(10px)
}
70% {
    transform: translateY(-5px)
}
to {
    transform: translateY(0)
}
}

@-webkit-keyframes f {
0% {
    opacity: 0;
    transform: translateY(200px)
}
50% {
    opacity: 1;
    transform: translateY(-10px)
}
70% {
    transform: translateY(5px)
}
to {
    transform: translateY(0)
}
}

@keyframes f {
0% {
    opacity: 0;
    transform: translateY(200px)
}
50% {
    opacity: 1;
    transform: translateY(-10px)
}
70% {
    transform: translateY(5px)
}
to {
    transform: translateY(0)
}
}

@-webkit-keyframes g {
0% {
    opacity: 0
}
to {
    opacity: 1
}
}

@keyframes g {
0% {
    opacity: 0
}
to {
    opacity: 1
}
}

@-webkit-keyframes h {
0% {
    opacity: 0;
    -webkit-transform: translate3d(0, 100%, 0);
    transform: translate3d(0, 100%, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@keyframes h {
0% {
    opacity: 0;
    -webkit-transform: translate3d(0, 100%, 0);
    transform: translate3d(0, 100%, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@-webkit-keyframes i {
0% {
    opacity: 0;
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@keyframes i {
0% {
    opacity: 0;
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@-webkit-keyframes j {
0% {
    opacity: 0;
    -webkit-transform: translate3d(300px, 0, 0);
    transform: translate3d(300px, 0, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@keyframes j {
0% {
    opacity: 0;
    -webkit-transform: translate3d(300px, 0, 0);
    transform: translate3d(300px, 0, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@-webkit-keyframes k {
0% {
    opacity: 0;
    -webkit-transform: translate3d(-300px, 0, 0);
    transform: translate3d(-300px, 0, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@keyframes k {
0% {
    opacity: 0;
    -webkit-transform: translate3d(-300px, 0, 0);
    transform: translate3d(-300px, 0, 0)
}
to {
    opacity: 1;
    -webkit-transform: none;
    transform: none
}
}

@-webkit-keyframes l {
0% {
    -webkit-transform: perspective(400px) rotateX(90deg);
    transform: perspective(400px) rotateX(90deg);
    opacity: 0
}
0%, 40% {
    -webkit-animation-timing-function: ease-in;
    animation-timing-function: ease-in
}
40% {
    -webkit-transform: perspective(400px) rotateX(-20deg);
    transform: perspective(400px) rotateX(-20deg)
}
60% {
    -webkit-transform: perspective(400px) rotateX(10deg);
    transform: perspective(400px) rotateX(10deg);
    opacity: 1
}
80% {
    -webkit-transform: perspective(400px) rotateX(-5deg);
    transform: perspective(400px) rotateX(-5deg)
}
to {
    -webkit-transform: perspective(400px);
    transform: perspective(400px)
}
}

@keyframes l {
0% {
    -webkit-transform: perspective(400px) rotateX(90deg);
    transform: perspective(400px) rotateX(90deg);
    opacity: 0
}
0%, 40% {
    -webkit-animation-timing-function: ease-in;
    animation-timing-function: ease-in
}
40% {
    -webkit-transform: perspective(400px) rotateX(-20deg);
    transform: perspective(400px) rotateX(-20deg)
}
60% {
    -webkit-transform: perspective(400px) rotateX(10deg);
    transform: perspective(400px) rotateX(10deg);
    opacity: 1
}
80% {
    -webkit-transform: perspective(400px) rotateX(-5deg);
    transform: perspective(400px) rotateX(-5deg)
}
to {
    -webkit-transform: perspective(400px);
    transform: perspective(400px)
}
}

@-webkit-keyframes m {
0% {
    opacity: 1
}
to {
    opacity: 0
}
}

@keyframes m {
0% {
    opacity: 1
}
to {
    opacity: 0
}
}

@-webkit-keyframes n {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(0, 100%, 0);
    transform: translate3d(0, 100%, 0)
}
}

@keyframes n {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(0, 100%, 0);
    transform: translate3d(0, 100%, 0)
}
}

@-webkit-keyframes o {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0)
}
}

@keyframes o {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0)
}
}

@-webkit-keyframes p {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(-100%, 0, 0);
    transform: translate3d(-100%, 0, 0)
}
}

@keyframes p {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(-100%, 0, 0);
    transform: translate3d(-100%, 0, 0)
}
}

@-webkit-keyframes q {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(100%, 0, 0);
    transform: translate3d(100%, 0, 0)
}
}

@keyframes q {
0% {
    opacity: 1
}
to {
    opacity: 0;
    -webkit-transform: translate3d(100%, 0, 0);
    transform: translate3d(100%, 0, 0)
}
}

@-webkit-keyframes r {
0% {
    -webkit-transform: perspective(400px);
    transform: perspective(400px)
}
30% {
    -webkit-transform: perspective(400px) rotateX(-20deg);
    transform: perspective(400px) rotateX(-20deg);
    opacity: 1
}
to {
    -webkit-transform: perspective(400px) rotateX(90deg);
    transform: perspective(400px) rotateX(90deg);
    opacity: 0
}
}

@keyframes r {
0% {
    -webkit-transform: perspective(400px);
    transform: perspective(400px)
}
30% {
    -webkit-transform: perspective(400px) rotateX(-20deg);
    transform: perspective(400px) rotateX(-20deg);
    opacity: 1
}
to {
    -webkit-transform: perspective(400px) rotateX(90deg);
    transform: perspective(400px) rotateX(90deg);
    opacity: 0
}
}`;

(function() {
    window.onkeydown = () => {
        if (event.ctrlKey && event.altKey && event.keyCode == 86) {
            getCommand()
        }
    }
    // document.addEventListener("keydown", () => {
    //     if (event.ctrlKey && event.altKey && event.keyCode == 86) {
    //         getCommand()
    //     }
    // })
    document.onmousemove = (e) => {
        x = e.clientX
        y = e.clientY
    }

    window.GM_addStyle(noticeFlowStyle)
    const toastScript = document.createElement("script")
    toastScript.innerHTML = `!function(e,t){"function"==typeof define&&define.amd?define([],t(e)):"object"==typeof exports?module.exports=t(e):e.iziToast=t(e)}("undefined"!=typeof global?global:this.window||this.global,function(e){"use strict";function t(){var e,t=document.createElement("fakeelement"),n={animation:"animationend",OAnimation:"oAnimationEnd",MozAnimation:"animationend",WebkitAnimation:"webkitAnimationEnd"};for(e in n)if(void 0!==t.style[e])return n[e]}function n(e){var t=document.createDocumentFragment(),n=document.createElement("div");for(n.innerHTML=e;n.firstChild;)t.appendChild(n.firstChild);return t}function i(e,t,n){var s=!1,a=!1,r=!1,d=null,l=e.querySelector("."+o+"-progressbar div"),c={hideEta:null,maxHideTime:null,currentTime:(new Date).getTime(),updateProgress:function(){if(s=!!e.classList.contains(o+"-paused"),a=!!e.classList.contains(o+"-reseted"),r=!!e.classList.contains(o+"-closed"),a&&(console.log("ok"),clearTimeout(d),l.style.width="100%",i(e,t,n),e.classList.remove(o+"-reseted")),r&&(clearTimeout(d),console.log("closed1"),e.classList.remove(o+"-closed")),!s&&!a&&!r){c.currentTime=c.currentTime+10;var u=(c.hideEta-c.currentTime)/c.maxHideTime*100;l.style.width=u+"%",(Math.round(u)<0||"object"!=typeof e)&&(clearTimeout(d),n.apply(),console.log("closed2"))}}};t.timeout>0&&(c.maxHideTime=parseFloat(t.timeout),c.hideEta=(new Date).getTime()+c.maxHideTime,d=setInterval(c.updateProgress,10))}var o="iziToast",s={},a=!!document.querySelector&&!!e.addEventListener,r=!!/Mobi/.test(navigator.userAgent),d=568,l={},c={"class":"",title:"",message:"",color:"",icon:"",iconText:"",iconColor:"",image:"",imageWidth:50,layout:1,balloon:!1,close:!0,rtl:!1,position:"bottomRight",target:"",timeout:5e3,pauseOnHover:!0,resetOnHover:!1,progressBar:!0,progressBarColor:"",animateInside:!0,buttons:{},transitionIn:"fadeInUp",transitionOut:"fadeOut",transitionInMobile:"fadeInUp",transitionOutMobile:"fadeOutDown",onOpen:function(){},onClose:function(){}};"remove"in Element.prototype||(Element.prototype.remove=function(){this.parentNode&&this.parentNode.removeChild(this)});var u=function(e,t,n){if("[object Object]"===Object.prototype.toString.call(e))for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&t.call(n,e[i],i,e);else if(e)for(var o=0,s=e.length;s>o;o++)t.call(n,e[o],o,e)},p=function(e,t){var n={};return u(e,function(t,i){n[i]=e[i]}),u(t,function(e,i){n[i]=t[i]}),n};t();return s.destroy=function(){u(document.querySelectorAll("."+o+"-wrapper"),function(e,t){e.remove()}),u(document.querySelectorAll("."+o),function(e,t){e.remove()}),document.removeEventListener(o+"-open",{},!1),document.removeEventListener(o+"-close",{},!1),l={}},s.settings=function(e){a&&(s.destroy(),l=e,c=p(c,e||{}))},s.info=function(e){var t={color:"blue",icon:"ico-info"},n=p(l,e||{});n=p(t,n||{}),this.show(n)},s.success=function(e){var t={color:"green",icon:"ico-check"},n=p(l,e||{});n=p(t,n||{}),this.show(n)},s.warning=function(e){var t={color:"yellow",icon:"ico-warning"},n=p(l,e||{});n=p(t,n||{}),this.show(n)},s.error=function(e){var t={color:"red",icon:"ico-error"},n=p(l,e||{});n=p(t,n||{}),this.show(n)},s.hide=function(e,t){var n=p(c,e||{});if("object"!=typeof t&&(t=document.querySelector(t)),t.classList.add(o+"-closed"),(n.transitionIn||n.transitionInMobile)&&t.classList.remove(n.transitionIn,n.transitionInMobile),n.transitionOut||n.transitionOutMobile){r||window.innerWidth<=d?n.transitionOutMobile.length>0&&t.classList.add(n.transitionOutMobile):n.transitionOut.length>0&&t.classList.add(n.transitionOut);var i=t.parentNode.offsetHeight;t.parentNode.style.height=i+"px",t.style.pointerEvents="none",r||window.innerWidth<=d||(t.parentNode.style.transitionDelay="0.2s"),setTimeout(function(){t.parentNode.style.height="0px",window.setTimeout(function(){t.parentNode.remove()},1e3)},200)}else t.parentNode.remove();if(n["class"])try{var s;window.CustomEvent?s=new CustomEvent("iziToast-close",{detail:{"class":n["class"]}}):(s=document.createEvent("CustomEvent"),s.initCustomEvent("iziToast-close",!0,!0,{"class":n["class"]})),document.dispatchEvent(s)}catch(a){console.warn(a)}"undefined"!=typeof n.onClose&&n.onClose.apply()},s.show=function(e){var t=this,s=p(l,e||{});s=p(c,s);var a=document.createElement("div");a.classList.add(o+"-capsule");var m=document.createElement("div");if(m.classList.add(o),r||window.innerWidth<=d?s.transitionInMobile.length>0&&m.classList.add(s.transitionInMobile):s.transitionIn.length>0&&m.classList.add(s.transitionIn),s.rtl&&m.classList.add(o+"-rtl"),s.color.length>0&&("#"==s.color.substring(0,1)||"rgb"==s.color.substring(0,3)||"hsl"==s.color.substring(0,3)?m.style.background=s.color:m.classList.add(o+"-color-"+s.color)),s["class"]&&m.classList.add(s["class"]),s.image){var h=document.createElement("div");h.classList.add(o+"-cover"),h.style.width=s.imageWidth+"px",h.style.backgroundImage="url("+s.image+")",m.appendChild(h)}var v;if(s.close?(v=document.createElement("button"),v.classList.add(o+"-close"),m.appendChild(v)):s.rtl?m.style.paddingLeft="30px":m.style.paddingRight="30px",s.progressBar){var f=document.createElement("div");f.classList.add(o+"-progressbar");var g=document.createElement("div");g.style.background=s.progressBarColor,f.appendChild(g),m.appendChild(f),setTimeout(function(){i(m,s,function(){t.hide(s,m)})},300)}else s.progressBar===!1&&s.timeout>0&&setTimeout(function(){t.hide(s,m)},s.timeout);var y=document.createElement("div");if(y.classList.add(o+"-body"),s.image&&(s.rtl?y.style.marginRight=s.imageWidth+10+"px":y.style.marginLeft=s.imageWidth+10+"px"),s.icon){var w=document.createElement("i");w.setAttribute("class",o+"-icon "+s.icon),s.iconText&&w.appendChild(document.createTextNode(s.iconText)),s.rtl?y.style.paddingRight="33px":y.style.paddingLeft="33px",s.iconColor&&(w.style.color=s.iconColor),y.appendChild(w)}var b=document.createElement("strong");b.appendChild(document.createTextNode(s.title));var L=document.createElement("p");L.appendChild(document.createTextNode(s.message)),s.layout>1&&(L.style.width="100%",m.classList.add(o+"-layout"+s.layout)),s.balloon&&m.classList.add(o+"-balloon"),y.appendChild(b),y.appendChild(L);var C;if(s.buttons.length>0){C=document.createElement("div"),C.classList.add(o+"-buttons"),L.style.marginRight="15px";var E=0;u(s.buttons,function(e,i){C.appendChild(n(e[0]));var o=C.childNodes;o[E].addEventListener("click",function(n){n.preventDefault();var i=e[1];return new i(t,m)}),E++}),y.appendChild(C)}m.appendChild(y),a.style.visibility="hidden",a.style.height="0px",a.appendChild(m),setTimeout(function(){var e=m.offsetHeight,t=m.currentStyle||window.getComputedStyle(m),n=t.marginTop;n=n.split("px"),n=parseInt(n[0]);var i=t.marginBottom;i=i.split("px"),i=parseInt(i[0]),a.style.visibility="",a.style.height=e+i+n+"px",setTimeout(function(){a.style.height="auto"},1e3)},100);var T,x=s.position;s.target?(T=document.querySelector(s.target),T.classList.add(o+"-target"),T.appendChild(a)):(x=r||window.innerWidth<=d?"bottomLeft"==s.position||"bottomRight"==s.position||"bottomCenter"==s.position?o+"-wrapper-bottomCenter":"topLeft"==s.position||"topRight"==s.position||"topCenter"==s.position?o+"-wrapper-topCenter":o+"-wrapper-center":o+"-wrapper-"+x,T=document.querySelector("."+o+"-wrapper."+x),T||(T=document.createElement("div"),T.classList.add(o+"-wrapper"),T.classList.add(x),document.body.appendChild(T)),"topLeft"==s.position||"topCenter"==s.position||"topRight"==s.position?T.insertBefore(a,T.firstChild):T.appendChild(a)),s.onOpen.apply();try{var I;window.CustomEvent?I=new CustomEvent("iziToast-open",{detail:{"class":s["class"]}}):(I=document.createEvent("CustomEvent"),I.initCustomEvent("iziToast-open",!0,!0,{"class":s["class"]})),document.dispatchEvent(I)}catch(O){console.warn(O)}if(s.animateInside){m.classList.add(o+"-animateInside");var M=200,N=100,H=300;if("bounceInLeft"==s.transitionIn&&(M=400,N=200,H=400),window.setTimeout(function(){b.classList.add("slideIn")},M),window.setTimeout(function(){L.classList.add("slideIn")},N),s.icon&&window.setTimeout(function(){w.classList.add("revealIn")},H),s.buttons.length>0&&C){var k=150;u(C.childNodes,function(e,t){window.setTimeout(function(){e.classList.add("revealIn")},k),k+=k})}}v&&v.addEventListener("click",function(e){e.target;t.hide(s,m)}),s.pauseOnHover&&(m.addEventListener("mouseenter",function(e){this.classList.add(o+"-paused")}),m.addEventListener("mouseleave",function(e){this.classList.remove(o+"-paused")})),s.resetOnHover&&(m.addEventListener("mouseenter",function(e){this.classList.add(o+"-reseted")}),m.addEventListener("mouseleave",function(e){this.classList.remove(o+"-reseted")}))},s});`
    document.body.appendChild(toastScript)
    iziToast.settings({
        timeout: 500,
        pauseOnHover: true,
        close: false,
        progressBar: false
    })

})();