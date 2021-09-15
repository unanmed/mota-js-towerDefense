/// <reference path="../runtime.d.ts" />

/* towers.js 负责各个防御塔的攻击效果 */
"use strict";

function towers () {
    this._init();
}

towers.prototype._init = function () {
    // nothing to do
}

////// 旋转炮台 //////
towers.prototype.rotateWeapon = function (pos, dx, dy) {
    if (core.defense.speed > 10) return;
    // atan2 是从X轴开始逆时针旋转, 炮塔是Y轴开始顺时针旋转, 因此交换x y坐标计算
    var deg = Math.atan2(dy, dx) / 3.1415926535 * 180 + 90;
    var transform = "rotate(" + deg + "deg)";
    core.batchDict["tower-weapon_" + pos].canvas.style.transform = transform;
}

////// 动画 //////
towers.prototype.triggerAnimate = function (elm, name) {
    if (core.defense.speed > 10) return;
    if (elm.classList.contains(name + "-odd")) {
        elm.classList.remove(name + "-odd");
        elm.classList.add(name + "-even");
    } else {
        elm.classList.remove(name + "-even");
        elm.classList.add(name + "-odd");
    }
}

////// 基础塔 //////
towers.prototype._basicAttack = function (x, y, tower, i) {
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
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            // 旋转炮塔
            core.rotateWeapon(pos, enemy.x - x, enemy.y - y);
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            var color = [255, 255 - tower.level / tower.max * 255, 255 - tower.level / tower.max * 255, 0.5]
            core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
            core.setTowerEffect(ctx, 0.5 / tower.speed);
        }
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
    if (i === 0 && core.defense.speed <= 10) {
        core.drawHealthBar(id);
        core.autoUpdateStatusBar(x, y);
    }
}

/////// 机关枪 //////
towers.prototype._gunAttack = function (x, y, tower, i) {
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
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            core.rotateWeapon(pos, enemy.x - x, enemy.y - y);
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            var color = [255, 255 - tower.level / tower.max * 255, 255 - tower.level / tower.max * 255, 0.4]
            core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
            core.setTowerEffect(ctx, 0.25 / tower.speed);
        }
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
    if (i === 0 && core.defense.speed <= 10) {
        core.drawHealthBar(id);
        core.autoUpdateStatusBar(x, y);
    }
}

////// 炸弹塔 //////
towers.prototype._bombAttack = function (x, y, tower, i) {
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
    enemy.forEach(function (one) {
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
        if (i === 0 && core.defense.speed <= 10)
            core.drawHealthBar(one);
    });
    core.playSound('bomb.mp3');
    // 绘制攻击动画
    core.expLevelUp(x, y);
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            core.rotateWeapon(pos, nx - x, ny - y);
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            ctx.filter = 'blur(0px)';
            var color = [255, 150 - tower.level / tower.max * 150, 150 - tower.level / tower.max * 150, 0.5];
            core.drawLine(ctx, x * 32 + 16, y * 32 + 16, nx * 32 + 16, ny * 32 + 16, color, 2);
            color = [255, 100 - tower.level / tower.max * 100, 100 - tower.level / tower.max * 100, 0.5];
            ctx.filter = 'blur(3px)';
            core.fillCircle(ctx, nx * 32 + 16, ny * 32 + 16, tower.explode * 32, color);
            core.setTowerEffect(ctx, 0.6 / tower.speed);
        }
        core.autoUpdateStatusBar(x, y);
    }
}

////// 激光塔 //////
towers.prototype._laserAttack = function (x, y, tower, i) {
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
    enemy.forEach(function (one) {
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
        if (i === 0 && core.defense.speed <= 10)
            core.drawHealthBar(one);
    });
    core.playSound('laser.mp3');
    core.expLevelUp(x, y);
    // 绘制攻击动画
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            core.rotateWeapon(pos, dx, dy);
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            dx *= 32;
            dy *= 32;
            var color = [170 + tower.level / tower.max * 85, 255 - tower.level / tower.max * 255, 170 + tower.level / tower.max * 85, 0.5];
            core.drawLine(ctx, x * 32 + 16, y * 32 + 16, x * 32 + 16 + dx * 13, y * 32 + 16 + dy * 13, color, 3);
            core.setTowerEffect(ctx, 1);
        }
        core.autoUpdateStatusBar(x, y);
    }
}

////// 闪电塔 //////
towers.prototype._teslaAttack = function (x, y, tower, j) {
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
    core.playSound('tesla.mp3');
    if (j === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            core.drawLine(ctx, x * 32 + 16, y * 32, all[enemys[0]].x * 32 + 16,
                all[enemys[0]].y * 32 + 16, [255, 255, 255, 0.6], 2);
            core.setTowerEffect(ctx, 0.64 / tower.speed);
        }
    }
    enemys.forEach(function (one, i) {
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
        if (j === 0) {
            if (i != enemys.length - 1 && !main.replayChecking) {
                var next = all[enemys[i + 1]];
                var nx = now.x * 32 + 16,
                    ny = now.y * 32 + 16,
                    tx = next.x * 32 + 16,
                    ty = next.y * 32 + 16;
                core.drawLine(ctx, nx, ny, tx, ty, [255, 255, 255, 0.6], 2);
            }
        }
        if (now.hp <= 0) {
            core.status.towers[x + ',' + y].killed++;
            return core.enemyDie(one);
        }
        if (j === 0 && core.defense.speed <= 10)
            core.drawHealthBar(one);
    });
    core.expLevelUp(x, y);
    if (j === 0 && core.defense.speed <= 10)
        core.autoUpdateStatusBar(x, y);
}

