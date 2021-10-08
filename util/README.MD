# 说明
- ToolKit演示

<img src="https://github.com/lowking/Scripts/blob/master/doc/pic/toolkitdemo-show.gif" height="500px">发送指定到手机之后 ➟ <img src="https://github.com/lowking/Scripts/blob/master/doc/pic/toolkitdemo-show-phone.gif" height="500px">

- ```ugtoolkit```脚本用于批量替换项目下js中文中所有引用的ToolKit，避免更新一次ToolKit手动多次修改。
- 使用方法（本人mac环境，以下只针对mac环境）：  
  > - 把```ugtoolkit```和```replaceAllJs.py```复制到当前用户的bin目录下
  > - 注意修改```ugtoolkit```中第一行的```targetPath```为项目根目录
  > - 在bin目录执行```chmod 755 ugtoolkit```
  > - 之后有调整ToolKit代码，只要在终端执行```ugtoolkit```即可完成代码min以及替换js中的引用
- 截图
![Demo](https://github.com/lowking/Scripts/blob/master/doc/pic/ugtoolkit.jpg)
