const clamp01=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp01(value);return t*t*(3-2*t)};
const mixPoint=(a,b,t)=>a.map((value,i)=>value+(b[i]-value)*t);
const mixPose=(a,b,t)=>Object.fromEntries(Object.keys(a).map(key=>[key,mixPoint(a[key],b[key],t)]));

// Animation follows the simulation frame, so pauses and hitstop freeze the pose.
// The last part of startup leads into contact; recovery returns to the same guard.
export function attackMotion(p){
 if(p.state!=='attack'||!p.move)return {extension:0,load:0,trail:0};
 const {startup,active,recovery}=p.move,frame=p.frame,after=frame-startup-active;
 const release=ease((frame-startup*.7)/(startup*.3));
 const retract=1-ease(after/Math.max(1,recovery*.8));
 return {
  extension:release*retract,
  load:ease(frame/Math.max(1,startup*.65))*(1-release),
  trail:frame<startup?clamp01((frame-startup+4)/4)*.35:after<0?.8:Math.max(0,.8*(1-after/7))
 };
}

// Two connected segments keep wrists and elbows within a human silhouette.
// Targets may vary with style reach, but limbs never stretch to fill a hitbox.
export function bendLimb(root,target,upper,lower,bend=1){
 const dx=target[0]-root[0],dy=target[1]-root[1],length=Math.hypot(dx,dy)||1;
 const distance=Math.max(Math.abs(upper-lower)+.01,Math.min(upper+lower-.01,length));
 const ux=dx/length,uy=dy/length,along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
 return {joint:[root[0]+ux*along-uy*height,root[1]+uy*along+ux*height],end:[root[0]+ux*distance,root[1]+uy*distance]};
}

// Every ordinary action uses the same joint rig. Feet and wrists are targets;
// elbows and knees are solved from bounded segments instead of stretching lines.
function rig(p,changes={}){
 const b=p.character.bulk;
 const pose={hip:[0,-55],shoulder:[0,-82],head:[1,-102],rearHand:[0,-88],hand:[24,-91],backFoot:[-25,-2],frontFoot:[28,-2],...changes};
 const angle=Math.atan2(pose.hip[1]-pose.shoulder[1],pose.hip[0]-pose.shoulder[0])-Math.PI/2,nx=Math.cos(angle),ny=Math.sin(angle);
 for(const [side,hand,elbow] of [[1,'hand','elbow'],[-1,'rearHand','rearElbow']]){
  const root=[pose.shoulder[0]+side*12*b*nx,pose.shoulder[1]+2+side*12*b*ny];
  const bend=side<0&&pose[hand][1]<root[1]-18?-1:1;
  const arm=bendLimb(root,pose[hand],27*b,25*b,bend);pose[hand]=arm.end;pose[elbow]=arm.joint;
 }
 for(const [side,foot,knee] of [[1,'frontFoot','frontKnee'],[-1,'backFoot','backKnee']]){
  const leg=bendLimb([pose.hip[0]+side*8*nx,pose.hip[1]+side*8*ny],pose[foot],29,30,-side);
  pose[foot]=leg.end;pose[knee]=leg.joint;
 }
 return pose;
}

function restPose(p){
 const low=p.crouching&&p.grounded;
 return rig(p,low?{hip:[-2,-27],shoulder:[1,-54],head:[2,-74],hand:[26,-62],rearHand:[0,-60]}:!p.grounded?{backFoot:[-18,-22],frontFoot:[25,-15]}:{});
}

function samplePoses(keys,frame){
 if(frame>=keys.at(-1)[0])return keys.at(-1)[1];
 const end=Math.max(1,keys.findIndex(([time])=>time>frame));
 const [aTime,a]=keys[end-1],[bTime,b]=keys[end];
 return mixPose(a,b,ease((frame-aTime)/Math.max(1,bTime-aTime)));
}

function turnPose(pose,angle,center=[0,-35],floor=false){
 const result=Object.fromEntries(Object.entries(pose).map(([key,[x,y]])=>[key,[center[0]+(x-center[0])*Math.cos(angle)-(y-center[1])*Math.sin(angle),center[1]+(x-center[0])*Math.sin(angle)+(y-center[1])*Math.cos(angle)]]));
 if(floor){const bottom=Math.max(...Object.entries(result).map(([key,point])=>point[1]+(key==='head'?12:key.endsWith('Foot')?3:7)));if(bottom>1)for(const point of Object.values(result))point[1]-=bottom-1}
 return result;
}

