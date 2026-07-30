(function(global){
'use strict';
const DATA={
fluid:{on:['l','m','n','r','s','v','y','zh','th','sh','ael','eir'],nu:['a','e','i','o','u','ae','ai','ei','ia','io','oa','uu','y'],co:['l','m','n','r','s','th','v','x','ll','ria','nen']},
harsh:{on:['k','kr','q','qr','g','gr','t','tr','dr','vr','z','zh','sk','x','kh','rk'],nu:['a','o','u','aa','au','oa','ui'],co:['k','q','g','t','th','r','z','x','kh','rk','kt','zz']},
click:{on:['k','q','x','n','t','z','ǀ','ǁ','ǂ','ǃ'],nu:['a','e','i','o','u','aa','ae','ui'],co:['k','q','x','n','t','z','ǀ','ǁ','ǂ','ǃ','nk']},
synthetic:{on:['v','x','z','q','k','d','t','n','syn','cy','ae','io'],nu:['a','e','i','o','u','y','ae','io','ai'],co:['x','z','q','k','n','m','t','v','ix','on','um']},
ancient:{on:['a','b','d','g','h','k','m','n','r','s','t','th','kh','ph','zh'],nu:['a','e','i','o','u','ae','ia','oa','uu'],co:['m','n','r','s','th','k','d','l','sh','mon','var']},
ethereal:{on:['ae','ei','iy','l','m','n','r','s','sh','v','wh','y','zh'],nu:['a','e','i','o','u','ae','ai','ea','ei','ia','ie','io','oe','ui','yy'],co:['l','m','n','r','s','sh','v','th','iel','yne']},
compact:{on:['b','d','g','k','m','n','q','r','t','v','x','z','kr','zh'],nu:['a','e','i','o','u','y'],co:['k','m','n','q','r','t','x','z']}
};
const ACCENTS={a:['á','à','â','ä','ã','å','ā'],e:['é','è','ê','ë','ē'],i:['í','ì','î','ï','ī'],o:['ó','ò','ô','ö','õ','ō'],u:['ú','ù','û','ü','ū'],y:['ý','ÿ']};
function hash(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function pick(a,r){return a[Math.floor(r()*a.length)]}
function accent(s,r,enabled){if(!enabled||r()>.24)return s;const chars=[...s],idx=[];chars.forEach((c,i)=>{if(ACCENTS[c.toLowerCase()])idx.push(i)});if(!idx.length)return s;const i=pick(idx,r),base=chars[i].toLowerCase(),rep=pick(ACCENTS[base],r);chars[i]=chars[i]===chars[i].toUpperCase()?rep.toUpperCase():rep;return chars.join('')}
function titleParts(s){return s.split(/([ '\-’ʔ])/).map(x=>/^[\p{L}ǀǁǂǃ]/u.test(x)?x.charAt(0).toUpperCase()+x.slice(1):x).join('')}
function build(opts){
 const seed=hash((opts.seed||Date.now()+':'+Math.random())+':'+(opts.roll||0)),r=rng(seed);
 const family=opts.family==='mixed'?pick(Object.keys(DATA),r):(DATA[opts.family]?opts.family:'fluid'),f=DATA[family];
 const len=opts.length||'mixed'; let syllables=len==='short'?1+Math.floor(r()*2):len==='medium'?2+Math.floor(r()*2):len==='long'?4+Math.floor(r()*2):1+Math.floor(r()*5);
 let s=''; for(let i=0;i<syllables;i++){s+=pick(f.on,r)+pick(f.nu,r);if(i===syllables-1&&r()<.72)s+=pick(f.co,r)}
 if(opts.allowApostrophes&&r()<.20&&s.length>5){const p=2+Math.floor(r()*(s.length-4));s=s.slice(0,p)+pick(["'",'’','ʔ'],r)+s.slice(p)}
 if(opts.allowHyphens&&r()<.17&&s.length>7){const p=3+Math.floor(r()*(s.length-5));s=s.slice(0,p)+'-'+s.slice(p)}
 if(opts.allowSpaces&&r()<.12&&s.length>8){const p=3+Math.floor(r()*(s.length-5));s=s.slice(0,p)+' '+s.slice(p)}
 if(!opts.allowClicks)s=s.replace(/[ǀǁǂǃ]/g,()=>pick(['k','q','x','t'],r));
 if(!opts.allowApostrophes)s=s.replace(/[’'ʔ]/g,''); if(!opts.allowHyphens)s=s.replace(/-/g,''); if(!opts.allowSpaces)s=s.replace(/ /g,'');
 s=s.replace(/([\p{L}])\1\1/gu,'$1$1').replace(/\s+/g,' ').trim(); s=accent(s,r,opts.allowAccents); return titleParts(s);
}
global.AlienNameGenerator={generate:build};
})(window);
