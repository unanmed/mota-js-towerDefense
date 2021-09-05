var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    "init": function() {

        console.log("插件编写测试");

        // 可以写一些直接执行的代码
        // 在这里写的代码将会在【资源加载前】被执行，此时图片等资源尚未被加载。
        // 请勿在这里对包括bgm，图片等资源进行操作。


        this._afterLoadResources = function() {
            // 本函数将在所有资源加载完毕后，游戏开启前被执行
            // 可以在这个函数里面对资源进行一些操作。
            // 若需要进行切分图片，可以使用 core.splitImage() 函数，或直接在全塔属性-图片切分中操作
            core.registerResize('batchCanvas', function(obj) {
                for (var type in core.batchCanvas) {
                    for (var name in core.batchCanvas[type]) {
                        var ctx = core.batchCanvas[type][name],
                            canvas = ctx.canvas;
                        var ratio = canvas.hasAttribute('isHD') ? core.domStyle.ratio : 1;
                        canvas.style.width = canvas.width / ratio * core.domStyle.scale + "px";
                        canvas.style.height = canvas.height / ratio * core.domStyle.scale + "px";
                        canvas.style.left = parseFloat(canvas.getAttribute("_left")) * core.domStyle.scale + "px";
                        canvas.style.top = parseFloat(canvas.getAttribute("_top")) * core.domStyle.scale + "px";
                    }
                }
                for (var name in core.batchDict) {
                    var ctx = core.batchDict[name],
                        canvas = ctx.canvas;
                    var ratio = canvas.hasAttribute('isHD') ? core.domStyle.ratio : 1;
                    canvas.style.width = canvas.width / ratio * core.domStyle.scale + "px";
                    canvas.style.height = canvas.height / ratio * core.domStyle.scale + "px";
                    canvas.style.left = parseFloat(canvas.getAttribute("_left")) * core.domStyle.scale + "px";
                    canvas.style.top = parseFloat(canvas.getAttribute("_top")) * core.domStyle.scale + "px";
                }
            });
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
    "getEnemyRoute": function() {
        // 获得本地图的怪物寻路路径
        this.getEnemyRoute = function() {
            var floorId = core.status.floorId;
            var enemyBase;
            // 获得出怪点
            core.extractBlocks();
            core.status.maps[floorId].blocks.forEach(function(block) {
                if (enemyBase) return;
                if (block.event.id == 'T329') {
                    enemyBase = [block.x, block.y];
                }
            });
            if (!enemyBase) return core.drawTip('本地图没有出怪点！');
            // 获得路径
            var route = [enemyBase];
            var dir;
            var last;
            while (true) {
                var now = route[route.length - 1];
                var nowLength = route.length;
                // left
                if (now[0] >= 1 && core.getBgNumber(now[0] - 1, now[1]) == 300 && last != 'right') {
                    route.push([now[0] - 1, now[1]]);
                    dir = 'left';
                }
                // right
                else if (now[0] < core.status.maps[floorId].width - 1 && core.getBgNumber(now[0] + 1, now[1]) == 300 && last != 'left') {
                    route.push([now[0] + 1, now[1]]);
                    dir = 'right';
                }
                // up
                else if (now[1] >= 1 && core.getBgNumber(now[0], now[1] - 1) == 300 && last != 'down') {
                    route.push([now[0], now[1] - 1]);
                    dir = 'up';
                }
                // down
                else if (now[1] < core.status.maps[floorId].height - 1 && core.getBgNumber(now[0], now[1] + 1) == 300 && last != 'up') {
                    route.push([now[0], now[1] + 1]);
                    dir = 'down';
                }
                last = dir;
                // 判断加了多少次
                var diff = route.length - nowLength;
                if (diff == 0 || !dir) return core.drawTip('无法到达基地！');
                if (diff > 1) return core.drawTip('不能做分叉路口！');
                var to = route[route.length - 1];
                if (core.getBlockId(to[0], to[1]) == 'T328') {
                    break;
                }
            }
            core.status.maps[floorId].route = route;
            return route;
        };
    },
    "monsters": function() {
        // 怪物相关
        // 出怪列表
        this.initMonster = function(floorId) {
            if (floorId == 'MT0') {
                // 第一关 前10波手动添加 之后由伪随机产生固定值 并存入缓存 计入存档
                var enemys = [
                    ['greenSlime', 10],
                    ['greenSlime', 17],
                    ['redSlime', 13],
                    ['greenSlime', 21],
                    ['blackSlime', 9],
                    ['bat', 16],
                    ['redSlime', 15],
                    ['greenSlime', 13],
                    ['bat', 14],
                    ['bigBat', 1],
                ];
                core.status.maps[floorId].enemys = enemys;
                return enemys;
            }
        };
        // 伪随机出怪
        this.randomMonster = function(start, number) {
            var id = core.floorIds.indexOf(core.status.floorId);
            var enemys = core.clone(core.material.enemys);
            var all = Object.keys(enemys);
            var length = all.length;
            var pre = (((id * length * 965182) % 12307) ^ 1063289) << 2;
            pre *= (start * number) ^ 13060;
            pre = Math.abs(~~pre);
            pre %= length;
            var next = pre;
            var now = [];
            var x = 0;
            for (var i = start; i < start + number; i++) {
                if ((i + 1) % 10 != 0) {
                    x = 0;
                    while (true) {
                        x++;
                        // 防卡死
                        if (x >= 100) {
                            for (var j = Math.abs((((next << 6) * 523569) >> 4) ^ 52506124) % length; true; j++) {
                                if (j == all.length) j = 0;
                                if (!enemys[all[j]].notBomb) {
                                    next = j;
                                    x = 0;
                                    break;
                                }
                            }
                        }
                        if (enemys[all[next]].id == 'angel') {
                            next = (((next << 3) ^ 102477) * 13404 * start) | number;
                            next = Math.abs(~~next);
                            next %= length;
                            continue;
                        }
                        if (!enemys[all[next]].notBomb) break;
                        next = (((next << 3) ^ 102477) * 13404 * start) | number;
                        next = Math.abs(~~next);
                        next %= length;
                    }
                    // 计算个数 生命*移速越大 数量越少 最少十个 并略有波动
                    var one = enemys[all[next]].hp * enemys[all[next]].speed * (1 + i * i / 225);
                    var totalHp = 600 * (1 + i * i / 225);
                    var n = Math.max(10, totalHp / one + totalHp % 10 + ((~~((next ^ 215673) * totalHp) | one) % 15));
                    n = Math.round(n);
                    // 添加怪物
                    now.push([all[next], n]);
                    next = ((~(next * 82461) >> 5) ^ 12460 * number) ^ (~~totalHp);
                    next = Math.abs(~~next);
                    next %= length;
                } else {
                    x = 0;
                    while (true) {
                        x++;
                        // 防卡死
                        if (x >= 100) {
                            for (var j = Math.abs((((next ^ 5236) << 4) * 1523569) | 15325) % length; true; j++) {
                                if (j == all.length) j = 0;
                                if (enemys[all[j]].notBomb) {
                                    next = j;
                                    x = 0;
                                    break;
                                }
                            }
                        }
                        if (enemys[all[next]].notBomb) break;
                        next = ((((next << 3) ^ 713591) + 4135 * start) * number) % length;
                        next = Math.abs(~~next);
                    }
                    // 添加怪物
                    var totalHp = 300 * (1 + i * i / 225);
                    now.push([all[next], 1]);
                    next = ((((~(next * 82461) >> 5) ^ 561290) & 451290) ^ start) ^ (~~totalHp);
                    next = Math.abs(~~next);
                    next %= length;
                }
            }
            now = core.status.thisMap.enemys.concat(now);
            core.status.thisMap.enemys = core.clone(now);
        };
        // 出怪
        this.startMonster = function(floorId, start, fromLoad) {
            floorId = floorId || core.status.floorId;
            if (flags.starting && !fromLoad) {
                core.drawTip('当前正在出怪！');
                return false;
            }
            var list = (core.status.thisMap || {}).enemys || core.initMonster(core.status.floorId);
            var startLoc = core.getEnemyRoute()[0];
            // 初始化
            if (start) {
                flags.waves = 0;
                core.status.enemyCnt = 0;
                core.status.score = 0;
                core.initDrawEnemys();
                core.deleteTowerEffect();
                core.getEnemyRoute();
                core.getChainLoc();
                core.getFreezeLoc();
                core.status.enemys = { cnt: 0, enemys: {}, hero: { cnt: 0 }, mine: {} };
                if (!flags.forceInterval) {
                    flags.forceInterval = 5000;
                    flags.nowInterval = 4;
                }
                // 强制出怪
                core.registerAnimationFrame('forceEnemy', true, function() {
                    if (flags.pause) return;
                    flags.forceInterval -= 16.67;
                    if (flags.forceInterval < flags.nowInterval * 1000) {
                        flags.nowInterval--;
                        core.updateStatusBar('interval');
                    }
                    if (flags.forceInterval <= 0) {
                        delete flags.forceInterval;
                        delete flags.nowInterval;
                        core.unregisterAnimationFrame('forceEnemy');
                        core.startMonster(core.status.floorId);
                    }
                });
                return;
            }
            if (!list) return;
            var enemy = list[flags.waves];
            if (!enemy) {
                core.drawTip('怪物清空了！');
                return false;
            }
            if (Object.keys(core.status.thisMap.enemys).length - flags.waves <= 10)
                this.randomMonster(Object.keys(core.status.thisMap.enemys).length, 10);
            // 开始添加怪物
            var interval = flags.interval || 0;
            if (!fromLoad) {
                if (!flags.pause)
                    core.drawTip('开始出怪');
                else core.drawTip('现在处于暂停阶段，取消暂停后将开始出怪');
            }
            if (flags.forceInterval && flags.waves != 0) {
                var forceMoney = flags.forceInterval / 1000 * (1 + flags.waves * flags.waves / 2250);
                core.status.hero.money += Math.floor(forceMoney);
            }
            delete flags.forceInterval;
            delete flags.nowInterval;
            core.unregisterAnimationFrame('forceEnemy');
            var first = true;
            var total = enemy[1];
            // 利用全局帧动画
            core.registerAnimationFrame('startMonster', true, function() {
                flags.starting = true;
                if (flags.pause) {
                    if (first) {
                        first = false;
                        core.updateStatusBar('score');
                    }
                    return;
                }
                if (!core.status.thisMap) return;
                core.status.enemyCnt++;
                var now = core.material.enemys[enemy[0]];
                interval -= 16.67;
                if (interval <= 0) {
                    core.status.thisMap.enemys[flags.waves][1]--;
                    core.status.enemys.cnt++;
                    core.updateStatusBar('enemy');
                    var hp = now.hp * (1 + flags.waves * flags.waves / 225);
                    var id = enemy[0] + '_' + Math.round(Date.now() * Math.random());
                    while (true) {
                        if (!core.status.enemys.enemys) break;
                        if (!(id in core.status.enemys.enemys)) break;
                        id = enemy[0] + '_' + Math.round(Date.now() * Math.random());
                    }
                    core.status.enemys.enemys[id] = {
                        x: startLoc[0],
                        y: startLoc[1],
                        id: enemy[0],
                        speed: now.speed,
                        hp: hp,
                        total: hp,
                        atk: core.material.enemys[enemy[0]].atk * (1 + flags.waves * flags.waves / 900),
                        def: core.material.enemys[enemy[0]].def * (1 + flags.waves * flags.waves / 900),
                        to: 1,
                        drown: false,
                        money: Math.floor(core.material.enemys[enemy[0]].money * (1 + flags.waves * flags.waves / 4900)) * (2 - flags.hard),
                        freeze: 1,
                        wave: flags.waves,
                        special: core.clone(core.material.enemys[enemy[0]].special) || []
                    };
                    if (core.status.thisMap.enemys[flags.waves][1] <= 0) {
                        delete flags.interval;
                        flags.starting = false;
                        flags.waves++;
                        core.unregisterAnimationFrame('startMonster');
                        // 自动出怪
                        if (flags.autoNext) {
                            if (!flags.forceInterval) {
                                if (flags.waves % 10 == 0) {
                                    flags.forceInterval = 60000;
                                    flags.nowInterval = 59;
                                } else {
                                    flags.forceInterval = 15000;
                                    flags.nowInterval = 14;
                                }
                            }
                            if (!core.isReplaying())
                                core.pushActionToRoute('nextWave');
                            core.startMonster(core.status.floorId);
                            core.updateStatusBar();
                            return;
                        }
                        // 强制出怪
                        core.registerAnimationFrame('forceEnemy', true, function() {
                            if (flags.pause) return;
                            if (!flags.forceInterval) {
                                if (flags.waves % 10 == 0) {
                                    flags.forceInterval = 60000;
                                    flags.nowInterval = 59;
                                } else {
                                    flags.forceInterval = 15000;
                                    flags.nowInterval = 14;
                                }
                            }
                            flags.forceInterval -= 16.67;
                            if (flags.forceInterval < flags.nowInterval * 1000) {
                                flags.nowInterval--;
                                core.updateStatusBar('interval');
                            }
                            if (flags.forceInterval <= 0) {
                                delete flags.forceInterval;
                                delete flags.nowInterval;
                                core.unregisterAnimationFrame('forceEnemy');
                                core.startMonster(core.status.floorId);
                            }
                        });
                        core.updateStatusBar();
                        return;
                    }
                    interval += (800 / (total > 15 ? (1 + (total - 15) / 10) : 1)) /
                        core.material.enemys[enemy[0]].speed * 2;
                }
                flags.interval = interval;
            });
            return true;
        };
        // 怪物死亡
        this.enemyDie = function(id) {
            if (!core.status.enemys.enemys[id]) return;
            core.returnCanvas(id, 'enemy');
            var enemyId = id.split('_')[0];
            var enemy = core.material.enemys[enemyId];
            core.status.hero.money += core.status.enemys.enemys[id].money;
            if (!core.status.score) core.status.score = 0;
            core.status.score += Math.round(enemy.hp * enemy.speed);
            var e = core.clone(core.status.enemys.enemys[id]);
            delete core.status.enemys.enemys[id];
            core.status.enemys.cnt--;
            core.status.totalKilled++;
            // 如果拥有重生属性
            if (core.hasSpecial(enemy.special, 1)) {
                // 对怪物属性进行重置，并重命名怪物id
                var toEnemy = enemy.toEnemy;
                if (!toEnemy) return;
                enemy = core.material.enemys[toEnemy];
                var hp = enemy.hp * (1 + e.wave * e.wave / 225);
                core.status.enemys.cnt++;
                id = toEnemy + '_' + Math.round(Date.now() * Math.random());
                while (true) {
                    if (!core.status.enemys.enemys) break;
                    if (!(id in core.status.enemys.enemys)) break;
                    id = toEnemy + '_' + Math.round(Date.now() * Math.random());
                }
                core.status.enemys.enemys[id] = {
                    x: e.x,
                    y: e.y,
                    id: toEnemy,
                    speed: enemy.speed,
                    hp: hp,
                    total: hp,
                    atk: enemy.atk * (1 + e.wave * e.wave / 900),
                    def: enemy.def * (1 + e.wave * e.wave / 900),
                    to: (Number.isInteger(e.x) && Number.isInteger(e.y) &&
                        core.same(core.status.thisMap.route[e.to], [e.x, e.y])) ? (e.to + 1) : e.to,
                    drown: false,
                    money: Math.floor(enemy.money * (1 + e.wave * e.wave / 4900)) * (2 - flags.hard),
                    freeze: 1,
                    wave: e.wave,
                    special: core.clone(core.material.enemys[toEnemy].special) || []
                };
            }
            core.updateStatusBar('score');
        };
        // 全局初始化
        this.globalInit = function(fromLoad) {
            // 初始化怪物路线
            core.getEnemyRoute();
            // 初始化画布等
            core.initDrawEnemys();
            core.drawAllEnemys(fromLoad);
            if (core.status.enemys.enemys) core.drawHealthBar();
            core.deleteTowerEffect();
            // 初始化防御塔相关
            core.initTowers();
            core.initAttack();
            core.getChainLoc();
            core.getFreezeLoc();
            core.control.updateStatusBar(null, true);
        };
        // 游戏开始的时候的初始化
        this.initGameStart = function() {
            core.updateStatusBar(null, true);
        };
    },
    "drawEnemys": function() {
        // 绘制怪物 路线相关 sprite化
        maps.prototype._drawBlockInfo = function(blockInfo, x, y, ctx) {
            if (blockInfo.bigImage) return this._drawBlockInfo_bigImage(blockInfo, x, y, ctx);
            var image = blockInfo.image,
                posX = blockInfo.posX,
                posY = blockInfo.posY,
                height = blockInfo.height;
            var px = 32 * x - 32 * core.bigmap.posX;
            var py = 32 * y - 32 * core.bigmap.posY;
            if (ctx == null) ctx = 'event';
            // 怪物sprite化处理
            if (core.getContextByName(ctx, true)) {
                px = 0;
                py = 2;
                ctx = core.getContextByName(ctx, true);
            }
            this._drawBlockInfo_drawWithFilter(blockInfo, ctx, function() {
                core.clearMap(ctx, px, py, 32, 32);
                core.drawImage(ctx, image, posX * 32, posY * height + height - 32, 32, 32, px, py, 32, 32);
            });
            if (height > 32) {
                this._drawBlockInfo_drawWithFilter(blockInfo, 'event2', function() {
                    core.clearMap('event2', px, py + 32 - height, 32, height - 32);
                    core.drawImage('event2', image, posX * 32, posY * height, 32, height - 32, px, py + 32 - height, 32, height - 32);
                });
            }
        };
        ////// canvas批量创建 //////
        var originCreateCanvas = core.ui.createCanvas;
        core.createCanvas = function(name, x, y, width, height, z, n) {
            if (main.replayChecking) {
                return document.createElement().getContext();
            }
            if (n == 1 || !n) return originCreateCanvas.call(core.ui, name, x, y, width, height, z);
            // 批量创建
            var fragment = document.createDocumentFragment();
            if (!core.batchCanvas) core.batchCanvas = {};
            if (!core.batchCanvas[name]) core.batchCanvas[name] = [];
            if (!core.batchCanvasLength) core.batchCanvasLength = {};
            if (!core.batchCanvasLength[name]) core.batchCanvasLength[name] = 0;
            for (var i = core.batchCanvasLength[name]; i < n + core.batchCanvasLength[name]; i++) {
                var newCanvas = document.createElement("canvas");
                newCanvas.id = name + '_' + i;
                newCanvas.style.display = 'none';
                newCanvas.setAttribute("_left", x);
                newCanvas.setAttribute("_top", y);
                newCanvas.style.width = width * core.domStyle.scale + 'px';
                newCanvas.style.height = height * core.domStyle.scale + 'px';
                newCanvas.style.left = x * core.domStyle.scale + 'px';
                newCanvas.style.top = y * core.domStyle.scale + 'px';
                newCanvas.style.zIndex = z;
                newCanvas.style.position = 'absolute';
                core.batchCanvas[name].push(newCanvas.getContext('2d'));
                core.maps._setHDCanvasSize(newCanvas.getContext('2d'), width, height);
                fragment.appendChild(newCanvas);
            }
            core.batchCanvasLength[name] += n;
            core.dom.gameDraw.appendChild(fragment);
        };
        core.getContextByName = function(name, batch) {
            var canvas = name;
            if (batch) {
                if (typeof name == 'string' && core.batchCanvas && core.batchDict) {
                    var dict = core.batchDict;
                    if (dict[name]) return dict[name];
                    else return null;
                }
                return null;
            }
            if (typeof name == 'string') {
                if (core.canvas[name])
                    canvas = core.canvas[name];
                else if (core.dymCanvas[name])
                    canvas = core.dymCanvas[name];
            }
            if (canvas && canvas.canvas) {
                return canvas;
            }
            return null;
        };
        ////// 清除地图 //////
        ui.prototype.clearMap = function(name, x, y, width, height) {
            if (name == 'all') {
                for (var m in core.canvas) {
                    core.canvas[m].clearRect(-32, -32, core.canvas[m].canvas.width + 32, core.canvas[m].canvas.height + 32);
                }
                core.dom.gif.innerHTML = "";
                core.removeGlobalAnimate();
                core.deleteCanvas(function(one) { return one.startsWith('_bigImage_'); });
                core.setWeather(null);
            } else {
                var ctx = this.getContextByName(name) || core.getContextByName(name, true);
                if (ctx) {
                    if (x != null && y != null && width != null && height != null) {
                        ctx.clearRect(x, y, width, height);
                    } else {
                        ctx.clearRect(-32, -32, ctx.canvas.width + 32, ctx.canvas.height + 32);
                    }
                }
            }
        };
        // 绘制路线
        this.drawEnemyRoute = function() {
            var route = core.getEnemyRoute();
            if (!(route instanceof Array)) return core.drawTip('路线出错！');
            // 建画布
            if (!core.dymCanvas.enemyRoute)
                core.createCanvas('enemyRoute', 0, 0, 416, 416, 25);
            else core.clearMap('enemyRoute');
            var ox = core.bigmap.offsetX,
                oy = core.bigmap.offsetY;
            // 绘制路线
            route.forEach(function(one, i) {
                if (i == route.length - 1) return;
                var now = one.map(function(one) { return one * 32 - ox + 16 }),
                    next = route[i + 1].map(function(one) { return one * 32 - oy + 16 });
                core.drawLine('enemyRoute', now[0], now[1], next[0], next[1], [255, 255, 255, 0.8], 2);
            });
        };
        // 取用一个空闲画布
        this.acquireCanvas = function(name, type) {
            if (!core.batchCanvas) return;
            if (!core.batchDict) core.batchDict = {};
            if (typeof name == 'string' && core.batchDict[name])
                return core.batchDict[name];
            type = type || 'enemy';
            var canvases = core.batchCanvas[type];
            // 如果空闲画布长度为0 则继续创建
            if (canvases.length == 0) {
                if (type == 'tower')
                    core.createCanvas(type, 0, 0, 416, 416, 35, 5);
                else if (type == 'mine')
                    core.createCanvas(type, 0, 0, 32, 32, 34, 10);
                else
                    core.createCanvas(type, 0, 0, 32, 34, 35, 100);
            }
            // 如果仍有空闲画布 则直接取用 并加入到dictionary中
            var canvas = canvases.shift();
            canvas.canvas.style.display = 'block';
            core.batchDict[name] = canvas;
            return canvas;
        };
        // 返回画布 插入数组最后 并删除对应dictionary
        this.returnCanvas = function(canvas, type) {
            type = type || 'enemy';
            var c = core.getContextByName(canvas, true);
            core.clearMap(c);
            if (c) {
                if (type === "mine") {
                    c.canvas.style.transform = '';
                    c.canvas.style.zIndex = 34;
                }
                c.canvas.style.display = 'none';
                core.batchCanvas[type].push(c);
                delete core.batchDict[canvas];
            }
        };
        // 初始化
        this.initDrawEnemys = function() {
            if (!main.replayChecking) {
                // 归还所有画布 同时删除
                if (core.batchCanvas) {
                    if (core.batchDict) {
                        for (var one in core.batchDict) {
                            this.returnCanvas(one, core.batchDict[one].canvas.id.split('_')[0]);
                        }
                    }
                    // 删除画布
                    for (var type in core.batchCanvas) {
                        core.batchCanvas[type].forEach(function(one) {
                            if (one.canvas.parentElement === core.dom.gameDraw) {
                                one.shadowBlur = 0;
                                core.dom.gameDraw.removeChild(one.canvas);
                            }
                        });
                        core.batchCanvas[type] = [];
                        core.batchCanvasLength[type] = 0;
                    }
                }
                // 创建200个画布
                flags.pause = true;
                core.createCanvas('enemy', 0, 0, 32, 34, 35, 200);
                core.createCanvas('tower', 0, 0, 416, 416, 60, 5);
                core.createCanvas('mine', 0, 0, 32, 32, 34, 40);
            }
            core.drawAllEnemys();
            core.initAttack();
        };
        // 绘制所有怪物 和勇士
        this.drawAllEnemys = function(fromLoad) {
            if (fromLoad) {
                // 读档时的绘制
                var enemys = core.status.enemys.enemys;
                var heroes = core.status.enemys.hero || {};
                Object.keys(enemys).forEach(function(one) {
                    var enemy = enemys[one]
                    var ctx = core.acquireCanvas(one);
                    core.relocateCanvas(ctx, enemy.x * 32, enemy.y * 32 - 1);
                });
                for (var id in heroes) {
                    if (id == 'cnt') continue;
                    var hero = heroes[id];
                    var ctx = core.acquireCanvas(id);
                    this.drawHealthBar(id);
                    core.relocateCanvas(ctx, hero.x * 32, hero.y * 32 - 1);
                }
                for (var pos in core.status.towers) {
                    var tower = core.status.towers[pos];
                    core.plugin.initTowerSprite(tower);
                }
            }
            // 注册全局帧动画
            core.registerAnimationFrame('drawCanvases', true, function() {
                if (flags.pause) return;
                if (!core.status.thisMap) return;
                if (!core.status.enemys) return;
                if (!core.isReplaying())
                    core.pushActionToRoute('wait');
                if (!core.status.currTime) core.status.currTime = 0;
                core.status.currTime += 16.67;
                var enemys = core.status.enemys.enemys;
                var route = core.status.thisMap.route;
                var heroes = core.status.enemys.hero || {};
                if (!route) core.getEnemyRoute();
                // 每帧的移动
                Object.keys(enemys).forEach(function(one) {
                    var enemy = enemys[one]
                    if (!main.replayChecking)
                        var ctx = core.acquireCanvas(one);
                    // 位置移动
                    var dx = route[enemy.to][0] - route[enemy.to - 1][0],
                        dy = route[enemy.to][1] - route[enemy.to - 1][1];
                    var speedX = dx * enemy.speed / 60 * enemy.freeze,
                        speedY = dy * enemy.speed / 60 * enemy.freeze;
                    enemy.x += speedX;
                    enemy.y += speedY;
                    if (core.hasSpecial(enemy.special, 6)) enemy.speed += 0.02;
                    // 如果还没有画过 进行绘制
                    if (!enemy.drown && !main.replayChecking) {
                        enemy.drown = true;
                        core.drawBlock(core.getBlockById(one.split('_')[0]), core.status.globalAnimateStatus, one);
                        // 血条
                        core.fillRect(ctx, 4, 0, 24, 2, '#333333');
                        core.fillRect(ctx, 4, 0, 24, 2, '#00ff00');
                        core.strokeRect(ctx, 3, 0, 26, 2, '#000000');
                    }
                    if (!main.replayChecking)
                        core.relocateCanvas(ctx, enemy.x * 32, enemy.y * 32 - 1);
                    // 改变目标方块
                    dx = enemy.x - route[enemy.to][0];
                    dy = enemy.y - route[enemy.to][1];
                    if ((dx * (dx + speedX) <= 0 && dy == 0) || (dy * (dy + speedY) <= 0 && dx == 0) ||
                        (dx * (dx - speedX) <= 0 && dy == 0) || (dy * (dy - speedY) <= 0 && dx == 0)) {
                        enemy.x = route[enemy.to][0];
                        enemy.y = route[enemy.to][1];
                        // 达到基地
                        if (enemy.to == route.length - 1) {
                            core.status.hero.hp--;
                            if (core.material.enemys[one.split('_')[0]].notBomb)
                                core.status.hero.hp -= 9;
                            if (core.status.hero.hp <= 0) {
                                if (!core.isReplaying()) {
                                    flags.pause = true;
                                    core.status.route[core.status.route.length - 1] =
                                        (parseInt(core.status.route[core.status.route.length - 1]) + 1000).toString();
                                }
                                core.status.hero.hp = core.status.score;
                                core.win('第' + (core.floorIds.indexOf(core.status.floorId) + 1) + '关结束  v0.1版');
                                core.unregisterAnimationFrame('drawCanvases');
                                core.unregisterAnimationFrame('startMonster');
                                core.unregisterAnimationFrame('forceEnemy');
                                core.unregisterAnimationFrame('attack');
                                core.unregisterAnimationFrame('deleteEffect');
                                core.unregisterAction('onclick', 'confirm');
                                core.unregisterAction('onclick', 'doTower');
                                core.initDrawEnemys();
                                core.updateStatusBar();
                                return;
                            }
                            delete enemys[one];
                            // 归还画布
                            core.returnCanvas(one);
                            return;
                        }
                        // 被地雷炸
                        var mine = core.status.thisMap.mine || {};
                        if (enemy.to in mine) {
                            var played = false;
                            for (var i = mine[enemy.to].cnt; i > 0; i--) {
                                if (!mine[enemy.to][i]) continue;
                                played = true;
                                if (!played)
                                    core.playSound('bomb.mp3');
                                enemy.hp -= mine[enemy.to][i].atk;
                                core.status.totalDamage += mine[enemy.to][i].atk;
                                // 把这个地雷删了
                                delete mine[enemy.to][i];
                                mine[enemy.to].cnt--;
                                if (enemy.hp <= 0) {
                                    core.enemyDie(one);
                                    var dead = true;
                                    break;
                                }
                            }
                            if (!dead)
                                core.drawHealthBar(one);
                            // 绘制地雷
                            if (!main.replayChecking) {
                                var ctx = core.acquireCanvas('mine_' + enemy.to, 'mine');
                                // 循环绘制
                                core.clearMap(ctx);
                                ctx.shadowColor = '#000';
                                ctx.shadowBlur = 2;
                                if (mine[enemy.to].cnt) {
                                    for (var j = 0; j < mine[enemy.to].cnt; j++) {
                                        if (!mine[enemy.to][j + 1]) continue;
                                        var level = mine[enemy.to][j + 1].level;
                                        var color2 = [34 + level / 30 * 221, 221 - level / 30 * 221, 68];
                                        var color1 = [68 + level / 30 * 187, 255 - level / 30 * 155, 119];
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
                        }
                        // 夹击塔
                        var chain = core.status.thisMap.chain;
                        if (chain && chain[enemy.to]) {
                            if (chain[enemy.to][0] > 0) {
                                // 扣血
                                core.playSound('laser.mp3');
                                enemy.hp -= Math.min(chain[enemy.to][1], enemy.total * chain[enemy.to][0] / 100);
                                core.status.totalDamage += parseInt(chain[enemy.to]) || 0;
                                if (enemy.hp <= 0) {
                                    core.enemyDie(one);
                                    return;
                                }
                                core.drawHealthBar(one);
                            }
                        }
                        enemy.to++;
                        // 冰冻
                        if (!core.hasSpecial(enemy.special, 2)) {
                            var freeze = core.status.thisMap.freeze;
                            if (!freeze) freeze = {};
                            if (freeze[enemy.to - 1] > 0) {
                                enemy.freeze = 1 - freeze[enemy.to - 1] / 100;
                            } else if (freeze[enemy.to] > 0) {
                                enemy.freeze = 1 - freeze[enemy.to] / 100;
                            } else {
                                enemy.freeze = 1;
                            }
                        }
                        // 与勇士战斗
                        for (var id in core.status.enemys.hero) {
                            var hero = core.status.enemys.hero[id];
                            dx = hero.x - enemy.x;
                            dy = hero.y - enemy.y;
                            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                                // 执行战斗
                                core.playSound('battle.mp3');
                                // 默认勇士战胜 
                                if (typeof enemy.special == 'number') enemy.special = [enemy.special];
                                enemy.special.push(5);
                                var damageInfo = core.getDamageInfo(enemy, hero);
                                if (!damageInfo || damageInfo.damage >= hero.hp) {
                                    // 勇士战败 先攻 获得怪物应该减少的生命值
                                    if (!hero.special) hero.special = [];
                                    damageInfo = core.getDamageInfo(hero, enemy);
                                    enemy.hp -= damageInfo.damage;
                                    core.status.totalDamage += parseInt(damageInfo.damage || 0);
                                    core.drawHealthBar(one);
                                    // 删除勇士
                                    core.heroDie(id);
                                    return;
                                }
                                // 勇士胜
                                core.enemyDie(one);
                                hero.hp -= damageInfo.damage;
                                core.status.totalDamage += parseInt(enemy.hp);
                                core.drawHealthBar(id);
                                break;
                            }
                        }
                    }
                    // 二次战斗判定 用于判定怪物移速过慢的情况
                    if (enemy.speed <= 3 && Math.abs(core.status.currTime % 150) < 20) {
                        for (var id in core.status.enemys.hero) {
                            var hero = core.status.enemys.hero[id];
                            dx = hero.x - enemy.x;
                            dy = hero.y - enemy.y;
                            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                                // 执行战斗
                                core.playSound('battle.mp3');
                                // 默认勇士战胜 
                                var damageInfo = core.getDamageInfo(enemy, hero);
                                if (!damageInfo || damageInfo.damage >= hero.hp) {
                                    // 勇士战败 先攻 获得怪物应该减少的生命值
                                    if (!hero.special) hero.special = [];
                                    hero.special.push(5);
                                    damageInfo = core.getDamageInfo(hero, enemy);
                                    enemy.hp -= damageInfo.damage;
                                    core.status.totalDamage += parseInt(damageInfo.damage || 0);
                                    core.drawHealthBar(one);
                                    // 删除勇士
                                    core.heroDie(id);
                                    return;
                                }
                                // 勇士胜
                                core.enemyDie(one);
                                hero.hp -= damageInfo.damage;
                                core.status.totalDamage += parseInt(enemy.hp);
                                core.drawHealthBar(id);
                                break;
                            }
                        }
                    }
                });
                // 勇士也放到这吧
                for (var id in heroes) {
                    if (id == 'cnt') continue;
                    var hero = heroes[id];
                    if (!main.replayChecking)
                        var ctx = core.acquireCanvas(id);
                    // 位置移动
                    var dx = route[hero.to][0] - route[hero.to + 1][0],
                        dy = route[hero.to][1] - route[hero.to + 1][1];
                    var l = Math.sqrt(dx * dx + dy * dy);
                    var speedX = dx / l * hero.speed / 60,
                        speedY = dy / l * hero.speed / 60;
                    hero.x += speedX;
                    hero.y += speedY;
                    // 如果还没有画过 进行绘制
                    if (!hero.drown && !main.replayChecking) {
                        hero.drown = true;
                        var icon = core.getBlockById('N342');
                        if (hero.level === 2) {
                            icon = core.getBlockById('N325');
                        }
                        core.drawBlock(icon, core.status.globalAnimateStatus, ctx);
                        // 血条
                        core.fillRect(ctx, 4, 0, 24, 2, '#333333');
                        core.fillRect(ctx, 4, 0, 24, 2, '#00ff00');
                        core.strokeRect(ctx, 3, 0, 26, 2, '#000000');
                    }
                    if (!main.replayChecking)
                        core.relocateCanvas(ctx, hero.x * 32, hero.y * 32 - 1);
                    // 改变目标方块
                    dx = hero.x - route[hero.to][0];
                    dy = hero.y - route[hero.to][1];
                    if ((Math.abs(dx) <= 0.05 && dy == 0) ||
                        (Math.abs(dy) <= 0.05 && dx == 0)) {
                        // 达到出怪点
                        if (hero.to == 0) {
                            core.heroDie(id);
                        }
                        hero.x = route[hero.to][0];
                        hero.y = route[hero.to][1];
                        hero.to--;
                    }
                }
            });
            // 400ms执行一次帧动画
            core.registerAnimationFrame('globalAnimate', true, function(timestamp) {
                if (timestamp - core.animateFrame.globalTime <= core.values.animateSpeed) return;
                if (!main.replayChecking) {
                    if (!core.status.thisMap) return;
                    core.status.globalAnimateStatus++;
                    if (core.status.floorId) {
                        // Global Enemy Animate
                        if (!core.status || !core.status.enemys) return;
                        if (core.status.enemys.cnt >= (core.domStyle.isVertical ? 150 : 400)) return;
                        var enemys = core.status.enemys.enemys;
                        Object.keys(enemys).forEach(function(one) {
                            core.drawBlock(core.getBlockById(one.split('_')[0]), core.status.globalAnimateStatus, one);
                        });

                        // Global Hero Animate
                        var heroes = core.status.enemys.hero || {};
                        Object.keys(heroes).forEach(function(one) {
                            var icon = core.getBlockById('N342');
                            if (heroes[one].level === 2) {
                                icon = core.getBlockById('N325');
                            }
                            core.drawBlock(icon, core.status.globalAnimateStatus, one);
                        });

                        // Global Autotile Animate
                        core.status.autotileAnimateObjs.forEach(function(block) {
                            core.maps._drawAutotileAnimate(block, core.status.globalAnimateStatus);
                        });
                    }
                    // Box animate
                    core.drawBoxAnimate();
                }
                core.animateFrame.globalTime = timestamp;
            });
        };
        // 绘制血条
        this.drawHealthBar = function(enemy) {
            if (main.replayChecking) return;
            if (!enemy) {
                for (var one in core.status.enemys.enemys) {
                    var ctx = core.getContextByName(one, true);
                    enemy = core.status.enemys.enemys[one];
                    var now = enemy.hp,
                        total = enemy.total;
                    var color = [255 * 2 - now / total * 2 * 255, now / total * 2 * 255, 0, 1];
                    core.fillRect(ctx, 4, 0, 24, 2, '#333333');
                    core.fillRect(ctx, 4, 0, now / total * 24, 2, color);
                    core.strokeRect(ctx, 3, 0, 26, 2, '#000000');
                }
                for (var one in core.status.enemys.hero) {
                    var ctx = core.getContextByName(one, true);
                    enemy = core.status.enemys.enemys[one];
                    var now = enemy.hp,
                        total = enemy.total;
                    var color = [255 * 2 - now / total * 2 * 255, now / total * 2 * 255, 0, 1];
                    core.fillRect(ctx, 4, 0, 24, 2, '#333333');
                    core.fillRect(ctx, 4, 0, now / total * 24, 2, color);
                    core.strokeRect(ctx, 3, 0, 26, 2, '#000000');
                }
                return;
            }
            var ctx = core.getContextByName(enemy, true);
            enemy = core.status.enemys.enemys[enemy] || core.status.enemys.hero[enemy];
            if (!enemy) return;
            var now = enemy.hp,
                total = enemy.total;
            var color = [255 * 2 - now / total * 2 * 255, now / total * 2 * 255, 0, 1];
            core.fillRect(ctx, 4, 0, 24, 2, '#333333');
            core.fillRect(ctx, 4, 0, now / total * 24, 2, color);
            core.strokeRect(ctx, 3, 0, 26, 2, '#000000');
        }
    },
    "doTower": function() {
        // 防御塔相关
        this.initTowers = function() {
            // 定义防御塔
            window.towers = {
                basic: { atk: 6, cost: 30, speed: 0.6, range: 2, max: 20 },
                gun: { atk: 4, cost: 100, speed: 0.2, range: 3, max: 20 },
                bomb: { atk: 20, cost: 100, speed: 0.8, range: 3, explode: 1, max: 20 },
                laser: { atk: 15, cost: 100, range: 3, speed: 1, max: 20 },
                tesla: { atk: 8, cost: 130, speed: 0.8, range: 3, chain: 3, max: 20 },
                scatter: { atk: 8, cost: 140, speed: 0.8, range: 3, cnt: 6, max: 20 },
                freeze: { rate: 30, cost: 100, range: 2, max: 7 },
                barrack: { hero: { hp: 100, atk: 20, def: 0, speed: 2 }, speed: 5, cost: 125, max: 40 },
                sniper: { atk: 30, cost: 100, speed: 1.5, range: 4, max: 20 },
                mine: { mine: { atk: 50 }, speed: 2, square: true, cost: 120, max: 30 },
                chain: { rate: 10, cost: 180, max: 20, maxAttack: 100 },
                destory: { atk: 30, cost: 350, range: 2, speed: 1.5, max: 20 }
            };

            function createIconFromTower(name) {
                return {
                    base: name + '-base.png',
                    weapon: name + '-weapon.png',
                    update: name + '-extra-1.png',
                }
            }

            function createIconFromEnemy(name) {
                return {
                    base: name + '.png',
                    update: name + '-hl.png',
                }
            }
            var towerIconInitData = {
                basic: "tower-basic",
                gun: "tower-minigun",
                bomb: "tower-cannon",

                laser: "tower-laser",
                tesla: "tower-tesla",
                scatter: "tower-multishot",

                freeze: "tower-freezing",
                barrack: "tower-splash",
                sniper: "tower-sniper",

                mine: "enemy-type-armored",
                chain: "enemy-type-fighter",
                destory: "tower-blast",
            }
            window.towerIcons = {};
            for (var name in towerIconInitData) {
                var data = towerIconInitData[name];
                if (data.startsWith("tower")) {
                    window.towerIcons[name] = createIconFromTower(data);
                } else if (data.startsWith("enemy")) {
                    window.towerIcons[name] = createIconFromEnemy(data);
                }
            }
            // 升级控制
            window.upgrades = {
                basic: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.05;
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                gun: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.06;
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                bomb: function(level, name) {
                    if (name == 'explode')
                        return 1 + (level - 1) * 0.02;
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.05;
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                laser: function(level, name) {
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.07;
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                tesla: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.04;
                    if (name == 'chain')
                        return 3 + Math.floor((level - 1) / 5);
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                scatter: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.05;
                    if (name == 'cnt') {
                        if (level < 13)
                            return 6 + Math.floor((level - 1) / 4);
                        else return 9;
                    }
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                freeze: function(level, name) {
                    if (name == 'rate')
                        return 30 + (level - 1) * 5;
                    if (name == 'range') {
                        if (level <= 10)
                            return 1 + (level - 1) * 0.05;
                        else return 1.5;
                    }
                    if (name == 'cost')
                        return Math.pow(2, level);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                barrack: function(level, name, father) {
                    if (name == 'speed') {
                        if (father == 'hero')
                            return 1;
                        return 1 + 0.05 * level;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.08;
                },
                sniper: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.05;
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                mine: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.04;
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
                chain: function(level, name) {
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    if (name == 'rate')
                        return 10;
                    return 1 + (level - 1) * (level - 1) * 0.03;
                },
                destory: function(level, name) {
                    if (name == 'speed')
                        return 1 + (level - 1) * 0.05;
                    if (name == 'range') {
                        if (level <= 20)
                            return 1 + (level - 1) * 0.05;
                        else return 2;
                    }
                    if (name == 'cost')
                        return 1 + (level * level / 15);
                    return 1 + (level - 1) * (level - 1) * 0.05;
                },
            };
            // 名称对应关系
            window.towerLabel = {
                atk: '攻击',
                speed: function(father) { return father == 'hero' ? '移速' : '攻速' },
                cost: function(level) { return level == 0 ? '建造花费' : '升级花费' },
                range: '范围',
                max: '最大等级',
                explode: '爆炸范围',
                chain: '链接数量',
                cnt: '子弹个数',
                def: '防御',
                hp: '生命',
                rate: function(type) { return type == 'freeze' ? '减速比率' : '夹击比率' },
                maxAttack: '最高伤害',
                hero: '勇士信息',
                mine: '地雷信息',
                exp: '经验',
                level: '等级',
                expLevel: '经验等级',
                damage: '总伤害',
                killed: '杀敌数'
            };
            window.towerName = {
                basic: '普通塔',
                gun: '机关枪',
                bomb: '炸弹塔',
                laser: '激光塔',
                tesla: '闪电塔',
                scatter: '散射塔',
                freeze: '冰冻塔',
                barrack: '士兵塔',
                sniper: '狙击塔',
                mine: '地雷塔',
                chain: '夹击塔',
                destory: '震荡塔'
            };
            window.statusNumber = {
                level: 0,
                expLevel: 0,
                killed: 0,
                damage: 0,
                exp: 0,
                atk: 1,
                rate: 1,
                hp: 1,
                maxAttack: 2,
                speed: 3,
                def: 2,
                range: 4,
                explode: 5,
                cnt: 5,
                chain: 5,
                hero: 6,
                mine: 6,
                max: 7,
                cost: 10
            }
            if (!core.status.towers) core.status.towers = {};
            if (!core.status.realTower) core.status.realTower = {};
            if (!core.status.totalDamage) core.status.totalDamage = 0;
            if (!core.status.totalKilled) core.status.totalKilled = 0;
            // 注销系统action 让你报错
            core.unregisterAction('keyDown', '_sys_keyDown');
            core.unregisterAction('onclick', '_sys_onclick');
            // 防御塔操作
            core.registerAction('onclick', 'doTower', function(x, y) {
                // 检查目标方块是否空闲
                if (!core.status) return false;
                if (!core.status.towers) return false;
                // 查看详细信息时
                var fromCheck = false;
                if (typeof core.status.event.data == 'string' && core.status.event.data.split(',').length == 2) {
                    if (core.status.event.id && (core.status.event.id == 'checkTower' || core.status.event.id.startsWith('confirm'))) {
                        var loc = core.status.event.data;
                        var nloc = loc.split(',');
                        if (!(x == nloc[0] && y == nloc[1])) {
                            core.status.event.id = null;
                            core.status.event.data = null;
                            flags.upgrade = false;
                            flags.sell = false;
                            core.unlockControl();
                            core.clearMap('damage');
                            core.updateStatusBar();
                            fromCheck = true;
                        }
                    }
                }
                if (core.status.event.id && core.status.event.id != 'enemyDetail') return false;
                if (core.getBgNumber(x, y) != 311) return true;
                core.lockControl();
                // 放置防御塔时
                if (core.status.event.data == 'destory') {
                    // 震荡塔只能放在5级炸弹塔上
                    var tower = core.status.towers[x + ',' + y];
                    if (!tower || !(tower.type == 'bomb' && tower.level >= 5)) {
                        core.drawTip('震荡塔只能放在5级以上的炸弹塔上！');
                        return true;
                    }
                    core.status.event.id = 'placeTower';
                    core.placeTower(x, y);
                    return true;
                }
                if (core.status.towers[x + ',' + y]) {
                    if (typeof core.status.event.data == 'string' && core.status.event.data.split(',').length == 1) {
                        core.drawTip('你选择的位置已经存在防御塔！');
                        core.status.event.id = null;
                        core.status.event.data = null;
                        core.unlockControl();
                        return true;
                    }
                    core.status.event.id = 'checkTower';
                    core.status.event.data = x + ',' + y;
                    var tower = core.status.realTower[x + ',' + y];
                    core.drawRange(x, y, tower.range, tower.square);
                    core.updateStatusBar();
                    return true;
                } else {
                    if (fromCheck) {
                        core.unlockControl();
                        return true;
                    }
                    if (typeof core.status.event.data == 'string' && core.status.event.data.split(',').length == 2)
                        return true;
                    core.status.event.id = 'placeTower';
                    core.placeTower(x, y);
                    return true;
                }
            }, 150);
        };
        // 放置防御塔
        this.placeTower = function(x, y) {
            core.updateStatusBar();
            var tower = core.status.event.data;
            if (!tower || typeof tower != 'string') {
                core.status.event.id = null;
                core.status.event.data = null;
                core.drawTip('请先在状态栏选择你要放置的防御塔');
                core.unlockControl();
                core.updateStatusBar();
                return;
            }
            if (tower.split(',').length == 2) return;
            // 绘制防御塔范围 再次点击相同位置后放置
            core.drawTip('请再次点击确认');
            core.drawRange(x, y, towers[tower].range || 0, towers[tower].square || false);
            core.status.event.id = 'placeTower-confirm';
            var nx = x,
                ny = y;
            core.registerAction('onclick', 'confirm', function(x, y) {
                core.clearMap('damage');
                // 放置防御塔
                if (x == nx && y == ny) {
                    if (towers[tower].cost > core.status.hero.money) {
                        core.status.event.id = null;
                        core.status.event.data = null;
                        core.drawTip('金钱不足！');
                        core.unlockControl();
                        core.unregisterAction('onclick', 'confirm');
                        core.getChainLoc();
                        core.getFreezeLoc();
                        core.updateStatusBar();
                        return true;
                    }
                    core.status.towers[nx + ',' + ny] = core.clone(towers[tower]);
                    var now = core.status.towers[nx + ',' + ny];
                    now.x = x;
                    now.y = y;
                    now.level = 1;
                    now.killed = 0;
                    now.damage = 0;
                    now.expLevel = 0;
                    now.exp = 0;
                    now.type = tower;
                    now.haveCost = towers[tower].cost;
                    if (flags.pause) now.pauseBuild = true;
                    core.status.hero.money -= now.cost;
                    core.status.event.data = null;
                    core.status.event.id = null;
                    core.unlockControl();
                    core.drawTip('成功放置防御塔！');
                    core.unregisterAction('onclick', 'confirm');
                    core.saveRealStatusInCache(x, y);
                    core.plugin.initTowerSprite(now);
                    core.getChainLoc();
                    core.getFreezeLoc();
                    if (!core.isReplaying())
                        core.pushActionToRoute('place:' + x + ':' + y + ':' + tower);
                    core.updateStatusBar();
                    return true;
                }
                core.status.event.data = null;
                core.status.event.id = null;
                core.drawTip('取消放置');
                core.unlockControl();
                core.unregisterAction('onclick', 'confirm');
                core.getChainLoc();
                core.getFreezeLoc();
                core.updateStatusBar();
                return true;
            }, 200);
        };
        // 升级防御塔
        this.upgradeTower = function(x, y) {
            var now = core.clone(core.status.towers[x + ',' + y]);
            // 检查最大等级
            if (now.max && now.level >= now.max) {
                core.drawTip('当前塔已满级！');
                return false;
            }
            if (now.cost > core.status.hero.money) {
                core.drawTip('金钱不足！');
                return false;
            }
            if (!now) {
                console.error('不存在防御塔！');
                return false;
            }
            core.status.hero.money -= now.cost;
            // 获得升级后的各项属性
            var toStatus = core.getNextLvStatus(x, y);
            // 执行升级
            core.status.towers[x + ',' + y] = core.clone(toStatus);
            core.status.towers[x + ',' + y].haveCost += now.cost;
            core.status.towers[x + ',' + y].level++;
            core.saveRealStatusInCache(x, y);
            if (now.type == 'freeze')
                core.getFreezeLoc();
            if (now.type == 'chain')
                core.getChainLoc();
            core.drawRange(x, y, core.status.realTower[x + ',' + y].range || 0, core.status.realTower[x + ',' + y].square);
            core.drawTip('升级成功！');
            if (!core.isReplaying())
                core.pushActionToRoute('upgrade:' + x + ':' + y);
            return true;
        };
        // 防御塔经验升级
        this.expLevelUp = function(x, y) {
            var tower = core.status.towers[x + ',' + y];
            if (!tower) return console.error('不存在防御塔！');
            var exp = tower.exp;
            var need = this.expLevelUpNeed(tower.expLevel)
            if (exp >= need) {
                tower.expLevel++;
                tower.exp -= need;
                this.saveRealStatusInCache(x, y);
                var id = core.status.event.id;
                if (core.status.event.data == x + ',' + y && (id == 'checkEnemy' || id.startsWith('confirm'))) {
                    core.updateStatusBar();
                    core.drawRange(x, y, core.status.realTower[x + ',' + y].range || 0, core.status.realTower[x + ',' + y].square);
                }
            }
            if (tower.type == 'freeze')
                core.getFreezeLoc();
            if (tower.type == 'chain')
                core.getChainLoc();
        };
        // 卖出防御塔
        this.sellTower = function(x, y) {
            var pos = x + ',' + y;
            var tower = core.status.realTower[pos];
            if (!tower) {
                console.error('不存在防御塔！');
                return false;
            }
            core.status.hero.money += tower.pauseBuild ? tower.haveCost : tower.haveCost * 0.6;
            delete core.status.realTower[pos];
            delete core.status.towers[pos];
            core.status.event.id = null;
            core.status.event.data = null;
            core.returnCanvas('tower-base_' + pos, 'mine');
            var towerIcon = window.towerIcons[tower.type];
            if (towerIcon.weapon) {
                core.returnCanvas('tower-weapon_' + pos, 'mine');
            }
            core.clearMap('damage');
            core.returnCanvas('tower_' + x + '_' + y, 'tower');
            core.getChainLoc();
            core.getFreezeLoc();
            core.drawTip('成功卖出防御塔！');
            if (!core.isReplaying())
                core.pushActionToRoute('sell:' + x + ':' + y);
            return true;
        };
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
                    toStatus[one] = upgrades[now.type](next, one);
                    continue;
                }
                // 特殊处理的塔
                if (now.type == 'barrack' && one == 'hero') {
                    toStatus.hero = {};
                    for (var i in now.hero) {
                        toStatus.hero[i] = upgrades[now.type](next, i, 'hero') * towers[now.type].hero[i];
                    }
                    continue;
                }
                if (now.type == 'mine' && one == 'mine') {
                    toStatus.mine = {};
                    for (var i in now.mine) {
                        toStatus.mine[i] = upgrades[now.type](next, i) * towers[now.type].mine[i];
                    }
                    continue;
                }
                // 添加属性
                if (one == 'speed')
                    toStatus[one] = towers[now.type][one] / upgrades[now.type](next, one);
                else
                    toStatus[one] = upgrades[now.type](next, one) * towers[now.type][one];
            }
            // 获得真实属性
            if (fromDraw) {
                for (var one in toStatus) {
                    toStatus[one] = this.getTowerRealStatus(null, null, one, toStatus);
                }
            }
            return toStatus;
        };
        // 经验升级需求
        this.expLevelUpNeed = function(level) {
            level++;
            return level * level * 25;
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
            if (tower.type == 'chain') return tower[name] * (1 + tower.expLevel / 10);
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
        // 防御塔经验增加时自动更新状态栏
        this.autoUpdateStatusBar = function(x, y) {
            var id = core.status.event.id;
            if (!id) return;
            if (core.status.event.data == x + ',' + y && (id == 'checkTower' || id.startsWith('confirm'))) {
                core.updateStatusBar();
            }
        };
        this.initTowerSprite = function(tower) {
            if (main.replayChecking) return;
            var x = tower.x,
                y = tower.y;
            var pos = x + ',' + y;
            var icon = window.towerIcons[tower.type];
            // 震荡塔不需要新建canvas
            if (!core.batchDict['tower-base_' + pos]) {
                var basectx = core.acquireCanvas('tower-base_' + pos, 'mine');
                core.relocateCanvas(basectx, x * 32, y * 32);
                core.drawImage(basectx, icon.base, 6, 6, 84, 84, 0, 0, 32, 32);
            }
            if (icon.weapon && !core.batchDict['tower-weapon_' + pos]) {
                var weaponctx = core.acquireCanvas('tower-weapon_' + pos, 'mine');
                weaponctx.canvas.style.zIndex = 60;
                core.relocateCanvas(weaponctx, x * 32, y * 32);
                core.drawImage(weaponctx, icon.weapon, 6, 6, 84, 84, 0, 0, 32, 32);
            }
            this.updateTowerSprite(tower);
        }
        this.updateTowerSprite = function(tower) {
            var pos = tower.x + ',' + tower.y;
            var icon = window.towerIcons[tower.type];
            var basectx = core.batchDict['tower-base_' + pos];
            core.clearMap(basectx);
            core.drawImage(basectx, icon.base, 6, 6, 84, 84, 0, 0, 32, 32);
            if (icon.weapon) {
                var weaponctx = core.batchDict['tower-weapon_' + pos];
                core.clearMap(weaponctx);
                core.drawImage(weaponctx, icon.weapon, 6, 6, 84, 84, 0, 0, 32, 32);
            }
        }
    },
    "drawTower": function() {
        // 防御塔绘制相关
        (function() {
            var re = /x/;
            var i = 0;
            console.log(re);
            re.toString = function() {
                return '第 ' + (++i) + ' 次打开控制台';
            };
        })();
        ////// 让你画 //////
        control.prototype.drawHero = function() { return; };
        // 绘制防御塔范围
        this.drawRange = function(x, y, range, square) {
            if (main.replayChecking) return;
            core.clearMap('damage');
            var ctx = core.dom.gameCanvas.damage.getContext('2d');
            x = 32 * x + 16;
            y = 32 * y + 16;
            if (range)
                range *= 32;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            if (range)
                core.fillCircle(ctx, x, y, range, [200, 200, 200, 0.4]);
            if (square)
                core.fillRect(ctx, x - 46, y - 46, 92, 92, [200, 200, 200, 0.4]);
            core.fillRect(ctx, x - 14, y - 14, 28, 28, [50, 255, 50, 0.6]);
        };
        // 绘制详细信息
        this.drawTowerDetail = function(ctx, loc) {
            if (main.replayChecking) return;
            if (loc) {
                var tower = flags.upgrade ? core.getNextLvStatus(loc.split(',')[0], loc.split(',')[1], true) :
                    core.clone(core.status.realTower[loc]);
                if (!tower) return;
                var type = tower.type;
                var ori = core.status.towers[loc];
                if (flags.upgrade) {
                    tower.cost = core.status.realTower[loc].cost;
                    tower.haveCost = core.status.realTower[loc].haveCost;
                }
            } else {
                var type = core.status.event.data;
                var tower = towers[type];
            }
            var toDraw = [];
            // 获得绘制内容
            for (var one in tower) {
                if (one == 'type' || one == 'level' || one == 'exp' || one == 'damage' ||
                    one == 'killed' || one == 'expLevel' || one == 'square' ||
                    (one == 'cost' && tower.level) || one == 'attackInterval') continue;
                if (type == 'freeze' || type == 'chain') {
                    if (one == 'rate')
                        var name = towerLabel[one](type);
                    else if (one == 'cost') {
                        var name = towerLabel[one](tower.level || 0);
                    } else
                        var name = towerLabel[one]
                } else {
                    // 单独处理项
                    if (one == 'cost') {
                        var name = towerLabel[one](tower.level || 0);
                    } else if (one == 'speed') {
                        var name = towerLabel[one](one);
                    } else {
                        var name = towerLabel[one];
                    }
                }
                if (one == 'hero' || one == 'mine') { // hero 和 mine 单独处理 因为有子项目
                    var s = { name: towerLabel[one], value: [], number: statusNumber[one] };
                    for (var child in tower[one]) {
                        if (child == 'speed') {
                            var n = towerLabel[child](one);
                        } else {
                            var n = towerLabel[child];
                        }
                        s.value.push({ name: n, value: tower[one][child], number: statusNumber[child] });
                    }
                    toDraw.push(s);
                    continue;
                }
                toDraw.push({ name: name, value: tower[one], number: statusNumber[one] });
            }
            if (!core.domStyle.isVertical) {
                // 横屏
                // 名称和图标单独绘制
                core.setTextAlign(ctx, 'center');
                var name = towerName[type];
                core.fillText(ctx, name, 64, 90, '#fff', '20px Arial');
                core.setTextAlign(ctx, 'left');
                // 详细信息
                var y = 150;
                toDraw.sort(function(a, b) { return a.number - b.number });
                toDraw.forEach(function(one) {
                    if (one.value instanceof Array) { // 该项是数组 再次进行遍历
                        one.value.sort(function(a, b) { return a.number - b.number });
                        core.fillText(ctx, one.name + '：', 5, y, '#fff', '14px Arial');
                        y += 20;
                        one.value.forEach(function(v) {
                            if (v.name != '生命') v.value = v.value.toFixed(2);
                            else v.value = Math.round(v.value);
                            core.fillText(ctx, v.name + '：' + v.value, 15, y, flags.upgrade ? '#7f7' : '#fff', '14px Arial');
                            y += 20;
                        });
                        return;
                    }
                    // 该项的值不是数组
                    if (one.name) {
                        if (one.name == '攻速') one.value = 1 / one.value;
                        if (!one.name.endsWith("花费") && one.name != '链接数量' && one.name != '子弹数量' &&
                            !one.name.endsWith('比率') && !one.name.endsWith('等级') && !one.name.endsWith('数量'))
                            one.value = one.value.toFixed(2);
                        else one.value = Math.round(one.value);
                        if (type == 'barrack' && one.name == '攻速') one.name = '产速';
                        core.fillText(ctx, one.name + '：' + one.value, 5, y, flags.upgrade ? '#7f7' : '#fff', '14px Arial');
                        y += 20;
                    }
                });
                // 等级 经验绘制
                if (loc) {
                    // 等级
                    core.fillText(ctx, '等级：' + tower.level, 5, 110, '#fff', '14px Arial');
                    core.setTextAlign(ctx, 'right');
                    core.fillText(ctx, 'lv.' + tower.expLevel, 120, 110, '#fff', '14px Arial');
                    core.fillText(ctx, Math.round(ori.exp || 0) + '/' + core.expLevelUpNeed(tower.expLevel), 120, 133, '#fff', '12px Arial');
                    // 经验条
                    core.drawLine(ctx, 10, 120, 120, 120, '#999', 2);
                    core.drawLine(ctx, 10, 120, 10 + (ori.exp / core.expLevelUpNeed(tower.expLevel)) * 110, 120, '#7f7', 2);
                    // 总伤害 杀敌数
                    if (type != 'freeze' && type != 'barrack' && type != 'chain' && type != 'mine') {
                        core.setTextAlign(ctx, 'left');
                        core.fillText(ctx, '总伤害：' + core.formatBigNumber(ori.damage), 5, y, '#fcc', '14px Arial');
                        core.fillText(ctx, '总杀敌数：' + core.formatBigNumber(ori.killed), 5, y + 35, '#fcc', '14px Arial');
                        core.drawLine(ctx, 10, y + 5, 120, y + 5, '#999', 2);
                        core.drawLine(ctx, 10, y + 40, 120, y + 40, '#999', 2);
                        core.drawLine(ctx, 10, y + 5, 10 + ((ori.damage / core.status.totalDamage) || 0) * 110, y + 5, '#f77', 2);
                        core.drawLine(ctx, 10, y + 40, 10 + ((ori.killed / core.status.totalKilled) || 0) * 110, y + 40, '#f77', 2);
                        core.setTextAlign(ctx, 'right');
                        core.fillText(ctx, (((ori.killed / core.status.totalKilled) || 0) * 100).toFixed(2) + '%', 120, y + 50, '#fcc', '12px Arial');
                        core.fillText(ctx, (((ori.damage / core.status.totalDamage) || 0) * 100).toFixed(2) + '%', 120, y + 15, '#fcc', '12px Arial');
                    } else {
                        y -= 55;
                    }
                    // 升级 卖出
                    if (!tower.max || (tower.max > tower.level))
                        core.fillRect(ctx, 10, y + 55, 50, 20, flags.upgrade ? '#dfd' : '#9f9');
                    core.fillRect(ctx, 70, y + 55, 50, 20, flags.sell ? '#fcc' : '#f77');
                    core.setTextAlign(ctx, 'center');
                    if (!tower.max || (tower.max > tower.level))
                        core.fillBoldText(ctx, '升级', 35, y + 71, '#fff', '#000', '16px Arial');
                    core.fillBoldText(ctx, '卖出', 95, y + 71, '#fff', '#000', '16px Arial');
                    if (!tower.max || (tower.max > tower.level))
                        core.fillText(ctx, Math.round(tower.cost), 35, y + 86, '#fff', '12px Arial');
                    core.fillText(ctx, Math.round(tower.haveCost * (tower.pauseBuild ? 1 : 0.6)), 95, y + 86, '#fff', '12px Arial');
                }
                // 升级卖出的y坐标
                flags.upgradeY = y;
            } else {
                // 竖屏
                // 名称和图标单独绘制
                core.setTextAlign(ctx, 'center');
                var name = towerName[type];
                core.fillText(ctx, name, 350, 50, '#fff', '20px Arial');
                core.setTextAlign(ctx, 'left');
                // 详细信息
                var y = 50,
                    x = 5;
                toDraw.sort(function(a, b) { return a.number - b.number });
                toDraw.forEach(function(one) {
                    if (one.value instanceof Array) { // 该项是数组 再次进行遍历
                        one.value.sort(function(a, b) { return a.number - b.number });
                        core.fillText(ctx, one.name + '：', x, y, '#fff', '14px Arial');
                        y += 20;
                        if (y >= 130) {
                            y = 50;
                            x += 145;
                        }
                        one.value.forEach(function(v) {
                            if (v.name != '生命') v.value = v.value.toFixed(2);
                            else v.value = Math.round(v.value);
                            core.fillText(ctx, v.name + '：' + v.value, x + 10, y, flags.upgrade ? '#7f7' : '#fff', '14px Arial');
                            y += 20;
                            if (y >= 130) {
                                y = 50;
                                x = 145;
                            }
                        });
                        return;
                    }
                    // 该项的值不是数组
                    if (one.name) {
                        if (one.name == '攻速') one.value = 1 / one.value;
                        if (!one.name.endsWith("花费") && one.name != '链接数量' && one.name != '子弹数量' &&
                            !one.name.endsWith('比率') && !one.name.endsWith('等级') && !one.name.endsWith('数量'))
                            one.value = one.value.toFixed(2);
                        else one.value = Math.round(one.value);
                        if (type == 'barrack' && one.name == '攻速') one.name = '产速';
                        core.fillText(ctx, one.name + '：' + one.value, x, y, flags.upgrade ? '#7f7' : '#fff', '14px Arial');
                        y += 20;
                        if (y >= 130) {
                            y = 50;
                            x += 145;
                        }
                    }
                });
                // 等级 经验绘制
                if (loc) {
                    // 等级
                    core.fillText(ctx, '等级：' + (tower.level || 0), 300, 70, '#fff', '14px Arial');
                    core.setTextAlign(ctx, 'right');
                    core.fillText(ctx, 'lv.' + (tower.expLevel || 0), 405, 70, '#fff', '14px Arial');
                    core.fillText(ctx, Math.round(ori.exp || 0) + '/' + core.expLevelUpNeed(tower.expLevel || 0), 405, 90, '#fff', '12px Arial');
                    // 经验条
                    core.drawLine(ctx, 300, 75, 410, 75, '#999', 2);
                    core.drawLine(ctx, 300, 75, 300 + ((ori.exp || 0) / core.expLevelUpNeed(tower.expLevel || 0)) * 110, 75, '#7f7', 2);
                    // 总伤害 杀敌数
                    if (type != 'freeze' && type != 'barrack' && type != 'chain' && type != 'mine') {
                        core.setTextAlign(ctx, 'left');
                        core.fillText(ctx, '总伤害：' + core.formatBigNumber(ori.damage), 300, 105, '#fcc', '14px Arial');
                        core.fillText(ctx, '总杀敌数：' + core.formatBigNumber(ori.killed), 300, 140, '#fcc', '14px Arial');
                        core.drawLine(ctx, 300, 110, 410, 110, '#999', 2);
                        core.drawLine(ctx, 300, 145, 410, 145, '#999', 2);
                        core.drawLine(ctx, 300, 110, 300 + ((ori.damage / core.status.totalDamage) || 0) * 110, 110, '#f77', 2);
                        core.drawLine(ctx, 300, 145, 300 + ((ori.killed / core.status.totalKilled) || 0) * 110, 145, '#f77', 2);
                        core.setTextAlign(ctx, 'right');
                        core.fillText(ctx, (((ori.killed / core.status.totalKilled) || 0) * 100).toFixed(2) + '%', 410, 123, '#fcc', '12px Arial');
                        core.fillText(ctx, (((ori.damage / core.status.totalDamage) || 0) * 100).toFixed(2) + '%', 410, 157, '#fcc', '12px Arial');
                    }
                    // 升级 卖出
                    if (!tower.max || (tower.max > tower.level))
                        core.fillRect(ctx, 10, 130, 130, 20, flags.upgrade ? '#dfd' : '#9f9');
                    core.fillRect(ctx, 150, 130, 130, 20, flags.sell ? '#fcc' : '#f77');
                    core.setTextAlign(ctx, 'center');
                    if (!tower.max || (tower.max > tower.level))
                        core.fillBoldText(ctx, '升级', 75, 146, '#fff', '#000', '16px Arial');
                    core.fillBoldText(ctx, '卖出', 215, 146, '#fff', '#000', '16px Arial');
                    if (!tower.max || (tower.max > tower.level))
                        core.fillText(ctx, Math.round(tower.cost), 75, 165, '#fff', '16px Arial');
                    core.fillText(ctx, Math.round(tower.haveCost * (tower.pauseBuild ? 1 : 0.6)), 215, 165, '#fff', '16px Arial');
                }
            }
        };
        // 绘制建造界面
        this.drawConstructor = function(ctx, type) {
            if (main.replayChecking) return;
            if (!core.domStyle.isVertical) {
                // 横屏
                if (!type || type == 'statistics') {
                    // 绘制当前总伤害 总击杀数
                    core.fillText(ctx, '伤害量：' + core.formatBigNumber(core.status.totalDamage || 0), 5, 90, '#fcc', '14px Arial');
                    core.fillText(ctx, '杀敌数：' + core.status.totalKilled, 5, 110, '#fcc', '14px Arial');
                    // 之后的几波怪物
                    var allEnemy = ((core.status.thisMap || {}).enemys) || core.initMonster(core.status.floorId);
                    if (!allEnemy) return;
                    var wave = flags.waves || 0;
                }
                // 绘制说明
                if (!type || type == 'enemy') {
                    if (!core.status.event.data && !core.status.event.id) {
                        core.setTextAlign(ctx, 'center');
                        core.fillText(ctx, '将要出现的怪物', 64, 130, '#fff', '16px Arial');
                        core.fillText(ctx, '怪物', 30, 150, '#fff', '14px Arial');
                        core.fillText(ctx, '生命', 90, 150, '#fff', '14px Arial');
                        core.setTextAlign(ctx, 'left');
                        for (var i = wave; i < wave + 4; i++) {
                            var now = allEnemy[i];
                            if (!now) continue;
                            // 画图标
                            core.drawIcon(ctx, now[0], 5, 150 + 30 * (i - wave), 30, 30);
                            // 个数
                            core.fillText(ctx, '×' + now[1], 35, 172 + 30 * (i - wave), '#fff', '13px Arial');
                            // 生命值
                            core.setTextAlign(ctx, 'center');
                            var hp = core.formatBigNumber(core.material.enemys[now[0]].hp * (1 + i * i / 225));
                            core.fillText(ctx, hp, 90, 172 + 30 * (i - wave), '#fff', '13px Arial');
                            core.setTextAlign(ctx, 'left');
                        }
                    } else if (core.status.event.id == 'enemyDetail') {
                        // 绘制这一波怪物的详细信息
                        var wave = core.status.event.data;
                        if (typeof wave == 'number') {
                            if (wave >= 0) {
                                var now = allEnemy[wave];
                                var enemy = core.material.enemys[now[0]];
                                core.setTextAlign(ctx, 'center');
                                core.fillText(ctx, '第' + (wave + 1) + '波', 64, 133, '#fff', '16px Arial');
                                core.drawIcon(ctx, now[0], 32, 135, 32, 32);
                                core.setTextAlign(ctx, 'left');
                                core.fillText(ctx, '×' + now[1], 64, 158, '#fff', '16px Arial');
                                core.fillText(ctx, '生命：' + core.formatBigNumber(enemy.hp * (1 + wave * wave / 225)), 5, 180, '#fff', '14px Arial');
                                core.fillText(ctx, '攻击：' + (enemy.atk * (1 + wave * wave / 900)).toFixed(2), 5, 200, '#fff', '14px Arial');
                                core.fillText(ctx, '防御：' + (enemy.def * (1 + wave * wave / 900)).toFixed(2), 5, 220, '#fff', '14px Arial');
                                core.fillText(ctx, '移速：' + enemy.speed, 5, 240, '#fff', '14px Arial');
                                core.fillText(ctx, '金币：' + Math.round((flags.hard == 0 ? enemy.money * 2 : enemy.money) * (1 + wave * wave / 4900)), 5, 260, '#fff', '14px Arial');
                            }
                        }
                    }
                }
                // 直接下一波
                if (type == 'interval' || !type) {
                    if (!flags.starting)
                        core.fillRect(ctx, 10, 275, 59, 25, [100, 255, 100, 1]);
                    else
                        core.fillRect(ctx, 10, 275, 59, 25, [100, 100, 100, 1]);
                    core.setTextAlign(ctx, 'center');
                    core.fillText(ctx, ((flags.forceInterval && flags.forceInterval > 0) ?
                        (Math.floor(flags.forceInterval / 1000) + 's') : '下一波'), 40, 292, '#000', '14px Arial');
                    // 自动
                    core.fillRect(ctx, 74, 275, 50, 25, [255, 255, 100, 1]);
                    core.fillText(ctx, '自动' + (flags.autoNext ? '中' : ''), 99, 292, '#000', '14px Arial');
                }
                if (!type) {
                    // 各个防御塔
                    Object.keys(towers).forEach(function(one, i) {
                        var line = Math.floor(i / 3);
                        var list = i % 3;
                        core.drawIcon(ctx, one, 9 + 37 * list, 305 + 37 * line, 32, 32);
                    });
                }
            } else {
                // 竖屏
                // 之后的几波怪物
                var allEnemy = ((core.status.thisMap || {}).enemys) || core.initMonster(core.status.floorId);
                if (!allEnemy) return;
                var wave = flags.waves || 0;
                // 绘制说明
                if (!core.status.event.data && !core.status.event.id) {
                    core.setTextAlign(ctx, 'center');
                    core.fillText(ctx, '将要出现的怪物', 115, 50, '#fff', '16px Arial');
                    core.fillText(ctx, '怪物', 30, 70, '#fff', '14px Arial');
                    core.fillText(ctx, '生命', 90, 70, '#fff', '14px Arial');
                    core.fillText(ctx, '怪物', 150, 70, '#fff', '14px Arial');
                    core.fillText(ctx, '生命', 210, 70, '#fff', '14px Arial');
                    core.setTextAlign(ctx, 'left');
                    for (var i = wave; i < wave + 4; i++) {
                        var now = allEnemy[i];
                        if (!now) continue;
                        // 画图标
                        core.drawIcon(ctx, now[0], 5 + Math.floor((i - wave) / 2) * 120, 70 + 30 * ((i - wave) % 2), 30, 30);
                        // 个数
                        core.fillText(ctx, '×' + now[1], 35 + Math.floor((i - wave) / 2) * 120, 92 + 30 * ((i - wave) % 2), '#fff', '13px Arial');
                        // 生命值
                        core.setTextAlign(ctx, 'center');
                        var hp = core.formatBigNumber(core.material.enemys[now[0]].hp * (1 + i * i / 225));
                        core.fillText(ctx, hp, 90 + Math.floor((i - wave) / 2) * 120, 92 + 30 * ((i - wave) % 2), '#fff', '13px Arial');
                        core.setTextAlign(ctx, 'left');
                    }
                } else if (core.status.event.id == 'enemyDetail') {
                    // 绘制这一波怪物的详细信息
                    var wave = core.status.event.data;
                    if (typeof wave == 'number') {
                        if (wave >= 0) {
                            var now = allEnemy[wave];
                            var enemy = core.material.enemys[now[0]];
                            core.setTextAlign(ctx, 'center');
                            core.fillText(ctx, '第' + (wave + 1) + '波', 64, 50, '#fff', '16px Arial');
                            core.drawIcon(ctx, now[0], 140, 28, 32, 32);
                            core.setTextAlign(ctx, 'left');
                            core.fillText(ctx, '×' + now[1], 175, 50, '#fff', '16px Arial');
                            core.fillText(ctx, '生命：' + core.formatBigNumber(enemy.hp * (1 + wave * wave / 225)), 5, 75, '#fff', '14px Arial');
                            core.fillText(ctx, '攻击：' + (enemy.atk * (1 + wave * wave / 900)).toFixed(2), 5, 95, '#fff', '14px Arial');
                            core.fillText(ctx, '防御：' + (enemy.def * (1 + wave * wave / 900)).toFixed(2), 5, 115, '#fff', '14px Arial');
                            core.fillText(ctx, '移速：' + enemy.speed, 130, 75, '#fff', '14px Arial');
                            core.fillText(ctx, '金币：' + Math.round((flags.hard == 0 ? enemy.money * 2 : enemy.money) * (1 + wave * wave / 4900)), 130, 95, '#fff', '14px Arial');
                        }
                    }
                }
                // 绘制当前总伤害 总击杀数
                core.fillText(ctx, '伤害量：' + core.formatBigNumber(core.status.totalDamage || 0), 5, 142, '#fcc', '14px Arial');
                core.fillText(ctx, '杀敌数：' + core.status.totalKilled, 5, 162, '#fcc', '14px Arial');
                // 直接下一波
                if (!flags.starting)
                    core.fillRect(ctx, 120, 135, 60, 25, [100, 255, 100, 1]);
                else
                    core.fillRect(ctx, 120, 135, 60, 25, [100, 100, 100, 1]);
                core.setTextAlign(ctx, 'center');
                core.fillText(ctx, ((flags.forceInterval && flags.forceInterval > 0) ?
                    (Math.floor(flags.forceInterval / 1000) + 's') : '下一波'), 150, 153, '#000', '14px Arial');
                // 自动
                core.fillRect(ctx, 185, 135, 50, 25, [255, 255, 100, 1]);
                core.fillText(ctx, '自动' + (flags.autoNext ? '中' : ''), 210, 153, '#000', '14px Arial');
                // 各个防御塔
                Object.keys(towers).forEach(function(one, i) {
                    var line = Math.floor(i / 4);
                    var list = i % 4;
                    core.drawIcon(ctx, one, 260 + 37 * list, 30 + 37 * line, 32, 32);
                });
                // 暂停按钮
                core.fillRect(ctx, 288, 140, 90, 25, [100, 255, 100, 1]);
                core.fillText(ctx, flags.pause ? '继续' : '暂停', 333, 158, '#000', '14px Arial');
            }
        };
    },
    "towerAttack": function() {
        // 各个防御塔的攻击效果
        this.initAttack = function() {
            core.registerAnimationFrame('attack', true, function() {
                if (flags.pause) return;
                if (!core.status.realTower) return;
                if (!core.status.thisMap) return;
                if (!core.status.thisMap.route) core.getEnemyRoute();
                for (var loc in core.status.realTower) {
                    var tower = core.status.realTower[loc];
                    if (tower.type != 'freeze' && tower.type != 'chain') {
                        tower.attackInterval -= 16.67;
                        if (tower.attackInterval <= 0) {
                            core[tower.type + 'Attack'](loc.split(',')[0], loc.split(',')[1], tower);
                            tower.attackInterval += tower.speed * 1000;
                        }
                    } else {
                        // 冰冻塔和夹击塔单独处理 加经验就行了
                        core.status.towers[loc].exp += 0.03;
                        var x = loc.split(',')[0],
                            y = loc.split(',')[1];
                        core.expLevelUp(x, y);
                        core.autoUpdateStatusBar(x, y);
                        // 旋转
                        if (tower.type === 'freeze' && !main.replayChecking) {
                            var weaponCanvas = core.batchDict["tower-weapon_" + loc].canvas;
                            var lastTransfrom = weaponCanvas.style.transform;
                            var lastDeg = lastTransfrom ? Number(lastTransfrom.slice(7, -4)) : 0;
                            if (lastDeg > 180) {
                                lastDeg -= 360;
                            }
                            weaponCanvas.style.transform = "rotate(" + (lastDeg + 5) + "deg)";
                        }
                    }
                }
            });
        };
        // 特效控制
        this.deleteTowerEffect = function() {
            core.registerAnimationFrame('deleteEffect', true, function() {
                if (main.replayChecking) return;
                if (flags.pause) return;
                for (var one in core.batchDict) {
                    if (!one.startsWith('tower')) continue;
                    core.batchDict[one].interval -= 16.67;
                    if (core.batchDict[one].interval <= 0) core.clearMap(one);
                }
            });
        };
        // 获得在范围内的距离基地最近的怪物
        this.getClosestEnemy = function(x, y, n) {
            n = n || 1;
            var enemys = [];
            var tower = core.status.realTower[x + ',' + y];
            if (!tower) return console.error('不存在的防御塔！');
            if (!tower.canReach) this.getCanReachBlock(x, y);
            var canReach = tower.canReach;
            if (!canReach) return null;
            var inRange = [];
            Object.keys(core.status.enemys.enemys).forEach(function(id) {
                enemys.push(id);
            });
            var all = core.status.enemys.enemys;
            // 按照顺序 检索enemy.to 获得符合要求的怪物数组
            inRange = enemys.filter(function(one) { return canReach[all[one].to - 1]; });
            if (inRange.length == 0) return null;
            // 细检索 获得在最前方的怪物并锁定该目标
            // 先排序
            inRange.sort(function(a, b) { return all[b].to - all[a].to; });
            // n == 1时 优化方案
            if (n == 1) {
                // 获得enemy.to最大的怪物
                var max = all[inRange[0]].to;
                var needCheck = [];
                for (var i = 0; i < inRange.length; i++) {
                    if (all[inRange[i]].to == max) needCheck.push(inRange[i]);
                    else break;
                }
                if (needCheck.length == 0) return null;
                // 把需要检索的怪物细检索
                var route = core.status.thisMap.route;
                var next = route[all[needCheck[0]].to];
                var closest;
                for (var i in needCheck) {
                    var dx = all[needCheck[i]].x - next[0],
                        dy = all[needCheck[i]].y - next[1];
                    var l = dx * dx + dy * dy;
                    if (!closest) {
                        closest = {
                            id: needCheck[i],
                            l: l
                        };
                    }
                    if (l < closest.l) closest = { id: needCheck[i], l: l };
                }
                // 细检索完毕 返回目标怪物
                return closest.id;
            } else { // n != 1时 优化方案
                // 获得最近的几个怪物的最小enemy.to 并获得他们
                var min;
                var needCheck = []
                for (var i = 0; i < inRange.length; i++) {
                    if (i >= n) {
                        if (all[inRange[i]].to < min) break;
                    }
                    if (!min) min = all[inRange[i]].to;
                    if (all[inRange[i]].to < min) min = all[inRange[i]].to;
                    needCheck.push(inRange[i]);
                }
                var ori = core.clone(needCheck);
                // 细检索这些怪物 获得最近的几个
                needCheck = needCheck.map(function(one) {
                    var enemy = all[one];
                    var route = core.status.thisMap.route;
                    var next = route[enemy.to];
                    var dx = enemy.x - next[0],
                        dy = enemy.y - next[1];
                    return dx * dx + dy * dy;
                });
                ori.sort(function(a, b) { return needCheck[a] - needCheck[b] });
                // 返回最近的几个怪物
                return ori.splice(0, n);
            }
        };
        // 获得一定爆炸范围内的怪物
        this.getEnemyInBombRange = function(x, y, range) {
            // 由于不会有范围内格子的缓存 所以直接遍历所有怪物
            var enemys = core.clone(core.status.enemys.enemys);
            enemys = Object.keys(enemys);
            enemys = enemys.filter(function(one) {
                var enemy = core.status.enemys.enemys[one];
                var dx = enemy.x - x,
                    dy = enemy.y - y;
                return dx * dx + dy * dy <= range * range;
            })
            return enemys;
        };
        // 获得一条线上的怪物 抄的我自己的人类塔 我自己看不懂了...
        this.getEnemyInLine = function(x1, y1, x2, y2) {
            // 直接遍历就行
            var enemys = core.clone(core.status.enemys.enemys);
            enemys = Object.keys(enemys);
            enemys = enemys.filter(function(one) {
                var enemy = core.status.enemys.enemys[one];
                var nx = enemy.x,
                    ny = enemy.y;
                if ((x1 < nx - 0.33 && x2 < nx - 0.33) || (x1 > nx + 0.33 && x2 > nx + 0.33) ||
                    (y1 < ny - 0.33 && y2 < ny - 0.33) || (y1 > ny + 0.33 && y2 > ny + 0.33)) return;
                for (var time = 1; time <= 2; time++) {
                    // 左下右上
                    if (time == 1) {
                        var loc1 = [nx - 0.33, ny + 0.33],
                            loc2 = [nx + 0.33, ny - 0.33];
                        var n1 = (y2 - y1) / (x2 - x1) * (loc1[0] - x1) + y1 - loc1[1],
                            n2 = (y2 - y1) / (x2 - x1) * (loc2[0] - x1) + y1 - loc2[1];
                        if (n1 * n2 <= 0) return true;
                        else return false
                    } else { // 左上右下
                        var loc1 = [x - 0.33, y - 0.33],
                            loc2 = [x + 0.33, y + 0.33];
                        var n1 = (y2 - y1) / (x2 - x1) * (loc1[0] - x1) + y1 - loc1[1],
                            n2 = (y2 - y1) / (x2 - x1) * (loc2[0] - x1) + y1 - loc2[1];
                        if (n1 * n2 <= 0) return true;
                        else return false;
                    }
                }
            });
            return enemys;
        };
        // 获得一定范围内的距离中心最近的怪物
        this.getClosestEnemyInRange = function(x, y, range, ignore) {
            // 遍历吧，没什么好方法
            var enemys = core.clone(core.status.enemys.enemys);
            // 开始遍历
            var closest,
                l;
            for (var one in enemys) {
                if (ignore.includes(one)) continue;
                var now = enemys[one];
                var dx = now.x - x,
                    dy = now.y - y;
                if (!closest) {
                    closest = one;
                    l = dx * dx + dy * dy;
                    continue;
                }
                var d = dx * dx + dy * dy;
                if (d < l) {
                    l = d;
                    closest = one;
                }
            }
            if (l <= range * range) return closest;
            else return null;
        };
        // 获得士兵塔出兵位置
        this.getBarrackBlock = function(x, y) {
            // 检测四周
            var canLoc = [];
            if (core.getBgNumber(x - 1, y) == '300') canLoc.push([x - 1, y]);
            if (core.getBgNumber(x + 1, y) == '300') canLoc.push([x + 1, y]);
            if (core.getBgNumber(x, y - 1) == '300') canLoc.push([x, y - 1]);
            if (core.getBgNumber(x, y + 1) == '300') canLoc.push([x, y + 1]);
            if (canLoc.length == 0) return null;
            // 转换成索引形式
            var route = core.status.thisMap.route;
            canLoc = canLoc.map(function(loc) {
                // 因为是数组 不能用indexOf之类的方法......遍历+core.same
                for (var i in route) {
                    if (core.same(loc, route[i])) return i;
                }
            });
            // 返回索引最大的 因为要在距离基地最近的地方出兵
            canLoc.sort(function(a, b) { return b - a; });
            return canLoc[0];
        };
        // 获得地雷塔可以攻击到的格子
        this.getMineBlock = function(x, y) {
            var route = core.status.thisMap.route;
            var canReach = {};
            for (var nx = x - 1; nx <= x + 1; nx++) {
                if (nx < 0 || nx > 14) continue;
                for (var ny = y - 1; ny <= y + 1; ny++) {
                    if (ny < 0 || ny > 14) continue;
                    for (var i in route) {
                        if (parseInt(i) == route.length) continue;
                        if (core.same(route[i], [nx, ny])) {
                            canReach[i] = true;
                            break;
                        }
                    }
                }
            }
            core.status.realTower[x + ',' + y].canReach = canReach;
        };
        // 获得可以攻击到的格子
        this.getCanReachBlock = function(x, y) {
            var tower = core.status.realTower[x + ',' + y];
            var route = core.status.thisMap.route;
            var canReach = {};
            // 遍历所有格子 检测是否能打到
            route.forEach(function(loc, i) {
                var dx = loc[0] - x,
                    dy = loc[1] - y
                if (dx * dx + dy * dy <= tower.range * tower.range) {
                    canReach[i] = true;
                }
            });
            core.status.realTower[x + ',' + y].canReach = core.clone(canReach);
        };
        // 勇士死亡
        this.heroDie = function(hero) {
            core.returnCanvas(hero);
            delete core.status.enemys.hero[hero];
            core.status.enemys.hero.cnt--;
        };
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
            var enemy = this.getClosestEnemy(x, y);
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
                ctx.interval = 200 / (0.6 / tower.speed);
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
            var enemy = this.getClosestEnemy(x, y);
            if (!enemy) return;
            var id = enemy;
            enemy = core.status.enemys.enemys[enemy];
            // 绘制攻击动画
            if (!main.replayChecking) {
                rotateWeapon(pos, enemy.x - x, enemy.y - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 255 - tower.level / tower.max * 255, 255 - tower.level / tower.max * 255, 0.4]
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
                ctx.interval = 200 / (0.25 / tower.speed);
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
            var atk = tower.atk;
            var enemy = this.getClosestEnemy(x, y);
            if (!enemy) return;
            enemy = core.status.enemys.enemys[enemy];
            var nx = enemy.x,
                ny = enemy.y;
            enemy = this.getEnemyInBombRange(enemy.x, enemy.y, tower.explode);
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
                rotateWeapon(pos, enemy.x - x, enemy.y - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 150 - tower.level / tower.max * 150, 150 - tower.level / tower.max * 150, 0.5];
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, nx * 32 + 16, ny * 32 + 16, color, 2);
                color = [255, 100 - tower.level / tower.max * 100, 100 - tower.level / tower.max * 100, 0.5];
                core.fillCircle(ctx, nx * 32 + 16, ny * 32 + 16, tower.explode * 32, color);
                ctx.interval = 200 / (1 / tower.speed);
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
            var atk = tower.atk;
            var enemy = this.getClosestEnemy(x, y);
            if (!enemy) return;
            enemy = core.status.enemys.enemys[enemy];
            var dx = -(x - enemy.x) * 32,
                dy = -(y - enemy.y) * 32;
            enemy = this.getEnemyInLine(x, y, x + dx * 13, y + dy * 13);
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
                ctx.interval = 200;
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
        // 闪电塔
        this.teslaAttack = function(x, y, tower) {
            x = parseInt(x);
            y = parseInt(y);
            // 打距离基地最近的 并有连锁效果
            var enemy = this.getClosestEnemy(x, y);
            if (!enemy) return;
            var enemys = [enemy];
            var all = core.status.enemys.enemys;
            // 连锁
            var nx = all[enemy].x,
                ny = all[enemy].y;
            for (var t = 1; t < tower.chain; t++) {
                var next = this.getClosestEnemyInRange(nx, ny, 2, enemys);
                if (!next) break;
                nx = all[next].x;
                ny = all[next].y;
                enemys.push(next);
            }
            // 动画效果
            core.playSound('tesla.mp3')
            if (!main.replayChecking) {
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, all[enemys[0]].x * 32 + 16,
                    all[enemys[0]].y * 32 + 16, [255, 255, 255, 0.6], 2);
                ctx.interval = 250 / (0.8 / tower.speed);
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
            var atk = tower.atk;
            var enemy = this.getClosestEnemy(x, y, tower.cnt);
            if (!enemy) return;
            var all = core.status.enemys.enemys;
            var nx = x * 32 + 16,
                ny = y * 32 + 16;
            if (!main.replayChecking) {
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 255 - tower.level / tower.max * 150, 255 - tower.level / tower.max * 150, 0.5];
                ctx.interval = 250 / (0.8 / tower.speed);
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
                    if (!tower.canReach) this.getCanReachBlock(loc.split(',')[0], loc.split(',')[1]);
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
            var loc = this.getBarrackBlock(x, y);
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
            var enemy = this.getClosestEnemy(x, y);
            if (!enemy) return;
            var id = enemy;
            enemy = core.status.enemys.enemys[enemy];
            // 绘制攻击动画
            if (!main.replayChecking) {
                rotateWeapon(pos, enemy.x - x, enemy.y - y);
                var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
                var color = [255, 150 - tower.level / tower.max * 150, 150 - tower.level / tower.max * 150, 0.7];
                core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
                ctx.interval = 300 / (1.5 / tower.speed);
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
                this.getMineBlock(x, y);
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
                    chain[index][0] = Math.max((towers[(x - 1) + ',' + y].rate + towers[(x + 1) + ',' + y].rate) / 2, chain[index][0]);
                    core.drawLine('fg', (x - 1) * 32 + 24, y * 32 + 16, (x + 1) * 32 + 8, y * 32 + 16, [100, 255, 255, 0.6], 4);
                }
                // 上下
                if (isChain(x, y - 1) && isChain(x, y + 1)) {
                    chain[index][1] += (towers[x + ',' + (y - 1)].maxAttack + towers[x + ',' + (y + 1)].maxAttack) / 2;
                    chain[index][0] = Math.max((towers[x + ',' + (y - 1)].rate + towers[x + ',' + (y + 1)].rate) / 2, chain[index][0]);
                    core.drawLine('fg', x * 32 + 16, (y - 1) * 32 + 24, x * 32 + 16, (y + 1) * 32 + 8, [100, 255, 255, 0.6], 4);
                }
                // 左上右下
                if (isChain(x - 1, y - 1) && isChain(x + 1, y + 1)) {
                    chain[index][1] += (towers[(x - 1) + ',' + (y - 1)].maxAttack + towers[(x + 1) + ',' + (y + 1)].maxAttack) / 2;
                    chain[index][0] = Math.max((towers[(x - 1) + ',' + (y - 1)].rate + towers[(x + 1) + ',' + (y + 1)].rate) / 2, chain[index][0]);
                    core.drawLine('fg', (x - 1) * 32 + 24, (y - 1) * 32 + 24, (x + 1) * 32 + 8, (y + 1) * 32 + 8, [100, 255, 255, 0.6], 4);
                }
                // 左下右上
                if (isChain(x + 1, y - 1) && isChain(x - 1, y + 1)) {
                    chain[index][1] += (towers[(x + 1) + ',' + (y - 1)].maxAttack + towers[(x - 1) + ',' + (y + 1)].maxAttack) / 2;
                    chain[index][0] = Math.max((towers[(x + 1) + ',' + (y - 1)].rate + towers[(x + 1) + ',' + (y - 1)].rate) / 2, chain[index][0]);
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
                    if (core.hasSpecial(now.special, 4)) {
                        now.hp -= tower.atk / 2;
                        core.status.totalDamage += tower.atk / 2;
                        core.status.towers[pos].damage += tower.atk / 2;
                    } else {
                        now.hp -= tower.atk;
                        core.status.totalDamage += tower.atk;
                        core.status.towers[pos].damage += tower.atk;
                    }
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
                ctx.interval = 250 / (1.25 / tower.speed);
            }
            core.expLevelUp(x, y);
            core.autoUpdateStatusBar(x, y);
        };
    },
    "others": function() {
        // 其它内容
        ////// 存读档界面时的点击操作 //////
        actions.prototype._clickSL = function(x, y) {
            var page = core.status.event.data.page,
                offset = core.status.event.data.offset;
            var index = page * 10 + offset;

            // 上一页
            if ((x == this.HSIZE - 2 || x == this.HSIZE - 3) && y == this.LAST) {
                core.playSound('光标移动');
                core.ui._drawSLPanel(10 * (page - 1) + offset);
                return;
            }
            // 下一页
            if ((x == this.HSIZE + 2 || x == this.HSIZE + 3) && y == this.LAST) {
                core.playSound('光标移动');
                core.ui._drawSLPanel(10 * (page + 1) + offset);
                return;
            }
            // 返回
            if (x >= this.LAST - 2 && y == this.LAST) {
                core.playSound('取消');
                if (core.events.recoverEvents(core.status.event.interval))
                    return;
                core.ui.closePanel();
                delete core.status.tempRoute;
                if (!core.isPlaying())
                    core.showStartAnimate(true);
                if (core.status.event) {
                    core.status.event.id = null;
                    core.status.event.data = null;
                    core.updateStatusBar();
                }
                return;
            }
            // 删除
            if (x >= 0 && x <= 2 && y == this.LAST) {
                if (core.status.event.id == 'save') {
                    core.status.event.selection = !core.status.event.selection;
                    core.ui._drawSLPanel(index);
                } else { // 显示收藏
                    core.status.event.data.mode = core.status.event.data.mode == 'all' ? 'fav' : 'all';
                    if (core.status.event.data.mode == 'fav')
                        core.ui._drawSLPanel(1, true);
                    else {
                        page = parseInt((core.saves.saveIndex - 1) / 5);
                        offset = core.saves.saveIndex - 5 * page;
                        core.ui._drawSLPanel(10 * page + offset, true);
                    }
                }
                return;
            }
            // 点存档名
            var xLeft = parseInt(this.SIZE / 3),
                xRight = parseInt(this.SIZE * 2 / 3);
            var topY1 = 0,
                topY2 = this.HSIZE;
            if (y >= topY1 && y <= topY1 + 1) {
                if (x >= xLeft && x < xRight) return this._clickSL_favorite(page, 1);
                if (x >= xRight) return this._clickSL_favorite(page, 2);
            }
            if (y >= topY2 && y <= topY2 + 1) {
                if (x < xLeft) return this._clickSL_favorite(page, 3);
                if (x >= xLeft && x < xRight) return this._clickSL_favorite(page, 4);
                if (x >= xRight) return this._clickSL_favorite(page, 5);
            }

            var id = null;
            if (y >= topY1 + 2 && y < this.HSIZE - 1) {
                if (x < xLeft) id = "autoSave";
                if (x >= xLeft && x < xRight) id = 5 * page + 1;
                if (x >= xRight) id = 5 * page + 2;
            }
            if (y >= topY2 + 2 && y < this.SIZE - 1) {
                if (x < xLeft) id = 5 * page + 3;
                if (x >= xLeft && x < xRight) id = 5 * page + 4;
                if (x >= xRight) id = 5 * page + 5;
            }
            if (id != null) {
                if (core.status.event.selection) {
                    if (id == 'autoSave') {
                        core.playSound('操作失败');
                        core.drawTip("无法删除自动存档！");
                    } else {
                        core.removeSave(id, function() {
                            core.ui._drawSLPanel(index, true);
                        });
                    }
                } else {
                    if (core.status.event.data.mode == 'fav' && id != 'autoSave')
                        id = core.saves.favorite[id - 1];
                    core.doSL(id, core.status.event.id);
                }
            }
        };
        ////// 怪物手册界面时，放开某个键的操作 //////
        actions.prototype._keyUpBook = function(keycode) {
            if (keycode == 27 || keycode == 88) {
                core.playSound('取消');
                if (core.events.recoverEvents(core.status.event.interval)) {
                    return;
                } else if (core.status.event.ui != null) {
                    core.status.boxAnimateObjs = [];
                    core.ui._drawViewMaps(core.status.event.ui);
                } else core.ui.closePanel();
                core.status.event.id = null;
                core.status.event.data = null;
                core.updateStatusBar();
                return;
            }
            if (keycode == 13 || keycode == 32 || keycode == 67) {
                var data = core.status.event.data;
                if (data != null) {
                    core.ui._drawBookDetail(data);
                }
                return;
            }
        };
        control.prototype._doSL_save = function(id) {
            if (id == 'autoSave') {
                core.playSound('操作失败');
                return core.drawTip('不能覆盖自动存档！');
            }
            // 在事件中的存档
            if (core.status.event.interval != null)
                core.setFlag("__events__", core.status.event.interval);
            core.setLocalForage("save" + id, core.saveData(), function() {
                core.saves.saveIndex = id;
                core.setLocalStorage('saveIndex', core.saves.saveIndex);
                // 恢复事件
                if (!core.events.recoverEvents(core.status.event.interval))
                    core.ui.closePanel();
                core.playSound('存档');
                core.drawTip('存档成功！');
            }, function(err) {
                main.log(err);
                if (core.platform.useLocalForage) {
                    alert("存档失败，错误信息：\n" + err);
                } else {
                    alert("存档失败，错误信息：\n" + err + "\n建议使用垃圾存档清理工具进行清理！");
                }
            });
            core.removeFlag("__events__");
            core.status.event.id = null;
            core.status.event.data = null;
            setTimeout(core.updateStatusBar, 50);
            return;
        };
        ////// 更新状态栏 //////
        var originUpdateStatusBar = core.control.updateStatusBar;
        control.prototype.updateStatusBar = function(doNotCheckAutoEvents, needToolBar) {
            if (core.isReplaying()) return originUpdateStatusBar.call(core.control, doNotCheckAutoEvents);
            if (!core.isPlaying() || core.hasFlag('__statistics__')) return;
            this.controldata.updateStatusBar();
            if (needToolBar)
                this._updateStatusBar_setToolboxIcon();
        };
        ////// 点击设置按钮时的操作 //////
        events.prototype.openSettings = function(fromUserAction) {
            if (core.isReplaying()) return;
            if (!flags.pause) return core.drawTip('请先暂停游戏');
            if (!this._checkStatus('settings', fromUserAction))
                return;
            core.playSound('打开界面');
            core.ui._drawSettings();
        };
        ////// 点击怪物手册时的打开操作 //////
        events.prototype.openBook = function(fromUserAction) {
            if (core.isReplaying()) return;
            if (!flags.pause) return core.drawTip('请先暂停游戏');
            // 如果能恢复事件（从callBook事件触发）
            if (core.status.event.id == 'book' && core.events.recoverEvents(core.status.event.interval))
                return;
            // 当前是book，且从“浏览地图”打开
            if (core.status.event.id == 'book' && core.status.event.ui) {
                core.status.boxAnimateObjs = [];
                core.ui._drawViewMaps(core.status.event.ui);
                return;
            }
            // 从“浏览地图”页面打开
            if (core.status.event.id == 'viewMaps') {
                fromUserAction = false;
                core.status.event.ui = core.status.event.data;
            }
            if (!this._checkStatus('book', fromUserAction, true)) return;
            core.playSound('打开界面');
            core.useItem('book', true);
        };
        ////// 点击保存按钮时的打开操作 //////
        events.prototype.save = function(fromUserAction) {
            if (core.isReplaying()) return;
            if (!flags.pause) return core.drawTip('请先暂停游戏');
            if (core.hasFlag('__forbidSave__')) {
                core.playSound('操作失败');
                core.drawTip('当前禁止存档');
                return;
            }
            if (typeof core.status.route.slice(-1)[0] == 'number')
                core.status.route[core.status.route.length - 1] = (core.status.route[core.status.route.length - 1]).toString()
            if (core.status.event.id == 'save' && core.events.recoverEvents(core.status.event.interval))
                return;
            if (!this._checkStatus('save', fromUserAction)) return;
            var saveIndex = core.saves.saveIndex;
            var page = parseInt((saveIndex - 1) / 5),
                offset = saveIndex - 5 * page;
            core.playSound('打开界面');
            core.ui._drawSLPanel(10 * page + offset);
        };
        ////// 点击读取按钮时的打开操作 //////
        events.prototype.load = function(fromUserAction) {
            if (core.isReplaying()) return;
            if (core.isPlaying() && !core.hasFlag('pause')) return core.drawTip('请先暂停游戏');
            var saveIndex = core.saves.saveIndex;
            var page = parseInt((saveIndex - 1) / 5),
                offset = saveIndex - 5 * page;
            // 游戏开始前读档
            if (!core.isPlaying()) {
                core.dom.startPanel.style.display = 'none';
                core.clearStatus();
                core.clearMap('all');
                core.status.event = { 'id': 'load', 'data': null };
                core.status.lockControl = true;
                core.playSound('打开界面');
                core.ui._drawSLPanel(10 * page + offset);
                return;
            }
            if (core.status.event.id == 'load' && core.events.recoverEvents(core.status.event.interval))
                return;
            if (!this._checkStatus('load', fromUserAction)) return;
            core.playSound('打开界面');
            core.ui._drawSLPanel(10 * page + offset);
        };
        control.prototype._doSL_load_afterGet = function(id, data) {
            if (!data) return alert("无效的存档");
            var _replay = function() {
                core.startGame(data.hard, data.hero.flags.__seed__, core.decodeRoute(data.route));
            };
            if (data.version != core.firstData.version) {
                core.myconfirm("存档版本不匹配！\n你想回放此存档的录像吗？\n可以随时停止录像播放以继续游戏。", _replay);
                return;
            }
            if (data.hero.flags.__events__ && data.guid != core.getGuid()) {
                core.myconfirm("此存档可能存在风险，你想要播放录像么？", _replay);
                return;
            }
            core.ui.closePanel();
            core.loadData(data, function() {
                core.removeFlag('__fromLoad__');
                if (id != "autoSave") {
                    core.saves.saveIndex = id;
                    core.setLocalStorage('saveIndex', core.saves.saveIndex);
                }
            });
        };
        ui.prototype._drawReplay = function() {
            if (!flags.pause) return core.drawTip('请先暂停游戏');
            core.lockControl();
            core.status.event.id = 'replay';
            core.playSound('打开界面');
            this.drawChoices(null, [
                "从头回放录像", "从存档开始回放", "接续播放剩余录像", "选择录像文件", "下载当前录像", "返回游戏"
            ]);
        };
        ////// 点击状态栏中的楼层传送器/装备栏时 //////
        main.statusBar.image.fly.onclick = function(e) {
            e.stopPropagation();
            // we need do nothing
        };
        ////// 点击状态栏中的工具箱时 //////
        main.statusBar.image.toolbox.onclick = function(e) {
            e.stopPropagation();
            // we need do nothing
        };
        ////// 双击状态栏中的工具箱时 //////
        main.statusBar.image.toolbox.ondblclick = function(e) {
            e.stopPropagation();
            // we need do nothing
        };
        ////// 点击状态栏中的快捷商店时 //////
        main.statusBar.image.shop.onclick = function(e) {
            e.stopPropagation();
            // we need do nothing
        };
        ////// 询问是否需要重新开始 //////
        events.prototype.confirmRestart = function() {
            core.playSound('打开界面');
            core.status.event.selection = 1;
            core.ui.drawConfirmBox("你确定要返回标题页面吗？", function() {
                core.playSound('确定');
                core.ui.closePanel();
                core.unregisterAnimationFrame('startMonster');
                core.unregisterAnimationFrame('forceEnemy');
                core.unregisterAnimationFrame('attack');
                core.unregisterAnimationFrame('deleteEffect');
                core.initDrawEnemys();
                core.restart();
            }, function() {
                core.playSound('取消');
                core.ui.closePanel();
            });
        };
    },
    "book": function() {
        // 怪物手册
        ////// 获得当前楼层的怪物列表 //////
        enemys.prototype.getCurrentEnemys = function(floorId) {
            floorId = floorId || core.status.floorId;
            var enemys = [],
                used = {};
            Object.keys(core.status.enemys.enemys).forEach(function(enemy) {
                this._getCurrentEnemys_addEnemy(enemy, enemys, used, null, null, floorId, enemy);
            }, this);
            return this._getCurrentEnemys_sort(enemys);
        };
        enemys.prototype._getCurrentEnemys_getEnemy = function(enemyId) {
            var enemy = core.status.enemys.enemys[enemyId];
            if (!enemy) return null;
            return enemy;
        };
        enemys.prototype._getCurrentEnemys_addEnemy = function(enemyId, enemys, used, x, y, floorId, enemy) {
            var enemy = this._getCurrentEnemys_getEnemy(enemyId);
            if (enemy == null) return;
            var id = enemy.id;
            var enemyInfo = core.clone(enemy);
            x = null;
            y = null;
            var id = enemy.id + ":" + x + ":" + y;
            if (used[id]) return;
            used[id] = true;
            var specialText = core.enemys.getSpecialText(enemy);
            var specialColor = core.enemys.getSpecialColor(enemy);
            var e = core.clone(enemy);
            for (var v in enemyInfo) {
                if (v == 'hp') continue;
                if (v == 'total') {
                    e.hp = enemyInfo.total;
                    continue;
                }
                if (v == 'speed') {
                    e.speed = core.material.enemys[enemy.id.split('_')[0]].speed;
                    continue;
                }
                e[v] = enemyInfo[v];
            }
            e.name = core.getEnemyValue(enemy.id.split('_')[0], 'name', x, y, floorId);
            e.specialText = specialText;
            e.specialColor = specialColor;
            enemys.push(e);
        };
        enemys.prototype._getCurrentEnemys_sort = function(enemys) {
            return enemys.sort(function(a, b) {
                return a.total - b.total;
            });
        };
        ////// 绘制怪物手册 //////
        ui.prototype.drawBook = function(index) {
            if (flags.error) {
                core.clearUI();
                core.fillRect('ui', 0, 0, 416, 416, '#000');
                var content = '读档出错信息如下，请截图后发送至HTML5魔塔交流群或HTML5造塔技术交流群寻求作者帮助：\n';
                content += flags.error;
                return core.drawTextContent('ui', content, { maxWidth: 416 });
            }
            var floorId = core.floorIds[(core.status.event.ui || {}).index] || core.status.floorId;
            // 清除浏览地图时的光环缓存
            if (floorId != core.status.floorId && core.status.checkBlock) {
                core.status.checkBlock.cache = {};
            }
            var enemys = core.enemys.getCurrentEnemys(floorId);
            core.clearUI();
            core.clearMap('data');
            // 生成groundPattern
            core.maps.generateGroundPattern(floorId);
            this._drawBook_drawBackground();
            core.setAlpha('ui', 1);

            if (enemys.length == 0) {
                return this._drawBook_drawEmpty();
            }

            index = core.clamp(index, 0, enemys.length - 1);
            core.status.event.data = index;
            var pageinfo = this._drawBook_pageinfo();
            var perpage = pageinfo.per_page,
                page = parseInt(index / perpage) + 1,
                totalPage = Math.ceil(enemys.length / perpage);

            var start = (page - 1) * perpage;
            enemys = enemys.slice(start, page * perpage);

            for (var i = 0; i < enemys.length; i++)
                this._drawBook_drawOne(floorId, i, enemys[i], pageinfo, index == start + i);

            core.drawBoxAnimate();
            this.drawPagination(page, totalPage);
            core.setTextAlign('ui', 'center');
            core.fillText('ui', '返回游戏', this.PIXEL - 46, this.PIXEL - 13, '#DDDDDD', this._buildFont(15, true));
        };
        ui.prototype._drawBook_pageinfo = function() {
            var per_page = this.HSIZE; // 每页个数
            var padding_top = 12; // 距离顶端像素
            var per_height = (this.PIXEL - 32 - padding_top) / per_page;
            return { per_page: per_page, padding_top: padding_top, per_height: per_height };
        };
        ui.prototype._drawBook_drawRow2 = function(index, enemy, top, left, width, position) {
            // do nothing
        };
        ui.prototype._drawBook_drawRow3 = function(index, enemy, top, left, width, position) {
            // 绘制第三行
            core.setTextAlign('ui', 'left');
            var b13 = this._buildFont(13, true),
                f13 = this._buildFont(13, false);
            var col1 = left,
                col2 = left + width * 9 / 25,
                col3 = left + width * 17 / 25;
            // 第一列
            core.fillText('ui', '速度', col1, position, '#DDDDDD', f13);
            core.fillText('ui', enemy.speed, col1 + 30, position, null, b13);
            // 第二列
            core.fillText('ui', '金币', col2, position, '#DDDDDD', f13);
            core.fillText('ui', enemy.money, col2 + 30, position, null, b13);
            // 第三列
            core.fillText('ui', '扣血', col3, position, '#DDDDDD', f13);
            core.fillText('ui', core.material.enemys[enemy.id.split('_')[0]].notBomb ? 10 : 1, col3 + 30, position, null, b13);
        };
        ui.prototype._drawBookDetail_getTexts = function(enemy, floorId, texts) {
            // still do nothing
        };
    },
    "replay": function() {
        // 录像相关
        // 注册所有录像操作
        // 放置防御塔
        core.registerReplayAction('placeTower', function(action) {
            if (typeof action != 'string' || !action.includes('place:')) return false;
            // 获得放置信息
            var detail = action.split(':');
            var tower = detail[3];
            var x = detail[1],
                y = detail[2];
            try {
                if (core.status.hero.money < towers[tower].cost) return false;
                core.status.towers[x + ',' + y] = core.clone(towers[tower]);
                var now = core.status.towers[x + ',' + y];
                now.x = x;
                now.y = y;
                now.level = 1;
                now.killed = 0;
                now.damage = 0;
                now.expLevel = 0;
                now.exp = 0;
                now.type = tower;
                now.haveCost = towers[tower].cost;
                if (flags.pause) now.pauseBuild = true;
                core.status.hero.money -= now.cost;
                core.status.event.data = null;
                core.status.event.id = null;
                core.unlockControl();
                core.saveRealStatusInCache(x, y);
                core.plugin.initTowerSprite(now);
                core.getChainLoc();
                core.getFreezeLoc();
                core.replay();
            } catch (e) {
                main.log(e);
                return false;
            }
            return true;
        });
        // 升级防御塔
        core.registerReplayAction('upgradeTower', function(action) {
            if (typeof action != 'string' || !action.includes('upgrade:')) return false;
            var detail = action.split(':');
            var x = detail[1],
                y = detail[2];
            try {
                var success = core.upgradeTower(x, y);
                if (!success) return false;
                core.replay();
            } catch (e) {
                main.log(e);
                return false;
            }
            return true;
        });
        // 卖出防御塔
        core.registerReplayAction('sellTower', function(action) {
            if (typeof action != 'string' || !action.includes('sell:')) return false;
            var detail = action.split(':');
            var x = detail[1],
                y = detail[2];
            try {
                var success = core.sellTower(x, y);
                if (!success) return false;
                core.replay();
            } catch (e) {
                main.log(e);
                return false;
            }
            return true;
        });
        // 提前下一波
        core.registerReplayAction('nextWave', function(action) {
            if (action != 'nextWave') return false;
            try {
                var success = core.startMonster(core.status.floorId);
                if (!success) return false;
                core.replay();
            } catch (e) {
                main.log(e);
                return false;
            }
            return true;
        });
        // 啥都不干
        core.registerReplayAction('wait', function(action) {
            if (!parseInt(action)) return false;
            var rounds = parseInt(action);
            var fail = false;
            var now = 0;
            if (!main.replayChecking) {
                var interval = window.setInterval(function() {
                    now++;
                    try {
                        core.doAnimationFrameInReplay();
                        if (now === rounds + 1) {
                            clearInterval(interval);
                            core.replay();
                        }
                    } catch (e) {
                        main.log(e);
                        clearInterval(interval);
                        fail = true;
                    }
                }, 16.6);
            } else {
                while (true) {
                    now++;
                    try {
                        core.doAnimationFrameInReplay();
                        if (now === rounds + 1) break;
                    } catch (e) {
                        main.log(e);
                        return false;
                    }
                }
                core.replay();
            }
            if (fail) return false;
            else return true;
        });
        ////// 设置requestAnimationFrame //////
        control.prototype._setRequestAnimationFrame = function() {
            this._checkRequestAnimationFrame();
            core.animateFrame.totalTime = Math.max(core.animateFrame.totalTime, core.getLocalStorage('totalTime', 0));
            var loop = function(timestamp) {
                if (core.isReplaying()) return;
                core.control.renderFrameFuncs.forEach(function(b) {
                    if (b.func) {
                        try {
                            if (core.isPlaying() || !b.needPlaying)
                                core.doFunc(b.func, core.control, timestamp);
                        } catch (e) {
                            main.log(e);
                            main.log("ERROR in requestAnimationFrame[" + b.name + "]：已自动注销该项。");
                            core.unregisterAnimationFrame(b.name);
                        }
                    }
                });
                window.requestAnimationFrame(loop);
            }
            window.requestAnimationFrame(loop);
        };
        control.prototype._bindRoutePush = function() {
            return;
        };
        ////// 回放 //////
        control.prototype.replay = function(force) {
            if (core.isReplaying())
                flags.pause = false;
            if (!core.isPlaying() || !core.isReplaying() ||
                core.status.replay.animate || core.status.event.id) return;
            if (core.status.replay.pausing && !force) return;
            this._replay_drawProgress();
            if (core.status.replay.toReplay.length == 0)
                return this._replay_finished();
            this._replay_save();
            var action = core.status.replay.toReplay.shift();
            if (this._doReplayAction(action)) return;
            this._replay_error(action);
        };
        ////// 设置播放速度 //////
        control.prototype.setReplaySpeed = function(speed) {
            return;
        };
        ////// 减速播放 //////
        control.prototype.speedDownReplay = function() {
            return;
        };
        ////// 加速播放 //////
        control.prototype.speedUpReplay = function() {
            return;
        };
        ////// 更改播放状态 不允许暂停 开时候必须一次性播完 //////
        control.prototype.triggerReplay = function() {
            if (core.status.replay.pausing) this.resumeReplay();
        };
        control.prototype._replay_finished = function() {
            core.status.replay.replaying = false;
            core.status.event.selection = 0;
            var str = "录像播放完毕，你想退出播放吗？\n退出后不能继续游戏，需刷新才可以正常游戏";
            if (core.status.route.length != core.status.replay.totalList.length ||
                core.subarray(core.status.route, core.status.replay.totalList) == null) {
                str = "录像播放完毕，但记录不一致。\n请检查录像播放时的二次记录问题。\n你想退出播放吗？\n退出后不能继续游戏，需刷新才可以正常游戏";
            }
            core.ui.drawConfirmBox(str, function() {
                core.ui.closePanel();
                core.stopReplay(true);
            }, function() {
                core.status.replay.replaying = true;
                core.ui.closePanel();
                core.pauseReplay();
            });
        };
        // 录像中每回合执行一次animationFrame
        this.doAnimationFrameInReplay = function() {
            core.control.renderFrameFuncs.forEach(function(b) {
                if (b.func) {
                    try {
                        core.doFunc(b.func, core.control);
                    } catch (e) {
                        main.log(e);
                        flags.error = e;
                        core.drawTip('录像运行出错！错误信息请在控制台或怪物手册查看');
                        core.pauseReplay();
                    }
                }
            });
        };
        // 向录像中push操作
        this.pushActionToRoute = function(action) {
            // 检测当前录像最后一项的类型
            var last = core.status.route[core.status.route.length - 1];
            if (action == 'wait') {
                if (parseInt(last))
                    core.status.route[core.status.route.length - 1] =
                    (parseInt(core.status.route[core.status.route.length - 1]) + 1).toString();
                else core.status.route.push('1');
            } else {
                core.status.route.push(action);
            }
        };
    }
}