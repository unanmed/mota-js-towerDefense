/// <reference path="../runtime.d.ts" />

/* 
towerDefense.js: 负责对游戏中塔防内容相关的处理
包括但不限于 怪物移动 防御塔攻击 录像处理
*/
"use strict";

function defense() {
    this._init();
}

defense.prototype._init = function() {
    this.batchCanvas = {};
    this.batchCanvasLength = {};
    this.batchDict = {};
    this.defensedata = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a.defense;
    core.batchCanvas = this.batchCanvas;
    core.batchCanvasLength = this.batchCanvasLength;
    core.batchDict = this.batchDict;
    // ---- 初始化
    this.initTowers();
    // ---- 注册batchCanvas的resize
    core.control.registerResize('_batchCanvas', this._resize_batchCanvas);
}

////// 初始化防御塔 ////// 
defense.prototype.initTowers = function() {
    this.towers = {
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

    function createIconFromTower(data) {
        var prefix = data[0];
        return {
            base: prefix + '-base.png',
            weapon: prefix + '-weapon.png',
            extra1: prefix + '-extra-1.png',
            weaponUpdate: prefix + '-weapon-' + data[1] + '.png',
            extra2: prefix + '-extra-2.png',
            special: prefix + '-special.png',
        }
    }

    function createIconFromEnemy(data) {
        var prefix = data[0];
        return {
            base: prefix + '.png',
            update: prefix + '-hl.png',
        }
    }
    var towerIconInitData = {
        basic: ["tower-basic", "double"],
        gun: ["tower-minigun", "heavy"],
        bomb: ["tower-cannon", "long"],

        laser: ["tower-laser", "mirrors"],
        tesla: ["tower-tesla", "high-current"],
        scatter: ["tower-multishot", "penetrating"],

        freeze: ["tower-freezing", "twisted"],
        barrack: ["tower-splash", "thin"],
        sniper: ["tower-sniper", "long"],

        mine: ["enemy-type-armored"],
        chain: ["enemy-type-fighter"],
        destory: ["tower-blast", "heavy"],
    }
    this.towerIcons = {};
    for (var name in towerIconInitData) {
        var data = towerIconInitData[name];
        var prefix = data[0];
        if (prefix.startsWith("tower")) {
            this.towerIcons[name] = createIconFromTower(data);
        } else if (prefix.startsWith("enemy")) {
            this.towerIcons[name] = createIconFromEnemy(data);
        }
    }
    this.upgrades = {
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
    this.towerLabel = {
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
    this.towerName = {
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
    this.statusNumber = {
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
    };
}

defense.prototype._resize_batchCanvas = function() {
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
}

////// 防御塔操作 //////
defense.prototype._action_doTower = function(x, y) {
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
}

////// 全局初始化 在读档时调用 //////
defense.prototype.globalInit = function() {
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
}

////// 开始游戏的时候的初始化 在首次进入楼层时异步调用 //////
defense.prototype.initGameStart = function() {
    core.status.towers = {};
    core.status.realTower = {};
    core.status.totalDamage = 0;
    core.status.totalKilled = 0;
    core.unregisterAction('keyDown', '_sys_keyDown');
    core.unregisterAction('onclick', '_sys_onclick');
    core.registerAction('onclick', '_doTower', this._action_doTower, 150);
    core.updateStatusBar(null, true);
}

////// 初始化防御塔攻击效果 //////
defense.prototype.initAttack = function() {
    core.registerAnimationFrame('_attack', true, attack);

    function attack() {
        if (flags.__pause__) return;
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
                    var lastTransform = weaponCanvas.style.transform;
                    var lastDeg = lastTransform ? Number(lastTransform.slice(7, -4)) : 0;
                    if (lastDeg > 180) {
                        lastDeg -= 360;
                    }
                    weaponCanvas.style.transform = "rotate(" + (lastDeg + 5) + "deg)";
                }
            }
        }
    }
}

////// 获取地图路线 //////
defense.prototype.getEnemyRoute = function() {
    var floorId = core.status.floorId;
    if (!floorId) return;
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
}

////// 初始化出怪 ////// 
defense.prototype.initMonster = function(floorId) {
    return this.defensedata.initMonster(floorId);
}

////// 伪随机自动添加怪物 //////
defense.prototype._randomMonster = function(start, number) {
    var id = core.floorIds.indexOf(core.status.floorId);
    var enemys = core.clone(core.material.enemys);
    var all = Object.keys(enemys);
    var length = all.length;
    var pre = ((id * length * 12453) % 12307) ^ 1063289;
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
                    for (var j = Math.abs(((next * 523569)) ^ 5250624) % length; true; j++) {
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
                    for (var j = Math.abs(((next ^ 5236) * 1523569) | 15325) % length; true; j++) {
                        if (j == all.length) j = 0;
                        if (enemys[all[j]].notBomb) {
                            next = j;
                            x = 0;
                            break;
                        }
                    }
                }
                if (enemys[all[next]].notBomb) break;
                next = (((next ^ 713591) + 4135 * start) * number) % length;
                next = Math.abs(~~next);
            }
            // 添加怪物
            var totalHp = 300 * (1 + i * i / 225);
            now.push([all[next], 1]);
            next = (((~(next * 82461) ^ 561290) & 451290) ^ start) ^ (~~totalHp);
            next = Math.abs(~~next);
            next %= length;
        }
    }
    now = core.status.thisMap.enemys.concat(now);
    core.status.thisMap.enemys = core.clone(now);
}

