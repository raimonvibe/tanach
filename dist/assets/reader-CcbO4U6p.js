import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as u,b as g,g as v}from"./books-service-vJX1l1bK.js";let r=null,d=1,p=null,h=[];async function b(){const t=new URLSearchParams(window.location.search),o=t.get("book"),n=t.get("category"),s=t.get("chapter"),e=t.get("verse");o&&n?(await f(o,n),s&&(d=parseInt(s),await m(d),e&&setTimeout(()=>{const a=document.querySelector(`[data-verse="${e}"]`);a&&(a.scrollIntoView({behavior:"smooth"}),a.style.backgroundColor="#fff3cd")},500))):await y()}async function y(){try{h=await v();const t=document.getElementById("bookSelector");t.innerHTML='<option value="">Selecteer boek...</option>';const o=["torah","neviim","ketuvim"],n={torah:"Torah",neviim:"Neviim",ketuvim:"Ketuvim"};o.forEach(s=>{const e=h.filter(a=>a.category===s);if(e.length>0){const a=document.createElement("optgroup");a.label=n[s],e.forEach(l=>{const c=document.createElement("option");c.value=`${l.id}|${s}`,c.textContent=l.name,a.appendChild(c)}),t.appendChild(a)}})}catch(t){console.error("Error loading books:",t)}}async function f(t,o){try{r=await u(o,t),p=o,document.getElementById("bookTitle").textContent=r.name,document.getElementById("bookInfo").innerHTML=`
                    <div class="book-title">${r.name}</div>
                    <div class="book-meta">
                        ${r.description||""} • ${r.chapters.length} hoofdstukken
                    </div>
                `;const n=document.getElementById("chapterButtons");n.innerHTML="";for(let s=1;s<=r.chapters.length;s++){const e=document.createElement("button");e.className="chapter-btn",e.textContent=s,e.onclick=()=>m(s),n.appendChild(e)}document.getElementById("chapterNav").style.display="block",document.getElementById("contentArea").style.display="block",await m(1)}catch(n){document.getElementById("bookInfo").innerHTML=`
                    <div class="error">Kon boek niet laden: ${n.message}</div>
                `}}async function m(t){if(r)try{const o=await g(p,r.id,t);d=t,document.querySelectorAll(".chapter-btn").forEach(n=>{n.classList.remove("active"),parseInt(n.textContent)===t&&n.classList.add("active")}),document.getElementById("prevChapter").disabled=t<=1,document.getElementById("nextChapter").disabled=t>=r.chapters.length,k(o.chapter.verses)}catch(o){console.error("Error loading chapter:",o)}}function k(t){const o=document.getElementById("hebrewVerses"),n=document.getElementById("englishVerses"),s=document.getElementById("bothVerses");o.innerHTML="",n.innerHTML="",s.innerHTML="",t.forEach(e=>{const a="hidden",l=document.createElement("div");l.className="verse",l.setAttribute("data-verse",e.verse),l.innerHTML=`
                    <span class="verse-number ${a}">${e.verse}</span>
                    <span class="hebrew-text">${e.translations.hebrew}</span>
                `,o.appendChild(l);const c=document.createElement("div");c.className="verse",c.setAttribute("data-verse",e.verse),c.innerHTML=`
                    <span class="verse-number ${a}">${e.verse}</span>
                    <span class="english-text">${e.translations.english}</span>
                `,n.appendChild(c);const i=document.createElement("div");i.className="verse",i.setAttribute("data-verse",e.verse),i.innerHTML=`
                    <div style="margin-bottom: 10px;">
                        <span class="verse-number ${a}">${e.verse}</span>
                        <span class="hebrew-text">${e.translations.hebrew}</span>
                    </div>
                    <div>
                        <span class="english-text">${e.translations.english}</span>
                    </div>
                `,s.appendChild(i)})}b();
