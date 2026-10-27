// Small synthesized arcade cues: no downloads or autoplay before interaction.
export class GameAudio {
 constructor(preferences){this.preferences=preferences;this.context=null;this.lastCrowd=-100;this.enabled=false}
 unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(Audio){this.context??=new Audio();this.context.resume()?.catch?.(()=>{});this.enabled=true}}catch{}}
 tone(frequency,duration,volume,type='sine',end=frequency){
  const c=this.context;if(!c||!this.enabled)return;
  const gain=c.createGain(),osc=c.createOscillator(),now=c.currentTime;
  gain.gain.setValueAtTime(Math.max(.0001,volume*this.preferences.value.master),now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.type=type;osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);osc.connect(gain);gain.connect(c.destination);osc.start(now);osc.stop(now+duration);
 }
 cue(kind){const v=this.preferences.value.effects*.18;
  const cues={hit:[150,.11,'triangle',45],counter:[220,.15,'sawtooth',45],punish:[300,.19,'triangle',50],block:[420,.07,'square',240],parry:[740,.19,'sine',1100],throw:[100,.23,'triangle',30],tech:[600,.12,'sine',300],roll:[180,.07,'sine',450],buy:[660,.16,'sine',1000]};
  const cue=cues[kind]||cues.hit;this.tone(cue[0],cue[1],v,cue[2],cue[3]);
  if(['hit','counter','punish','throw'].includes(kind)&&this.context&&this.context.currentTime-this.lastCrowd>1.5){this.lastCrowd=this.context.currentTime;for(let i=0;i<5;i++)this.tone(180+i*80,.35,this.preferences.value.crowd*.012,'triangle',250+i*40)}
 }
 announce(text){
  this.tone(440,.25,this.preferences.value.effects*.12,'sine',660);
  if(!this.enabled||!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance||this.preferences.value.voice<=0)return;
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.volume=this.preferences.value.voice*this.preferences.value.master;utterance.rate=1.05;speechSynthesis.speak(utterance);
 }
}
