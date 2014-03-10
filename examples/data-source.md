# 数据源

- order:2

---

<script>
seajs.use('select.css');
</script>

在使用前先看下数据源的文档

## 使用对象

数据源通常为数组，但也可以为对象，如果是对象默认会去找对象的 data 属性。

在每次输入的时候都会调用下 dataSource

<textarea id="acTrigger1"></textarea>

````javascript
seajs.use('autocomplete', function(AutoComplete) {
    new AutoComplete({
        trigger: '#acTrigger1',
        dataSource: {
            data: ['abc', 'abd', 'abe', 'acd']
        },
        width: 150
    }).render();
});
````

## 使用异步数据

一般异步获取后的数据不需要过滤了，可设置 `filter` 为空

<textarea id="acTrigger2"></textarea>

````javascript
seajs.use('autocomplete', function(AutoComplete) {
    var ac = new AutoComplete({
        trigger: '#acTrigger2',
        dataSource: './data.json?q={{query}}',
        width: 150,
        selectNum: 10,
        defaultSelected: [{
            label: '张耳敏@67848',
            userId: 67848
        }]
    }).render();
});
````

## 测试
<textarea id="auser"></textarea>
````javascript
seajs.use('autocomplete', function(AutoComplete) {
    new AutoComplete({
        trigger: '#auser',
        classPrefix: 'ui-select',
        dataSource: 'https://ihave.alibaba-inc.com/rpc/userQuery/findUserForNameAndEmpId.json?query={{query}}',
        //dataSource: './data.json?q={{query}}',
        locator: 'content',
        width: 306,
        selectNum: 10,
        resetKey: 'userId',
        filter: function(data, query){
            var result = [];
            for(var i = 0, len = data.length; i < len; i ++){
                var item = data[i],
                    name = item.lastName,
                    empid = item.empId,
                    userId = item.userId,
                    nick = item['nickName'];

                data[i]['label'] = name + '(' + (nick ? nick : empid) + ')';
                data[i]['userId'] = userId;
                result.push(data[i]);
            }
            return result;
        },
        defaultSelected: [{
            label: '张耳敏@67848',
            userId: 67848
        }]
    }).render();
});
````

## 自定义数据源

可以把本地数据和异步数据结合起来

<input id="acTrigger3" type="text" value="" />

````javascript
seajs.use(['autocomplete', '$'], function(AutoComplete, $) {
    var local = ['ade', 'adf'];
    new AutoComplete({
        trigger: '#acTrigger3',
        dataSource: function(value) {
            var that = this;
            $.ajax('./data.json', {
                dataType: 'json'
            })
            .success(function(data) {
                that.trigger('data', data.concat(local));
            })
            .error(function(data) {
                that.trigger('data', {});
            });
        },
        width: 150
    }).render();
});
````

## 处理嵌套结构

如果数据结构很复杂，你可以通过 `locator` 找到你要的数据

<input id="acTrigger4" type="text" value="" />

````javascript
seajs.use(['autocomplete', '$'], function(AutoComplete, $) {
    new AutoComplete({
        trigger: '#acTrigger4',
        locator: 'my.mother.father.brothers',
        dataSource: {
            my: {
                mother: {
                    father: {
                        brothers: [
                            'abc',
                            'abd',
                            'abe',
                            'acd'
                        ]
                    }
                }
            }
        },
        width: 150
    }).render();
});
````

## 处理复杂数据结构

数据不是字符串而是复杂结构

<input id="acTrigger5" type="text" value="" />

````javascript
seajs.use(['autocomplete', '$'], function(AutoComplete, $) {
    new AutoComplete({
        trigger: '#acTrigger5',
        dataSource: [
          {value: 'abc', myprop: '123'},
          {value: 'abd', myprop: '124'},
          {value: 'abe', myprop: '125'},
          {value: 'acd', myprop: '134'}
        ],
        width: 150
    }).render();
});
````
