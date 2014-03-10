define("aliscript/autocomplete/1.0.4/autocomplete-debug", [ "$-debug", "arale/position/1.0.1/position-debug", "arale/overlay/1.1.2/overlay-debug", "arale/iframe-shim/1.0.2/iframe-shim-debug", "arale/widget/1.1.1/widget-debug", "arale/base/1.1.1/base-debug", "arale/class/1.1.0/class-debug", "arale/events/1.1.0/events-debug", "arale/templatable/0.9.2/templatable-debug", "gallery/handlebars/1.0.2/handlebars-debug", "./data-source-debug", "./filter-debug", "./input-debug", "./autocomplete-debug.css" ], function(require, exports, module) {
    var $ = require("$-debug");
    var Position = require("arale/position/1.0.1/position-debug");
    var Overlay = require("arale/overlay/1.1.2/overlay-debug");
    var Templatable = require("arale/templatable/0.9.2/templatable-debug");
    var DataSource = require("./data-source-debug");
    var Filter = require("./filter-debug");
    var Input = require("./input-debug");
    require("./autocomplete-debug.css");
    var IE678 = /\bMSIE [678]\.0\b/.test(navigator.userAgent);
    //var template = require('./autocomplete.handlebars');
    var template = '<div class="{{classPrefix}}"><div class="{{classPrefix}}-content">{{> header}}<ul data-role="items">{{#each items}}<li data-role="item" class="{{../classPrefix}}-item"><a href="javascript:void(0)" title="{{deptDesc}}"><span class="suggest-avatar"><img width="25" height="25" src="https://work.alibaba-inc.com/photo/{{empId}}.jpg"></span><span class="suggest-empid">{{empId}}</span><span class="suggest-name">{{lastName}}</span></a></li>{{/each}}</ul>{{> footer}}</div></div>';
    var AutoComplete = Overlay.extend({
        Implements: Templatable,
        attrs: {
            // 可选的人数上限(默认为1)
            selectNum: 4,
            // 默认已经选择的
            defaultSelected: [],
            // 回填到trigger的键
            resetKey: "userId",
            // 触发元素
            trigger: null,
            classPrefix: "ui-select",
            align: {
                baseXY: [ 0, "100%" ]
            },
            submitOnEnter: false,
            // 回车是否会提交表单
            dataSource: {
                //数据源，支持 Array, URL, Object, Function
                value: [],
                getter: function(val) {
                    var that = this;
                    if ($.isFunction(val)) {
                        return function() {
                            val.apply(that, arguments);
                        };
                    }
                    return val;
                }
            },
            locator: "data",
            // 输出过滤
            filter: null,
            disabled: false,
            selectFirst: false,
            delay: 100,
            // 以下为模板相关
            model: {
                value: {
                    items: []
                },
                getter: function(val) {
                    val.classPrefix || (val.classPrefix = this.get("classPrefix"));
                    return val;
                }
            },
            template: template,
            footer: "",
            header: "",
            html: "{{{label}}}",
            // 以下仅为组件使用
            selectedIndex: null,
            data: []
        },
        events: {
            "mousedown [data-role=items]": "_handleMouseDown",
            "click [data-role=item]": "_handleSelection",
            "mouseenter [data-role=item]": "_handleMouseMove",
            "mouseleave [data-role=item]": "_handleMouseMove"
        },
        templateHelpers: {
            // 将匹配的高亮文字加上 hl 的样式
            highlightItem: highlightItem,
            include: include
        },
        parseElement: function() {
            var t = [ "header", "footer", "html" ];
            for (var i in t) {
                this.templatePartials || (this.templatePartials = {});
                this.templatePartials[t[i]] = this.get(t[i]);
            }
            AutoComplete.superclass.parseElement.call(this);
        },
        setup: function() {
            AutoComplete.superclass.setup.call(this);
            this._isOpen = false;
            this._cont = null;
            // 自动提示显示容器
            this._initInput();
            // 初始化输入框
            this._initDataSource();
            // 初始化数据源
            this._initFilter();
            // 初始化过滤器
            this._bindHandle();
            // 绑定事件
            this._blurHide([ $(this.get("trigger")) ]);
            this._tweakAlignDefaultValue();
            this.input.setDefault();
            this.on("indexChanged", function(index) {
                // scroll current item into view
                //this.currentItem.scrollIntoView();
                var containerHeight = parseInt(this.get("height"), 10);
                if (!containerHeight) return;
                var itemHeight = this.items.parent().height() / this.items.length, itemTop = Math.max(0, itemHeight * (index + 1) - containerHeight);
                this.element.children().scrollTop(itemTop);
            });
        },
        show: function() {
            this._isOpen = true;
            // 无数据则不显示
            if (this._isEmpty()) return;
            AutoComplete.superclass.show.call(this);
        },
        hide: function() {
            //this._cont.find('input').val('');
            // 隐藏的时候取消请求或回调
            if (this._timeout) clearTimeout(this._timeout);
            this.dataSource.abort();
            this._hide();
            this.input.emptyInput();
        },
        destroy: function() {
            this._clear();
            if (this.input) {
                this.input.destroy();
                this.input = null;
            }
            AutoComplete.superclass.destroy.call(this);
        },
        // Public Methods
        // --------------
        selectItem: function(index) {
            if (this.items) {
                if (index && this.items.length > index && index >= -1) {
                    this.set("selectedIndex", index);
                }
                this._handleSelection();
            }
        },
        setInputValue: function(val) {
            this.input.setValue(val);
        },
        // Private Methods
        // ---------------
        // 数据源返回，过滤数据
        _filterData: function(data) {
            var filter = this.get("filter"), locator = this.get("locator");
            // 获取目标数据
            data = locateResult(locator, data);
            // 进行过滤
            data = filter.call(this, normalize(data), this.input.get("query"));
            this.set("data", data);
        },
        // 通过数据渲染模板
        _onRenderData: function(data) {
            data || (data = []);
            // 渲染下拉
            this.set("model", {
                items: data,
                query: this.input.get("query"),
                length: data.length
            });
            this.renderPartial();
            // 初始化下拉的状态
            this.items = this.$("[data-role=items]").children();
            if (this.get("selectFirst")) {
                this.set("selectedIndex", 0);
            }
            // 选中后会修改 input 的值并触发下一次渲染，但第二次渲染的结果不应该显示出来。
            this._isOpen && this.show();
        },
        // 键盘控制上下移动
        _onRenderSelectedIndex: function(index) {
            var hoverClass = this.get("classPrefix") + "-item-hover";
            this.items && this.items.removeClass(hoverClass);
            // -1 什么都不选
            if (index === -1) return;
            this.items.eq(index).addClass(hoverClass);
            this.trigger("indexChanged", index, this.lastIndex);
            this.lastIndex = index;
        },
        // 初始化
        // ------------
        _initDataSource: function() {
            this.dataSource = new DataSource({
                source: this.get("dataSource")
            });
        },
        _initInput: function() {
            // 构造选择器
            var inputEle = $(this.get("trigger")), cont = $('<div class="ali-autocomplete-cont" data-auto-id="' + this.get("trigger") + '"><ul class="ali-autocomplete-choises"><li class="ali-autocomplete-field"><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" tabindex="0" /></li></ul></div>');
            inputEle.css("color", inputEle.css("background-color"));
            cont.appendTo("body");
            Position.pin({
                element: cont,
                x: 0,
                y: 0
            }, {
                element: inputEle,
                x: 0,
                y: 0
            });
            cont.css({
                width: inputEle.outerWidth(true),
                height: inputEle.outerHeight(true)
            });
            cont.on("click", function() {
                cont.find(".ali-autocomplete-field input").focus();
            });
            this.input = new Input({
                selectNum: this.get("selectNum"),
                element: cont.find("input"),
                parent: cont,
                delay: this.get("delay"),
                defaultSelected: this.get("defaultSelected"),
                resetKey: this.get("resetKey")
            });
            this._cont = cont;
        },
        _initFilter: function() {
            var filter = this.get("filter");
            filter = initFilter(filter, this.dataSource);
            this.set("filter", filter);
        },
        // 事件绑定
        // ------------
        _bindHandle: function() {
            this.dataSource.on("data", this._filterData, this);
            this.input.on("blur", this.hide, this).on("focus", this._handleFocus, this).on("keyEnter", this._handleSelection, this).on("keyEsc", this.hide, this).on("keyUp keyDown", this.show, this).on("keyUp keyDown", this._handleStep, this).on("remove", this._setInputVlaue, this).on("keyBack", this._removeOne, this).on("queryChanged", this._clear, this).on("queryChanged", this._hide, this).on("queryChanged", this._handleQueryChange, this).on("queryChanged", this.show, this);
            this.after("hide", function() {
                this.set("selectedIndex", -1);
            });
            // 选中后隐藏浮层
            this.on("itemSelected", function() {
                //this._cont.find('input').val('');
                this._hide();
            });
        },
        // 回退删除一个
        _removeOne: function() {
            if (this.input.getValue() == "") this.input.removeOne();
            this._setInputVlaue();
        },
        // 选中的处理器
        // 1. 鼠标点击触发
        // 2. 回车触发
        // 3. selectItem 触发
        _handleSelection: function(e) {
            var isMouse = e ? e.type === "click" : false;
            var index = isMouse ? this.items.index(e.currentTarget) : this.get("selectedIndex");
            var item = this.items.eq(index);
            var data = this.get("data")[index];
            if (index >= 0 && item) {
                var itemData = {};
                itemData[this.get("resetKey")] = data[this.get("resetKey")];
                itemData["label"] = data.label;
                this.input.setValue(itemData);
                /////////////////////////////////叠加
                this.input.emptyInput();
                this.set("selectedIndex", index, {
                    silent: true
                });
                this._setInputVlaue();
                // 是否阻止回车提交表单
                if (e && !isMouse && !this.get("submitOnEnter")) e.preventDefault();
                this.trigger("itemSelected", data, item);
            }
        },
        // 给原input元素设置值
        _setInputVlaue: function() {
            var height = $("[data-auto-id=" + this.get("trigger") + "]").outerHeight();
            $(this.get("trigger")).val(this.input.getSelectedValue()).css("height", height - 4);
        },
        _handleFocus: function() {
            //this._cont.find('input').val('');
            this._isOpen = true;
        },
        _handleMouseMove: function(e) {
            var hoverClass = this.get("classPrefix") + "-item-hover";
            this.items.removeClass(hoverClass);
            if (e.type === "mouseenter") {
                var index = this.items.index(e.currentTarget);
                this.set("selectedIndex", index, {
                    silent: true
                });
                this.items.eq(index).addClass(hoverClass);
            }
        },
        _handleMouseDown: function(e) {
            if (IE678) {
                var trigger = this.input.get("element")[0];
                trigger.onbeforedeactivate = function() {
                    window.event.returnValue = false;
                    trigger.onbeforedeactivate = null;
                };
            }
            e.preventDefault();
        },
        _handleStep: function(e) {
            e.preventDefault();
            this.get("visible") && this._step(e.type === "keyUp" ? -1 : 1);
        },
        _handleQueryChange: function(val, prev) {
            if (this.get("disabled")) return;
            this.dataSource.abort();
            this.dataSource.getData(val);
        },
        // 选项上下移动
        _step: function(direction) {
            var currentIndex = this.get("selectedIndex");
            if (direction === -1) {
                // 反向
                if (currentIndex > -1) {
                    this.set("selectedIndex", currentIndex - 1);
                } else {
                    this.set("selectedIndex", this.items.length - 1);
                }
            } else if (direction === 1) {
                // 正向
                if (currentIndex < this.items.length - 1) {
                    this.set("selectedIndex", currentIndex + 1);
                } else {
                    this.set("selectedIndex", -1);
                }
            }
        },
        _clear: function() {
            this.$("[data-role=items]").empty();
            this.set("selectedIndex", -1);
            delete this.items;
            delete this.lastIndex;
        },
        _hide: function() {
            this._isOpen = false;
            AutoComplete.superclass.hide.call(this);
        },
        _isEmpty: function() {
            var data = this.get("data");
            return !(data && data.length > 0);
        },
        // 调整 align 属性的默认值
        _tweakAlignDefaultValue: function() {
            var align = this.get("align");
            align.baseElement = this.get("trigger");
            this.set("align", align);
        }
    });
    module.exports = AutoComplete;
    function isString(str) {
        return Object.prototype.toString.call(str) === "[object String]";
    }
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }
    // 通过 locator 找到 data 中的某个属性的值
    // 1. locator 支持 function，函数返回值为结果
    // 2. locator 支持 string，而且支持点操作符寻址
    //     data {
    //       a: {
    //         b: 'c'
    //       }
    //     }
    //     locator 'a.b'
    // 最后的返回值为 c
    function locateResult(locator, data) {
        if (locator) {
            if ($.isFunction(locator)) {
                return locator.call(this, data);
            } else if (!$.isArray(data) && isString(locator)) {
                var s = locator.split("."), p = data;
                while (s.length) {
                    var v = s.shift();
                    if (!p[v]) {
                        break;
                    }
                    p = p[v];
                }
                return p;
            }
        }
        return data;
    }
    // 标准格式，不匹配则忽略
    //
    //   {
    //     label: '', 显示的字段
    //     value: '', 匹配的字段
    //     alias: []  其他匹配的字段
    //   }
    function normalize(data) {
        var result = [];
        $.each(data, function(index, item) {
            if (isString(item)) {
                result.push({
                    label: item,
                    value: item,
                    alias: []
                });
            } else if (isObject(item)) {
                if (!item.value && !item.label) return;
                item.value || (item.value = item.label);
                item.label || (item.label = item.value);
                item.alias || (item.alias = []);
                result.push(item);
            }
        });
        return result;
    }
    // 初始化 filter
    // 支持的格式
    //   1. null: 使用默认的 startsWith
    //   2. string: 从 Filter 中找，如果不存在则用 default
    //   3. function: 自定义
    function initFilter(filter, dataSource) {
        // 字符串
        if (isString(filter)) {
            // 从组件内置的 FILTER 获取
            if (Filter[filter]) {
                filter = Filter[filter];
            } else {
                filter = Filter["default"];
            }
        } else if (!$.isFunction(filter)) {
            // 异步请求的时候不需要过滤器
            if (dataSource.get("type") === "url") {
                filter = Filter["default"];
            } else {
                filter = Filter["startsWith"];
            }
        }
        return filter;
    }
    function include(options) {
        var context = {};
        mergeContext(this);
        mergeContext(options.hash);
        return options.fn(context);
        function mergeContext(obj) {
            for (var k in obj) context[k] = obj[k];
        }
    }
    function highlightItem(label) {
        var index = this.highlightIndex, classPrefix = this.parent ? this.parent.classPrefix : "", cursor = 0, v = label || this.label || "", h = "";
        if ($.isArray(index)) {
            for (var i = 0, l = index.length; i < l; i++) {
                var j = index[i], start, length;
                if ($.isArray(j)) {
                    start = j[0];
                    length = j[1] - j[0];
                } else {
                    start = j;
                    length = 1;
                }
                if (start > cursor) {
                    h += v.substring(cursor, start);
                }
                if (start < v.length) {
                    var className = classPrefix ? 'class="' + classPrefix + '-item-hl"' : "";
                    h += "<span " + className + ">" + v.substr(start, length) + "</span>";
                }
                cursor = start + length;
                if (cursor >= v.length) {
                    break;
                }
            }
            if (v.length > cursor) {
                h += v.substring(cursor, v.length);
            }
            return h;
        }
        return v;
    }
});

