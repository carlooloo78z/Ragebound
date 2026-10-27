export class Interface {
 constructor($){this.$=$;this.previous=null;this.lastValues=new Map();this.pendingConfirm=null;
  $('confirm-yes').onclick=()=>this.finishConfirm(true);$('confirm-no').onclick=()=>this.finishConfirm(false);
  globalThis.window?.addEventListener('keydown',e=>{
   const dialog=!$('confirm-dialog').hidden?$('confirm-dialog'):!$('guide').hidden?$('guide'):!$('settings-dialog').hidden?$('settings-dialog'):null;
   if(!dialog)return;
   if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation?.();if(dialog===$('confirm-dialog'))this.finishConfirm(false);else this.close(dialog);return}
   if(e.code==='Tab')this.trap(dialog,e);
  });
 }
 text(id,value){const key=String(value);if(this.lastValues.get(id)===key)return;this.lastValues.set(id,key);this.$(id).textContent=key}
 focus(panel){const target=[...(panel.querySelectorAll?.('button:not(:disabled),select,input,[tabindex="0"]')||[])].find(node=>!node.hidden&&!node.closest?.('[hidden]'));target?.focus?.({preventScroll:true})}
 open(panel){this.previous=globalThis.document?.activeElement;panel.hidden=false;this.focus(panel)}
 close(panel){panel.hidden=true;this.onClose?.(panel);this.previous?.focus?.({preventScroll:true})}
 trap(panel,event){const nodes=[...(panel.querySelectorAll?.('button:not(:disabled),select,input,a[href],[tabindex="0"]')||[])].filter(n=>!n.hidden);if(!nodes.length)return;const current=globalThis.document?.activeElement,index=nodes.indexOf(current);if(event.shiftKey&&index<=0){event.preventDefault();nodes.at(-1).focus()}else if(!event.shiftKey&&(index===nodes.length-1||index<0)){event.preventDefault();nodes[0].focus()}}
 confirm(message){if(this.pendingConfirm)return Promise.resolve(false);this.$('confirm-message').textContent=message;this.open(this.$('confirm-dialog'));return new Promise(resolve=>this.pendingConfirm=resolve)}
 finishConfirm(value){const resolve=this.pendingConfirm;this.pendingConfirm=null;this.close(this.$('confirm-dialog'));resolve?.(value)}
}
