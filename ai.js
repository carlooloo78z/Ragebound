import {attackIsLow} from './styles.js';
// The top two levels think three times as often and make a third as many
// defensive mistakes. Fractional delays round up naturally on the 60 Hz clock.
export const DIFFICULTIES={beginner:{name:'Level 1 / Beginner',reaction:42,defense:.2,hesitation:.32},easy:{name:'Level 2 / Apprentice',reaction:28,defense:.4,hesitation:.15},normal:{name:'Level 3 / Challenger',reaction:18,defense:.7,hesitation:.04},hard:{name:'Level 4 / Master',reaction:11/3,defense:1-(1-.85)/3,hesitation:0,pace:3},expert:{name:'Level 5 / Champion',reaction:8/3,defense:1-(1-.94)/3,hesitation:0,pace:3}};
// The opponent observes delayed visual state, never the player's live input.
export class TacticalAI {
 constructor(){this.reset()}
 reset(seed){this.observations=[];this.nextDecision=0;this.plan={};this.seed=seed??((Date.now()^Math.floor(Math.random()*4294967296))>>>0);this.guardHabit=.3;this.lastSample=0}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296}
 command(self,enemy,tick,difficulty='normal'){
 const level=DIFFICULTIES[difficulty]||DIFFICULTIES.normal,reaction=level.reaction,pace=level.pace||1;
 this.observations.push({tick,x:enemy.x,y:enemy.y,state:enemy.state,crouching:enemy.crouching,phase:enemy.phase,posture:attackIsLow(enemy)?'crouching':enemy.attackPosture,type:enemy.move?.type});
 this.observations=this.observations.filter(o=>tick-o.tick<80);
 const seen=this.observations.findLast(o=>o.tick<=tick-reaction);
 const held={...this.plan};for(const k of Object.keys(held))if(k.endsWith('Pressed')||k==='special')delete held[k];
 if(!seen)return {};
 if(tick<this.nextDecision)return held;
 this.nextDecision=tick+reaction+Math.floor(this.random()*8)/pace;
 const distance=Math.abs(self.x-seen.x),toward=seen.x<self.x?'left':'right',away=toward==='left'?'right':'left';
 const roll=this.random();let out={};
 this.guardHabit=this.guardHabit*.92+(seen.state==='block'?1:0)*.08;
 if(self.stun>0||self.state==='attack')return this.plan={};
 if(this.random()<level.hesitation)return this.plan={};
 if(difficulty==='beginner'&&seen.state==='attack'&&seen.phase==='RECOVERY'&&this.random()<.5)return this.plan={};
 if(['hard','expert'].includes(difficulty)&&seen.state==='attack'&&seen.phase==='RECOVERY'&&distance>self.style.reach&&distance<220){out[toward]=true;out.dashPressed=distance>150;return this.plan=out}
 const preferred=self.style.preferredRange??(self.style.kind==='throw'||self.style.kind==='submission'?60:self.style.kind==='knee'?115:90);
 if(seen.state==='attack'&&seen.phase!=='RECOVERY'&&distance<160){
 if(roll<level.defense){
 out.block=true;out.down=seen.posture==='crouching';
 }else if(roll<.9){out[away]=true;out.rollPressed=roll>.8;out.dashPressed=!out.rollPressed}
 else out.lightPressed=true;
 }else if(distance>preferred+30){out[toward]=true;if(distance>300&&roll<.25)out.dashPressed=true}
 else if(distance<48){out.throwPressed=roll<.65;out[away]=!out.throwPressed}
 else if(self.guard<25&&distance<180){out[away]=true;out.dashPressed=roll<.35}
 else if(roll<.13/pace){out[away]=true}
 else if(distance<self.style.reach+20&&seen.phase==='RECOVERY'){out.lightPressed=true}
 else if(seen.state==='block'||this.guardHabit>.5){
 if(distance<65)out.throwPressed=true;
 else if(roll<.5){out[toward]=true}else{out.heavyPressed=true;out.down=false}
 }else{
 const choice=this.random();
 if(distance>self.style.reach+15)out.kickPressed=true;
 else if(choice<.4){out.lightPressed=true;out.down=roll<.4}
 else if(choice<.65)out.kickPressed=true;
 else if(choice<.82)out.heavyPressed=true;
 else if(choice<.93&&difficulty!=='beginner')out.special=true;
 else{out.upPressed=true;out[toward]=true;out.kickPressed=true}
 }
 this.plan=out;return out;
 }
}
