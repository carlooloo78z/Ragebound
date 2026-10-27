export const STYLES = [
 {name:'Kung Fu',description:'Fast recovery / fluid strikes',speed:4.6,reach:85,damage:7,color:'#bfd48c',heavy:'Flowing palm',kind:'strike',recovery:.85},
 {name:'Judo',description:'Close-range throws / guard pressure',speed:3.8,reach:68,damage:9,color:'#ded4b9',heavy:'Hip throw',kind:'throw',recovery:1},
 {name:'Boxing',description:'Quick footwork / evasive heavy',speed:5.1,reach:76,damage:8,color:'#e7ad70',heavy:'Slip & cross',kind:'dodge',recovery:.95},
 {name:'Muay Thai',description:'Long kicks / powerful knees',speed:4,reach:96,damage:9,color:'#bc9b7e',heavy:'Rising knee',kind:'knee',recovery:1.1},
 {name:'Jiu-Jitsu',description:'Takedowns / ground control',speed:3.7,reach:65,damage:8,color:'#9fbbb1',heavy:'Ground lock',kind:'submission',recovery:1}
];
export const MOVES={
 light:{startup:7,active:3,recovery:17,damage:1,reach:1,stun:12,guardDamage:12,label:'Jab'},
 kick:{startup:13,active:4,recovery:24,damage:1.3,reach:1.4,stun:17,guardDamage:20,label:'Kick'},
 heavy:{startup:21,active:5,recovery:32,damage:1.9,reach:1.15,stun:24,guardDamage:30,label:'Heavy'},
 throw:{startup:12,active:3,recovery:34,damage:1.7,reach:.7,stun:33,guardDamage:0,label:'Throw'},
 special:{startup:27,active:6,recovery:43,damage:2.3,reach:1.6,stun:28,guardDamage:39,label:'Special'}
};
// Local authored boxes: style -> move -> animation frame. Supply dx, dy, w, h.
export const FRAME_HITBOXES = Object.fromEntries(STYLES.map(style=>[style.name,Object.fromEntries(Object.keys(MOVES).map(type=>[type,p=>{
 const low=p.attackPosture==='crouching',air=p.attackPosture==='air',reach=style.reach*p.move.reach;
 const kick=type==='kick'||type==='special'&&['nyx','sora','zuri'].includes(p.character.id);
 const height=air?85:low?48:kick?35:50;
 return {dx:8,dy:-(low?50:air?75:kick?78:95),w:reach-8,h:height};
}]))]));

export const CHARACTERS=[
 {id:'kai',name:'Kai',role:'All-rounder',health:100,speed:1,damage:1,guard:100,color:'#45dfb1',bulk:1,description:'Balanced health, movement and power.'},
 {id:'atlas',name:'Atlas',role:'Heavyweight',health:145,speed:.74,damage:1.12,guard:110,color:'#ffb552',bulk:1.24,description:'More health and power. Slow movement.'},
 {id:'nyx',name:'Nyx',role:'Speedster',health:80,speed:1.3,damage:.9,guard:85,color:'#50caff',bulk:.85,description:'Fast footwork and long dashes. Low health and guard.'},
 {id:'rhea',name:'Rhea',role:'Defender',health:120,speed:.86,damage:.95,guard:135,color:'#c587ff',bulk:1.12,description:'Strong guard and extra health. Slower, lighter strikes.'},
 {id:'jin',name:'Jin',role:'Counter specialist',health:95,speed:1.04,damage:.94,guard:120,color:'#ff7c99',bulk:.95,description:'Quick movement and strong guard. Less striking power.'},
 {id:'sora',name:'Sora',role:'Mobile striker',health:90,speed:1.16,damage:.97,guard:92,color:'#ff9c6a',bulk:.92,description:'Fast movement and an advancing kick. Light health and guard.'},
 {id:'bruno',name:'Bruno',role:'Pressure brawler',health:130,speed:.82,damage:1.08,guard:98,color:'#e0685b',bulk:1.18,description:'Durable, heavy punches. Slower feet and average guard.'},
 {id:'mei',name:'Mei',role:'Precision fighter',health:92,speed:1.08,damage:1.04,guard:105,color:'#f2d071',bulk:.9,description:'Quick feet and sharp strikes. Less health to trade with.'},
 {id:'omar',name:'Omar',role:'Guard breaker',health:112,speed:.94,damage:1.02,guard:118,color:'#66c8b7',bulk:1.06,description:'Sturdy defense and close-range pressure. Moderate speed.'},
 {id:'zuri',name:'Zuri',role:'Rushdown striker',health:86,speed:1.18,damage:1.04,guard:86,color:'#ed858f',bulk:.94,description:'Fast, hard-hitting pressure. Fragile health and guard.'},
 {id:'bastion',name:'Bastion',role:'Armoured heavyweight',health:155,speed:.68,damage:1.05,guard:130,color:'#8fafd8',bulk:1.25,description:'Huge health and a sturdy guard. The slowest footwork.'},
 {id:'leila',name:'Leila',role:'Space controller',health:102,speed:1.02,damage:1.03,guard:104,color:'#b4d579',bulk:.97,description:'Balanced movement and power with a strong pushback special.'}
];