////// 进行下一波出怪 ////// 
defense.prototype.startMonster = function(floorId, start, fromLoad) {
    floorId = floorId || core.status.floorId;
    if (!floorId) return;
    if (start) return this._startMonster_init();
    if (flags.__starting__ && !fromLoad) {
        core.drawTip('当前正在出怪！');
        return false;
    }
    var list = (core.status.thisMap || {}).enemys || core.initMonster(core.status.floorId);
    if (!list) return;
    var startLoc = core.getEnemyRoute()[0];
    var enemy = list[flags.__waves__];
    if (!enemy) {
        core.drawTip('怪物清空了！');
        return false;
    }
    if (Object.keys(core.status.thisMap.enemys).length - flags.__waves__ <= 10)
        this._randomMonster(Object.keys(core.status.thisMap.enemys).length, 10);
    if (!fromLoad) {
        if (!flags.__pause__)
            core.drawTip('开始出怪');
        else core.drawTip('现在处于暂停阶段，取消暂停后将开始出怪');
    }
    // 提前出怪金币奖励
    if (this.forceInterval) {
        if (flags.__waves__ != 0) {
            var forceMoney = core.defense.forceInterval / 1000 * (1 + flags.__waves__ * flags.__waves__ / 2250);
            core.status.hero.money += Math.floor(forceMoney);
        }
        if (!core.isReplaying())
            core.pushActionToRoute('nextWave');
    }
    this._startMonster_doStart(enemy, startLoc);
    return true;
}

defense.prototype._startMonster_init = function() {
    // 开始游戏时的全局初始化
    flags.__waves__ = 0;
    core.status.enemyCnt = 0;
    core.status.score = 0;
    core.initDrawEnemys();
    core.deleteTowerEffect();
    core.getEnemyRoute();
    core.getChainLoc();
    core.getFreezeLoc();
    core.status.enemys = { cnt: 0, enemys: {}, hero: { cnt: 0 }, mine: {} };
    if (!core.defense.forceInterval) {
        this.forceInterval = 5000;
        this.nowInterval = 5;
    }
    // 强制出怪
    core.registerAnimationFrame('_forceEnemy', true, forceEnemy);

    function forceEnemy() {
        var force = core.defense.forceInterval,
            now = core.defense.nowInterval;
        if (flags.__pause__) return;
        core.defense.forceInterval -= 16.67;
        if (force < now * 1000) {
            core.defense.nowInterval--;
            core.updateStatusBar('interval');
        }
        if (force <= 0) {
            delete core.defense.forceInterval;
            delete core.defense.nowInterval;
            core.unregisterAnimationFrame('_forceEnemy');
            core.startMonster(core.status.floorId);
        }
    }
}

defense.prototype._startMonster_doStart = function(enemy, startLoc) {
    core.autosave();
    delete this.forceInterval;
    delete this.nowInterval;
    core.unregisterAnimationFrame('_forceEnemy');
    var first = true;
    var total = enemy[1];
    core.defense.interval = 0;
    // 帧动画
    function animate() {
        flags.__starting__ = true;
        if (flags.__pause__) {
            if (first) {
                first = false;
                core.updateStatusBar();
            }
            return;
        }
        if (!core.status.thisMap) return;
        core.status.enemyCnt++;
        var now = core.material.enemys[enemy[0]];
        core.defense.interval -= 16.67;
        if (core.defense.interval <= 0)
            core.defense._startMonster_addEnemy(enemy, total, now, startLoc);
    }
    core.registerAnimationFrame('_startMonster', true, animate);
}

