var defaultW=800;
var defaultH=500;
var FH=40;
var LAST_LEVEL=7;

Crafty.mobile = false; // skip clever logic, use our own

if (window.matchMedia('(max-height: ' + (defaultH+100) + 'px)').matches) {
    // small viewport, fill completely
    // http://stackoverflow.com/a/8876069/60982
    defaultH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    defaultW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}
var W=defaultW;
var H=defaultH;

Crafty.init(W,H, document.getElementById('game'));
Crafty.pixelart(false);
Crafty.multitouch(true);

function setupLevelStatic(levelWidth) {
    var FW=levelWidth;

    Crafty.background('lightblue');
    Crafty.viewport.bounds = {
        min:{x:-10, y:0}, 
        max:{x:FW+10, y:H}
    };
    
    Crafty.e("2D, wall_left")
      .attr({x: -1, y: 0, w: 1, h: H});
      
    Crafty.e("2D, wall_right")
      .attr({x: FW, y: 0, w: 1, h: H});
      
    Crafty.e('Floor, 2D')
      .attr({x: 0, y: H-FH, w: FW, h: FH});
        
    Crafty.e('2D, DOM, Image')
      .attr({x: -10, y: H-FH-20, w: FW+20, h: FH+20, z: 1})
      .image('assets/grass.png', 'repeat-x');
      
    buildArchway(levelWidth);
    
    placeSun();
}

function setupLevel(levelWidth) {
    setupLevelStatic(levelWidth);
      
    health=healthTotal;
    
    var monkey = spawnMonkey(levelWidth);
    var healthUpdater = startHealthUpdater();
    Crafty.one('levelWon', function() {
        if (currentLevel==LAST_LEVEL) {
            $('#final-victory-box').show();
        } else {
            $('#next-level').show();
        }
        freezeGame(healthUpdater, monkey);
    });  
    Crafty.one('levelLost', function() {
        $('#restart-level').show();
        freezeGame(healthUpdater, monkey);
    });
  
    handleTouch(monkey);
    
    return monkey;
}

// fixed position entity
// https://groups.google.com/d/msg/craftyjs/MSfTCjFUpAE/P2Gisxg494QJ
Crafty.c("Fixed", {
    init: function(){ 
        this.requires("2D");
        this.bind("EnterFrame", this.adjustPosition)
    },
    fixedPosition: function(x, y){
        this.fixedX = x; this.fixedY=y;
        return this;
    },
    adjustPosition: function(){
         this.x = this.fixedX - Crafty.viewport.x;
         this.y = this.fixedY - Crafty.viewport.y;
    }
}
)

function handleTouch(monkey) {
  // create touch areas for moving the monkey
  // bottom left, right, center (jumping)
  // the touch entities must stay and not move within the world
  
  // map touch events to keyboard events
  // see https://groups.google.com/forum/#!topic/craftyjs/dAVMOJyAcv8
  
  var touchH = 0.35 * H
  // jump area: middle 50% width
  // left/right: each 25%
  var midW = Math.round(0.5 * W)
  var lrW = Math.round(0.25 * W)
    
  var keymap = [
    {x: 0, y: H-touchH, w: lrW, h: touchH, z:200, key: Crafty.keys.LEFT_ARROW},
    {x: lrW, y: H-touchH, w: midW, h: touchH, z:200, key: Crafty.keys.UP_ARROW},
    {x: W-lrW, y: H-touchH, w: lrW, h: touchH, z:200, key: Crafty.keys.RIGHT_ARROW}
  ]
  
  for (var i=0; i < keymap.length; i++) {
    var toucharea = keymap[i]
    Crafty.e('Fixed, Touch')
      .attr(toucharea)
      .fixedPosition(toucharea.x, toucharea.y)
      .bind('TouchStart',function() {
         Crafty.keydown[this.key] = true
         monkey.trigger("KeyDown", {key: this.key})
      })
      .bind('TouchEnd', function() {
         delete Crafty.keydown[this.key]
         monkey.trigger("KeyUp", {key: this.key})
      });
  }

}

