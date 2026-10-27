export function createMenuUI({$,ui,go,play,restart,openMenu}){
 const routes={'title-start':'setup','setup-back':'title','setup-next':'fighters','fighters-back':'setup','fighters-next':'versus','versus-back':'fighters'};
 for(const [id,screen] of Object.entries(routes))$(id).onclick=()=>go(screen);
 $('rematch').onclick=()=>{restart();play()};$('change-fighters').onclick=()=>openMenu('fighters');
 function show(name){
  for(const slide of ['title','setup','fighters','versus','career','market'])$('slide-'+slide).hidden=slide!==name;
  $('slide-progress').textContent=name==='title'?'RAGEBOUND / ARCADE FIGHTING':name==='career'?'PROFILE / COINS / UPGRADES':name==='market'?'COSMETIC MARKET / COLLECTION':'01 MATCH SETUP / 02 FIGHTER SELECT / 03 VERSUS';
  $('menu').dataset.screen=name;ui.focus($('slide-'+name));
 }
 return {show};
}