define("aliscript/autocomplete/1.0.4/data-source-debug", [ "arale/base/1.1.1/base-debug", "arale/class/1.1.0/class-debug", "arale/events/1.1.0/events-debug", "$-debug" ], function(require, exports, module) {
    var Base = require("arale/base/1.1.1/base-debug");
    var $ = require("$-debug");
    var DataSource = Base.extend({
        attrs: {
            source: null,
            type: "array",
            dataType: "json"
        },
        initialize: function(config) {
            DataSource.superclass.initialize.call(this, config);
            // 每次发送请求会将 id 记录到 callbacks 中，返回后会从中删除
            // 如果 abort 会清空 callbacks，之前的请求结果都不会执行
            this.id = 0;
            this.callbacks = [];
            var source = this.get("source");
            if (isString(source)) {
                this.set("type", "url");
            } else if ($.isArray(source)) {
                this.set("type", "array");
            } else if ($.isPlainObject(source)) {
                this.set("type", "object");
            } else if ($.isFunction(source)) {
                this.set("type", "function");
            } else {
                throw new Error("Source Type Error");
            }
        },
        getData: function(query) {
            return this["_get" + capitalize(this.get("type") || "") + "Data"](query);
        },
        abort: function() {
            this.callbacks = [];
        },
        // 完成数据请求，getData => done
        _done: function(data) {
            this.trigger("data", data);
        },
        _getUrlData: function(query) {
            var that = this, options;
            var obj = {
                query: query ? encodeURIComponent(query) : "",
                timestamp: new Date().getTime()
            };
            var url = this.get("source").replace(/\{\{(.*?)\}\}/g, function(all, match) {
                return obj[match];
            });
            var callbackId = "callback_" + this.id++;
            this.callbacks.push(callbackId);
            options = {
                dataType: this.get("dataType")
            };
            /*
            if (/^(https?:\/\/)/.test(url)) {
                options = {
                    dataType: 'jsonp'
                };
            } else {
                options = {
                    dataType: 'json'
                };
            }
            */
            $.ajax(url, options).success(function(data) {
                if ($.inArray(callbackId, that.callbacks) > -1) {
                    delete that.callbacks[callbackId];
                    that._done(data);
                }
            }).error(function() {
                if ($.inArray(callbackId, that.callbacks) > -1) {
                    delete that.callbacks[callbackId];
                    that._done({});
                }
            });
        },
        _getArrayData: function() {
            var source = this.get("source");
            this._done(source);
            return source;
        },
        _getObjectData: function() {
            var source = this.get("source");
            this._done(source);
            return source;
        },
        _getFunctionData: function(query) {
            var that = this, func = this.get("source");
            // 如果返回 false 可阻止执行
            function done(data) {
                that._done(data);
            }
            var data = func.call(this, query, done);
            if (data) {
                this._done(data);
            }
        }
    });
    module.exports = DataSource;
    function isString(str) {
        return Object.prototype.toString.call(str) === "[object String]";
    }
    function capitalize(str) {
        return str.replace(/^([a-z])/, function(f, m) {
            return m.toUpperCase();
        });
    }
});

