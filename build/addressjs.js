/**
 * addressJs
 * xisa
 * 0.0.2(2014-2016)
 */
 /*
 	依赖iscroll 
	底层库使用 Zepto 或者 jQuery
 */
;(function(){
    'use strict';
    // addressJs插件
    $.fn.addressJs = function (options) {
        return new AddressJs(this, options);
    };
    function AddressJs(element, options) {
    	this.ele = element;
        // 创建id
        if (!this.ele.attr('id')) {
            this.id = 'addressJs' + Math.random().toString().replace('0.', '');
            this.ele.attr('id', this.id);
        }
    	this.init(options);
    }
    // 修复iscroll在新版chrome和其他新版浏览器(Android 7.0)无法滚动bug
    function isPassive() {
        var supportsPassiveOption = false;
        try {
            addEventListener("test", null, Object.defineProperty({}, 'passive', {
                get: function () {
                    supportsPassiveOption = true;
                }
            }));
        } catch(e) {}
        return supportsPassiveOption;
    }
    AddressJs.prototype = {
        version: '0.0.2',
        // 初始化
        init: function (options) {
        	this.options = {};
            var op = this.options;

            op.windowWidth = $(window).width();
            op.windowHeight = $(window).height();
        	// false默认不显示 true显示
    		op.show = false;
            var selected = options.selected;
            // 记录最后一次选择的记录
            op.lastSelected = JSON.parse(JSON.stringify(selected));

            // 默认选中 传入数据必须是数组
            if (!$.isArray(selected) || selected.length === 0) {
                return;
            }
            var field = options.field || {};
            // 数据自定义字段
            op.field = {
                keyField: field.keyField || 'key',
                valueField: field.valueField || 'value',
                dataField: field.dataField || 'data'
            }
            // 保存选择字段
            op.newSelected = new Array(length);
            // 临时保存的data
            op.selectedData = new Array(length);
            // 是否可以点击取消或者保存按钮
            op.isClick = true;
			// 继承
    		$.extend(op, options);
            this.render();
        },
        // 获取地址数据
        getAddressData: function (cb) {
            var self = this;
            var op = self.options;
            $.ajax({
                url: '../data/list.json',
                type: 'get',
                success: function (data) {
                    op.data = typeof data == 'string' ? JSON.parse(data) : data;
                    op.field = {
                        keyField: 'k',
                        valueField: 'n',
                        parent: 'p'
                    }
                    self.formatSameLevelData();
                    if ($.isFunction(cb)) cb();
                }
            });
        },
        // 平级数据
        formatSameLevelData: function () {
            var self = this;
            var op = self.options;
            
            var field = op.field;
            var keyField = field.keyField;
            var valueField = field.valueField;
            var fieldParent = field.parent;

            var selected = op.selected;
            var selectedLen = selected.length;
            
            var data = op.data;
            var len = data.length;
            var n = 0;
            // 默认有多少列
            for (; n < selectedLen; n++) {
                var key = selected[n];
                // 记录默认值
                var firstFlag = true;
                // 是否存在key
                var isKey = false;
                // 记录第一次的默认值
                var firstData = '';
                var arr = [];
                var m = 0;
                // 遍历所有的数据
                for (; m < len; m++) {
                    var currentData = JSON.parse(JSON.stringify(data[m]));
                    var parentKey = currentData[fieldParent];
                    // 记录第一层第一个默认值
                    if (n === 0 && m === 0) {
                        firstData = currentData;
                    }
                    // 记录第一个默认值
                    else if (firstFlag && key != currentData[keyField] && selected[n-1] == parentKey && n > 0) {
                        firstFlag = false;
                    }
                    // Key存在 并且父级元素也存在
                    else if (key == currentData[keyField] && selected[n-1] == parentKey) {
                        isKey = true;
                        firstData = currentData;
                    }

                    // 第一层没有父级元素data || 第N层赋值
                    if ((!parentKey && n === 0) || selected[n-1] == parentKey) {
                        arr.push(currentData);
                    }
                }

                // 如果设置的默认值找不到 则清空后面联动的默认值
                if (!isKey) {
                    for (var k = n; k < selectedLen; k++) {
                        selected[k] = '';
                    }
                }
                // 如果找不到key 则默认赋值到第一个里面
                if (!firstFlag && !isKey) {
                    firstData = arr[0];
                }
                // 遍历出第N层的data
                op.newSelected[n] = JSON.parse(JSON.stringify(firstData));
                op.newSelected[n].data = JSON.parse(JSON.stringify(arr));
                // 重新赋予选中值
                selected[n] = JSON.parse(JSON.stringify(op.newSelected[n][keyField]));
            }
        },
        // 入口
        render: function () {
            var op = this.options;
            // 创建iscroll
            this.createIscroll();
        },
        // 创建iscroll
        createIscroll: function () {
            var i = 0;
            var op = this.options;
            var id = this.id;
            var selected = op.selected;
            var length = selected.length;
            var wid = op.windowWidth/length;

            this.selectlinkageId = id + '-selectlinkage';
            var ulId = this.selectlinkageId + '-scroll';

            var html = '\
                <article class="widget-ui-linkage-article linkage-slideInUp" id="' + this.selectlinkageId + '"><div class="widget-ui-linkage-header"><a href="javascript:void(0);" class="cancel l">取消</a><a href="javascript:void(0);" class="confirm r">确定</a></div>\
                <section class="widget-ui-linkage">';
            for (; i < length; i++) {
                html += '<div class="widget-ui-linkage-select" style="width:' + wid + 'px;" id="' + ulId + i + '"><ul class="widget-ui-linkage-scroll" data-index="' + i + '"></ul></div>';
            }
            html += '</section></article>';
            $('#' + id).css('opacity', '0').append(html);
            
            this.event();
            // 获取地址数据
            this.getAddressData(function () {
                var newSelected = op.newSelected;
                // 创建iscroll
                op.iscroll = [];
                for (var i = 0; i < length; i++) {
                    var scrollId = ulId + i;
                    op.iscroll.push(new IScroll('#' + scrollId));
                    this.createTemplate(newSelected[i].data, i);
                }
                // 判断是否显示和隐藏
                if (op.show) {
                    $('#' + id).removeAttr('style').show();
                } else {
                    $('#' + id).removeAttr('style').hide();
                }
                // 回调
                this.confirm();
                // 创建iscroll事件
                this.createIscrollEvent();
                // 修复iscroll在新版chrome和其他新版浏览器(Android 7.0)无法滚动bug
                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, isPassive() ? {
                    capture: false,
                    passive: false
                } : false);
            }.bind(this));
        },
        // 回调
        confirm: function () {
            var op = this.options;
            var confirm = op.confirm;  // 确认回调
            var field = op.field;
            var keyField = field.keyField;
            // 回调
            if ($.isFunction(confirm)) {
                var data = JSON.parse(JSON.stringify(op.newSelected));
                for (var i = 0; i < data.length; i++) {
                    op.lastSelected[i] = data[i][keyField];
                }
                confirm(data);
            }
        },
        // 创建iscroll事件
        createIscrollEvent: function () {
            var self = this;
            var op = self.options;
            var iscroll = op.iscroll;
            var length = iscroll.length;
            var i = 0;
            for (;i < length; i++) {
                var currentIs = iscroll[i];

                // 开始滚动iscroll
                currentIs.on('scrollStart', function () {
                    // 禁止点击取消或者确认按钮
                    op.isClick = false;
                });
                // 结束滚动iscroll
                currentIs.on('scrollEnd', function () {
                    var scroller = $(this.scroller);
                    var y = Math.abs(this.y);
                    var li = scroller.find('li');
                    var liHeight = li.height();
                    var top = y % liHeight;
                    var index = Math.round(y / liHeight);
                    var seletedLi = li.eq(index);
                    var key = seletedLi.attr('data-key');
                    // 滚动第几列ul
                    var currentUlIndex = parseInt(scroller.attr('data-index'));
                    
                    // 重新赋值
                    op.selected[currentUlIndex] = key;
                    // 重新格式化数据
                    self.formatSameLevelData();

                    // 滚动当前列下级所有列都置顶
                    for (var k = currentUlIndex+1; k < length; k++) {
                        iscroll[k].scrollTo(0, 0, 0);
                        // 重新渲染模板
                        self.createTemplate(op.newSelected[k].data, k);
                    }
                    // 当前滚动列居中
                    this.scrollToElement($(seletedLi).get(0), 0, 0);
                    op.isClick = true;
                });
            }
        },
        // 获取需要创建模板数据
        getCreateDate: function (index) {
            var self = this;
            var op = this.options;
            var selected = op.newSelected;
            var length = selected.length;
            var field = op.field;
            var keyField = field.keyField;
            var valueField = field.valueField;
            var dataField = field.dataField;
            var n = 0;
            // 遍历树节点
            this.treeEachNode(op.selectedData[index], dataField, function (data, i, opt) {
                n++;
                // 循环的第一次直接把当前第一个数组赋值到第一列
                if (n == 1 || selected[index][keyField] == data[keyField]) {
                    // console.log(data)
                    // 设置当前选中的列
                    op.selectedData[index] = data;
                    // 设置当前选中的列的下一列
                    if (index+1 < length) {
                        op.selectedData[index+1] = op.selectedData[index].data || [];
                        
                    }
                }
            });
        },
        // 创建模板
        createTemplate: function (data, index) {
            var op = this.options;
            var iscroll = op.iscroll[index];
            var scroller = iscroll.scroller;

            if (!data || $.isFunction(data)) {
                // 渲染dom
                $(scroller).html('<li>--</li>');
                return;
            }
            
            var length = data.length;
            var selected = op.selected;

            var field = op.field;
            var keyField = field.keyField;
            var valueField = field.valueField;

            var html = '';
            // 渲染模板
            for (var i = 0; i < length; i++) {
                var dataF = data[i];
                html += '<li data-key="' + dataF[keyField] + '">' + dataF[valueField] + '</li>';
            }

            // 渲染dom
            $(scroller).html(html);
            // 刷新
            iscroll.refresh();

            // 设置滚动的位置
            var li = $(scroller).find('li[data-key="' + selected[index] + '"]');
            if (li.length > 0) {
                iscroll.scrollToElement(li.get(0), 0);
            }
        },
		// 获取日期数据
		getDateData: function () {
			var op           = this.options;
			var arr          = [[], [], []];
			var intervalDate = op.intervalDate;
			var startYear    = 1970;
			var endYear      = 2099;

			if ($.isArray(intervalDate)) {
				startYear = parseInt(intervalDate[0]);
				endYear   = parseInt(intervalDate[1]);
			}
            // 年
			var y = startYear;
			for (; y <= endYear; y++) {
				arr[0].push(y);
			}
            // 月
            var m = 1;
            for (; m <= 12; m++) {
                arr[1].push(m);
            }
			op.data = arr;
		},
        // 点击
        event: function () {
            var self = this;
            var op = this.options;
            var confirm = op.confirm;  // 确认回调
            var cancel = op.cancel;   // 取消回调
            $('#' + self.selectlinkageId).find('.widget-ui-linkage-header a').on('click', function () {
                // 滚动中禁止点击
                if (!op.isClick) {
                    return;
                }
                
                // 确认
                if ($(this).hasClass('confirm')) {
                    // 回调
                    self.confirm();
                }

                // 取消
                if ($(this).hasClass('cancel') && $.isFunction(cancel)) {
                    cancel();
                }

                self.hide();
            });
        },
        // 显示
		show: function (data) {
            $('#' + this.id).show();
            var op = this.options;
            var len = op.selected.length;
            var iscroll = op.iscroll;

            // 重新赋值
            if ($.isArray(data) && data.length == len) {
                op.selected = data;
            } else {
                op.selected = op.lastSelected;
            }
            // 重新格式化数据
            this.formatSameLevelData();
            // 滚动当前列下级所有列都置顶
            for (var k = 0; k < len; k++) {
                iscroll[k].scrollTo(0, 0, 0);
                // 重新渲染模板
                this.createTemplate(op.newSelected[k].data, k);
            }
            $('#' + this.selectlinkageId).addClass('linkage-slideInUp');
		},
        // 隐藏
        hide: function () {
            $('#' + this.selectlinkageId).addClass('linkage-slideOutDown');
            setTimeout(function() {
                $('#' + this.id).hide();
                $('#' + this.selectlinkageId).removeClass('linkage-slideOutDown linkage-slideInUp');
            }.bind(this), 401);
        },
        // 返回iscroll
        getIScroll: function () {
            return this.options.iscroll;
        },
        // 销毁
        destroy: function () {
            var iscroll = this.options.iscroll;
            if (!iscroll) return;
            for (var i = 0; i < iscroll.length; i++) {
                iscroll[i].destroy();
            }
            // 销毁iscroll
            delete this.options.iscroll;
        },
    }
})(window.Zepto || window.jQuery);