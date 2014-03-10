# 自定义模板

- order:4

----

<script>
seajs.use('select.css');
</script>

## 使用参数来自定义模板

<input id="acTrigger1" type="text" value="" />

<style>
.ui-select-item a {padding: 7px 10px 7px 0;}
.ui-select-item a span {float: right; color: #ccc;}
.ui-select-header, .ui-select-footer {padding: 3px 10px; font-size: 12px;}
.ui-select-footer {text-align: right;}
</style>

````javascript
seajs.use(['autocomplete', '$'], function(AutoComplete, $) {
    var ac = new AutoComplete({
        trigger: '#acTrigger1',
        dataSource: [
            {
                deptDesc: "信息平台事业部-统一ID-BUC",
                empId: "67871",
                lastName: "沙先伟",
                nickName: "七斤",
                userId: 238523,
                value: "沙先伟@67871"
            },
            {
                deptDesc: "信息平台事业部-统一ID-BUC",
                empId: "67848",
                lastName: "张耳敏",
                nickName: "昊祯",
                userId: 67848,
                value: "张耳敏@67848"
            }
        ],
        width: 150
    }).render();

    ac.element.on('click', '#xxx', function() {
      //alert(1);
    })
});
````

## 自定义整个模板

默认的模板可以查看 `src/autocomplete.handlebars`，如果有修改模板的操作可如下自己定义

````html
<script id="acTrigger4-template" type="text/x-handlebars-template">
  <div class="{{classPrefix}}">    
    {{#if items}}
    <ul class="{{classPrefix}}-content" data-role="items">
      {{#each items}}
      <li data-role="item" class="{{../classPrefix}}-item"><a href="javascript:''">{{> html}}</a></li>
      {{/each}}
    </ul>
    {{else}}
    <ul class="{{classPrefix}}-content">
      <li class="{{../classPrefix}}-item">
      没有匹配任何数据
      </li>
    </ul>
    {{/if}}
  </div>
</script>
````

当未匹配的时候会有提示

<input id="acTrigger4" type="text" value="" />

````javascript
seajs.use(['autocomplete', '$'], function(AutoComplete, $) {
    var AutoCompleteX = AutoComplete.extend({
        _isEmpty: function() {
          return false;
        }
    });
    var ac = new AutoCompleteX({
        trigger: '#acTrigger4',
        template: $('#acTrigger4-template').html(),
        dataSource: ['abc', 'abd', 'abe', 'acd'],
        width: 150
    }).render();
});
````