// Spectators share the fighters' filled, outlined art style, at a smaller scale.
// Stable variation avoids flicker; this presentation never changes crowd bets.
const CROWD_WARDROBE={
 dojo:['robe','shirt','robe','jacket'],rooftop:['hoodie','jacket','shirt','hoodie'],
 temple:['jacket','robe','hoodie','shirt'],harbour:['jacket','shirt','jacket','hoodie'],
 club:['shirt','jacket','shirt','hoodie'],festival:['shirt','shirt','jacket','robe'],
 desert:['linen','shirt','linen','jacket'],glacier:['coat','coat','hoodie','coat']
};
export function drawCrowdArt(c,arena,tick,{cheering=false,reducedMotion=false}={}){
 const wardrobe=CROWD_WARDROBE[arena.id]||CROWD_WARDROBE.dojo,ink='#26333d';
 const skin=['#bc9272','#916a50','#d4b092','#715443','#ac8265'];
 const line=(points,colour,width=1)=>{c.strokeStyle=colour;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()};
 const oval=(x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
 const finish=fill=>{c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.lineWidth=.8;c.lineJoin='round';c.stroke()};
 const segment=(a,b,width,fill)=>{
  const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d,ny=(b[0]-a[0])/d;
  c.beginPath();c.moveTo(a[0]+nx*width,a[1]+ny*width);
  c.quadraticCurveTo((a[0]+b[0])/2+nx*width,(a[1]+b[1])/2+ny*width,b[0]+nx*width*.68,b[1]+ny*width*.68);
  c.lineTo(b[0]-nx*width*.68,b[1]-ny*width*.68);c.quadraticCurveTo((a[0]+b[0])/2-nx*width,(a[1]+b[1])/2-ny*width,a[0]-nx*width,a[1]-ny*width);c.closePath();finish(fill);
 };
 c.save();
 for(let row=0;row<2;row++)for(let i=0;i<24;i++){
  const seed=i*17+row*41,cloth=arena.crowd[(i+row*3)%arena.crowd.length],tone=skin[(i*3+row)%skin.length],outfit=wardrobe[(i+row)%wardrobe.length];
  const celebrating=cheering&&seed%4!==0,clock=reducedMotion?0:tick;
  const sway=Math.sin(clock*(celebrating?.11:.018)+seed)*(celebrating?3:.28);
  const x=17+i*51+(row?14:0)+Math.sin(seed*2.3)*7,foot=(row?314:281)+(seed%5-2),scale=(row?.78:.64)+(seed%3)*.025;
  c.save();c.globalAlpha=row?.86:.65;c.translate(x,foot);c.scale(scale,scale);
  // Bent knees, shoes and a seat establish that the audience sits behind the rail.
  c.fillStyle='#293a44';c.fillRect(-16,-21,32,5);
  const knees=[[-13-(seed%3),-12],[12+(seed%4),-10]],feet=[[-16,0],[16,0]];
  for(let side=0;side<2;side++){
   segment([side?6:-6,-22],knees[side],5,side?'#45545e':'#354651');segment(knees[side],feet[side],3.8,'#354651');
   oval(feet[side][0]+(side?2:-2),1,6,2.8,'#23313b');
  }
  c.translate(sway,0);
  const arms=[{root:[-9,-37],elbow:celebrating?[-17,-49+sway]:[-15,-27],hand:celebrating?[-19,-63+sway]:[-10-(seed%4),-20]},
   {root:[9,-37],elbow:celebrating?[16,-46-sway]:[15,-25-(seed%3)],hand:celebrating?[20,-61-sway]:[9,-19-(seed%3)]}];
  for(const arm of arms){
   segment(arm.root,arm.elbow,3.6,outfit==='shirt'?tone:cloth);segment(arm.elbow,arm.hand,2.7,['coat','jacket','hoodie','linen','robe'].includes(outfit)?cloth:tone);oval(...arm.hand,2.8,3,tone);
  }
  const broad=outfit==='coat'?2:seed%3-1;
  c.beginPath();c.moveTo(-5,-42);c.quadraticCurveTo(-12-broad,-41,-12-broad,-34);c.lineTo(-8-broad,-21);c.quadraticCurveTo(0,-17,9+broad,-21);c.lineTo(12+broad,-34);c.quadraticCurveTo(12,-41,5,-42);c.closePath();finish(cloth);
  if(outfit==='robe'||outfit==='linen'){line([[-5,-40],[4,-30],[-4,-22]],'#c9c0a2',2);line([[5,-40],[-3,-29]],ink,1.2)}
  else if(outfit==='coat'){
   line([[0,-39],[0,-21]],'#b4c8c6',1.2);for(const y of [-33,-27])line([[-11,y],[11,y]],'#314957',.9);
   line([[-10,-24],[-5,-25]],'#b4c8c6',1);line([[5,-25],[10,-24]],'#b4c8c6',1);
  }else if(outfit==='jacket'){line([[-4,-40],[0,-33],[-4,-22]],'#c1b9a5',2);line([[4,-40],[0,-33],[4,-22]],ink,1)}
  else if(outfit==='hoodie'){line([[-6,-41],[-5,-35],[5,-35],[6,-41]],'#354651',3);line([[-3,-35],[-3,-30]],'#cebf9e',1);line([[3,-35],[3,-29]],'#cebf9e',1)}
  else {line([[-5,-41],[0,-38],[5,-41]],ink,1.5);if(seed%3===0)line([[-6,-32],[6,-32]],'#c7b392',2)}
  // Faces and headwear are kept simple enough to stay quiet behind the action.
  oval(0,-42,3,4,tone);
  if(outfit==='linen'){oval(-1,-50,8,10,'#c4b99d');oval(0,-49,5.3,7,tone)}else oval(0,-49,5.8,7.3,tone);
  if(arena.id==='glacier'){
   c.beginPath();c.moveTo(-6,-52);c.quadraticCurveTo(-8,-62,0,-61);c.quadraticCurveTo(8,-61,6,-52);c.closePath();finish(cloth);line([[-6,-52],[6,-52]],'#becbc5',2);
   line([[-5,-41],[5,-41]],'#b5bfc4',4);line([[3,-40],[4,-32]],'#b5bfc4',3);
  }else if(outfit!=='linen'){
   c.beginPath();c.moveTo(-6,-48);c.lineTo(-7,-54);c.quadraticCurveTo(-3,-59,3,-57);c.quadraticCurveTo(7,-56,6,-53);c.lineTo(0,-54);c.lineTo(-4,-51);c.lineTo(-4,-47);c.closePath();c.fillStyle=seed%5===0?'#827a69':'#34302e';c.fill();
   if(seed%7===0){oval(-4,-56,4,4,'#34302e')}
   if((arena.id==='festival'||arena.id==='harbour')&&seed%3===0){oval(0,-55,7,3,cloth);line([[-1,-53],[9,-53]],ink,2)}
  }
  line([[1,-50],[3,-50]],ink,.8);line([[0,-45],[3,-45]],'#735b49',.7);
  // Tickets use the existing two crowd-support colours, with no new currency.
  if(i%4===0){const hand=arms[1].hand;c.fillStyle=i%8===0?'#c6dc91':'#e3b17c';c.fillRect(hand[0]-3,hand[1]-6,9,6);line([[hand[0]-1,hand[1]-3],[hand[0]+4,hand[1]-3]],'#5d6555',.7)}
  c.restore();
 }
 // The foreground rail occludes the seated crowd's feet, preserving depth.
 line([[0,330],[1200,330]],'#253947',4);line([[0,308],[1200,308]],'#3e535f',2);
 for(let x=15;x<1200;x+=115)line([[x,307],[x,344]],'#253947',4);
 c.restore();
}
