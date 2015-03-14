var W=800;
var H=500;

Crafty.init(W,H, document.getElementById('game'));
Crafty.background('lightblue');

var FW=500;
var FH=20;
Crafty.e('Floor, 2D, Canvas, Color')
  .attr({x: 0, y: H-FH, w: FW, h: FH})
  .color('brown');
  
Crafty.e("2D, wall_left")
  .attr({x: -1, y: 0, w: 1, h: H});
  
Crafty.e("2D, wall_right")
  .attr({x: FW, y: 0, w: 1, h: H});
  
var monkey = Crafty.e('2D, Canvas, Color, Twoway, Gravity, Collision')
  .attr({x: 0, y: H-70, w: 50, h: 50})
  .color('red')
  .twoway(5,20)
  .gravity('Floor')
  .gravityConst(1)
  .collision()
  .onHit("wall_left", function() {
    this.x=0;
  }).onHit("wall_right", function() {
    this.x=FW-this.w;
  });
  
Crafty.viewport.bounds = {
	min:{x:-200, y:0}, 
	max:{x:FW+200, y:H}
};
Crafty.viewport.follow(monkey, 0, 0);