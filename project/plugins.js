var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    "init": function() {
        // 可以写一些直接执行的代码
        // 在这里写的代码将会在【资源加载前】被执行，此时图片等资源尚未被加载。
        // 请勿在这里对包括bgm，图片等资源进行操作。

        this._afterLoadResources = function() {
            // 本函数将在所有资源加载完毕后，游戏开启前被执行
            // 可以在这个函数里面对资源进行一些操作。
            // 若需要进行切分图片，可以使用 core.splitImage() 函数，或直接在全塔属性-图片切分中操作
        };

        // 可以在任何地方（如afterXXX或自定义脚本事件）调用函数，方法为 core.plugin.xxx();
        // 从V2.6开始，插件中用this.XXX方式定义的函数也会被转发到core中，详见文档-脚本-函数的转发。
    },
    "drawLight": function() {

        // 绘制灯光/漆黑层效果。调用方式 core.plugin.drawLight(...)
        // 【参数说明】
        // name：必填，要绘制到的画布名；可以是一个系统画布，或者是个自定义画布；如果不存在则创建
        // color：可选，只能是一个0~1之间的数，为不透明度的值。不填则默认为0.9。
        // lights：可选，一个数组，定义了每个独立的灯光。
        //        其中每一项是三元组 [x,y,r] x和y分别为该灯光的横纵坐标，r为该灯光的半径。
        // lightDec：可选，0到1之间，光从多少百分比才开始衰减（在此范围内保持全亮），不设置默认为0。
        //        比如lightDec为0.5代表，每个灯光部分内圈50%的范围全亮，50%以后才开始快速衰减。
        // 【调用样例】
        // core.plugin.drawLight('curtain'); // 在curtain层绘制全图不透明度0.9，等价于更改画面色调为[0,0,0,0.9]。
        // core.plugin.drawLight('ui', 0.95, [[25,11,46]]); // 在ui层绘制全图不透明度0.95，其中在(25,11)点存在一个半径为46的灯光效果。
        // core.plugin.drawLight('test', 0.2, [[25,11,46,0.1]]); // 创建一个test图层，不透明度0.2，其中在(25,11)点存在一个半径为46的灯光效果，灯光中心不透明度0.1。
        // core.plugin.drawLight('test2', 0.9, [[25,11,46],[105,121,88],[301,221,106]]); // 创建test2图层，且存在三个灯光效果，分别是中心(25,11)半径46，中心(105,121)半径88，中心(301,221)半径106。
        // core.plugin.drawLight('xxx', 0.3, [[25,11,46],[105,121,88,0.2]], 0.4); // 存在两个灯光效果，它们在内圈40%范围内保持全亮，40%后才开始衰减。
        this.drawLight = function(name, color, lights, lightDec) {

            // 清空色调层；也可以修改成其它层比如animate/weather层，或者用自己创建的canvas
            var ctx = core.getContextByName(name);
            if (ctx == null) {
                if (typeof name == 'string')
                    ctx = core.createCanvas(name, 0, 0, core.__PIXELS__, core.__PIXELS__, 98);
                else return;
            }

            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            core.clearMap(name);
            // 绘制色调层，默认不透明度
            if (color == null) color = 0.9;
            ctx.fillStyle = "rgba(0,0,0," + color + ")";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            lightDec = core.clamp(lightDec, 0, 1);

            // 绘制每个灯光效果
            ctx.globalCompositeOperation = 'destination-out';
            lights.forEach(function(light) {
                // 坐标，半径，中心不透明度
                var x = light[0],
                    y = light[1],
                    r = light[2];
                // 计算衰减距离
                var decDistance = parseInt(r * lightDec);
                // 正方形区域的直径和左上角坐标
                var grd = ctx.createRadialGradient(x, y, decDistance, x, y, r);
                grd.addColorStop(0, "rgba(0,0,0,1)");
                grd.addColorStop(1, "rgba(0,0,0,0)");
                ctx.beginPath();
                ctx.fillStyle = grd;
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';
            // 可以在任何地方（如afterXXX或自定义脚本事件）调用函数，方法为  core.plugin.xxx();
        }
    },
    "shop": function() {
        // 【全局商店】相关的功能
        // 
        // 打开一个全局商店
        // shopId：要打开的商店id；noRoute：是否不计入录像
        this.openShop = function(shopId, noRoute) {
            var shop = core.status.shops[shopId];
            // Step 1: 检查能否打开此商店
            if (!this.canOpenShop(shopId)) {
                core.drawTip("该商店尚未开启");
                return false;
            }

            // Step 2: （如有必要）记录打开商店的脚本事件
            if (!noRoute) {
                core.status.route.push("shop:" + shopId);
            }

            // Step 3: 检查道具商店 or 公共事件
            if (shop.item) {
                if (core.openItemShop) {
                    core.openItemShop(shopId);
                } else {
                    core.playSound('操作失败');
                    core.insertAction("道具商店插件不存在！请检查是否存在该插件！");
                }
                return;
            }
            if (shop.commonEvent) {
                core.insertCommonEvent(shop.commonEvent, shop.args);
                return;
            }

            // Step 4: 执行标准公共商店    
            core.insertAction(this._convertShop(shop));
            return true;
        }

        ////// 将一个全局商店转变成可预览的公共事件 //////
        this._convertShop = function(shop) {
            return [
                { "type": "function", "function": "function() {core.setFlag('@temp@shop', true);}" },
                {
                    "type": "while",
                    "condition": "true",
                    "data": [
                        // 检测能否访问该商店
                        {
                            "type": "if",
                            "condition": "core.isShopVisited('" + shop.id + "')",
                            "true": [
                                // 可以访问，直接插入执行效果
                                { "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', false) }" },
                            ],
                            "false": [
                                // 不能访问的情况下：检测能否预览
                                {
                                    "type": "if",
                                    "condition": shop.disablePreview,
                                    "true": [
                                        // 不可预览，提示并退出
                                        { "type": "playSound", "name": "操作失败" },
                                        "当前无法访问该商店！",
                                        { "type": "break" },
                                    ],
                                    "false": [
                                        // 可以预览：将商店全部内容进行替换
                                        { "type": "tip", "text": "当前处于预览模式，不可购买" },
                                        { "type": "function", "function": "function() { core.plugin._convertShop_replaceChoices('" + shop.id + "', true) }" },
                                    ]
                                }
                            ]
                        }
                    ]
                },
                { "type": "function", "function": "function() {core.removeFlag('@temp@shop');}" }
            ];
        }

        this._convertShop_replaceChoices = function(shopId, previewMode) {
            var shop = core.status.shops[shopId];
            var choices = (shop.choices || []).filter(function(choice) {
                if (choice.condition == null || choice.condition == '') return true;
                try { return core.calValue(choice.condition); } catch (e) { return true; }
            }).map(function(choice) {
                var ableToBuy = core.calValue(choice.need);
                return {
                    "text": choice.text,
                    "icon": choice.icon,
                    "color": ableToBuy && !previewMode ? choice.color : [153, 153, 153, 1],
                    "action": ableToBuy && !previewMode ? [{ "type": "playSound", "name": "商店" }].concat(choice.action) : [
                        { "type": "playSound", "name": "操作失败" },
                        { "type": "tip", "text": previewMode ? "预览模式下不可购买" : "购买条件不足" }
                    ]
                };
            }).concat({ "text": "离开", "action": [{ "type": "playSound", "name": "取消" }, { "type": "break" }] });
            core.insertAction({ "type": "choices", "text": shop.text, "choices": choices });
        }

        /// 是否访问过某个快捷商店
        this.isShopVisited = function(id) {
            if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
            var shops = core.getFlag("__shops__");
            if (!shops[id]) shops[id] = {};
            return shops[id].visited;
        }

        /// 当前应当显示的快捷商店列表
        this.listShopIds = function() {
            return Object.keys(core.status.shops).filter(function(id) {
                return core.isShopVisited(id) || !core.status.shops[id].mustEnable;
            });
        }

        /// 是否能够打开某个商店
        this.canOpenShop = function(id) {
            if (this.isShopVisited(id)) return true;
            var shop = core.status.shops[id];
            if (shop.item || shop.commonEvent || shop.mustEnable) return false;
            return true;
        }

        /// 启用或禁用某个快捷商店
        this.setShopVisited = function(id, visited) {
            if (!core.hasFlag("__shops__")) core.setFlag("__shops__", {});
            var shops = core.getFlag("__shops__");
            if (!shops[id]) shops[id] = {};
            if (visited) shops[id].visited = true;
            else delete shops[id].visited;
        }

        /// 能否使用快捷商店
        this.canUseQuickShop = function(id) {
            // 如果返回一个字符串，表示不能，字符串为不能使用的提示
            // 返回null代表可以使用

            // 检查当前楼层的canUseQuickShop选项是否为false
            if (core.status.thisMap.canUseQuickShop === false)
                return '当前楼层不能使用快捷商店。';
            return null;
        }

        /// 允许商店X键退出
        core.registerAction('keyUp', 'shops', function(keycode) {
            if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
            if (core.status.event.data.type != 'choices') return false;
            var data = core.status.event.data.current;
            var choices = data.choices;
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (keycode == 88 || keycode == 27) { // X, ESC
                core.actions._clickAction(core.actions.HSIZE, topIndex + choices.length - 1);
                return true;
            }
            if (keycode == 13 || keycode == 32) return true;
            return false;
        }, 60);

        /// 允许长按空格或回车连续执行操作
        core.registerAction('keyDown', 'shops', function(keycode) {
            if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
            if (core.status.event.data.type != 'choices') return false;
            var data = core.status.event.data.current;
            var choices = data.choices;
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (keycode == 13 || keycode == 32) { // Space, Enter
                core.actions._clickAction(core.actions.HSIZE, topIndex + core.status.event.selection);
                return true;
            }
            return false;
        }, 60);

        // 允许长按屏幕连续执行操作
        core.registerAction('longClick', 'shops', function(x, y, px, py) {
            if (!core.status.lockControl || !core.hasFlag("@temp@shop") || core.status.event.id != 'action') return false;
            if (core.status.event.data.type != 'choices') return false;
            var data = core.status.event.data.current;
            var choices = data.choices;
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (x >= core.actions.CHOICES_LEFT && x <= core.actions.CHOICES_RIGHT && y >= topIndex && y < topIndex + choices.length) {
                core.actions._clickAction(x, y);
                return true;
            }
            return false;
        }, 60);
    },
    "removeMap": function() {
        // 高层塔砍层插件，删除后不会存入存档，不可浏览地图也不可飞到。
        // 推荐用法：
        // 对于超高层或分区域塔，当在1区时将2区以后的地图删除；1区结束时恢复2区，进二区时删除1区地图，以此类推
        // 这样可以大幅减少存档空间，以及加快存读档速度

        // 删除楼层
        // core.removeMaps("MT1", "MT300") 删除MT1~MT300之间的全部层
        // core.removeMaps("MT10") 只删除MT10层
        this.removeMaps = function(fromId, toId) {
            toId = toId || fromId;
            var fromIndex = core.floorIds.indexOf(fromId),
                toIndex = core.floorIds.indexOf(toId);
            if (toIndex < 0) toIndex = core.floorIds.length - 1;
            flags.__visited__ = flags.__visited__ || {};
            flags.__removed__ = flags.__removed__ || [];
            flags.__disabled__ = flags.__disabled__ || {};
            flags.__leaveLoc__ = flags.__leaveLoc__ || {};
            for (var i = fromIndex; i <= toIndex; ++i) {
                var floorId = core.floorIds[i];
                if (core.status.maps[floorId].deleted) continue;
                delete flags.__visited__[floorId];
                flags.__removed__.push(floorId);
                delete flags.__disabled__[floorId];
                delete flags.__leaveLoc__[floorId];
                (core.status.autoEvents || []).forEach(function(event) {
                    if (event.floorId == floorId && event.currentFloor) {
                        core.autoEventExecuting(event.symbol, false);
                        core.autoEventExecuted(event.symbol, false);
                    }
                });
                core.status.maps[floorId].deleted = true;
                core.status.maps[floorId].canFlyTo = false;
                core.status.maps[floorId].canFlyFrom = false;
                core.status.maps[floorId].cannotViewMap = true;
            }
        }

        // 恢复楼层
        // core.resumeMaps("MT1", "MT300") 恢复MT1~MT300之间的全部层
        // core.resumeMaps("MT10") 只恢复MT10层
        this.resumeMaps = function(fromId, toId) {
            toId = toId || fromId;
            var fromIndex = core.floorIds.indexOf(fromId),
                toIndex = core.floorIds.indexOf(toId);
            if (toIndex < 0) toIndex = core.floorIds.length - 1;
            flags.__removed__ = flags.__removed__ || [];
            for (var i = fromIndex; i <= toIndex; ++i) {
                var floorId = core.floorIds[i];
                if (!core.status.maps[floorId].deleted) continue;
                flags.__removed__ = flags.__removed__.filter(function(f) { return f != floorId; });
                core.status.maps[floorId] = core.loadFloor(floorId);
            }
        }

        // 分区砍层相关
        var inAnyPartition = function(floorId) {
            var inPartition = false;
            (core.floorPartitions || []).forEach(function(floor) {
                var fromIndex = core.floorIds.indexOf(floor[0]);
                var toIndex = core.floorIds.indexOf(floor[1]);
                var index = core.floorIds.indexOf(floorId);
                if (fromIndex < 0 || index < 0) return;
                if (toIndex < 0) toIndex = core.floorIds.length - 1;
                if (index >= fromIndex && index <= toIndex) inPartition = true;
            });
            return inPartition;
        }

        // 分区砍层
        this.autoRemoveMaps = function(floorId) {
            if (main.mode != 'play' || !inAnyPartition(floorId)) return;
            // 根据分区信息自动砍层与恢复
            (core.floorPartitions || []).forEach(function(floor) {
                var fromIndex = core.floorIds.indexOf(floor[0]);
                var toIndex = core.floorIds.indexOf(floor[1]);
                var index = core.floorIds.indexOf(floorId);
                if (fromIndex < 0 || index < 0) return;
                if (toIndex < 0) toIndex = core.floorIds.length - 1;
                if (index >= fromIndex && index <= toIndex) {
                    core.resumeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
                } else {
                    core.removeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
                }
            });
        }
    },
    "fiveLayers": function() {
        // 是否启用五图层（增加背景2层和前景2层） 将__enable置为true即会启用；启用后请保存后刷新编辑器
        // 背景层2将会覆盖背景层 被事件层覆盖 前景层2将会覆盖前景层
        // 另外 请注意加入两个新图层 会让大地图的性能降低一些
        // 插件作者：ad
        var __enable = false;
        if (!__enable) return;

        // 创建新图层
        function createCanvas(name, zIndex) {
            if (!name) return;
            var canvas = document.createElement('canvas');
            canvas.id = name;
            canvas.className = 'gameCanvas';
            // 编辑器模式下设置zIndex会导致加入的图层覆盖优先级过高
            if (main.mode != "editor") canvas.style.zIndex = zIndex || 0;
            // 将图层插入进游戏内容
            document.getElementById('gameDraw').appendChild(canvas);
            var ctx = canvas.getContext('2d');
            core.canvas[name] = ctx;
            canvas.width = core.__PIXELS__;
            canvas.height = core.__PIXELS__;
            return canvas;
        }

        var bg2Canvas = createCanvas('bg2', 20);
        var fg2Canvas = createCanvas('fg2', 63);
        // 大地图适配
        core.bigmap.canvas = ["bg2", "fg2", "bg", "event", "event2", "fg", "damage"];
        core.initStatus.bg2maps = {};
        core.initStatus.fg2maps = {};

        if (main.mode == 'editor') {
            /*插入编辑器的图层 不做此步新增图层无法在编辑器显示*/
            // 编辑器图层覆盖优先级 eui > efg > fg(前景层) > event2(48*32图块的事件层) > event(事件层) > bg(背景层)
            // 背景层2(bg2) 插入事件层(event)之前(即bg与event之间)
            document.getElementById('mapEdit').insertBefore(bg2Canvas, document.getElementById('event'));
            // 前景层2(fg2) 插入编辑器前景(efg)之前(即fg之后)
            document.getElementById('mapEdit').insertBefore(fg2Canvas, document.getElementById('ebm'));
            // 原本有三个图层 从4开始添加
            var num = 4;
            // 新增图层存入editor.dom中
            editor.dom.bg2c = core.canvas.bg2.canvas;
            editor.dom.bg2Ctx = core.canvas.bg2;
            editor.dom.fg2c = core.canvas.fg2.canvas;
            editor.dom.fg2Ctx = core.canvas.fg2;
            editor.dom.maps.push('bg2map', 'fg2map');
            editor.dom.canvas.push('bg2', 'fg2');

            // 创建编辑器上的按钮
            var createCanvasBtn = function(name) {
                // 电脑端创建按钮
                var input = document.createElement('input');
                // layerMod4/layerMod5
                var id = 'layerMod' + num++;
                // bg2map/fg2map
                var value = name + 'map';
                input.type = 'radio';
                input.name = 'layerMod';
                input.id = id;
                input.value = value;
                editor.dom[id] = input;
                input.onchange = function() {
                    editor.uifunctions.setLayerMod(value);
                }
                return input;
            };

            var createCanvasBtn_mobile = function(name) {
                // 手机端往选择列表中添加子选项
                var input = document.createElement('option');
                var id = 'layerMod' + num++;
                var value = name + 'map';
                input.name = 'layerMod';
                input.value = value;
                editor.dom[id] = input;
                return input;
            };
            if (!editor.isMobile) {
                var input = createCanvasBtn('bg2');
                var input2 = createCanvasBtn('fg2');
                // 获取事件层及其父节点
                var child = document.getElementById('layerMod'),
                    parent = child.parentNode;
                // 背景层2插入事件层前
                parent.insertBefore(input, child);
                // 不能直接更改背景层2的innerText 所以创建文本节点
                var txt = document.createTextNode('背景层2');
                // 插入事件层前(即新插入的背景层2前)
                parent.insertBefore(txt, child);
                // 向最后插入前景层2(即插入前景层后)
                parent.appendChild(input2);
                var txt2 = document.createTextNode('前景层2');
                parent.appendChild(txt2);
            } else {
                var input = createCanvasBtn_mobile('bg2');
                var input2 = createCanvasBtn_mobile('fg2');
                // 手机端因为是选项 所以可以直接改innerText
                input.innerText = '背景层2';
                input2.innerText = '前景层2';
                var parent = document.getElementById('layerMod');
                parent.insertBefore(input, parent.children[1]);
                parent.appendChild(input2);
            }
        }

        var _loadFloor_doNotCopy = core.maps._loadFloor_doNotCopy;
        core.maps._loadFloor_doNotCopy = function() {
                return ["bg2map", "fg2map"].concat(_loadFloor_doNotCopy());
            }
            ////// 绘制背景和前景层 //////
        core.maps._drawBg_draw = function(floorId, toDrawCtx, cacheCtx, config) {
            config.ctx = cacheCtx;
            core.maps._drawBg_drawBackground(floorId, config);
            // ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制背景图块；后绘制的覆盖先绘制的。
            core.maps._drawFloorImages(floorId, config.ctx, 'bg', null, null, config.onMap);
            core.maps._drawBgFgMap(floorId, 'bg', config);
            if (config.onMap) {
                core.drawImage(toDrawCtx, cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
                core.clearMap('bg2');
                core.clearMap(cacheCtx);
            }
            core.maps._drawBgFgMap(floorId, 'bg2', config);
            if (config.onMap) core.drawImage('bg2', cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
            config.ctx = toDrawCtx;
        }
        core.maps._drawFg_draw = function(floorId, toDrawCtx, cacheCtx, config) {
                config.ctx = cacheCtx;
                // ------ 调整这两行的顺序来控制是先绘制贴图还是先绘制前景图块；后绘制的覆盖先绘制的。
                core.maps._drawFloorImages(floorId, config.ctx, 'fg', null, null, config.onMap);
                core.maps._drawBgFgMap(floorId, 'fg', config);
                if (config.onMap) {
                    core.drawImage(toDrawCtx, cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
                    core.clearMap('fg2');
                    core.clearMap(cacheCtx);
                }
                core.maps._drawBgFgMap(floorId, 'fg2', config);
                if (config.onMap) core.drawImage('fg2', cacheCtx.canvas, core.bigmap.v2 ? -32 : 0, core.bigmap.v2 ? -32 : 0);
                config.ctx = toDrawCtx;
            }
            ////// 移动判定 //////
        core.maps._generateMovableArray_arrays = function(floorId) {
            return {
                bgArray: this.getBgMapArray(floorId),
                fgArray: this.getFgMapArray(floorId),
                eventArray: this.getMapArray(floorId),
                bg2Array: this._getBgFgMapArray('bg2', floorId),
                fg2Array: this._getBgFgMapArray('fg2', floorId)
            };
        }
    },
    "itemShop": function() {
        // 道具商店相关的插件
        // 可在全塔属性-全局商店中使用「道具商店」事件块进行编辑（如果找不到可以在入口方块中找）

        var shopId = null; // 当前商店ID
        var type = 0; // 当前正在选中的类型，0买入1卖出
        var selectItem = 0; // 当前正在选中的道具
        var selectCount = 0; // 当前已经选中的数量
        var page = 0;
        var totalPage = 0;
        var totalMoney = 0;
        var list = [];
        var shopInfo = null; // 商店信息
        var choices = []; // 商店选项
        var use = 'money';
        var useText = '金币';

        var bigFont = core.ui._buildFont(20, false),
            middleFont = core.ui._buildFont(18, false);

        this._drawItemShop = function() {
            // 绘制道具商店

            // Step 1: 背景和固定的几个文字
            core.ui._createUIEvent();
            core.clearMap('uievent');
            core.ui.clearUIEventSelector();
            core.setTextAlign('uievent', 'left');
            core.setTextBaseline('uievent', 'top');
            core.fillRect('uievent', 0, 0, 416, 416, 'black');
            core.drawWindowSkin('winskin.png', 'uievent', 0, 0, 416, 56);
            core.drawWindowSkin('winskin.png', 'uievent', 0, 56, 312, 56);
            core.drawWindowSkin('winskin.png', 'uievent', 0, 112, 312, 304);
            core.drawWindowSkin('winskin.png', 'uievent', 312, 56, 104, 56);
            core.drawWindowSkin('winskin.png', 'uievent', 312, 112, 104, 304);
            core.setFillStyle('uievent', 'white');
            core.setStrokeStyle('uievent', 'white');
            core.fillText("uievent", "购买", 32, 74, 'white', bigFont);
            core.fillText("uievent", "卖出", 132, 74);
            core.fillText("uievent", "离开", 232, 74);
            core.fillText("uievent", "当前" + useText, 324, 66, null, middleFont);
            core.setTextAlign("uievent", "right");
            core.fillText("uievent", core.formatBigNumber(core.status.hero[use]), 405, 89);
            core.setTextAlign("uievent", "left");
            core.ui.drawUIEventSelector(1, "winskin.png", 22 + 100 * type, 66, 60, 33);
            if (selectItem != null) {
                core.setTextAlign('uievent', 'center');
                core.fillText("uievent", type == 0 ? "买入个数" : "卖出个数", 364, 320, null, bigFont);
                core.fillText("uievent", "<   " + selectCount + "   >", 364, 350);
                core.fillText("uievent", "确定", 364, 380);
            }

            // Step 2：获得列表并展示
            list = choices.filter(function(one) {
                if (one.condition != null && one.condition != '') {
                    try { if (!core.calValue(one.condition)) return false; } catch (e) {}
                }
                return (type == 0 && one.money != null) || (type == 1 && one.sell != null);
            });
            var per_page = 6;
            totalPage = Math.ceil(list.length / per_page);
            page = Math.floor((selectItem || 0) / per_page) + 1;

            // 绘制分页
            if (totalPage > 1) {
                var half = 156;
                core.setTextAlign('uievent', 'center');
                core.fillText('uievent', page + " / " + totalPage, half, 388, null, middleFont);
                if (page > 1) core.fillText('uievent', '上一页', half - 80, 388);
                if (page < totalPage) core.fillText('uievent', '下一页', half + 80, 388);
            }
            core.setTextAlign('uievent', 'left');

            // 绘制每一项
            var start = (page - 1) * per_page;
            for (var i = 0; i < per_page; ++i) {
                var curr = start + i;
                if (curr >= list.length) break;
                var item = list[curr];
                core.drawIcon('uievent', item.id, 10, 125 + i * 40);
                core.setTextAlign('uievent', 'left');
                core.fillText('uievent', core.material.items[item.id].name, 50, 132 + i * 40, null, bigFont);
                core.setTextAlign('uievent', 'right');
                core.fillText('uievent', (type == 0 ? core.calValue(item.money) : core.calValue(item.sell)) + useText + "/个", 300, 133 + i * 40, null, middleFont);
                core.setTextAlign("uievent", "left");
                if (curr == selectItem) {
                    // 绘制描述，文字自动放缩
                    var text = core.material.items[item.id].text || "该道具暂无描述";
                    try { text = core.replaceText(text); } catch (e) {}
                    for (var fontSize = 20; fontSize >= 8; fontSize -= 2) {
                        var config = { left: 10, fontSize: fontSize, maxWidth: 403 };
                        var height = core.getTextContentHeight(text, config);
                        if (height <= 50) {
                            config.top = (56 - height) / 2;
                            core.drawTextContent("uievent", text, config);
                            break;
                        }
                    }
                    core.ui.drawUIEventSelector(2, "winskin.png", 8, 120 + i * 40, 295, 40);
                    if (type == 0 && item.number != null) {
                        core.fillText("uievent", "存货", 324, 132, null, bigFont);
                        core.setTextAlign("uievent", "right");
                        core.fillText("uievent", item.number, 406, 132, null, null, 40);
                    } else if (type == 1) {
                        core.fillText("uievent", "数量", 324, 132, null, bigFont);
                        core.setTextAlign("uievent", "right");
                        core.fillText("uievent", core.itemCount(item.id), 406, 132, null, null, 40);
                    }
                    core.setTextAlign("uievent", "left");
                    core.fillText("uievent", "预计" + useText, 324, 250);
                    core.setTextAlign("uievent", "right");
                    totalMoney = selectCount * (type == 0 ? core.calValue(item.money) : core.calValue(item.sell));
                    core.fillText("uievent", core.formatBigNumber(totalMoney), 405, 280);

                    core.setTextAlign("uievent", "left");
                    core.fillText("uievent", type == 0 ? "已购次数" : "已卖次数", 324, 170);
                    core.setTextAlign("uievent", "right");
                    core.fillText("uievent", (type == 0 ? item.money_count : item.sell_count) || 0, 405, 200);
                }
            }

            core.setTextAlign('uievent', 'left');
            core.setTextBaseline('uievent', 'alphabetic');
        }

        var _add = function(item, delta) {
            if (item == null) return;
            selectCount = core.clamp(
                selectCount + delta, 0,
                Math.min(type == 0 ? Math.floor(core.status.hero[use] / core.calValue(item.money)) : core.itemCount(item.id),
                    type == 0 && item.number != null ? item.number : Number.MAX_SAFE_INTEGER)
            );
        }

        var _confirm = function(item) {
            if (item == null || selectCount == 0) return;
            if (type == 0) {
                core.status.hero[use] -= totalMoney;
                core.getItem(item.id, selectCount);
                core.stopSound();
                core.playSound('确定');
                if (item.number != null) item.number -= selectCount;
                item.money_count = (item.money_count || 0) + selectCount;
            } else {
                core.status.hero[use] += totalMoney;
                core.removeItem(item.id, selectCount);
                core.playSound('确定');
                core.drawTip("成功卖出" + selectCount + "个" + core.material.items[item.id].name, item.id);
                if (item.number != null) item.number += selectCount;
                item.sell_count = (item.sell_count || 0) + selectCount;
            }
            selectCount = 0;
        }

        this._performItemShopKeyBoard = function(keycode) {
            var item = list[selectItem] || null;
            // 键盘操作
            switch (keycode) {
                case 38: // up
                    if (selectItem == null) break;
                    if (selectItem == 0) selectItem = null;
                    else selectItem--;
                    selectCount = 0;
                    break;
                case 37: // left
                    if (selectItem == null) {
                        if (type > 0) type--;
                        break;
                    }
                    _add(item, -1);
                    break;
                case 39: // right
                    if (selectItem == null) {
                        if (type < 2) type++;
                        break;
                    }
                    _add(item, 1);
                    break;
                case 40: // down
                    if (selectItem == null) {
                        if (list.length > 0) selectItem = 0;
                        break;
                    }
                    if (list.length == 0) break;
                    selectItem = Math.min(selectItem + 1, list.length - 1);
                    selectCount = 0;
                    break;
                case 13:
                case 32: // Enter/Space
                    if (selectItem == null) {
                        if (type == 2)
                            core.insertAction({ "type": "break" });
                        else if (list.length > 0)
                            selectItem = 0;
                        break;
                    }
                    _confirm(item);
                    break;
                case 27: // ESC
                    if (selectItem == null) {
                        core.insertAction({ "type": "break" });
                        break;
                    }
                    selectItem = null;
                    break;
            }
        }

        this._performItemShopClick = function(px, py) {
            var item = list[selectItem] || null;
            // 鼠标操作
            if (px >= 22 && px <= 82 && py >= 71 && py <= 102) {
                // 买
                if (type != 0) {
                    type = 0;
                    selectItem = null;
                    selectCount = 0;
                }
                return;
            }
            if (px >= 122 && px <= 182 && py >= 71 && py <= 102) {
                // 卖
                if (type != 1) {
                    type = 1;
                    selectItem = null;
                    selectCount = 0;
                }
                return;
            }
            if (px >= 222 && px <= 282 && py >= 71 && py <= 102) // 离开
                return core.insertAction({ "type": "break" });
            // < >
            if (px >= 318 && px <= 341 && py >= 348 && py <= 376)
                return _add(item, -1);
            if (px >= 388 && px <= 416 && py >= 348 && py <= 376)
                return _add(item, 1);
            // 确定
            if (px >= 341 && px <= 387 && py >= 380 && py <= 407)
                return _confirm(item);

            // 上一页/下一页
            if (px >= 45 && px <= 105 && py >= 388) {
                if (page > 1) {
                    selectItem -= 6;
                    selectCount = 0;
                }
                return;
            }
            if (px >= 208 && px <= 268 && py >= 388) {
                if (page < totalPage) {
                    selectItem = Math.min(selectItem + 6, list.length - 1);
                    selectCount = 0;
                }
                return;
            }

            // 实际区域
            if (px >= 9 && px <= 300 && py >= 120 && py < 360) {
                if (list.length == 0) return;
                var index = parseInt((py - 120) / 40);
                var newItem = 6 * (page - 1) + index;
                if (newItem >= list.length) newItem = list.length - 1;
                if (newItem != selectItem) {
                    selectItem = newItem;
                    selectCount = 0;
                }
                return;
            }
        }

        this._performItemShopAction = function() {
            if (flags.type == 0) return this._performItemShopKeyBoard(flags.keycode);
            else return this._performItemShopClick(flags.px, flags.py);
        }

        this.openItemShop = function(itemShopId) {
            shopId = itemShopId;
            type = 0;
            page = 0;
            selectItem = null;
            selectCount = 0;
            core.isShopVisited(itemShopId);
            shopInfo = flags.__shops__[shopId];
            if (shopInfo.choices == null) shopInfo.choices = core.clone(core.status.shops[shopId].choices);
            choices = shopInfo.choices;
            use = core.status.shops[shopId].use;
            if (use != 'exp') use = 'money';
            useText = use == 'money' ? '金币' : '经验';

            core.insertAction([{
                    "type": "while",
                    "condition": "true",
                    "data": [
                        { "type": "function", "function": "function () { core.plugin._drawItemShop(); }" },
                        { "type": "wait" },
                        { "type": "function", "function": "function() { core.plugin._performItemShopAction(); }" }
                    ]
                },
                {
                    "type": "function",
                    "function": "function () { core.deleteCanvas('uievent'); core.ui.clearUIEventSelector(); }"
                }
            ]);
        }

    },
    "enemyLevel": function() {
        // 此插件将提供怪物手册中的怪物境界显示
        // 使用此插件需要先给每个怪物定义境界，方法如下：
        // 点击怪物的【配置表格】，找到“【怪物】相关的表格配置”，然后在【名称】仿照增加境界定义：
        /*
         "level": {
         	"_leaf": true,
         	"_type": "textarea",
         	"_string": true,
         	"_data": "境界"
         },
         */
        // 然后保存刷新，可以看到怪物的属性定义中出现了【境界】。再开启本插件即可。

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 这里定义每个境界的显示颜色；可以写'red', '#RRGGBB' 或者[r,g,b,a]四元数组
        var levelToColors = {
            "萌新一阶": "red",
            "萌新二阶": "#FF0000",
            "萌新三阶": [255, 0, 0, 1],
        };

        // 复写 _drawBook_drawName
        var originDrawBook = core.ui._drawBook_drawName;
        core.ui._drawBook_drawName = function(index, enemy, top, left, width) {
            // 如果没有境界，则直接调用原始代码绘制
            if (!enemy.level) return originDrawBook.call(core.ui, index, enemy, top, left, width);
            // 存在境界，则额外进行绘制
            core.setTextAlign('ui', 'center');
            if (enemy.specialText.length == 0) {
                core.fillText('ui', enemy.name, left + width / 2,
                    top + 27, '#DDDDDD', this._buildFont(17, true));
                core.fillText('ui', enemy.level, left + width / 2,
                    top + 51, core.arrayToRGBA(levelToColors[enemy.level] || '#DDDDDD'), this._buildFont(14, true));
            } else {
                core.fillText('ui', enemy.name, left + width / 2,
                    top + 20, '#DDDDDD', this._buildFont(17, true), width);
                switch (enemy.specialText.length) {
                    case 1:
                        core.fillText('ui', enemy.specialText[0], left + width / 2,
                            top + 38, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'),
                            this._buildFont(14, true), width);
                        break;
                    case 2:
                        // Step 1: 计算字体
                        var text = enemy.specialText[0] + "  " + enemy.specialText[1];
                        core.setFontForMaxWidth('ui', text, width, this._buildFont(14, true));
                        // Step 2: 计算总宽度
                        var totalWidth = core.calWidth('ui', text);
                        var leftWidth = core.calWidth('ui', enemy.specialText[0]);
                        var rightWidth = core.calWidth('ui', enemy.specialText[1]);
                        // Step 3: 绘制
                        core.fillText('ui', enemy.specialText[0], left + (width + leftWidth - totalWidth) / 2,
                            top + 38, core.arrayToRGBA((enemy.specialColor || [])[0] || '#FF6A6A'));
                        core.fillText('ui', enemy.specialText[1], left + (width + totalWidth - rightWidth) / 2,
                            top + 38, core.arrayToRGBA((enemy.specialColor || [])[1] || '#FF6A6A'));
                        break;
                    default:
                        core.fillText('ui', '多属性...', left + width / 2,
                            top + 38, '#FF6A6A', this._buildFont(14, true), width);
                }
                core.fillText('ui', enemy.level, left + width / 2,
                    top + 56, core.arrayToRGBA(levelToColors[enemy.level] || '#DDDDDD'), this._buildFont(14, true));
            }
        }

        // 也可以复写其他的属性颜色如怪物攻防等，具体参见下面的例子的注释部分
        core.ui._drawBook_drawRow1 = function(index, enemy, top, left, width, position) {
            // 绘制第一行
            core.setTextAlign('ui', 'left');
            var b13 = this._buildFont(13, true),
                f13 = this._buildFont(13, false);
            var col1 = left,
                col2 = left + width * 9 / 25,
                col3 = left + width * 17 / 25;
            core.fillText('ui', '生命', col1, position, '#DDDDDD', f13);
            core.fillText('ui', core.formatBigNumber(enemy.hp || 0), col1 + 30, position, /*'red' */ null, b13);
            core.fillText('ui', '攻击', col2, position, null, f13);
            core.fillText('ui', core.formatBigNumber(enemy.atk || 0), col2 + 30, position, /* '#FF0000' */ null, b13);
            core.fillText('ui', '防御', col3, position, null, f13);
            core.fillText('ui', core.formatBigNumber(enemy.def || 0), col3 + 30, position, /* [255, 0, 0, 1] */ null, b13);
        }


    },
    "dynamicHp": function() {
        // 此插件允许人物血量动态进行变化
        // 原作：Fux2（老黄鸡）

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        var speed = 0.05; // 动态血量变化速度，越大越快。

        var _currentHp = null;
        var _lastStatus = null;
        var _check = function() {
            if (_lastStatus != core.status.hero) {
                _lastStatus = core.status.hero;
                _currentHp = core.status.hero.hp;
            }
        }

        core.registerAnimationFrame('dynamicHp', true, function() {
            _check();
            if (core.status.hero.hp != _currentHp) {
                var dis = (_currentHp - core.status.hero.hp) * speed;
                if (Math.abs(dis) < 2) {
                    _currentHp = core.status.hero.hp;
                } else {
                    _currentHp -= dis;
                }
                core.setStatusBarInnerHTML('hp', _currentHp);
            }
        });
    },
    "multiHeros": function() {
        // 多角色插件
        // Step 1: 启用本插件
        // Step 2: 定义每个新的角色各项初始数据（参见下方注释）
        // Step 3: 在游戏中的任何地方都可以调用 `core.changeHero()` 进行切换；也可以 `core.changeHero(1)` 来切换到某个具体的角色上

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 在这里定义全部的新角色属性
        // 请注意，在这里定义的内容不会多角色共用，在切换时会进行恢复。
        // 你也可以自行新增或删除，比如不共用金币则可以加上"money"的初始化，不共用道具则可以加上"items"的初始化，
        // 多角色共用hp的话则删除hp，等等。总之，不共用的属性都在这里进行定义就好。
        var hero1 = {
            "floorId": "MT0", // 该角色初始楼层ID；如果共用楼层可以注释此项
            "image": "brave.png", // 角色的行走图名称；此项必填不然会报错
            "name": "1号角色",
            "lv": 1,
            "hp": 10000, // 如果HP共用可注释此项
            "atk": 1000,
            "def": 1000,
            "mdef": 0,
            // "money": 0, // 如果要不共用金币则取消此项注释
            // "exp": 0, // 如果要不共用经验则取消此项注释
            "loc": { "x": 0, "y": 0, "direction": "up" }, // 该角色初始位置；如果共用位置可注释此项
            "items": {
                "tools": {}, // 如果共用消耗道具（含钥匙）则可注释此项
                // "constants": {}, // 如果不共用永久道具（如手册）可取消注释此项
                "equips": {}, // 如果共用在背包的装备可注释此项
            },
            "equipment": [], // 如果共用装备可注释此项；此项和上面的「共用在背包的装备」需要拥有相同状态，不然可能出现问题
        };
        // 也可以类似新增其他角色
        // 新增的角色，各项属性共用与不共用的选择必须和上面完全相同，否则可能出现问题。
        // var hero2 = { ...

        var heroCount = 2; // 包含默认角色在内总共多少个角色，该值需手动修改。

        this.initHeros = function() {
            core.setFlag("hero1", core.clone(hero1)); // 将属性值存到变量中
            // core.setFlag("hero2", core.clone(hero2)); // 更多的角色也存入变量中；每个定义的角色都需要新增一行

            // 检测是否存在装备
            if (hero1.equipment) {
                if (!hero1.items || !hero1.items.equips) {
                    alert('多角色插件的equipment和道具中的equips必须拥有相同状态！');
                }
                // 存99号套装为全空
                var saveEquips = core.getFlag("saveEquips", []);
                saveEquips[99] = [];
                core.setFlag("saveEquips", saveEquips);
            } else {
                if (hero1.items && hero1.items.equips) {
                    alert('多角色插件的equipment和道具中的equips必须拥有相同状态！');
                }
            }
        }

        // 在游戏开始注入initHeros
        var _startGame_setHard = core.events._startGame_setHard;
        core.events._startGame_setHard = function() {
            _startGame_setHard.call(core.events);
            core.initHeros();
        }

        // 切换角色
        // 可以使用 core.changeHero() 来切换到下一个角色
        // 也可以 core.changeHero(1) 来切换到某个角色（默认角色为0）
        this.changeHero = function(toHeroId) {
            var currHeroId = core.getFlag("heroId", 0); // 获得当前角色ID
            if (toHeroId == null) {
                toHeroId = (currHeroId + 1) % heroCount;
            }
            if (currHeroId == toHeroId) return;

            var saveList = Object.keys(hero1);

            // 保存当前内容
            var toSave = {};
            // 暂时干掉 drawTip 和 音效，避免切装时的提示
            var _drawTip = core.ui.drawTip;
            core.ui.drawTip = function() {};
            var _playSound = core.control.playSound;
            core.control.playSound = function() {}
                // 记录当前录像，因为可能存在换装问题
            core.clearRouteFolding();
            var routeLength = core.status.route.length;
            // 优先判定装备
            if (hero1.equipment) {
                core.items.quickSaveEquip(100 + currHeroId);
                core.items.quickLoadEquip(99);
            }

            saveList.forEach(function(name) {
                if (name == 'floorId') toSave[name] = core.status.floorId; // 楼层单独设置
                else if (name == 'items') {
                    toSave.items = core.clone(core.status.hero.items);
                    Object.keys(toSave.items).forEach(function(one) {
                        if (!hero1.items[one]) delete toSave.items[one];
                    });
                } else toSave[name] = core.clone(core.status.hero[name]); // 使用core.clone()来创建新对象
            });

            core.setFlag("hero" + currHeroId, toSave); // 将当前角色信息进行保存
            var data = core.getFlag("hero" + toHeroId); // 获得要切换的角色保存内容

            // 设置角色的属性值
            saveList.forEach(function(name) {
                if (name == "floorId");
                else if (name == "items") {
                    Object.keys(core.status.hero.items).forEach(function(one) {
                        if (data.items[one]) core.status.hero.items[one] = core.clone(data.items[one]);
                    });
                } else {
                    core.status.hero[name] = core.clone(data[name]);
                }
            });
            // 最后装上装备
            if (hero1.equipment) {
                core.items.quickLoadEquip(100 + toHeroId);
            }

            core.ui.drawTip = _drawTip;
            core.control.playSound = _playSound;
            core.status.route = core.status.route.slice(0, routeLength);

            // 插入事件：改变角色行走图并进行楼层切换
            var toFloorId = data.floorId || core.status.floorId;
            var toLoc = data.loc || core.status.hero.loc;
            core.insertAction([
                { "type": "setHeroIcon", "name": data.image || "hero.png" }, // 改变行走图
                // 同层则用changePos，不同层则用changeFloor；这是为了避免共用楼层造成触发eachArrive
                toFloorId != core.status.floorId ? {
                    "type": "changeFloor",
                    "floorId": toFloorId,
                    "loc": [toLoc.x, toLoc.y],
                    "direction": toLoc.direction,
                    "time": 0 // 可以在这里设置切换时间
                } : { "type": "changePos", "loc": [toLoc.x, toLoc.y], "direction": toLoc.direction }
                // 你还可以在这里执行其他事件，比如增加或取消跟随效果
            ]);
            core.setFlag("heroId", toHeroId); // 保存切换到的角色ID
        }
    },
    "itemCategory": function() {
        // 物品分类插件。此插件允许你对消耗道具和永久道具进行分类，比如标记「宝物类」「剧情道具」「药品」等等。
        // 使用方法：
        // 1. 启用本插件
        // 2. 在下方数组中定义全部的物品分类类型
        // 3. 点击道具的【配置表格】，找到“【道具】相关的表格配置”，然后在【道具描述】之后仿照增加道具的分类：
        /*
         "category": {
         	"_leaf": true,
         	"_type": "textarea",
         	"_string": true,
         	"_data": "道具分类"
         },
         */
        // （你也可以选择使用下拉框的方式定义每个道具的分类，写法参见上面的cls）
        // 然后刷新编辑器，就可以对每个物品进行分类了

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 在这里定义所有的道具分类类型，一行一个
        var categories = [
            "宝物类",
            "辅助类",
            "技能类",
            "剧情道具",
            "增益道具",
        ];
        // 当前选中的道具类别
        var currentCategory = null;

        // 重写 core.ui._drawToolbox 以绘制分类类别
        var _drawToolbox = core.ui._drawToolbox;
        core.ui._drawToolbox = function(index) {
            _drawToolbox.call(this, index);
            core.setTextAlign('ui', 'left');
            core.fillText('ui', '类别[E]：' + (currentCategory || "全部"), 15, this.PIXEL - 13);
        }

        // 获得所有应该在道具栏显示的某个类型道具
        core.ui.getToolboxItems = function(cls) {
            // 检查类别
            return Object.keys(core.status.hero.items[cls])
                .filter(function(id) {
                    return !core.material.items[id].hideInToolbox &&
                        (currentCategory == null || core.material.items[id].category == currentCategory);
                }).sort();
        }

        // 注入道具栏的点击事件（点击类别）
        var _clickToolbox = core.actions._clickToolbox;
        core.actions._clickToolbox = function(x, y) {
            if (x >= 0 && x <= this.HSIZE - 4 && y == this.LAST) {
                drawToolboxCategory();
                return;
            }
            return _clickToolbox.call(core.actions, x, y);
        }

        // 注入道具栏的按键事件（E键）
        var _keyUpToolbox = core.actions._keyUpToolbox;
        core.actions._keyUpToolbox = function(keyCode) {
            if (keyCode == 69) {
                // 按E键则打开分类类别选择
                drawToolboxCategory();
                return;
            }
            return _keyUpToolbox.call(core.actions, keyCode);
        }

        // ------ 以下为选择道具分类的相关代码 ------ //

        // 关闭窗口时清除分类选择项
        var _closePanel = core.ui.closePanel;
        core.ui.closePanel = function() {
            currentCategory = null;
            _closePanel.call(core.ui);
        }

        // 弹出菜单以选择具体哪个分类
        // 直接使用 core.drawChoices 进行绘制
        var drawToolboxCategory = function() {
            if (core.status.event.id != 'toolbox') return;
            var selection = categories.indexOf(currentCategory) + 1;
            core.ui.closePanel();
            core.status.event.id = 'toolbox-category';
            core.status.event.selection = selection;
            core.lockControl();
            // 给第一项插入「全部」
            core.drawChoices('请选择道具类别', ["全部"].concat(categories));
        }

        // 选择某一项
        var _selectCategory = function(index) {
            core.ui.closePanel();
            if (index <= 0 || index > categories.length) currentCategory = null;
            else currentCategory = categories[index - 1];
            core.openToolbox();
        }

        var _clickToolBoxCategory = function(x, y) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;

            if (x < core.actions.CHOICES_LEFT || x > core.actions.CHOICES_RIGHT) return false;
            var choices = core.status.event.ui.choices;
            var topIndex = core.actions._getChoicesTopIndex(choices.length);
            if (y >= topIndex && y < topIndex + choices.length) {
                _selectCategory(y - topIndex);
            }
            return true;
        }

        // 注入点击事件
        core.registerAction('onclick', 'toolbox-category', _clickToolBoxCategory, 100);

        // 注入光标跟随事件
        core.registerAction('onmove', 'toolbox-category', function(x, y) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
            core.actions._onMoveChoices(x, y);
            return true;
        }, 100);

        // 注入键盘光标事件
        core.registerAction('keyDown', 'toolbox-category', function(keyCode) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
            core.actions._keyDownChoices(keyCode);
            return true;
        }, 100);

        // 注入键盘按键事件
        core.registerAction('keyUp', 'toolbox-category', function(keyCode) {
            if (!core.status.lockControl || core.status.event.id != 'toolbox-category') return false;
            core.actions._selectChoices(core.status.event.ui.choices.length, keyCode, _clickToolBoxCategory);
            return true;
        }, 100);

    },
    "heroFourFrames": function() {
        // 样板的勇士/跟随者移动时只使用2、4两帧，观感较差。本插件可以将四帧全用上。

        // 是否启用本插件
        var __enable = false;
        if (!__enable) return;

        ["up", "down", "left", "right"].forEach(function(one) {
            // 指定中间帧动画
            core.material.icons.hero[one].midFoot = 2;
        });

        var heroMoving = function(timestamp) {
            if (core.status.heroMoving <= 0) return;
            if (timestamp - core.animateFrame.moveTime > core.values.moveSpeed) {
                core.animateFrame.leftLeg++;
                core.animateFrame.moveTime = timestamp;
            }
            core.drawHero(['stop', 'leftFoot', 'midFoot', 'rightFoot'][core.animateFrame.leftLeg % 4], 4 * core.status.heroMoving);
        }
        core.registerAnimationFrame('heroMoving', true, heroMoving);

        core.events._eventMoveHero_moving = function(step, moveSteps) {
            var curr = moveSteps[0];
            var direction = curr[0],
                x = core.getHeroLoc('x'),
                y = core.getHeroLoc('y');
            // ------ 前进/后退
            var o = direction == 'backward' ? -1 : 1;
            if (direction == 'forward' || direction == 'backward') direction = core.getHeroLoc('direction');
            var faceDirection = direction;
            if (direction == 'leftup' || direction == 'leftdown') faceDirection = 'left';
            if (direction == 'rightup' || direction == 'rightdown') faceDirection = 'right';
            core.setHeroLoc('direction', direction);
            if (curr[1] <= 0) {
                core.setHeroLoc('direction', faceDirection);
                moveSteps.shift();
                return true;
            }
            if (step <= 4) core.drawHero('stop', 4 * o * step);
            else if (step <= 8) core.drawHero('leftFoot', 4 * o * step);
            else if (step <= 12) core.drawHero('midFoot', 4 * o * (step - 8));
            else if (step <= 16) core.drawHero('rightFoot', 4 * o * (step - 8)); // if (step == 8) {
            if (step == 8 || step == 16) {
                core.setHeroLoc('x', x + o * core.utils.scan2[direction].x, true);
                core.setHeroLoc('y', y + o * core.utils.scan2[direction].y, true);
                core.updateFollowers();
                curr[1]--;
                if (curr[1] <= 0) moveSteps.shift();
                core.setHeroLoc('direction', faceDirection);
                return step == 16;
            }
            return false;
        }
    },
    "startCanvas": function() {
        // 使用本插件可以将自绘的标题界面居中。仅在【标题开启事件化】后才有效。
        // 由于一些技术性的原因，标题界面事件化无法应用到覆盖状态栏的整个界面。
        // 这是一个较为妥协的插件，会在自绘标题界面时隐藏状态栏、工具栏和边框，并将画布进行居中。
        // 本插件仅在全塔属性的 "startCanvas" 生效；进入 "startText" 时将会离开居中状态，回归正常界面。

        // 是否开启本插件，默认禁用；将此改成 true 将启用本插件。
        var __enable = false;
        if (!__enable) return;

        // 检查【标题开启事件化】是否开启
        if (!core.flags.startUsingCanvas || main.mode != 'play') return;

        var _isTitleCanvasEnabled = false;
        var _getClickLoc = core.actions._getClickLoc;
        this._setTitleCanvas = function() {
            if (_isTitleCanvasEnabled) return;
            _isTitleCanvasEnabled = true;

            // 禁用窗口resize
            window.onresize = function() {};
            core.resize = function() {}

            // 隐藏状态栏
            core.dom.statusBar.style.display = 'none';
            core.dom.statusCanvas.style.display = 'none';
            core.dom.toolBar.style.display = 'none';
            // 居中画布
            if (core.domStyle.isVertical) {
                core.dom.gameDraw.style.top =
                    (parseInt(core.dom.gameGroup.style.height) - parseInt(core.dom.gameDraw.style.height)) / 2 + "px";
            } else {
                core.dom.gameDraw.style.right =
                    (parseInt(core.dom.gameGroup.style.width) - parseInt(core.dom.gameDraw.style.width)) / 2 + "px";
            }
            core.dom.gameDraw.style.border = '3px transparent solid';
            core.actions._getClickLoc = function(x, y) {
                var left = core.dom.gameGroup.offsetLeft + core.dom.gameDraw.offsetLeft + 3;
                var top = core.dom.gameGroup.offsetTop + core.dom.gameDraw.offsetTop + 3;
                var loc = { 'x': Math.max(x - left, 0), 'y': Math.max(y - top, 0), 'size': 32 * core.domStyle.scale };
                return loc;
            }
        }

        this._resetTitleCanvas = function() {
            if (!_isTitleCanvasEnabled) return;
            _isTitleCanvasEnabled = false;
            window.onresize = function() { try { main.core.resize(); } catch (e) { main.log(e); } }
            core.resize = function() { return core.control.resize(); }
            core.resize();
            core.actions._getClickLoc = _getClickLoc;
        }

        // 复写“开始游戏”
        core.events._startGame_start = function(hard, seed, route, callback) {
            console.log('开始游戏');
            core.resetGame(core.firstData.hero, hard, null, core.cloneArray(core.initStatus.maps));
            core.setHeroLoc('x', -1);
            core.setHeroLoc('y', -1);

            if (seed != null) {
                core.setFlag('__seed__', seed);
                core.setFlag('__rand__', seed);
            } else core.utils.__init_seed();

            core.clearStatusBar();
            core.plugin._setTitleCanvas();

            var todo = [];
            core.hideStatusBar();
            core.push(todo, core.firstData.startCanvas);
            core.push(todo, { "type": "function", "function": "function() { core.plugin._resetTitleCanvas(); core.events._startGame_setHard(); }" })
            core.push(todo, core.firstData.startText);
            this.insertAction(todo, null, null, function() {
                core.events._startGame_afterStart(callback);
            });

            if (route != null) core.startReplay(route);
        }

        var _loadData = core.control.loadData;
        core.control.loadData = function(data, callback) {
            core.plugin._resetTitleCanvas();
            _loadData.call(core.control, data, callback);
        }
    },
    "doTower": function() {
        // 卖出防御塔
        // 获得升级后的属性
        this.getNextLvStatus = function(x, y, fromDraw) {
            var now = core.status.towers[x + ',' + y];
            if (!now) return console.error('不存在防御塔！');
            var level = now.level,
                next = level + 1;
            var toStatus = {};
            var skipped = [
                'level', 'type', 'damage', 'max',
                'haveCost', 'killed', 'exp', 'expLevel',
                'square', 'attackInterval', 'x', 'y'
            ];
            for (var one in now) {
                // 跳过属性
                if (skipped.indexOf(one) > -1) {
                    toStatus[one] = now[one];
                    continue;
                }
                // 特殊处理属性
                if (one == 'cnt' || one == 'chain' || one == 'rate') {
                    toStatus[one] = core.defense.upgrades[now.type](next, one);
                    continue;
                }
                // 特殊处理的塔
                if (now.type == 'barrack' && one == 'hero') {
                    toStatus.hero = {};
                    for (var i in now.hero) {
                        toStatus.hero[i] = core.defense.upgrades[now.type](next, i, 'hero') * core.defense.towers[now.type].hero[i];
                    }
                    continue;
                }
                if (now.type == 'mine' && one == 'mine') {
                    toStatus.mine = {};
                    for (var i in now.mine) {
                        toStatus.mine[i] = core.defense.upgrades[now.type](next, i) * core.defense.towers[now.type].mine[i];
                    }
                    continue;
                }
                // 添加属性
                if (one == 'speed')
                    toStatus[one] = core.defense.towers[now.type][one] / core.defense.upgrades[now.type](next, one);
                else
                    toStatus[one] = core.defense.upgrades[now.type](next, one) * core.defense.towers[now.type][one];
            }
            // 获得真实属性
            if (fromDraw) {
                for (var one in toStatus) {
                    toStatus[one] = this.getTowerRealStatus(null, null, one, toStatus);
                }
            }
            return toStatus;
        };
        // 获得防御塔真实属性 附有经验等级加成
        this.getTowerRealStatus = function(x, y, name, status) {
            if (status) var tower = status;
            else var tower = core.status.towers[x + ',' + y];
            var skipped = [
                'cost', 'level', 'type', 'damage',
                'max', 'killed', 'exp', 'expLevel',
                'square', 'haveCost', 'attackInterval',
                'pauseBuild', 'x', 'y'
            ];
            if (skipped.indexOf(name) > -1)
                return tower[name];
            if (name == 'cnt' || name == 'chain') return Math.floor(tower.expLevel / 5) + tower[name];
            if (name == 'hero' || name == 'mine') {
                var s = {};
                for (var one in tower[name]) {
                    s[one] = tower[name][one] * (1 + tower.expLevel / 100);
                }
                return s;
            }
            if (name == 'speed')
                return tower[name] / (1 + tower.expLevel / 100);
            if (name == 'rate' && tower.rate * (1 + tower.expLevel / 100) >= 80) return 80;
            if (tower.type == 'chain') return tower[name] * (1 + tower.expLevel / 20);
            if (tower.type == 'barrack') return tower[name] * (1 + tower.expLevel / 20);
            return tower[name] * (1 + tower.expLevel / 100);
        };
        // 保存防御塔真实属性
        this.saveRealStatusInCache = function(x, y) {
            x = parseInt(x);
            y = parseInt(y);
            if (typeof x == 'number' && typeof y == 'number') {
                core.status.realTower[x + ',' + y] = {};
                for (var one in core.status.towers[x + ',' + y]) {
                    core.status.realTower[x + ',' + y][one] = this.getTowerRealStatus(x, y, one);
                }
                core.status.realTower[x + ',' + y].attackInterval = core.status.realTower[x + ',' + y].speed * 1000;
            } else {
                core.status.realTower = {};
                for (var loc in core.status.towers) {
                    core.status.realTower[loc] = {};
                    this.saveRealStatusInCache(loc.split(',')[0], loc.split(',')[1]);
                }
            }
        };
    },
    "towerAttack": function() {
        // 旋转炮塔
        var rotateWeapon = function(pos, dx, dy) {
            // atan2 是从X轴开始逆时针旋转, 炮塔是Y轴开始顺时针旋转, 因此交换x y坐标计算
            var deg = Math.atan2(dy, dx) / 3.1415926535 * 180 + 90;
            var transform = "rotate(" + deg + "deg)";
            core.batchDict["tower-weapon_" + pos].canvas.style.transform = transform;
        }
        var triggleAnimate = function(elm, name) {
            if (elm.classList.contains(name + "-odd")) {
                elm.classList.remove(name + "-odd");
                elm.classList.add(name + "-even");
            } else {
                elm.classList.remove(name + "-even");
                elm.classList.add(name + "-odd");
            }
        }
        this.basicAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 打距离基地最近的
            var atk = tower.atk;
            var enemy = core.getClosestEnemy(x, y)[0];
            if (!enemy) return;
            var id = enemy;
            enemy = core.status.enemys.enemys[enemy];
            // 绘制攻击动画
            if (!main.replayChecking) {
                // 旋转炮塔
                rotateWeapon(pos, enemy.x - x, enemy.y - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 255 - tower.level / tower.max * 255, 255 - tower.level / tower.max * 255, 0.5]
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
                core.setTowerEffect(ctx, 0.5 / tower.speed);
            }
            if (core.hasSpecial(enemy.special, 4)) {
                enemy.hp -= atk / 2;
                core.status.totalDamage += atk / 2;
                core.status.towers[pos].damage += atk / 2;
            } else {
                enemy.hp -= atk;
                core.status.totalDamage += atk;
                core.status.towers[pos].damage += atk;
            }
            core.status.towers[pos].exp++;
            core.expLevelUp(x, y);
            core.playSound('gun.mp3');
            if (enemy.hp <= 0) {
                core.enemyDie(id);
                core.status.towers[pos].killed++;
                core.autoUpdateStatusBar(x, y);
                return;
            }
            core.drawHealthBar(id);
            core.autoUpdateStatusBar(x, y);
        };
        // 机关枪
        this.gunAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 打距离基地最近的
            var atk = tower.atk;
            var enemy = core.getClosestEnemy(x, y)[0];
            if (!enemy) return;
            var id = enemy;
            enemy = core.status.enemys.enemys[enemy];
            // 绘制攻击动画
            if (!main.replayChecking) {
                rotateWeapon(pos, enemy.x - x, enemy.y - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 255 - tower.level / tower.max * 255, 255 - tower.level / tower.max * 255, 0.4]
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
                core.setTowerEffect(ctx, 0.25 / tower.speed);
            }
            if (core.hasSpecial(enemy.special, 4)) {
                enemy.hp -= atk / 2;
                core.status.totalDamage += atk / 2;
                core.status.towers[pos].damage += atk / 2;
            } else {
                enemy.hp -= atk;
                core.status.totalDamage += atk;
                core.status.towers[pos].damage += atk;
            }
            core.status.towers[pos].exp += 0.5;
            core.expLevelUp(x, y);
            core.playSound('gun.mp3');
            if (enemy.hp <= 0) {
                core.enemyDie(id);
                core.status.towers[pos].killed++;
                core.autoUpdateStatusBar(x, y);
                return;
            }
            core.drawHealthBar(id);
            core.autoUpdateStatusBar(x, y);
        };
        // 炸弹塔
        this.bombAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 打距离基地最近的 并有爆炸范围
            var enemy = core.getClosestEnemy(x, y)[0];
            if (!enemy) return;
            enemy = core.status.enemys.enemys[enemy];
            var nx = enemy.x,
                ny = enemy.y;
            enemy = core.getEnemyInBombRange(nx, ny, tower.explode);
            // 爆炸攻击
            enemy.forEach(function(one) {
                var now = core.status.enemys.enemys[one];
                if (core.hasSpecial(now.special, 4)) {
                    now.hp -= tower.atk / 2;
                    core.status.totalDamage += tower.atk / 2;
                    core.status.towers[x + ',' + y].damage += tower.atk / 2;
                } else {
                    now.hp -= tower.atk;
                    core.status.totalDamage += tower.atk;
                    core.status.towers[x + ',' + y].damage += tower.atk;
                }
                core.status.towers[x + ',' + y].exp++;
                if (now.hp <= 0) {
                    core.status.towers[x + ',' + y].killed++;
                    return core.enemyDie(one);
                }
                core.drawHealthBar(one);
            });
            core.playSound('bomb.mp3');
            // 绘制攻击动画
            if (!main.replayChecking) {
                rotateWeapon(pos, nx - x, ny - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                ctx.filter = 'blur(0px)';
                var color = [255, 150 - tower.level / tower.max * 150, 150 - tower.level / tower.max * 150, 0.5];
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, nx * 32 + 16, ny * 32 + 16, color, 2);
                color = [255, 100 - tower.level / tower.max * 100, 100 - tower.level / tower.max * 100, 0.5];
                ctx.filter = 'blur(3px)';
                core.fillCircle(ctx, nx * 32 + 16, ny * 32 + 16, tower.explode * 32, color);
                core.setTowerEffect(ctx, 0.6 / tower.speed);
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
        // 激光塔
        this.laserAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 打距离基地最近的 并有穿透效果
            var enemy = core.getClosestEnemy(x, y)[0];
            if (!enemy) return;
            enemy = core.status.enemys.enemys[enemy];
            var dx = -(x - enemy.x) * 32,
                dy = -(y - enemy.y) * 32;
            enemy = core.getEnemyInLine(x, y, x + dx * 13, y + dy * 13);
            enemy.forEach(function(one) {
                var now = core.status.enemys.enemys[one];
                if (core.hasSpecial(now.special, 4)) {
                    now.hp -= tower.atk * 2;
                    core.status.totalDamage += tower.atk * 2;
                    core.status.towers[x + ',' + y].damage += tower.atk * 2;
                } else {
                    now.hp -= tower.atk;
                    core.status.totalDamage += tower.atk;
                    core.status.towers[x + ',' + y].damage += tower.atk;
                }
                core.status.towers[x + ',' + y].exp += 0.5;
                if (now.hp <= 0) {
                    core.status.towers[x + ',' + y].killed++;
                    return core.enemyDie(one);
                }
                core.drawHealthBar(one);
            });
            core.playSound('laser.mp3');
            // 绘制攻击动画
            if (!main.replayChecking) {
                rotateWeapon(pos, dx, dy);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                dx *= 32;
                dy *= 32;
                var color = [170 + tower.level / tower.max * 85, 255 - tower.level / tower.max * 255, 170 + tower.level / tower.max * 85, 0.5];
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, x * 32 + 16 + dx * 13, y * 32 + 16 + dy * 13, color, 3);
                core.setTowerEffect(ctx, 1);
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
        // 闪电塔
        this.teslaAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            // 打距离基地最近的 并有连锁效果
            var enemy = core.getClosestEnemy(x, y)[0];
            if (!enemy) return;
            var enemys = [enemy];
            var all = core.status.enemys.enemys;
            // 连锁
            var nx = all[enemy].x,
                ny = all[enemy].y;
            for (var t = 1; t < tower.chain; t++) {
                var next = core.getClosestEnemyInRange(nx, ny, 2, enemys);
                if (!next) break;
                nx = all[next].x;
                ny = all[next].y;
                enemys.push(next);
            }
            // 动画效果
            core.playSound('tesla.mp3')
            if (!main.replayChecking) {
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                core.drawLine(ctx, x * 32 + 16, y * 32, all[enemys[0]].x * 32 + 16,
                    all[enemys[0]].y * 32 + 16, [255, 255, 255, 0.6], 2);
                core.setTowerEffect(ctx, 0.64 / tower.speed);
            }
            enemys.forEach(function(one, i) {
                var now = all[one];
                if (core.hasSpecial(now.special, 4)) {
                    now.hp -= tower.atk * 2;
                    core.status.totalDamage += tower.atk * 2;
                    core.status.towers[x + ',' + y].damage += tower.atk * 2;
                } else {
                    now.hp -= tower.atk;
                    core.status.totalDamage += tower.atk;
                    core.status.towers[x + ',' + y].damage += tower.atk;
                }
                core.status.towers[x + ',' + y].exp++;
                if (i != enemys.length - 1 && !main.replayChecking) {
                    var next = all[enemys[i + 1]];
                    var nx = now.x * 32 + 16,
                        ny = now.y * 32 + 16,
                        tx = next.x * 32 + 16,
                        ty = next.y * 32 + 16;
                    core.drawLine(ctx, nx, ny, tx, ty, [255, 255, 255, 0.6], 2);
                }
                if (now.hp <= 0) {
                    core.status.towers[x + ',' + y].killed++;
                    return core.enemyDie(one);
                }
                core.drawHealthBar(one);
            });
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
        // 散射塔
        this.scatterAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            // 打距离基地最近的几个怪物
            var enemy = core.getClosestEnemy(x, y, tower.cnt);
            if (enemy.length === 0) return;
            var all = core.status.enemys.enemys;
            var nx = x * 32 + 16,
                ny = y * 32 + 16;
            if (!main.replayChecking) {
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 255 - tower.level / tower.max * 150, 255 - tower.level / tower.max * 150, 0.5];
                core.setTowerEffect(ctx, 0.64 / tower.speed);
            }
            enemy.forEach(function(one) {
                var now = all[one];
                // 动画效果
                if (!main.replayChecking)
                    core.drawLine(ctx, nx, ny, now.x * 32 + 16, now.y * 32 + 16, color, 2);
                if (core.hasSpecial(now.special, 4)) {
                    now.hp -= tower.atk / 2;
                    core.status.totalDamage += tower.atk / 2;
                    core.status.towers[x + ',' + y].damage += tower.atk / 2;
                } else {
                    now.hp -= tower.atk;
                    core.status.totalDamage += tower.atk;
                    core.status.towers[x + ',' + y].damage += tower.atk;
                }
                core.status.towers[x + ',' + y].exp += 0.5;
                if (now.hp <= 0) {
                    core.status.towers[x + ',' + y].killed++;
                    return core.enemyDie(one);
                }
                core.drawHealthBar(one);
            });
            core.expLevelUp(x, y);
            core.playSound('gun.mp3');
            core.autoUpdateStatusBar(x, y);
        };
        // 冰冻塔
        this.getFreezeLoc = function() {
            // 把冰冻比率和位置保存
            var freeze = {};
            for (var loc in core.status.realTower) {
                var tower = core.status.realTower[loc];
                if (tower.type == 'freeze') {
                    if (!tower.canReach) core.getCanReachBlock(loc.split(',')[0], loc.split(',')[1]);
                    for (var i in tower.canReach) {
                        if (!freeze[i]) freeze[i] = 0;
                        if (freeze[i] < tower.rate)
                            freeze[i] = tower.rate;
                    }
                }
            }
            core.status.thisMap.freeze = core.clone(freeze);
        };
        // 士兵塔
        this.barrackAttack = function(x, y, tower) {
            if (!core.status.enemys.hero) core.status.enemys.hero = {};
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 获得该塔的出士兵的位置
            var loc = core.getBarrackBlock(x, y);
            if (!loc) return;
            // 将loc转化为坐标形式
            var index = parseInt(loc);
            loc = core.status.thisMap.route[loc];
            // 执行出士兵
            var hero = tower.hero;
            if (!core.status.enemys.hero.cnt) core.status.enemys.hero.cnt = 0;
            core.status.enemys.hero.cnt++;
            core.status.towers[pos].exp += 20;
            core.status.enemys.hero.cnt++;
            var id = 'hero_' + Math.round(Date.now() * Math.random())
            while (true) {
                if (!core.status.enemys.hero) break;
                if (!(id in core.status.enemys.hero)) break;
                id = 'hero_' + Math.round(Date.now() * Math.random());
            }
            core.status.enemys.hero[id] = {
                hp: hero.hp,
                atk: hero.atk,
                def: hero.def,
                speed: hero.speed,
                total: hero.hp,
                to: index - 1,
                x: loc[0],
                y: loc[1],
                special: [],
                level: tower.level >= 25 ? 2 : 1,
            };
            if (!main.replayChecking) {
                var weaponCanvas = core.batchDict["tower-weapon_" + pos].canvas;
                triggleAnimate(weaponCanvas, "rotate");
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
        // 狙击手
        this.sniperAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 打距离基地最近的
            var atk = tower.atk;
            var enemy = core.getClosestEnemy(x, y)[0];
            if (!enemy) return;
            var id = enemy;
            enemy = core.status.enemys.enemys[enemy];
            // 绘制攻击动画
            if (!main.replayChecking) {
                rotateWeapon(pos, enemy.x - x, enemy.y - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 150 - tower.level / tower.max * 150, 150 - tower.level / tower.max * 150, 0.7];
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
                core.setTowerEffect(ctx, 1 / tower.speed);
            }
            if (core.hasSpecial(enemy.special, 4)) {
                enemy.hp -= atk / 2;
                core.status.totalDamage += atk / 2;
                core.status.towers[x + ',' + y].damage += atk / 2;
            } else {
                enemy.hp -= atk;
                core.status.totalDamage += atk;
                core.status.towers[x + ',' + y].damage += atk;
            }
            core.status.towers[x + ',' + y].exp += 2;
            core.expLevelUp(x, y);
            core.playSound('sniper.mp3');
            if (enemy.hp <= 0) {
                core.enemyDie(id);
                core.status.towers[x + ',' + y].killed++;
                core.autoUpdateStatusBar(x, y);
                return;
            }
            core.drawHealthBar(id);
            core.autoUpdateStatusBar(x, y);
        };
        // 地雷塔
        this.mineAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            // 往地上铺地雷 每个图块最多4个
            if (!tower.canReach) {
                core.getMineBlock(x, y);
                tower = core.status.realTower[x + ',' + y];
            }
            // 排序一下 先在距离基地进的地方放地雷
            var canReach = Object.keys(tower.canReach).sort(function(a, b) { return b - a; });
            // 由小及大遍历 获得能放地雷的图块 并放上地雷
            var mine = core.status.thisMap.mine;
            if (!mine) {
                core.status.maps[core.status.floorId].mine = {};
                core.status.thisMap.mine = {};
                mine = {};
            }
            core.status.towers[x + ',' + y].exp++;
            var lied = false;
            for (var i = 0; i < canReach.length; i++) {
                var index = canReach[i];
                if (!mine[index]) mine[index] = {};
                if (!mine[index].cnt) mine[index].cnt = 0;
                // 放置地雷
                if (!mine[index][1]) {
                    lied = true;
                    mine[index][1] = { atk: tower.mine.atk, level: tower.level };
                    mine[index].cnt++;
                    break;
                }
                if (!mine[index][2]) {
                    lied = true;
                    mine[index][2] = { atk: tower.mine.atk, level: tower.level };
                    mine[index].cnt++;
                    break;
                }
                if (!mine[index][3]) {
                    lied = true;
                    mine[index][3] = { atk: tower.mine.atk, level: tower.level };
                    mine[index].cnt++;
                    break;
                }
                if (!mine[index][4]) {
                    lied = true;
                    mine[index][4] = { atk: tower.mine.atk, level: tower.level };
                    mine[index].cnt++;
                    break;
                }
            }
            // 如果放满了 则进行替换
            if (!lied) {
                for (var i = 0; i < canReach.length; i++) {
                    var index = canReach[i];
                    if (mine[index].cnt != 4) return console.error('地雷塔在没有放满的情况下进行了替换！');
                    // 替换地雷
                    if (mine[index][1].atk < tower.mine.atk) {
                        mine[index][1] = { atk: tower.mine.atk, level: tower.level };
                        break;
                    }
                    if (mine[index][2].atk < tower.mine.atk) {
                        mine[index][2] = { atk: tower.mine.atk, level: tower.level };
                        break;
                    }
                    if (mine[index][3].atk < tower.mine.atk) {
                        mine[index][3] = { atk: tower.mine.atk, level: tower.level };
                        break;
                    }
                    if (mine[index][4].atk < tower.mine.atk) {
                        mine[index][4] = { atk: tower.mine.atk, level: tower.level };
                        break;
                    }
                }
            }
            // 绘制地雷 acquire一个32×32的画布就行了 优化性能
            if (!main.replayChecking) {
                for (var i in mine) {
                    var loc = core.status.thisMap.route[i];
                    var ctx = core.acquireCanvas('mine_' + i, 'mine');
                    var nx = loc[0] * 32,
                        ny = loc[1] * 32;
                    // 循环绘制
                    core.relocateCanvas(ctx, nx, ny);
                    core.clearMap(ctx);
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = '#000';
                    for (var j = 0; j < mine[i].cnt; j++) {
                        if (!mine[i][j + 1]) continue;
                        var level = mine[i][j + 1].level;
                        var color2 = [34 + level / tower.max * 221, 221 - level / tower.max * 221, 68];
                        var color1 = [68 + level / tower.max * 187, 255 - level / tower.max * 155, 119];
                        if (j == 0) {
                            core.fillCircle(ctx, 8, 8, 4, color1);
                            core.fillCircle(ctx, 8, 8, 2, color2);
                        }
                        if (j == 1) {
                            core.fillCircle(ctx, 24, 8, 4, color1);
                            core.fillCircle(ctx, 24, 8, 2, color2);
                        }
                        if (j == 2) {
                            core.fillCircle(ctx, 8, 24, 4, color1);
                            core.fillCircle(ctx, 8, 24, 2, color2);
                        }
                        if (j == 3) {
                            core.fillCircle(ctx, 24, 24, 4, color1);
                            core.fillCircle(ctx, 24, 24, 2, color2);
                        }
                    }
                }
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
        // 夹击塔 获得夹击塔夹击点
        this.getChainLoc = function() {
            // 先获得所有可能的夹击点
            var allTower = Object
                .values(core.status.towers)
                .filter(function(tower) { return tower.type === 'chain'; });
            var all = {};
            allTower.forEach(function(one) {
                for (var dir in core.utils.scan2) {
                    var x = one.x + core.utils.scan2[dir].x,
                        y = one.y + core.utils.scan2[dir].y;
                    if (x < 0 || x > 12 || y < 0 || y > 12) continue;
                    all[x + ',' + y] = true;
                }
            });
            var isChain = function(x, y) {
                    var pos = x + ',' + y;
                    if (core.status.towers[pos] && core.status.towers[pos].type === 'chain') {
                        return true;
                    }
                    return false;
                }
                // 检查夹击
            var chain = {};
            var towers = core.status.realTower;
            core.clearMap('fg');
            for (var loc in all) {
                var x = parseInt(loc.split(',')[0]),
                    y = parseInt(loc.split(',')[1]);
                var index;
                if (core.getBgNumber(x, y) != 300) continue;
                // 将loc换成索引形式
                for (var i in core.status.thisMap.route) {
                    if (core.same([x, y], core.status.thisMap.route[i])) {
                        index = parseInt(i);
                        break;
                    }
                }
                chain[index] = [0, 0];
                // 左右
                if (isChain(x - 1, y) && isChain(x + 1, y)) {
                    chain[index][1] += (towers[(x - 1) + ',' + y].maxAttack + towers[(x + 1) + ',' + y].maxAttack) / 2;
                    chain[index][0] += (towers[(x - 1) + ',' + y].rate + towers[(x + 1) + ',' + y].rate) / 2;
                    core.drawLine('fg', (x - 1) * 32 + 24, y * 32 + 16, (x + 1) * 32 + 8, y * 32 + 16, [100, 255, 255, 0.6], 4);
                }
                // 上下
                if (isChain(x, y - 1) && isChain(x, y + 1)) {
                    chain[index][1] += (towers[x + ',' + (y - 1)].maxAttack + towers[x + ',' + (y + 1)].maxAttack) / 2;
                    chain[index][0] += (towers[x + ',' + (y - 1)].rate + towers[x + ',' + (y + 1)].rate) / 2;
                    core.drawLine('fg', x * 32 + 16, (y - 1) * 32 + 24, x * 32 + 16, (y + 1) * 32 + 8, [100, 255, 255, 0.6], 4);
                }
                // 左上右下
                if (isChain(x - 1, y - 1) && isChain(x + 1, y + 1)) {
                    chain[index][1] += (towers[(x - 1) + ',' + (y - 1)].maxAttack + towers[(x + 1) + ',' + (y + 1)].maxAttack) / 2;
                    chain[index][0] += (towers[(x - 1) + ',' + (y - 1)].rate + towers[(x + 1) + ',' + (y + 1)].rate) / 2;
                    core.drawLine('fg', (x - 1) * 32 + 24, (y - 1) * 32 + 24, (x + 1) * 32 + 8, (y + 1) * 32 + 8, [100, 255, 255, 0.6], 4);
                }
                // 左下右上
                if (isChain(x + 1, y - 1) && isChain(x - 1, y + 1)) {
                    chain[index][1] += (towers[(x + 1) + ',' + (y - 1)].maxAttack + towers[(x - 1) + ',' + (y + 1)].maxAttack) / 2;
                    chain[index][0] += (towers[(x + 1) + ',' + (y - 1)].rate + towers[(x + 1) + ',' + (y - 1)].rate) / 2;
                    core.drawLine('fg', (x + 1) * 32 + 8, (y - 1) * 32 + 24, (x - 1) * 32 + 24, (y + 1) * 32 + 8, [100, 255, 255, 0.6], 4);
                }
                if (chain[index][0] == 0) delete chain[index];
            }
            core.status.thisMap.chain = core.clone(chain);
        };
        // 震荡塔
        this.destoryAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            var pos = x + ',' + y;
            // 攻击所有怪物
            var all = core.status.enemys.enemys;
            if (!tower.canReach) this.getCanReachBlock(x, y);
            var canReach = tower.canReach;
            for (var one in all) {
                var now = all[one];
                // 震荡免疫
                if (core.hasSpecial(now.special, 3)) continue;
                if (canReach[now.to] || canReach[now.to - 1]) {
                    var attacked = true;
                    now.hp -= tower.atk;
                    core.status.totalDamage += tower.atk;
                    core.status.towers[pos].damage += tower.atk;
                    core.status.towers[pos].exp++;
                    if (all[one].hp <= 0) {
                        core.enemyDie(one);
                        core.status.towers[pos].killed++;
                        continue;
                    }
                    core.drawHealthBar(one);
                }
            }
            // 特效
            if (!attacked) return;
            core.playSound('destory.mp3');
            if (!main.replayChecking) {
                var weaponCanvas = core.batchDict["tower-weapon_" + pos].canvas;
                triggleAnimate(weaponCanvas, "blast");
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                ctx.filter = 'blur(5px)';
                var color = [150 + tower.level / tower.max * 105, 150 - tower.level / tower.max * 100, 150 - tower.level / tower.max * 100, 0.6];
                core.fillCircle(ctx, x * 32 + 16, y * 32 + 16, (tower.range - 0.2) * 32, color);
                core.setTowerEffect(ctx, 0.5 / tower.speed);
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
    },
}