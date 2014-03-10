define("aliscript/autocomplete/1.0.4/autocomplete",["$","arale/position/1.0.1/position","arale/overlay/1.1.2/overlay","arale/iframe-shim/1.0.2/iframe-shim","arale/widget/1.1.1/widget","arale/base/1.1.1/base","arale/class/1.1.0/class","arale/events/1.1.0/events","arale/templatable/0.9.2/templatable","gallery/handlebars/1.0.2/handlebars","./data-source","./filter","./input","./autocomplete.css"],function(a,b,c){function d(a){return"[object String]"===Object.prototype.toString.call(a)}function e(a){return"[object Object]"===Object.prototype.toString.call(a)}function f(a,b){if(a){if(k.isFunction(a))return a.call(this,b);if(!k.isArray(b)&&d(a)){for(var c=a.split("."),e=b;c.length;){var f=c.shift();if(!e[f])break;e=e[f]}return e}}return b}function g(a){var b=[];return k.each(a,function(a,c){if(d(c))b.push({label:c,value:c,alias:[]});else if(e(c)){if(!c.value&&!c.label)return;c.value||(c.value=c.label),c.label||(c.label=c.value),c.alias||(c.alias=[]),b.push(c)}}),b}function h(a,b){return d(a)?a=p[a]?p[a]:p["default"]:k.isFunction(a)||(a="url"===b.get("type")?p["default"]:p.startsWith),a}function i(a){function b(a){for(var b in a)c[b]=a[b]}var c={};return b(this),b(a.hash),a.fn(c)}function j(a){var b=this.highlightIndex,c=this.parent?this.parent.classPrefix:"",d=0,e=a||this.label||"",f="";if(k.isArray(b)){for(var g=0,h=b.length;h>g;g++){var i,j,l=b[g];if(k.isArray(l)?(i=l[0],j=l[1]-l[0]):(i=l,j=1),i>d&&(f+=e.substring(d,i)),i<e.length){var m=c?'class="'+c+'-item-hl"':"";f+="<span "+m+">"+e.substr(i,j)+"</span>"}if(d=i+j,d>=e.length)break}return e.length>d&&(f+=e.substring(d,e.length)),f}return e}var k=a("$"),l=a("arale/position/1.0.1/position"),m=a("arale/overlay/1.1.2/overlay"),n=a("arale/templatable/0.9.2/templatable"),o=a("./data-source"),p=a("./filter"),q=a("./input");a("./autocomplete.css");var r=/\bMSIE [678]\.0\b/.test(navigator.userAgent),s='<div class="{{classPrefix}}"><div class="{{classPrefix}}-content">{{> header}}<ul data-role="items">{{#each items}}<li data-role="item" class="{{../classPrefix}}-item"><a href="javascript:void(0)" title="{{deptDesc}}"><span class="suggest-avatar"><img width="25" height="25" src="https://work.alibaba-inc.com/photo/{{empId}}.jpg"></span><span class="suggest-empid">{{empId}}</span><span class="suggest-name">{{lastName}}</span></a></li>{{/each}}</ul>{{> footer}}</div></div>',t=m.extend({Implements:n,attrs:{selectNum:4,defaultSelected:[],resetKey:"userId",trigger:null,classPrefix:"ui-select",align:{baseXY:[0,"100%"]},submitOnEnter:!1,dataSource:{value:[],getter:function(a){var b=this;return k.isFunction(a)?function(){a.apply(b,arguments)}:a}},locator:"data",filter:null,disabled:!1,selectFirst:!1,delay:100,model:{value:{items:[]},getter:function(a){return a.classPrefix||(a.classPrefix=this.get("classPrefix")),a}},template:s,footer:"",header:"",html:"{{{label}}}",selectedIndex:null,data:[]},events:{"mousedown [data-role=items]":"_handleMouseDown","click [data-role=item]":"_handleSelection","mouseenter [data-role=item]":"_handleMouseMove","mouseleave [data-role=item]":"_handleMouseMove"},templateHelpers:{highlightItem:j,include:i},parseElement:function(){var a=["header","footer","html"];for(var b in a)this.templatePartials||(this.templatePartials={}),this.templatePartials[a[b]]=this.get(a[b]);t.superclass.parseElement.call(this)},setup:function(){t.superclass.setup.call(this),this._isOpen=!1,this._cont=null,this._initInput(),this._initDataSource(),this._initFilter(),this._bindHandle(),this._blurHide([k(this.get("trigger"))]),this._tweakAlignDefaultValue(),this.input.setDefault(),this.on("indexChanged",function(a){var b=parseInt(this.get("height"),10);if(b){var c=this.items.parent().height()/this.items.length,d=Math.max(0,c*(a+1)-b);this.element.children().scrollTop(d)}})},show:function(){this._isOpen=!0,this._isEmpty()||t.superclass.show.call(this)},hide:function(){this._timeout&&clearTimeout(this._timeout),this.dataSource.abort(),this._hide(),this.input.emptyInput()},destroy:function(){this._clear(),this.input&&(this.input.destroy(),this.input=null),t.superclass.destroy.call(this)},selectItem:function(a){this.items&&(a&&this.items.length>a&&a>=-1&&this.set("selectedIndex",a),this._handleSelection())},setInputValue:function(a){this.input.setValue(a)},_filterData:function(a){var b=this.get("filter"),c=this.get("locator");a=f(c,a),a=b.call(this,g(a),this.input.get("query")),this.set("data",a)},_onRenderData:function(a){a||(a=[]),this.set("model",{items:a,query:this.input.get("query"),length:a.length}),this.renderPartial(),this.items=this.$("[data-role=items]").children(),this.get("selectFirst")&&this.set("selectedIndex",0),this._isOpen&&this.show()},_onRenderSelectedIndex:function(a){var b=this.get("classPrefix")+"-item-hover";this.items&&this.items.removeClass(b),-1!==a&&(this.items.eq(a).addClass(b),this.trigger("indexChanged",a,this.lastIndex),this.lastIndex=a)},_initDataSource:function(){this.dataSource=new o({source:this.get("dataSource")})},_initInput:function(){var a=k(this.get("trigger")),b=k('<div class="ali-autocomplete-cont" data-auto-id="'+this.get("trigger")+'"><ul class="ali-autocomplete-choises"><li class="ali-autocomplete-field"><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" tabindex="0" /></li></ul></div>');a.css("color",a.css("background-color")),b.appendTo("body"),l.pin({element:b,x:0,y:0},{element:a,x:0,y:0}),b.css({width:a.outerWidth(!0),height:a.outerHeight(!0)}),b.on("click",function(){b.find(".ali-autocomplete-field input").focus()}),this.input=new q({selectNum:this.get("selectNum"),element:b.find("input"),parent:b,delay:this.get("delay"),defaultSelected:this.get("defaultSelected"),resetKey:this.get("resetKey")}),this._cont=b},_initFilter:function(){var a=this.get("filter");a=h(a,this.dataSource),this.set("filter",a)},_bindHandle:function(){this.dataSource.on("data",this._filterData,this),this.input.on("blur",this.hide,this).on("focus",this._handleFocus,this).on("keyEnter",this._handleSelection,this).on("keyEsc",this.hide,this).on("keyUp keyDown",this.show,this).on("keyUp keyDown",this._handleStep,this).on("remove",this._setInputVlaue,this).on("keyBack",this._removeOne,this).on("queryChanged",this._clear,this).on("queryChanged",this._hide,this).on("queryChanged",this._handleQueryChange,this).on("queryChanged",this.show,this),this.after("hide",function(){this.set("selectedIndex",-1)}),this.on("itemSelected",function(){this._hide()})},_removeOne:function(){""==this.input.getValue()&&this.input.removeOne(),this._setInputVlaue()},_handleSelection:function(a){var b=a?"click"===a.type:!1,c=b?this.items.index(a.currentTarget):this.get("selectedIndex"),d=this.items.eq(c),e=this.get("data")[c];if(c>=0&&d){var f={};f[this.get("resetKey")]=e[this.get("resetKey")],f.label=e.label,this.input.setValue(f),this.input.emptyInput(),this.set("selectedIndex",c,{silent:!0}),this._setInputVlaue(),!a||b||this.get("submitOnEnter")||a.preventDefault(),this.trigger("itemSelected",e,d)}},_setInputVlaue:function(){var a=k("[data-auto-id="+this.get("trigger")+"]").outerHeight();k(this.get("trigger")).val(this.input.getSelectedValue()).css("height",a-4)},_handleFocus:function(){this._isOpen=!0},_handleMouseMove:function(a){var b=this.get("classPrefix")+"-item-hover";if(this.items.removeClass(b),"mouseenter"===a.type){var c=this.items.index(a.currentTarget);this.set("selectedIndex",c,{silent:!0}),this.items.eq(c).addClass(b)}},_handleMouseDown:function(a){if(r){var b=this.input.get("element")[0];b.onbeforedeactivate=function(){window.event.returnValue=!1,b.onbeforedeactivate=null}}a.preventDefault()},_handleStep:function(a){a.preventDefault(),this.get("visible")&&this._step("keyUp"===a.type?-1:1)},_handleQueryChange:function(a){this.get("disabled")||(this.dataSource.abort(),this.dataSource.getData(a))},_step:function(a){var b=this.get("selectedIndex");-1===a?b>-1?this.set("selectedIndex",b-1):this.set("selectedIndex",this.items.length-1):1===a&&(b<this.items.length-1?this.set("selectedIndex",b+1):this.set("selectedIndex",-1))},_clear:function(){this.$("[data-role=items]").empty(),this.set("selectedIndex",-1),delete this.items,delete this.lastIndex},_hide:function(){this._isOpen=!1,t.superclass.hide.call(this)},_isEmpty:function(){var a=this.get("data");return!(a&&a.length>0)},_tweakAlignDefaultValue:function(){var a=this.get("align");a.baseElement=this.get("trigger"),this.set("align",a)}});c.exports=t}),define("aliscript/autocomplete/1.0.4/data-source",["arale/base/1.1.1/base","arale/class/1.1.0/class","arale/events/1.1.0/events","$"],function(a,b,c){function d(a){return"[object String]"===Object.prototype.toString.call(a)}function e(a){return a.replace(/^([a-z])/,function(a,b){return b.toUpperCase()})}var f=a("arale/base/1.1.1/base"),g=a("$"),h=f.extend({attrs:{source:null,type:"array",dataType:"json"},initialize:function(a){h.superclass.initialize.call(this,a),this.id=0,this.callbacks=[];var b=this.get("source");if(d(b))this.set("type","url");else if(g.isArray(b))this.set("type","array");else if(g.isPlainObject(b))this.set("type","object");else{if(!g.isFunction(b))throw new Error("Source Type Error");this.set("type","function")}},getData:function(a){return this["_get"+e(this.get("type")||"")+"Data"](a)},abort:function(){this.callbacks=[]},_done:function(a){this.trigger("data",a)},_getUrlData:function(a){var b,c=this,d={query:a?encodeURIComponent(a):"",timestamp:(new Date).getTime()},e=this.get("source").replace(/\{\{(.*?)\}\}/g,function(a,b){return d[b]}),f="callback_"+this.id++;this.callbacks.push(f),b={dataType:this.get("dataType")},g.ajax(e,b).success(function(a){g.inArray(f,c.callbacks)>-1&&(delete c.callbacks[f],c._done(a))}).error(function(){g.inArray(f,c.callbacks)>-1&&(delete c.callbacks[f],c._done({}))})},_getArrayData:function(){var a=this.get("source");return this._done(a),a},_getObjectData:function(){var a=this.get("source");return this._done(a),a},_getFunctionData:function(a){function b(a){c._done(a)}var c=this,d=this.get("source"),e=d.call(this,a,b);e&&this._done(e)}});c.exports=h}),define("aliscript/autocomplete/1.0.4/filter",["$"],function(a,b,c){function d(a){return(a||"").replace(h,"\\$1")}function e(a,b){for(var c=[],d=a.split(""),e=0,f=b.split(""),g=0,h=d.length;h>g;g++){var i=d[g];if(i===f[e]){if(e===f.length-1){c.push([g-f.length+1,g+1]),e=0;continue}e++}else e=0}return c}var f=a("$"),g={"default":function(a){return a},startsWith:function(a,b){b=b||"";var c=[],e=b.length,g=new RegExp("^"+d(b));return e?(f.each(a,function(a,b){for(var d,f=[b.value].concat(b.alias);d=f.shift();)if(g.test(d)){b.label===d&&(b.highlightIndex=[[0,e]]),c.push(b);break}}),c):[]},stringMatch:function(a,b){b=b||"";var c=[],d=b.length;return d?(f.each(a,function(a,d){for(var f,g=[d.value].concat(d.alias);f=g.shift();)if(f.indexOf(b)>-1){d.label===f&&(d.highlightIndex=e(f,b)),c.push(d);break}}),c):[]}};c.exports=g;var h=/(\[|\[|\]|\^|\$|\||\(|\)|\{|\}|\+|\*|\?|\\)/g}),define("aliscript/autocomplete/1.0.4/input",["$","arale/base/1.1.1/base","arale/class/1.1.0/class","arale/events/1.1.0/events"],function(a,b,c){function d(a,b){return function(){a.apply(b,arguments)}}function e(a,b){return a=(a||"").replace(/^\s*/g,"").replace(/\s{2,}/g," "),b=(b||"").replace(/^\s*/g,"").replace(/\s{2,}/g," "),a===b}function f(a){return a.charAt(0).toUpperCase()+a.substring(1)}var g=a("$"),h=a("arale/base/1.1.1/base"),i=/\bMSIE [6789]\.0\b/.test(navigator.userAgent),j={8:"back",9:"tab",27:"esc",37:"left",39:"right",13:"enter",38:"up",40:"down"},k=[],l=h.extend({attrs:{element:{value:null,setter:function(a){return g(a)}},query:null,delay:100,parent:null,selectNum:1,defaultSelected:[],resetKey:"userId"},initialize:function(){l.superclass.initialize.apply(this,arguments),this._bindEvents(),this.set("query",this.getValue())},focus:function(){this.get("element").focus()},getValue:function(){return this.get("element").val()},getSelectedValue:function(){return k.join(";")},setValue:function(a,b){if(k.length>=this.get("selectNum"))return this.trigger("selectmax"),void 0;if(console.log("setValue"),console.log(a),console.log(this.get("resetKey")),!this._hasSelected(a[this.get("resetKey")])){var c=g('<li class="ali-autocomplete-choise" data-val="'+a[this.get("resetKey")]+'"><span>'+a.label+'</span><a class="ali-autocomplete-remove" href="javascript:void(0)" title="remove">×</a></li>');g(this.get("parent")).find(".ali-autocomplete-field").before(c),k.push(a[this.get("resetKey")]),console.log(k),!b&&this._change()}},setDefault:function(){for(var a=this.get("defaultSelected"),b=this.get("parent").find(".ali-autocomplete-field"),c=0,d=a.length;d>c;c++){var e=a[c],f=g('<li class="ali-autocomplete-choise" data-val="'+e[this.get("resetKey")]+'"><span>'+e.label+'</span><a class="ali-autocomplete-remove" href="javascript:void(0)" title="remove">×</a></li>');b.before(f),k.push(e[this.get("resetKey")])}this.trigger("remove")},emptyInput:function(){this.get("element").val("")},removeOne:function(){var a=g(this.get("parent")).find(".ali-autocomplete-choise").last();a.remove(),k.length<1||k.splice(k.length-1,1)},destroy:function(){l.superclass.destroy.call(this)},_hasSelected:function(a){for(var b=0,c=k.length;c>b;b++)if(k[b]==a)return!0;return!1},_removeSelectedValue:function(a){for(var b=0,c=k.length;c>b;b++)if(k[b]==a)return k.splice(b,1),void 0},_bindEvents:function(){var a,b=this.get("element"),c=this.get("parent");if(b.attr("autocomplete","off").on("focus.autocomplete",d(this._handleFocus,this)).on("blur.autocomplete",d(this._handleBlur,this)).on("keydown.autocomplete",d(this._handleKeydown,this)),c.on("click",".ali-autocomplete-remove",d(this._handleRemove,this)),i){var e=this,f=["keydown.autocomplete","keypress.autocomplete","cut.autocomplete","paste.autocomplete"].join(" ");b.on(f,d(function(b){j[b.which]||(clearTimeout(a),a=setTimeout(function(){e._change.call(e,b)},this.get("delay")))},this))}else b.on("input.autocomplete",d(this._change,this))},_handleRemove:function(a){var b=a||window.event,c=b.target||b.srcElement,d=g(c).parent(".ali-autocomplete-choise"),e=d.attr("data-val");this._removeSelectedValue(e),d.remove(),this.trigger("remove")},_change:function(){var a=this.getValue(),b=this.get("query"),c=e(b,a),d=c?a.length!==b.length:!1;d&&this.trigger("whitespaceChanged",b),c||(this.set("query",a),this.trigger("queryChanged",a,b))},_handleFocus:function(a){this.trigger("focus",a)},_handleBlur:function(a){this.trigger("blur",a)},_handleKeydown:function(a){var b=j[a.which];if(b){var c="key"+f(b);this.trigger(a.type=c,a)}}});c.exports=l}),define("aliscript/autocomplete/1.0.4/autocomplete.css",[],function(){seajs.importStyle(".ali-autocomplete-cont{vertical-align:middle;height:auto!important;z-index:99999}.ali-autocomplete-choises{height:auto!important;height:1%;margin:0;padding:0;cursor:text;overflow:hidden}.ali-autocomplete-choise{float:left;list-style:none;padding:0 8px;margin:4px 4px 0;position:relative;line-height:22px;height:22px;color:#323232;cursor:default;background-clip:padding-box;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#ccebfc;font-size:14px}.ali-autocomplete-choise .ali-autocomplete-remove{margin-left:8px;color:#709bb2;font-weight:700}.ali-autocomplete-field{float:left;line-height:22px;height:22px;margin:3px}.ali-autocomplete-field input{width:40px;line-height:22px;font-family:sans-serif;font-size:100%;color:#666;outline:0;border:0;-webkit-box-shadow:none;box-shadow:none;background:transparent!important}")});