export function fighterPose(p,tick=0,presentation=tick){
 const idle=restPose(p),frame=p.frame||0;
 if(p.celebrating||p.state==='victory'){
  const raised=p.character.id==='atlas'?{hand:[22,-132],rearHand:[-20,-130]}:p.character.id==='rhea'?{hand:[20,-89],rearHand:[6,-87]}:{hand:[31,-132+Math.sin(presentation*.08)*2]};
  return rig(p,raised);
 }
 if(p.state==='roll'){
  const duration=p.rollDuration||24,fold=3,unfold=duration-4;
  const tuck=rig(p,{hip:[-7,-30],shoulder:[2,-53],head:[16,-65],hand:[23,-36],rearHand:[-4,-37],backFoot:[-6,-18],frontFoot:[18,-18]});
  const pose=frame<fold?mixPose(idle,tuck,ease(frame/fold)):frame>unfold?mixPose(tuck,idle,ease((frame-unfold)/(duration-unfold))):tuck;
  const turn=ease((frame-fold)/Math.max(1,unfold-fold))*Math.PI*2*(p.rollDirection||1)*p.facing;
  return turnPose(pose,turn,[0,-37],!p.rollAir);
 }
 if(['ko','grounded'].includes(p.state)||tick<(p.throwUntil||0)&&p.throwRole==='defender'){
  const fallen=rig(p,{hand:[29,-69],rearHand:[-22,-54],frontFoot:[31,-5],backFoot:[-25,-11]});
  return turnPose(fallen,-Math.PI*.48*ease(frame/16),[-20,-2],p.grounded);
 }
 if(p.state==='attack'&&p.move){
  if(p.move.type==='special'){
   const special=specialPose(p);
   // Retain the five signatures, while applying the same leg-length constraints.
   const repaired=rig(p,special);
   const joined={...special,backKnee:repaired.backKnee,backFoot:repaired.backFoot,frontKnee:repaired.frontKnee,frontFoot:repaired.frontFoot};
   const total=p.move.startup+p.move.active+p.move.recovery;
   return mixPose(idle,joined,ease(frame/5)*ease((total-frame-1)/5));
  }
  const {startup,active,recovery,type}=p.move,reach=p.style.reach*p.move.reach,low=p.attackPosture==='crouching',air=p.attackPosture==='air';
  const height=low?28:0;
  let load,contact,retract;
  if(type==='kick'||type==='heavy'&&p.style.kind==='knee'){
   const knee=type==='heavy',step=air?Math.max(0,reach-101):Math.max(0,reach-98),support=[step-25,air?-22:-2];
   load=rig(p,{hip:[step,-49+height*.7],shoulder:[step-5,-82+height],head:[step-4,-102+height],hand:[step+18,-91+height],rearHand:[step,-91+height],backFoot:support,frontFoot:[step+34,-29+height*.3]});
   contact=rig(p,{hip:[step+17,-48+height*.7],shoulder:[step+3,-82+height],head:[step+2,-102+height],hand:[step+21,-92+height],rearHand:[step+5,-91+height],backFoot:support,frontFoot:knee?[step+48,-36+height*.6]:[reach-8,low?-22:air?-53:-62]});
   retract=load;
  }else{
   const grapple=type==='throw'||type==='heavy'&&['throw','submission'].includes(p.style.kind);
   const travel=grapple?8:Math.max(4,reach-63),punchY=low?-39:air?-61:-81;
   load=rig(p,{...idle,shoulder:[-5,-82+height],head:[-4,-102+height],hand:[8,-81+height]});
   contact=rig(p,{hip:[travel*.45,-49+height*.8],shoulder:[travel,-82+height],head:[travel-2,-102+height],hand:[grapple?49:reach-5,punchY],rearHand:grapple?[36,punchY+6]:[travel+1,-91+height],backFoot:idle.backFoot,frontFoot:[28+travel*.3,air?-15:-2]});
   retract=rig(p,{...idle,shoulder:[travel*.35,-82+height],head:[travel*.35,-102+height],hand:[29,-88+height]});
  }
  return samplePoses([[0,idle],[startup*.55,load],[startup,contact],[startup+active,contact],[startup+active+recovery*.42,retract],[startup+active+recovery-1,idle]],frame);
 }
 if(p.state==='block')return rig(p,{...idle,hand:[18,-100+(p.crouching?28:0)],rearHand:[7,-86+(p.crouching?28:0)]});
 if(['hit','guardbreak','defeat'].includes(p.state))return rig(p,{...idle,hip:[-3,idle.hip[1]],shoulder:[-12,idle.shoulder[1]+3],head:[-15,idle.head[1]+3],hand:[16,idle.hand[1]+10]});
 if(p.state==='dash')return rig(p,{...idle,hip:[6,-47],shoulder:[16,-77],head:[16,-98],backFoot:[-29,-2],frontFoot:[35,-2]});
 if(p.state==='landing')return rig(p,{hip:[0,-43],shoulder:[4,-76],head:[5,-96],hand:[27,-85]});
 if(p.state==='walk'){
  const stride=Math.sin(frame*.23),lift=Math.sin(frame*.23+Math.PI);
  return rig(p,{...idle,hip:[0,-55+Math.abs(stride)*1.5],backFoot:[-25+stride*10,-2-Math.max(0,stride)*6],frontFoot:[28-stride*10,-2-Math.max(0,lift)*6]});
 }
 return idle;
}