define("aliscript/autocomplete/1.0.4/filter-debug", [ "$-debug" ], function(require, exports, module) {
    var $ = require("$-debug");
    var Filter = {
        "default": function(data) {
            return data;
        },
        startsWith: function(data, query) {
            query = query || "";
            var result = [], l = query.length, reg = new RegExp("^" + escapeKeyword(query));
            if (!l) return [];
            $.each(data, function(index, item) {
                var a, matchKeys = [ item.value ].concat(item.alias);
                // 匹配 value 和 alias 中的
                while (a = matchKeys.shift()) {
                    if (reg.test(a)) {
                        // 匹配和显示相同才有必要高亮
                        if (item.label === a) {
                            item.highlightIndex = [ [ 0, l ] ];
                        }
                        result.push(item);
                        break;
                    }
                }
            });
            return result;
        },
        stringMatch: function(data, query) {
            query = query || "";
            var result = [], l = query.length;
            if (!l) return [];
            $.each(data, function(index, item) {
                var a, matchKeys = [ item.value ].concat(item.alias);
                // 匹配 value 和 alias 中的
                while (a = matchKeys.shift()) {
                    if (a.indexOf(query) > -1) {
                        // 匹配和显示相同才有必要高亮
                        if (item.label === a) {
                            item.highlightIndex = stringMatch(a, query);
                        }
                        result.push(item);
                        break;
                    }
                }
            });
            return result;
        }
    };
    module.exports = Filter;
    // 转义正则关键字
    var keyword = /(\[|\[|\]|\^|\$|\||\(|\)|\{|\}|\+|\*|\?|\\)/g;
    function escapeKeyword(str) {
        return (str || "").replace(keyword, "\\$1");
    }
    function stringMatch(matchKey, query) {
        var r = [], a = matchKey.split("");
        var queryIndex = 0, q = query.split("");
        for (var i = 0, l = a.length; i < l; i++) {
            var v = a[i];
            if (v === q[queryIndex]) {
                if (queryIndex === q.length - 1) {
                    r.push([ i - q.length + 1, i + 1 ]);
                    queryIndex = 0;
                    continue;
                }
                queryIndex++;
            } else {
                queryIndex = 0;
            }
        }
        return r;
    }
});

define("aliscript/autocomplete/1.0.4/input-debug", [ "$-debug", "arale/base/1.1.1/base-debug", "arale/class/1.1.0/class-debug", "arale/events/1.1.0/events-debug" ], function(require, exports, module) {
    var $ = require("$-debug");
    var Base = require("arale/base/1.1.1/base-debug");
    var lteIE9 = /\bMSIE [6789]\.0\b/.test(navigator.userAgent);
    var specialKeyCodeMap = {
        8: "back",
        9: "tab",
        27: "esc",
        37: "left",
        39: "right",
        13: "enter",
        38: "up",
        40: "down"
    };
    var selectedValues = [];
    // 已经选中的值
    var Input = Base.extend({
        attrs: {
            element: {
                value: null,
                setter: function(val) {
                    return $(val);
                }
            },
            query: null,
            delay: 100,
            parent: null,
            selectNum: 1,
            defaultSelected: [],
            resetKey: "userId"
        },
        initialize: function() {
            Input.superclass.initialize.apply(this, arguments);
            // bind events
            this._bindEvents();
            // init query
            this.set("query", this.getValue());
        },
        focus: function() {
            this.get("element").focus();
        },
        getValue: function() {
            return this.get("element").val();
        },
        // 返回已经选择的值
        getSelectedValue: function() {
            return selectedValues.join(";");
        },
        /*
         * 修改选中之后的显示
         */
        setValue: function(val, silent) {
            //this.get('element').val(val);
            if (selectedValues.length >= this.get("selectNum")) {
                this.trigger("selectmax");
                return;
            }
            console.log("setValue");
            console.log(val);
            console.log(this.get("resetKey"));
            if (this._hasSelected(val[this.get("resetKey")])) return;
            var liEle = $('<li class="ali-autocomplete-choise" data-val="' + val[this.get("resetKey")] + '"><span>' + val.label + '</span><a class="ali-autocomplete-remove" href="javascript:void(0)" title="remove">×</a></li>');
            $(this.get("parent")).find(".ali-autocomplete-field").before(liEle);
            selectedValues.push(val[this.get("resetKey")]);
            console.log(selectedValues);
            !silent && this._change();
        },
        // 设置默认值
        setDefault: function() {
            var defaults = this.get("defaultSelected"), parentEle = this.get("parent").find(".ali-autocomplete-field");
            for (var i = 0, len = defaults.length; i < len; i++) {
                var val = defaults[i], liEle = $('<li class="ali-autocomplete-choise" data-val="' + val[this.get("resetKey")] + '"><span>' + val.label + '</span><a class="ali-autocomplete-remove" href="javascript:void(0)" title="remove">×</a></li>');
                parentEle.before(liEle);
                selectedValues.push(val[this.get("resetKey")]);
            }
            this.trigger("remove");
        },
        emptyInput: function() {
            this.get("element").val("");
        },
        removeOne: function() {
            var liEle = $(this.get("parent")).find(".ali-autocomplete-choise").last();
            liEle.remove();
            if (selectedValues.length < 1) return;
            selectedValues.splice(selectedValues.length - 1, 1);
        },
        destroy: function() {
            Input.superclass.destroy.call(this);
        },
        _hasSelected: function(val) {
            for (var i = 0, len = selectedValues.length; i < len; i++) {
                if (selectedValues[i] == val) return true;
            }
            return false;
        },
        // 删除一个已经选择的值
        _removeSelectedValue: function(val) {
            for (var i = 0, len = selectedValues.length; i < len; i++) {
                if (selectedValues[i] == val) {
                    selectedValues.splice(i, 1);
                    return;
                }
            }
        },
        _bindEvents: function() {
            var timer, input = this.get("element"), parent = this.get("parent");
            input.attr("autocomplete", "off").on("focus.autocomplete", wrapFn(this._handleFocus, this)).on("blur.autocomplete", wrapFn(this._handleBlur, this)).on("keydown.autocomplete", wrapFn(this._handleKeydown, this));
            parent.on("click", ".ali-autocomplete-remove", wrapFn(this._handleRemove, this));
            // IE678 don't support input event
            // IE 9 does not fire an input event when the user removes characters from input filled by keyboard, cut, or drag operations.
            if (!lteIE9) {
                input.on("input.autocomplete", wrapFn(this._change, this));
            } else {
                var that = this, events = [ "keydown.autocomplete", "keypress.autocomplete", "cut.autocomplete", "paste.autocomplete" ].join(" ");
                input.on(events, wrapFn(function(e) {
                    if (specialKeyCodeMap[e.which]) return;
                    clearTimeout(timer);
                    timer = setTimeout(function() {
                        that._change.call(that, e);
                    }, this.get("delay"));
                }, this));
            }
        },
        // 删除事件
        _handleRemove: function(ev) {
            var e = ev || window.event, target = e.target || e.srcElement, liEle = $(target).parent(".ali-autocomplete-choise"), val = liEle.attr("data-val");
            this._removeSelectedValue(val);
            liEle.remove();
            this.trigger("remove");
        },
        _change: function() {
            var newVal = this.getValue();
            var oldVal = this.get("query");
            var isSame = compare(oldVal, newVal);
            var isSameExpectWhitespace = isSame ? newVal.length !== oldVal.length : false;
            if (isSameExpectWhitespace) {
                this.trigger("whitespaceChanged", oldVal);
            }
            if (!isSame) {
                this.set("query", newVal);
                this.trigger("queryChanged", newVal, oldVal);
            }
        },
        _handleFocus: function(e) {
            //$(this.get('element')).val('');
            this.trigger("focus", e);
        },
        _handleBlur: function(e) {
            this.trigger("blur", e);
        },
        _handleKeydown: function(e) {
            var keyName = specialKeyCodeMap[e.which];
            if (keyName) {
                var eventKey = "key" + ucFirst(keyName);
                this.trigger(e.type = eventKey, e);
            }
        }
    });
    module.exports = Input;
    function wrapFn(fn, context) {
        return function() {
            fn.apply(context, arguments);
        };
    }
    function compare(a, b) {
        a = (a || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
        b = (b || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
        return a === b;
    }
    function ucFirst(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }
});

define("aliscript/autocomplete/1.0.4/autocomplete-debug.css", [], function() {
    seajs.importStyle(".ali-autocomplete-cont{vertical-align:middle;height:auto!important;z-index:99999}.ali-autocomplete-choises{height:auto!important;height:1%;margin:0;padding:0;cursor:text;overflow:hidden}.ali-autocomplete-choise{float:left;list-style:none;padding:0 8px;margin:4px 4px 0;position:relative;line-height:22px;height:22px;color:#323232;cursor:default;background-clip:padding-box;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#ccebfc;font-size:14px}.ali-autocomplete-choise .ali-autocomplete-remove{margin-left:8px;color:#709bb2;font-weight:700}.ali-autocomplete-field{float:left;line-height:22px;height:22px;margin:3px}.ali-autocomplete-field input{width:40px;line-height:22px;font-family:sans-serif;font-size:100%;color:#666;outline:0;border:0;-webkit-box-shadow:none;box-shadow:none;background:transparent!important}");
});
