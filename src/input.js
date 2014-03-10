define(function(require, exports, module) {
    var $ = require('$');
    var Base = require('base');

    var lteIE9 = /\bMSIE [6789]\.0\b/.test(navigator.userAgent);
    var specialKeyCodeMap = {
        8: 'back',
        9: 'tab',
        27: 'esc',
        37: 'left',
        39: 'right',
        13: 'enter',
        38: 'up',
        40: 'down'
    };
    var selectedValues = []; // 已经选中的值

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
            resetKey: 'userId'
        },

        initialize: function() {
            Input.superclass.initialize.apply(this, arguments);

            // bind events
            this._bindEvents();

            // init query
            this.set('query', this.getValue());

            // 设置初始选中值
            //this.setDefault();
        },

        focus: function() {
            this.get('element').focus();
        },

        getValue: function() {
            return this.get('element').val();
        },

        // 返回已经选择的值
        getSelectedValue: function(){
            return selectedValues.join(';');
        },

        /*
         * 修改选中之后的显示
         */
        setValue: function(val, silent) {
            //this.get('element').val(val);

            if(selectedValues.length >= this.get('selectNum')){
                this.trigger('selectmax');
                return;
            }
            if(this._hasSelected(val[this.get('resetKey')])) return;

            var liEle = $('<li class="ali-autocomplete-choise" data-val="' + val[this.get('resetKey')] + '"><span>' + val.label + '</span><a class="ali-autocomplete-remove" href="javascript:void(0)" title="remove">×</a></li>');
            $(this.get('parent')).find('.ali-autocomplete-field').before(liEle);

            selectedValues.push(val[this.get('resetKey')]);

            !silent && this._change();
        },

        // 设置默认值
        setDefault: function(){
            var defaults = this.get('defaultSelected'),
                parentEle = this.get('parent').find('.ali-autocomplete-field');

            for(var i = 0, len = defaults.length; i < len; i ++){
                var val = defaults[i],
                    liEle = $('<li class="ali-autocomplete-choise" data-val="' + val[this.get('resetKey')] + '"><span>' + val.label + '</span><a class="ali-autocomplete-remove" href="javascript:void(0)" title="remove">×</a></li>');
                parentEle.before(liEle);

                selectedValues.push(val[this.get('resetKey')]);
            }

            this.trigger('remove');
        },

        emptyInput: function(){
            this.get('element').val('');
        },

        removeOne: function(){
            var liEle = $(this.get('parent')).find('.ali-autocomplete-choise').last();
            liEle.remove();

            if(selectedValues.length < 1) return;
            selectedValues.splice(selectedValues.length - 1, 1);
        },

        destroy: function() {
            Input.superclass.destroy.call(this);
        },

        _hasSelected: function(val){
            for(var i = 0, len = selectedValues.length; i < len; i ++){
                if(selectedValues[i] == val) return true;
            }
            return false;
        },

        // 删除一个已经选择的值
        _removeSelectedValue: function(val){
            for(var i = 0, len = selectedValues.length; i < len; i ++){
                if(selectedValues[i] == val){
                    selectedValues.splice(i, 1);
                    return;
                }
            }
        },

        _bindEvents: function() {
            var timer, input = this.get('element'), parent = this.get('parent');

            input
                .attr('autocomplete', 'off')
                .on('focus.autocomplete', wrapFn(this._handleFocus, this))
                .on('blur.autocomplete', wrapFn(this._handleBlur, this))
                .on('keydown.autocomplete', wrapFn(this._handleKeydown, this));

            parent.on('click', '.ali-autocomplete-remove', wrapFn(this._handleRemove, this));

            // IE678 don't support input event
            // IE 9 does not fire an input event when the user removes characters from input filled by keyboard, cut, or drag operations.
            if (!lteIE9) {
                input.on('input.autocomplete', wrapFn(this._change, this));
            } else {
                var that = this,
                    events = [
                        'keydown.autocomplete',
                        'keypress.autocomplete',
                        'cut.autocomplete',
                        'paste.autocomplete'
                    ].join(' ');

                input.on(events, wrapFn(function(e) {
                    if (specialKeyCodeMap[e.which]) return;

                    clearTimeout(timer);
                    timer = setTimeout(function() {
                        that._change.call(that, e);
                    }, this.get('delay'));
                }, this));
            }
        },

        // 删除事件
        _handleRemove: function(ev){
            var e = ev || window.event,
                target = e.target || e.srcElement,
                liEle = $(target).parent('.ali-autocomplete-choise'),
                val = liEle.attr('data-val');

            this._removeSelectedValue(val);
            liEle.remove();

            this.trigger('remove');
        },

        _change: function() {
            var newVal = this.getValue();
            var oldVal = this.get('query');
            var isSame = compare(oldVal, newVal);
            var isSameExpectWhitespace = isSame ? (newVal.length !== oldVal.length) : false;

            if (isSameExpectWhitespace) {
                this.trigger('whitespaceChanged', oldVal);
            }
            if (!isSame) {
                this.set('query', newVal);
                this.trigger('queryChanged', newVal, oldVal);
            }
        },

        _handleFocus: function(e) {
            //$(this.get('element')).val('');
            this.trigger('focus', e);
        },

        _handleBlur: function(e) {
            this.trigger('blur', e);
        },

        _handleKeydown: function(e) {
            var keyName = specialKeyCodeMap[e.which];
            if (keyName) {
                var eventKey = 'key' + ucFirst(keyName);
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
        a = (a || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
        b = (b || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
        return a === b;
    }

    function ucFirst(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }
});
