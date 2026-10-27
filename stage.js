// Illustrated arenas share the same y=400 fighting plane; scenery changes no rules.
export const ARENAS=Object.freeze([
 {id:'dojo',name:'Lantern Dojo',location:'Old town / evening',description:'Warm lanterns, timber beams and a traditional practice floor.',accent:'#edc386',crowd:['#9b715f','#5d8382','#a18d67','#667584'],floor:'#6b766b',edge:'#d7c39a'},
 {id:'rooftop',name:'Neon Rooftop',location:'City skyline / midnight',description:'A rooftop ring above the city, with neon signs and a distant skyline.',accent:'#76d9de',crowd:['#7176a0','#51949e','#a07492','#747f9b'],floor:'#3f6673',edge:'#76c7cc'},
 {id:'temple',name:'Mountain Temple',location:'Highlands / sunrise',description:'Misty peaks, red temple gates and a stone courtyard beneath the pines.',accent:'#dfbf81',crowd:['#8a8e79','#8c6f58','#618c83','#a3836e'],floor:'#808b83',edge:'#cbd0ac'},
 {id:'harbour',name:'Sunset Harbour',location:'Waterfront / golden hour',description:'Fishing boats and dock cranes beyond a weathered waterfront ring.',accent:'#f1bd88',crowd:['#678d94','#a47c60','#a29874','#71798d'],floor:'#707f88',edge:'#e5c389'},
 {id:'club',name:'Underground Club',location:'Warehouse district / late night',description:'Brick arches, coloured spotlights and a close crowd around the club ring.',accent:'#d5a0df',crowd:['#956e99','#687f98','#a08466','#598a89'],floor:'#64617d',edge:'#bb9fc9'},
 {id:'festival',name:'Festival Street',location:'Night market / lantern festival',description:'Paper lanterns, striped market stalls and colourful old-town shopfronts.',accent:'#ffc6a5',crowd:['#9f687a','#728c80','#ad8b66','#707998'],floor:'#7d6875',edge:'#efbc9d',seat:'#4c4557',apron:'#615967'},
 {id:'desert',name:'Desert Ruins',location:'Dune kingdom / late afternoon',description:'Sun-warmed sandstone arches, distant dunes and a ruined courtyard.',accent:'#edce8e',crowd:['#8d7f64','#9f7161','#718c87','#937f94'],floor:'#a08d73',edge:'#e6ce9d',seat:'#615a4f',apron:'#8d7961'},
 {id:'glacier',name:'Glacier Station',location:'Polar ridge / aurora night',description:'An illuminated mountain station beneath ice peaks and the northern lights.',accent:'#a6dfde',crowd:['#718ba6','#8e7eac','#669592','#a08d83'],floor:'#637d8a',edge:'#b7ddd8',seat:'#374d61',apron:'#697d89'}
]);
export const getArena=id=>ARENAS.find(arena=>arena.id===id)||ARENAS[0];
export function drawArena(c,id='dojo'){
 const arena=getArena(id),ink='#202d37';
 const rect=(x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h)};
 const line=(points,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()};
 const shape=(points,fill,stroke=ink,width=3)=>{c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}};
 const oval=(x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
 const gradient=(top,bottom)=>{const g=c.createLinearGradient(0,-120,0,310);g.addColorStop(0,top);g.addColorStop(1,bottom);rect(0,-500,1200,1400,g)};
 const label=(words,x,y,size,color=arena.accent)=>{c.font='bold '+size+'px Arial';c.textAlign='center';c.fillStyle=color;c.fillText(words,x,y)};
 const lantern=(x,y)=>{line([[x,y-90],[x,y-21]],ink,3);oval(x,y,19,24,'#e4a76d');for(const dx of [-9,0,9])line([[x+dx,y-18],[x+dx,y+18]],'#916044',1);rect(x-13,y-25,26,6,'#513e36');rect(x-13,y+20,26,5,'#513e36');line([[x,y+25],[x,y+37]],'#bf7b52',3)};
 const pine=(x,y,scale=1)=>{c.save();c.translate(x,y);c.scale(scale,scale);rect(-7,-105,14,135,'#514c40');for(const [top,w] of [[-185,52],[-145,70],[-98,88]])shape([[0,top],[-w,top+77],[-w*.35,top+69],[0,top+82],[w,top+77]],'#374f4c','#2a4242',2);c.restore()};
 c.save();c.lineJoin='round';
 if(arena.id==='dojo'){
  gradient('#413c3c','#9b7257');rect(0,-100,1200,345,'#96775d');
  // Paper windows, timber wall and central scroll alcove.
  for(const x of [70,300,740,970]){
   rect(x,-15,160,220,'#3c3e39');rect(x+8,-7,144,204,'#d8c79b');
   for(let y=22;y<200;y+=36)line([[x+8,y],[x+152,y]],'#9f9272',3);
   for(let dx=44;dx<160;dx+=36)line([[x+dx,-7],[x+dx,197]],'#9f9272',3);
   rect(x,201,160,7,'#5b4b3c');
  }
  rect(485,-8,230,222,'#564d40');rect(504,13,192,184,'#b2a584');
  rect(555,27,90,136,'#ddd3b3');rect(550,24,100,6,'#453f35');rect(550,161,100,6,'#453f35');
  c.strokeStyle='#6d5b45';c.lineWidth=5;c.beginPath();c.arc(600,88,28,.4,Math.PI*2-.2);c.stroke();
  label('DOJO',600,140,19,'#574b39');rect(519,190,162,12,'#4b3c32');
  for(const x of [32,260,475,709,923,1148]){rect(x,-160,20,399,'#4c3d34');rect(x+3,-160,4,399,'#8a6650')}
  rect(0,-22,1200,20,'#4a3b33');rect(0,-3,1200,5,'#ba8960');rect(0,213,1200,26,'#6a4c39');
  for(const x of [265,455,745,935])lantern(x,106);
  for(const x of [61,1117]){rect(x,127,23,84,'#4c6d63');label('武',x+12,163,16,'#d9c9a1');line([[x,211],[x+12,221],[x+23,211]],'#4c6d63',3)}
 }else if(arena.id==='rooftop'){
  gradient('#202e4b','#586f88');oval(953,13,36,36,'#c2d4cd');oval(966,5,34,34,'#34465f');
  for(let i=0;i<29;i++)oval((i*163+91)%1200,-60+(i*47)%170,1,1,'#a2bacb');
  for(let i=0;i<19;i++){
   const x=i*69-15,y=40+(i*47)%130;rect(x,y,60,240-y,i%3?'#32445d':'#3b526a');
   for(let row=y+14;row<225;row+=23)for(let col=x+9;col<x+53;col+=15)if((row+col+i)%4!==0)rect(col,row,5,8,i%2?'#809f9e':'#b3a584');
  }
  for(const [x,w,y] of [[0,178,100],[1020,180,73]]){
   rect(x,y,w,175,'#263b50');rect(x-3,y-8,w+6,9,'#5a7183');
   for(let yy=y+22;yy<260;yy+=32)for(let xx=x+17;xx<x+w-10;xx+=32)rect(xx,yy,12,15,'#687e90');
  }
  rect(376,88,118,99,'#263c50');line([[381,93],[489,93],[489,182],[381,182],[381,93]],'#9a7daa',2);
  label('NIGHT',435,128,23,'#e0a5bf');label('CIRCUIT',435,158,18,'#8bdae0');
  rect(769,92,55,107,'#27384d');label('24',796,133,28,'#8fd4cf');label('HRS',796,158,13,'#8fd4cf');
  rect(0,226,1200,13,'#263644');line([[0,223],[1200,223]],'#769198',3);
  for(let x=25;x<1200;x+=56)line([[x,222],[x,263]],'#4c6172',3);
  line([[15,21],[278,83],[612,97],[950,64],[1185,7]],'#213447',3);
  for(const [x,y] of [[155,54],[337,86],[505,94],[704,88],[864,73],[1050,40]])oval(x,y+5,4,6,'#ecd4a7');
 }else if(arena.id==='temple'){
  gradient('#abc2ba','#e8c9a0');oval(813,11,47,47,'#efd8ae');
  shape([[0,204],[0,93],[119,-40],[253,96],[382,-49],[535,116],[728,-70],[918,121],[1069,-19],[1200,86],[1200,240]],'#829b95',null);
  shape([[0,230],[0,167],[167,75],[302,185],[477,51],[683,209],[886,80],[1020,177],[1200,108],[1200,240]],'#688780',null);
  rect(0,197,1200,44,'#99aaa0');
  rect(478,119,246,109,'#655c49');rect(500,130,202,88,'#c0ad88');
  for(const x of [512,568,624,680])rect(x,131,9,87,'#78624c');
  shape([[435,124],[481,104],[600,48],[719,104],[766,124],[694,119],[600,91],[506,119]],'#3e5954','#304841');
  shape([[467,77],[510,63],[600,12],[690,63],[734,77],[676,73],[600,48],[524,73]],'#3d5752','#304841');
  for(const x of [334,846]){rect(x,93,21,143,'#9c5543');rect(x+4,93,4,143,'#bc7757');rect(x-8,224,38,16,'#676a5c')}
  shape([[297,92],[366,97],[834,97],[903,92],[894,108],[600,118],[306,108]],'#9a4f3c');
  rect(326,132,549,12,'#96513e');rect(589,111,22,47,'#d1b77f');
  pine(133,220,.95);pine(1068,231,1.12);pine(25,225,.76);pine(1180,232,.8);
  for(const x of [258,942]){rect(x-9,188,18,45,'#777c6b');shape([[x-22,189],[x-12,175],[x+12,175],[x+22,189]],'#687565');rect(x-10,157,20,21,'#ded1a8');shape([[x-24,157],[x,143],[x+24,157]],'#637165')}
 }else if(arena.id==='harbour'){
  gradient('#697f96','#e5aa83');oval(804,58,48,48,'#f0cf98');
  shape([[0,188],[122,151],[227,166],[360,135],[493,167],[670,135],[839,172],[1010,148],[1200,169],[1200,230],[0,230]],'#7e8c91',null);
  rect(0,184,1200,71,'#6c8e99');
  for(let i=0;i<28;i++){const x=(i*137)%1200,y=190+(i*17)%56;line([[x,y],[x+34+(i%4)*12,y]],i%3?'#91a8a7':'#cdba9e',2)}
  shape([[90,213],[287,213],[264,235],[116,235]],'#465d70');rect(139,186,85,28,'#c0b59e');rect(153,194,18,10,'#4f6b7c');rect(182,194,18,10,'#4f6b7c');
  line([[210,186],[210,117],[120,177],[266,177]],'#4a5962',3);line([[210,126],[257,204]],'#596a70',1);
  shape([[732,211],[1011,211],[976,240],[753,240]],'#425c6a');
  for(let i=0;i<5;i++)rect(754+i*39,190,36,21,['#a6806b','#637b7e','#ad946f'][i%3]);rect(915,164,58,26,'#c4bda3');rect(928,171,33,9,'#647f87');
  for(const [x,s] of [[373,1],[1075,-1]]){
   line([[x,235],[x,59],[x+s*131,59]],'#58666d',9);line([[x,75],[x+s*107,59]],'#8b8c80',3);
   line([[x+s*111,59],[x+s*111,150]],'#4b606a',2);line([[x+s*106,151],[x+s*111,158],[x+s*116,151]],'#4b606a',3);
   line([[x-19,235],[x,180],[x+19,235]],'#566770',4);
  }
  rect(0,242,1200,10,'#536774');
  for(const x of [36,1160]){rect(x,132,6,114,'#3a505e');line([[x+3,132],[x+36,132]],'#3a505e',4);oval(x+33,137,9,5,'#e7c391')}
 }else if(arena.id==='festival'){
  gradient('#363752','#8a6476');
  // Narrow shopfronts and cloth stalls make this an outdoor street celebration.
  for(const [x,w,colour] of [[0,205,'#715d6d'],[217,231,'#81755e'],[460,270,'#86665d'],[742,230,'#5f747b'],[984,216,'#785d71']]){
   rect(x,-45,w,286,colour);rect(x+7,41,w-14,8,'#413d48');rect(x+7,113,w-14,8,'#413d48');
   for(let xx=x+22;xx<x+w-35;xx+=60){rect(xx,60,36,43,'#d2af86');line([[xx+18,60],[xx+18,103]],'#73645d',3);line([[xx,82],[xx+36,82]],'#73645d',2)}
   rect(x+15,144,w-30,91,'#3b3c4c');rect(x+21,150,w-42,80,'#777b78');
   shape([[x-8,27],[x+w/2,9],[x+w+8,27],[x+w+12,38],[x-12,38]],'#344653');
  }
  rect(500,137,190,77,'#a57961');label('NIGHT MARKET',595,165,19,'#f8d5a5');label('FOOD / MUSIC / FIGHTS',595,189,10,'#efc49c');
  for(const [x,colour] of [[45,'#b77883'],[815,'#688f83']]){
   rect(x,207,310,30,'#74594e');rect(x+12,175,8,62,'#493f41');rect(x+288,175,8,62,'#493f41');
   shape([[x+11,155],[x+299,155],[x+318,182],[x-8,182]],colour);
   for(let n=0;n<6;n++)shape([[x+15+n*48,156],[x+37+n*48,156],[x+43+n*48,181],[x+17+n*48,181]],'#e0c3a0',null);
   for(let n=0;n<7;n++){oval(x+36+n*37,208,13,6,'#c7a075');oval(x+36+n*37,203,9,5,n%2?'#c89460':'#a2b381')}
  }
  for(const y of [34,104]){
   line([[0,y],[300,y+32],[600,y+45],[900,y+32],[1200,y]],'#342f3d',3);
   for(let i=0;i<9;i++){
    const x=62+i*135,drop=45*(1-Math.abs(x-600)/600),cy=y+drop+20;
    line([[x,y+drop],[x,cy-10]],'#423842',2);oval(x,cy,12,16,['#df9c72','#ca7c8e','#d8b884'][i%3]);
    line([[x-9,cy-11],[x+9,cy-11]],'#715047',2);line([[x-8,cy+12],[x+8,cy+12]],'#715047',2);
   }
  }
 }else if(arena.id==='desert'){
  gradient('#bcb9a7','#e6bf8d');oval(870,22,48,48,'#f4dcaa');
  shape([[0,192],[150,137],[352,190],[552,98],[804,174],[1010,113],[1200,168],[1200,260],[0,260]],'#c0a17f',null);
  shape([[0,221],[187,177],[396,206],[671,157],[875,214],[1105,172],[1200,201],[1200,265],[0,265]],'#ad9476',null);
  // Separate stone piers and arch rings leave the sky visible through the ruins.
  for(const x of [120,432,744,1056]){
   rect(x-24,91,48,151,'#a38d70');rect(x-29,225,58,18,'#887c67');rect(x-30,87,60,16,'#cfb490');
   rect(x-20,105,8,115,'#c5ab87');
   for(const y of [132,164,196])line([[x-18,y],[x+20,y]],'#897b65',2);
  }
  for(const x of [276,588,900]){
   c.fillStyle='#b19a79';c.beginPath();c.moveTo(x-180,99);c.quadraticCurveTo(x,-99,x+180,99);c.lineTo(x+132,106);c.quadraticCurveTo(x,-30,x-132,106);c.closePath();c.fill();
   c.strokeStyle='#7e7663';c.lineWidth=3;c.stroke();
   for(const dx of [-92,0,92])line([[x+dx,22+Math.abs(dx)*.33],[x+dx*.8,47+Math.abs(dx)*.29]],'#8b7e65',2);
  }
  for(const [x,flip] of [[30,1],[1168,-1]]){
   line([[x,241],[x+flip*11,170],[x+flip*4,96]],'#766b4e',12);
   for(const [dx,dy] of [[-79,-4],[-61,-31],[-13,-53],[39,-47],[76,-18],[66,18]]){
    shape([[x+flip*4,96],[x+dx*.6,74+dy*.7],[x+dx,96+dy],[x+dx*.55,90+dy*.4]],'#7b8661',null);
   }
  }
  for(const [x,y,w] of [[220,215,79],[626,204,65],[970,218,91]]){rect(x,y,w,26,'#b9a17d');rect(x+4,y+3,w-8,5,'#d2bb95');line([[x+31,y+1],[x+25,y+25]],'#8f8065',2)}
 }else if(arena.id==='glacier'){
  gradient('#223950','#658b9d');
  // Broad translucent aurora ribbons sit behind the mountains and station.
  for(const [offset,colour] of [[0,'#81cbb840'],[43,'#ae9dd834']]){
   c.fillStyle=colour;c.beginPath();c.moveTo(0,-20+offset);c.quadraticCurveTo(360,-110+offset,650,22+offset);c.quadraticCurveTo(950,80+offset,1200,-45+offset);c.lineTo(1200,-7+offset);c.quadraticCurveTo(920,132+offset,650,57+offset);c.quadraticCurveTo(340,-56+offset,0,25+offset);c.closePath();c.fill();
  }
  for(let i=0;i<32;i++)oval((i*167+21)%1200,-50+(i*31)%140,1,1,'#bdcfdb');
  shape([[0,227],[0,157],[160,16],[285,172],[442,60],[600,207],[796,21],[942,159],[1084,46],[1200,163],[1200,254]],'#7d9ca9',null);
  for(const [x,y] of [[160,16],[442,60],[796,21],[1084,46]])shape([[x-48,y+54],[x,y],[x+49,y+62],[x+13,y+47],[x-6,y+29],[x-24,y+51]],'#cfdbd7',null);
  shape([[0,240],[203,205],[395,232],[670,189],[890,221],[1200,196],[1200,266],[0,266]],'#aabfc3',null);
  rect(391,128,418,108,'#4b687b');shape([[373,129],[408,107],[792,107],[827,129]],'#c8d8d9');
  rect(407,145,386,63,'#283f55');
  for(let x=422;x<780;x+=51){rect(x,152,38,45,'#8aafb6');line([[x+19,152],[x+19,197]],'#4f6e80',2)}
  rect(526,99,148,39,'#29465b');label('STATION 08',600,125,19,'#bee3dc');
  for(const x of [90,1085]){rect(x,104,17,140,'#526d80');shape([[x-38,107],[x+58,107],[x+43,93],[x-24,93]],'#c9dadc');line([[x-42,115],[x+63,115]],'#344d62',5)}
  line([[0,80],[1200,80]],'#314c61',3);line([[0,87],[1200,87]],'#718d9d',1);
  for(const x of [265,905]){line([[x,80],[x,123]],'#324c61',3);rect(x-30,123,60,38,'#8a617a');rect(x-24,128,48,21,'#bed9d7');line([[x-33,161],[x+33,161]],'#c2d4d9',4)}
  for(const x of [356,844]){rect(x-3,146,6,92,'#405b6e');oval(x,145,11,5,'#daecce')}
 }else{
  gradient('#34354c','#615469');rect(0,-40,1200,281,'#514c5b');
  for(let y=-20;y<242;y+=26){line([[0,y],[1200,y]],'#423f4d',2);for(let x=(y%52===6?0:39);x<1200;x+=78)line([[x,y],[x,y+26]],'#423f4d',2)}
  for(const x of [128,355,845,1072]){
   c.fillStyle='#2a3547';c.beginPath();c.moveTo(x-69,230);c.lineTo(x-69,95);c.quadraticCurveTo(x,12,x+69,95);c.lineTo(x+69,230);c.closePath();c.fill();
   line([[x,70],[x,224]],'#52566a',5);line([[x-65,132],[x+65,132]],'#52566a',4);
  }
  rect(471,76,258,111,'#2a3347');line([[481,86],[719,86],[719,177],[481,177],[481,86]],'#9c709e',3);
  label('THE PIT',600,132,35,'#dbaccf');label('FIGHT NIGHT',600,160,14,'#b6c3ce');
  for(const x of [52,1114]){rect(x,153,34,83,'#293341');oval(x+17,176,11,11,'#586170');oval(x+17,213,14,14,'#4a5365')}
  line([[0,27],[1200,27]],'#253343',9);
  for(const [x,color] of [[269,'#82c5c5'],[930,'#c895ca']]){
   shape([[x-7,40],[x+9,40],[x+97,234],[x-72,234]],color+'18',null);
   rect(x-13,25,26,16,'#202d3c');oval(x,42,10,4,color);
  }
  line([[0,226],[1200,226]],'#778092',3);
 }
 // Tiered seats retain the live betting crowd, drawn by Renderer.
 const seat=arena.seat||(arena.id==='dojo'?'#4b4b42':arena.id==='temple'?'#475e55':arena.id==='harbour'?'#3e5864':arena.id==='club'?'#353c51':'#2e4155');
 rect(0,243,1200,91,seat);rect(0,271,1200,9,'#202e3a55');rect(0,313,1200,21,'#202e3a66');
 rect(0,334,1200,570,arena.apron||(arena.id==='dojo'?'#725c49':arena.id==='temple'?'#68796e':arena.id==='harbour'?'#596c77':'#354553'));
 for(const y of [350,470,535,620,730])line([[0,y],[1200,y]],'#202d3744',2);
 if(arena.id==='dojo')for(let x=0;x<1200;x+=95)line([[x,336],[600+(x-600)*1.8,780]],'#342e2c55',2);
 if(arena.id==='temple')for(let x=30;x<1200;x+=166)line([[x,336],[600+(x-600)*1.7,780]],'#aab49a44',2);
 if(arena.id==='harbour')for(const x of [0,1140])for(let y=344;y<505;y+=27)shape([[x,y],[x+60,y-9],[x+60,y+1],[x,y+10]],'#c6a56e',null);
 shape([[54,345],[1146,345],[1220,473],[-20,473]],'#273a43');
 shape([[76,351],[1124,351],[1180,459],[20,459]],arena.floor,arena.edge,3);
 line([[92,360],[1108,360]],'#e0ddbc44',2);
 c.globalAlpha=.48;c.strokeStyle=arena.edge;c.lineWidth=2;c.beginPath();c.ellipse(600,405,91,26,0,0,Math.PI*2);c.stroke();
 if(arena.id==='dojo'){line([[600,354],[600,457]],arena.edge,1);line([[324,354],[304,456]],arena.edge,1);line([[876,354],[896,456]],arena.edge,1);label('道',600,416,27,arena.edge)}
 else if(arena.id==='rooftop')shape([[600,388],[635,404],[600,422],[565,404]],'transparent',arena.edge,2);
 else if(arena.id==='temple'){c.beginPath();c.arc(600,402,13,0,Math.PI*2);c.stroke()}
 else if(arena.id==='harbour'){line([[600,388],[600,419],[580,408]],arena.edge,3);line([[600,419],[620,408]],arena.edge,3);line([[589,398],[611,398]],arena.edge,2)}
 else if(arena.id==='festival'){for(const [dx,dy] of [[0,-9],[-16,0],[16,0],[0,9]])oval(600+dx,405+dy,10,6,arena.edge);oval(600,405,4,4,arena.floor)}
 else if(arena.id==='desert'){shape([[600,389],[627,405],[600,421],[573,405]],'transparent',arena.edge,2);oval(600,405,5,5,arena.edge)}
 else if(arena.id==='glacier'){line([[578,395],[622,415]],arena.edge,2);line([[578,415],[622,395]],arena.edge,2);line([[600,389],[600,421]],arena.edge,2)}
 else label('THE PIT',600,411,17,arena.edge);
 c.globalAlpha=1;line([[290,382],[290,420]],arena.edge,4);line([[910,382],[910,420]],arena.edge,4);
 line([[20,459],[1180,459]],'#263843',4);c.restore();
}
// Actual stage drawings are also the menu thumbnails, so previews cannot drift.
export function drawArenaPreview(canvas,id){
 const c=canvas.getContext('2d');c.save();c.clearRect(0,0,canvas.width,canvas.height);
 c.scale(canvas.width/1200,canvas.height/600);c.translate(0,110);drawArena(c,id);c.restore();
}

