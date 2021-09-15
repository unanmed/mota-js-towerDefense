# 所有塔防相关内容

?> 在这一节中，你将对该塔防的内部实现原理进行了解，并可以造出自己的塔防游戏

该塔防技术难度很高，可供一些想要提高js编程能力的人研究，这里列出进阶路线

js编程进阶路线：`普通怪物血条绘制 -> 脚本编辑中的defense项 -> acquireCanvas和returnCanvas的运行机理 -> createCanvas和getContextByName的复写 -> 出怪 -> 怪物绘制与移动 -> 防御塔sprite化 -> 防御塔攻击 -> 状态栏绘制与交互 -> boss血条的绘制 -> 防御塔锁定怪物`

注：该塔防的修改均在`libs`和`main.js`中完成，没有新增插件

游戏发布标准：不得只在进行了诸如**修改了防御塔数据和怪物数据、新增了几张地图**等特别简单的操作后发布，必须**要有自己的特色，可以是很多有意思的怪物属性，很多有意思的塔**等，才可以发布

## 怪物方面

该塔防中对怪物进行了sprite化，即每个怪物就是一个画布，从而完美地解决了怪物重叠问题

### sprite化方式

既然每个怪物就是一个画布，频繁地创建、删除必定会导致性能极差，怪物一多就容易造成严重卡顿。因此，该塔防对这方面进行了优化，采用初始创建200个画布，不够用时再创建100个的方式，极大程度上优化了性能。具体实现原理如下：
```js
// 取用一个空闲画布
defense.prototype.acquireCanvas = function (name, type) {
    // 检测画布的情况
    if (!core.batchCanvas) return;
    if (!core.batchDict) core.batchDict = {};
    if (core.batchDict[name]) return core.batchDict[name];
    // 不填type，默认为怪物
    type = type || 'enemy';
    if (!core.batchCanvas[type]) core.batchCanvas[type] = [];
    var canvases = core.batchCanvas[type];
    // 如果空闲画布长度为0 则继续创建
    if (canvases.length == 0) {
        if (type == 'tower') core.createCanvas(type, 0, 0, 416, 416, 35, 5);
        else if (type == 'mine') core.createCanvas(type, 0, 0, 32, 32, 34, 10);
        else if (type == 'healthBar') core.createCanvas(type, 0, 0, 28, 4, 36, 20);
        else if (type == 'bossHealth') core.createCanvas(type, 0, 0, 352, 16, 60, 2);
        else if (type == 'bossHealth_border') core.createCanvas(type, 0, 0, 386, 34, 61, 2);
        else if (type == 'bossHealth_back') core.createCanvas(type, 0, 0, 352, 16, 59, 2);
        else core.createCanvas(type, 0, 0, 32, 32, 35, 100);
    }
    // 如果仍有空闲画布 则直接取用 并加入到dictionary中
    var canvas = canvases.shift();
    canvas._type = type;
    canvas.canvas.style.display = 'block';
    core.batchDict[name] = canvas;
    return canvas;
};
```

当然，只有这些肯定不够，因为怪物死亡以后画布还在那，导致画布不断增多，设备的压力也会不断增大。因此，怪物死亡后，要把画布返回，并设为空闲画布。具体实现如下：
```js
// 返回一个画布 设为空闲
defense.prototype.returnCanvas = function (name, type) {
    type = type || 'enemy';
    // 这里getContextByName第二个参数填true  表示从batchCanvas 即sprite化专用画布对象中获取 具体参见core.ui.getContextByName的复写
    var c = core.getContextByName(name, true);
    core.clearMap(c);
    if (c) {
        if (type === 'mine') {
            c.canvas.style.transform = '';
            c.canvas.style.zIndex = 34;
        }
        delete c.canvas._type;
        c.canvas.style.display = 'none';
        core.batchCanvas[type].push(c);
        delete core.batchDict[name];
    }
};
```

所有代码见`defense.js`中**960**行至**1027**行