Crafty.bind('KeyDown', function (e) {
    if (e.key == Crafty.keys.ENTER) {
        var btn = $('.mainbtn:visible');
        if (btn.length == 0) {
            btn = $('.btn:visible');
        }
        btn.trigger('click');
    } else if (e.key == Crafty.keys.F) {
        toggleFullscreen();
    }
});

$(document).bind("fullscreenchange", function() {
    if (!$(document).fullScreen()) {
        leaveFullscreen();
    }
});

function leaveFullscreen() {
    $('#game').css('transform', 'scale(1)');
    H = defaultH;
    W = defaultW;
    Crafty.init(W,H, document.getElementById('game'));
    if (currentLevel == 0) {
        // only reload scene if no level has started yet
        Crafty.enterScene("start");
    }
}

function toggleFullscreen() {
    if ($(document).fullScreen()) {
        $(document).fullScreen(false);
        leaveFullscreen();
    } else {
        $(document).fullScreen(true);
        // need to wait a bit until we can read out correct width/height
        setTimeout(function() {
            if (window.matchMedia('(max-height: ' + (H+100) + 'px)').matches) {
                // small viewport, fill completely
                // http://stackoverflow.com/a/8876069/60982
                H = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                W = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            } else {
                H = defaultH;
                W = defaultW;
                var scale = 1.3
                if (window.matchMedia('(min-height: ' + H*scale + 'px)').matches) {
                    $('#game').css('transform', 'scale(' + scale + ')');
                }
            }
            console.log(W,H)
            Crafty.init(W,H, document.getElementById('game'));
            
            if (currentLevel == 0) {
                // only reload scene if no level has started yet
                Crafty.enterScene("start");
            }
        }, 500)
    }
}

$('#restart-level').on('click touchstart', function(e) {
    e.preventDefault();
    startLevel(currentLevel);
});
$('#start-game').on('click touchstart', function(e) {
    e.preventDefault();
    if (window.location.hash) {
        currentLevel=parseInt(window.location.hash.substr(1), 10);
    } else {
        currentLevel=1;
    }
    startLevel(currentLevel);
});
$('#go-fullscreen').on('click touchstart', function(e) {
    toggleFullscreen();
});
$('#next-level').on('click touchstart', function(e) {
    e.preventDefault();
    startLevel(currentLevel+1);
});
function startLevel(level) {
    $('.infobox').hide();
    currentLevel=level;
    Crafty.enterScene("level" + currentLevel);
}
  
/* LOAD ASSETS */
var sprites = {
    _preload1: {w: 256, h: 256, file: 'grass.png'},
    monkey: {w: 256, h: 256, file: "monkey.png", pixelart: true},
    banana1: {w: 40, h: 30, file: "banana1.png", ripeness: 1, cx: 38, cy: 1},
    banana3: {w: 40, h: 30, file: "banana3.png", ripeness: 3, cx: 38, cy: 1},
    banana5: {w: 40, h: 30, file: "banana5.png", ripeness: 5, cx: 38, cy: 1},
    banana6: {w: 40, h: 30, file: "banana6.png", ripeness: 6, cx: 38, cy: 1},
    banana8: {w: 40, h: 30, file: "banana8.png", ripeness: 8, cx: 38, cy: 1},
    banana10: {w: 40, h: 30, file: "banana10.png", ripeness: 10, cx: 38, cy: 1},
    bananas1: {w: 50, h: 34, file: "bananas1.png", ripeness: 1, factor: 3, cx: 40, cy: 1},
    bananas5: {w: 50, h: 34, file: "bananas5.png", ripeness: 5, factor: 3, cx: 40, cy: 1},
    bananatree: {w: 600, h: 529, file: "bananatree2.png"},
    appletree: {w: 415, h: 550, file: "appletree.png"},
    lemontree: {w: 612, h: 800, file: "lemontree.png"},
    bush: {w: 364, h: 148, file: "bush.png"},
    earthworm: {w: 50, h: 47, file: "earthworm.png"},
    giraffe: {w: 335, h: 421, file: "giraffe.png"},
    rhino: {w: 150, h: 116, file: "rhino.gif"},
    tiger: {w: 192, h: 192, file: "tiger.gif"},
    archway: {w: 47, h: 110, file: "archway.svg", map: {sprite_archway_left:[0,0],
                                                        sprite_archway_right:[1,0]}},
    torch: {w: 47, h: 100, file: "torch.png"},
    hoverboard: {w: 200, h: 50, file: "hoverboard_horizontal.png"},
    sun: {w: 300, h: 300, file: "render_sun.png"}
};

