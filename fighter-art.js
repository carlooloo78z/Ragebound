// Character artwork is separate from the pose rig and combat simulation.
// These contours follow the existing joints; outfit purchases tint the clothing.
const LOOKS={
 kai:{skin:'#c59270',shade:'#84573f',light:'#e9b895',hair:'#282526',shoulders:19,arm:13,thigh:21,calf:15,clothes:'gi',haircut:'swept'},
 atlas:{skin:'#aa795c',shade:'#674431',light:'#d2a080',hair:'#30251f',shoulders:21,arm:15,thigh:22,calf:16,clothes:'vest',haircut:'crop'},
 nyx:{skin:'#c39b7e',shade:'#805b47',light:'#e9c3a2',hair:'#182433',shoulders:18,arm:13,thigh:22,calf:16,clothes:'sport',haircut:'ponytail'},
 rhea:{skin:'#976e57',shade:'#5e4033',light:'#c59a7d',hair:'#30272a',shoulders:20,arm:14,thigh:22,calf:16,clothes:'wrap',haircut:'bun'},
 jin:{skin:'#d0aa88',shade:'#8c644c',light:'#f1ccaa',hair:'#242a32',shoulders:19,arm:13,thigh:21,calf:15,clothes:'jacket',haircut:'fringe'},
 sora:{skin:'#bf8d6b',shade:'#79543e',light:'#e9b595',hair:'#eee1bc',shoulders:18,arm:12,thigh:22,calf:16,clothes:'sport',haircut:'choppy'},
 bruno:{skin:'#79513f',shade:'#49342c',light:'#a67456',hair:'#252323',shoulders:22,arm:16,thigh:23,calf:17,clothes:'hoodie',haircut:'mohawk'},
 mei:{skin:'#d3a589',shade:'#8b6553',light:'#f1c7a7',hair:'#252a36',shoulders:17,arm:12,thigh:20,calf:14,clothes:'collar',haircut:'bob'},
 omar:{skin:'#a47751',shade:'#684d36',light:'#d2a176',hair:'#302820',shoulders:20,arm:14,thigh:23,calf:16,clothes:'vest',haircut:'curls'},
 zuri:{skin:'#916044',shade:'#5c3f30',light:'#bc8862',hair:'#35252c',shoulders:18,arm:13,thigh:23,calf:16,clothes:'racer',haircut:'afro'},
 bastion:{skin:'#c19a86',shade:'#826254',light:'#e8c5ae',hair:'#6a6765',shoulders:23,arm:16,thigh:24,calf:18,clothes:'plates',haircut:'shaved'},
 leila:{skin:'#c39872',shade:'#805c43',light:'#e6bb90',hair:'#3e3028',shoulders:18,arm:13,thigh:21,calf:15,clothes:'tunic',haircut:'braid'}
};

