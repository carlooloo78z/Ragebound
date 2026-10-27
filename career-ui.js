import {UPGRADE_TYPES,MAX_UPGRADE,upgradeCost,cleanProgress} from './career.js';
export function createCareerUI({$,career,activity,ui,sound,applyCareer,restart,styleUI,openMenu,showSlide,closeMenu,getScreen,hasActiveMatch,renderMarket}){
function careerUI(){
 cosmeticUI();
 $('profile-name').textContent=career.account||'GUEST FIGHTER';
 $('career-balance').textContent=career.progress.coins+' COINS';
 $('career-record').textContent=career.progress.wins+' WINS / '+career.progress.losses+' LOSSES';
 $('recover-result').hidden=!(career.pending.length||career.progress.lastResult);
 const levels=Object.values(career.progress.upgrades).reduce((a,b)=>a+b,0);
 $('save-status').textContent=(career.journalError?'RECOVERY COPY NOT SAVED':activity.busy||activity.settlements>0?'SAVING...':career.account&&career.accountBackend==='server'?'SERVER SAVE':career.storageOK?'BROWSER SAVE':'SAVE BLOCKED')+' / '+(career.account||'GUEST')+' / '+levels+' UPGRADE LEVELS SAVED / '+career.progress.cosmetics.length+' OUTFITS OWNED';
 $('account-status').textContent=career.account
 ?career.accountBackend==='device'?'Device account: coins and upgrades are saved in this browser and game location.':'Server account: progress is saved by the local game server.'
 : career.remote?'Playing as a guest. Create a device account here, even in the downloaded game. Choose Server account only for the running web game.':'Playing as a guest. Create a device account to keep coins, upgrades and outfits in this browser. Use BACK UP SAVE to move progress to another device.';
 if(career.journalError)$('account-status').textContent+=' '+career.journalError;
 if(!career.storageOK)$('account-status').textContent+=' Browser storage is blocked or full; enable it before creating a device account.';
 $('account-location').value=career.accountBackend;$('account-location').disabled=!!career.account||activity.busy;
 $('server-account-option').disabled=!career.remote;
 $('server-account-option').hidden=!career.remote;
 $('signout').hidden=!career.account;$('signin').hidden=!!career.account;$('signup').hidden=!!career.account;
 for(const id of ['signup','signin','signout'])$(id).disabled=activity.busy||activity.settlements>0;
 $('upgrade-cards').replaceChildren(...Object.entries(UPGRADE_TYPES).map(([key,info])=>{
 const level=career.progress.upgrades[key],cost=upgradeCost(key,level),button=document.createElement('button'),step={health:8,power:4,speed:2,guard:8}[key],unit=['power','speed'].includes(key)?'%':'';
 button.className='upgrade-card';button.disabled=activity.busy||activity.settlements>0||cost===null||career.progress.coins<cost;
 button.innerHTML='<b>'+info.name+'</b><small>'+info.description+'</small><span>LEVEL '+level+' / '+MAX_UPGRADE+'</span><small>Total bonus +'+(level*step)+unit+(cost===null?'':' / Next +'+((level+1)*step)+unit)+'</small><em>'+(cost===null?'MAXED':cost+' COINS / BUY + RESTART')+'</em>';
 button.onclick=async()=>{if(activity.busy||activity.settlements>0)return;activity.busy=true;careerUI();try{
 const outcome=await career.buy(key);if(outcome.progress)career.progress=cleanProgress(outcome.progress);
 sound.cue('buy');applyCareer();restart();styleUI();careerUI();$('account-message').textContent=outcome.message||'Upgrade purchased. Applied to your next match.';$('shop-message').textContent=$('account-message').textContent;
 }catch(error){$('account-message').textContent=error.message;$('shop-message').textContent=error.message;$('market-feedback').textContent=error.message}finally{activity.busy=false;careerUI()}};
 return button;
 }));
}
function cosmeticUI(){renderMarket()}

function showShop(tab){
 if(tab==='cosmetics'&&getScreen()!=='market')showSlide('market');else if(tab==='upgrades'&&getScreen()!=='career')showSlide('career');$('powerup-panel').hidden=tab!=='upgrades';$('market-panel').hidden=tab!=='cosmetics';
 $('powerups-tab').classList.toggle('active',tab==='upgrades');$('market-tab').classList.toggle('active',tab==='cosmetics');
 $('career-columns').classList.toggle('market-view',tab==='cosmetics');
}
function openMarket(){openMenu('market');showShop('cosmetics');$('market-feedback').textContent=career.progress.coins?'Choose an outfit below to buy or equip.':'Finish matches to earn coins, even after a loss. Outfits cost 300 to 18,000 coins.'}
$('market-back').onclick=()=>showSlide('title');$('market-play').onclick=()=>{if(hasActiveMatch())closeMenu();else showSlide('setup')};
$('market-button').onclick=openMarket;$('title-market').onclick=openMarket;
$('powerups-tab').onclick=()=>showShop('upgrades');$('market-tab').onclick=()=>showShop('cosmetics');
$('remember-profile').onchange=e=>{
 career.rememberDevice=e.target.checked;
 try{if(career.account&&career.accountBackend==='device')career.storage?.setItem('dojo-remembered-device-v10',career.rememberDevice?career.account:'')}catch{}
};
$('export-save').onclick=()=>{
 try{const blob=new Blob([JSON.stringify(career.backup(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='dojo-progress-'+(career.account||'guest')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('account-message').textContent='Progress backup downloaded. It contains no passwords.'}
 catch(error){$('account-message').textContent='Backup could not be downloaded: '+error.message}
};
$('import-save').onclick=()=>{$('import-file').click()};
$('import-file').onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(activity.busy||activity.settlements>0){$('account-message').textContent='Wait for the current save to finish.';return}
 activity.busy=true;careerUI();try{if(file.size>5000000)throw Error('This save file is too large.');const backup=JSON.parse(await file.text());if(!await ui.confirm('Replace '+(career.account||'Guest')+' progress with this backup? Export your current save first if you want to keep it.'))return;await career.importBackup(backup);applyCareer();restart();styleUI();$('account-message').textContent='Backup restored. Power-ups, coins and outfits are loaded.'}
 catch(error){$('account-message').textContent=error.message}
 finally{activity.busy=false;$('import-file').value='';careerUI()}
};
async function accountAction(action){
 if(activity.busy)return;if(activity.settlements>0){$('account-message').textContent='Your match reward is still saving. Please wait a moment.';return}
 const username=$('account-username').value||'',password=$('account-password').value||'',choice=$('account-location').value||career.accountBackend;
 activity.busy=true;careerUI();$('account-message').textContent=action==='register'?'Creating your account...':'Signing in...';
 try{
 career.setBackend(choice);await career.sign(action,username,password);
 applyCareer();restart();careerUI();styleUI();$('account-password').value='';
 $('account-message').textContent='Signed in as '+career.account+'. Coins and upgrades are saved '+(career.accountBackend==='device'?'in this browser.':'on the local server.');
 }catch(error){$('account-message').textContent=error.message}
 finally{activity.busy=false;careerUI()}
}
$('signup').onclick=e=>{e?.preventDefault?.();return accountAction('register')};$('signin').onclick=()=>accountAction('login');
$('account-form').onsubmit=e=>{e.preventDefault();accountAction('register')};
$('show-password').onchange=e=>{$('account-password').type=e.target.checked?'text':'password'};
$('account-location').onchange=e=>{try{career.setBackend(e.target.value);careerUI();$('account-message').textContent=''}catch(error){$('account-message').textContent=error.message}};
$('signout').onclick=async()=>{
 if(activity.busy||activity.settlements>0)return;activity.busy=true;careerUI();
 try{await career.logout();applyCareer();restart();styleUI();$('account-message').textContent='Signed out. Back to guest progress.'}
 catch(error){$('account-message').textContent=error.message}
 finally{activity.busy=false;careerUI()}
};
$('career-button').onclick=()=>{openMenu('career');showShop('upgrades')};$('title-career').onclick=()=>{showSlide('career');showShop('upgrades')};
$('career-back').onclick=()=>showSlide('title');$('result-shop').onclick=()=>openMenu('career');

return {render:careerUI,openMarket,showShop};
}
