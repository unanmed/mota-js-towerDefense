const fs = require('fs');
const vm = require('vm');

process.mainModule = {}

if (process.argv.length < 4) {
    console.log("Invalid arguments: node index.js <dirpath> <replaypath> [<silent>]");
    process.exit(6);
}

global.silent = process.argv[4] || "";
if (process.getuid && process.getuid() == 0 && global.silent == "1" ) {
    console.log("Cannot run this script with root privilege!");
    process.exit(3);
}

var dirname = process.argv[2];
var replayName = process.argv[3];

if (!dirname.endsWith("/")) dirname += "/";
var replayData = {
    hard: "",
    route: replayName
}
if (fs.existsSync(replayName))
    replayData = JSON.parse(fs.readFileSync(replayName));

global.replayData = replayData;

// ------ Define global values ------ //
(function ($) {
    var element = function () {
        this.getContext = ()=>{
            var obj = {
                canvas: new element()
            };
            ["createPattern", "translate", "drawImage", "clearRect", "rotate",
             "fillRect", "fillText", "strokeRect", "getImageData", "beginPath", "moveTo", 
             "lineTo", "stroke", "fill"]
                .forEach(v => obj[v] = () => {});
            obj.measureText = () => {return {width: 0}};
            return obj;
        };
        this.insertBefore = ()=>{};
        this.appendChild = ()=>{};
        this.removeChild = ()=>{};
        this.setAttribute = ()=>{};
        this.getAttribute = ()=>"";
        Object.defineProperty(this, "style", {
            get: ()=>{return {}},
            set: ()=>{},
        });
        this.classList = {
            contains: ()=>{},
            add: ()=>{},
            remove: ()=>{},
        }
        this.toDataURL = () => {}
    }
    var elements = {};
    $.document = {
        getElementById: (name) => elements[name] ? elements[name]: (elements[name] = new element()),
        getElementsByClassName: () => [],
        createElement: () => new element(),
        body: new element(),
        queryCommandSupported: () => {},
        addEventListener: () => {},
    }
    $.window = $;
    $.atob = function (a) {
        return Buffer.from(a, 'base64').toString('binary');
    };
    $.btoa = function (b) {
        return Buffer.from(b).toString('base64');
    }
    $.loadSource = (url) => {
        if (fs.existsSync(dirname + url))
            vm.runInThisContext(fs.readFileSync(dirname + url));
    }
    var dict = {};
    $.localStorage = {
        getItem: (name) => dict[name] == null ? null : dict[name],
        setItem: (name, value) => dict[name] = value,
        removeItem: (name) => delete dict[name],
    }
    $.location = { protocol: "https"}
    $.navigator = { userAgent: "Chrome/76.0.3809.100"}
    $._setTimeout = $.setTimeout;
    $.setTimeout = (callback, time) => time ? process.nextTick(callback) : callback();
    $._setInterval = $.setInterval;
    var _intervals = {}, _id = 0;
    $.setInterval = (callback) => {
        var id = ++_id;
        _intervals[id] = true;
        process.nextTick(() => { while (_intervals[id]) callback() });
        return id;
    }
    $.clearInterval = id => delete _intervals[id];
    $.clearTimeout = ()=>{};
    $.h5cosUrl = "";
    $.localforage = {
        setItem: () => {},
        getItem: () => {},
        iterate: () => {return () => {}},
        removeItem: () => {},
        keys: () => {}
    }
    if ($.silent == "1")
        $.console.log = ()=>{}; // ignore console.log() if called from python
})(global);

// ---------- Code -------- //