Object.keys(sprites).forEach(function(spriteKey) {
    var s = sprites[spriteKey];
    if (s.hasOwnProperty('map')) {
        var map = s.map;
    } else {
        var map = {}
        map["sprite_"+spriteKey] = [0,0];
    }
    var pixelart = null;
    if (s.hasOwnProperty('pixelart')) {
        pixelart = s.pixelart;
    }
    Crafty.sprite(s.w, s.h, "assets/"+s.file, map, null, null, null, pixelart);
});

// positions relative to connector points of bananas on trees
var trees = {
    bananatree: {
        slots: [
            {x: 246, y: 165},
            {x: 275, y: 205},
            {x: 296, y: 170},
            {x: 321, y: 210},
            {x: 350, y: 179},
        ]
    },
};

/* GAME LOGIC */
var healthTotal = 100;
var health=healthTotal;
var currentLevel = 0; // start screen
function healthDelta(banana) {
    var bananaHealthDeltas = [
        -10, // 1 green (poisonous)
        -5, // 2
        0, // 3
        5, // 4
        10, // 5 yellow (most nutrition)
        9, // 6
        7, // 7 brown
        5, // 8 black (still good, but sugary and alcoholic)
        0, // 9
        -5 // 10 black rotten
    ];
    var delta = bananaHealthDeltas[banana.ripeness-1] * banana.factor;
    return delta;
}
var bananaCount=0;

function freezeGame(healthUpdater, monkey) {
    Crafty.unbind('EnterFrame', healthUpdater);
    var epsilon = 1e-100;
    // freeze the monkey
    monkey
        .twoway(epsilon,0) // 0 doesn't work for the first arg
        .antigravity();
}

/* TODO pixelart has to be enabled for the monkey
   crafty doesn't support that yet.
   see https://github.com/craftyjs/Crafty/issues/882
*/
function spawnMonkey(levelWidth) {
    var monkey = Crafty.e('2D, DOM, Twoway, Gravity, Collision, Tween, sprite_monkey')
      .attr({x: 0, y: H-FH-100, w: 50, h: 50, z: 9})
      .twoway(250,950)
      .gravity('Floor')
      .gravityConst(2500)
      .collision()
      .onHit("wall_left", function() {
        this.x=0;
      }).onHit("wall_right", function() {
        this.x=levelWidth-this.w;
        Crafty.trigger('levelWon');
      }).onHit("banana", function(hits) {
        var banana = hits[0].obj;
        health += healthDelta(banana);
        banana.destroy();
        bananaCount--;
      }).onHit("rhino_wall", function(hits) {
        var rhino = hits[0].obj
        this.disableControl()
        var groundDistance = H-FH - this.y - this.h
        var targetGroundDistance = groundDistance * 2.5
        var targetY = H-FH - this.h - targetGroundDistance
        this.tween({x: rhino.x-150, y: targetY, vx:0, vy:0}, 250, 'linear')
        setTimeout(function(self) {
          self.enableControl()
        }, 1200, this)
      }).bind("CheckLanding", function(ground) {
        // disallow landing if monkey's feet are not above platform
        // this prevents snapping to platforms that would not have been reached otherwise
        if (this._y + this._h > ground._y + this._dy)
          this.canLand = false;
      });

    Crafty.viewport.follow(monkey, 0, 0);
    return monkey;
}

