import {STYLES,MOVES,FRAME_HITBOXES,CHARACTERS,SPECIALS,attackIsLow} from './styles.js';
export class Fighter {
 constructor(id){this.id=id;this.upgrades={health:0,power:0,speed:0,guard:0};this.character=CHARACTERS[0];this.style=STYLES[id?3:0];this.reset()}
 reset(){Object.assign(this,{x:this.id?860:340,y:0,vy:0,hp:this.maxHealth,guard:this.maxGuard,state:'idle',frame:0,facing:this.id?-1:1,move:null,hit:false,stun:0,combo:0,comboUntil:0,dodgeUntil:0,crouching:false,dashUntil:0,dashCooldown:0,attackPosture:'standing',guardRegenAt:0,blockStarted:-100,wasBlocking:false,lastThrowInput:-100,airAttackUsed:false,landingUntil:0,message:'',messageUntil:0,lastAttack:null,lastAttackTick:-100,actionTick:0,flashUntil:0,lastBlocked:false,rollAir:false,airRollUsed:false,rollDuration:0,rollDirection:1,rollCooldown:0,celebrating:false,buffer:null,comboTarget:null,throwUntil:0,throwPartner:null,throwRole:null,throwFromX:0,throwToX:0})}
 transition(state){if(this.state!==state){this.state=state;this.frame=0}}
 get maxHealth(){return this.character.health+8*(this.upgrades.health||0)}
 get maxGuard(){return this.character.guard+8*(this.upgrades.guard||0)}
 get speed(){return this.style.speed*this.character.speed*(1+.02*(this.upgrades.speed||0))}
 get power(){return this.character.damage*(1+.04*(this.upgrades.power||0))}
 get grounded(){return this.y<=0&&this.vy<=0}
 get phase(){if(this.state!=='attack'||!this.move)return '';return this.frame<this.move.startup?'WINDUP':this.frame<this.move.startup+this.move.active?'ACTIVE':'RECOVERY'}
 say(message,tick){this.message=message;this.messageUntil=tick+70}
 isGrapple(type=this.move?.type){return type==='throw'||type==='heavy'&&['throw','submission'].includes(this.style.kind)}
 attack(type,tick=this.actionTick){
 const definition=MOVES[type];if(['attack','roll'].includes(this.state)||this.stun>0||this.hp<=0)return false;if(!definition||!this.grounded&&this.airAttackUsed)return false;
 if(!this.grounded&&this.isGrapple(type))return false;
 this.attackPosture=this.grounded?(this.crouching?'crouching':'standing'):'air';
 if(!this.grounded)this.airAttackUsed=true;
 const signature=type==='special'?SPECIALS[this.character.id]:null;
 const move={...definition,...(this.style.moves?.[type]||{}),...(signature?.move||{})};
 this.move={...move,type,recovery:Math.round(move.recovery*this.style.recovery),...(signature?{label:signature.name,signature:this.character.id}:{})};
 this.hit=false;this.frame=0;this.transition('attack');this.lastAttack=type;this.lastAttackTick=tick;return true;
 }
 startRoll(direction,tick){
 const air=!this.grounded;if(this.stun>0||this.hp<=0||['attack','roll'].includes(this.state)||tick<this.rollCooldown||this.state==='dash'&&tick<this.dashUntil||air&&this.airRollUsed)return false;
 this.rollAir=air;this.rollDirection=direction||this.facing;this.rollDuration=air?18:24;this.rollCooldown=tick+75;this.crouching=false;
 if(air){this.airRollUsed=true;this.vy=Math.max(this.vy,2)}
 this.move=null;this.transition('roll');this.say(air?'AIR ROLL':'GROUND ROLL',tick);return true;
 }
 update(input,enemy,tick){
 this.actionTick=tick;this.frame++;
 if(this.throwRole==='defender'&&tick<=this.throwUntil){const travel=Math.max(0,Math.min(1,(15-(this.throwUntil-tick))/15));this.x=this.throwFromX+(this.throwToX-this.throwFromX)*travel}
 const pressedType=input.special?'special':input.throwPressed?'throw':input.kickPressed?'kick':input.heavyPressed?'heavy':input.lightPressed?'light':null;
 if(this.buffer&&tick>this.buffer.until)this.buffer=null;
 if(this.state==='attack'&&this.move){const left=this.move.startup+this.move.active+this.move.recovery-this.frame;if(left<=5&&pressedType&&!this.buffer)this.buffer={type:pressedType,until:tick+6}}
 if(this.comboTarget&&this.comboTarget.stun===0){this.combo=0;this.comboTarget=null}
 if(this.state==='attack'&&this.move?.type==='special'&&this.phase==='WINDUP'&&this.grounded){this.x+=this.facing*(SPECIALS[this.character.id].move?.advance||0)}

 if(input.rollPressed){if(this.stun>0)this.say('RECOVER FROM HIT FIRST',tick);else if(this.state==='attack')this.say('FINISH ATTACK THEN ROLL',tick);else if(tick<this.rollCooldown)this.say('ROLL RECOVERING',tick);else if(!this.grounded&&this.airRollUsed)this.say('LAND BEFORE ANOTHER AIR ROLL',tick)}
 if(this.hp<=0){this.transition('ko');return}
 if(input.throwPressed)this.lastThrowInput=tick;
 if(input.block&&!this.wasBlocking)this.blockStarted=tick;
 this.wasBlocking=!!input.block;
 if(tick>this.comboUntil)this.combo=0;
 if(tick>=this.guardRegenAt&&this.state!=='block'&&this.stun===0)this.guard=Math.min(this.maxGuard,this.guard+.36);
 const wasAirborne=!this.grounded;
 if(this.stun>0){this.stun--;if(!this.stun){this.move=null;this.crouching=!!input.down&&this.grounded;this.transition(input.block&&this.grounded?'block':'idle')}}
 else if(this.state==='roll'){
 this.x+=this.rollDirection*(this.rollAir?6.5:7.5)*this.character.speed;
 if(this.frame>=this.rollDuration)this.transition(this.grounded?'idle':'jump');
 }else if(this.state==='attack'){
 if(!this.grounded)this.x+=((input.right?1:0)-(input.left?1:0))*this.speed*.3;
 if(this.frame>=this.move.startup+this.move.active+this.move.recovery){this.move=null;this.transition('idle')}
 }else if(tick>=this.landingUntil){
 this.facing=enemy.x>this.x?1:-1;this.crouching=!!input.down&&this.grounded;
 const direction=(input.right?1:0)-(input.left?1:0);
 if(input.rollPressed&&this.startRoll(direction,tick)){}
 else if(tick<this.dashUntil){this.x+=this.dashDirection*9*this.character.speed;this.transition('dash')}
 else if(input.block&&this.grounded){this.transition('block')}
 else{
 if(input.dashPressed&&this.grounded&&tick>=this.dashCooldown){
 this.dashUntil=tick+10;this.dashCooldown=tick+45;this.dashDirection=direction||this.facing;
 // Only backward dashes evade, for a short window. Forward dashes commit.
 if(this.dashDirection!==this.facing)this.dodgeUntil=tick+5;
 this.transition('dash');
 }else{
 if(input.upPressed&&this.grounded){this.vy=12;this.crouching=false;this.transition('jump')}
 this.x+=direction*this.speed*(this.grounded?(this.crouching?.25:1):.65);
 this.transition(this.grounded?(this.crouching?'crouch':direction?'walk':'idle'):'jump');
 const type=pressedType||this.buffer?.type;this.buffer=null;
 if(type)this.attack(type,tick);
 if(type==='heavy'&&this.state==='attack'&&this.style.kind==='dodge')this.dodgeUntil=tick+5;
 }
 }
 }else this.transition('landing');
 this.y+=this.vy;this.vy-=.62;
 if(this.y<=0){this.y=0;this.vy=0;if(wasAirborne){this.airAttackUsed=false;this.airRollUsed=false;this.landingUntil=tick+7;if(this.state==='attack')this.landingUntil=tick+12}}
 this.x=Math.max(45,Math.min(1155,this.x));
 }
 hurtbox(){if(this.state==='roll')return {x:this.x-22,y:400-this.y-(this.rollAir?82:52),w:44,h:52};const low=this.crouching&&this.grounded;return{x:this.x-23,y:400-this.y-(low?65:110),w:46,h:low?65:110}}
 hitbox(){const m=this.move;if(this.state!=='attack'||this.phase!=='ACTIVE')return null;
 const authored=FRAME_HITBOXES[this.style.name]?.[m.type];const custom=typeof authored==='function'?authored(this):authored?.[this.frame];if(custom)return{x:this.x+(this.facing===1?custom.dx:-custom.dx-custom.w),y:400-this.y+custom.dy,w:custom.w,h:custom.h};
 const reach=this.style.reach*m.reach,low=attackIsLow(this),air=this.attackPosture==='air';
 return{x:this.facing===1?this.x+8:this.x-reach,y:400-this.y-(low?50:air?75:95),w:reach-8,h:air?85:50};}
}
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function resolveCombat(attacker,defender,tick,onHit,confirmed=false){
 const box=attacker.hitbox();if(!box||attacker.hit||defender.hp<=0||tick<defender.dodgeUntil||!confirmed&&!overlaps(box,defender.hurtbox()))return;
 const grapple=attacker.isGrapple();if(defender.state==='roll'&&defender.frame>=3&&defender.frame<=11&&!grapple)return;
 if(grapple&&(!attacker.grounded||!defender.grounded))return;
 attacker.hit=true;
 if(grapple&&tick-defender.lastThrowInput<=8){
 attacker.stun=16;defender.stun=16;attacker.move=null;defender.move=null;attacker.transition('hit');defender.transition('hit');
 attacker.x=Math.max(45,Math.min(1155,attacker.x-attacker.facing*18));defender.x=Math.max(45,Math.min(1155,defender.x+attacker.facing*18));defender.say('THROW ESCAPE',tick);onHit(defender.x,335,true,'tech');return;
 }
 const low=attackIsLow(attacker),overhead=attacker.attackPosture==='air'||attacker.move.type==='heavy'&&!grapple&&!low;
 const blocked=defender.state==='block'&&defender.facing!==attacker.facing&&!grapple&&(!low||defender.crouching)&&(!overhead||!defender.crouching);
 if(blocked&&tick-defender.blockStarted<=5){
 attacker.stun=29;attacker.move=null;attacker.transition('hit');defender.guard=Math.min(defender.maxGuard,defender.guard+12);defender.say('PERFECT GUARD',tick);onHit(defender.x,330,true,'parry');return;
 }
 const counter=!blocked&&defender.state==='attack';
 const punish=counter&&defender.phase==='RECOVERY';
 const repeated=attacker.combo>1;
 let damage=blocked?0:Math.round(attacker.style.damage*attacker.power*attacker.move.damage*(counter?1.2:1)*(repeated?.8:1));
 if(blocked){
 defender.guard=Math.max(0,defender.guard-attacker.move.guardDamage);defender.guardRegenAt=tick+105;
 defender.stun=9;defender.say('BLOCK',tick);
 if(defender.guard===0){defender.stun=65;defender.transition('guardbreak');defender.say('GUARD BROKEN',tick)}
 else defender.transition('block');
 }else{
 defender.stun=attacker.move.stun;defender.transition(grapple?'grounded':'hit');
 if(counter)attacker.say(punish?'PUNISH +20%':'COUNTER +20%',tick);
 if(grapple&&attacker.style.kind==='submission'){defender.stun+=12;defender.guard=Math.max(0,defender.guard-12);defender.guardRegenAt=tick+105;attacker.say('GROUND CONTROL',tick)}
 attacker.combo++;attacker.comboTarget=defender;attacker.comboUntil=tick+65;
 if(grapple){defender.vy=4;defender.y=1;defender.crouching=false;for(const p of [attacker,defender])p.throwUntil=tick+18;attacker.throwPartner=defender;defender.throwPartner=attacker;attacker.throwRole='attacker';defender.throwRole='defender'}
 }
 defender.hp=Math.max(0,defender.hp-damage);defender.move=null;defender.flashUntil=tick+8;defender.lastBlocked=blocked;
 const push=blocked?13:grapple?70:attacker.move.knockback||22,oldX=defender.x;defender.x=Math.max(45,Math.min(1155,defender.x+attacker.facing*push));
 const blockedPush=push-Math.abs(defender.x-oldX);attacker.x=Math.max(45,Math.min(1155,attacker.x-attacker.facing*((blocked?8:3)+blockedPush)));
 if(grapple){defender.throwFromX=oldX;defender.throwToX=defender.x;defender.x=oldX}
 onHit(defender.x,400-defender.y-(defender.crouching?40:65),blocked,blocked?'block':punish?'punish':counter?'counter':grapple?'throw':'hit');
}