defense.prototype._startMonster_addEnemy = function(enemy, total, now, startLoc) {
    core.status.thisMap.enemys[flags.__waves__][1]--;
    core.status.enemys.cnt++;
    core.updateStatusBar();
    var wave = flags.__waves__;
    var hp = now.hp * (1 + wave * wave / 225);
    var id = core.getUnitId(enemy[0], core.status.enemys.enemys);
    // 添加怪物
    core.status.enemys.enemys[id] = {
        x: startLoc[0],
        y: startLoc[1],
        id: enemy[0],
        speed: now.speed,
        hp: hp,
        total: hp,
        atk: now.atk * (1 + wave * wave / 900),
        def: now.def * (1 + wave * wave / 900),
        to: 1,
        drown: false,
        money: Math.floor(now.money * (1 + wave * wave / 4900)) * (2 - flags.hard),
        freeze: 1,
        wave: wave,
        special: core.clone(now.special) || []
    };
    if (core.status.thisMap.enemys[wave][1] <= 0) {
        delete core.defense.interval;
        flags.__starting__ = false;
        flags.__waves__++;
        wave = flags.__waves__;
        core.unregisterAnimationFrame('_startMonster');
        // 自动出怪
        if (flags.autoNext) {
            if (!core.defense.forceInterval) {
                if (wave % 10 == 0) {
                    core.defense.forceInterval = 60000;
                    core.defense.nowInterval = 60;
                } else {
                    core.defense.forceInterval = 15000;
                    core.defense.nowInterval = 15;
                }
            }
            core.startMonster(core.status.floorId);
            core.updateStatusBar();
            return;
        }
        // 强制出怪
        core.registerAnimationFrame('_forceEnemy', true, function() {
            if (flags.__pause__) return;
            if (!core.defense.forceInterval) {
                if (wave % 10 == 0) {
                    core.defense.forceInterval = 60000;
                    core.defense.nowInterval = 59;
                } else {
                    core.defense.forceInterval = 15000;
                    core.defense.nowInterval = 14;
                }
            }
            core.defense.forceInterval -= 16.67;
            if (core.defense.forceInterval < core.defense.nowInterval * 1000) {
                core.defense.nowInterval--;
                core.updateStatusBar('interval');
            }
            if (core.defense.forceInterval <= 0) {
                delete core.defense.forceInterval;
                delete core.defense.nowInterval;
                core.unregisterAnimationFrame('_forceEnemy');
                core.startMonster(core.status.floorId);
            }
        });
        core.updateStatusBar();
        return;
    }
    core.defense.interval += (800 / (total > 15 ? (1 + (total - 15) / 10) : 1)) /
        core.material.enemys[enemy[0]].speed * 2;
}

defense.prototype.getUnitId = function(start, parent) {
    var id;
    while (true) {
        id = start + '_' + Math.round(Date.now() * Math.random());
        if (!parent) return null;
        if (!(id in parent)) return id;
    }
}

defense.prototype.enemyDie = function(id) {
    return this.defensedata.enemyDie(id);
}

////// 绘制地图路线 //////
defense.prototype.drawEnemyRoute = function() {
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
}

////// sprite化 画布相关 //////
defense.prototype.acquireCanvas = function(name, type) {
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
    canvas._type = type;
    canvas.canvas.style.display = 'block';
    core.batchDict[name] = canvas;
    return canvas;
}

defense.prototype.returnCanvas = function(name, type) {
    type = type || 'enemy';
    var c = core.getContextByName(name, true);
    core.clearMap(c);
    if (c) {
        if (type === "mine") {
            c.canvas.style.transform = '';
            c.canvas.style.zIndex = 34;
        }
        delete c.canvas._type;
        c.canvas.style.display = 'none';
        core.batchCanvas[type].push(c);
        delete core.batchDict[name];
    }
}

////// 初始化所有画布 //////
defense.prototype.initDrawEnemys = function() {
    if (!main.replayChecking) {
        // 归还所有画布
        for (var one in core.batchDict) {
            var type = core.batchDict[one].canvas._type;
            this.returnCanvas(one, type);
        }
        // 删除画布
        for (var type in core.batchCanvas) {
            core.batchCanvas[type].forEach(function(one) {
                core.dom.gameDraw.removeChild(one.canvas);
            });
            core.batchCanvas[type] = [];
            core.batchCanvasLength[type] = 0;
        }
        // 创建200个画布
        flags.__pause__ = true;
        core.createCanvas('enemy', 0, 0, 32, 34, 35, 200);
        core.createCanvas('tower', 0, 0, 416, 416, 60, 5);
        core.createCanvas('mine', 0, 0, 32, 32, 34, 40);
    }
    core.drawAllEnemys();
    core.initAttack();
}