function startHealthUpdater() {
    var healthTotalMillis = 1000 * 10;
    var healthUpdater = function(d) {
        var timePassedMillis = d.dt;
        var deltaHealth = timePassedMillis * healthTotal / healthTotalMillis;
        health -= deltaHealth;
        if (health <= 0) {
            health = 0;
            Crafty.trigger('levelLost');
        }
        $('#health-bar').css('width', Math.round(W*health/healthTotal) + "px");
        if (health/healthTotal < 0.3) {
            $('#health-bar').removeClass('health-medium health-high');      
            $('#health-bar').addClass('health-low'); 
        } else if (health/healthTotal < 0.6) {
            $('#health-bar').removeClass('health-low health-high');  
            $('#health-bar').addClass('health-medium');
        } else {
            $('#health-bar').removeClass('health-low health-medium');
            $('#health-bar').addClass('health-high');
        } 
    };
    Crafty.bind('EnterFrame', healthUpdater);
    $('#health-bar').show();
    return healthUpdater;
}

function newBanana(x, y, spriteKey) {
  var s = sprites[spriteKey];
  Crafty.e('2D, DOM, banana, sprite_'+spriteKey)
    .attr({x: x, y: y, w: s.w, h: s.h, z: 6,
           ripeness: s.ripeness, factor: s.hasOwnProperty('factor') ? s.factor : 1});
  bananaCount++;
}

function getEntitySize(s, ch) {
  var scale = ch/s.h;
  var w = scale*s.w;
  var h = ch;
  return {w:w,h:h,scale:scale};
}

function placeSun() {
  var s = 160;
  var x = W-s/2;
  var y = -s/2;
  Crafty.e('2D, DOM, Fixed, sprite_sun')
    .attr({x: x, y: y, w: s, h: s})
    .fixedPosition(x, y);
}

function plantTree(treeSpec, x) {
    var h = treeSpec.height;
    var treeType = treeSpec.type;
    var s = sprites[treeType];
    var size = getEntitySize(s, h);
    var treeX = x-size.w/2;
    var treeY = H-size.h-FH;
    var tree = Crafty.e('2D, DOM, tree, sprite_'+treeType)
      .attr({x: treeX, y: treeY, z: 5,
             w: size.w, h: size.h});
    // bananas
    if (treeSpec.hasOwnProperty('slots')) {
        var slots = trees[treeType].slots;
        treeSpec.slots.forEach(function(slot) {
            var relPos = slots[slot.index];
            var bt = slot.bananaType;
            var itemX = treeX + relPos.x*size.scale - sprites[bt].cx;
            var itemY = treeY + relPos.y*size.scale - sprites[bt].cy;
            newBanana(itemX, itemY, bt);
        });
    }
    return tree;
}

function placeGiraffe(x) {
    var s = sprites["giraffe"];
    var size = getEntitySize(s, 200);
    var giraffe = Crafty.e('2D, DOM, giraffe, sprite_giraffe')
      .attr({x: x-size.w/2, y: H-size.h-FH, z: 7, 
             w: size.w, h: size.h});
    // hit boxes need some height to prevent tunneling
    Crafty.e('Floor, 2D')
      .attr({x: x, y: H-FH-size.h*.425, w: size.h*.25, h: 20});
    Crafty.e('Floor, 2D')
      .attr({x: x-size.h*.21, y: H-FH-size.h*0.89, w: size.h*0.15, h: 20});
    return giraffe;
}