////// 散射塔 //////
towers.prototype._scatterAttack = function (x, y, tower, i) {
    x = parseInt(x);
    y = parseInt(y);
    // 打距离基地最近的几个怪物
    var enemy = core.getClosestEnemy(x, y, tower.cnt);
    if (enemy.length === 0) return;
    var all = core.status.enemys.enemys;
    var nx = x * 32 + 16,
        ny = y * 32 + 16;
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            var color = [255, 255 - tower.level / tower.max * 150, 255 - tower.level / tower.max * 150, 0.5];
            core.setTowerEffect(ctx, 0.64 / tower.speed);
        }
    }
    enemy.forEach(function (one) {
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
        if (i === 0 && core.defense.speed <= 10)
            core.drawHealthBar(one);
    });
    core.expLevelUp(x, y);
    core.playSound('gun.mp3');
    if (i === 0 && core.defense.speed <= 10)
        core.autoUpdateStatusBar(x, y);
}

/////// 冰冻塔 //////
towers.prototype.getFreezeLoc = function () {
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
}

////// 士兵塔 //////
towers.prototype._barrackAttack = function (x, y, tower, i) {
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
    var id = core.getUnitId('hero_', core.status.enemys.hero);
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
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            var weaponCanvas = core.batchDict["tower-weapon_" + pos].canvas;
            core.triggerAnimate(weaponCanvas, "rotate");
        }
    }
    core.expLevelUp(x, y);
    if (i === 0 && core.defense.speed <= 10)
        core.autoUpdateStatusBar(x, y);
}

////// 狙击手 //////
towers.prototype._sniperAttack = function (x, y, tower, i) {
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
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            core.rotateWeapon(pos, enemy.x - x, enemy.y - y);
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            var color = [255, 150 - tower.level / tower.max * 150, 150 - tower.level / tower.max * 150, 0.7];
            core.drawLine(ctx, x * 32 + 16, y * 32 + 16, enemy.x * 32 + 16, enemy.y * 32 + 16, color, 2);
            core.setTowerEffect(ctx, 1 / tower.speed);
        }
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
        return;
    }
    if (i === 0 && core.defense.speed <= 10) {
        core.drawHealthBar(id);
        core.autoUpdateStatusBar(x, y);
    }
}

////// 地雷塔 //////
towers.prototype._mineAttack = function (x, y, tower) {
    x = parseInt(x);
    y = parseInt(y);
    // 往地上铺地雷 每个图块最多4个
    if (!tower.canReach) {
        core.getMineBlock(x, y);
        tower = core.status.realTower[x + ',' + y];
    }
    // 排序一下 先在距离基地进的地方放地雷
    var canReach = Object.keys(tower.canReach).sort(function (a, b) { return b - a; });
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
            var ii = canReach[i];
            if (mine[ii].cnt != 4) return console.error('地雷塔在没有放满的情况下进行了替换！');
            // 替换地雷
            if (mine[ii][1].atk < tower.mine.atk) {
                mine[ii][1] = { atk: tower.mine.atk, level: tower.level };
                index = ii;
                break;
            }
            if (mine[ii][2].atk < tower.mine.atk) {
                mine[ii][2] = { atk: tower.mine.atk, level: tower.level };
                index = ii;
                break;
            }
            if (mine[ii][3].atk < tower.mine.atk) {
                mine[ii][3] = { atk: tower.mine.atk, level: tower.level };
                index = ii;
                break;
            }
            if (mine[ii][4].atk < tower.mine.atk) {
                mine[ii][4] = { atk: tower.mine.atk, level: tower.level };
                index = ii;
                break;
            }
        }
    }
    // 绘制地雷 acquire一个32×32的画布就行了 优化性能
    if (!main.replayChecking) {
        core.defense._drawMine(index);
    }
    core.expLevelUp(x, y);
    if (core.defense.speed <= 10)
        core.autoUpdateStatusBar(x, y);
}

////// 夹击塔 //////
towers.prototype.getChainLoc = function () {
    // 先获得所有可能的夹击点
    var allTower = Object
        .values(core.status.towers)
        .filter(function (tower) { return tower.type === 'chain'; });
    var all = {};
    allTower.forEach(function (one) {
        for (var dir in core.utils.scan2) {
            var x = one.x + core.utils.scan2[dir].x,
                y = one.y + core.utils.scan2[dir].y;
            if (x < 0 || x > 12 || y < 0 || y > 12) continue;
            all[x + ',' + y] = true;
        }
    });
    var isChain = function (x, y) {
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
}

////// 震荡塔 //////
towers.prototype._destoryAttack = function (x, y, tower, i) {
    x = parseInt(x);
    y = parseInt(y);
    var pos = x + ',' + y;
    // 攻击所有怪物
    var all = core.status.enemys.enemys;
    if (!tower.canReach) core.getCanReachBlock(x, y);
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
            if (i === 0 && core.defense.speed <= 10)
                core.drawHealthBar(one);
        }
    }
    // 特效
    if (!attacked) return;
    core.playSound('destory.mp3');
    if (i === 0 && core.defense.speed <= 10) {
        if (!main.replayChecking) {
            var weaponCanvas = core.batchDict["tower-weapon_" + pos].canvas;
            core.triggerAnimate(weaponCanvas, "blast");
            var ctx = core.acquireCanvas('tower_' + x + '_' + y, 'tower');
            ctx.filter = 'blur(5px)';
            var color = [150 + tower.level / tower.max * 105, 150 - tower.level / tower.max * 100, 150 - tower.level / tower.max * 100, 0.6];
            core.fillCircle(ctx, x * 32 + 16, y * 32 + 16, (tower.range - 0.2) * 32, color);
            core.setTowerEffect(ctx, 0.5 / tower.speed);
        }
    }
    core.expLevelUp(x, y);
    if (i === 0)
        core.autoUpdateStatusBar(x, y);
}