//////////// 绘制所有怪物 勇士 ////////////

defense.prototype.drawAllEnemys = function(fromLoad) {
    if (fromLoad) this._drawAllEnemys_fromLoad();
    core.registerAnimationFrame('_drawCanvases', true, draw);
    core.registerAnimationFrame('globalAnimate', true, this._drawAllEnemys_drawEnemyAnimation);

    function draw() {
        if (flags.__pause__) return;
        if (!core.status.thisMap) return;
        if (!core.status.enemys) return;
        if (!core.isReplaying())
            core.pushActionToRoute('wait');
        if (!core.status.currTime) core.status.currTime = 0;
        core.status.currTime += 16.67;
        var enemys = core.status.enemys.enemys;
        var route = core.status.thisMap.route;
        if (!route) core.getEnemyRoute();
        Object.keys(enemys).forEach(function(one) {
            core.defense._drawAllEnemys_drawEnemy(enemys, one, route);
        });
        core.defense._drawAllEnemys_drawHero();
    }
}

defense.prototype._drawAllEnemys_drawEnemyAnimation = function(timestamp) {
    if (main.replayChecking) return;
    if (!core.status.thisMap) return;
    // 传入-1时强制进行绘制
    if (timestamp !== -1) {
        if (timestamp - core.animateFrame.globalTime <= core.values.animateSpeed) return;
    }
    core.status.globalAnimateStatus++;
    if (core.status.floorId) {
        // 暂停时不进行怪物绘制，除非强制
        if (!flags.__pause__ || timestamp === -1) {
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
}

defense.prototype._drawAllEnemys_fromLoad = function() {
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
        core.initTowerSprite(tower);
    }
    this._drawAllEnemys_drawEnemyAnimation(-1);
}

defense.prototype._drawAllEnemys_drawEnemy = function(enemys, one, route) {
    var enemy = enemys[one];
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
        // ---- 到达基地
        if (enemy.to == route.length - 1) {
            var reach = core.defense._drawAllEnemys_reachBase(enemys, enemy, one);
            if (reach) return;
        }
        // ---- 踩到地雷
        var mine = core.status.thisMap.mine || {};
        if (enemy.to in mine) {
            core.defense._drawAllEnemys_reachMine(enemys, enemy, one, mine);
        }
        // ---- 踩到夹击
        var chain = core.status.thisMap.chain;
        if (chain && chain[enemy.to]) {
            core.defense._drawAllEnemys_reachChain(enemys, enemy, one, chain);
        }
        enemy.to++;
        // ---- 冰冻检测
        if (!core.hasSpecial(enemy.special, 2)) {
            core.defense._drawAllEnemys_doFreeze(enemys, enemy, one);
        }
        // ---- 与勇士战斗
        core.defense._drawAllEnemys_battle(enemys, enemy, one);
    }
    // ---- 二次战斗判定
    if (enemy.speed <= 3 && Math.abs(core.status.currTime % 150) < 20) {
        core.defense._drawAllEnemys_battle(enemys, enemy, one);
    }
}

defense.prototype._drawAllEnemys_reachBase = function(enemys, enemy, one) {
    core.status.hero.hp--;
    if (core.material.enemys[one.split('_')[0]].notBomb)
        core.status.hero.hp -= 9;
    if (core.status.hero.hp <= 0) {
        if (!core.isReplaying()) {
            flags.__pause__ = true;
            core.status.route[core.status.route.length - 1] =
                (parseInt(core.status.route[core.status.route.length - 1]) + 1000).toString();
        }
        core.status.hero.hp = core.status.score;
        core.win('第' + (core.floorIds.indexOf(core.status.floorId) + 1) + '关结束  v0.1版');
        core.unregisterAnimationFrame('_drawCanvases');
        core.unregisterAnimationFrame('_startMonster');
        core.unregisterAnimationFrame('_forceEnemy');
        core.unregisterAnimationFrame('_attack');
        core.unregisterAnimationFrame('_deleteEffect');
        core.unregisterAction('onclick', '_confirm');
        core.unregisterAction('onclick', '_doTower');
        core.initDrawEnemys();
        core.updateStatusBar();
        return;
    }
    delete enemys[one];
    // 归还画布
    core.returnCanvas(one);
    return true;
}

