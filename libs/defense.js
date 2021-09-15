/// <reference path="../runtime.d.ts" />

/* 
defense.js: 负责对游戏中塔防内容相关的处理
包括但不限于 怪物移动 防御塔攻击 录像处理
*/
'use strict';

function defense () {
    this._init();
}

defense.prototype._init = function () {
    this.batchCanvas = {};
    this.batchCanvasLength = {};
    this.batchDict = {};
    this.mapIndex = 0;
    this.speed = 1;
    this.floorId = '';
    this.type = 'battle';
    this.bossList = [];
    this.enemyCnt = [];
    this.defensedata = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a.defense;
    core.batchCanvas = this.batchCanvas;
    core.batchCanvasLength = this.batchCanvasLength;
    core.batchDict = this.batchDict;
    // ---- 初始化
    this.initTowers();
    // ---- 注册batchCanvas的resize
    core.control.registerResize('_batchCanvas', this._resize_batchCanvas);
    // ---- 注册录像操作
    core.control.registerReplayAction('placeTower', this._replay_placeTower);
    core.control.registerReplayAction('upgradeTower', this._replay_upgradeTower);
    core.control.registerReplayAction('sellTower', this._replay_sellTower);
    core.control.registerReplayAction('nextWave', this._replay_nextWave);
    core.control.registerReplayAction('wait', this._replay_wait);
};

