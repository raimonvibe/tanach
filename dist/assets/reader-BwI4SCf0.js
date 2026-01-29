import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as v,g as b,b as f}from"./books-service-vJX1l1bK.js";let r=null,i=1,g=null,u=[],h=!1;async function y(){const e=new URLSearchParams(window.location.search),t=e.get("book"),o=e.get("category"),s=e.get("chapter"),n=e.get("verse");t&&o?(await p(t,o),s&&(i=parseInt(s),await d(i),n&&setTimeout(()=>{const a=document.querySelector(`[data-verse="${n}"]`);a&&(a.scrollIntoView({behavior:"smooth"}),a.style.backgroundColor="#fff3cd")},500))):await w()}async function w(){try{u=await b();const e=document.getElementById("bookSelector");e.innerHTML='<option value="">Selecteer boek...</option>';const t=["torah","neviim","ketuvim"],o={torah:"Torah",neviim:"Neviim",ketuvim:"Ketuvim"};t.forEach(s=>{const n=u.filter(a=>a.category===s);if(n.length>0){const a=document.createElement("optgroup");a.label=o[s],n.forEach(l=>{const c=document.createElement("option");c.value=`${l.id}|${s}`,c.textContent=l.name,a.appendChild(c)}),e.appendChild(a)}})}catch(e){console.error("Error loading books:",e)}}async function p(e,t){try{r=await v(t,e),g=t,document.getElementById("bookTitle").textContent=r.name,document.getElementById("bookInfo").innerHTML=`
                    <div class="book-title">${r.name}</div>
                    <div class="book-meta">
                        ${r.description||""} • ${r.chapters.length} hoofdstukken
                    </div>
                `;const o=document.getElementById("chapterButtons");o.innerHTML="";for(let s=1;s<=r.chapters.length;s++){const n=document.createElement("button");n.className="chapter-btn",n.textContent=s,n.onclick=()=>d(s),o.appendChild(n)}document.getElementById("chapterNav").style.display="block",document.getElementById("contentArea").style.display="block",await d(1)}catch(o){document.getElementById("bookInfo").innerHTML=`
                    <div class="error">Kon boek niet laden: ${o.message}</div>
                `}}async function d(e){if(r)try{const t=await f(g,r.id,e);i=e,document.querySelectorAll(".chapter-btn").forEach(o=>{o.classList.remove("active"),parseInt(o.textContent)===e&&o.classList.add("active")}),document.getElementById("prevChapter").disabled=e<=1,document.getElementById("nextChapter").disabled=e>=r.chapters.length,E(t.chapter.verses)}catch(t){console.error("Error loading chapter:",t)}}function E(e){const t=document.getElementById("hebrewVerses"),o=document.getElementById("englishVerses"),s=document.getElementById("bothVerses");t.innerHTML="",o.innerHTML="",s.innerHTML="",e.forEach(n=>{const a=h?"":"hidden",l=document.createElement("div");l.className="verse",l.setAttribute("data-verse",n.verse),l.innerHTML=`
                    <span class="verse-number ${a}">${n.verse}</span>
                    <span class="hebrew-text">${n.translations.hebrew}</span>
                `,t.appendChild(l);const c=document.createElement("div");c.className="verse",c.setAttribute("data-verse",n.verse),c.innerHTML=`
                    <span class="verse-number ${a}">${n.verse}</span>
                    <span class="english-text">${n.translations.english}</span>
                `,o.appendChild(c);const m=document.createElement("div");m.className="verse",m.setAttribute("data-verse",n.verse),m.innerHTML=`
                    <div style="margin-bottom: 10px;">
                        <span class="verse-number ${a}">${n.verse}</span>
                        <span class="hebrew-text">${n.translations.hebrew}</span>
                    </div>
                    <div>
                        <span class="english-text">${n.translations.english}</span>
                    </div>
                `,s.appendChild(m)})}function k(e){document.querySelectorAll(".tab").forEach(t=>{t.classList.remove("active")}),event.target.classList.add("active"),document.querySelectorAll(".tab-content").forEach(t=>{t.classList.remove("active")}),document.getElementById(`${e}-content`).classList.add("active")}function B(e){const t=i+e;t>=1&&t<=r.chapters.length&&d(t)}function C(){const t=document.getElementById("bookSelector").value;if(t){const[o,s]=t.split("|");p(o,s)}}function I(){h=!h;const e=document.getElementById("verseNumbersToggle");h?(e.textContent="Verberg versnummers",e.classList.add("active")):(e.textContent="Toon versnummers",e.classList.remove("active")),r&&d(i)}window.switchTab=k;window.changeChapter=B;window.changeBook=C;window.toggleVerseNumbers=I;y();