function placeEarthworm(x) {
    var s = sprites["earthworm"];
    var size = getEntitySize(s, 20);
    var worm = Crafty.e('2D, DOM, earthworm, sprite_earthworm')
      .attr({x: x-size.w/2, y: H-size.h-5, z: 7, 
             w: size.w, h: size.h});
    return worm;
}

function placeRhino(x) {
    var s = sprites.rhino
    var size = getEntitySize(s, 140);
    var rhino = Crafty.e('2D, DOM, rhino, sprite_rhino')
      .attr({x: x-size.w/2, y: H-size.h-FH+size.h*.1, z: 7, 
             w: size.w, h: size.h});
    Crafty.e('Floor, 2D')
      .attr({x: x, y: H-FH-size.h*.55, w: size.h*.4, h: 20});
    Crafty.e("2D, rhino_wall")
      .attr({x: rhino.x+10, y: rhino.y+20, w: 60, h: size.h-30})
    return rhino;
}

function buildArchway(levelWidth) {
    var s = sprites["archway"];
    var size = getEntitySize(s, 220);
    var x = levelWidth-size.w*1.82;
    var yoffset = 50;
    var y = H-size.h-FH+yoffset;    
    Crafty.e('2D, DOM, archway_left, sprite_archway_left')
      .attr({x: x, y: y, z: 8,
             w: size.w, h: size.h});
    Crafty.e('2D, DOM, archway_right, sprite_archway_right')
      .attr({x: x+size.w, y: y, z: 10,
             w: size.w, h: size.h});
    Crafty.e('2D, DOM, Color')
      .attr({x: x+size.w*0.3, y: y+size.h*0.3, z: 0,
             w: size.w, h: size.h*0.5})
      .color('black')
      .css({'animation': 'archway 1s linear infinite alternate'});
    
    var torchSprite = sprites["torch"];
    var torchSize = getEntitySize(torchSprite, 40);
    Crafty.e('2D, DOM, sprite_torch')
      .attr({x: x+size.w*0.65, y: y+size.h*0.4, z: 0,
             w: torchSize.w, h: torchSize.h});
    Crafty.e('2D, DOM, sprite_torch')
      .attr({x: x+size.w*0.9, y: y+size.h*0.37, z: 0,
             w: torchSize.w, h: torchSize.h});
    
    /*
    Crafty.e('2D, Floor, Collision')
      .attr({x: x+10, y: y+20, w: size.w*2, h: 20,
             rotation: 23});
    */
}

Crafty.c("TweenSequenceLoop", {
    init: function() {
    this.requires("Tween")
    },
    tweenSeqLoop: function(seq) {
        this.seq = seq
        this.i = 0
        this.fn = function () {
            this.i++;
            if (this.i === seq.length) this.i = 0;
            this.tween.apply(this, seq[this.i])
        }
        this.bind('TweenEnd', this.fn)
        this.tween.apply(this, seq[this.i])
        return this
    },
    cancelTweenLoop: function() {
        this.cancelTween(this.seq[this.i][0])
        this.unbind('TweenEnd', this.fn)
        return this
    },
  // override built-in _endTween
  // see https://github.com/craftyjs/Crafty/issues/966#issuecomment-153857373
  _endTween: function(properties){
    for (var propname in properties){
      delete this.tweenGroup[propname];
    }
    if (Object.keys(properties).length){
      this.trigger("TweenEnd", properties);
    }
  }
})

