import"./modulepreload-polyfill-B5Qt9EMX.js";import{s as h,g as l}from"./books-service-vJX1l1bK.js";async function m(){try{const e=await l(),t=e.length,n=e.reduce((i,a)=>i+a.chapters.length,0),o=e.reduce((i,a)=>i+a.chapters.reduce((s,r)=>s+r.verses.length,0),0);document.getElementById("stats").innerHTML=`
                    <h3>📊 Tanach Statistieken</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${t}</div>
                            <div class="stat-label">Boeken</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${n}</div>
                            <div class="stat-label">Hoofdstukken</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${o.toLocaleString()}</div>
                            <div class="stat-label">Verzen</div>
                        </div>
                    </div>
                `}catch(e){document.getElementById("stats").innerHTML=`
                    <div class="error">Kon statistieken niet laden: ${e.message}</div>
                `}}async function v(){try{const e=await l(),t={torah:{name:"Torah (De Vijf Boeken van Mozes)",description:"De eerste vijf boeken van de Tanach",books:[]},neviim:{name:"Nevi'im (De Profeten)",description:"De historische en profetische boeken",books:[]},trei_asara:{name:"Trei Asar (De Twaalf Kleine Profeten)",description:"De twaalf kleine profeten",books:[]},ketuvim:{name:"Ketuvim (De Geschriften)",description:"De wijsheid, poëzie en historische boeken",books:[]}};e.forEach(o=>{t[o.category]&&t[o.category].books.push({id:o.id,name:o.name,chapters:o.chapters.length})});let n="";for(const[o,i]of Object.entries(t))i.books.length>0&&(n+=`
                            <div class="category">
                                <h3>${i.name}</h3>
                                <p>${i.description}</p>
                                <ul class="books-list">
                                    ${i.books.map(a=>`
                                        <li>
                                            <a href="/reader.html?book=${a.id}&category=${o}">
                                                ${a.name} (${a.chapters} hoofdstukken)
                                            </a>
                                        </li>
                                    `).join("")}
                                </ul>
                            </div>
                        `);document.getElementById("categories").innerHTML=n}catch(e){document.getElementById("categories").innerHTML=`
                    <div class="error">Kon boeken niet laden: ${e.message}</div>
                `}}function c(e,t){if(!t)return e;const n=new RegExp(`(${t})`,"gi");return e.replace(n,'<span class="highlight">$1</span>')}function g(){const e=document.getElementById("searchResults");e.innerHTML=`
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: #666;">Aan het zoeken...</p>
                </div>
            `}function p(e,t){const n=document.getElementById("searchResults");if(e.length===0){n.innerHTML=`
                    <div class="search-message error">
                        <h3>❌ Geen resultaten gevonden</h3>
                        <p>We konden geen verzen vinden die overeenkomen met "${t}".</p>
                        <p style="margin-top: 10px; font-size: 0.9rem;">Tip: Probeer verschillende spellingen of kortere zoektermen.</p>
                    </div>
                `;return}const o=e.slice(0,100),i=e.length>100;let a=`
                <div class="results-count">
                    ✅ ${e.length}${e.length>=500?"+":""} resultaten gevonden voor "${t}"
                    ${i?'<br><small style="color: #999;">(Eerste 100 worden weergegeven)</small>':""}
                    ${e.length>=500?'<br><small style="color: #999;">⚠️ Maximaal 500 resultaten - verfijn je zoekopdracht voor meer specifieke resultaten</small>':""}
                </div>
            `;o.forEach(s=>{const r=c(s.text.hebrew,t),d=c(s.text.english,t);a+=`
                    <div class="result-item" onclick="goToVerse('${s.book.id}', '${s.book.category}', ${s.chapter}, ${s.verse})">
                        <div class="result-header">
                            <span class="result-book">${s.book.name}</span>
                            <span class="result-location">Hoofdstuk ${s.chapter}, Vers ${s.verse}</span>
                        </div>
                        <div class="result-text">
                            <div class="result-hebrew">${r}</div>
                            <div class="result-english">${d}</div>
                        </div>
                    </div>
                `}),n.innerHTML=a,n.scrollIntoView({behavior:"smooth",block:"nearest"})}function u(e,t,n,o){window.location.href=`/reader.html?book=${e}&category=${t}&chapter=${n}&verse=${o}`}document.getElementById("searchForm").addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("searchInput").value.trim(),n=document.getElementById("searchBtn"),o=document.getElementById("searchResults");if(!t){o.innerHTML=`
                    <div class="search-message info">
                        <p>💡 Voer een zoekterm in om te beginnen met zoeken.</p>
                    </div>
                `;return}try{n.disabled=!0,n.textContent="Zoeken...",g();const a=(await h(t)).map(s=>({book:{id:s.bookId,name:s.book,category:s.category},chapter:s.chapter,verse:s.verse,text:{hebrew:s.hebrew,english:s.english}}));p(a,t)}catch(i){const a=document.getElementById("searchResults");a.innerHTML=`
                    <div class="search-message error">
                        <h3>⚠️ Er is een fout opgetreden</h3>
                        <p>${i.message}</p>
                        <p style="margin-top: 10px; font-size: 0.9rem;">Probeer het opnieuw of neem contact op als het probleem aanhoudt.</p>
                    </div>
                `}finally{n.disabled=!1,n.textContent="Zoeken"}});window.goToVerse=u;m();v();