export function specialPose(p){
 if(p.state!=='attack'||p.move?.type!=='special')return null;
 const b=p.character.bulk,reach=p.style.reach*p.move.reach;
 const idle=rig(p);
 const pose=changes=>rig(p,{...idle,...changes});
 let load,strike,follow;
 switch(p.character.id){
  case 'atlas':{
   // Both hands lift together, then fall forward with the torso behind them.
   const contact=Math.min(84,reach-7);
   load=pose({hip:[-5,-51],shoulder:[-6,-85],head:[-3,-105],rearHand:[-2,-128],hand:[7,-130],backKnee:[-20,-24],frontKnee:[16,-27]});
   strike=pose({hip:[7,-45],shoulder:[22,-77],head:[23,-98],rearHand:[contact-9,-65],hand:[contact,-63],backKnee:[-13,-23],frontKnee:[25,-23]});
   follow=pose({hip:[8,-43],shoulder:[24,-74],head:[25,-95],rearHand:[contact-10,-53],hand:[contact-1,-51],backKnee:[-12,-23],frontKnee:[26,-22]});
   break;
  }
  case 'kai':
   load=pose({hip:[-3,-50],shoulder:[-7,-83],head:[-6,-103],hand:[4,-79],rearHand:[-12,-77]});
   strike=pose({hip:[5,-48],shoulder:[17,-81],head:[16,-102],hand:[Math.min(89,reach-6),-80],rearHand:[5,-72],frontKnee:[23,-25]});
   follow=pose({...strike,shoulder:[14,-80],head:[14,-101],hand:[Math.min(83,reach-12),-78]});
   break;
  case 'rhea':
   load=pose({hip:[-3,-47],shoulder:[-3,-80],head:[-2,-101],hand:[22,-91],rearHand:[13,-85]});
   strike=pose({hip:[6,-47],shoulder:[13,-79],head:[12,-100],hand:[61,-82],rearHand:[45,-77],frontKnee:[23,-24]});
   follow=pose({...strike,hand:[57,-80],rearHand:[42,-75]});
   break;
  case 'jin':
   load=pose({hip:[-4,-43],shoulder:[-5,-76],head:[-3,-97],hand:[12,-57],rearHand:[-7,-77],frontKnee:[21,-21]});
   strike=pose({hip:[5,-51],shoulder:[12,-86],head:[9,-107],hand:[44,-127],rearHand:[2,-77],frontKnee:[21,-27]});
   follow=pose({...strike,shoulder:[10,-85],head:[7,-106],hand:[39,-129]});
   break;
  case 'nyx':{
   load=pose({hip:[-3,-49],shoulder:[-8,-82],head:[-7,-102],hand:[16,-88],rearHand:[-18,-74],frontKnee:[21,-40],frontFoot:[14,-21]});
   const foot=[Math.min(91,reach-10),-65],leg=bendLimb([13,-49],foot,37,41,-1);
   strike=pose({hip:[5,-49],shoulder:[-10,-82],head:[-9,-103],hand:[12,-88],rearHand:[-29,-75],frontKnee:leg.joint,frontFoot:leg.end});
   follow=pose({...strike,frontKnee:[37,-52],frontFoot:[66,-58]});
   break;
  }
  case 'sora':
   load=pose({hip:[-3,-51],shoulder:[-6,-84],head:[-5,-104],hand:[19,-92],rearHand:[-2,-87],frontFoot:[30,-29]});
   strike=pose({hip:[12,-50],shoulder:[-2,-83],head:[-3,-104],hand:[20,-93],rearHand:[-6,-86],frontFoot:[Math.min(91,reach-6),-75]});
   follow=pose({...strike,frontFoot:[47,-31],hip:[8,-50],shoulder:[0,-82],head:[1,-102]});
   break;
  case 'bruno':
   load=pose({hip:[-5,-45],shoulder:[-9,-78],head:[-8,-99],hand:[4,-68],rearHand:[-5,-87]});
   strike=pose({hip:[9,-47],shoulder:[25,-78],head:[23,-100],hand:[Math.min(91,reach-4),-70],rearHand:[22,-89]});
   follow=pose({...strike,hip:[10,-46],shoulder:[22,-77],head:[21,-99],hand:[60,-69]});
   break;
  case 'mei':
   load=pose({hip:[-2,-55],shoulder:[-5,-84],head:[-4,-104],hand:[12,-88],rearHand:[-5,-89]});
   strike=pose({hip:[6,-48],shoulder:[24,-82],head:[22,-102],hand:[Math.min(93,reach-5),-83],rearHand:[18,-88]});
   follow=pose({...strike,shoulder:[17,-83],head:[15,-103],hand:[64,-85],rearHand:[11,-89]});
   break;
  case 'omar':
   load=pose({hip:[-4,-49],shoulder:[-6,-81],head:[-5,-102],hand:[8,-101],rearHand:[-4,-84]});
   strike=pose({hip:[9,-48],shoulder:[23,-80],head:[19,-101],hand:[38,-104],rearHand:[15,-88]});
   follow=pose({...strike,hand:[35,-98],shoulder:[19,-79],head:[17,-100]});
   break;
  case 'zuri':
   load=pose({hip:[-2,-48],shoulder:[0,-80],head:[2,-101],hand:[24,-92],rearHand:[-14,-67],frontFoot:[19,-22]});
   strike=pose({hip:[8,-47],shoulder:[-4,-78],head:[-2,-99],hand:[17,-88],rearHand:[-29,-69],frontFoot:[Math.min(78,reach-5),-59]});
   follow=pose({...strike,frontFoot:[34,-26],hand:[24,-86],rearHand:[-12,-75]});
   break;
  case 'bastion':
   load=pose({hip:[-5,-43],shoulder:[-10,-75],head:[-12,-97],hand:[13,-85],rearHand:[-4,-88]});
   strike=pose({hip:[10,-43],shoulder:[30,-74],head:[23,-95],hand:[29,-96],rearHand:[22,-70]});
   follow=pose({...strike,hip:[8,-43],shoulder:[27,-73],head:[20,-94],hand:[30,-92]});
   break;
  case 'leila':
   load=pose({hip:[-4,-48],shoulder:[-7,-81],head:[-6,-103],hand:[11,-77],rearHand:[-5,-90]});
   strike=pose({hip:[6,-46],shoulder:[19,-80],head:[14,-102],hand:[Math.min(78,reach-5),-72],rearHand:[Math.min(69,reach-15),-89]});
   follow=pose({...strike,shoulder:[16,-79],head:[12,-101],hand:[60,-70],rearHand:[54,-87]});
   break;
  default:return null;
 }
 const {startup,active,recovery}=p.move;
 const keys=[[0,idle],[startup*.68,load],[startup,strike],[startup+active+Math.min(4,recovery*.1),follow],[startup+active+recovery-2,idle]];
 const frame=Math.max(0,p.frame),last=keys.at(-1);
 let result=idle;
 if(frame<last[0]){
  const end=keys.findIndex(([time])=>time>frame),[aTime,a]=keys[Math.max(0,end-1)],[bTime,bPose]=keys[Math.max(1,end)];
  const t=ease((frame-aTime)/Math.max(1,bTime-aTime));
  result=Object.fromEntries(Object.keys(idle).map(key=>[key,mixPoint(a[key],bPose[key],t)]));
 }
 // Crouching lowers the upper body without pushing planted feet underground.
 const duck=p.crouching&&p.grounded?28:0;
 return Object.fromEntries(Object.entries(result).map(([key,point])=>[key,[point[0],point[1]+(key.endsWith('Foot')?0:key.endsWith('Knee')?duck*.35:duck)]]));
}