function placeHoverboard(x, monkey) {
    var h = 20;
    var w = 100
  var hoverboard_sprite = Crafty.e('2D, DOM, sprite_hoverboard')
      .attr({x: x, y: H-FH-h-20, z: 8,
             w: w, h: h});
  
    var y = H-FH-h-5
    var tweenSeq = [
        [{y: y-3}, 300, 'smootherStep'],
        [{y: y+3}, 300, 'smootherStep']
      ]
  var hoverboard = Crafty.e('2D, Floor, Motion, Tween, TweenSequenceLoop')
      .attr({x: x+20, y: y, z: 8,
             w: w-30, h: h})
      .attach(hoverboard_sprite)
      .tweenSeqLoop(JSON.parse(JSON.stringify(tweenSeq))) // deep copy because it gets modified

    var normalSpeed = monkey._speed;
    var hbSpeed = normalSpeed.x*1.5;
    var hoverboardSpeed = {x: hbSpeed, y: hbSpeed};

    function jumpHandler() {
        if (this.isDown(Crafty.keys.UP_ARROW) || this.isDown(Crafty.keys.W)) {
            monkey.detach(hoverboard);
            monkey.speed(normalSpeed);
            hoverboard.tweenSeqLoop(JSON.parse(JSON.stringify(tweenSeq)))
            hoverboard.vx = monkey.vx;
            // cannot use tween() here as rejumping on board won't work
            //hoverboard.tween({vx: 0}, 1500)
            var iv = setInterval(function(){ 
                hoverboard.vx /= 1.5;
                if (Math.abs(hoverboard.vx) < 0.01) {
                    clearInterval(iv);
                }                
            }, 300);
            monkey.unbind('KeyDown', jumpHandler);
        }
    };

    monkey
      .requires('Keyboard, TweenSequenceLoop')
      .bind("LandedOnGround", function(ground) {
        if (ground == hoverboard) {
            hoverboard.cancelTweenLoop();
            hoverboard.vx = 0;
            monkey.attach(hoverboard);
            monkey.speed(hoverboardSpeed);
            monkey.bind('KeyDown', jumpHandler);
        }
      });
}

// ##################################################
// # Define levels                                  #
// ##################################################
Crafty.defineScene("start", function() {
    setupLevelStatic(5000);
    Crafty.viewport.x = 10; // not sure why +10
    $('#start-box').show();
});

var appleTree = {
    type: 'appletree',
    height: 300
};
var lemonTree = {
    type: 'lemontree',
    height: 300
};

Crafty.defineScene("level1", function() {
    var levelWidth = 2000;
    setupLevel(levelWidth);
    
    var tree1 = {
        type: 'bananatree',
        height: 320,
        slots: [
            {   index: 0,
                bananaType: 'banana5'
            },
            {   index: 4,
                bananaType: 'banana5'
            },
        ]
    };

    var tree2 = {
        type: 'bananatree',
        height: 400,
        slots: [
        ]
    };
    
    plantTree(tree1, 500);
    plantTree(tree2, 1500);
});

Crafty.defineScene("level2", function() {
    var levelWidth = 2500;
    setupLevel(levelWidth);
    
    var tree1 = {
        type: 'bananatree',
        height: 320,
        slots: [
            {   index: 0,
                bananaType: 'banana1'
            },
            {   index: 4,
                bananaType: 'banana1'
            },
        ]
    };
    
    var tree2 = {
        type: 'bananatree',
        height: 320,
        slots: [
            {   index: 0,
                bananaType: 'banana5'
            },
            {   index: 1,
                bananaType: 'banana5'
            },
            {   index: 3,
                bananaType: 'banana5'
            },
            {   index: 4,
                bananaType: 'banana5'
            },
        ]
    };

    plantTree(tree1, 500);
    plantTree(appleTree, 1200);
    plantTree(tree2, 1800);
});

Crafty.defineScene("level3", function() {
    var levelWidth = 1200;
    var monkey = setupLevel(levelWidth);
    placeRhino(500);
    
    var bush = {
        type: 'bush',
        height: 70,
    };
    plantTree(bush, 400);
    plantTree(bush, 800);
    plantTree(bush, 900);
    placeEarthworm(800);
    placeEarthworm(840);
});

