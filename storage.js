// All browser profile mutations share one origin-wide lock, including the
// device-account directory. Read the latest save inside the critical section.
export function profileTransaction(task) {
 if (typeof document==='undefined') return task();
 if (globalThis.navigator?.locks?.request) {
  let entered=false;
  return navigator.locks.request('dojo-profile-write',()=>{entered=true;return task()}).catch(error=>{
   // Some file/private contexts expose the API but deny acquiring a lock.
   // Never retry a task that has already entered its critical section.
   if(!entered&&error.name==='SecurityError')return indexedTransaction(task);
   throw error;
  });
 }
 return indexedTransaction(task);
}
function indexedTransaction(task){
 if (globalThis.indexedDB) return new Promise((resolve, reject) => {
  const open = indexedDB.open('dojo-write-lock', 1);
  open.onupgradeneeded = () => open.result.createObjectStore('lock');
  open.onerror = () => reject(Error('Cannot open save protection. Close other game tabs and retry.'));
  open.onsuccess = () => {
   const db = open.result, tx = db.transaction('lock', 'readwrite'); let result;
   tx.objectStore('lock').get('profile').onsuccess = () => {
    try { result = task(); } catch (error) { reject(error); tx.abort(); }
   };
   tx.oncomplete = () => { db.close(); resolve(result); };
   tx.onabort = tx.onerror = () => { db.close(); reject(Error('Save transaction interrupted. Please retry.')); };
  };
 });
 // Headless module tests have no browser storage concurrency.
 if (!globalThis.navigator) return task();
 throw Error('This browser cannot protect simultaneous saves here. Open START-DOJO.cmd and import your backup to continue saving.');
}