defense.prototype._drawAllEnemys_reachMine = function(enemys, enemy, one, mine) {
    var played = false;
    for (var i = mine[enemy.to].cnt; i > 0; i--) {
        if (!mine[enemy.to][i]) continue;
        if (!played)
            core.playSound('bomb.mp3');
        played = true;
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
    core.defense._drawMine(enemy.to)
}

defense.prototype._drawAllEnemys_reachChain = function(enemys, enemy, one, chain) {
    if (chain[enemy.to][0] > 0) {
        // 扣血
        core.playSound('laser.mp3');
        var damage = Math.min(chain[enemy.to][1], enemy.total * chain[enemy.to][0] / 100)
        enemy.hp -= damage;
        core.status.totalDamage += damage;
        if (enemy.hp <= 0) {
            core.enemyDie(one);
            return;
        }
        core.drawHealthBar(one);
    }
}

defense.prototype._drawAllEnemys_doFreeze = function(enemys, enemy, one) {
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

defense.prototype._drawAllEnemys_battle = function(enemys, enemy, one) {
    if (!core.status.enemys.hero) return
    for (var id in core.status.enemys.hero) {
        var hero = core.status.enemys.hero[id];
        var dx = hero.x - enemy.x;
        var dy = hero.y - enemy.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            var win = core.doBatle(enemy, hero);
            if (win) return;
        }
    }
}

defense.prototype._drawAllEnemys_drawHero = function() {
    var heroes = core.status.enemys.heroes || {};
    for (var id in heroes) {
        if (id == 'cnt') continue;
        var hero = heroes[id];
        if (!main.replayChecking)
            var ctx = core.acquireCanvas(id);
        // 位置移动
        var dx = route[hero.to][0] - route[hero.to + 1][0],
            dy = route[hero.to][1] - route[hero.to + 1][1];
        var speedX = dx * hero.speed / 60,
            speedY = dy * hero.speed / 60;
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
        if ((dx * (dx + speedX) <= 0 && dy == 0) || (dy * (dy + speedY) <= 0 && dx == 0) ||
            (dx * (dx - speedX) <= 0 && dy == 0) || (dy * (dy - speedY) <= 0 && dx == 0)) {
            // 达到出怪点
            if (hero.to == 0) {
                core.heroDie(id);
            }
            hero.x = route[hero.to][0];
            hero.y = route[hero.to][1];
            hero.to--;
        }
    }
}

////// 怪物和勇士战斗 //////
defense.prototype.doBattle = function(enemy, hero) {
    // 默认勇士战胜 
    if (!(enemy instanceof Object)) enemy = core.status.enemys.enemys[enemy];
    if (!(hero instanceof Object)) hero = core.status.enemys.hero[hero];
    if (!enemy) return null;
    if (!hero) return null;
    if (typeof enemy.special == 'number') enemy.special = [enemy.special];
    var special = core.clone(enemy.special);
    special.push(5);
    core.playSound('battle.mp3');
    // 执行战斗
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
        return false;
    }
    // 勇士胜
    core.enemyDie(one);
    hero.hp -= damageInfo.damage;
    core.status.totalDamage += parseInt(enemy.hp);
    core.drawHealthBar(id);
    return true;
}

