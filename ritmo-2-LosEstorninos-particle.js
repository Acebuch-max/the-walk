class Particle{

constructor(x,y,color){

this.x=x
this.y=y

this.baseX=x
this.baseY=y

this.vx=0
this.vy=0

this.ax=0
this.ay=0

this.color=color

}

applyForce(fx,fy){

this.ax+=fx
this.ay+=fy

}

integrate(){

this.vx+=this.ax
this.vy+=this.ay

this.x+=this.vx
this.y+=this.vy

this.vx*=0.92
this.vy*=0.92

this.ax=0
this.ay=0

}

draw(ctx){

ctx.fillStyle=this.color

ctx.beginPath()
ctx.arc(this.x,this.y,1.5,0,Math.PI*2)
ctx.fill()

}

}