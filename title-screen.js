import {Renderer} from './renderer.js';
import {Fighter} from './combat.js';
import {CHARACTERS,STYLES} from './styles.js';

// An isolated roster showcase: it never advances the match or touches a save.
export class TitleScreen {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new Renderer(canvas);this.started=null;this.lastSample=null;
  this.fighters=['kai','zuri'].map((name,id)=>{
   const fighter=new Fighter(id);fighter.character=CHARACTERS.find(c=>c.id===name)||CHARACTERS[id];
   fighter.style=STYLES[id?3:0];fighter.reset();fighter.x=0;fighter.facing=id?-1:1;fighter.attack(id?'kick':'light');return fighter;
  });
 }
 enter(){this.started=null;this.lastSample=null}
 draw(now,reducedMotion=false){
  if(this.started===null)this.started=now;
  const sample=reducedMotion?0:Math.floor(Math.max(0,now-this.started)/ (1000/30))+1;
  if(sample===this.lastSample)return;this.lastSample=sample;
  const frame=reducedMotion?0:(sample-1)*2,c=this.renderer.ctx;
  this.renderer.reducedMotion=reducedMotion;this.renderer.presentationFrame=frame;
  c.clearRect(0,0,900,900);c.save();
  const poly=(points,fill)=>{c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
  // The angled panels frame the figures without introducing a separate art style.
  poly([[80,179],[507,109],[432,746],[49,797]],'#1e555c');
  poly([[481,126],[845,206],[858,797],[427,745]],'#694957');
  poly([[84,180],[503,110],[497,126],[83,199]],'#7be0d0');
  poly([[486,128],[844,208],[845,224],[484,145]],'#f0bb80');
  c.globalAlpha=.17;c.strokeStyle='#bfe8dd';c.lineWidth=2;
  for(let i=0;i<9;i++){c.beginPath();c.moveTo(90,240+i*54);c.lineTo(817,190+i*54);c.stroke()}
  c.globalAlpha=.3;c.strokeStyle='#b3e0d6';c.lineWidth=3;c.beginPath();c.arc(453,441,282,-1.3+frame*.0015,1.2+frame*.0015);c.stroke();
  c.strokeStyle='#edb68d';c.beginPath();c.arc(453,441,304,1.9-frame*.001,3.9-frame*.001);c.stroke();
  c.globalAlpha=1;
  poly([[460,225],[410,450],[465,429],[423,626],[529,379],[466,399],[508,225]],'#e6c59036');
  // Dust motes move slowly; reduced motion uses a single still illustration.
  for(let i=0;i<23;i++){
   const x=73+(i*137)%754,y=174+((i*83+frame*(.11+i%3*.035))%578);
   c.globalAlpha=.2+(i%4)*.12;c.fillStyle=i%2?'#ffce91':'#a7f2df';c.fillRect(x,y,i%3?2:4,i%3?5:9);
  }
  c.globalAlpha=1;
  c.fillStyle='#0b1724aa';c.beginPath();c.ellipse(450,737,340,34,0,0,Math.PI*2);c.fill();
  for(const [id,fighter] of this.fighters.entries()){
   const start=id?228:80,cycle=frame%510,attackFrame=cycle-start,total=fighter.move.startup+fighter.move.active+fighter.move.recovery;
   const attacking=!reducedMotion&&attackFrame>=0&&attackFrame<total;
   const model={...fighter,state:attacking?'attack':'idle',frame:attacking?attackFrame:0,move:attacking?fighter.move:null,grounded:true,celebrating:false,expression:'confident'};
   c.save();c.translate(id?700:215,id?716:746);c.scale(id?3.6:4.05,id?3.6:4.05);c.translate(0,-400);
   this.renderer.fighter(model,frame,false);c.restore();
  }
  c.fillStyle='#101d2b';c.fillRect(281,773,338,46);c.strokeStyle='#718993';c.lineWidth=1;c.strokeRect(281,773,338,46);
  c.font='bold 18px Arial';c.textAlign='center';c.fillStyle='#e8ddc9';c.fillText('KAI   /   ZURI',450,802);
  c.restore();
 }
}
