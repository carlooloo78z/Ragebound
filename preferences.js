export class Preferences {
 constructor(){
  this.defaults={master:.55,effects:.75,crowd:.25,voice:.5,reducedMotion:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false,controls:'auto',bindings:null,controlsVersion:2,pinned:null,lastSetup:null};
  this.value={...this.defaults};
  try{const saved=JSON.parse(globalThis.localStorage?.getItem('dojo-preferences-v13')||'null');if(saved&&typeof saved==='object'){for(const key of ['master','effects','crowd','voice'])if(Number.isFinite(saved[key]))this.value[key]=Math.max(0,Math.min(1,saved[key]));if(typeof saved.reducedMotion==='boolean')this.value.reducedMotion=saved.reducedMotion;if(['auto','show','hide'].includes(saved.controls))this.value.controls=saved.controls;if(saved.bindings&&Array.isArray(saved.bindings)){this.value.bindings=saved.bindings;this.value.controlsVersion=saved.controlsVersion===2?2:1;}if(typeof saved.pinned==='string')this.value.pinned=saved.pinned;if(saved.lastSetup&&typeof saved.lastSetup==='object')this.value.lastSetup=saved.lastSetup}}
  catch{}
 }
 set(key,value){this.value[key]=value;try{globalThis.localStorage?.setItem('dojo-preferences-v13',JSON.stringify(this.value))}catch{}}
}
