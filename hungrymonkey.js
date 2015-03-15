var W=800;
var H=500;

Crafty.init(W,H, document.getElementById('game'));
Crafty.background('lightblue');
Crafty.pixelart(true);

var FW=500;
var FH=40;

Crafty.viewport.bounds = {
	min:{x:-200, y:0}, 
	max:{x:FW+200, y:H}
};
 
Crafty.e("2D, wall_left")
  .attr({x: -1, y: 0, w: 1, h: H});
  
Crafty.e("2D, wall_right")
  .attr({x: FW, y: 0, w: 1, h: H});
  
/* LOAD ASSETS */
var sprites = {
	grass: {w: 720, h: 99, file: "grass.png"},
	monkey: {w: 256, h: 256, file: "monkey.png"},
	banana1: {w: 40, h: 30, file: "banana1.png", ripeness: 5},
	banana2: {w: 50, h: 34, file: "banana2.png", ripeness: 5},
	bananatree2: {w: 600, h: 529, cw: 350, file: "bananatree2.png"},
};
var bananaSprites = ["banana1", "banana2"];

Object.keys(sprites).forEach(function(spriteKey) {
	var s = sprites[spriteKey];
	var map = {}
	map["sprite_"+spriteKey] = [0,0];
	Crafty.sprite(s.w, s.h, "assets/"+s.file, map);
});

Crafty.e('Floor, 2D')
  .attr({x: 0, y: H-FH, w: FW, h: FH});

Crafty.e('2D, Canvas, Image')
  .attr({x: 0, y: H-FH-20, w: FW, h: FH+20})
  .image('assets/grass.png', 'repeat-x');

/* GAME LOGIC */
var healthTotal = 100;
var health=healthTotal;
function healthDelta(banana) {
	/* 
	1 -> 4.4
	2 -> 7.5
	3 -> 9.4
	4 -> 10
	5 -> 9.4
	6 -> 7.5
	7 -> 4.4
	8 -> 0
	9 -> -5.6
	10 -> -12.5
	*/
	return -Math.pow(Math.sqrt(10)*(banana.ripeness-4)/4, 2)+10;
}
var bananaCount=0;

var monkey = Crafty.e('2D, Canvas, Twoway, Gravity, Collision, sprite_monkey')
  .attr({x: 0, y: H-70, w: 50, h: 50, z:10})
  .twoway(5,20)
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
	if (bananaCount == 0){
      $('#victory-box').show();
	  Crafty.stop();
	}
  });
Crafty.viewport.follow(monkey, 0, 0);

var healthTotalMillis = 1000 * 100;
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
  Crafty.e('2D, Canvas, banana, sprite_'+spriteKey)
    .attr({x: x, y: y, w: s.w, h: s.h, z: 2,
	       ripeness: s.ripeness});
  bananaCount++;
}

for (var i = 0; i < 3; i++){
  newBanana(100 + 100*i, H-270, bananaSprites[i%bananaSprites.length]);
}

function getEntitySize(s) {
	var w = s.hasOwnProperty("cw") ? s.cw : s.w;
	var h = s.hasOwnProperty("cw") ? s.cw*s.h/s.w : s.h;
	return {w:w,h:h};
}

function plantTree(x, spriteKey) {
	var s = sprites[spriteKey];
	var size = getEntitySize(s);
	var tree = Crafty.e('2D, Canvas, tree, sprite_'+spriteKey)
	  .attr({x: x-size.w/2, y: H-size.h-FH, 
	         w: size.w, h: size.h});
	return tree;
}
plantTree(200, "bananatree2");