function code() {
    // ------ Load sources ------ //

    // localForage is not required
    loadSource("libs/thirdparty/lz-string.min.js");
    loadSource("libs/thirdparty/priority-queue.min.js");
    loadSource("main.js");

    // check version
    if (!main.__VERSION_CODE__ || main.__VERSION_CODE__ < 30) {
        console.log("Only support template version >= 2.6");
        process.exit(8);
    }

    main.replayChecking = true;

    main.loadMod = function (dir, modName, callback) {
        loadSource(dir + '/' + modName + (this.useCompress?".min":"") + '.js');
        callback(modName);
    }
    main.setMainTipsText = (text) => console.log(text);
    main.loadFloors = function (callback) {
        if (this.useCompress) {
            loadSource("project/floors.min.js")
        }
        else {
            for (var i = 0; i < main.floorIds.length; i++)
                loadSource('project/floors/' + main.floorIds[i] +'.js');
        }
        this.afterMainInit(callback);
    }
    function ignoreFuncs(name, values) {
        values.split(",").forEach(value => {
            core[name][value] = () => {};
        });
    }
    main.afterMainInit = function (callback) {
        core.utils.setLocalForage = function (key, value, success, error) {
            error && error();
        }
        core.utils.getLocalForage = function (key, value, success, error) {
            error && error();
        }
        core.utils.removeLocalForage = function (key, success, error) {
            error && error();
        }
        core.utils.http = function (type, url, formData, success, error) {
            error && error("HTTP Not supported for " + url);
        }
        if (core.extensions)
            core.extensions._load = function (callback) {
                callback();
            }
        
        core.loader.loadImage = function (imgName, callback, v27callback) {
            if (v27callback) {
                // module - name - callback
                console.log("Load Image: " + imgName + "/" + callback);
                v27callback(callback, {width: 32, height: 32});
            } else {
                console.log("Load Image: " + imgName);
                callback(imgName, {width: 32, height: 32});
            }
        }
        // core.loader._load = function (callback) {callback();}
        core.utils.splitImage = () => [];
        core.icons.getTilesetOffset = function (id) {
            if (typeof id == 'string') {
                // Tileset的ID必须是 X+数字 的形式
                if (!/^X\d+$/.test(id)) return null;
                id = parseInt(id.substring(1));
            }
            else if (typeof id != 'number') {
                return null;
            }
            if (id >= this.tilesetStartOffset) {
                return {"image": {width:32, height:32}, "x": 0, "y": 0};
            }
            return null;
        }
        ignoreFuncs('loader', '_loadIcons,_loadMaterials_afterLoad,loadOneMusic,loadOneSound');
        ignoreFuncs('control', 'resize,showStartAnimate,_setRequestAnimationFrame');
        ignoreFuncs('maps', '_makeAutotileEdges');
        ignoreFuncs('ui', 'clearMap');
        
        this.useCompress = false;
        callback();
    }

    main.init('play', () => console.log("------ Load Resources Done ------"));

    // check replay name
    if (replayData.name != null && replayData.name != core.firstData.name) {
        console.log("Name mismatch: " + replayData.name + " vs " + core.firstData.name);
        process.exit(7);
    }

    // ------  Rewrite logic ------ //

    ignoreFuncs('events', 'setHeroIcon,_startGame_upload,showImage,hideImage');
    ignoreFuncs('maps', 'generateGroundPattern,_drawMap_drawAll,removeGlobalAnimate,_moveDetachedBlock,drawThumbnail,_drawAutotile');
    ignoreFuncs('control', 'drawHero,_replay_save,updateDamage,autosave,saveData,_updateStatusBar,' +
        '_setToolboxIcon,setGameCanvasTranslate,showStatusBar,hideStatusBar');
    ignoreFuncs('ui', 'getContextByName,drawBackground,drawEquipbox,drawToolbox,drawTip,' +
        'textImage,drawStatusBar,deleteCanvas,relocateCanvas,resizeCanvas');
    ignoreFuncs('utils', 'setStatusBarInnerHTML');
    ignoreFuncs('plugin', 'drawLight');

    (function () {
        ["bg","event","hero","event2","fg","damage","animate","curtain","ui","data"]
            .forEach(v => core.canvas[v] = document.createElement().getContext());
        if (silent == "2") core.ui.drawTip = (text) => console.log(text + " ["+core.status.hero.loc.x+","+core.status.hero.loc.y+","+core.status.floorId+"]");
        core.enemys.nextCriticals = () => [];
        core.ui.splitLines = () => [""];
        core.ui._getRealContent = () => "";
        core.ui.drawTextContent = () => {return {offsetY: 0}};
        core.ui.drawChoices = (content, choices) => {
            core.status.event.ui = {"text": content, "choices": choices};
        }
        core.control.screenFlash = (color, time, times, callback) => {
            if (callback) callback();
        }
        core.control.playSound = (sound, pitch, callback) => {
            if (callback) callback();
        }
        core.events._action_showGif = core.doAction;
        core.maps.resizeMap = function (floorId) {
            core.bigmap.width = core.floors[floorId].width;
            core.bigmap.height = core.floors[floorId].height;
        }
        var animateBlock = core.maps.animateBlock;
        core.maps.animateBlock = function (loc, type, time, callback) {
            return animateBlock.call(core.maps, loc, type, 1, callback);
        }
        core.maps.animateSetBlock = function (number, x, y, floorId, time, callback) {
            core.setBlock(number, x, y, floorId);
            if (callback) callback();
        }
        var moveBlock = core.maps.moveBlock;
        core.maps.moveBlock = function (x, y, steps, time, keep, callback) {
            return moveBlock.call(core.maps, x, y, steps, 1, keep, callback);
        }
        core.ui.createCanvas = () => document.createElement().getContext();
        core.utils.replaceText = ()=>"";
        // ignore _uievent_
        for (var funcname in core.ui) {
            if (core.ui[funcname] instanceof Function && funcname.startsWith('_uievent_')) {
                core.ui[funcname] = ()=>{};
            }
        }
    })();

    core.control._replay_error = function (action) {
        console.log("录像文件出错...... 当前操作" + action);
        console.log("接下来10个操作" + core.status.replay.toReplay.slice(0, 10));
        console.log("已执行操作数：" + core.status.route.length);
        console.log("floorId: " + core.status.floorId);
        console.log(JSON.stringify(core.clone(
            core.status.hero, (x,y)=>(typeof y=='number') || x=='items')));
        core.status.replay.replaying = false;
        //process.stdin.resume();
        process.exit(10)
    }

    core.control._replay_finished = function () {
        console.log("Replay ended!!!");
        console.timeEnd();
        console.log(JSON.stringify(core.clone(
            core.status.hero, (x,y)=>(typeof y=='number') || x=='items')));
        process.exit(16);
    };

    var _win = core.events.eventdata.win;
    var reason = "45e70c98-5843-45dd-b587-6a90f4196a8f";
    core.events.eventdata.win = function(...rest) {
        reason = rest[0] || "";
        _win(...rest);
    }

    var _replaceText = function (text) {
        return (text || "").replace(/\${(.*?)}/g, function (word, value) {
            return core.calValue(value);
        });
    }

    core.events._action_win = function (data, x, y, prefix) {
        this.win(_replaceText(data.reason), data.norank, data.noexit);
    }

    core.control.stopReplay = function () {
        console.log("Replay finished!!!");
        console.timeEnd();
        console.log(JSON.stringify(core.clone(
            core.status.hero, (x,y)=>(typeof y=='number') || x=='items')));
        process.stdout.write("\n---------- " + Math.floor(core.status.hero.hp) + "|" + reason + " ----------\n");
        process.exit(0);
    }

    // -------- Run replay -------- //

    var route = core.decodeRoute(replayData.route);
    console.time();
    console.log("Start Replay, total length=" + route.length);
    core.startGame(replayData.hard, replayData.seed, route);
    core.status.replay.speed = 24;
    if (core.status.replay.pausing) {
        core.status.replay.pausing = false;
        core.replay();
    }
}

// Run in sandbox
try {
    vm.runInThisContext("(" + code.toString() + ")()");
} catch (e) {
    console.log(e);
    process.exit(1);
}
