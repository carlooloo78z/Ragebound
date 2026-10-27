import {COSMETICS,cosmeticAccess,cosmeticStats} from './career.js';
export function createMarketUI({$,career,players,renderer,ui,preferences,sound,isBusy,setBusy,onChange,renderAll,updateGoal}){
 let filter='all',sort='price',preview=career.progress.equipped;
 const rarities=['Starter','Common','Rare','Epic','Legendary','Mythic'];
 const distance=key=>{const access=cosmeticAccess(career.progress,key);return access.requirements.reduce((sum,r)=>sum+Math.max(0,1-r.current/r.needed),0)+Math.max(0,1-career.progress.coins/(COSMETICS[key].price||1))};
 function inspect(key){preview=key;renderPreview()}
 function renderPreview(){
  if(!COSMETICS[preview])preview='default';const item=COSMETICS[preview],access=cosmeticAccess(career.progress,preview),owned=access.owned,equipped=career.progress.equipped===preview;
  renderer.portrait($('outfit-preview'),{...players[0],outfitDesign:item,outfitColor:item.color});
  $('preview-name').textContent=item.name+' / '+item.rarity.toUpperCase();$('preview-description').textContent=item.description;
  $('preview-price').textContent=owned?'PERMANENTLY OWNED':item.price.toLocaleString('en-GB')+' COINS / '+Math.max(0,item.price-career.progress.coins).toLocaleString('en-GB')+' MORE TO SAVE';
  $('preview-requirements').replaceChildren(...access.requirements.map(r=>{const row=document.createElement('label');row.textContent=r.label+': '+r.current+' / '+r.needed;const meter=document.createElement('progress');meter.max=r.needed;meter.value=Math.min(r.needed,r.current);meter.setAttribute?.('aria-label',r.label);row.appendChild?.(meter);return row}));
  $('preview-buy').textContent=equipped?'EQUIPPED':owned?'EQUIP FREE':!access.eligible?'VICTORY REQUIREMENTS LOCKED':career.progress.coins<item.price?'SAVE MORE COINS':'BUY & EQUIP';
  $('preview-buy').disabled=isBusy()||equipped||!owned&&(!access.eligible||career.progress.coins<item.price);
  $('preview-pin').disabled=owned;$('preview-pin').textContent=preferences.value.pinned===preview?'GOAL PINNED':'PIN AS NEXT GOAL';
 }
 async function purchase(){
  if(isBusy())return;const key=preview,item=COSMETICS[key],access=cosmeticAccess(career.progress,key);
  if(!access.owned&&(!access.eligible||career.progress.coins<item.price)){$('market-feedback').textContent=!access.eligible?'Unlock requirements not met. '+access.missing.join(' / '):'You cannot afford this outfit.';return}
  setBusy(true);renderAll();
  try{
   if(!access.owned&&item.price>=10000&&!await ui.confirm('Buy '+item.name+' for '+item.price.toLocaleString('en-GB')+' coins? Your remaining balance will be '+(career.progress.coins-item.price).toLocaleString('en-GB')+'.'))return;
   const outcome=await(access.owned?career.equipCosmetic(key):career.buyCosmetic(key));onChange();sound.cue('buy');$('market-feedback').textContent=outcome.message||'Outfit equipped.';$('shop-message').textContent=$('market-feedback').textContent;
  }catch(error){$('market-feedback').textContent=error.message}
  finally{setBusy(false);renderAll()}
 }
 function render(){
  const progress=career.progress,stats=cosmeticStats(progress);$('shop-balance').textContent=progress.coins+' COINS';$('market-coins').textContent=progress.coins+' COINS';
  $('market-achievements').textContent='WINS '+stats.wins+' / LEVEL 4-5 WINS '+stats.hardWins+' / CHAMPION WINS '+stats.championWins+' / BEST-OF-7 WINS '+stats.longWins+' / OWNED '+progress.cosmetics.length+' OF '+Object.keys(COSMETICS).length;
  const entries=Object.entries(COSMETICS).filter(([key,item])=>filter==='all'||filter==='owned'&&progress.cosmetics.includes(key)||filter==='unlocked'&&cosmeticAccess(progress,key).eligible||item.rarity.toLowerCase()===filter);
  entries.sort(([a,x],[b,y])=>sort==='rarity'?rarities.indexOf(y.rarity)-rarities.indexOf(x.rarity)||x.price-y.price:sort==='closest'?distance(a)-distance(b)||x.price-y.price:x.price-y.price);
  $('market-empty').hidden=entries.length>0;
  $('cosmetic-cards').replaceChildren(...entries.map(([key,item])=>{
   const access=cosmeticAccess(progress,key),owned=access.owned,button=document.createElement('button');button.className='upgrade-card rarity-'+item.rarity.toLowerCase();button.disabled=isBusy();button.setAttribute?.('aria-label',item.name+', '+(owned?'owned':item.price+' coins')+'. Preview outfit and requirements.');
   const canvas=document.createElement('canvas');canvas.width=300;canvas.height=360;canvas.className='market-miniature';canvas.setAttribute?.('aria-hidden','true');renderer.portrait(canvas,{...players[0],outfitDesign:item,outfitColor:item.color});
   button.innerHTML='<span class="rarity-label">'+item.rarity.toUpperCase()+'</span><b>'+item.name+'</b><small>'+item.description+'</small><span>'+(owned?'OWNED':item.price.toLocaleString('en-GB')+' COINS')+'</span><small class="unlock-requirements">'+(owned?'Permanently owned':access.missing.length?access.missing.join('<br>'):'VICTORY REQUIREMENTS COMPLETE')+'</small><em>'+(progress.equipped===key?'EQUIPPED / PREVIEW':!access.eligible?'LOCKED / VIEW GOAL':'TRY ON / DETAILS')+'</em>';
   button.prepend?.(canvas);button.onclick=()=>{inspect(key);$('outfit-preview').scrollIntoView?.({behavior:preferences.value.reducedMotion?'instant':'smooth',block:'nearest'})};return button;
  }));
  renderPreview();updateGoal();
 }
 $('market-filter').onchange=e=>{filter=e.target.value;render()};$('market-sort').onchange=e=>{sort=e.target.value;render()};$('preview-buy').onclick=purchase;
 $('preview-pin').onclick=()=>{preferences.set('pinned',preview);updateGoal();renderPreview();$('market-feedback').textContent=COSMETICS[preview].name+' is your next goal.'};
 return {render,inspect};
}
