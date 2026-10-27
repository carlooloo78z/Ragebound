export class Input {
 constructor(){
 this.held=new Set();this.pressed=new Set();this.history=[[],[]];this.keyboardHeld=new Set();this.pointers=new Map();this.solo=true;this.onInteract=null;this.captureBinding=null;
 this.bindings=[{left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',light:'KeyF',heavy:'KeyG',block:'KeyH',kick:'KeyR',throw:'KeyT',dash:'KeyE',specialKey:'KeyQ',roll:'KeyV'},{left:'KeyJ',right:'KeyL',up:'KeyI',down:'KeyK',light:'KeyN',heavy:'Comma',block:'Period',kick:'KeyU',throw:'Slash',dash:'KeyO',specialKey:'KeyP',roll:'KeyM'}];
 this.defaults=this.bindings.map(b=>({...b}));
 this.touchButtons=[...document.querySelectorAll('[data-key]')];
 window.addEventListener('keydown',e=>{
 const code=this.codeFor(e);
 if(this.captureBinding){e.preventDefault();const capture=this.captureBinding;this.captureBinding=null;capture(code);return}
 if(['SELECT','INPUT','TEXTAREA'].includes(e.target?.tagName))return;
 if(e.target?.tagName==='BUTTON'&&['Space','Enter'].includes(code))return;
 if(![...this.bindings.flatMap(x=>Object.values(x)),'ShiftLeft','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(code)&&code!=='Space')return;e.preventDefault();
 if(e.repeat){if([...this.bindings.flatMap(b=>['left','right','up','down'].map(a=>b[a])),'ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(code)){this.keyboardHeld.add(code);this.held.add(code)}return}
 this.keyboardHeld.add(code);this.press(code);
 });
 window.addEventListener('keyup',e=>{const code=this.codeFor(e);this.keyboardHeld.delete(code);this.release(code)});
 const release=e=>{
 const active=this.pointers.get(e.pointerId);if(!active)return;e.preventDefault?.();this.pointers.delete(e.pointerId);this.release(active.key);
 if(![...this.pointers.values()].some(p=>p.button===active.button))active.button.classList.remove('pressed');
 };
 for(const button of this.touchButtons){
 button.dataset.action=Object.entries(this.bindings[0]).find(([action,key])=>key===button.dataset.key)?.[0];
 button.addEventListener('pointerdown',e=>{e.preventDefault();this.onInteract?.();const key=this.bindings[0][button.dataset.action]||button.dataset.key;this.pointers.set(e.pointerId,{key,button});this.press(key);button.classList.add('pressed');try{button.setPointerCapture?.(e.pointerId)}catch{}});
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
 }
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 window.addEventListener('blur',()=>this.clear());
 }
 codeFor(event){if(event.code&&event.code!=='Unidentified')return event.code;const key=event.key||'';if(key.startsWith('Arrow'))return key;if(/^[a-z]$/i.test(key))return 'Key'+key.toUpperCase();return key===' '?'Space':key==='Shift'?'ShiftLeft':({',':'Comma','.':'Period','/':'Slash'}[key]||key)}
 press(key){if(!this.held.has(key))this.pressed.add(key);this.held.add(key)}
 release(key){if(!this.keyboardHeld.has(key)&&![...this.pointers.values()].some(p=>p.key===key))this.held.delete(key)}
 clear(){this.held.clear();this.pressed.clear();this.keyboardHeld.clear();this.pointers.clear();this.history=[[],[]];for(const button of this.touchButtons)button.classList.remove('pressed')}
 read(id,facing,tick){
 const b=this.bindings[id],out={},aliases=(id===0&&this.solo||id===1&&!this.solo)?{left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown'}:{};
 if(id===0)aliases.roll='ShiftLeft';
 for(const [action,key] of Object.entries(b))out[action]=this.held.has(key)||!!aliases[action]&&this.held.has(aliases[action]);
 for(const action of ['up','light','heavy','kick','throw','dash','specialKey','roll'])out[action+'Pressed']=this.pressed.has(b[action])||!!aliases[action]&&this.pressed.has(aliases[action]);
 for(const [action,key] of Object.entries(b))if(this.pressed.has(key)||!!aliases[action]&&this.pressed.has(aliases[action]))this.history[id].push({action,tick});
 this.history[id]=this.history[id].filter(e=>tick-e.tick<30);
 out.special=out.specialKeyPressed||out.lightPressed&&this.detectSpecial(id,facing,tick);return out;
 }
 detectSpecial(id,facing,tick){
 const h=this.history[id],forward=facing===1?'right':'left';let stage=0,last=-100;
 for(const e of h){if(tick-e.tick>18)continue;if(e.action==='down'){stage=1;last=e.tick}else if(e.action===forward&&stage===1&&e.tick-last<=12){stage=2;last=e.tick}else if(e.action==='light'&&stage===2)continue;else stage=0}
 if(stage!==2||tick-last>8)return false;this.history[id]=[];return true;
 }
 rebind(id,action,code){if(!this.bindings[id]||!(action in this.bindings[id])||!this.validCode(code))throw Error('Choose a letter, arrow, Shift, comma, period or slash key.');
 if(code==='ShiftLeft'&&(id!==0||action!=='roll'))throw Error('Left Shift is reserved as the Player 1 roll shortcut.');
 for(let p=0;p<2;p++)for(const [a,key] of Object.entries(this.bindings[p]))if(key===code&&(p!==id||a!==action))throw Error('That key is already assigned.');this.bindings[id][action]=code;this.clear();
 }
 validCode(code){return /^(?:Key[A-Z]|Arrow(?:Left|Right|Up|Down)|Shift(?:Right|Left)|Comma|Period|Slash)$/.test(code)}
 label(code){return ({Comma:',',Period:'.',Slash:'/'}[code]||code.replace('Key','').replace('Arrow',''))}
 restoreBindings(saved,version=2){
 const defaults=this.defaults.map(b=>({...b}));let next=defaults.map(b=>({...b}));
 if(Array.isArray(saved)&&saved.length===2){const used=new Set();let valid=true;for(let p=0;p<2;p++)for(const action of Object.keys(defaults[p])){const code=saved[p]?.[action];if(!this.validCode(code)||used.has(code))valid=false;used.add(code)}if(valid)next=saved.map(b=>({...b}))}
 if(version<2){
  const moves=['left','right','up','down'],used=new Set(moves.map(action=>defaults[1][action]));
  for(const action of moves)next[1][action]=defaults[1][action];
  const free=[...Array.from({length:26},(_,i)=>'Key'+String.fromCharCode(65+i)),'Comma','Period','Slash','ShiftRight'];
  for(let p=0;p<2;p++)for(const action of Object.keys(defaults[p])){if(p===1&&moves.includes(action))continue;let code=next[p][action];if(used.has(code))code=!used.has(defaults[p][action])?defaults[p][action]:free.find(k=>!used.has(k));next[p][action]=code;used.add(code)}
 }
 this.bindings=next;this.clear();return next;
 }
 endFrame(){this.pressed.clear()}
}