Crafty.defineScene("level4", function() {
    var levelWidth = 3000;
    setupLevel(levelWidth);
    
    var tree1 = {
        type: 'bananatree',
        height: 320,
        slots: [
            {   index: 0,
                bananaType: 'banana5'
            },
            {   index: 1,
                bananaType: 'banana3'
            },
            {   index: 4,
                bananaType: 'banana3'
            },
        ]
    };
    
    var tree2 = {
        type: 'bananatree',
        height: 280,
        slots: [
            {   index: 0,
                bananaType: 'banana3'
            },
            {   index: 1,
                bananaType: 'banana5'
            },
            {   index: 3,
                bananaType: 'banana1'
            },
            {   index: 4,
                bananaType: 'banana5'
            },
        ]
    };
    var tree3 = {
        type: 'bananatree',
        height: 340,
        slots: [
            {   index: 1,
                bananaType: 'banana8'
            },
            {   index: 3,
                bananaType: 'banana8'
            },
            {   index: 4,
                bananaType: 'banana6'
            },
        ]
    };
    var tree4 = {
        type: 'bananatree',
        height: 320,
        slots: [
            {   index: 0,
                bananaType: 'banana3'
            },
            {   index: 3,
                bananaType: 'banana3'
            },
            {   index: 4,
                bananaType: 'banana3'
            },
        ]
    };

    plantTree(tree1, 500);
    plantTree(tree2, 800);
    plantTree(tree3, 1050);
    plantTree(appleTree, 1800);
    plantTree(tree4, 2200);
    plantTree(appleTree, 2500);
});

Crafty.defineScene("level5", function() {
    var levelWidth = 2800;
    setupLevel(levelWidth);
    
    var giantTree = {
        type: 'bananatree',
        height: 500,
        slots: [
            {   index: 0,
                bananaType: 'banana5'
            },         
            {   index: 1,
                bananaType: 'banana5'
            },
            {   index: 3,
                bananaType: 'banana5'
            },
            {   index: 4,
                bananaType: 'banana5'
            },
        ]
    };
    var tree1 = {
        type: 'bananatree',
        height: 350
    };
    var tree2 = {
        type: 'bananatree',
        height: 280,
        slots: [
            {   index: 0,
                bananaType: 'banana3'
            },
            {   index: 1,
                bananaType: 'banana5'
            },
            {   index: 3,
                bananaType: 'banana1'
            },
            {   index: 4,
                bananaType: 'banana5'
            },
        ]
    };

    plantTree(lemonTree, 500);
    placeGiraffe(650);
    plantTree(tree1, 900);
    plantTree(tree2, 1200);
    plantTree(tree1, 1600);
    plantTree(giantTree, 2200);
    placeGiraffe(2300);
    
});

Crafty.defineScene("level6", function() {
    var levelWidth = 2700;
    var monkey = setupLevel(levelWidth);
    plantTree(lemonTree, 500);
    plantTree(lemonTree, 2000);
    placeHoverboard(300, monkey);
});

Crafty.defineScene("level7", function() {
    var levelWidth = 4000;
    var monkey = setupLevel(levelWidth);
    
    var giantTree = {
        type: 'bananatree',
        height: 600,
        slots: [       
            {   index: 1,
                bananaType: 'bananas5'
            },
            {   index: 3,
                bananaType: 'bananas5'
            },
        ]
    };
    var decoTree = {
        type: 'bananatree',
        height: 300,
    };
    var decoTree2 = {
        type: 'bananatree',
        height: 400,
    };
    
    plantTree(appleTree, 200);
    plantTree(appleTree, 500);
    placeHoverboard(300, monkey);
    plantTree(decoTree, 800);
    plantTree(decoTree2, 1000);
    plantTree(decoTree, 1500);
    plantTree(decoTree, 1900);
    plantTree(giantTree, 2200);
    plantTree(appleTree, 2600);
    plantTree(lemonTree, 2900);
    plantTree(lemonTree, 3100);
    plantTree(lemonTree, 3300);
    plantTree(lemonTree, 3500);  
    placeGiraffe(2300);
});

Crafty.enterScene("start");