export const SPECIALS={
 kai:{name:'Dragon Palm',pose:'palm',color:'#43efba',description:'Long palm strike with strong pushback.',move:{reach:1.65,knockback:38}},
 atlas:{name:'Titan Smash',pose:'hammer',color:'#ffb23e',description:'Slow, close smash with heavy guard damage.',move:{startup:32,recovery:48,reach:1.25,damage:2.6,guardDamage:48,knockback:46}},
 nyx:{name:'Cyclone Kick',pose:'spin',color:'#f16bff',description:'Advancing spin kick; punish its recovery.',move:{startup:22,recovery:40,reach:1.4,damage:2,advance:.65}},
 rhea:{name:'Aegis Burst',pose:'shield',color:'#58cfff',description:'Short burst that creates breathing room.',move:{startup:24,recovery:35,reach:1.25,damage:1.8,knockback:64}},
 jin:{name:'Rising Spiral',pose:'uppercut',color:'#ff725c',description:'Fast, short rising strike with long recovery.',move:{startup:16,recovery:44,reach:1.1,damage:2.1}},
 sora:{name:'Comet Kick',pose:'comet',color:'#ffc18c',description:'Advancing high kick with a deliberate wind-up.',move:{startup:28,active:5,recovery:39,reach:1.35,damage:2.05,guardDamage:36,advance:.35,knockback:35}},
 bruno:{name:'Iron Rush',pose:'rush',color:'#ff8f78',description:'Step-in body blow. Strong pressure but punishable on a miss.',move:{startup:23,active:5,recovery:42,reach:1.2,damage:2.15,guardDamage:34,advance:.9,knockback:44}},
 mei:{name:'Needle Strike',pose:'needle',color:'#ffe58c',description:'A fast, long straight strike with a lighter payoff.',move:{startup:18,active:4,recovery:37,reach:1.55,damage:1.75,guardDamage:24,knockback:24}},
 omar:{name:'Crescent Elbow',pose:'elbow',color:'#94f3d2',description:'Short elbow strike that takes a large bite out of guard.',move:{startup:25,active:5,recovery:40,reach:.95,damage:2.05,guardDamage:56,knockback:30}},
 zuri:{name:'Snap Kick',pose:'snap',color:'#ffb5c6',description:'A quick advancing kick. Short range rewards good spacing.',move:{startup:19,active:4,recovery:36,reach:1.15,damage:1.85,guardDamage:28,advance:.45,knockback:28}},
 bastion:{name:'Shoulder Ram',pose:'ram',color:'#b8d8ff',description:'A slow shoulder charge with heavy guard pressure. Commit carefully.',move:{startup:30,active:5,recovery:47,reach:.9,damage:2.4,guardDamage:52,advance:.55,knockback:54}},
 leila:{name:'Twin Strike',pose:'twin',color:'#d9f6a4',description:'A braced double strike that pushes an opponent back.',move:{startup:20,active:4,recovery:38,reach:1.3,damage:1.85,guardDamage:34,knockback:48}}
};