export function drawFighterArt(c,p,pose,color){
 const look=LOOKS[p.character.id]||LOOKS.kai,b=p.character.bulk;
 const {hip,shoulder,head,backKnee,backFoot,frontKnee,frontFoot,rearElbow,rearHand,elbow,hand}=pose;
 const bodyAngle=Math.atan2(hip[1]-shoulder[1],hip[0]-shoulder[0])-Math.PI/2,nx=Math.cos(bodyAngle),ny=Math.sin(bodyAngle),length=Math.hypot(hip[0]-shoulder[0],hip[1]-shoulder[1]);
 const anchor=(point,side)=>[point[0]+nx*side,point[1]+ny*side];
 const design=p.outfitDesign,accent=design?.accent||color,outline='#172431';
 const line=(points,width,ink)=>{c.strokeStyle=ink;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()};
 const oval=(x,y,rx,ry,fill,angle=0)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill()};
 const finish=(fill,edge=outline,width=1.15)=>{c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke()}};
 const cloth=(x,y,span)=>{const g=c.createLinearGradient(x-span,y,x+span,y);g.addColorStop(0,'#243a48');g.addColorStop(.42,color);g.addColorStop(1,'#304752');return g};

 // Rounded muscle/fabric masses overlap at the joint. No thin edge stripes.
 const segment=(a,z,width,endWidth,base,shade,light,flat=false)=>{
  const dx=z[0]-a[0],dy=z[1]-a[1],distance=Math.hypot(dx,dy)||1,px=-dy/distance,py=dx/distance;
  const at=(t,w)=>[a[0]+dx*t+px*w,a[1]+dy*t+py*w];
  const q=(t,w)=>at(t,w),start=width*.43,end=endWidth*.43;
  let fill=base;
  if(!flat){fill=c.createLinearGradient(a[0]-px*width*.5,a[1]-py*width*.5,a[0]+px*width*.5,a[1]+py*width*.5);fill.addColorStop(0,shade);fill.addColorStop(.5,base);fill.addColorStop(1,light)}
  c.beginPath();c.moveTo(...q(0,start));c.quadraticCurveTo(...q(.32,width*.65),...q(.72,width*.44));c.quadraticCurveTo(...q(.94,end),...q(1,end));
  c.quadraticCurveTo(...q(1.09,0),...q(1,-end));c.quadraticCurveTo(...q(.55,-width*.51),...q(0,-start));c.quadraticCurveTo(...q(-.11,0),...q(0,start));c.closePath();finish(fill);
 };
 const limb=(root,joint,end,width,kind,rear=false)=>{
  const skin=kind==='arm';
  const base=skin?(rear?look.shade:look.skin):color;
  // Overlapping filled shapes stay solid when a joint folds back on itself.
  // A matching fill joins the two masses without exposed hinge circles.
  segment(root,joint,width,width*.74,base,base,base,true);
  segment(joint,end,width*(skin?.82:.73),width*(skin?.57:.47),base,base,base,true);
  oval(joint[0],joint[1],width*.31,width*.31,base);
  const d1=Math.hypot(joint[0]-root[0],joint[1]-root[1])||1,d2=Math.hypot(end[0]-joint[0],end[1]-joint[1])||1;
  const n1=[-(joint[1]-root[1])/d1,(joint[0]-root[0])/d1],n2=[-(end[1]-joint[1])/d2,(end[0]-joint[0])/d2];
  const offset=(point,n,r)=>[point[0]+n[0]*r,point[1]+n[1]*r];
  const along=(a,z,t,n,r)=>[a[0]+(z[0]-a[0])*t+n[0]*r,a[1]+(z[1]-a[1])*t+n[1]*r];
  const wrist=width*(skin?.28:.24);
  c.save();c.globalAlpha=skin?.21:.25;
  c.beginPath();c.moveTo(...offset(root,n1,-width*.23));c.quadraticCurveTo(...along(root,joint,.4,n1,-width*.32),...offset(joint,n1,-width*.18));
  c.quadraticCurveTo(...offset(joint,n2,-width*.22),...offset(end,n2,-wrist*.65));c.lineTo(...end);c.quadraticCurveTo(...joint,...root);c.closePath();finish(skin?look.shade:'#183644',null);
  c.restore();
  if(!skin)line([offset(joint,n1,width*.18),offset(joint,n2,width*.2)],1,'#263b4666');
 };
 const foot=(pos,knee)=>{
  const angle=pos[1]<-9?Math.max(-1.4,Math.min(.7,Math.atan2(pos[1]-knee[1],pos[0]-knee[0])-Math.PI/2)):0;
  c.save();c.translate(...pos);c.rotate(angle);
  c.beginPath();c.moveTo(-6,-6);c.quadraticCurveTo(0,-8,5,-5);c.lineTo(7,-2);c.quadraticCurveTo(15,-2,15,3);c.quadraticCurveTo(8,6,-7,4);c.closePath();finish('#263a47');
  line([[-6,3],[7,4],[13,3]],2,'#adb9b7');line([[-3,-4],[3,-3]],2,accent);
  c.restore();
 };
 const fist=(wrist,joint,rear=false)=>{
  c.save();c.translate(...wrist);c.rotate(Math.atan2(wrist[1]-joint[1],wrist[0]-joint[0]));
  c.scale(b,b);
  c.beginPath();c.moveTo(-6,-4.3);c.lineTo(-1,-5);c.lineTo(0,5);c.lineTo(-6,4.3);c.closePath();finish(design?.accent||'#d5d2bd');
  line([[-4,-3],[-4,3]],.65,'#6e7774');
  c.beginPath();c.moveTo(-1,-5);c.quadraticCurveTo(4,-8,9,-5);c.quadraticCurveTo(12,-3,11,2);c.quadraticCurveTo(10,6,4,6);c.lineTo(0,5);c.quadraticCurveTo(-5,4,-3,0);c.closePath();finish(rear?look.skin:look.light,'#493e36');
  c.beginPath();c.moveTo(-2,0);c.quadraticCurveTo(2,-2,4,1);c.quadraticCurveTo(4,4,0,4);finish(look.skin,null);
  line([[6,-4],[7,0]],.7,look.shade);line([[9,-3],[9,0]],.6,look.shade);
  c.restore();
 };
 const arm=(root,joint,wrist,rear=false)=>{
  limb(root,joint,wrist,look.arm*b,'arm',rear);
  // Cloth sleeves on martial jackets; bare deltoids on the athletic outfits.
  if(['gi','jacket','wrap','collar','plates','tunic'].includes(look.clothes)){
   const end=[root[0]+(joint[0]-root[0])*.39,root[1]+(joint[1]-root[1])*.39];
   segment(root,end,look.arm*b*1.32,look.arm*b*1.14,color,'#263f4a','#7b9d9b');
  }else oval(root[0],root[1],look.arm*b*.54,look.arm*b*.53,rear?look.shade:look.skin);
 };

 // Far limbs sit behind the hip mass and upper body; front limbs sit over them.
 limb(anchor(hip,-8),backKnee,backFoot,look.thigh*b,'leg',true);foot(backFoot,backKnee);
 limb(anchor(hip,8),frontKnee,frontFoot,look.thigh*b,'leg');foot(frontFoot,frontKnee);
 arm(anchor([shoulder[0],shoulder[1]+2],-12*b),rearElbow,rearHand,true);

 c.save();c.translate(...shoulder);c.rotate(bodyAngle);
 const w=look.shoulders*b,waist=12*b;
 // Hips and the overlap of the trouser legs fill the old gap below the belt.
 c.beginPath();c.moveTo(-waist,length-4);c.quadraticCurveTo(-19*b,length+7,-12*b,length+16);c.lineTo(0,length+11);c.lineTo(12*b,length+16);c.quadraticCurveTo(19*b,length+7,waist,length-4);c.closePath();finish(cloth(0,length,20));
 // Trapezius, rounded shoulders, ribcage, then a narrower waist.
 c.beginPath();c.moveTo(-8,-6);c.quadraticCurveTo(-w*.8,-7,-w,2);c.quadraticCurveTo(-w-2,9,-w*.79,17);c.quadraticCurveTo(-waist,length*.75,-waist,length);
 c.quadraticCurveTo(0,length+4,waist,length);c.quadraticCurveTo(waist,length*.72,w*.8,16);c.quadraticCurveTo(w+2,5,w-2,0);c.quadraticCurveTo(w*.6,-7,7,-6);c.closePath();finish(cloth(0,0,w));
 if(look.clothes==='vest'){
  c.beginPath();c.moveTo(-8,-5);c.quadraticCurveTo(-9,9,-5,17);c.quadraticCurveTo(1,20,8,15);c.lineTo(7,-5);c.closePath();finish(look.skin,null);
  line([[-7,4],[0,7],[7,4]],1,look.shade);line([[0,8],[0,15]],.8,look.shade);
  line([[-10,-3],[-11,11],[-8,20]],2,accent);line([[9,-3],[11,11],[8,20]],2,accent);
 }else if(look.clothes==='hoodie'){
  c.beginPath();c.moveTo(-12,-5);c.quadraticCurveTo(0,17,13,-5);c.lineTo(9,-9);c.quadraticCurveTo(0,2,-8,-9);c.closePath();finish('#29343e');
  line([[-5,2],[-5,15]],1.5,'#e5d9bd');line([[5,2],[5,18]],1.5,'#e5d9bd');
  line([[-9,length-8],[-4,length-13],[6,length-13],[10,length-8]],2,accent);
 }else if(look.clothes==='collar'){
  c.beginPath();c.moveTo(-8,-7);c.lineTo(-7,2);c.lineTo(8,2);c.lineTo(8,-7);c.lineTo(4,-4);c.lineTo(-4,-4);c.closePath();finish('#263944');
  line([[0,3],[0,length-4]],2,accent);
  for(const y of [8,15,22]){line([[-4,y],[5,y]],1.5,'#e7cf8e');oval(5,y,1.2,1.2,'#e7cf8e')}
 }else if(look.clothes==='plates'){
  c.beginPath();c.moveTo(-11,-5);c.lineTo(-9,1);c.lineTo(9,1);c.lineTo(11,-5);c.lineTo(8,-9);c.lineTo(-8,-9);c.closePath();finish('#354451');
  for(const side of [-1,1]){
   c.beginPath();c.moveTo(side*3,6);c.lineTo(side*(w-6),3);c.lineTo(side*(w-7),16);c.lineTo(side*3,21);c.closePath();finish(cloth(0,4,w),'#334855');
   line([[side*5,9],[side*(w-9),7]],2,accent);
  }
  line([[-9,length-8],[9,length-8]],4,'#344753');line([[-8,length-5],[8,length-5]],2,accent);
 }else if(look.clothes==='racer'){
  c.beginPath();c.moveTo(-7,-6);c.quadraticCurveTo(0,7,8,-6);c.lineTo(5,6);c.lineTo(-4,6);c.closePath();finish('#2d303e',null);
  line([[-w+5,1],[-w+8,14],[-3,length-5]],4,'#e9d3b2');
  line([[w-5,2],[w-8,15],[3,length-5]],2.5,accent);
 }else if(look.clothes==='tunic'){
  c.beginPath();c.moveTo(-7,-6);c.lineTo(0,3);c.lineTo(7,-6);c.closePath();finish(look.skin,null);
  line([[8,-4],[-9,14],[-8,length-3]],5,'#e2d8b8');
  line([[-w+3,3],[-w+7,17]],3,accent);line([[w-4,6],[w-7,19]],3,accent);
  c.beginPath();c.moveTo(-waist,length+2);c.lineTo(-waist-3,length+17);c.lineTo(0,length+12);c.lineTo(waist+2,length+20);c.lineTo(waist,length+2);c.closePath();finish(cloth(0,length,waist));
 }else if(look.clothes==='sport'){
  c.beginPath();c.moveTo(-6,-6);c.quadraticCurveTo(0,5,7,-6);c.lineTo(5,7);c.lineTo(-4,7);c.closePath();finish('#23343f',null);
  line([[-w+4,5],[-w*.65,18],[-waist+2,length-2]],3,accent);line([[w-5,4],[w*.6,16]],2,'#b7d4d8');
 }else{
  c.beginPath();c.moveTo(-6,-6);c.lineTo(0,6);c.lineTo(7,-6);c.closePath();finish(look.skin,null);
  line([[-7,-4],[4,11],[-4,length-3]],4,'#c6cdbb');
  line([[8,-4],[-3,12],[-9,length-4]],3,accent);
  if(look.clothes==='jacket'){oval(7,14,1.4,1.4,'#d9c190');oval(6,21,1.4,1.4,'#d9c190')}
 }
 // Chest and cloth folds are broad shading, not shiny straight rods.
 line([[-w*.69,11],[-7,14]],1.1,'#152c3c70');line([[w*.68,12],[8,16]],1.1,'#152c3c70');line([[-waist+2,length-6],[-3,length-3]],1,'#d6e6db66');
 if(design?.pattern){
  const cx=2,cy=length*.48;c.strokeStyle=accent;c.fillStyle=accent;c.lineWidth=2;
  if(design.pattern==='stripes'){line([[cx-10,cy-2],[cx+9,cy+4]],2,accent);line([[cx-9,cy+5],[cx+8,cy+10]],2,accent)}
  else if(design.pattern==='diamond'){c.beginPath();c.moveTo(cx,cy-5);c.lineTo(cx+6,cy+2);c.lineTo(cx,cy+10);c.lineTo(cx-6,cy+2);c.closePath();c.fill()}
  else if(design.pattern==='chevron')line([[cx-10,cy],[cx,cy+9],[cx+10,cy]],3,accent);
  else if(design.pattern==='stars'){for(const [dx,dy] of [[-6,0],[5,6],[-3,12]]){c.fillRect(cx+dx-1,cy+dy-3,2,6);c.fillRect(cx+dx-3,cy+dy-1,6,2)}}
  else if(design.pattern==='circuit'){line([[cx-10,cy-3],[cx-3,cy-3],[cx-3,cy+10],[cx+9,cy+10]],2,accent);line([[cx+8,cy-4],[cx+8,cy+3],[cx+2,cy+3]],2,accent)}
  else if(design.pattern==='wave'){c.beginPath();c.moveTo(cx-10,cy);c.quadraticCurveTo(cx,cy-8,cx+9,cy+4);c.quadraticCurveTo(cx,cy+14,cx-7,cy+9);c.stroke()}
  else if(design.pattern==='flame')line([[cx-9,cy+10],[cx-5,cy-1],[cx,cy+5],[cx+4,cy-6],[cx+9,cy+9]],2,accent);
 }
 line([[-waist-1,length],[waist+1,length]],5.5,'#243039');
 oval(3,length,4,3,accent);line([[3,length+2],[1,length+12]],4,accent);line([[6,length+2],[11,length+9]],3,accent);
 c.restore();
 fist(rearHand,rearElbow,true);

 const headAngle=Math.atan2(head[1]-shoulder[1],head[0]-shoulder[0])+Math.PI/2;
 segment([head[0]-Math.sin(headAngle)*8,head[1]+Math.cos(headAngle)*8],[shoulder[0]+ny*2,shoulder[1]-nx*2],11*b,13*b,look.skin,look.shade,look.light);
 c.save();c.translate(...head);c.rotate(headAngle);c.scale(p.character.id==='atlas'?1.12:1,1);
 if(look.haircut==='ponytail'){
  c.beginPath();c.moveTo(-6,-10);c.quadraticCurveTo(-22,-19,-21,-3);c.quadraticCurveTo(-23,12,-15,23);c.quadraticCurveTo(-16,5,-12,-1);c.quadraticCurveTo(-8,-5,-6,-10);c.closePath();finish(look.hair);
 }
 if(look.haircut==='bun'){oval(-9,-11,7,7,look.hair);line([[-14,-10],[-10,-5]],2,accent)}
 if(look.haircut==='afro'){
  for(const [x,y,r] of [[-13,-4,8],[-14,-12,8],[-9,-19,8],[0,-21,8],[8,-17,7],[12,-10,6]])oval(x,y,r,r,look.hair);
 }
 if(look.haircut==='braid'){
  line([[-10,-7],[-17,6],[-15,25],[-23,33]],7,look.hair);
  for(const [x,y] of [[-16,5],[-17,12],[-15,19],[-18,26]])line([[x-3,y-2],[x+3,y+2]],2,'#7b6248');
  line([[-21,29],[-25,36]],3,accent);
 }
 if(look.haircut==='bob'){
  c.beginPath();c.moveTo(-10,11);c.quadraticCurveTo(-16,-4,-10,-13);c.quadraticCurveTo(3,-21,11,-9);c.lineTo(2,9);c.closePath();finish(look.hair);
 }
 const face=c.createLinearGradient(-10,0,12,0);face.addColorStop(0,look.shade);face.addColorStop(.55,look.skin);face.addColorStop(1,look.light);
 c.beginPath();c.moveTo(-8,-10);c.quadraticCurveTo(0,-15,8,-9);c.quadraticCurveTo(10,-5,8.5,-1);c.lineTo(12,2);c.quadraticCurveTo(12,4,8,4);c.lineTo(7,8);c.quadraticCurveTo(1,13,-5,8);c.quadraticCurveTo(-10,5,-10,-2);c.closePath();finish(face,'#3e3430');
 oval(-7,0,3,4,look.skin);line([[-8,-1],[-6,0],[-7,2]],.7,look.shade);
 if(look.haircut==='shaved'){
  line([[-9,-4],[-9,-8],[-5,-11]],1.5,'#9f7c6a');
  c.beginPath();c.moveTo(-6,5);c.lineTo(0,8);c.lineTo(7,6);c.lineTo(6,11);c.lineTo(0,15);c.lineTo(-5,10);c.closePath();finish(look.hair,null);
  line([[-2,10],[2,12]],1,'#a7a39a');line([[-1,-5],[1,-9]],1,'#9f7465');
 }else if(look.haircut==='afro'){
  c.beginPath();c.moveTo(-10,1);c.lineTo(-12,-9);c.quadraticCurveTo(0,-18,10,-8);c.lineTo(4,-8);c.lineTo(-4,-5);c.lineTo(-7,2);c.closePath();finish(look.hair,null);
  oval(-7,5,2,2,accent);line([[-10,-8],[4,-11]],2,accent);
 }else if(look.haircut==='braid'){
  c.beginPath();c.moveTo(-10,2);c.lineTo(-13,-6);c.quadraticCurveTo(-9,-18,2,-15);c.quadraticCurveTo(10,-14,11,-7);c.lineTo(3,-8);c.lineTo(-5,-4);c.lineTo(-7,2);c.closePath();finish(look.hair,null);
  line([[-8,-8],[2,-12]],1.2,'#84664b');line([[-11,-2],[-16,1]],3,accent);
 }else if(look.haircut==='crop'){
  c.beginPath();c.moveTo(-10,-3);c.lineTo(-10,-9);c.quadraticCurveTo(-2,-16,7,-10);c.lineTo(8,-6);c.quadraticCurveTo(0,-10,-7,-6);c.lineTo(-8,0);c.closePath();finish(look.hair,null);
  c.beginPath();c.moveTo(-6,4);c.lineTo(-1,7);c.lineTo(6,6);c.lineTo(7,8);c.quadraticCurveTo(1,13,-5,8);c.closePath();finish('#513b2e',null);
 }else if(look.haircut==='choppy'){
  c.beginPath();c.moveTo(-10,1);c.lineTo(-14,-7);c.lineTo(-10,-11);c.lineTo(-12,-16);c.lineTo(-5,-14);c.lineTo(-1,-19);c.lineTo(3,-15);c.lineTo(10,-17);c.lineTo(13,-9);c.lineTo(7,-7);c.lineTo(3,-10);c.lineTo(-5,-6);c.lineTo(-7,1);c.closePath();finish(look.hair);
  line([[-7,-10],[-3,-13]],1.3,'#b7a382');
 }else if(look.haircut==='mohawk'){
  c.beginPath();c.moveTo(-9,-6);c.lineTo(-5,-19);c.lineTo(0,-22);c.lineTo(5,-18);c.lineTo(9,-9);c.lineTo(4,-7);c.lineTo(1,-13);c.lineTo(-4,-7);c.closePath();finish(look.hair);
  line([[-8,3],[-4,8],[4,9]],2.7,look.hair);
 }else if(look.haircut==='bob'){
  c.beginPath();c.moveTo(-10,8);c.lineTo(-12,-6);c.quadraticCurveTo(-5,-19,7,-12);c.lineTo(11,-6);c.lineTo(3,-6);c.lineTo(0,-9);c.lineTo(-4,-5);c.lineTo(-4,9);c.closePath();finish(look.hair,null);
  line([[-11,5],[-5,6]],2,accent);
 }else if(look.haircut==='curls'){
  for(const [x,y,r] of [[-9,-5,5],[-9,-10,5],[-4,-14,5],[2,-14,5],[7,-10,4]])oval(x,y,r,r,look.hair);
  c.beginPath();c.moveTo(-7,3);c.lineTo(-2,6);c.lineTo(7,5);c.lineTo(6,10);c.lineTo(0,13);c.lineTo(-5,9);c.closePath();finish(look.hair,null);
 }else if(look.haircut==='swept'||look.haircut==='fringe'){
  c.beginPath();c.moveTo(-10,0);c.lineTo(-12,-8);c.lineTo(-7,-13);c.lineTo(-9,-16);c.lineTo(-2,-15);c.lineTo(2,-18);c.lineTo(5,-14);c.quadraticCurveTo(12,-15,12,-9);c.lineTo(7,-6);c.lineTo(4,-10);c.lineTo(-4,-6);c.lineTo(-7,1);c.closePath();finish(look.hair,null);
  line([[-7,-5],[6,-7]],3,accent);line([[-8,-5],[-16,-3],[-19,2]],2.5,accent);
 }else{
  c.beginPath();c.moveTo(-10,2);c.lineTo(-12,-7);c.quadraticCurveTo(-8,-16,4,-13);c.quadraticCurveTo(10,-12,10,-6);c.quadraticCurveTo(1,-9,-6,-3);c.lineTo(-7,2);c.closePath();finish(look.hair,null);
 }
 if(p.expression==='confident'){
  // Open almond-shaped eyes, relaxed brows and a restrained closed-mouth smile.
  line([[1.8,-3.7],[4.6,-4],[7,-3.7]],1.3,look.hair);
  c.beginPath();c.moveTo(1.7,-.5);c.quadraticCurveTo(4.6,-4,8.1,-.35);c.quadraticCurveTo(4.8,2.6,1.7,-.5);finish('#f1eadb',null);
  oval(5.6,-.5,1.25,1.5,'#71553d');oval(5.7,-.5,.65,1,'#292c2b');oval(5.25,-1.1,.3,.3,'#fff7e7');
  c.strokeStyle=look.shade;c.lineWidth=.45;c.beginPath();c.moveTo(1.7,-.5);c.quadraticCurveTo(4.6,-4,8.1,-.35);c.stroke();
  c.lineWidth=.8;c.beginPath();c.moveTo(2.7,5.4);c.quadraticCurveTo(5.1,6.7,7.4,5.3);c.stroke();
 }else{
  line([[2,-3],[7,-4]],1.6,look.hair);
  c.beginPath();c.moveTo(2,-1);c.quadraticCurveTo(5,-3,8,-1);c.quadraticCurveTo(5,1,2,-1);finish('#eee8d9',null);oval(6,-1,1.1,1.4,'#272b31');
  line([[5,6],[8,5.5]],.8,'#704b3b');
 }
 line([[7,2],[9,2.5]],.65,look.shade);
 c.restore();

 arm(anchor([shoulder[0],shoulder[1]+2],12*b),elbow,hand);
 fist(hand,elbow);
}
