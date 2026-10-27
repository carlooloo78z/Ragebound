import {profileTransaction} from './storage.js';
export const ECONOMY_VERSION=2;
export const UPGRADE_TYPES={
 health:{name:'Vitality',description:'+8 maximum health per level',base:75},
 power:{name:'Power',description:'+4% strike damage per level',base:90},
 speed:{name:'Footwork',description:'+2% walking speed per level',base:80},
 guard:{name:'Defense',description:'+8 maximum guard per level',base:70}
};
export const MAX_UPGRADE=5;
export const COSMETICS={
 default:{name:'Original outfit',price:0,color:null,rarity:'Starter',description:'Your fighter’s original colours.'},
 crimson:{name:'Crimson outfit',price:300,color:'#b66b63',rarity:'Common',description:'Crimson cloth and trim. Appearance only.'},
 moonlight:{name:'Moonlight outfit',price:400,color:'#b5c8de',rarity:'Common',description:'Cool silver-blue cloth. Appearance only.'},
 jade:{name:'Jade outfit',price:350,color:'#76a998',rarity:'Common',description:'Muted jade cloth and trim. Appearance only.'},
 aurora:{name:'Aurora outfit',price:700,color:'#35d9f2',rarity:'Rare',requirements:{wins:2},description:'Electric cyan cloth. Appearance only.'},
 violet:{name:'Violet Flame',price:850,color:'#b36cff',rarity:'Rare',requirements:{wins:3},description:'Vivid violet cloth. Appearance only.'},
 sunburst:{name:'Sunburst outfit',price:600,color:'#ffb633',rarity:'Rare',requirements:{wins:1},description:'Bright golden cloth. Appearance only.'},
 oceanforge:{name:'Ocean Forge',price:1000,color:'#246ec4',accent:'#7cfff2',pattern:'stripes',rarity:'Rare',requirements:{wins:4},description:'Ocean-blue uniform, mint stripes and wraps.'},
 emberwolf:{name:'Ember Wolf',price:1250,color:'#c94c3f',accent:'#ffcc6c',pattern:'chevron',rarity:'Rare',requirements:{wins:5},description:'Ember cloth with a gold chevron crest.'},
 neonrider:{name:'Neon Rider',price:1500,color:'#9237bb',accent:'#64ffb5',pattern:'circuit',rarity:'Rare',requirements:{wins:6},description:'Violet cloth, neon circuit trim and wraps.'},
 stormguard:{name:'Storm Guard',price:2200,color:'#354bae',accent:'#91e3ff',pattern:'diamond',rarity:'Epic',requirements:{wins:8},description:'Cobalt uniform with a diamond chest crest.'},
 phoenix:{name:'Phoenix Ascendant',price:2800,color:'#df5736',accent:'#ffe36a',pattern:'flame',aura:'#ffad46',rarity:'Epic',requirements:{wins:10},description:'Flame stitching, gold wraps and ember aura.'},
 frostlord:{name:'Frost Sovereign',price:3500,color:'#c6e4f8',accent:'#3971ce',pattern:'stars',aura:'#a5f4ff',rarity:'Epic',requirements:{wins:12},description:'Ice-white cloth, blue star marks and frost aura.'},
 dragonjade:{name:'Jade Dragon',price:4200,color:'#287b61',accent:'#edcd72',pattern:'wave',aura:'#6ff4a8',rarity:'Epic',requirements:{wins:15},description:'Jade cloth, gold wave embroidery and jade aura.'},
 solarmonarch:{name:'Solar Monarch',price:5500,color:'#e6b339',accent:'#fff0b1',pattern:'diamond',aura:'#ffd447',rarity:'Legendary',requirements:{wins:20},description:'Gold uniform, royal crest and solar aura.'},
 eclipse:{name:'Eclipse Ronin',price:7000,color:'#30324e',accent:'#ff77b7',pattern:'chevron',aura:'#ba77ff',rarity:'Legendary',requirements:{wins:25},description:'Midnight cloth with rose trim and eclipse aura.'},
 royalnova:{name:'Royal Nova',price:8500,color:'#6d40c1',accent:'#ffdf75',pattern:'stars',aura:'#c99bff',rarity:'Legendary',requirements:{wins:30},description:'Royal purple cloth, gold stars and nova aura.'},
 voidseraph:{name:'Void Seraph',price:11000,color:'#29253f',accent:'#9f8aff',pattern:'circuit',aura:'#d68aff',rarity:'Mythic',requirements:{wins:40},description:'Void circuitry and a violet spectral aura.'},
 celestial:{name:'Celestial Paragon',price:14000,color:'#e0dafa',accent:'#51caff',pattern:'wave',aura:'#a9e9ff',rarity:'Mythic',requirements:{wins:50},description:'Pearl cloth, azure embroidery and celestial aura.'},
 immortal:{name:'Immortal Champion',price:18000,color:'#e8c94d',accent:'#eaffff',pattern:'flame',aura:'#fff38a',rarity:'Mythic',requirements:{wins:60},description:'Prestige gold, luminous trim and champion aura.'}
};
export function cosmeticStats(progress){
 const stats={wins:Number.isSafeInteger(progress?.wins)?Math.max(0,progress.wins):0,hardWins:0,championWins:0,longWins:0};
 for(const receipt of Object.values(progress?.receipts||{})){
 if(!receipt?.cpu||!receipt.won)continue;
 if(['hard','expert'].includes(receipt.difficulty))stats.hardWins++;
 if(receipt.difficulty==='expert')stats.championWins++;
 if(receipt.targetWins===4)stats.longWins++;
 }
 return stats;
}
export function cosmeticAccess(progress,key){
 const item=COSMETICS[key];if(!item)return {eligible:false,missing:['Unknown cosmetic.'],requirements:[]};
 const labels={wins:'Match wins',hardWins:'Level 4/5 wins',championWins:'Champion wins',longWins:'Best-of-7 wins'},stats=cosmeticStats(progress);
 const requirements=Object.entries(item.requirements||{}).map(([stat,needed])=>({stat,needed,current:stats[stat]||0,label:labels[stat]}));
 const owned=progress?.cosmetics?.includes(key);
 const missing=owned?[]:requirements.filter(r=>r.current<r.needed).map(r=>r.label+': '+r.current+' / '+r.needed);
 return {eligible:!!owned||missing.length===0,owned:!!owned,missing,requirements,stats};
}

