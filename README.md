###addressJs.js 
####addressJs组件是移动端拖动选择省市区组件，有联动功能，兼容市场上主流机型。启动demo需要启用服务器打开demo页面

###npm安装 
```javascript
npm install -g addressjs
```

###demo
```javascript
var defaultAddressJs = $('.default-address').addressJs({
    // 自定义默认选中值（必选） 值为key值  根据长度显示列数（最大值为3列）
    selected: ['', '', ''],
    // 确认回调 默认加载有回调一次
    confirm: function (data) {
        var address = '';
        for (var i = 0; i < data.length; i++) {
            address += data[i]['n'];
        }
        $('#default-address').html(address);
    }
});
```
###效果图
![demo1.png]



###API说明

```javascript

// 默认选中省市区，长度最大为三列，默认可以传三个空值
options.selected = []


// 默认是否显示 true显示，false为不显示
options.show 


// 确认回调，返回data，k为key，n为name，p父级key值，data为当前同级的数据
options.confirm


// 取消回调
options.cancel


// 显示 接收一个选中值，可以为空
addressJs.show()


// 销毁
addressJs.destroy()
```