// Contacts are sampled together. Active strikes trade; strikes beat grabs.
export function resolveExchange(players,tick,onHit){
 const snapshots=players.map(p=>({state:p.state,frame:p.frame,move:p.move?{...p.move}:null,hit:p.hit,hp:p.hp,attackPosture:p.attackPosture}));
 const contact=players.map((p,i)=>{const d=players[1-i],box=p.hitbox();return !!box&&!p.hit&&d.hp>0&&tick>=d.dodgeUntil&&overlaps(box,d.hurtbox())&&!(d.state==='roll'&&d.frame>=3&&d.frame<=11&&!p.isGrapple())&&(!p.isGrapple()||p.grounded&&d.grounded)});
 const order=players[0].isGrapple()&&!players[1].isGrapple()?[1,0]:[0,1];
 resolveCombat(players[order[0]],players[order[1]],tick,(...args)=>onHit(order[0],...args));
 const second=order[1],p=players[second],first=players[order[0]];
 if(contact[0]&&contact[1]&&!players[0].isGrapple(snapshots[0].move?.type)&&!players[1].isGrapple(snapshots[1].move?.type)&&snapshots[second].state==='attack'&&p.state!=='attack'){
  const interrupted={state:p.state,frame:p.frame,move:p.move,hp:p.hp};Object.assign(p,snapshots[second]);
  resolveCombat(p,first,tick,(...args)=>onHit(second,...args),true);Object.assign(p,interrupted);
 }else resolveCombat(p,first,tick,(...args)=>onHit(second,...args));
}

export function separateFighters(players){
 // Separate grounded bodies symmetrically, including at the stage edges.
 let gap=players[1].x-players[0].x;
 if(Math.abs(gap)<48&&Math.abs(players[0].y-players[1].y)<75&&!players.some(p=>p.state==='roll')){
 const sign=gap>=0?1:-1,shift=(48-Math.abs(gap))/2;
 players[0].x-=sign*shift;players[1].x+=sign*shift;
 for(const p of players)p.x=Math.max(45,Math.min(1155,p.x));
 if(Math.abs(players[1].x-players[0].x)<48){
 if(players[0].x<=45)players[1].x=93;else if(players[1].x<=45)players[0].x=93;
 else if(players[0].x>=1155)players[1].x=1107;else if(players[1].x>=1155)players[0].x=1107;
 }
 }
}
