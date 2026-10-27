import {createMenuUI} from './menu-ui.js';
import {createCareerUI} from './career-ui.js';
import {createMarketUI} from './market-ui.js';
import {Preferences} from './preferences.js';
import {GameAudio} from './audio.js';
import {Interface} from './ui.js';
import {STYLES,CHARACTERS,SPECIALS} from './styles.js';
import {Input} from './input.js';
import {Fighter,resolveCombat,resolveExchange,separateFighters} from './combat.js';
import {Renderer} from './renderer.js';
import {TitleScreen} from './title-screen.js';
import {ARENAS,getArena,drawArenaPreview} from './stage.js';
import {TacticalAI,DIFFICULTIES} from './ai.js';
import {Career,UPGRADE_TYPES,MAX_UPGRADE,upgradeCost,makeMarket,winReward,cleanProgress,COSMETICS,cosmeticAccess,cosmeticStats} from './career.js';
const $=id=>document.getElementById(id),ui=new Interface($),preferences=new Preferences(),sound=new GameAudio(preferences),input=new Input(),players=[new Fighter(0),new Fighter(1)],renderer=new Renderer($('game')),ai=new TacticalAI();
players[1].character=CHARACTERS[1];
const titleScreen=new TitleScreen($('title-canvas'));
let presentationFrame=0;
let training=false,trainingFrozen=false,trainingStep=false,equalStats=false,resultReveal=0,trainingKO=0;
let cpu=true,selected=0,tick=0,remaining=99,paused=false,ended=false,accumulator=0,last=0;
// Static hosts keep the existing browser profiles and never call a local API.
const career=new Career(undefined,document.documentElement?.dataset?.hosting==='static'?null:globalThis.fetch);
let careerMatch=null,market=makeMarket(),matchEpoch=0,rewardClaimed=false;
let startingMatch=null,navigationEpoch=0,frameFault=null;const activity={busy:false,settlements:0};
let targetWins=2,screen='title',arenaId='dojo';
let phase='countdown',phaseUntil=150,round=1,wins=[0,0],roundStart=150,freeze=0,difficulty='normal',lastEvent='Create space. Make them miss. Punish the recovery.';
function styleUI(){
 levelUI();
 $('styles').replaceChildren(...STYLES.map((style,i)=>{const button=document.createElement('button');button.className=players[selected].style===style?'active':'';button.innerHTML='<em>0'+(i+1)+'</em><b>'+style.name+'</b><small>'+style.description+'</small>';button.setAttribute?.('aria-pressed',String(players[selected].style===style));button.onclick=()=>{players[selected].style=style;restart();styleUI()};return button}));
 $('characters').replaceChildren(...CHARACTERS.map(character=>{
 const button=document.createElement('button');button.className='character-card '+(players[selected].character===character?'active':'');
 button.setAttribute?.('aria-pressed',String(players[selected].character===character));
 button.innerHTML='<span class="portrait" style="--fighter:'+character.color+';--bulk:'+character.bulk+'"><i></i></span><b>'+character.name+'</b><em>'+character.role+'</em><small>'+character.description+'</small><span class="character-stats">HP '+character.health+' / SPEED '+Math.round(character.speed*100)+'%<br>POWER '+Math.round(character.damage*100)+'% / GUARD '+character.guard+'</span><small>SPECIAL: '+SPECIALS[character.id].name+' / '+SPECIALS[character.id].description+'</small>';
 const portrait=document.createElement('canvas');portrait.width=300;portrait.height=360;portrait.className='selection-portrait';portrait.setAttribute?.('aria-label',character.name);button.querySelector?.('.portrait')?.replaceWith(portrait);renderer.portrait(portrait,{...players[selected],character});
 button.onclick=()=>{players[selected].character=character;restart();styleUI()};return button;
 }));
 players.forEach((p,i)=>$('style'+i).textContent=p.character.name+' / '+p.style.name);
 $('selection-label').textContent=(selected===0?'CUSTOMISE PLAYER 01':'CUSTOMISE OPPONENT / PLAYER 02')+' / '+CHARACTERS.length+' FIGHTERS';
 updateVersus();
}
document.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.player);document.querySelectorAll('[data-player]').forEach(n=>n.classList.toggle('active',n===b));styleUI()});
function levelUI(){
 const descriptions={beginner:'LEVEL 1: relaxed reactions and frequent openings. Learn the basics.',easy:'LEVEL 2: slower reactions and lighter defense. Practice your timing.',normal:'LEVEL 3: balanced pressure, spacing and defense.',hard:'LEVEL 4: faster reads and disciplined defense. Punish carefully.',expert:'LEVEL 5: the fastest reactions and strongest defense. No extra health or damage.'};
 $('cpu-levels').replaceChildren(...Object.entries(DIFFICULTIES).map(([key,level],i)=>{
 const button=document.createElement('button');button.className=key===difficulty?'active':'';
 button.setAttribute?.('aria-pressed',String(key===difficulty));
 button.innerHTML='<b>'+String(i+1).padStart(2,'0')+'</b><span>'+level.name.split(' / ')[1].toUpperCase()+'</span>';
 button.onclick=()=>{training=false;cpu=true;$('mode').value='cpu';difficulty=key;$('difficulty').value=key;levelUI();restart()};return button;
 }));
 $('level-description').textContent=descriptions[difficulty];updateVersus();
}
function showSlide(name){
 if(name==='title')titleScreen.enter();
 navigationEpoch++;if(startingMatch){startingMatch=null;$('play-button').disabled=false;$('play-button').textContent='FIGHT!'}
 if(name==='career'||name==='market')careerUI();
 screen=name;menuView.show(name);$('market-panel').hidden=name!=='market';$('powerup-panel').hidden=name==='market';$('career-columns').classList.toggle('market-view',name==='market');$('powerups-tab').classList.toggle('active',name!=='market');$('market-tab').classList.toggle('active',name==='market');updateVersus();
}
function arenaUI(){
 $('arena-summary').textContent=ARENAS.length+' arenas. Select a backdrop to preview your next match.';
 $('arena-cards').replaceChildren(...ARENAS.map(arena=>{
  const button=document.createElement('button'),preview=document.createElement('canvas'),name=document.createElement('strong'),location=document.createElement('small');
  button.type='button';button.className='arena-card';button.dataset.arena=arena.id;
  preview.width=480;preview.height=240;preview.setAttribute?.('aria-hidden','true');drawArenaPreview(preview,arena.id);
  name.textContent=arena.name;location.textContent=arena.location;button.replaceChildren(preview,name,location);
  button.onclick=()=>{arenaId=arena.id;renderer.arena=arenaId;restart();saveSetup();updateArenaSelection();updateVersus()};return button;
 }));updateArenaSelection();
}
function updateArenaSelection(){
 for(const button of $('arena-cards').children){const active=button.dataset.arena===arenaId;button.classList.toggle('active',active);button.setAttribute?.('aria-pressed',String(active))}
 $('arena-description').textContent=getArena(arenaId).description;
}
function updateVersus(){
 players.forEach((p,i)=>{
 $('versus-name'+i).textContent=p.character.name.toUpperCase();
 $('versus-style'+i).textContent=p.style.name+' / '+p.character.role;
 $('versus-stats'+i).textContent=p.maxHealth+' HEALTH ('+p.character.health+' BASE + '+(p.maxHealth-p.character.health)+') / '+Math.round(p.speed/p.style.speed*100)+'% SPEED / '+p.maxGuard+' GUARD / POWER '+Math.round(p.power*100)+'%';
 renderer.portrait($('versus-portrait'+i),p);
 });
 $('market-preview').textContent=training?'TRAINING: dummy controls, frame stepping and no coin rewards.':'CROWD BETS / '+market.fans[0]+' fans back '+players[0].character.name+' with '+market.pools[0]+' coins / '+market.fans[1]+' fans back '+players[1].character.name+' with '+market.pools[1]+' coins. NPC bets lock when the fight starts.';
 $('versus-rules').textContent=(training?'TRAINING ROOM':cpu?DIFFICULTIES[difficulty].name.toUpperCase():'LOCAL TWO PLAYERS')+' / BEST OF '+(targetWins*2-1)+' / '+getArena(arenaId).name.toUpperCase();
 drawArenaPreview($('versus-arena'),arenaId);
}
function openMenu(name='setup'){ $('guide').hidden=true;$('guide-toggle').setAttribute?.('aria-expanded','false');$('result-panel').hidden=true;$('menu').hidden=false;paused=true;$('pause').textContent='Resume';clearInput();showSlide(typeof name==='string'?name:'setup') }
function closeMenu(){
 if(startingMatch)return;
 sound.unlock();saveSetup();career.cancelRestore();
 if(ended)restart();
 const begin=()=>{if(phase==='countdown'&&tick===0)sound.announce(training?'Training':'Round '+round);$('guide').hidden=true;$('menu').hidden=true;paused=false;$('pause').textContent='Pause';if(phase==='fight')$('announcement').textContent='';clearInput();focusArena()};
 if(careerMatch){begin();return}
 const start={epoch:matchEpoch,navigation:navigationEpoch};startingMatch=start;
 const current=()=>startingMatch===start&&matchEpoch===start.epoch&&navigationEpoch===start.navigation;
 try{
 const pending=career.begin({cpu:cpu&&!training,difficulty,targetWins,fighters:players.map(p=>p.character.name)},market);
 if(pending&&typeof pending.then==='function'){
 $('play-button').disabled=true;$('play-button').textContent='CONNECTING...';
 pending.then(match=>{if(!current())return;careerMatch=match;market=match.market;begin()})
 .catch(error=>{if(!current())return;$('account-message').textContent=error.message;openMenu('career')})
 .finally(()=>{if(startingMatch===start){startingMatch=null;$('play-button').disabled=false;$('play-button').textContent='FIGHT!'}});
 }else{careerMatch=pending;market=pending.market;startingMatch=null;begin()}
 }catch(error){if(current()){startingMatch=null;$('account-message').textContent=error.message;openMenu('career')}}
}
function applyCareer(){players[0].upgrades=equalStats||training?{health:0,power:0,speed:0,guard:0}:{...career.progress.upgrades};players[1].upgrades={health:0,power:0,speed:0,guard:0};players[0].outfitColor=COSMETICS[career.progress.equipped]?.color||null;players[0].outfitDesign=COSMETICS[career.progress.equipped];players[1].outfitColor=null;players[1].outfitDesign=null}
let careerView,marketView,menuView;
function careerUI(){careerView?.render()}
function openMarket(){careerView.openMarket()}
function showRewardBreakdown(receipt){
 const names=receipt.fighters||['PLAYER 1',receipt.cpu?'COMPUTER':'PLAYER 2'],pool=receipt.market;
 const rows=[
 'Crowd support: '+names[0]+' '+pool.support+'% ('+pool.pools[0]+' coins) / '+names[1]+' '+(100-pool.support)+'% ('+pool.pools[1]+' coins).',
 receipt.won&&receipt.reward>0?'Purse: '+receipt.base+' base + '+receipt.levelBonus+' CPU-level bonus + '+receipt.lengthBonus+' match-length bonus = '+receipt.purse+' coins.':receipt.reward>0?'Completion reward: '+receipt.participation+' for finishing + '+receipt.roundBonus+' for rounds won + '+receipt.lengthBonus+' match-length bonus = '+receipt.purse+' coins.':'Previously saved match: no coins were awarded.',
 receipt.won&&receipt.reward>0?'Crowd bonus: floor('+pool.pools[0]+' x '+Math.round((receipt.crowdRate??.12)*100)+'%), capped at '+(receipt.crowdCap??150)+' = '+receipt.crowd+' coins.':'Crowd pools remain fictional spectator bets.',
 'Total reward: '+receipt.reward+' coins.'
 ];
 $('result-breakdown').replaceChildren(...rows.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
}
function settleCareer(winner){
 if(!ended||phase!=='matchend'||rewardClaimed)return;
 if(!careerMatch){$('result-reward').textContent='No active career match. Start a new match to earn coins.';return}
 try{career.complete(careerMatch,wins)}catch(error){$('result-reward').textContent=error.message;return}
 rewardClaimed=true;activity.settlements++;$('retry-reward').hidden=true;$('result-reward').textContent='Saving match reward...';
 const expectedAccount=career.accountBackend+':'+career.account,expectedEpoch=matchEpoch;
 const finish=outcome=>{
 if(career.accountBackend+':'+career.account!==expectedAccount)return;
 if(outcome.progress)career.progress=cleanProgress(outcome.progress);
 if(expectedEpoch!==matchEpoch){careerUI();return}
 showRewardBreakdown(outcome);
 $('result-reward').textContent=outcome.duplicate?'REWARD ALREADY SAVED: '+outcome.reward+' COINS / NO ADDITIONAL PAYOUT':outcome.reward>0?'REWARD SAVED: +'+outcome.reward+' COINS':cpu?'MATCH SAVED / NO COINS EARNED':'LOCAL MATCH COMPLETE / NO COIN REWARD';careerUI();
 };
 const failed=error=>{if(expectedEpoch!==matchEpoch)return;$('result-reward').textContent='NOT CREDITED: '+error.message;rewardClaimed=false;$('retry-reward').hidden=false};
 const completed=()=>{activity.settlements=Math.max(0,activity.settlements-1);careerUI()};
 try{const outcome=career.settle(careerMatch,winner===0);if(outcome&&typeof outcome.then==='function')outcome.then(finish).catch(failed).finally(completed);else{finish(outcome);completed()}}
 catch(error){failed(error);completed()}
}
$('retry-reward').onclick=()=>{if(!activity.settlements)settleCareer(wins[0]===targetWins?0:1)};
$('recover-result').onclick=()=>{
 const pending=career.pending[0],receipt=career.progress.receipts[career.progress.lastResult];
 if(!pending&&!receipt)return;
 const data=pending?{...pending,...pending.result}:receipt;
 wins=[...data.scores];targetWins=data.config?.targetWins||data.targetWins;cpu=data.config?.cpu??data.cpu;difficulty=data.config?.difficulty||data.difficulty;
 paused=false;ended=true;phase='matchend';clearInput();$('menu').hidden=true;$('result-panel').hidden=false;
 const names=data.fighters||data.config?.fighters||['PLAYER 1',cpu?'COMPUTER':'PLAYER 2'],winner=data.won?0:1;
 renderer.victor=winner;renderer.victoryStarted=presentationFrame;renderer.winnerPreview={...players[winner],character:CHARACTERS.find(character=>character.name===names[winner])||players[winner].character};
 $('result-title').textContent=(data.won?'VICTORY / ':'DEFEAT / ')+names[winner].toUpperCase()+' WINS';$('result-score').textContent='PLAYER 1 '+wins[0]+' - '+wins[1]+' '+(cpu?'COMPUTER':'PLAYER 2');
 if(pending){careerMatch=pending;market=pending.market;rewardClaimed=false;settleCareer(data.won?0:1)}
 else{rewardClaimed=true;showRewardBreakdown(receipt);$('result-reward').textContent='REWARD ALREADY SAVED: '+receipt.reward+' COINS';$('retry-reward').hidden=true}
};

$('settings-button').onclick=openMenu;
$('play-button').onclick=closeMenu;
$('fullscreen').onclick=async()=>{
 try{
 if(document.fullscreenElement){await document.exitFullscreen();$('fullscreen').textContent='FULL SCREEN'}
 else if(document.documentElement?.requestFullscreen){await document.documentElement.requestFullscreen();$('fullscreen').textContent='EXIT FULL SCREEN'}
 else ui.text('coach','Use your browser full-screen command. The arena already fills this window.');
 }catch{ $('coach').textContent='Full screen was declined. The arena still fills the browser window.' }
};
function focusArena(){
 const active=document.activeElement;if(active&&active!==$('game'))active.blur?.();
 $('game').focus?.({preventScroll:true});
}
function resumeGame(preserveInput=false){
 if(!$('menu').hidden||ended)return;
 if(frameFault){restart();closeMenu();return}
 paused=false;$('pause').textContent='Pause';if(phase==='fight')$('announcement').textContent='';
 if(!preserveInput)clearInput();focusArena();$('resume-overlay').hidden=true;
}
$('resume-game').onclick=()=>resumeGame();
$('game').addEventListener('pointerdown',()=>{if(!$('menu').hidden)return;if(paused)resumeGame();else focusArena()});
input.onInteract=()=>{sound.unlock();if(!$('menu').hidden)return;if(paused)resumeGame();else focusArena()};
$('roll-control').onclick=event=>{if((event?.detail||0)!==0||!$('menu').hidden||ended||phase!=='fight')return;input.onInteract?.();input.pressed.add(input.bindings[0].roll)};
function clearInput(){input.clear()}
function nextRound(){sound.announce('Round '+round);trainingKO=0;$('winner-banner').hidden=true;players.forEach(p=>p.reset());ai.reset();renderer.reset();phase='countdown';phaseUntil=tick+150;roundStart=phaseUntil;remaining=99;freeze=0;clearInput();$('announcement').textContent='ROUND '+round}
function restart(){trainingFrozen=false;trainingStep=false;input.clear();$('training-panel').hidden=!training;$('training-pause').textContent='FREEZE';$('result-panel').inert=false;$('result-panel').classList.remove('celebration-pending');$('winner-banner').hidden=true;renderer.victor=null;$('result-breakdown').replaceChildren();$('retry-reward').hidden=true;input.solo=cpu;frameFault=null;startingMatch=null;$('play-button').disabled=false;$('play-button').textContent='FIGHT!';matchEpoch++;careerMatch=null;rewardClaimed=false;market=makeMarket();applyCareer();$('result-panel').hidden=true;tick=0;round=1;wins=[0,0];ended=false;paused=false;nextRound();$('pause').textContent='Pause';lastEvent='Create space. Make them miss. Punish the recovery.';if(!$('menu').hidden){paused=true;$('pause').textContent='Resume'}}
function pause(){if(!$('menu').hidden)return;if(frameFault){restart();closeMenu();return}if(ended)return;paused=!paused;$('pause').textContent=paused?'Resume':'Pause';if(paused)$('announcement').textContent='PAUSED';else if(phase==='fight')$('announcement').textContent='';clearInput()}
$('reset').onclick=restart;$('pause').onclick=pause;
$('mode').onchange=e=>{training=e.target.value==='training';cpu=e.target.value==='cpu'||training;restart();updateVersus()};
$('difficulty').onchange=e=>{difficulty=e.target.value;levelUI();restart()};
$('match-length').onchange=e=>{targetWins=Number(e.target.value);restart();updateVersus()};
$('guide-toggle').onclick=()=>{if($('guide').hidden)ui.open($('guide'));else ui.close($('guide'));$('guide-toggle').setAttribute?.('aria-expanded',String(!$('guide').hidden));if(!$('guide').hidden&&!paused&&!ended)pause()};
window.addEventListener('keydown',e=>{
 const code=input.codeFor(e),movement=[...input.bindings.flatMap(b=>['left','right','up','down'].map(a=>b[a])),'ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(code);
 if(!e.repeat)sound.unlock();if(e.repeat&&!movement)return;
 if(!$('settings-dialog').hidden||!$('confirm-dialog').hidden||!$('guide').hidden&&code==='Escape')return;
 if(!$('menu').hidden){
 if(e.target?.tagName==='SELECT'||e.target?.tagName==='BUTTON'||e.target?.tagName==='INPUT')return;
 if(e.code==='Enter'){e.preventDefault();if(screen==='title')showSlide('setup');else if(screen==='setup')showSlide('fighters');else if(screen==='fighters')showSlide('versus');else if(screen==='versus')closeMenu()}
 if(e.code==='Escape'){if(screen==='career'||screen==='market')showSlide('title');else if(screen==='versus')showSlide('fighters');else if(screen==='fighters')showSlide('setup');else if(screen==='setup')showSlide('title')}
 return;
 }
 if(['SELECT','INPUT','TEXTAREA'].includes(e.target?.tagName))return;
 if(paused&&(movement||code===input.bindings[0].roll||code==='ShiftLeft'||!cpu&&code===input.bindings[1].roll)&&!ended){resumeGame(true);return}
 if(e.target?.tagName==='BUTTON'&&['Space','Enter'].includes(code))return;
 if(code==='Space'||code==='Escape')pause();
});
window.addEventListener('blur',()=>{if(!paused&&!ended)pause()});
function finishRound(){
 if(training)return false;
 if(phase!=='fight'||ended)return false;
 const [a,b]=players;players.filter(p=>p.hp<=0).forEach(p=>p.transition('ko'));phase='roundend';phaseUntil=tick+170;
 const ratioA=a.hp/a.maxHealth,ratioB=b.hp/b.maxHealth;
 if(Math.abs(ratioA-ratioB)<1e-9){$('announcement').textContent='DRAW - REPLAY';lastEvent='Same health. Replay this round.';return}
 const winner=ratioA>ratioB?0:1;wins[winner]++;
 sound.announce(players[winner].character.name+' wins');renderer.victor=winner;renderer.winnerPreview=null;$('victory-canvas').setAttribute?.('aria-label',players[winner].character.name+' celebrates victory');renderer.victoryStarted=presentationFrame;
 players.forEach((p,i)=>{p.move=null;p.stun=0;p.y=0;p.vy=0;p.crouching=false;p.transition(i===winner?'victory':p.hp<=0?'ko':'defeat')});
 $('winner-banner').hidden=false;$('winner-banner').textContent=(winner===0?'PLAYER 1':cpu?'COMPUTER':'PLAYER 2')+' / '+players[winner].character.name.toUpperCase()+' WINS!';$('announcement').textContent=(winner===0?'PLAYER 01':cpu?'COMPUTER':'PLAYER 02')+' WINS';
 if(wins[winner]>=targetWins){ended=true;phase='matchend';$('announcement').textContent=(winner===0?'PLAYER 1':cpu?'COMPUTER':'PLAYER 2')+' / '+players[winner].character.name.toUpperCase()+' WINS THE MATCH';lastEvent='Match complete. Restart for a rematch, or choose a new discipline.';$('result-panel').hidden=false;$('result-title').textContent=(cpu?(winner===0?'VICTORY / ':'DEFEAT / '):'')+(winner===0?'PLAYER 1 / ':cpu?'COMPUTER / ':'PLAYER 2 / ')+players[winner].character.name.toUpperCase()+' WINS';$('result-score').textContent=players[0].character.name+' '+wins[0]+' - '+wins[1]+' '+players[1].character.name;settleCareer(winner);resultReveal=presentationFrame+(preferences.value.reducedMotion?0:75);$('result-panel').classList.add('celebration-pending');$('result-panel').inert=true;updateGoal();}
 else{round++;lastEvent='Next round begins shortly. First to '+targetWins+' wins takes the match.'}
}
function update(){
 if(paused||ended){input.endFrame();return}
 if(training&&trainingFrozen&&!trainingStep){input.endFrame();return}trainingStep=false;
 if(freeze>0){freeze--;return}
 tick++;
 if(phase==='countdown'){
 const left=phaseUntil-tick;$('announcement').textContent=left>90?'ROUND '+round:left>30?'READY':'FIGHT';
 if(tick>=phaseUntil){phase='fight';sound.announce(training?'Training':'Fight');$('announcement').textContent=''}
 input.endFrame();return;
 }
 if(phase==='roundend'){if(tick>=phaseUntil)nextRound();input.endFrame();return}
 remaining=training?99:Math.max(0,99-Math.floor((tick-roundStart)/60));
 input.solo=cpu;
 const commands=players.map((p,i)=>i===1&&training?trainingCommand(p):i===1&&cpu?ai.command(p,players[0],tick,difficulty):input.read(i,p.facing,tick));
 players.forEach((p,i)=>p.update(commands[i],players[1-i],tick));
 separateFighters(players);
 resolveExchange(players,tick,(i,x,y,block,kind)=>{const p=players[i];sound.cue(kind);
 renderer.effects.push({x,y,block,tick});renderer.cheerUntil=tick+35;freeze=kind==='parry'?6:kind==='counter'?5:3;
 const who=i===0?'P1':'P2';lastEvent=kind==='parry'?'Perfect guard: attacker exposed. Counter now.':kind==='tech'?'Throw escaped. Reset your spacing.':kind==='punish'?who+' punished recovery (+20%).':kind==='counter'?who+' interrupted an attack (+20%).':block?'Guard absorbs damage, but loses strength.':p.isGrapple()?'Throw beats guard. Press throw on contact to escape.':p.attackPosture==='crouching'?'Low strike: crouch + block to defend.':p.attackPosture==='air'?'Aerial strike: stand + block to defend.':who+' landed '+p.move?.label+'.';
 });
 input.endFrame();if(training){if(players.some(p=>p.hp<=0)){if(!trainingKO)trainingKO=tick+75;if(tick>=trainingKO)resetTraining()}return}if(players.some(p=>p.hp<=0)||remaining===0)finishRound();
}
function frame(now){
 requestAnimationFrame(frame);if(frameFault)return;
 presentationFrame=now/(1000/60);renderer.presentationFrame=presentationFrame;renderer.reducedMotion=preferences.value.reducedMotion;
 try{
 accumulator+=Math.min(100,now-last);last=now;while(accumulator>=1000/60){update();accumulator-=1000/60}
 if(ended&&presentationFrame>=resultReveal){$('result-panel').classList.remove('celebration-pending');if($('result-panel').inert){$('result-panel').inert=false;ui.focus($('result-panel'))}}
 if(ended&&phase==='matchend'&&!$('result-panel').hidden&&renderer.victor!==null)renderer.victory($('victory-canvas'),renderer.winnerPreview||players[renderer.victor],presentationFrame-renderer.victoryStarted);
 $('debug').disabled=!training;$('debug').parentElement?.toggleAttribute?.('hidden',!training);
 if($('menu').hidden){renderer.market=market;renderer.cheering=phase==='roundend'||phase==='matchend';renderer.draw(players,tick,training&&($('debug').checked||$('training-boxes').checked))}
 else if(screen==='title'&&!document.hidden)titleScreen.draw(now,preferences.value.reducedMotion);
 players.forEach((p,i)=>{
 const trail=$('damage-trail'+i),ratio=p.hp/p.maxHealth*100;const old=Number(trail.dataset.value||100);trail.dataset.value=String(preferences.value.reducedMotion||ratio>old?ratio:Math.max(ratio,old-.22));trail.style.width=trail.dataset.value+'%';
 const bar=$('health'+i);bar.style.width=(p.hp/p.maxHealth*100)+'%';bar.style.background='hsl('+(p.hp/p.maxHealth*105)+' 48% 61%)';
 $('guard'+i).style.width=(p.guard/p.maxGuard*100)+'%';
 $('combo'+i).textContent=p.combo>1?p.combo+' HIT COMBO':p.hp+' / '+p.maxHealth+' HP';
 $('metertext'+i).textContent='GUARD '+Math.floor(p.guard)+' / '+p.maxGuard;
 $('wins'+i).textContent=Array.from({length:targetWins},(_,n)=>n).map(n=>n<wins[i]?'★':'☆').join(' ');
 });
 ui.text('timer',String(remaining).padStart(2,'0'));ui.text('round-label','ROUND '+round+' / FIRST TO '+targetWins);
 ui.text('cpu-level-badge',cpu?'CPU '+DIFFICULTIES[difficulty].name.toUpperCase():'LOCAL TWO PLAYERS');
 ui.text('status',cpu?'VS COMPUTER / '+DIFFICULTIES[difficulty].name.toUpperCase():'LOCAL VERSUS');
 ui.text('coach',training?lastEvent:'');
 $('resume-overlay').hidden=!paused||!$('menu').hidden||ended;
 const hero=players[0],rollWait=Math.max(0,hero.rollCooldown-tick);
 $('roll-control').disabled=phase!=='fight'||ended;
 $('roll-control').textContent=phase!=='fight'?'START FIGHT TO ROLL':hero.state==='roll'?'ROLLING!':rollWait>0?'ROLL / '+(rollWait/60).toFixed(1)+'s':'ROLL / '+input.bindings[0].roll.replace('Key','')+' or SHIFT';
 $('roll-feedback').textContent=phase!=='fight'?'ROLL: '+input.bindings[0].roll.replace('Key','')+' / SHIFT on ground or in air':hero.stun>0?'Recover from the hit, then roll':hero.state==='attack'?'Finish your attack, then roll':hero.state==='roll'?(hero.rollAir?'AIR ROLL':'GROUND ROLL'):!hero.grounded&&hero.airRollUsed?'Land before another air roll':rollWait>0?'Roll recovering':'ROLL READY';
 const keys=input.bindings[0],short=k=>input.label(k);ui.text('movement-help','MOVE '+short(keys.left)+' / '+short(keys.right)+(cpu?' or arrows':'')+' | JUMP '+short(keys.up)+' | ROLL '+short(keys.roll)+' / SHIFT | SPECIAL '+short(keys.specialKey));
 ui.text('wallet',(career.account||'GUEST')+' / '+career.progress.coins+' COINS / '+(career.account&&career.accountBackend==='server'?'THIS COMPUTER':career.storageOK?'THIS BROWSER':'UNSAVED'));
 if(training){ui.text('training-readout',players.map(p=>p.character.name+': '+(p.phase||p.state)+' / frame '+p.frame+' / hitstun '+p.stun).join(' | '));ui.text('input-history','INPUT: '+input.history[0].slice(-10).map(e=>e.action).join(' > '))}
 ui.text('crowd-bets','CROWD BETS: '+players[0].character.name+' '+market.pools[0]+' / '+players[1].character.name+' '+market.pools[1]+' COINS');
 ui.text('match-score',players[0].character.name+' '+wins[0]+' - '+wins[1]+' '+players[1].character.name);
 ui.text('match-format','BEST OF '+(targetWins*2-1)+' / FIRST TO '+targetWins);
 ui.text('match-progress',phase==='matchend'?'MATCH COMPLETE':phase==='roundend'?'ROUND COMPLETE / NEXT ROUND SOON':'ROUND '+round);
 }catch(error){frameFault=error;paused=true;clearInput();$('announcement').textContent='MATCH PAUSED';$('resume-overlay').hidden=false;ui.text('coach','The match stopped unexpectedly. Restart the match to recover; your saved profile is unchanged.');$('pause').textContent='Resume';console.error?.('DOJO match paused:',error?.message)}
}
menuView=createMenuUI({$,ui,go:showSlide,play:closeMenu,restart,openMenu});
marketView=createMarketUI({$,career,players,renderer,ui,preferences,sound,isBusy:()=>activity.busy||activity.settlements>0,setBusy:v=>activity.busy=v,onChange:()=>{applyCareer();styleUI()},renderAll:careerUI,updateGoal});
careerView=createCareerUI({$,career,activity,ui,sound,applyCareer,restart,styleUI,openMenu,showSlide,closeMenu,getScreen:()=>screen,hasActiveMatch:()=>!!careerMatch&&!ended,renderMarket:()=>marketView.render()});
setupPreferences();styleUI();restart();careerUI();openMenu('title');if(/[?&]screen=market(?:&|$)/.test(globalThis.location?.search||'')||globalThis.location?.hash==='#market')openMarket();requestAnimationFrame(frame);
career.refresh().then(restored=>{if(restored&&!$('menu').hidden){applyCareer();restart();styleUI()}careerUI()}).catch(error=>{$('account-message').textContent=error.message});

function saveSetup(){preferences.set('lastSetup',{cpu,training,equalStats,difficulty,targetWins,arena:arenaId,characters:players.map(p=>p.character.id),styles:players.map(p=>p.style.name)})}
function resetTraining(){players.forEach(p=>p.reset());ai.reset();freeze=0;trainingKO=0;clearInput();lastEvent='Training reset. No coins or results are recorded.'}
function trainingCommand(p){const choice=$('dummy-mode').value||'idle';if(choice==='cpu')return ai.command(p,players[0],tick,difficulty);return choice==='block'?{block:true}:choice==='low'?{block:true,down:true}:choice==='attack'?{lightPressed:p.state!=='attack'&&p.stun===0}:{}}
function updateGoal(){const key=preferences.value.pinned,item=COSMETICS[key];const text=item?item.name+': '+(career.progress.cosmetics.includes(key)?'OWNED':Math.max(0,item.price-career.progress.coins).toLocaleString()+' coins remaining / '+(cosmeticAccess(career.progress,key).missing.join(' / ')||'Victory requirements complete')):'Pin an outfit in the market to track your next goal.';ui.text('pinned-goal',text);ui.text('result-goal',text)}
function setupPreferences(){
 const saved=preferences.value.lastSetup;if(saved){difficulty=Object.hasOwn(DIFFICULTIES,saved.difficulty)?saved.difficulty:difficulty;targetWins=[2,3,4].includes(saved.targetWins)?saved.targetWins:2;cpu=saved.cpu!==false;training=saved.training===true;equalStats=saved.equalStats===true;players.forEach((p,i)=>{p.character=CHARACTERS.find(c=>c.id===saved.characters?.[i])||p.character;p.style=STYLES.find(s=>s.name===saved.styles?.[i])||p.style})}
 arenaId=getArena(saved?.arena).id;renderer.arena=arenaId;arenaUI();
 $('mode').value=training?'training':cpu?'cpu':'local';$('difficulty').value=difficulty;$('match-length').value=String(targetWins);$('equal-stats').checked=equalStats;
 input.restoreBindings(preferences.value.bindings,preferences.value.controlsVersion);if(preferences.value.controlsVersion<2){preferences.set('bindings',input.bindings);preferences.set('controlsVersion',2)}
 for(const kind of ['master','effects','crowd','voice']){const control=$('volume-'+kind);control.value=preferences.value[kind];control.oninput=e=>{preferences.set(kind,Number(e.target.value));sound.unlock()}}
 const apply=()=>{document.documentElement?.setAttribute?.('data-controls',preferences.value.controls);document.documentElement?.setAttribute?.('data-reduced-motion',String(preferences.value.reducedMotion));renderer.reducedMotion=preferences.value.reducedMotion};apply();
 $('reduced-motion').checked=preferences.value.reducedMotion;$('reduced-motion').onchange=e=>{preferences.set('reducedMotion',e.target.checked);apply()};$('control-visibility').value=preferences.value.controls;$('control-visibility').onchange=e=>{preferences.set('controls',e.target.value);apply()};
 const bindings=()=>{$('binding-buttons').replaceChildren(...input.bindings.flatMap((mapping,id)=>Object.entries(mapping).map(([action,code])=>{const button=document.createElement('button');button.textContent='P'+(id+1)+' '+action+' / '+input.label(code);button.onclick=()=>{$('settings-message').textContent='Press a new key for P'+(id+1)+' '+action;input.captureBinding=key=>{if(key==='Escape'){input.captureBinding=null;ui.close($('settings-dialog'));return}try{input.rebind(id,action,key);preferences.set('bindings',input.bindings);$('settings-message').textContent='Controls saved.';bindings()}catch(e){$('settings-message').textContent=e.message}}};return button})))};bindings();
 ui.onClose=panel=>{clearInput();input.captureBinding=null;if(panel===$('guide'))$('guide-toggle').setAttribute?.('aria-expanded','false')};
 const options=()=>{if($('menu').hidden&&!paused&&!ended)pause();ui.open($('settings-dialog'))};$('options-button').onclick=options;$('pause-settings').onclick=options;$('title-options').onclick=options;$('settings-close').onclick=()=>{input.captureBinding=null;ui.close($('settings-dialog'))};$('guide-close').onclick=()=>{ui.close($('guide'));$('guide-toggle').setAttribute?.('aria-expanded','false')};
 $('pause-rematch').onclick=()=>{restart();closeMenu()};$('pause-fighters').onclick=()=>openMenu('fighters');$('pause-market').onclick=openMarket;
 $('quick-play').onclick=()=>{restart();closeMenu()};$('title-training').onclick=()=>{training=true;cpu=true;$('mode').value='training';restart();closeMenu()};
 $('equal-stats').onchange=e=>{equalStats=e.target.checked;restart();styleUI()};
 $('training-pause').onclick=()=>{trainingFrozen=!trainingFrozen;$('training-pause').textContent=trainingFrozen?'RUN':'FREEZE'};$('training-step').onclick=()=>{trainingFrozen=true;trainingStep=true;$('training-pause').textContent='RUN'};$('training-reset').onclick=resetTraining;
 window.addEventListener('storage',event=>{if(event.key==='dojo-career-v6'||event.key==='dojo-device-accounts-v7'){if(!activity.busy&&!activity.settlements&&career.syncFromStorage()){careerUI();$('account-message').textContent='Progress updated from another tab. Combat upgrades apply at your next match.'}}});
}
