var W=800;
var H=500;

Crafty.init(W,H, document.getElementById('game'));
Crafty.background('lightblue');
Crafty.pixelart(false);

var FW=800;
var FH=40;

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
  
/* LOAD ASSETS */
var sprites = {
	monkey: {w: 256, h: 256, file: "monkey.png", pixelart: true},
	banana1: {w: 40, h: 30, file: "banana1.png", ripeness: 1},
	banana5: {w: 40, h: 30, file: "banana5.png", ripeness: 5},
	bananas1: {w: 50, h: 34, file: "bananas1.png", ripeness: 1},
	bananas5: {w: 50, h: 34, file: "bananas5.png", ripeness: 5},
	bananatree2: {w: 600, h: 529, file: "bananatree2.png"},
	giraffe: {w: 335, h: 421, file: "giraffe.png"},
    archway: {w: 47, h: 110, file: "archway.svg", map: {sprite_archway_left:[0,0],
                                                        sprite_archway_right:[1,0]}},
};
var bananaSprites = ["banana1", "banana5", "bananas1", "bananas5"];

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

Crafty.e('2D, DOM, Image')
  .attr({x: -10, y: H-FH-20, w: FW+20, h: FH+20, z: 1})
  .image('assets/grass.png', 'repeat-x');

/* GAME LOGIC */
var healthTotal = 100;
var health=healthTotal;
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
	return bananaHealthDeltas[banana.ripeness-1];
}
var bananaCount=0;

/* TODO pixelart has to be enabled for the monkey
   crafty doesn't support that yet.
   see https://github.com/craftyjs/Crafty/issues/882
*/
var monkey = Crafty.e('2D, DOM, Twoway, Gravity, Collision, sprite_monkey')
  .attr({x: 0, y: H-FH-100, w: 50, h: 50, z: 9})
  .twoway(5,19)
  .gravity('Floor')
  .gravityConst(1)
  .collision()
  .onHit("wall_left", function() {
    this.x=0;
  }).onHit("wall_right", function() {
    this.x=FW-this.w;
  }).onHit("banana", function(hits) {
	var banana = hits[0].obj;
	health += healthDelta(banana);
	banana.destroy();
	bananaCount--;
  }).bind("CheckLanding", function(ground) {
    // disallow landing if monkey's feet are not above platform
    // this prevents snapping to platforms that would not have been reached otherwise
    if (this._y + this._h > ground._y + ground._h)
      this.canLand = false;
  });

Crafty.viewport.follow(monkey, 0, 0);

var healthTotalMillis = 1000 * 10;
var healthUpdater = Crafty.bind('EnterFrame', function(d) {
	var timePassedMillis = d.dt;
	var deltaHealth = timePassedMillis * healthTotal / healthTotalMillis;
	health -= deltaHealth;
	if (health <= 0) {
		health = 0;
		$('#defeat-box').show();
		Crafty.stop();
	}
	$('#health').html(Math.round(health));
});

function newBanana(x, y, spriteKey) {
  var s = sprites[spriteKey];
  Crafty.e('2D, DOM, banana, sprite_'+spriteKey)
    .attr({x: x, y: y, w: s.w, h: s.h, z: 6,
	       ripeness: s.ripeness});
  bananaCount++;
}

function getEntitySize(s, ch) {
	var w = ch*s.w/s.h;
	var h = ch;
	return {w:w,h:h};
}

function plantTree(x, h, spriteKey) {
	var s = sprites[spriteKey];
	var size = getEntitySize(s, h);
	var tree = Crafty.e('2D, DOM, tree, sprite_'+spriteKey)
	  .attr({x: x-size.w/2, y: H-size.h-FH, z: 5,
	         w: size.w, h: size.h});
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

function buildArchway() {
	var s = sprites["archway"];
	var size = getEntitySize(s, 220);
    var x = FW-size.w*1.82;
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
      .color('black');
}

for (var i = 0; i < 3; i++){
  newBanana(130 + 40*i, H-270-(Math.random()-.5)*30, bananaSprites[i%bananaSprites.length]);
}

plantTree(200, 320, "bananatree2");
plantTree(400, 500, "bananatree2");
placeGiraffe(500);
buildArchway();

/* WINNING:
$('#victory-box').show();
Crafty.stop();
*/