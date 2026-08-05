
// THE WALK Renderer (linked to Python-generated space)

let espacio = null;

export function setEspacio(fn){
  espacio = fn;
}

export function render(ctx, width, height){
  if(!espacio) return;

  for(let x=0;x<width;x+=4){
    for(let y=0;y<height;y+=4){
      const v = espacio(x*0.01, y*0.01);
      const c = Math.floor((v+1)*127);
      ctx.fillStyle = `rgb(${c},${c},${c})`;
      ctx.fillRect(x,y,4,4);
    }
  }
}
