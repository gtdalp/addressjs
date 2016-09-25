# addressJs.js 
addressJs组件是移动端拖动选择省市区组件，有联动功能，兼容市场上主流机型。启动demo需要启用服务器打开demo页面

###npm安装
```javascript
npm install -g addressjs
```

###demo效果图
![demo1.png]



###API
{|
! api !! 说明
|- 
| options.selected = [] || 默认选中省市区，长度最大为三列，默认可以传三个空值
|- 
| options.show || 默认是否显示 true显示，false为不显示
|- 
| options.confirm || 确认回调，返回data，k为key，n为name，p父级key值，data为当前同级的数据
|-
| options.cancel || 取消回调
|-
| addressJs.show() || 显示 接收一个选中值，可以为空
|-
| addressJs.destroy() || 销毁
|-
|}