defense.prototype._drawMine = function(loc) {
    if (main.replayChecking) return;
    var mine = core.status.thisMap.mine || {};
    if (!loc) {
        for (var i in mine) {
            core.defense._drawMine(i);
        }
        return;
    }
    if (mine[loc].cnt) {
        var ctx = core.acquireCanvas('mine_' + loc, 'mine');
        core.clearMap(ctx);
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        for (var j = 0; j < mine[enemy.to].cnt; j++) {
            if (!mine[loc][j + 1]) continue;
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

defense.prototype.drawHealthBar = function(enemy) {
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
            enemy = core.status.enemys.hero[one];
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

////// 放置防御塔 //////
defense.prototype.placeTower = function(x, y) {
    if (core.getBgNumber(x, y) != 311) {
        core.drawTip('请选择正确的放塔位置！');
        core.status.event.id = null;
        core.status.event.data = null;
        core.unlockControl();
        core.updateStatusBar();
        return true;
    }
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
    core.drawRange(x, y, this.towers[tower].range || 0, this.towers[tower].square || false);
    core.status.event.id = 'placeTower-confirm';
    var nx = x,
        ny = y;
    core.registerAction('onclick', '_confirm', confirm, 200);

    function confirm(x, y) {
        core.clearMap('damage');
        // 放置防御塔
        if (x == nx && y == ny) {
            if (core.defense.towers[tower].cost > core.status.hero.money) {
                core.status.event.id = null;
                core.status.event.data = null;
                core.drawTip('金钱不足！');
                core.unlockControl();
                core.unregisterAction('onclick', '_confirm');
                core.getChainLoc();
                core.getFreezeLoc();
                core.updateStatusBar();
                return true;
            }
            core.defense._addTower(x, y, tower);
            if (!core.isReplaying())
                core.pushActionToRoute('place:' + x + ':' + y + ':' + tower);
            core.updateStatusBar();
            return true;
        }
        core.placeTower(x, y);
        core.status.event.id = null;
        core.updateStatusBar();
        core.unregisterAction('onclick', '_confirm');
        return true;
    }
}

////// 添加防御塔 //////
defense.prototype._addTower = function(x, y, tower) {
    if (core.status.hero.money < core.defense.towers[tower].cost) {
        if (!core.isReplaying)
            console.error('金钱不足却执行了添加防御塔！');
        return false;
    }
    core.status.towers[x + ',' + y] = core.clone(core.defense.towers[tower]);
    var now = core.status.towers[x + ',' + y];
    now.x = x;
    now.y = y;
    now.level = 1;
    now.killed = 0;
    now.damage = 0;
    now.expLevel = 0;
    now.exp = 0;
    now.type = tower;
    now.haveCost = this.towers[tower].cost;
    if (flags.__pause__) now.pauseBuild = true;
    core.status.hero.money -= now.cost;
    core.status.event.data = null;
    core.status.event.id = null;
    core.unlockControl();
    core.drawTip('成功放置防御塔！');
    core.unregisterAction('onclick', '_confirm');
    core.saveRealStatusInCache(x, y);
    core.initTowerSprite(now);
    core.getChainLoc();
    core.getFreezeLoc();
    return true;
}

////// 升级防御塔 ////// 
defense.prototype.upgradeTower = function(x, y) {
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
    this.updateTowerSprite(now);
    core.drawRange(x, y, core.status.realTower[x + ',' + y].range || 0, core.status.realTower[x + ',' + y].square);
    core.drawTip('升级成功！');
    if (!core.isReplaying())
        core.pushActionToRoute('upgrade:' + x + ':' + y);
    return true;
}

////// 经验升级 //////
defense.prototype.expLevelUp = function(x, y) {
    var tower = core.status.towers[x + ',' + y];
    if (!tower) return console.error('不存在防御塔！');
    var exp = tower.exp;
    var need = this.expLevelUpNeed(tower.expLevel)
    if (exp >= need) {
        tower.expLevel++;
        tower.exp -= need;
        this.saveRealStatusInCache(x, y);
        var id = core.status.event.id;
        core.drawAnimate("update", x, y);
        if (core.status.event.data == x + ',' + y && (id == 'checkEnemy' || id.startsWith('confirm'))) {
            core.updateStatusBar();
            core.drawRange(x, y, core.status.realTower[x + ',' + y].range || 0, core.status.realTower[x + ',' + y].square);
        }
    }
    if (tower.type == 'freeze')
        core.getFreezeLoc();
    if (tower.type == 'chain')
        core.getChainLoc();
}

////// 卖出防御塔 //////
defense.prototype.sellTower = function(x, y) {
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
    var towerIcon = this.towerIcons[tower.type];
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
}

defense.prototype.expLevelUpNeed = function(level) {
    level++;
    return level * level * 25;
}

////// 自动更新状态栏 //////
defense.prototype.autoUpdateStatusBar = function(x, y) {
    var id = core.status.event.id;
    if (!id) return;
    if (core.status.event.data == x + ',' + y && (id == 'checkTower' || id.startsWith('confirm'))) {
        core.updateStatusBar();
    }
}

//////////// 防御塔sprite化相关 ////////////

////// 初始化防御塔sprite //////
defense.prototype.initTowerSprite = function(tower) {
    if (main.replayChecking) return;
    var x = tower.x,
        y = tower.y;
    var pos = x + ',' + y;
    var icon = this.towerIcons[tower.type];
    // 震荡塔不需要新建canvas
    if (!core.batchDict['tower-base_' + pos]) {
        var basectx = core.acquireCanvas('tower-base_' + pos, 'mine');
        core.relocateCanvas(basectx, x * 32, y * 32);
        core.drawImage(basectx, icon.base, 6, 6, 84, 84, 0, 0, 32, 32);
    }
    if (icon.weapon) {
        if (!core.batchDict['tower-weapon_' + pos]) {
            var weaponctx = core.acquireCanvas('tower-weapon_' + pos, 'mine');
            weaponctx.canvas.style.zIndex = 60;
            core.relocateCanvas(weaponctx, x * 32, y * 32);
            core.drawImage(weaponctx, icon.weapon, 6, 6, 84, 84, 0, 0, 32, 32);
        } else {
            core.batchDict['tower-weapon_' + pos].canvas.style.transform = "";
        }
    }
    this.updateTowerSprite(tower);
}

////// 更新防御塔sprite //////
defense.prototype.updateTowerSprite = function(tower) {
    var eps = 1e-9;
    if (main.replayChecking) return;
    var pos = tower.x + ',' + tower.y;
    var icon = this.towerIcons[tower.type];
    var basectx = core.batchDict['tower-base_' + pos];
    core.clearMap(basectx);
    core.drawImage(basectx, icon.base, 6, 6, 84, 84, 0, 0, 32, 32);
    if (icon.extra1) {
        if (tower.level >= Math.ceil(tower.max * 0.25) - eps) {
            core.drawImage(basectx, icon.extra1, 6, 6, 84, 84, 0, 0, 32, 32);
        }
        if (tower.level >= Math.ceil(tower.max * 0.75) - eps) {
            core.drawImage(basectx, icon.extra2, 6, 6, 84, 84, 0, 0, 32, 32);
        }
        if (tower.level >= Math.ceil(tower.max * 1) - eps) {
            core.drawImage(basectx, icon.special, 6, 6, 84, 84, 0, 0, 32, 32);
        }
    } else if (icon.update) {
        if (tower.level >= Math.ceil(tower.max * 0.5) - eps) {
            core.drawImage(basectx, icon.update, 6, 6, 84, 84, 0, 0, 32, 32);
        }
    }
    if (icon.weapon) {
        var weaponctx = core.batchDict['tower-weapon_' + pos];
        core.clearMap(weaponctx);
        if (tower.level >= Math.ceil(tower.max * 0.5) - eps) {
            core.drawImage(weaponctx, icon.weaponUpdate, 6, 6, 84, 84, 0, 0, 32, 32);
        } else {
            core.drawImage(weaponctx, icon.weapon, 6, 6, 84, 84, 0, 0, 32, 32);
        }
    }
}

////// 绘制防御塔范围 //////
defense.prototype.drawRange = function(x, y, range, square) {
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
}

////// 绘制防御塔详细信息 //////
defense.prototype.drawTowerDetail = function(ctx, loc) {
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
        var tower = this.towers[type];
    }
    var toDraw = this._drawTowerDetail_getContent(tower, type);
    if (!core.domStyle.isVertical) {
        this._drawTowerDetail_drawHorizon(toDraw, tower, type, loc, ori, ctx);
    } else {
        this._drawTowerDetail_drawVertical(toDraw, tower, type, loc, ori, ctx);
    }
}

defense.prototype._drawTowerDetail_getContent = function(tower, type) {
    var toDraw = [];
    // 获得绘制内容
    for (var one in tower) {
        if (one == 'type' || one == 'level' || one == 'exp' || one == 'damage' ||
            one == 'killed' || one == 'expLevel' || one == 'square' ||
            (one == 'cost' && tower.level) || one == 'attackInterval') continue;
        if (type == 'freeze' || type == 'chain') {
            if (one == 'rate')
                var name = this.towerLabel[one](type);
            else if (one == 'cost') {
                var name = this.towerLabel[one](tower.level || 0);
            } else
                var name = this.towerLabel[one]
        } else {
            // 单独处理项
            if (one == 'cost') {
                var name = this.towerLabel[one](tower.level || 0);
            } else if (one == 'speed') {
                var name = this.towerLabel[one](one);
            } else {
                var name = this.towerLabel[one];
            }
        }
        if (one == 'hero' || one == 'mine') { // hero 和 mine 单独处理 因为有子项目
            var s = { name: this.towerLabel[one], value: [], number: this.statusNumber[one] };
            for (var child in tower[one]) {
                if (child == 'speed') {
                    var n = this.towerLabel[child](one);
                } else {
                    var n = this.towerLabel[child];
                }
                s.value.push({ name: n, value: tower[one][child], number: this.statusNumber[child] });
            }
            toDraw.push(s);
            continue;
        }
        toDraw.push({ name: name, value: tower[one], number: this.statusNumber[one] });
    }
    toDraw.sort(function(a, b) { return a.number - b.number });
    return toDraw;
}

defense.prototype._drawTowerDetail_drawHorizon = function(toDraw, tower, type, loc, ori, ctx) {
    // 名称和图标单独绘制
    core.setTextAlign(ctx, 'center');
    var name = this.towerName[type];
    core.fillText(ctx, name, 64, 90, '#fff', '20px Arial');
    core.setTextAlign(ctx, 'left');
    // 详细信息
    var y = 150;
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
}

defense.prototype._drawTowerDetail_drawVertical = function(toDraw, tower, type, loc, ori, ctx) {
    // 名称和图标单独绘制
    core.setTextAlign(ctx, 'center');
    var name = this.towerName[type];
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

////// 绘制建造界面 //////
defense.prototype.drawConstructor = function(ctx, type) {
    if (main.replayChecking) return;
    if (!core.domStyle.isVertical) this._drawConstructor_drawHorizon(ctx, type);
    else this._drawConstructor_drawVertical(ctx, type);
}

defense.prototype._drawConstructor_drawHorizon = function(ctx, type) {
    if (!type || type == 'statistics') {
        // 绘制当前总伤害 总击杀数
        core.fillText(ctx, '伤害量：' + core.formatBigNumber(core.status.totalDamage || 0), 5, 90, '#fcc', '14px Arial');
        core.fillText(ctx, '杀敌数：' + core.status.totalKilled, 5, 110, '#fcc', '14px Arial');
        // 之后的几波怪物
        var allEnemy = ((core.status.thisMap || {}).enemys) || core.initMonster(core.status.floorId);
        if (!allEnemy) return;
        var wave = flags.__waves__ || 0;
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
        if (!flags.__starting__)
            core.fillRect(ctx, 10, 275, 59, 25, [100, 255, 100, 1]);
        else
            core.fillRect(ctx, 10, 275, 59, 25, [100, 100, 100, 1]);
        core.setTextAlign(ctx, 'center');
        core.fillText(ctx, ((core.defense.forceInterval && core.defense.forceInterval > 0) ?
            (Math.floor(core.defense.forceInterval / 1000) + 's') : '下一波'), 40, 292, '#000', '14px Arial');
        // 自动
        core.fillRect(ctx, 74, 275, 50, 25, [255, 255, 100, 1]);
        core.fillText(ctx, '自动' + (flags.autoNext ? '中' : ''), 99, 292, '#000', '14px Arial');
    }
    if (!type) {
        // 各个防御塔
        Object.keys(core.defense.towers).forEach(function(one, i) {
            var line = Math.floor(i / 3);
            var list = i % 3;
            core.drawIcon(ctx, one, 9 + 37 * list, 305 + 37 * line, 32, 32);
        });
    }
}

defense.prototype._drawConstructor_drawVertical = function(ctx, type) {
    // 之后的几波怪物
    var allEnemy = ((core.status.thisMap || {}).enemys) || core.initMonster(core.status.floorId);
    if (!allEnemy) return;
    var wave = flags.__waves__ || 0;
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
    if (!flags.__starting__)
        core.fillRect(ctx, 120, 135, 60, 25, [100, 255, 100, 1]);
    else
        core.fillRect(ctx, 120, 135, 60, 25, [100, 100, 100, 1]);
    core.setTextAlign(ctx, 'center');
    core.fillText(ctx, ((core.defense.forceInterval && core.defense.forceInterval > 0) ?
        (Math.floor(core.defense.forceInterval / 1000) + 's') : '下一波'), 150, 153, '#000', '14px Arial');
    // 自动
    core.fillRect(ctx, 185, 135, 50, 25, [255, 255, 100, 1]);
    core.fillText(ctx, '自动' + (flags.autoNext ? '中' : ''), 210, 153, '#000', '14px Arial');
    // 各个防御塔
    Object.keys(core.defense.towers).forEach(function(one, i) {
        var line = Math.floor(i / 4);
        var list = i % 4;
        core.drawIcon(ctx, one, 260 + 37 * list, 30 + 37 * line, 32, 32);
    });
    // 暂停按钮
    core.fillRect(ctx, 288, 140, 90, 25, [100, 255, 100, 1]);
    core.fillText(ctx, flags.__pause__ ? '继续' : '暂停', 333, 158, '#000', '14px Arial');
}

////// 防御塔攻击特效 //////
defense.prototype.setTowerEffect = function(ctx, speed) {
    ctx.totalTime = ctx.interval = 12 / speed;
    ctx.canvas.style.opacity = 1;
}