相关api（具体内容请在runtime.d.ts中查看）：
* **core.batchCanvas**：所有的空闲画布
* **core.batchDict**：所有的正在使用的画布，包含使用名称（key）和画布的context（value）
* **core.batchCanvasLength**：所有类型的画布的总长度，用于防止创建画布时id重复
* **acquireCanvas**：获取一个空闲画布
* **returnCanvas**：返回一个画布
* **initDrawEnemys**：初始化所有画布，该操作会删除所有画布并创建初始状态的画布

### 怪物移动

怪物移动是该塔防的核心内容之一，也是难点之一。难主要体现在每个怪物都要单独处理，并且保证不会产生严重卡顿。

塔防中的具体实现原理：利用`registerAnimationFrame`创建一个每帧执行一次的函数，每帧都会计算所有怪物的位置，定位画布，然后在该函数中执行一些需要用到怪物坐标的内容，包括到达基地，踩到地雷，踩到夹击，冰冻，与勇士战斗等，勇士的移动也包含在这个animationFrame里面

全部函数内容在`defense.js`中**1029**行至**1393**行

相关api：
* **core.status.enemys**：包含所有怪物、勇士、怪物数量（有可能不准确）、勇士数量（有可能不准确）
* **core.defense.bossList**：包含所有boss的id
* **core.drawAllEnemy**：初始化绘制，注册绘制animationFrame
* **core.doBattle**：怪物与勇士战斗

### 出怪

出怪也是塔防的核心之一，难度相比于移动较为简单，但内部实际上非常精密

具体实现逻辑：收到出怪命令后，开始出怪，每个一段时间添加一个新怪物，直到怪物全部出完

全部函数内容在`defense.js`中**588**行至**932**行

相关api：
* **core.defense.nowInterval**：距离下一波出怪剩余秒数
* **core.defense.forceInterval**：距离下一波出怪剩余毫秒数
* **core.defense.interval**：距离下一个出怪剩余毫秒数
* **core.initMonster**：初始化出怪列表，获得前几波的出怪信息
* **core.startMonster**：进行下一波出怪
* **core.getUnitId**：获得某个单位的唯一标识，由`单位id_ + number`构成

### 怪物死亡

看起来很简单是吧，实际上也很简单。

实现原理见脚本编辑`defense`的`enemyDie`项

相关api:
* **core.enemyDie**：怪物死亡

### 怪物血条

小怪的血条的代码难度不大，但是boss血条难度很大，因为有css transition动画，涉及到styles.css中的内容，这些东西在造塔的时候不常用。原理就是画图，看代码就行了。

具体实现在`defense.js`中**1467**行至**1618**行

相关api：
* **core.drawHealthBar**：绘制怪物血条
* **core.drawBossHealth**：绘制boss血条

## 防御塔相关

相比于怪物，防御塔的复杂度和难度都要高上很多，也是塔防中最难、最长的一部分

### 防御塔锁定怪物

该塔防中最难的部分，没有之一

#### 获得距离基地最近的怪物（core.getClosestEnemy）

这个是防御塔在攻击时最常调用的函数，为了提高性能，对该函数进行了大量优化，也导致该函数成为该塔防中最难的函数。虽然只有短短的30行，但是在精准度、速度方面都达到了一个很高的水准。

该函数的具体逻辑如下：首先通过目标位置防御塔获取防御塔可以攻击到的格子，攻击不到的格子直接忽略，通过`Array.filter`获取在该范围内的怪物。由于在获得怪物的时候便是排过序的，这里不需要再进行排序，通过n获取前n个怪物，并对在最后一个怪物所在的格子上的所有怪物进行细检索。当然，如果只有这一个怪物，直接返回`前面的怪物以及这个怪物`就行。如果有多个，通过该格子上的所有怪物距离下一个格子的距离再进行排序，返回前面的和该格子上的前`n-前面格子上的怪物总数`的怪物

代码见`defense.js`中**2471**行至**2503**行

#### 获得排序后的怪物列表（core.getSortedEnemy）

该函数会将排序后的列表存入缓存，该缓存只会缓存1帧，之后便会被清除

代码见`defense.js`中**2505**行至**2518**行