const validID=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export function newTransactionID(prefix='action'){return prefix+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2))}
export function upgradeCost(key,level){if(!Object.hasOwn(UPGRADE_TYPES,key)||!Number.isInteger(level)||level<0||level>=MAX_UPGRADE)return null;return UPGRADE_TYPES[key].base+50*level}
export function freshProgress(){return {coins:0,wins:0,losses:0,upgrades:{health:0,power:0,speed:0,guard:0},cosmetics:['default'],equipped:'default',claimed:[],receipts:{},purchases:{},lastResult:null}}
export function cleanProgress(value){
 const out=freshProgress();if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const k of ['coins','wins','losses'])out[k]=Number.isSafeInteger(value[k])&&value[k]>=0?Math.min(value[k],10000000):0;
 for(const k of Object.keys(UPGRADE_TYPES))out.upgrades[k]=Number.isInteger(value.upgrades?.[k])?Math.max(0,Math.min(MAX_UPGRADE,value.upgrades[k])):0;
 out.cosmetics=[...new Set(['default',...(Array.isArray(value.cosmetics)?value.cosmetics.filter(key=>Object.hasOwn(COSMETICS,key)):[])])];
 if(out.cosmetics.includes(value.equipped))out.equipped=value.equipped;
 out.claimed=Array.isArray(value.claimed)?[...new Set(value.claimed.filter(validID))]:[];
 const claimedIDs=new Set(out.claimed);
 for(const [id,receipt] of Object.entries(value.receipts||{}))if(validID(id)&&receipt&&receipt.id===id&&Number.isSafeInteger(receipt.reward)&&receipt.reward>=0&&receipt.reward<=2000&&Array.isArray(receipt.scores)&&receipt.scores.length===2){
 try{out.receipts[id]=structuredReceipt(receipt);if(!claimedIDs.has(id)){out.claimed.push(id);claimedIDs.add(id)}}catch{}
 }
 for(const [id,purchase] of Object.entries(value.purchases||{}))if(validID(id)&&purchase&&['upgrade','cosmetic'].includes(purchase.kind)&&typeof purchase.key==='string'&&Number.isSafeInteger(purchase.cost)&&purchase.cost>=0)out.purchases[id]={kind:purchase.kind,key:purchase.key,cost:purchase.cost};
 out.lastResult=Object.hasOwn(out.receipts,value.lastResult)?value.lastResult:null;return out;
}
function structuredReceipt(r){
 const config={cpu:r.cpu,difficulty:r.difficulty,targetWins:r.targetWins,economyVersion:r.economyVersion??1},result=completedResult(config,r.scores),market=cleanMarket(r.market);
 if(!market||result.won!==r.won)throw Error('Invalid saved result.');
 const b=matchReward(config,market,result,config.economyVersion);
 if(r.reward!==b.total)throw Error('Invalid saved reward.');
 return {id:r.id,...result,...config,reward:b.total,purse:b.purse,crowd:b.crowd,base:b.base,levelBonus:b.levelBonus,lengthBonus:b.lengthBonus,participation:b.participation,roundBonus:b.roundBonus,crowdRate:b.crowdRate,crowdCap:b.crowdCap,market,fighters:Array.isArray(r.fighters)&&r.fighters.length===2?r.fighters.map(n=>String(n).slice(0,32)):['PLAYER 1',r.cpu?'COMPUTER':'PLAYER 2']};
}
export function cleanMarket(value){if(!value||!Array.isArray(value.pools)||value.pools.length!==2||!value.pools.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000))return null;
 const pools=[...value.pools],fans=Array.isArray(value.fans)&&value.fans.length===2&&value.fans.every(n=>Number.isInteger(n)&&n>=0&&n<=10000)?[...value.fans]:[0,0],total=pools[0]+pools[1];return {pools,fans,total,support:total?Math.round(pools[0]/total*100):50};
}
export function makeMarket(seed=Date.now()){
 let n=seed>>>0;const rand=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296};
 const pools=[Math.floor(60+rand()*100)*5,Math.floor(60+rand()*100)*5],fans=[18+Math.floor(rand()*24),18+Math.floor(rand()*24)];
 return cleanMarket({pools,fans});
}
export function validConfig(c){return c&&typeof c.cpu==='boolean'&&['beginner','easy','normal','hard','expert'].includes(c.difficulty)&&[2,3,4].includes(c.targetWins)&&(c.economyVersion===undefined||[1,2].includes(c.economyVersion))}
export function completedResult(config,scores){
 if(!validConfig(config)||!Array.isArray(scores)||scores.length!==2||!scores.every(n=>Number.isInteger(n)&&n>=0&&n<=config.targetWins))throw Error('The match has not officially completed.');
 const [a,b]=scores;if((a===config.targetWins)===(b===config.targetWins))throw Error('The match has not officially completed.');
 return {scores:[a,b],won:a===config.targetWins};
}
function emptyReward(version){return {base:0,levelBonus:0,lengthBonus:0,purse:0,crowd:0,participation:0,roundBonus:0,total:0,crowdRate:version===1?.12:.25,crowdCap:version===1?150:250}}
export function winReward(config,market,version=ECONOMY_VERSION){
 if(![1,2].includes(version))throw Error('Unknown reward rules.');
 const reward=emptyReward(version),extra=Math.max(2,Math.min(4,Number(config.targetWins)||2))-2;
 const level=Math.max(0,['beginner','easy','normal','hard','expert'].indexOf(config.difficulty));
 if(version===1&&config.cpu===false)return reward;
 reward.base=version===1?200:config.cpu===false?300:500;
 reward.levelBonus=config.cpu===false?0:(version===1?75:125)*level;
 reward.lengthBonus=(version===1?50:config.cpu===false?100:200)*extra;
 reward.purse=reward.base+reward.levelBonus+reward.lengthBonus;
 reward.crowd=Math.min(reward.crowdCap,Math.floor(market.pools[0]*reward.crowdRate));reward.total=reward.purse+reward.crowd;return reward;
}
export function matchReward(config,market,result,version=ECONOMY_VERSION){
 if(![1,2].includes(version))throw Error('Unknown reward rules.');
 if(result.won)return winReward(config,market,version);
 const reward=emptyReward(version);if(version===1)return reward;
 reward.participation=config.cpu?150:100;reward.roundBonus=50*result.scores[0];reward.lengthBonus=50*(config.targetWins-2);
 reward.purse=reward.participation+reward.roundBonus+reward.lengthBonus;reward.total=reward.purse;return reward;
}
export function settleProgress(progress,match,scores){
 if(!validID(match?.id)||!validConfig(match.config)||!cleanMarket(match.market))throw Error('Invalid match record.');
 const result=completedResult(match.config,scores),next=cleanProgress(progress);
 if(next.receipts[match.id])return {progress:next,...next.receipts[match.id],duplicate:true};
 const legacyClaim=next.claimed.includes(match.id);
 const version=match.config.economyVersion??1,breakdown=matchReward(match.config,match.market,result,version);
 const receipt={id:match.id,...result,cpu:match.config.cpu,economyVersion:version,participation:breakdown.participation,roundBonus:breakdown.roundBonus,crowdRate:breakdown.crowdRate,crowdCap:breakdown.crowdCap,reward:breakdown.total,purse:breakdown.purse,crowd:breakdown.crowd,base:breakdown.base,levelBonus:breakdown.levelBonus,lengthBonus:breakdown.lengthBonus,difficulty:match.config.difficulty,targetWins:match.config.targetWins,market:cleanMarket(match.market),fighters:Array.isArray(match.config.fighters)&&match.config.fighters.length===2?match.config.fighters.map(n=>String(n).slice(0,32)):['PLAYER 1',match.config.cpu?'COMPUTER':'PLAYER 2']};
 if(legacyClaim)return {...receipt,reward:0,purse:0,crowd:0,base:0,levelBonus:0,lengthBonus:0,progress:next,duplicate:true};
 next.claimed.push(match.id);next.receipts[match.id]=receipt;next.lastResult=match.id;
 next.coins+=receipt.reward;if(match.config.cpu||version>=2){if(result.won)next.wins++;else next.losses++}
 return {...receipt,progress:next};
}
export function buyUpgrade(progress,key){
 if(!Object.hasOwn(UPGRADE_TYPES,key))return {ok:false,message:'Unknown upgrade.'};
 const level=progress.upgrades[key],cost=upgradeCost(key,level);
 if(cost===null)return {ok:false,message:'Upgrade is already maxed.'};
 if(progress.coins<cost)return {ok:false,message:'Win more matches to afford this upgrade.'};
 progress.coins-=cost;progress.upgrades[key]++;return {ok:true,cost,message:UPGRADE_TYPES[key].name+' upgraded.'};
}
export function purchaseProgress(progress,kind,key,id){
 if(!validID(id))throw Error('Invalid purchase request.');
 const next=cleanProgress(progress),previous=next.purchases[id];
 if(previous){if(previous.kind!==kind||previous.key!==key)throw Error('Purchase request does not match.');return {ok:true,...previous,progress:next,duplicate:true,message:'Purchase already saved.'}}
 let outcome;
 if(kind==='upgrade')outcome=buyUpgrade(next,key);
 else if(kind==='cosmetic'&&Object.hasOwn(COSMETICS,key)){
 if(next.cosmetics.includes(key))return {ok:true,cost:0,progress:next,duplicate:true,message:'You already own this outfit.'};
 const access=cosmeticAccess(next,key);if(!access.eligible)throw Error('Unlock requirements not met. '+access.missing.join(' | '));
 const cost=COSMETICS[key].price;if(next.coins<cost)throw Error('You cannot afford this outfit.');
 next.coins-=cost;next.cosmetics.push(key);next.equipped=key;outcome={ok:true,cost,message:COSMETICS[key].name+' purchased and equipped.'};
 }else throw Error('Unknown shop item.');
 if(!outcome.ok)throw Error(outcome.message);
 next.purchases[id]={kind,key,cost:outcome.cost};return {...outcome,progress:next};
}
export class Career {
 constructor(storage,request=globalThis.fetch,options={}){
 if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
 this.storage=storage;this.request=request;this.crypto=options.crypto||globalThis.crypto;
 try{this.sessionStore=options.sessionStore||globalThis.sessionStorage}catch{this.sessionStore=null}
 this.pending=[];this.shopRequests={};this.rememberDevice=options.rememberDevice!==false;this.account=null;this.accountBackend='device';this.progress=freshProgress();this.session='guest';this.storageOK=!!storage;this.serial=0;this.authEpoch=0;
 this.remote=typeof location!=='undefined'&&['http:','https:'].includes(location.protocol)&&!!request;
 this.journalError='';this.serverAvailable=false;this.timeoutMs=options.timeoutMs||7000;
 try{this.progress=cleanProgress(JSON.parse(storage?.getItem('dojo-career-v6')||'null'))}catch{this.storageOK=false}
 try{const remembered=this.storage?.getItem('dojo-last-profile-mode-v10')==='server'?null:this.storage?.getItem('dojo-remembered-device-v10');const active=this.sessionStore?.getItem('dojo-device-session-v7')||remembered,accounts=this.deviceAccounts();if(active&&Object.hasOwn(accounts,active)){this.account=active;this.session='account';this.progress=cleanProgress(accounts[active].progress)}}catch{}
 this.loadPending();
 }
 cancelRestore(){this.authEpoch++}
 backup(){return {format:'dojo-career-save',version:13,progress:cleanProgress(this.progress),completedMatches:this.pending.map(m=>({...m}))}}
 importBackup(value){
 if(this.account&&this.accountBackend==='server')throw Error('Server progress is already saved on the server. Import a backup into a device profile or Guest.');
 const p=value?.progress;if(value?.format!=='dojo-career-save'||!p||!Number.isSafeInteger(p.coins)||p.coins<0||!p.upgrades||!Object.keys(UPGRADE_TYPES).every(k=>Number.isInteger(p.upgrades[k])&&p.upgrades[k]>=0&&p.upgrades[k]<=MAX_UPGRADE))throw Error('This is not a valid DOJO progress backup.');
 return this.localMutation(()=>{this.persist(cleanProgress(p));this.loadPending();for(const match of value.completedMatches||[]){try{if(validID(match.id)&&cleanMarket(match.market)&&!this.progress.claimed.includes(match.id)&&!this.pending.some(m=>m.id===match.id)){const result=completedResult(match.config,match.result?.scores);this.pending.push({id:match.id,config:{...match.config},market:cleanMarket(match.market),result})}}catch{}}this.savePending();return this.progress},{replace:true});
 }
 saveGuest(){try{if(!this.storage)throw Error();this.storage.setItem('dojo-career-v6',JSON.stringify(this.progress));this.storageOK=true;return true}catch{this.storageOK=false;return false}}
 deviceAccounts(){
 if(!this.storage)return {};
 let parsed;try{parsed=JSON.parse(this.storage.getItem('dojo-device-accounts-v7')||'{}')}catch{throw Error('Saved browser profiles could not be read. Use a different browser profile or the web-server account option.')}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Browser profile storage is not valid.');
 return parsed;
 }
 saveDevice(accounts){if(!this.storage)throw Error('Browser storage is unavailable. Allow storage for this game or use the web version.');try{this.storage.setItem('dojo-device-accounts-v7',JSON.stringify(accounts));this.storageOK=true}catch{this.storageOK=false;throw Error('The browser could not save your profile. Allow storage or free some browser space.')}}
 persist(next){
 const previous=this.progress;this.progress=cleanProgress(next);
 if(this.account&&this.accountBackend==='device'){
 try{const all=this.deviceAccounts();if(!Object.hasOwn(all,this.account))throw Error('This device profile no longer exists. Sign in again.');all[this.account].progress=this.progress;this.saveDevice(all)}catch(error){this.progress=previous;throw error}
 }else if(!this.saveGuest()){this.progress=previous;throw Error('Progress could not be saved. No coins or purchases were committed. Allow browser storage and retry.')} 
 }
 localMutation(task,{replace=false}={}){
 const epoch=this.authEpoch,account=this.account,backend=this.accountBackend;
 return profileTransaction(()=>{
 if(epoch!==this.authEpoch||account!==this.account||backend!==this.accountBackend)throw Error('Profile changed. Retry with the current profile.');
 let latest;
 if(!replace){
 if(account&&backend==='device'){const saved=this.deviceAccounts()[account];if(!saved)throw Error('This device profile no longer exists. Sign in again.');latest=saved.progress}
 else {try{const raw=this.storage?.getItem('dojo-career-v6');if(raw)latest=JSON.parse(raw)}catch{this.storageOK=false;throw Error('Progress could not be saved because the existing browser save could not be read. Export your recovery copy and restore a valid backup.')}}
 if(latest)this.progress=cleanProgress(latest);}
 return task();
 });
 }
 syncFromStorage(){
 if(this.account&&this.accountBackend==='server')return false;
 try{const value=this.account?this.deviceAccounts()[this.account]?.progress:JSON.parse(this.storage?.getItem('dojo-career-v6')||'null');if(!value)return false;this.progress=cleanProgress(value);return true}catch{return false}
 }
 async api(path,body){
 if(!this.request)throw Error('The game server is unavailable. Choose a device account instead.');
 const control=typeof AbortController!=='undefined'?new AbortController():null;
 let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{control?.abort();reject(Error('The game server did not respond. Choose a device account to save in this browser.'))},this.timeoutMs)});
 try{
 const response=await Promise.race([this.request('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},credentials:'same-origin',...(control?{signal:control.signal}:{}),...(body===undefined?{}:{body:JSON.stringify(body)})}),timeout]);
 let value;try{value=await response.json()}catch{throw Error('This copy has no account server. Choose a device account to create a profile here.')}
 if(!response.ok){const error=Error(value.error||'The account request failed.');error.status=response.status;throw error}return value;
 }catch(error){if(error?.name==='TypeError'||error?.name==='AbortError')throw Error('Cannot reach the account server. Choose a device account or launch START-DOJO.cmd.');throw error}
 finally{clearTimeout(timer)}
 }
 accept(value,backend='server'){this.account=value.username||null;this.accountBackend=backend;this.session=this.account?'account':'guest';this.progress=cleanProgress(value.progress);try{this.storage?.setItem('dojo-last-profile-mode-v10',backend)}catch{}this.loadPending()}
 async refresh(){
 const epoch=this.authEpoch;if(this.account&&this.accountBackend==='device')return true;
 if(!this.remote)return false;
 try{const value=await this.api('me');this.serverAvailable=true;if(epoch!==this.authEpoch)return false;if(value.username){this.accept(value,'server');return true}return false}catch{this.serverAvailable=false;return false}
 }
 setBackend(backend){if(!['device','server'].includes(backend))return;if(this.account&&this.accountBackend!==backend)throw Error('Sign out before changing where the account is saved.');this.accountBackend=backend}
 async passwordHash(password,salt){
 if(!this.crypto?.subtle||!this.crypto?.getRandomValues||typeof TextEncoder==='undefined')throw Error('Protected device profiles need a current Chrome, Edge or Firefox browser. You can also use the running web version.');
 const key=await this.crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bytes=await this.crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:210000},key,256);
 return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
 }
 async sign(action,username,password){
 const epoch=++this.authEpoch,name=String(username||'').trim().toLowerCase();
 if(!/^[a-z0-9_-]{3,20}$/.test(name))throw Error('Username must be 3-20 characters: letters, numbers, _ or -. No spaces.');
 if(typeof password!=='string'||password.length<8||password.length>128)throw Error('Password must have 8-128 characters. Your entries have been kept so you can correct them.');
 if(!['register','login'].includes(action))throw Error('Invalid account action.');
 if(this.accountBackend==='server'){
 if(!this.remote)throw Error('Server accounts need the web version. Choose “This browser / device account” to create a profile in this file.');
 const value=await this.api(action,{username:name,password});if(epoch===this.authEpoch){this.serverAvailable=true;this.accept(value,'server')}return;
 }
 const accounts=this.deviceAccounts();
 if(action==='register'&&Object.hasOwn(accounts,name))throw Error('That device username already exists. Choose SIGN IN or use another username.');
 if(action==='login'&&!Object.hasOwn(accounts,name))throw Error('No device account has that username. Choose CREATE ACCOUNT first, or select the server where you created it.');
 if(action==='register'&&!this.crypto?.getRandomValues)throw Error('This browser cannot protect a device account. Open the game in current Chrome, Edge or Firefox.');
 const salt=action==='register'?Array.from(this.crypto?.getRandomValues?.(new Uint8Array(16))||[]):accounts[name].salt;
 if(!Array.isArray(salt)||salt.length!==16||!salt.every(n=>Number.isInteger(n)&&n>=0&&n<=255))throw Error('The device profile has invalid security data. Use another username.');
 const hash=await this.passwordHash(password,salt);
 if(epoch!==this.authEpoch)return;
 if(action==='login'){
 const expected=accounts[name].hash;let diff=typeof expected==='string'&&expected.length===hash.length?0:1;
 for(let i=0;i<hash.length;i++)diff|=hash.charCodeAt(i)^(expected?.charCodeAt?.(i)||0);
 if(diff)throw Error('Incorrect username or password.');
 }else{
 await profileTransaction(()=>{if(epoch!==this.authEpoch)throw Error('Profile changed. Retry account creation.');const latest=this.deviceAccounts();if(Object.hasOwn(latest,name))throw Error('That username was just created. Choose SIGN IN.');
 Object.defineProperty(latest,name,{value:{salt,hash,progress:cleanProgress(this.progress)},enumerable:true,writable:true,configurable:true});this.saveDevice(latest)});
 }
 const saved=this.deviceAccounts()[name];if(!saved)throw Error('The profile changed in another tab. Please sign in again.');this.accept({username:name,progress:saved.progress},'device');
 try{this.sessionStore?.setItem('dojo-device-session-v7',name);this.storage?.setItem('dojo-remembered-device-v10',this.rememberDevice?name:'')}catch{}
 }
 async logout(){
 this.authEpoch++;if(this.account&&this.accountBackend==='server')await this.api('logout',{});
 try{this.sessionStore?.removeItem('dojo-device-session-v7');this.storage?.setItem('dojo-remembered-device-v10','');this.storage?.setItem('dojo-last-profile-mode-v10','guest')}catch{}
 this.account=null;this.session='guest';try{this.progress=cleanProgress(JSON.parse(this.storage?.getItem('dojo-career-v6')||'null'))}catch{this.progress=freshProgress()}this.loadPending()
 }
 journalKey(){return 'dojo-pending-v9:'+(this.account?this.accountBackend:'device')+':'+(this.account||'guest')}
 loadPending(){
 this.pending=[];this.shopRequests={};
 try{const saved=JSON.parse(this.storage?.getItem(this.journalKey())||'null');
 for(const match of saved?.matches||[]){try{if(!validID(match.id)||!cleanMarket(match.market))continue;const result=completedResult(match.config,match.result?.scores);if(!this.progress.claimed.includes(match.id))this.pending.push({...match,result,market:cleanMarket(match.market)})}catch{}}
 for(const [key,item] of Object.entries(saved?.purchases||{}))if(item&&validID(item.id)&&['upgrade','cosmetic'].includes(item.kind)&&typeof item.key==='string')this.shopRequests[key]=item;
 }catch{}
 }
 savePending(){
 try{if(!this.storage)throw Error();const key=this.journalKey(),existing=JSON.parse(this.storage.getItem(key)||'null');
 const matches=new Map((existing?.matches||[]).map(m=>[m.id,m]));for(const m of this.pending)matches.set(m.id,m);for(const id of this.progress.claimed)matches.delete(id);
 this.pending=[...matches.values()];this.storage.setItem(key,JSON.stringify({matches:this.pending,purchases:this.shopRequests}));this.journalError='';return true;
 }catch{this.storageOK=false;this.journalError='Recovery copy could not be saved. Keep this page open, retry saving, or download a backup.';return false}
 }
 clearPending(id){this.pending=this.pending.filter(match=>match.id!==id);this.savePending()}
 begin(config,market){
 if(!validConfig(config))throw Error('Invalid match settings.');
 config={...config,economyVersion:ECONOMY_VERSION};
 const locked=cleanMarket(market)||makeMarket();
 if(this.account&&this.accountBackend==='server')return this.api('begin-match',{...config,market:locked});
 return {id:newTransactionID('match'),config:{...config},market:locked};
 }
 complete(match,scores){
 const result=completedResult(match?.config,scores);
 if(!validID(match?.id)||!cleanMarket(match?.market))throw Error('Invalid match record.');
 if(match.result&&JSON.stringify(match.result.scores)!==JSON.stringify(result.scores))throw Error('This match already has a different result.');
 match.result=result;
 const snapshot={id:match.id,config:{...match.config},market:cleanMarket(match.market),result};
 if(!this.pending.some(item=>item.id===match.id))this.pending.push(snapshot);const write=profileTransaction(()=>this.savePending());if(write&&typeof write.then==='function')match.pendingWrite=write;
 return result;
 }
 settle(match,won){
 if(match?.pendingWrite)return match.pendingWrite.then(()=>{delete match.pendingWrite;return this.settle(match,won)});
 const result=completedResult(match?.config,match?.result?.scores);
 if(result.won!==won)throw Error('Result does not match the completed score.');
 if(this.account&&this.accountBackend==='server'){
 if(!this.savePending())throw Error(this.journalError);const epoch=this.authEpoch;
 return this.api('finish-match',{id:match.id,won,scores:result.scores}).then(value=>{if(epoch===this.authEpoch){this.progress=cleanProgress(value.progress);this.clearPending(match.id)}return value});
 }
 return this.localMutation(()=>{const outcome=settleProgress(this.progress,match,result.scores);
 if(!outcome.duplicate)this.persist(outcome.progress);
 this.clearPending(match.id);return {...outcome,progress:this.progress}});
 }
 purchase(kind,key,requestID){
 const slot=kind+':'+key,item=this.shopRequests[slot]||{id:requestID||newTransactionID('purchase'),kind,key};
 this.shopRequests[slot]=item;this.savePending();
 const done=value=>{delete this.shopRequests[slot];this.savePending();return value};
 if(this.account&&this.accountBackend==='server'){
 if(!this.savePending())throw Error(this.journalError);const epoch=this.authEpoch;return this.api(kind==='upgrade'?'upgrade':'cosmetic',{key,id:item.id}).then(value=>{if(epoch!==this.authEpoch)throw Error('Profile changed while saving. Sign in to the original profile to check the purchase.');this.progress=cleanProgress(value.progress);return done(value)}).catch(error=>{if(error.status&&error.status<500)done(null);throw error});
 }
 return this.localMutation(()=>{try{const outcome=purchaseProgress(this.progress,kind,key,item.id);if(!outcome.duplicate)this.persist(outcome.progress);return done({...outcome,progress:this.progress})}
 catch(error){if(!error.message.includes('saved'))done(null);throw error}});
 }
 buy(key,id){return this.purchase('upgrade',key,id)}
 buyCosmetic(key,id){return this.purchase('cosmetic',key,id)}
 equipCosmetic(key){
 if(!this.progress.cosmetics.includes(key)||!Object.hasOwn(COSMETICS,key))throw Error('Purchase this outfit before equipping it.');
 if(this.account&&this.accountBackend==='server'){const epoch=this.authEpoch;return this.api('equip',{key}).then(value=>{if(epoch!==this.authEpoch)throw Error('Profile changed while equipping.');this.progress=cleanProgress(value.progress);return value})}
 return this.localMutation(()=>{if(!this.progress.cosmetics.includes(key))throw Error('This profile does not own this outfit.');const next=cleanProgress(this.progress);next.equipped=key;this.persist(next);return {progress:this.progress,message:COSMETICS[key].name+' equipped.'}});
 }
}
