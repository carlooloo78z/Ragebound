import {SPECIALS} from './styles.js';
import {attackMotion,fighterPose} from './animation.js';
import {drawArena,getArena} from './stage.js';
import {drawFighterArt} from './fighter-art.js';
import {drawCrowdArt} from './crowd-art.js';
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.arena='dojo';this.camera=null;this.lastDrawTick=0;this.ctx=canvas.getContext('2d');this.effects=[];this.poseClocks=new WeakMap()}
 reset(){this.victor=null;this.winnerPreview=null;this.camera=null;this.effects=[];this.poseClocks=new WeakMap();this.cheerUntil=0;if(typeof this.ctx.reset==='function')this.ctx.reset();else{this.canvas.width=this.canvas.width;this.ctx=this.canvas.getContext('2d')}}
 confetti(c,width,height,time){
 if(this.reducedMotion||time<0||time>135)return;const colours=['#f94f98','#50dcff','#ffd642','#7cf0b0','#b48bff'];
 c.save();for(let n=0;n<42;n++){const x=(n*97+Math.sin(time*.04+n)*20)%width,y=-25+((time*2.7+n*19)%(height+40));c.fillStyle=colours[n%5];c.globalAlpha=Math.max(0,1-time/160);c.fillRect(x,y,4+(n%3),7)}c.restore();
 }
 victory(canvas,p,time){
 const c=canvas.getContext('2d'),original=this.ctx;c.clearRect(0,0,600,230);c.save();c.fillStyle='#412a7555';c.beginPath();c.ellipse(300,218,90,10,0,0,7);c.fill();c.translate(300,216);c.scale(1.38,1.38);c.translate(0,-400);
 try{this.ctx=c;this.fighter({...p,x:0,y:0,facing:1,state:'victory',phase:'',crouching:false,grounded:true,celebrating:true,flashUntil:0,messageUntil:-1,move:null},time,false)}finally{this.ctx=original;c.restore()}
 this.confetti(c,600,230,time);
 }
 portrait(canvas,p){
 const ctx=canvas.getContext('2d'),original=this.ctx;
 ctx.clearRect(0,0,300,360);ctx.save();ctx.translate(150,344);ctx.scale(p.id?-2.65:2.65,2.65);ctx.translate(0,-400);
 try{this.ctx=ctx;this.fighter({...p,x:0,y:0,facing:1,state:'idle',phase:'',crouching:false,grounded:true,flashUntil:0,throwUntil:0,celebrating:false,messageUntil:-1},0,false)}finally{this.ctx=original;ctx.restore()}
 }
 draw(players,tick,debug){
 const c=this.ctx;c.clearRect(0,0,1200,675);c.fillStyle='#17202a';c.fillRect(0,0,1200,675);
 const distance=Math.abs(players[0].x-players[1].x),targetZoom=this.reducedMotion?1:Math.max(1,Math.min(1.5,1200/(distance+400)));
 const targetHalf=600/targetZoom,targetCenter=Math.max(targetHalf,Math.min(1200-targetHalf,(players[0].x+players[1].x)/2));
 if(!this.camera)this.camera={zoom:targetZoom,center:targetCenter};
 const blend=1-Math.pow(.85,Math.max(0,Math.min(4,tick-this.lastDrawTick)));this.lastDrawTick=tick;
 this.camera.zoom+=(targetZoom-this.camera.zoom)*blend;this.camera.center+=(targetCenter-this.camera.center)*blend;
 const zoom=this.camera.zoom,half=600/zoom,center=Math.max(half,Math.min(1200-half,this.camera.center));
 c.save();try{c.translate(600,555);c.scale(zoom,zoom);c.translate(-center,-400);
 drawArena(c,this.arena);
 this.crowd(tick);
 for(const p of players){p.celebrating=this.victor===p.id;this.fighter(p,tick,debug)}
 if(this.victor!==null&&this.victor!==undefined)this.confetti(c,1200,420,(this.presentationFrame||tick)-(this.victoryStarted||0));
 this.effects=this.effects.filter(e=>tick-e.tick<13);
 for(const e of this.effects){
 c.strokeStyle=e.block?'#b4e4ff':'#ffe5ad';c.lineWidth=2;
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9,d=(tick-e.tick)*2.5;c.beginPath();c.moveTo(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d);c.lineTo(e.x+Math.cos(a)*(d+8),e.y+Math.sin(a)*(d+8));c.stroke()}
 }
 }finally{c.restore()}
 }
 crowd(tick){
 const visualTick=this.presentationFrame??tick,arena=getArena(this.arena),cheering=!!this.cheering||tick<(this.cheerUntil||0),reducedMotion=!!this.reducedMotion;
 // Reuse the background audience between small pose changes. Fighters still
 // render every frame; detailed spectators need not redraw hundreds of paths.
 if(!this.crowdSurface&&globalThis.document?.createElement){
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=350;
  const context=canvas.getContext('2d');if(context)this.crowdSurface={canvas,context,key:null};
 }
 if(this.crowdSurface){
  const key=arena.id+'/'+cheering+'/'+reducedMotion+'/'+(reducedMotion?0:Math.floor(visualTick/(cheering?3:12)));
  if(this.crowdSurface.key!==key){this.crowdSurface.context.clearRect(0,0,1200,350);drawCrowdArt(this.crowdSurface.context,arena,visualTick,{cheering,reducedMotion});this.crowdSurface.key=key}
  this.ctx.drawImage(this.crowdSurface.canvas,0,0);
 }else drawCrowdArt(this.ctx,arena,visualTick,{cheering,reducedMotion});
 }
 fallbackStage(c){drawArena(c,this.arena)}
 fighter(p,tick,debug){
 const clock=this.presentationFrame??tick;
 let visual=this.poseClocks.get(p);if(!visual||visual.state!==p.state){visual={state:p.state,start:clock};this.poseClocks.set(p,visual)}
 const fallenFor=p.state==='ko'?(this.reducedMotion?30:Math.max(p.frame,clock-visual.start)):0,drawHeight=p.state==='ko'?Math.max(0,p.y-fallenFor*fallenFor*.4):p.y;
 const sample=p.state==='ko'?{...p,frame:fallenFor,grounded:drawHeight===0}:p;
 const c=this.ctx,x=p.x,y=400-drawHeight,animationTime=this.reducedMotion?0:clock,signature=p.state==='attack'&&p.move?.type==='special'?p.character.id:null,duck=p.crouching&&p.grounded?28:0;
 const b=p.character.bulk,col=tick<(p.flashUntil||0)?(p.lastBlocked?'#a5d9f5':'#f7dfac'):(p.outfitColor||p.character.color);
 const pose=fighterPose(sample,tick,animationTime),{hip,frontFoot,hand}=pose;
 c.fillStyle='#101c2966';c.beginPath();c.ellipse(x+p.facing*hip[0]*.5,403,Math.max(20,35*b-p.y*.05),6,0,0,Math.PI*2);c.fill();
 c.save();c.translate(x,y);c.scale(p.facing,1);
 if(p.outfitDesign?.aura&&!this.reducedMotion){c.save();c.strokeStyle=p.outfitDesign.aura;c.lineWidth=3;c.globalAlpha=.28+.08*Math.sin(animationTime*.06);c.beginPath();c.ellipse(0,-60,32*p.character.bulk,59,0,0,Math.PI*2);c.stroke();c.restore()}
 const attack=p.state==='attack',phase=p.phase,motion=attackMotion(p),extension=motion.extension,reach=attack?p.style.reach*p.move.reach:0;
 drawFighterArt(c,p,pose,col);
 if(signature&&motion.trail>0){
 c.save();c.strokeStyle=SPECIALS[signature].color;c.lineWidth=2.5;c.lineCap='round';c.globalAlpha=motion.trail*(this.reducedMotion?.3:.65);c.beginPath();
 // Short, limb-aligned trails communicate contact, then fade during recovery.
 if(signature==='atlas'){c.moveTo(hand[0]-27,hand[1]-41);c.quadraticCurveTo(hand[0]+13,hand[1]-30,hand[0]+9,hand[1]+7)}
 else if(signature==='nyx')c.arc(hip[0]+8,hip[1],Math.hypot(frontFoot[0]-hip[0]-8,frontFoot[1]-hip[1])+7,-.65,.15);
 else if(signature==='jin'){c.moveTo(hand[0]-17,hand[1]+49);c.quadraticCurveTo(hand[0]+18,hand[1]+28,hand[0]+5,hand[1]-6)}
 else if(signature==='rhea')c.arc(hand[0]-8+Math.max(0,reach-hand[0]-13)*extension,hand[1]+3,21,-1.1,1.1);
 else if(signature==='sora')c.arc(hip[0]+3,hip[1]-4,Math.hypot(frontFoot[0]-hip[0]-3,frontFoot[1]-hip[1]+4)+6,-1.2,-.15);
 else if(signature==='bruno')c.ellipse(hand[0]+9,hand[1],17,9,-.25,-1.1,1.1);
 else if(signature==='mei'){c.moveTo(hand[0]+5,hand[1]);c.lineTo(Math.max(hand[0]+12,reach-6),hand[1]);c.arc(reach-7,hand[1],7,-.7,.7)}
 else if(signature==='omar')c.arc(pose.elbow[0]-3,pose.elbow[1]-5,24,-1.2,.55);
 else if(signature==='zuri')c.ellipse(frontFoot[0]+7,frontFoot[1]-3,11,20,-.2,-1.15,.8);
 else if(signature==='bastion')c.ellipse(pose.shoulder[0]+26,pose.shoulder[1]+8,20,19,0,-.9,.8);
 else if(signature==='leila'){c.arc(hand[0]+12,hand[1]-4,14,-.7,.9);c.moveTo(pose.rearHand[0]+17,pose.rearHand[1]-11);c.arc(pose.rearHand[0]+10,pose.rearHand[1],11,-.9,.65)}
 else{const tip=hand[0]+5+Math.max(0,reach-hand[0]-18)*extension;c.moveTo(hand[0]+6,hand[1]-3);c.quadraticCurveTo((hand[0]+tip)*.5,hand[1]-9,tip,hand[1]-9);c.moveTo(tip+13*Math.cos(-1.05),hand[1]+13*Math.sin(-1.05));c.arc(tip,hand[1],13,-1.05,1.05)}
 c.stroke();c.restore();
 }
 c.restore();
 const colors={WINDUP:'#f0ce73',ACTIVE:'#f09274',RECOVERY:'#9dbbde'};
 c.textAlign='center';c.font='9px Arial';c.fillStyle=colors[phase]||'#e5e5db';
 if(debug)c.fillText(p.character.name.toUpperCase()+' / '+(phase||p.state.toUpperCase()),x,y+25);
 if(debug&&tick<p.messageUntil){c.font='bold 12px Arial';c.fillStyle='#ffe2a0';c.fillText(p.message,x,y-146+duck)}
 if(debug&&attack){c.font='bold 11px Arial';c.fillStyle=colors[phase];c.fillText((p.attackPosture==='crouching'?'LOW':p.attackPosture==='air'?'OVERHEAD':p.isGrapple()?'THROW':p.move.type==='heavy'?'OVERHEAD':p.move.label.toUpperCase())+' / '+phase,x,y-130+duck)}
 if(debug)for(const [box,color] of [[p.hurtbox(),'#70dcff'],[p.hitbox(),'#ff8660']])if(box){c.strokeStyle=color;c.lineWidth=1;c.strokeRect(box.x,box.y,box.w,box.h)}
 }
}