////// 初始化防御塔 //////
defense.prototype.initTowers = function () {
    this.towers = {
        basic: { atk: 6, cost: 30, speed: 0.6, range: 2, max: 20 },
        gun: { atk: 4, cost: 100, speed: 0.17, range: 3, max: 20 },
        bomb: { atk: 10, cost: 100, speed: 1.2, range: 3, explode: 0.75, max: 20 },
        laser: { atk: 10, cost: 100, range: 3, speed: 1.25, max: 20 },
        tesla: { atk: 6, cost: 130, speed: 1.25, range: 3, chain: 3, max: 20 },
        scatter: { atk: 7, cost: 140, speed: 1, range: 3, cnt: 6, max: 20 },
        freeze: { rate: 30, cost: 100, range: 2, max: 7 },
        barrack: { hero: { hp: 50, atk: 15, def: 0, speed: 2 }, speed: 5, cost: 125, max: 40 },
        sniper: { atk: 30, cost: 100, speed: 1.5, range: 4, max: 20 },
        mine: { mine: { atk: 50 }, speed: 2, square: true, cost: 120, max: 30 },
        chain: { rate: 10, cost: 180, max: 20, maxAttack: 100 },
        destory: { atk: 40, cost: 250, range: 2, speed: 1.5, max: 20 }
    };

    function createIconFromTower (data) {
        var prefix = data[0];
        return {
            base: prefix + '-base.png',
            weapon: prefix + '-weapon.png',
            extra1: prefix + '-extra-1.png',
            weaponUpdate: prefix + '-weapon-' + data[1] + '.png',
            extra2: prefix + '-extra-2.png',
            special: prefix + '-special.png'
        };
    }

    function createIconFromEnemy (data) {
        var prefix = data[0];
        return {
            base: prefix + '.png',
            update: prefix + '-hl.png'
        };
    }
    var towerIconInitData = {
        basic: ['tower-basic', 'double'],
        gun: ['tower-minigun', 'heavy'],
        bomb: ['tower-cannon', 'long'],

        laser: ['tower-laser', 'mirrors'],
        tesla: ['tower-tesla', 'high-current'],
        scatter: ['tower-multishot', 'penetrating'],

        freeze: ['tower-freezing', 'twisted'],
        barrack: ['tower-splash', 'thin'],
        sniper: ['tower-sniper', 'long'],

        mine: ['enemy-type-armored'],
        chain: ['enemy-type-fighter'],
        destory: ['tower-blast', 'heavy']
    };
    this.towerIcons = {};
    for (var name in towerIconInitData) {
        var data = towerIconInitData[name];
        var prefix = data[0];
        if (prefix.startsWith('tower')) {
            this.towerIcons[name] = createIconFromTower(data);
        } else if (prefix.startsWith('enemy')) {
            this.towerIcons[name] = createIconFromEnemy(data);
        }
    }
    this.upgrades = {
        basic: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.05;
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        gun: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.06;
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        bomb: function (level, name) {
            if (name == 'explode') return 1 + (level - 1) * 0.02;
            if (name == 'speed') return 1 + (level - 1) * 0.05;
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        laser: function (level, name) {
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'speed') return 1 + (level - 1) * 0.07;
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        tesla: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.04;
            if (name == 'chain') return 3 + Math.floor((level - 1) / 5);
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        scatter: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.05;
            if (name == 'cnt') {
                if (level < 13) return 6 + Math.floor((level - 1) / 4);
                else return 9;
            }
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        freeze: function (level, name) {
            if (name == 'rate') return 30 + (level - 1) * 5;
            if (name == 'range') {
                if (level <= 10) return 1 + (level - 1) * 0.05;
                else return 1.5;
            }
            if (name == 'cost') return Math.pow(2, level);
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        barrack: function (level, name, father) {
            if (name == 'speed') {
                if (father == 'hero') return 1;
                return 1 + 0.05 * level;
            }
            if (name == 'cost') return 1 + (level * level) / 20;
            return 1 + level;
        },
        sniper: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.05;
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        mine: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.04;
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        },
        chain: function (level, name) {
            if (name == 'cost') return 1 + (level * level) / 15;
            if (name == 'rate') return 10;
            return 1 + (level - 1) * (level - 1) * 0.03;
        },
        destory: function (level, name) {
            if (name == 'speed') return 1 + (level - 1) * 0.05;
            if (name == 'range') {
                if (level <= 20) return 1 + (level - 1) * 0.05;
                else return 2;
            }
            if (name == 'cost') return 1 + (level * level) / 15;
            return 1 + (level - 1) * (level - 1) * 0.05;
        }
    };
    this.towerLabel = {
        atk: '攻击',
        speed: function (father) {
            return father == 'hero' ? '移速' : '攻速';
        },
        cost: function (level) {
            return level == 0 ? '建造花费' : '升级花费';
        },
        range: '范围',
        max: '最大等级',
        explode: '爆炸范围',
        chain: '链接数量',
        cnt: '子弹个数',
        def: '防御',
        hp: '生命',
        rate: function (type) {
            return type == 'freeze' ? '减速比率' : '夹击比率';
        },
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
};

defense.prototype._resize_batchCanvas = function () {
    for (var type in core.batchCanvas) {
        for (var name in core.batchCanvas[type]) {
            var ctx = core.batchCanvas[type][name],
                canvas = ctx.canvas;
            var ratio = canvas.hasAttribute('isHD') ? core.domStyle.ratio : 1;
            canvas.style.width = (canvas.width / ratio) * core.domStyle.scale + 'px';
            canvas.style.height = (canvas.height / ratio) * core.domStyle.scale + 'px';
            canvas.style.left = parseFloat(canvas.getAttribute('_left')) * core.domStyle.scale + 'px';
            canvas.style.top = parseFloat(canvas.getAttribute('_top')) * core.domStyle.scale + 'px';
        }
    }
    for (var name in core.batchDict) {
        var ctx = core.batchDict[name],
            canvas = ctx.canvas;
        var ratio = canvas.hasAttribute('isHD') ? core.domStyle.ratio : 1;
        canvas.style.width = (canvas.width / ratio) * core.domStyle.scale + 'px';
        canvas.style.height = (canvas.height / ratio) * core.domStyle.scale + 'px';
        canvas.style.left = parseFloat(canvas.getAttribute('_left')) * core.domStyle.scale + 'px';
        canvas.style.top = parseFloat(canvas.getAttribute('_top')) * core.domStyle.scale + 'px';
    }
};

////// 防御塔操作 //////
defense.prototype._action_doTower = function (x, y) {
    // 检查目标方块是否空闲
    if (!core.status) return false;
    if (!core.status.towers) return false;
    // 查看详细信息时
    var fromCheck = false;
    var id = core.status.event.id
    if (typeof core.status.event.data == 'string' && core.status.event.data.split(',').length == 2) {
        if (id && (id == 'checkTower' || id.startsWith('confirm'))) {
            var loc = core.status.event.data;
            var nloc = loc.split(',');
            if (!(x == nloc[0] && y == nloc[1])) {
                core.status.event.id = null;
                core.status.event.data = null;
                flags.upgrade = false;
                flags.sell = false;
                flags.maxUp = false;
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
        if (typeof core.status.event.data == 'string' && core.status.event.data.split(',').length == 2) return true;
        core.status.event.id = 'placeTower';
        core.placeTower(x, y);
        return true;
    }
};

////// 全局初始化 在读档时调用 //////
defense.prototype.globalInit = function (fromLoad) {
    // 初始化怪物路线
    core.getEnemyRoute();
    // 初始化画布等
    core.initDrawEnemys();
    core.drawAllEnemys(fromLoad);
    if (core.status.enemys.enemys) core.drawHealthBar();
    core.deleteTowerEffect();
    // 初始化防御塔相关
    core.initAttack();
    core.getChainLoc();
    core.getFreezeLoc();
    core.updateStatusBar(null, true);
    core.unregisterAction('keyDown', '_sys_keyDown');
    core.unregisterAction('onclick', '_sys_onclick');
    core.registerAction('onclick', '_doTower', this._action_doTower, 150);
    core.registerAction('keyDown', 'pause', this._action_pause_keyDown, 1000);
};

////// 开始游戏的时候的初始化 在首次进入楼层时调用 //////
defense.prototype.initGameStart = function () {
    core.status.towers = {};
    core.status.realTower = {};
    core.status.totalDamage = 0;
    core.status.totalKilled = 0;
    flags.__starting__ = false;
    core.unregisterAction('keyDown', '_sys_keyDown');
    core.unregisterAction('onclick', '_sys_onclick');
    core.registerAction('onclick', '_doTower', this._action_doTower, 150);
    core.registerAction('keyDown', 'pause', this._action_pause_keyDown, 1000);
    core.updateStatusBar(null, true);
};

defense.prototype._action_pause_keyDown = function (keycode) {
    var id = core.status.event.id;
    if (id && id != 'checkTower' && id != 'enemyDetail' && !id.endsWith('confirm') &&
        !id.startsWith('confirm') && id != 'placeTower') return false;
    if (keycode == 32) {
        core.pauseGame();
        return true;
    }
};

////// 保存defense相关内容//////
defense.prototype.saveDefense = function () {
    var toSave = {};
    // 1.保存防御塔
    toSave.towers = core.clone(core.status.towers);
    toSave.realTower = core.clone(core.status.realTower);
    // 2.保存当前怪物列表
    toSave.enemys = core.clone(core.status.enemys);
    toSave.enemyList = core.clone(core.status.thisMap.enemys);
    // 3.保存当前统计信息
    toSave.score = core.status.score;
    toSave.damage = core.status.totalDamage;
    toSave.killed = core.status.totalKilled;
    toSave.currTime = core.status.currTime;
    toSave.nowInterval = this.nowInterval;
    toSave.forceInterval = this.forceInterval;
    toSave.interval = this.interval;
    toSave.enemyCnt = core.clone(this.enemyCnt);
    return toSave;
};

////// 读取defense相关内容 //////
defense.prototype.loadDefense = function (data) {
    // 1.读取防御塔
    core.status.towers = core.clone(data.towers);
    core.status.realTower = core.clone(data.realTower);
    // 2.读取怪物
    core.status.enemys = core.clone(data.enemys);
    core.status.thisMap.enemys = core.clone(data.enemyList);
    // 3.读取统计信息
    core.status.score = data.score;
    core.status.totalDamage = data.damage;
    core.status.totalKilled = data.killed;
    core.status.currTime = data.currTime;
    this.nowInterval = data.nowInterval;
    this.forceInterval = data.forceInterval;
    this.interval = data.interval;
    this.enemyCnt = core.clone(data.enemyCnt);
    this.bossList = [];
    this.speed = 1;
    // 4.处理信息 进行初始化及相关内容
    this.globalInit(true);
    this._drawMine();
    if (flags.__starting__) core.startMonster(flags.__waves__, false, true);
    if (core.defense.forceInterval || core.defense.forceInterval === 0) core.registerAnimationFrame('_forceEnemy', true, force);
    core.control.updateStatusBar(false, true);

    function force () {
        if (flags.__pause__) return;
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
    }
};

////// 初始化防御塔攻击效果 //////
defense.prototype.initAttack = function () {
    core.registerAnimationFrame('_attack', true, attack);

    function attack (timestamp, i) {
        if (flags.__pause__) return;
        if (!core.status.realTower) return;
        if (!core.status.thisMap) return;
        if (!core.status.thisMap.route) core.getEnemyRoute();
        for (var loc in core.status.realTower) {
            var tower = core.status.realTower[loc];
            if (tower.type != 'freeze' && tower.type != 'chain') {
                tower.attackInterval -= 16.67;
                if (tower.attackInterval <= 0) {
                    core.towers['_' + tower.type + 'Attack'](loc.split(',')[0], loc.split(',')[1], tower, i);
                    tower.attackInterval += tower.speed * 1000;
                }
            } else {
                // 冰冻塔和夹击塔单独处理 加经验就行了
                core.status.towers[loc].exp += 0.03;
                var x = loc.split(',')[0],
                    y = loc.split(',')[1];
                core.expLevelUp(x, y);
                if (core.defense.speed > 10) continue;
                // 旋转
                if (i === 0) {
                    if (tower.type === 'freeze' && !main.replayChecking) {
                        var weaponCanvas = core.batchDict['tower-weapon_' + loc].canvas;
                        var lastTransform = weaponCanvas.style.transform;
                        var lastDeg = lastTransform ? Number(lastTransform.slice(7, -4)) : 0;
                        if (lastDeg > 180) {
                            lastDeg -= 360;
                        }
                        weaponCanvas.style.transform = 'rotate(' + (lastDeg + 5) + 'deg)';
                    }
                }
            }
        }
    }
};

////// 删除攻击特效 //////
defense.prototype.deleteTowerEffect = function () {
    core.registerAnimationFrame('_deleteEffect', true, function () {
        if (main.replayChecking) return;
        if (core.defense.speed > 25) return;
        if (flags.__pause__) return;
        for (var one in core.batchDict) {
            if (!one.startsWith('tower')) continue;
            var ctx = core.batchDict[one];
            ctx.interval -= 1;
            if (ctx.interval <= 0) {
                core.clearMap(one);
            } else {
                var x = ctx.interval / ctx.totalTime;
                ctx.canvas.style.opacity = 1 - (1 - x) * (1 - x);
            }
        }
    });
};

////// 获取地图路线 //////
defense.prototype.getEnemyRoute = function () {
    var floorId = core.status.floorId;
    if (!floorId) return;
    var enemyBase;

    // 获得出怪点
    core.extractBlocks();
    core.status.maps[floorId].blocks.forEach(function (block) {
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

////// 初始化出怪 //////
defense.prototype.initMonster = function (floorId) {
    return this.defensedata.initMonster(floorId);
};

////// 伪随机自动添加怪物 //////
defense.prototype._randomMonster = function (start, number) {
    var id = core.floorIds.indexOf(core.status.floorId);
    var enemys = core.clone(core.material.enemys);
    var all = Object.keys(enemys);
    var length = all.length;
    var pre = (id * length * 12453) % 12307 ^ 1063289;
    pre *= (start * number) ^ 13060;
    pre = Math.abs(~~pre);
    pre %= length;
    var next = pre;
    var now = [];
    var x = 0;
    for (var i = start; i < start + number; i++) {
        if ((i + 1) % 10 !== 0 && !(core.status.floorId === 'L4' && (i + 1) % 5 === 0 && i > 14)) {
            x = 0;
            while (true) {
                x++;
                // 防卡死
                if (x >= 100) {
                    for (var j = Math.abs((next * 52356) ^ 52524) % length; true; j++) {
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
            var one = enemys[all[next]].hp * enemys[all[next]].speed * (1 + (i * i) / 225);
            var totalHp = 600 * (1 + (i * i) / 225);
            var n = Math.max(10, totalHp / one + (totalHp % 10) + ((~~((next ^ 215673) * totalHp) | one) % 15));
            n = Math.round(n);
            if (core.status.floorId == 'MT1') n *= 4;
            if (core.status.floorId == 'MT2') n = Math.ceil(n / 4);
            // 添加怪物
            now.push([all[next], n]);
            next = (~(next * 82461) >> 5) ^ (12460 * number) ^ ~~totalHp;
            next = Math.abs(~~next);
            next %= length;
        } else {
            x = 0;
            while (true) {
                x++;
                // 防卡死
                if (x >= 100) {
                    for (var j = Math.abs(((next ^ 5236) * 1569) | 15325) % length; true; j++) {
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
            var totalHp = 300 * (1 + (i * i) / 225);
            var n = 1;
            if (core.status.floorId == 'MT1') n *= 4;
            if (core.status.floorId.startsWith('L')) {
                // 闯关模式单独处理
                var floor = core.status.floorId;
                if (floor === 'L1') {
                    if (i === 19) now.push(['bigBat', 1]);
                    if (i === 29) now.push(['slimelord', 1]);
                }
                if (floor === 'L2') {
                    if (i === 19) now.push(['bigBat', 1]);
                    if (i === 29) now.push(['greenGateKeeper', 1]);
                }
                if (floor === 'L3') {
                    if (i === 19) now.push(['slimelord', 1]);
                    if (i === 29) now.push(['demonPriest', 1]);
                    if (i === 39) now.push(['goldSlimelord', 1]);
                }
                if (floor === 'L4') {
                    if (i === 19) now.push(['slimelord', 1]);
                    if (i === 24) now.push(['bigBat', 3]);
                    if (i === 29) now.push(['bigBat', 4]);
                    if (i === 34) now.push(['darkKnight', 1]);
                    if (i === 39) now.push(['goldSlimelord', 1]);
                    if (i === 44) now.push(['demonPriest', 1]);
                    if (i === 49) now.push(['blackKing', 1]);
                    if (i === 54) now.push(['redKing', 1]);
                    if (i === 59) now.push(['greenKnight', 1]);
                }
            } else now.push([all[next], n]);
            next = ((~(next * 82461) ^ 56290) & 45190) ^ start ^ ~~totalHp;
            next = Math.abs(~~next);
            next %= length;
        }
    }
    now = core.status.thisMap.enemys.concat(now);
    core.status.thisMap.enemys = core.clone(now);
};

////// 进行下一波出怪 //////
defense.prototype.startMonster = function (floorId, start, fromLoad) {
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
    if (core.status.floorId.startsWith('L')) {
        if (!enemy) {
            return;
        }
    }
    var total;
    if (this.enemyCnt[flags.__waves__]) {
        total = this.enemyCnt[flags.__waves__];
    } else {
        total = enemy[1];
        this.enemyCnt[flags.__waves__] = total;
    }
    if (!enemy) {
        core.drawTip('怪物清空了！');
        return false;
    }
    if (core.status.floorId.startsWith('L')) {
        var floor = core.status.floorId;
        if ((floor === 'L1' || floor === 'L2') && core.status.thisMap.enemys.length < 30) {
            this._randomMonster(12, 18);
        }
        if (floor === 'L3' && core.status.thisMap.enemys.length < 40) this._randomMonster(12, 28);
        if (floor === 'L4' && core.status.thisMap.enemys.length < 60) this._randomMonster(12, 48);
    } else {
        if (Object.keys(core.status.thisMap.enemys).length - flags.__waves__ <= 10) this._randomMonster(Object.keys(core.status.thisMap.enemys).length, 10);
    }
    if (!fromLoad) {
        if (!flags.__pause__) core.drawTip('开始出怪');
        else core.drawTip('现在处于暂停阶段，取消暂停后将开始出怪');
    }
    // 提前出怪金币奖励
    if (this.forceInterval && !fromLoad) {
        if (flags.__waves__ != 0) {
            var forceMoney = (core.defense.forceInterval / 1000) * (1 + (flags.__waves__ * flags.__waves__) / 2250);
            core.status.hero.money += Math.floor(forceMoney);
            core.status.score += ~~core.defense.forceInterval / 100;
        }
        if (!core.isReplaying()) core.pushActionToRoute('nextWave');
    }
    this._startMonster_doStart(enemy, startLoc, total, fromLoad);
    return true;
};

defense.prototype._startMonster_init = function () {
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

    function forceEnemy () {
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
};

defense.prototype._startMonster_doStart = function (enemy, startLoc, total, fromLoad) {
    delete this.forceInterval;
    delete this.nowInterval;
    core.unregisterAnimationFrame('_forceEnemy');
    var first = true;
    if (!fromLoad) core.defense.interval = 0;
    // 帧动画
    function animate () {
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
        if (core.defense.interval <= 0) core.defense._startMonster_addEnemy(enemy, total, now, startLoc);
    }
    core.registerAnimationFrame('_startMonster', true, animate);
};

defense.prototype._startMonster_addEnemy = function (enemy, total, now, startLoc) {
    core.status.thisMap.enemys[flags.__waves__][1]--;
    core.status.enemys.cnt++;
    core.updateStatusBar();
    var wave = flags.__waves__;
    var hp = now.hp * (1 + (wave * wave) / 225);
    var money = now.money * (1 + (wave * wave) / 4900) * (2 - flags.hard);
    var speed = now.speed;
    var special = core.clone(now.special) || [];
    if (core.status.floorId == 'MT1') {
        money /= 2;
        hp /= 4;
    }
    if (core.status.floorId == 'MT2') {
        hp *= now.notBomb ? 2 : 4;
        money *= 4;
        if (now.notBomb) speed /= 1.5;
        for (var i = 0; i < special.length; i++) {
            if (special[i] === 4) {
                special.splice(i, 1);
                i--;
            }
        }
    }
    if (core.status.floorId === 'L3') money *= 1.5;
    if (core.status.floorId === 'MT0' || core.status.floorId === 'MT1') {
        if (flags.hard === 1) {
            hp *= 1.5;
            money *= 1.5;
        }
    }
    var id = core.getUnitId(enemy[0], core.status.enemys.enemys);
    // 添加怪物
    core.status.enemys.enemys[id] = {
        x: startLoc[0],
        y: startLoc[1],
        id: enemy[0],
        speed: speed,
        hp: hp,
        total: hp,
        atk: now.atk,
        def: now.def,
        to: 1,
        drown: false,
        money: Math.floor(money),
        freeze: 1,
        wave: wave,
        special: special
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
                core.autosave();
            }
            core.startMonster(core.status.floorId);
            core.updateStatusBar();
            return;
        }
        // 强制出怪
        core.registerAnimationFrame('_forceEnemy', true, function () {
            if (flags.__pause__) return;
            if (!core.defense.forceInterval) {
                if (core.material.enemys[enemy[0]].notBomb && !(core.status.floorId === 'L4' && enemy[0] === 'bigBat')) {
                    core.defense.forceInterval = 60000;
                    core.defense.nowInterval = 60;
                } else {
                    core.defense.forceInterval = 15000;
                    core.defense.nowInterval = 15;
                }
                core.autosave();
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
    core.defense.interval += (800 / (total > 15 ? 1 + (total - 15) / 10 : 1) / core.material.enemys[enemy[0]].speed) * 2;
};

defense.prototype.getUnitId = function (start, parent) {
    var id;
    while (true) {
        id = start + '_' + Math.round(Date.now() * Math.random());
        if ((core.material.enemys[start] || {}).notBomb) id += '_boss';
        if (!parent) return null;
        if (!(id in parent)) return id;
    }
};

defense.prototype.enemyDie = function (id) {
    return this.defensedata.enemyDie(id);
};

////// 绘制地图路线 //////
defense.prototype.drawEnemyRoute = function () {
    var route = core.getEnemyRoute();
    if (!(route instanceof Array)) return core.drawTip('路线出错！');
    // 建画布
    if (!core.dymCanvas.enemyRoute) core.createCanvas('enemyRoute', 0, 0, 416, 416, 25);
    else core.clearMap('enemyRoute');
    var ox = core.bigmap.offsetX,
        oy = core.bigmap.offsetY;
    // 绘制路线
    route.forEach(function (one, i) {
        if (i == route.length - 1) return;
        var now = one.map(function (one) {
            return one * 32 - ox + 16;
        }),
            next = route[i + 1].map(function (one) {
                return one * 32 - oy + 16;
            });
        core.drawLine('enemyRoute', now[0], now[1], next[0], next[1], [255, 255, 255, 0.8], 2);
    });
};

////// sprite化 画布相关 //////
defense.prototype.acquireCanvas = function (name, type) {
    if (!core.batchCanvas) return;
    if (!core.batchDict) core.batchDict = {};
    if (core.batchDict[name]) return core.batchDict[name];
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

defense.prototype.returnCanvas = function (name, type) {
    type = type || 'enemy';
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

////// 初始化所有画布 //////
defense.prototype.initDrawEnemys = function () {
    if (!main.replayChecking) {
        // 归还所有画布
        for (var one in core.batchDict) {
            var type = core.batchDict[one].canvas._type;
            this.returnCanvas(one, type);
        }
        // 删除画布
        for (var type in core.batchCanvas) {
            core.batchCanvas[type].forEach(function (one) {
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
        core.createCanvas('healthBar', 0, 0, 28, 4, 36, 20);
    }
    core.drawAllEnemys();
    core.initAttack();
};

//////////// 绘制所有怪物 勇士 ////////////

defense.prototype.drawAllEnemys = function (fromLoad) {
    if (fromLoad) this._drawAllEnemys_fromLoad();
    core.registerAnimationFrame('_drawCanvases', true, draw);
    core.registerAnimationFrame('globalAnimate', true, this._drawAllEnemys_drawEnemyAnimation);

    function draw (timestamp, i) {
        if (flags.__pause__) return;
        if (!core.status.thisMap) return;
        if (!core.status.enemys) return;
        delete core.defense.sortedEnemy;
        if (!core.isReplaying()) core.pushActionToRoute('wait');
        if (!core.status.currTime) core.status.currTime = 0;
        core.status.currTime += 16.67;
        var enemys = core.status.enemys.enemys;
        var route = core.status.thisMap.route;
        if (!route) core.getEnemyRoute();
        flags.__transparented__ = false;
        var length = core.defense.bossList.length;
        var noDraw = (core.domStyle.isVertical && core.defense.speed >= 100) ||
            (!core.domStyle.isVertical && core.defense.speed === 1000)
        Object.keys(enemys).forEach(function (one) {
            core.defense._drawAllEnemys_drawEnemy(enemys, one, route, i, length, noDraw);
        });
        core.defense._drawAllEnemys_drawHero(i, noDraw, length);
        if (core.defense.speed <= 50) {
            if (!flags.__transparented__) core.defense._drawBossHealthBar_transparent('remove');
            else core.defense._drawBossHealthBar_transparent('add');
        }
    }
};

defense.prototype._drawAllEnemys_drawEnemyAnimation = function (timestamp, i) {
    if (main.replayChecking) return;
    if (!core.status.thisMap) return;
    if (timestamp !== -1 && (i !== 0 || core.defense.speed > 1)) return;
    if ((core.domStyle.isVertical && core.defense.speed >= 100) ||
        (!core.domStyle.isVertical && core.defense.speed === 1000)) return;
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
            Object.keys(enemys).forEach(function (one) {
                core.drawBlock(core.getBlockById(one.split('_')[0]), core.status.globalAnimateStatus, one);
            });

            // Global Hero Animate
            var heroes = core.status.enemys.hero || {};
            Object.keys(heroes).forEach(function (one) {
                var icon = core.getBlockById('N342');
                if (heroes[one].level === 2) {
                    icon = core.getBlockById('N325');
                }
                core.drawBlock(icon, core.status.globalAnimateStatus, one);
            });

            // Global Autotile Animate
            core.status.autotileAnimateObjs.forEach(function (block) {
                core.maps._drawAutotileAnimate(block, core.status.globalAnimateStatus);
            });
        }
        // Box animate
        core.drawBoxAnimate();
    }
    core.animateFrame.globalTime = timestamp;
};

defense.prototype._drawAllEnemys_fromLoad = function () {
    // 读档时的绘制
    var enemys = core.status.enemys.enemys;
    var heroes = core.status.enemys.hero || {};
    Object.keys(enemys).forEach(function (one) {
        var enemy = enemys[one];
        var ctx = core.acquireCanvas(one);
        core.relocateCanvas(ctx, enemy.x * 32, enemy.y * 32 - 1);
    });
    for (var id in heroes) {
        if (id == 'cnt') continue;
        var hero = heroes[id];
        var ctx = core.acquireCanvas(id);
        core.relocateCanvas(ctx, hero.x * 32, hero.y * 32 - 1);
    }
    for (var pos in core.status.towers) {
        var tower = core.status.towers[pos];
        core.initTowerSprite(tower);
    }
    this._drawAllEnemys_drawEnemyAnimation(-1);
};

defense.prototype._drawAllEnemys_drawEnemy = function (enemys, one, route, i, length, noDraw) {
    var enemy = enemys[one];
    if (i === 0 && !noDraw) {
        if (!main.replayChecking) {
            var ctx = core.acquireCanvas(one);
            if (!one.endsWith('boss')) var hpctx = core.acquireCanvas(one + '_healthBar', 'healthBar');
        }
    }
    // 位置移动
    var dx = route[enemy.to][0] - route[enemy.to - 1][0],
        dy = route[enemy.to][1] - route[enemy.to - 1][1];
    var speedX = ((dx * enemy.speed) / 60) * enemy.freeze,
        speedY = ((dy * enemy.speed) / 60) * enemy.freeze;
    enemy.x += speedX;
    enemy.y += speedY;
    if (core.hasSpecial(enemy.special, 6)) enemy.speed += 0.02;
    // boss血条半透明化
    if (length > 0 && !flags.__transparented__) {
        if (enemy.y * 32 < length * 36 + 10) {
            flags.__transparented__ = true;
        }
    }
    // 如果还没有画过 进行绘制
    if (i === 0 && !noDraw) {
        if (!enemy.drown && !main.replayChecking) {
            enemy.drown = true;
            core.drawBlock(core.getBlockById(one.split('_')[0]), core.status.globalAnimateStatus, one);
            // 血条
            core.drawHealthBar(one);
        }
        if (!main.replayChecking) {
            if (!one.endsWith('boss')) core.relocateCanvas(hpctx, enemy.x * 32 + 2, enemy.y * 32);
            core.relocateCanvas(ctx, enemy.x * 32, enemy.y * 32);
        }
    }
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
            core.defense._drawAllEnemys_reachMine(enemys, enemy, one, mine, i, noDraw);
        }
        // ---- 踩到夹击
        var chain = core.status.thisMap.chain;
        if (chain && chain[enemy.to]) {
            core.defense._drawAllEnemys_reachChain(enemys, enemy, one, chain);
        }
        if (core.hasSpecial(enemy, 7)) {
            if (enemy.to + 2 >= route.length) enemy.to++;
            else {
                if (enemy.to % 3 == 0) {
                    enemy.x = route[enemy.to + 1][0];
                    enemy.y = route[enemy.to + 1][1];
                    enemy.to += 2;
                } else enemy.to++;
            }
        } else if (core.hasSpecial(enemy.special, 8)) {
            if (enemy.to - 2 <= 0) enemy.to++;
            else {
                if ((enemy.to + 1) % 4 == 0) {
                    if (!enemy.back) enemy.back = {};
                    if (!enemy.back[enemy.to]) {
                        enemy.back[enemy.to] = true;
                        enemy.x = route[enemy.to - 1][0];
                        enemy.y = route[enemy.to - 1][1];
                    } else enemy.to++;
                } else enemy.to++;
            }
        } else enemy.to++;
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
};

defense.prototype._drawAllEnemys_reachBase = function (enemys, enemy, one) {
    core.status.hero.hp--;
    if (core.material.enemys[one.split('_')[0]].notBomb) core.status.hero.hp -= 9;
    core.updateStatusBar();
    if (core.status.hero.hp <= 0) {
        var all = this.getAllMaps(!core.status.floorId.startsWith('L'));
        if (!core.isReplaying()) {
            flags.__pause__ = true;
            core.status.route[core.status.route.length - 1] = (parseInt(core.status.route[core.status.route.length - 1]) + 1000).toString();
        }
        if (core.status.floorId.startsWith('L')) return core.lose('你死了');
        core.status.hero.hp = ~~core.status.score;
        win();
        return;
    }
    // 归还画布
    core.returnCanvas(one);
    core.returnCanvas(one + '_healthBar', 'healthBar');
    if (one.endsWith('boss')) core.defense._drawBossHealthBar_animate(one, 0);
    delete enemys[one];
    if (core.status.floorId.startsWith('L') && Object.keys(core.status.enemys.enemys).length === 0 &&
        flags.__waves__ === Object.keys(core.status.thisMap.enemys).length) {
        var all = this.getAllMaps(false);
        core.status.hero.hp = ~~core.status.score;
        if (!core.isReplaying()) {
            flags.__pause__ = true;
            core.status.route[core.status.route.length - 1] = (parseInt(core.status.route[core.status.route.length - 1]) + 1000).toString();
        }
        core.unregisterAnimationFrame('_drawCanvases');
        core.unregisterAnimationFrame('_startMonster');
        core.unregisterAnimationFrame('_forceEnemy');
        core.unregisterAnimationFrame('_attack');
        core.unregisterAnimationFrame('_deleteEffect');
        core.unregisterAction('onclick', '_confirm');
        core.unregisterAction('onclick', '_doTower');
        core.initDrawEnemys();
        core.updateStatusBar();
        core.win(all[core.status.floorId].split('_')[0] + '结束  v0.1.1');
        return;
    }
    return true;
    function win () {
        core.unregisterAnimationFrame('_drawCanvases');
        core.unregisterAnimationFrame('_startMonster');
        core.unregisterAnimationFrame('_forceEnemy');
        core.unregisterAnimationFrame('_attack');
        core.unregisterAnimationFrame('_deleteEffect');
        core.unregisterAction('onclick', '_confirm');
        core.unregisterAction('onclick', '_doTower');
        core.win(all[core.status.floorId].split('_')[0] + '结束  v0.1.1版');
        core.initDrawEnemys();
        core.updateStatusBar();
    }
};

defense.prototype._drawAllEnemys_reachMine = function (enemys, enemy, one, mine, j, noDraw) {
    var played = false;
    for (var i = mine[enemy.to].cnt; i > 0; i--) {
        if (!mine[enemy.to][i]) continue;
        if (!played) core.playSound('bomb.mp3');
        played = true;
        enemy.hp -= mine[enemy.to][i].atk;
        core.status.totalDamage += parseInt(mine[enemy.to][i].atk);
        // 把这个地雷删了
        delete mine[enemy.to][i];
        mine[enemy.to].cnt--;
        if (enemy.hp <= 0) {
            core.enemyDie(one);
            var dead = true;
            break;
        }
    }
    if (!dead) core.drawHealthBar(one);
    // 绘制地雷
    if (j === 0 && !noDraw)
        core.defense._drawMine(enemy.to);
};

defense.prototype._drawAllEnemys_reachChain = function (enemys, enemy, one, chain) {
    if (chain[enemy.to][0] > 0) {
        // 扣血
        core.playSound('laser.mp3');
        var damage = Math.min(chain[enemy.to][1], (enemy.total * chain[enemy.to][0]) / 100);
        enemy.hp -= damage;
        core.status.totalDamage += damage;
        if (enemy.hp <= 0) {
            core.enemyDie(one);
            return;
        }
        core.drawHealthBar(one);
    }
};

defense.prototype._drawAllEnemys_doFreeze = function (enemys, enemy, one) {
    var freeze = core.status.thisMap.freeze;
    if (!freeze) freeze = {};
    if (freeze[enemy.to - 1] > 0) {
        enemy.freeze = 1 - freeze[enemy.to - 1] / 100;
    } else if (freeze[enemy.to] > 0) {
        enemy.freeze = 1 - freeze[enemy.to] / 100;
    } else {
        enemy.freeze = 1;
    }
};

defense.prototype._drawAllEnemys_battle = function (enemys, enemy, one) {
    if (!core.status.enemys.hero) return;
    for (var id in core.status.enemys.hero) {
        var hero = core.status.enemys.hero[id];
        var dx = hero.x - enemy.x;
        var dy = hero.y - enemy.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            var win = core.doBattle(one, id);
            if (win) return;
        }
    }
};

defense.prototype._drawAllEnemys_drawHero = function (i, noDraw, length) {
    var heroes = core.status.enemys.hero || {};
    for (var id in heroes) {
        if (id == 'cnt') continue;
        var hero = heroes[id];
        if (!main.replayChecking) {
            var ctx = core.acquireCanvas(id);
            var hpctx = core.acquireCanvas(id + '_healthBar', 'healthBar');
        }
        // 位置移动
        var route = core.status.thisMap.route;
        var dx = route[hero.to][0] - route[hero.to + 1][0],
            dy = route[hero.to][1] - route[hero.to + 1][1];
        var speedX = (dx * hero.speed) / 60,
            speedY = (dy * hero.speed) / 60;
        hero.x += speedX;
        hero.y += speedY;
        // boss血条半透明
        if (i === 0 && !noDraw) {
            if (length > 0) {
                if (hero.y * 32 < this.bossList.length * 36 + 10) {
                    flags.__transparented__ = true;
                }
            }
        }
        // 如果还没有画过 进行绘制
        if (i === 0 && !noDraw) {
            if (!hero.drown && !main.replayChecking) {
                hero.drown = true;
                var icon = core.getBlockById('N342');
                if (hero.level === 2) {
                    icon = core.getBlockById('N325');
                }
                core.drawBlock(icon, core.status.globalAnimateStatus, ctx);
                // 血条
                core.drawHealthBar(id);
            }
            if (!main.replayChecking) {
                core.relocateCanvas(hpctx, hero.x * 32 + 2, hero.y * 32);
                core.relocateCanvas(ctx, hero.x * 32, hero.y * 32);
            }
        }
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
};

////// 怪物和勇士战斗 //////
defense.prototype.doBattle = function (enemyId, heroId) {
    // 默认勇士战胜
    var enemy = core.status.enemys.enemys[enemyId];
    var hero = core.status.enemys.hero[heroId];
    if (!enemy) return null;
    if (!hero) return null;
    if (typeof enemy.special == 'number') enemy.special = [enemy.special];
    core.playSound('battle.mp3');
    // 执行战斗
    var damageInfo = core.getDamageInfo(enemy, hero);
    if (!damageInfo || damageInfo.damage >= hero.hp) {
        // 勇士战败 先攻 获得怪物应该减少的生命值
        if (!hero.special) hero.special = [];
        damageInfo = core.getDamageInfo(hero, enemy, true);
        enemy.hp -= damageInfo.damage;
        core.status.totalDamage += parseInt(damageInfo.damage || 0);
        core.drawHealthBar(enemyId);
        // 删除勇士
        core.heroDie(heroId);
        return false;
    }
    // 勇士胜
    core.enemyDie(enemyId);
    hero.hp -= damageInfo.damage;
    core.status.totalDamage += parseInt(enemy.hp);
    core.drawHealthBar(heroId);
    return true;
};

defense.prototype._drawMine = function (loc) {
    if (main.replayChecking) return;
    if (core.defense.speed >= 100) return;
    var mine = core.status.thisMap.mine || {};
    if (!loc) {
        for (var i in mine) {
            core.defense._drawMine(i);
        }
        return;
    }
    if (mine[loc]) {
        var ctx = core.acquireCanvas('mine_' + loc, 'mine');
        var route = core.status.thisMap.route;
        core.relocateCanvas(ctx, route[loc][0] * 32, route[loc][1] * 32);
        core.clearMap(ctx);
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        for (var j = 0; j < mine[loc].cnt; j++) {
            if (!mine[loc][j + 1]) continue;
            var level = mine[loc][j + 1].level;
            var color2 = [34 + (level / 30) * 221, 221 - (level / 30) * 221, 68];
            var color1 = [68 + (level / 30) * 187, 255 - (level / 30) * 155, 119];
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
};

////// 绘制血条 //////
defense.prototype.drawHealthBar = function (enemy) {
    if (main.replayChecking) return;
    if (this.speed > 10) return;
    if (!enemy) {
        for (var one in core.status.enemys.enemys) {
            if (one.endsWith('boss')) {
                this.drawBossHealthBar(one);
                continue;
            }
            var ctx = core.acquireCanvas(one + '_healthBar', 'healthBar');
            enemy = core.status.enemys.enemys[one];
            var now = enemy.hp,
                total = enemy.total;
            core.relocateCanvas(ctx, enemy.x * 32 + 2, enemy.y * 32);
            var color = [255 * 2 - (now / total) * 2 * 255, (now / total) * 2 * 255, 0, 1];
            core.fillRect(ctx, 1, 0, 28, 4, '#333333');
            core.fillRect(ctx, 1, 0, (now / total) * 28, 4, color);
            core.strokeRect(ctx, 0, 0, 28, 4, '#000000', 2);
        }
        for (var one in core.status.enemys.hero) {
            if (one == 'cnt') continue;
            var ctx = core.acquireCanvas(one + '_healthBar', 'healthBar');
            enemy = core.status.enemys.hero[one];
            var now = enemy.hp,
                total = enemy.total;
            core.relocateCanvas(ctx, enemy.x * 32 + 2, enemy.y * 32);
            var color = [255 * 2 - (now / total) * 2 * 255, (now / total) * 2 * 255, 0, 1];
            core.fillRect(ctx, 1, 0, 28, 4, '#333333');
            core.fillRect(ctx, 1, 0, (now / total) * 28, 4, color);
            core.strokeRect(ctx, 0, 0, 28, 4, '#000000', 2);
        }
        return;
    }
    if (enemy.endsWith('boss')) return this._drawBossHealthBar_animate(enemy, core.status.enemys.enemys[enemy].hp);
    var ctx = core.acquireCanvas(enemy + '_healthBar', 'healthBar');
    enemy = core.status.enemys.enemys[enemy] || core.status.enemys.hero[enemy];
    if (!enemy) return;
    var now = enemy.hp,
        total = enemy.total;
    var color = [255 * 2 - (now / total) * 2 * 255, (now / total) * 2 * 255, 0, 1];
    core.fillRect(ctx, 1, 0, 28, 4, '#333333');
    core.fillRect(ctx, 1, 0, (now / total) * 28, 4, color);
    core.strokeRect(ctx, 0, 0, 28, 4, '#000000', 2);
};

////// 绘制boss血条 //////
defense.prototype.drawBossHealthBar = function (id) {
    if (main.replayChecking) return;
    if (this.speed > 8) return;
    if (!id.endsWith('boss')) return core.drawTip('这不是boss！');
    var boss = core.status.enemys.enemys[id];
    var now = boss.hp,
        total = boss.total;
    var index = this.bossList.indexOf(id);
    if (index === -1) {
        this.bossList.push(id);
        index = this.bossList.length - 1;
    }
    var borderCtx = core.acquireCanvas(id + '_border', 'bossHealth_border'),
        barCtx = core.acquireCanvas(id + '_bar', 'bossHealth'),
        backCtx = core.acquireCanvas(id + '_back', 'bossHealth_back');
    core.relocateCanvas(borderCtx, 15, index * 36 + 4);
    core.relocateCanvas(barCtx, 49, index * 36 + 5);
    core.relocateCanvas(backCtx, 49, index * 36 + 5);
    core.clearMap(borderCtx);
    var color = 'rgba(' + (1 - now / total) * 2 * 255 + ',' + (now / total) * 2 * 255 + '0,1)';
    barCtx.canvas.style.width = ((352 * now) / total) * core.domStyle.scale + 'px';
    barCtx.canvas.style.backgroundColor = color;
    backCtx.canvas.style.backgroundColor = 'rgba(51,51,51,1)';
    borderCtx.shadowBlur = 3;
    borderCtx.shadowColor = '#000';
    core.strokeRect(borderCtx, 34, 2, 350, 14, '#eee', 2);
    var e = id.split('_')[0];
    var name = core.material.enemys[e].name;
    core.fillPolygon(borderCtx, [
        [1, 1],
        [1, 30],
        [50 + 14 * name.length, 30],
        [66 + 14 * name.length, 17],
        [385, 17],
        [385, 15],
        [35, 15],
        [35, 1]
    ], '#eee');
    core.drawIcon(borderCtx, e, 1, 0, 32, 32);
    core.fillBoldText(borderCtx, name, 38, 28, '#eee', '#333', '13px Arial');
    barCtx.canvas.className = 'bossHealthBar';
    borderCtx.canvas.className = 'bossHealthBar';
    backCtx.canvas.className = 'bossHealthBar';
    borderCtx.canvas.style.opacity = '1';
    var barEvent = function () {
        if (parseInt(barCtx.canvas.style.width) <= 0) {
            borderCtx.canvas.style.top = parseInt(borderCtx.canvas.style.top) - 36 + 'px';
            borderCtx.canvas.style.opacity = '0';
            backCtx.canvas.style.top = parseInt(backCtx.canvas.style.top) - 36 + 'px';
            backCtx.canvas.style.backgroundColor = 'rgba(51,51,51,0)';
            core.defense.bossList.splice(core.defense.bossList.indexOf(id), 1);
            core.defense.bossList.forEach(function (one, i) {
                if (one == id) return;
                var bc = core.acquireCanvas(one + '_border', 'bossHealth_border');
                var bac = core.acquireCanvas(one + '_bar', 'bossHealth');
                var barc = core.acquireCanvas(one + '_back', 'bossHealth_back');
                core.relocateCanvas(bc, 16, i * 36 + 4);
                core.relocateCanvas(bac, 49, i * 36 + 5);
                core.relocateCanvas(barc, 49, i * 36 + 5);
            });
        }
    };
    var borderEvent = function () {
        if (borderCtx.canvas.style.opacity === '0') {
            barCtx.canvas.removeEventListener('transitionend', barEvent);
            borderCtx.canvas.removeEventListener('transitionend', borderEvent);
            core.returnCanvas(id + '_border', 'bossHealth_border');
            core.returnCanvas(id + '_bar', 'bossHealth');
            core.returnCanvas(id + '_back', 'bossHealth_back');
        }
    };
    barCtx.canvas.addEventListener('transitionend', barEvent, true);
    borderCtx.canvas.addEventListener('transitionend', borderEvent, true);
};

defense.prototype._drawBossHealthBar_animate = function (id, to) {
    if (main.replayChecking) return;
    if (this.speed > 8) return;
    if (this.bossList.indexOf(id) === -1) return core.drawBossHealthBar(id);
    var ctx = core.acquireCanvas(id + '_bar', 'bossHealth');
    var total = core.status.enemys.enemys[id].total;
    var toColor = 'rgba(' + (1 - to / total) * 2 * 255 + ',' + (to / total) * 2 * 255 + '0,1)';
    ctx.canvas.style.backgroundColor = toColor;
    ctx.canvas.style.width = Math.ceil(((352 * to) / total) * core.domStyle.scale) + 'px';
};

defense.prototype._drawBossHealthBar_transparent = function (type) {
    if (this.speed > 8) return;
    this.bossList.forEach(function (one) {
        var bc = core.acquireCanvas(one + '_border', 'bossHealth_border');
        var bac = core.acquireCanvas(one + '_bar', 'bossHealth');
        var barc = core.acquireCanvas(one + '_back', 'bossHealth_back');
        var color = bac.canvas.style.backgroundColor.split(',');
        if (type == 'add') {
            bc.canvas.style.opacity = '0.3';
            bac.canvas.style.backgroundColor = color[0] + ',' + color[1] + ',0,0.3)';
            barc.canvas.style.backgroundColor = 'rgba(51,51,51,0.3)';
        }
        if (type == 'remove') {
            bc.canvas.style.opacity = '1';
            bac.canvas.style.backgroundColor = color[0] + ',' + color[1] + ',0,1)';
            barc.canvas.style.backgroundColor = 'rgba(51,51,51,1)';
        }
    });
};

////// 放置防御塔 //////
defense.prototype.placeTower = function (x, y) {
    if (core.getBgNumber(x, y) != 311) {
        core.drawTip('请选择正确的放塔位置！');
        core.status.event.id = null;
        core.status.event.data = null;
        core.unlockControl();
        core.updateStatusBar();
        return true;
    }
    if (core.status.event.data == 'destory') {
        // 震荡塔只能放在5级炸弹塔上
        var tower = core.status.towers[x + ',' + y];
        if (!tower || !(tower.type == 'bomb' && tower.level >= 5)) {
            core.drawTip('震荡塔只能放在5级以上的炸弹塔上！');
            core.status.event.id = null;
            core.updateStatusBar();
            return;
        }
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

    function confirm (x, y) {
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
            if (!core.isReplaying()) core.pushActionToRoute('place:' + x + ':' + y + ':' + tower);
            core.updateStatusBar();
            return true;
        }
        core.updateStatusBar();
        core.unregisterAction('onclick', '_confirm');
        core.placeTower(x, y);
        return true;
    }
};

////// 添加防御塔 //////
defense.prototype._addTower = function (x, y, tower) {
    if (core.status.hero.money < core.defense.towers[tower].cost) {
        core.drawTip('金钱不足却执行了添加防御塔！');
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
};

////// 升级防御塔 //////
defense.prototype.upgradeTower = function (x, y) {
    var now = core.clone(core.status.towers[x + ',' + y]);
    if (!now) {
        core.status.event.id = null;
        core.drawTip('不存在防御塔！');
        return false;
    }
    // 检查最大等级
    if (now.max && now.level >= now.max) {
        core.drawTip('当前塔已满级！');
        return false;
    }
    if (now.cost > core.status.hero.money) {
        core.drawTip('金钱不足！');
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
    if (now.type == 'freeze') core.getFreezeLoc();
    if (now.type == 'chain') core.getChainLoc();
    this.updateTowerSprite(now);
    core.drawRange(x, y, core.status.realTower[x + ',' + y].range || 0, core.status.realTower[x + ',' + y].square);
    core.drawTip('升级成功！');
    if (!core.isReplaying()) core.pushActionToRoute('upgrade:' + x + ':' + y);
    return true;
};

////// 一键等级最大化 //////
defense.prototype.levelToMax = function (x, y) {
    while (true) {
        if (!this.upgradeTower(x, y)) break;
    }
    core.drawTip('一键升级成功！');
}

////// 经验升级 //////
defense.prototype.expLevelUp = function (x, y) {
    var tower = core.status.towers[x + ',' + y];
    if (!tower) return core.drawTip('不存在防御塔！');
    var exp = tower.exp;
    var need = this.expLevelUpNeed(tower.expLevel);
    if (exp >= need) {
        tower.expLevel++;
        tower.exp -= need;
        core.saveRealStatusInCache(x, y);
        var id = core.status.event.id;
        if (this.speed <= 8)
            core.drawAnimate('update', x, y);
        if (core.status.event.data == x + ',' + y && (id == 'checkEnemy' || id.startsWith('confirm'))) {
            if (this.speed <= 8)
                core.updateStatusBar();
            core.drawRange(x, y, core.status.realTower[x + ',' + y].range || 0, core.status.realTower[x + ',' + y].square);
        }
        if (tower.type == 'freeze') core.getFreezeLoc();
        if (tower.type == 'chain') core.getChainLoc();
    }
};

////// 获得升级后的属性 //////
defense.prototype.getNextLvStatus = function (x, y, fromDraw) {
    var now = core.status.towers[x + ',' + y];
    if (!now) return console.error('不存在防御塔！');
    var level = now.level,
        next = level + 1;
    var toStatus = {};
    var skipped = [
        'level', 'type', 'damage', 'max',
        'haveCost', 'killed', 'exp', 'expLevel',
        'square', 'attackInterval', 'x', 'y', 'pauseBuild'
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
}

////// 获得防御塔真实属性 //////
defense.prototype.getTowerRealStatus = function (x, y, name, status) {
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
}

////// 将防御塔真实属性存入缓存及存档 //////
defense.prototype.saveRealStatusInCache = function (x, y) {
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
}

////// 卖出防御塔 //////
defense.prototype.sellTower = function (x, y) {
    var pos = x + ',' + y;
    var tower = core.status.realTower[pos];
    if (!tower) {
        core.status.event.id = null;
        core.status.event.data = null;
        core.drawTip('不存在防御塔！');
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
    if (!core.isReplaying()) core.pushActionToRoute('sell:' + x + ':' + y);
    return true;
};

defense.prototype.expLevelUpNeed = function (level) {
    level++;
    return level * level * 25;
};

////// 自动更新状态栏 //////
defense.prototype.autoUpdateStatusBar = function (x, y) {
    var id = core.status.event.id;
    if (!id) return;
    if (core.status.event.data == x + ',' + y && (id == 'checkTower' || id.startsWith('confirm'))) {
        core.updateStatusBar();
    }
};

//////////// 防御塔sprite化相关 ////////////

////// 初始化防御塔sprite //////
defense.prototype.initTowerSprite = function (tower) {
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
            core.batchDict['tower-weapon_' + pos].canvas.style.transform = '';
        }
    }
    this.updateTowerSprite(tower);
};

////// 更新防御塔sprite //////
defense.prototype.updateTowerSprite = function (tower) {
    if (main.replayChecking) return;
    var eps = 1e-9;
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
};

////// 绘制防御塔范围 //////
defense.prototype.drawRange = function (x, y, range, square) {
    if (main.replayChecking) return;
    core.clearMap('damage');
    var ctx = core.dom.gameCanvas.damage.getContext('2d');
    x = 32 * x + 16;
    y = 32 * y + 16;
    if (range) range *= 32;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    if (range) core.fillCircle(ctx, x, y, range, [200, 200, 200, 0.4]);
    if (square) core.fillRect(ctx, x - 46, y - 46, 92, 92, [200, 200, 200, 0.4]);
    core.fillRect(ctx, x - 14, y - 14, 28, 28, [50, 255, 50, 0.6]);
};

////// 绘制防御塔详细信息 //////
defense.prototype.drawTowerDetail = function (ctx, loc) {
    if (main.replayChecking) return;
    if (loc) {
        var tower = flags.upgrade ? core.getNextLvStatus(loc.split(',')[0], loc.split(',')[1], true) : core.clone(core.status.realTower[loc]);
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
};

defense.prototype._drawTowerDetail_getContent = function (tower, type) {
    var toDraw = [];
    // 获得绘制内容
    for (var one in tower) {
        if (one == 'type' || one == 'level' || one == 'exp' || one == 'damage' || one == 'killed' ||
            one == 'expLevel' || one == 'square' || (one == 'cost' && tower.level) || one == 'attackInterval'
        ) continue;
        if (type == 'freeze' || type == 'chain') {
            if (one == 'rate') var name = this.towerLabel[one](type);
            else if (one == 'cost') {
                var name = this.towerLabel[one](tower.level || 0);
            } else var name = this.towerLabel[one];
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
        if (one == 'hero' || one == 'mine') {
            // hero 和 mine 单独处理 因为有子项目
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
    toDraw.sort(function (a, b) {
        return a.number - b.number;
    });
    return toDraw;
};

defense.prototype._drawTowerDetail_drawHorizon = function (toDraw, tower, type, loc, ori, ctx) {
    // 名称和图标单独绘制
    core.setTextAlign(ctx, 'center');
    var name = this.towerName[type];
    core.fillText(ctx, name, 64, 90, '#fff', '20px Arial');
    core.setTextAlign(ctx, 'left');
    // 详细信息
    var y = 150;
    toDraw.forEach(function (one) {
        if (one.value instanceof Array) {
            // 该项是数组 再次进行遍历
            one.value.sort(function (a, b) {
                return a.number - b.number;
            });
            core.fillText(ctx, one.name + '：', 5, y, '#fff', '14px Arial');
            y += 20;
            one.value.forEach(function (v) {
                if (v.name != '生命' && !(v.name == '攻击' && name == '勇士塔') && v.name != '防御') v.value = v.value.toFixed(2);
                else v.value = Math.round(v.value);
                core.fillText(ctx, v.name + '：' + v.value, 15, y, flags.upgrade ? '#7f7' : '#fff', '14px Arial');
                y += 20;
            });
            return;
        }
        // 该项的值不是数组
        if (one.name) {
            if (one.name == '攻速') one.value = 1 / one.value;
            if (!one.name.endsWith('花费') && one.name != '链接数量' && one.name != '子弹数量' &&
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
            core.drawLine(ctx, 10, y + 5, 10 + (ori.damage / core.status.totalDamage || 0) * 110, y + 5, '#f77', 2);
            core.drawLine(ctx, 10, y + 40, 10 + (ori.killed / core.status.totalKilled || 0) * 110, y + 40, '#f77', 2);
            core.setTextAlign(ctx, 'right');
            core.fillText(ctx, ((ori.killed / core.status.totalKilled || 0) * 100).toFixed(2) + '%', 120, y + 50, '#fcc', '12px Arial');
            core.fillText(ctx, ((ori.damage / core.status.totalDamage || 0) * 100).toFixed(2) + '%', 120, y + 15, '#fcc', '12px Arial');
        } else {
            y -= 55;
        }
        // 升级 卖出
        if (!tower.max || tower.max > tower.level) core.fillRect(ctx, 10, y + 55, 50, 20, flags.upgrade ? '#dfd' : '#9f9');
        core.fillRect(ctx, 70, y + 55, 50, 20, flags.sell ? '#fcc' : '#f77');
        core.setTextAlign(ctx, 'center');
        if (!tower.max || tower.max > tower.level) core.fillBoldText(ctx, '升级', 35, y + 71, '#fff', '#000', '16px Arial');
        core.fillBoldText(ctx, '卖出', 95, y + 71, '#fff', '#000', '16px Arial');
        if (!tower.max || tower.max > tower.level) core.fillText(ctx, Math.round(tower.cost), 35, y + 86, '#fff', '12px Arial');
        core.fillText(ctx, Math.round(tower.haveCost * (tower.pauseBuild ? 1 : 0.6)), 95, y + 86, '#fff', '12px Arial');
        // 最大化等级
        core.fillRect(ctx, 10, y + 90, 109, 20, flags.maxUp ? '#ffa' : '#ff0');
        core.fillBoldText(ctx, '一键升级', 64, y + 106, '#fff', '#000', '16px Arial');
    }
    // 升级卖出的y坐标
    flags.upgradeY = y;
};

defense.prototype._drawTowerDetail_drawVertical = function (toDraw, tower, type, loc, ori, ctx) {
    // 名称和图标单独绘制
    core.setTextAlign(ctx, 'center');
    var name = this.towerName[type];
    core.fillText(ctx, name, 350, 50, '#fff', '20px Arial');
    core.setTextAlign(ctx, 'left');
    // 详细信息
    var y = 50,
        x = 5;
    toDraw.sort(function (a, b) {
        return a.number - b.number;
    });
    toDraw.forEach(function (one) {
        if (one.value instanceof Array) {
            // 该项是数组 再次进行遍历
            one.value.sort(function (a, b) {
                return a.number - b.number;
            });
            core.fillText(ctx, one.name + '：', x, y, '#fff', '14px Arial');
            y += 20;
            if (y >= 130) {
                y = 50;
                x += 145;
            }
            one.value.forEach(function (v) {
                if (v.name != '生命' && v.name != '攻击' && v.name != '防御') v.value = v.value.toFixed(2);
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
            if (!one.name.endsWith('花费') && one.name != '链接数量' && one.name != '子弹数量' &&
                !one.name.endsWith('比率') && !one.name.endsWith('等级') && !one.name.endsWith('数量')
            ) one.value = one.value.toFixed(2);
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
            core.drawLine(ctx, 300, 110, 300 + (ori.damage / core.status.totalDamage || 0) * 110, 110, '#f77', 2);
            core.drawLine(ctx, 300, 145, 300 + (ori.killed / core.status.totalKilled || 0) * 110, 145, '#f77', 2);
            core.setTextAlign(ctx, 'right');
            core.fillText(ctx, ((ori.damage / core.status.totalDamage || 0) * 100).toFixed(2) + '%', 410, 123, '#fcc', '12px Arial');
            core.fillText(ctx, ((ori.killed / core.status.totalKilled || 0) * 100).toFixed(2) + '%', 410, 157, '#fcc', '12px Arial');
        }
        // 升级 卖出 等级最大化
        if (!tower.max || tower.max > tower.level) core.fillRect(ctx, 10, 130, 80, 20, flags.upgrade ? '#dfd' : '#9f9');
        core.fillRect(ctx, 100, 130, 80, 20, flags.sell ? '#fcc' : '#f77');
        core.fillRect(ctx, 190, 130, 80, 20, flags.maxUp ? '#ffa' : '#ff0');
        core.setTextAlign(ctx, 'center');
        if (!tower.max || tower.max > tower.level) core.fillBoldText(ctx, '升级', 50, 146, '#fff', '#000', '16px Arial');
        core.fillBoldText(ctx, '卖出', 140, 146, '#fff', '#000', '16px Arial');
        if (!tower.max || tower.max > tower.level) core.fillText(ctx, Math.round(tower.cost), 50, 165, '#fff', '16px Arial');
        core.fillText(ctx, Math.round(tower.haveCost * (tower.pauseBuild ? 1 : 0.6)), 140, 165, '#fff', '16px Arial');
        core.fillBoldText(ctx, '一键升级', 230, 146, '#fff', '#000');
    }
};

////// 绘制建造界面 //////
defense.prototype.drawConstructor = function (ctx, type) {
    if (main.replayChecking) return;
    if (!core.domStyle.isVertical) this._drawConstructor_drawHorizon(ctx, type);
    else this._drawConstructor_drawVertical(ctx, type);
};

defense.prototype._drawConstructor_drawHorizon = function (ctx, type) {
    if (!type || type == 'statistics') {
        // 绘制当前总伤害 总击杀数
        core.fillText(ctx, '伤害量：' + core.formatBigNumber(core.status.totalDamage || 0), 5, 90, '#fcc', '14px Arial');
        core.fillText(ctx, '杀敌数：' + core.status.totalKilled, 5, 110, '#fcc', '14px Arial');
        // 之后的几波怪物
        var allEnemy = (core.status.thisMap || {}).enemys || core.initMonster(core.status.floorId);
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
                var hp = core.material.enemys[now[0]].hp * (1 + (i * i) / 225);
                if (core.status.floorId == 'MT1') hp /= 4;
                if (core.status.floorId == 'MT2') hp *= core.material.enemys[now[0]].notBomb ? 2 : 4;
                if (core.status.floorId === 'MT0' || core.status.floorId === 'MT1') {
                    if (flags.hard === 1) {
                        hp *= 1.5;
                    }
                }
                hp = core.formatBigNumber(hp);
                core.fillText(ctx, hp, 90, 172 + 30 * (i - wave), '#fff', '13px Arial');
                core.setTextAlign(ctx, 'left');
            }
        } else if (core.status.event.id == 'enemyDetail') {
            // 绘制这一波怪物的详细信息
            var wave = core.status.event.data;
            if (typeof wave == 'number') {
                if (wave >= 0) {
                    var now = allEnemy[wave];
                    if (!now) return;
                    var enemy = core.material.enemys[now[0]];
                    var hp = enemy.hp * (1 + (wave * wave) / 225);
                    var money = enemy.money * (1 + (wave * wave) / 4900) * (2 - flags.hard);
                    var speed = enemy.speed;
                    if (core.status.floorId == 'MT1') {
                        money /= 2;
                        hp /= 4;
                    }
                    if (core.status.floorId == 'MT2') {
                        hp *= enemy.notBomb ? 2 : 4;
                        money *= 4;
                        if (enemy.notBomb) speed /= 1.5;
                        if (!Number.isInteger(speed)) speed = speed.toFixed(2);
                    }
                    if (core.status.floorId === 'L3') money *= 1.5;
                    if (core.status.floorId === 'MT0' || core.status.floorId === 'MT1') {
                        if (flags.hard === 1) {
                            hp *= 1.5;
                            money *= 1.5;
                        }
                    }
                    hp = core.formatBigNumber(hp);
                    core.setTextAlign(ctx, 'center');
                    core.fillText(ctx, '第' + (wave + 1) + '波', 64, 133, '#fff', '16px Arial');
                    core.drawIcon(ctx, now[0], 32, 135, 32, 32);
                    core.setTextAlign(ctx, 'left');
                    core.fillText(ctx, '×' + now[1], 64, 158, '#fff', '16px Arial');
                    core.fillText(ctx, '生命：' + hp, 5, 180, '#fff', '14px Arial');
                    core.fillText(ctx, '攻击：' + enemy.atk, 5, 200, '#fff', '14px Arial');
                    core.fillText(ctx, '防御：' + enemy.def, 5, 220, '#fff', '14px Arial');
                    core.fillText(ctx, '移速：' + speed, 5, 240, '#fff', '14px Arial');
                    core.fillText(ctx, '金币：' + Math.round(money), 5, 260, '#fff', '14px Arial');
                }
            }
        }
    }
    // 直接下一波
    if (type == 'interval' || !type) {
        if (!flags.__starting__) core.fillRect(ctx, 10, 275, 59, 25, [100, 255, 100, 1]);
        else core.fillRect(ctx, 10, 275, 59, 25, [100, 100, 100, 1]);
        core.setTextAlign(ctx, 'center');
        core.fillText(ctx, core.defense.forceInterval && core.defense.forceInterval > 0 ? Math.floor(core.defense.forceInterval / 1000) + 's' : '下一波', 40, 292, '#000', '14px Arial');
        // 自动
        core.fillRect(ctx, 74, 275, 50, 25, [255, 255, 100, 1]);
        core.fillText(ctx, '自动' + (flags.autoNext ? '中' : ''), 99, 292, '#000', '14px Arial');
    }
    if (!type) {
        // 加速减速
        core.setTextAlign(ctx, 'left');
        core.fillText(ctx, '←', 15, 316, '#fff', '18px Arial');
        core.setTextAlign(ctx, 'right');
        core.fillText(ctx, '→', 115, 316, '#fff', '18px Arial');
        core.setTextAlign(ctx, 'center');
        core.fillText(ctx, core.defense.speed + '倍速', 64, 316, '#fff', '15px Arial');
        // 各个防御塔
        Object.keys(core.defense.towers).forEach(function (one, i) {
            if (core.status.floorId == 'L1' && i >= 3) return;
            if (core.status.floorId == 'L2' && i >= 6) return;
            if (core.status.floorId == 'L3' && i >= 9) return;
            var line = Math.floor(i / 3);
            var list = i % 3;
            core.drawIcon(ctx, one, 9 + 37 * list, 325 + 32 * line, 32, 32);
        });
    }
};

defense.prototype._drawConstructor_drawVertical = function (ctx, type) {
    // 之后的几波怪物
    var allEnemy = (core.status.thisMap || {}).enemys || core.initMonster(core.status.floorId);
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
            var hp = core.material.enemys[now[0]].hp * (1 + (i * i) / 225);
            if (core.status.floorId == 'MT1') hp /= 4;
            if (core.status.floorId == 'MT2') hp *= core.material.enemys[now[0]].notBomb ? 2 : 4;
            if (core.status.floorId === 'MT0' || core.status.floorId === 'MT1') {
                if (flags.hard === 1) {
                    hp *= 1.5;
                }
            }
            hp = core.formatBigNumber(hp);
            core.fillText(ctx, hp, 90 + Math.floor((i - wave) / 2) * 120, 92 + 30 * ((i - wave) % 2), '#fff', '13px Arial');
            core.setTextAlign(ctx, 'left');
        }
    } else if (core.status.event.id == 'enemyDetail') {
        // 绘制这一波怪物的详细信息
        var wave = core.status.event.data;
        if (typeof wave == 'number') {
            if (wave >= 0) {
                var now = allEnemy[wave];
                if (!now) return;
                var enemy = core.material.enemys[now[0]];
                var hp = enemy.hp * (1 + (wave * wave) / 225);
                var money = enemy.money * (1 + (wave * wave) / 4900) * (2 - flags.hard);
                var speed = enemy.speed;
                if (core.status.floorId == 'MT1') {
                    money /= 2;
                    hp /= 4;
                }
                if (core.status.floorId == 'MT2') {
                    hp *= enemy.notBomb ? 2 : 4;
                    money *= 4;
                    if (enemy.notBomb) speed /= 1.5;
                    if (!Number.isInteger(speed)) speed = speed.toFixed(2);
                }
                if (core.status.floorId === 'L3') money *= 1.5;
                if (core.status.floorId === 'MT0' || core.status.floorId === 'MT1') {
                    if (flags.hard === 1) {
                        hp *= 1.5;
                        money *= 1.5;
                    }
                }
                hp = core.formatBigNumber(hp);
                core.setTextAlign(ctx, 'center');
                core.fillText(ctx, '第' + (wave + 1) + '波', 64, 50, '#fff', '16px Arial');
                core.drawIcon(ctx, now[0], 140, 28, 32, 32);
                core.setTextAlign(ctx, 'left');
                core.fillText(ctx, '×' + now[1], 175, 50, '#fff', '16px Arial');
                core.fillText(ctx, '生命：' + hp, 5, 75, '#fff', '14px Arial');
                core.fillText(ctx, '攻击：' + enemy.atk, 5, 95, '#fff', '14px Arial');
                core.fillText(ctx, '防御：' + enemy.def, 5, 115, '#fff', '14px Arial');
                core.fillText(ctx, '移速：' + speed, 130, 75, '#fff', '14px Arial');
                core.fillText(ctx, '金币：' + Math.round(money), 130, 95, '#fff', '14px Arial');
            }
        }
    }
    // 绘制当前总伤害 总击杀数
    core.fillText(ctx, '伤害量：' + core.formatBigNumber(core.status.totalDamage || 0), 5, 142, '#fcc', '14px Arial');
    core.fillText(ctx, '杀敌数：' + core.status.totalKilled, 5, 162, '#fcc', '14px Arial');
    // 直接下一波
    // 加速减速
    core.setTextAlign(ctx, 'left');
    core.fillText(ctx, '←', 250, 157, '#fff', '18px Arial');
    core.setTextAlign(ctx, 'right');
    core.fillText(ctx, '→', 355, 157, '#fff', '18px Arial');
    core.setTextAlign(ctx, 'center');
    core.fillText(ctx, core.defense.speed + '倍速', 302, 159, '#fff', '15px Arial');
    if (!flags.__starting__) core.fillRect(ctx, 120, 140, 60, 25, [100, 255, 100, 1]);
    else core.fillRect(ctx, 120, 140, 60, 25, [100, 100, 100, 1]);
    core.fillText(ctx, core.defense.forceInterval && core.defense.forceInterval > 0 ? Math.floor(core.defense.forceInterval / 1000) + 's' : '下一波', 150, 158, '#000', '14px Arial');
    // 自动
    core.fillRect(ctx, 185, 140, 50, 25, [255, 255, 100, 1]);
    core.fillText(ctx, '自动' + (flags.autoNext ? '中' : ''), 210, 158, '#000', '14px Arial');
    // 各个防御塔
    Object.keys(core.defense.towers).forEach(function (one, i) {
        if (core.status.floorId == 'L1' && i >= 3) return;
        if (core.status.floorId == 'L2' && i >= 6) return;
        if (core.status.floorId == 'L3' && i >= 9) return;
        var line = Math.floor(i / 4);
        var list = i % 4;
        core.drawIcon(ctx, one, 260 + 37 * list, 30 + 37 * line, 32, 32);
    });
    // 暂停按钮
    core.fillRect(ctx, 371, 140, 32, 25, [100, 255, 100, 1]);
    core.fillText(ctx, flags.__pause__ ? '继续' : '暂停', 387, 158, '#000', '14px Arial');
};

////// 防御塔攻击特效 //////
defense.prototype.setTowerEffect = function (ctx, speed) {
    ctx.totalTime = ctx.interval = 12 / speed;
    ctx.canvas.style.opacity = 1;
};

//////////// 防御塔 锁定怪物相关 ////////////

////// 获取距离基地最近的攻击对象 //////
defense.prototype.getClosestEnemy = function (x, y, n) {
    n = n || 1;
    var tower = core.status.realTower[x + ',' + y];
    if (!tower) return core.drawTip('不存在的防御塔！');
    if (!tower.canReach) core.getCanReachBlock(x, y);
    var canReach = tower.canReach;
    var enemy = this.getSortedEnemy(canReach);
    if (enemy.length == 0) return [];
    var all = core.status.enemys.enemys;
    // 获取应当检索的怪物数组
    var need = all[enemy[n - 1] || enemy[enemy.length - 1]].to;
    var needCheck = enemy.filter(function (v) {
        return all[v].to === need;
    });
    if (needCheck.length == 1) return enemy.splice(0, n);
    var route = core.status.thisMap.route;
    var l = {};
    needCheck.forEach(function (one) {
        var enemy = all[one];
        if (!enemy) return;
        var dx = enemy.x - route[enemy.to][0],
            dy = enemy.y - route[enemy.to][1];
        l[one] = dx * dx + dy * dy;
    });
    needCheck.sort(function (a, b) {
        return l[a] - l[b];
    });
    var x = enemy.filter(function (v) {
        return all[v].to > need;
    });
    return x.concat(needCheck.splice(0, n - x.length));
};

////// 获取排序过的怪物列表 //////
defense.prototype.getSortedEnemy = function (canReach) {
    var all = core.status.enemys.enemys;
    if (this.sortedEnemy)
        return this.sortedEnemy.filter(function (one) {
            return ((all[one] || {}).to || 0) - 1 in canReach;
        });
    this.sortedEnemy = Object.keys(all).sort(function (a, b) {
        return all[b].to - all[a].to;
    });
    return this.sortedEnemy.filter(function (one) {
        return all[one].to - 1 in canReach;
    });
};

////// 获得在一定范围内的所有怪物 //////
defense.prototype.getEnemyInBombRange = function (x, y, range) {
    // 由于不会有范围内格子的缓存 所以直接遍历所有怪物
    var all = core.status.enemys.enemys;
    return Object.keys(all).filter(function (one) {
        var enemy = all[one];
        var dx = enemy.x - x,
            dy = enemy.y - y;
        return dx * dx + dy * dy <= range * range;
    });
};

////// 获得一条线上的所有怪物 //////
defense.prototype.getEnemyInLine = function (x1, y1, x2, y2) {
    // 直接遍历就行
    var all = core.status.enemys.enemys;
    return Object.keys(all).filter(function (one) {
        var enemy = all[one];
        var nx = enemy.x,
            ny = enemy.y;
        if ((x1 < nx - 0.33 && x2 < nx - 0.33) || (x1 > nx + 0.33 && x2 > nx + 0.33) ||
            (y1 < ny - 0.33 && y2 < ny - 0.33) || (y1 > ny + 0.33 && y2 > ny + 0.33)) return;
        for (var time = 1; time <= 2; time++) {
            // 左下右上
            if (time == 1) {
                var loc1 = [nx - 0.33, ny + 0.33],
                    loc2 = [nx + 0.33, ny - 0.33];
                var n1 = ((y2 - y1) / (x2 - x1)) * (loc1[0] - x1) + y1 - loc1[1],
                    n2 = ((y2 - y1) / (x2 - x1)) * (loc2[0] - x1) + y1 - loc2[1];
                if (n1 * n2 <= 0) return true;
                else return false;
            } else {
                // 左上右下
                var loc1 = [x - 0.33, y - 0.33],
                    loc2 = [x + 0.33, y + 0.33];
                var n1 = ((y2 - y1) / (x2 - x1)) * (loc1[0] - x1) + y1 - loc1[1],
                    n2 = ((y2 - y1) / (x2 - x1)) * (loc2[0] - x1) + y1 - loc2[1];
                if (n1 * n2 <= 0) return true;
                else return false;
            }
        }
    });
};

////// 获得在范围内的距离中心最近的怪物 //////
defense.prototype.getClosestEnemyInRange = function (x, y, range, ignore) {
    // 遍历吧，没什么好方法
    var enemys = core.status.enemys.enemys;
    var closest, l;
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

////// 获得士兵塔出兵位置 //////
defense.prototype.getBarrackBlock = function (x, y) {
    // 检测四周
    var canLoc = [];
    if (x - 1 >= 0 && core.getBgNumber(x - 1, y) == '300') canLoc.push([x - 1, y]);
    if (x + 1 < 13 && core.getBgNumber(x + 1, y) == '300') canLoc.push([x + 1, y]);
    if (y - 1 >= 0 && core.getBgNumber(x, y - 1) == '300') canLoc.push([x, y - 1]);
    if (y + 1 < 13 && core.getBgNumber(x, y + 1) == '300') canLoc.push([x, y + 1]);
    if (canLoc.length == 0) return null;
    // 转换成索引形式
    var route = core.status.thisMap.route;
    canLoc = canLoc.map(function (loc) {
        // 因为是数组 不能用indexOf之类的方法......遍历+core.same
        for (var i in route) {
            if (core.same(loc, route[i])) return i;
        }
    });
    // 返回索引最大的 因为要在距离基地最近的地方出兵
    canLoc.sort(function (a, b) {
        return b - a;
    });
    return canLoc[0];
};

////// 获得地雷塔可以攻击到的格子 //////
defense.prototype.getMineBlock = function (x, y) {
    var route = core.status.thisMap.route;
    var canReach = {};
    for (var nx = x - 1; nx <= x + 1; nx++) {
        if (nx < 0 || nx > 14) continue;
        for (var ny = y - 1; ny <= y + 1; ny++) {
            if (ny < 0 || ny > 14) continue;
            for (var i = 0; i < route.length - 1; i++) {
                if (core.same(route[i], [nx, ny])) {
                    canReach[i] = true;
                    break;
                }
            }
        }
    }
    core.status.realTower[x + ',' + y].canReach = canReach;
};

////// 获得防御塔能攻击到的格子 //////
defense.prototype.getCanReachBlock = function (x, y) {
    var tower = core.status.realTower[x + ',' + y];
    var route = core.status.thisMap.route;
    var canReach = {};
    // 遍历所有格子 检测是否能打到
    route.forEach(function (loc, i) {
        var dx = loc[0] - x,
            dy = loc[1] - y;
        if (dx * dx + dy * dy <= tower.range * tower.range) {
            canReach[i] = true;
        }
    });
    core.status.realTower[x + ',' + y].canReach = core.clone(canReach);
};

////// 勇士死亡 //////
defense.prototype.heroDie = function (hero) {
    core.returnCanvas(hero);
    core.returnCanvas(hero + '_healthBar', 'healthBar');
    delete core.status.enemys.hero[hero];
    core.status.enemys.hero.cnt--;
};

//////////// 录像 相关 ////////////
defense.prototype._replay_placeTower = function (action) {
    if (typeof action != 'string' || !action.includes('place:')) return false;
    // 获得放置信息
    var detail = action.split(':');
    var tower = detail[3];
    var x = parseInt(detail[1]),
        y = parseInt(detail[2]);
    try {
        var success = place(x, y);
        if (!success) {
            var n = 0;
            while (true) {
                if (!core.status.replay.errorFrame) core.status.replay.errorFrame = 0;
                core.status.replay.errorFrame++;
                n++;
                core.defense._replay_doAnimationFrame(1);
                success = place(x, y);
                if (success) break;
                if (n > 60) { return false; }
            }
        }

        function place (x, y) {
            if (core.status.hero.money < core.defense.towers[tower].cost) return false;
            if (tower == 'destroy') {
                var t = core.status.towers[x + ',' + y];
                if (!t) return false;
                if (t.type != 'bomb') return false;
                if (t.level < 5) return false;
            }
            core.status.towers[x + ',' + y] = core.clone(core.defense.towers[tower]);
            var now = core.status.towers[x + ',' + y];
            now.x = parseInt(x);
            now.y = parseInt(y);
            now.level = 1;
            now.killed = 0;
            now.damage = 0;
            now.expLevel = 0;
            now.exp = 0;
            now.type = tower;
            now.haveCost = now.cost;
            now.pauseBuild = true;
            core.status.hero.money -= now.cost;
            core.status.event.data = null;
            core.status.event.id = null;
            core.unlockControl();
            core.saveRealStatusInCache(x, y);
            core.initTowerSprite(now);
            core.getChainLoc();
            core.getFreezeLoc();
            return true;
        }
        core.replay();
    } catch (e) {
        main.log(e);
        return false;
    }
    return true;
};

defense.prototype._replay_upgradeTower = function (action) {
    if (typeof action != 'string' || !action.includes('upgrade:')) return false;
    var detail = action.split(':');
    var x = parseInt(detail[1]),
        y = parseInt(detail[2]);
    try {
        var success = core.upgradeTower(x, y);
        if (!success) {
            var n = 0;
            while (true) {
                if (!core.status.replay.errorFrame) core.status.replay.errorFrame = 0;
                core.status.replay.errorFrame++;
                n++;
                core.defense._replay_doAnimationFrame(1);
                success = core.upgradeTower(x, y);
                if (success) break;
                if (n > 60) { return false; }
            }
        }
        core.replay();
    } catch (e) {
        main.log(e);
        return false;
    }
    return true;
};

defense.prototype._replay_sellTower = function (action) {
    if (typeof action != 'string' || !action.includes('sell:')) return false;
    var detail = action.split(':');
    var x = parseInt(detail[1]),
        y = parseInt(detail[2]);
    try {
        var success = core.sellTower(x, y);
        if (!success) {
            var n = 0;
            while (true) {
                if (!core.status.replay.errorFrame) core.status.replay.errorFrame = 0;
                core.status.replay.errorFrame++;
                n++;
                core.defense._replay_doAnimationFrame(1);
                success = core.sellTower(x, y);
                if (success) break;
                if (n > 60) { return false; }
            }
        }
        core.replay();
    } catch (e) {
        main.log(e);
        return false;
    }
    return true;
};

defense.prototype._replay_nextWave = function (action) {
    if (action != 'nextWave') return false;
    try {
        core.startMonster(core.status.floorId);
        core.replay();
    } catch (e) {
        main.log(e);
        return false;
    }
    return true;
};

defense.prototype._replay_wait = function (action) {
    if (!parseInt(action)) return false;
    var rounds = parseInt(action);
    var now = 0;
    var to = core.status.replay.toReplay[0];
    rounds += parseInt(to) ? 0 : 1;
    for (var one in core.status.towers) {
        core.status.towers[one].pauseBuild = false;
        core.status.realTower[one].pauseBuild = false;
    }
    if (!core.status.replay.errorFrame) core.status.replay.errorFrame = 0;
    if (rounds - core.status.replay.errorFrame > 0) {
        rounds -= core.status.replay.errorFrame;
        core.status.replay.errorFrame = 0;
    } else {
        core.status.replay.errorFrame -= rounds;
        core.replay();
        return true;
    }
    if (!main.replayChecking) {
        var interval = window.setInterval(function () {
            now++;
            try {
                core.defense._replay_doAnimationFrame(0);
                if (now === rounds) {
                    clearInterval(interval);
                    core.replay();
                }
            } catch (e) {
                main.log(e);
                clearInterval(interval);
                return false;
            }
        }, 1);
    } else {
        while (true) {
            now++;
            try {
                core.defense._replay_doAnimationFrame(1);
                if (now === rounds) break;
            } catch (e) {
                main.log(e);
                return false;
            }
        }
        core.replay();
        return true;
    }
    return true;
};

defense.prototype._replay_doAnimationFrame = function (i) {
    core.control.renderFrameFuncs.forEach(function (b) {
        if (b.func) {
            try {
                core.doFunc(b.func, core.control, 0, i);
            } catch (e) {
                main.log(e);
                flags.error = e;
                core.drawTip('录像运行出错！错误信息请在控制台或怪物手册查看');
                core.pauseReplay();
            }
        }
    });
};

defense.prototype.pushActionToRoute = function (action) {
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

////////////  绘制选关界面  ////////////
defense.prototype.openAllMaps = function () {
    this._drawAllMaps_draw();
    core.insertAction([
        {
            'type': 'while',
            'condition': 'true',
            'data': [
                { 'type': 'function', 'function': 'function() { core.defense._drawAllMaps_drawText(); }' },
                { 'type': 'wait' },
                { 'type': 'function', 'function': 'function() { core.defense._drawAllMaps_actions(); }' }
            ]
        },
        {
            'type': 'function', 'function': "function () { core.deleteCanvas('back'); core.deleteCanvas('mapCtx');" +
                " core.deleteCanvas('mapTextCtx'); core.deleteCanvas('modeCtx'); core.clearUIEventSelector();}"
        }
    ]);
};

defense.prototype.getAllMaps = function (infinite) {
    return this.defensedata.getAllMaps(infinite);
};

defense.prototype._drawAllMaps_draw = function () {
    if (main.replayChecking) return;
    if (core.defense.type == 'infinite') var all = this.getAllMaps(true);
    else var all = this.getAllMaps(false);
    var ctx = core.createCanvas('back', 0, 0, 416, 416, 150);
    var mapTextCtx = core.createCanvas('mapTextCtx', 0, 0, 208 + Object.keys(all).length * 150, 40, 160);
    var mapCtx = core.createCanvas('mapCtx', 100, 40, 316, 376, 155);
    var modeCtx = core.createCanvas('modeCtx', 0, 40, 100, 376, 155);
    core.clearMap(ctx);
    core.drawWindowSkin('winskin.png', ctx, 0, 0, 416, 40);
    core.drawWindowSkin('winskin.png', ctx, 0, 40, 100, 376);
    core.drawWindowSkin('winskin.png', ctx, 100, 40, 316, 376);
    mapTextCtx.canvas.className = 'chooseMap';
    mapTextCtx.shadowColor = '#000';
    mapTextCtx.shadowBlur = 2;
    mapTextCtx.shadowOffsetX = 1;
    mapTextCtx.shadowOffsetY = 1;
    modeCtx.shadowColor = '#000';
    modeCtx.shadowBlur = 2;
    modeCtx.shadowOffsetX = 1;
    modeCtx.shadowOffsetY = 1;
    core.setTextAlign(mapTextCtx, 'center');
    core.setTextAlign(modeCtx, 'center');
    mapCtx.shadowColor = '#fff';
    mapCtx.shadowBlur = 5;
};

defense.prototype._drawAllMaps_drawText = function () {
    if (main.replayChecking) return;
    core.clearMap('mapCtx');
    core.clearMap('mapTextCtx');
    core.clearMap('modeCtx');
    var index = this.mapIndex;
    if (core.defense.type == 'infinite') var all = this.getAllMaps(true);
    else var all = this.getAllMaps(false);
    var maps = Object.keys(all).sort(function (a, b) {
        return all[a].split('_')[1] - all[b].split('_')[1];
    });
    maps.forEach(function (map, i) {
        var text = all[map].split('_')[0];
        if (i == index) text = '<  ' + text + '  >';
        core.fillText('mapTextCtx', text, 208 + 150 * i, 27, '#fff', '20px Arial');
    });
    var ctx = core.dymCanvas.mapCtx;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#fff';
    core.drawThumbnail(maps[index], null, { x: 5, y: 5, ctx: 'mapCtx', size: 306 });
    ctx.shadowBlur = 0;
    var text = core.status.maps[maps[index]].description;
    core.drawTextContent('mapCtx', text, { left: 5, top: 315, maxWidth: 306, fontSize: 16 });
    core.fillText('modeCtx', '闯关模式', 50, 120, '#fff', '18px Arial');
    core.fillText('modeCtx', '无尽模式', 50, 250, '#fff', '18px Arial');
    if (this.type == 'battle') core.drawUIEventSelector(1, 'winskin.png', 3, 140, 94, 30, 160);
    if (this.type == 'infinite') core.drawUIEventSelector(1, 'winskin.png', 3, 270, 94, 30, 160);
};

defense.prototype._drawAllMaps_actions_keyboard = function (keycode) {
    if (core.defense.type == 'infinite') var all = this.getAllMaps(true);
    else var all = this.getAllMaps(false);
    switch (keycode) {
        case 37:
            this._drawAllMaps_changeMap('left');
            break;
        case 39:
            this._drawAllMaps_changeMap('right');
            break;
        case 32:
        case 13:
            this.floorId = Object.keys(all)[this.mapIndex];
            core.insertAction([{ type: 'break', n: 1 }]);
            break;
        case 38:
            this._drawAllMaps_changeMap('up');
            break;
        case 40:
            this._drawAllMaps_changeMap('down');
            break;
    }
};

defense.prototype._drawAllMaps_actions_click = function (px, py) {
    if (core.defense.type == 'infinite') var all = this.getAllMaps(true);
    else var all = this.getAllMaps(false);
    if (py <= 30 && px >= 208) {
        this._drawAllMaps_changeMap('right');
        return;
    }
    if (py <= 30 && px <= 208) {
        this._drawAllMaps_changeMap('left');
        return;
    }
    if (px <= 100 && py <= 223) {
        this._drawAllMaps_changeMap('up');
        return;
    }
    if (px <= 100 && py >= 223) {
        this._drawAllMaps_changeMap('down');
        return;
    }
    this.floorId = Object.keys(all)[this.mapIndex];
    core.insertAction([{ type: 'break', n: 1 }]);
    return;
};

defense.prototype._drawAllMaps_actions = function () {
    if (flags.type === 0) return this._drawAllMaps_actions_keyboard(flags.keycode);
    return this._drawAllMaps_actions_click(flags.px, flags.py);
};

defense.prototype._drawAllMaps_changeMap = function (dir) {
    if (dir === 'right') {
        if (this.mapIndex < Object.keys(this.getAllMaps()).length - 1) {
            this.mapIndex++;
            core.relocateCanvas('mapTextCtx', -150, 0, true);
            this._drawAllMaps_drawText();
        }
    }
    if (dir === 'left') {
        if (this.mapIndex > 0) {
            this.mapIndex--;
            core.relocateCanvas('mapTextCtx', 150, 0, true);
            this._drawAllMaps_drawText();
        }
    }
    if (dir === 'up') {
        if (this.type == 'battle') return;
        this.type = 'battle';
        this.mapIndex = 0;
        this._drawAllMaps_draw();
    }
    if (dir === 'down') {
        if (this.type == 'infinite') return;
        this.type = 'infinite';
        this.mapIndex = 0;
        this._drawAllMaps_draw();
    }
};

////// 倍速相关 //////
defense.prototype.changeSpeed = function (mode) {
    var list = [1, 2, 4, 8, 10, 25, 50, 100, 1000];
    var now = list.indexOf(this.speed);
    if (mode === 'up') {
        this.speed = list[now + 1] || list[now];
        core.drawTip('切换至' + this.speed + '倍速');
    }
    if (mode === 'down') {
        if (now > 0) this.speed = list[now - 1];
        core.drawTip('切换至' + this.speed + '倍速');
    }
    core.updateStatusBar();
}

defense.prototype.pauseGame = function () {
    if (flags.__pause__) {
        for (var one in core.status.towers) {
            core.status.towers[one].pauseBuild = false;
            core.status.realTower[one].pauseBuild = false;
        }
        flags.__pause__ = false;
        core.drawTip('继续游戏');
        core.defense._drawBossHealthBar_transparent('remove');
        core.updateStatusBar();
    } else {
        flags.__pause__ = true;
        core.drawTip('游戏暂停');
        core.defense._drawBossHealthBar_transparent('add');
        core.updateStatusBar();
    }
}