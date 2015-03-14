var W=800;
var H=500;

Crafty.init(W,H, document.getElementById('game'));
Crafty.background('lightblue');
Crafty.pixelart(true);

var FW=500;
var FH=20;

Crafty.viewport.bounds = {
	min:{x:-200, y:0}, 
	max:{x:FW+200, y:H}
};

Crafty.e('Floor, 2D, Canvas, Color')
  .attr({x: 0, y: H-FH, w: FW, h: FH})
  .color('brown');
  
Crafty.e("2D, wall_left")
  .attr({x: -1, y: 0, w: 1, h: H});
  
Crafty.e("2D, wall_right")
  .attr({x: FW, y: 0, w: 1, h: H});

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

Crafty.sprite(256, 256, "assets/monkey.png", {sprite_monkey:[0,0]});
var monkey = Crafty.e('2D, Canvas, Twoway, Gravity, Collision, sprite_monkey')
  .attr({x: 0, y: H-70, w: 50, h: 50})
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

for (var i = 0; i < 3; i++){
  Crafty.e('2D, Canvas, Color, banana')
    .attr({x: 100 + 100*i, y: H-270, w: 10, h: 30, ripeness: 5})
    .color('yellow');
  bananaCount++;
}

