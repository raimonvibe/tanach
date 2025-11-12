import"./modulepreload-polyfill-B5Qt9EMX.js";import{s as h,g as l}from"./books-service-vJX1l1bK.js";async function m(){try{const e=await l(),s=e.length,n=e.reduce((i,o)=>i+o.chapters.length,0),a=e.reduce((i,o)=>i+o.chapters.reduce((t,r)=>t+r.verses.length,0),0);document.getElementById("stats").innerHTML=`
                    <h3>📊 Tanach Statistieken</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${s}</div>
                            <div class="stat-label">Boeken</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${n}</div>
                            <div class="stat-label">Hoofdstukken</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${a.toLocaleString()}</div>
                            <div class="stat-label">Verzen</div>
                        </div>
                    </div>
                `}catch(e){document.getElementById("stats").innerHTML=`
                    <div class="error">Kon statistieken niet laden: ${e.message}</div>
                `}}async function v(){try{const e=await l(),s={torah:{name:"Torah (De Vijf Boeken van Mozes)",description:"De eerste vijf boeken van de Tanach",books:[]},neviim:{name:"Nevi'im (De Profeten)",description:"De historische en profetische boeken",books:[]},trei_asara:{name:"Trei Asar (De Twaalf Kleine Profeten)",description:"De twaalf kleine profeten",books:[]},ketuvim:{name:"Ketuvim (De Geschriften)",description:"De wijsheid, poëzie en historische boeken",books:[]}};e.forEach(a=>{s[a.category]&&s[a.category].books.push({id:a.id,name:a.name,chapters:a.chapters.length})});let n="";for(const[a,i]of Object.entries(s))i.books.length>0&&(n+=`
                            <div class="category">
                                <h3>${i.name}</h3>
                                <p>${i.description}</p>
                                <ul class="books-list">
                                    ${i.books.map(o=>`
                                        <li>
                                            <a href="/reader.html?book=${o.id}&category=${a}">
                                                ${o.name} (${o.chapters} hoofdstukken)
                                            </a>
                                        </li>
                                    `).join("")}
                                </ul>
                            </div>
                        `);document.getElementById("categories").innerHTML=n}catch(e){document.getElementById("categories").innerHTML=`
                    <div class="error">Kon boeken niet laden: ${e.message}</div>
                `}}function c(e,s){if(!s)return e;const n=new RegExp(`(${s})`,"gi");return e.replace(n,'<span class="highlight">$1</span>')}function g(){const e=document.getElementById("searchResults");e.innerHTML=`
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: #666;">Aan het zoeken...</p>
                </div>
            `}function p(e,s){const n=document.getElementById("searchResults");if(e.length===0){n.innerHTML=`
                    <div class="search-message error">
                        <h3>❌ Geen resultaten gevonden</h3>
                        <p>We konden geen verzen vinden die overeenkomen met "${s}".</p>
                        <p style="margin-top: 10px; font-size: 0.9rem;">Tip: Probeer verschillende spellingen of kortere zoektermen.</p>
                    </div>
                `;return}const a=e.slice(0,100),i=e.length>100;let o=`
                <div class="results-count">
                    ✅ ${e.length}${e.length>=500?"+":""} resultaten gevonden voor "${s}"
                    ${i?'<br><small style="color: #999;">(Eerste 100 worden weergegeven)</small>':""}
                    ${e.length>=500?'<br><small style="color: #999;">⚠️ Maximaal 500 resultaten - verfijn je zoekopdracht voor meer specifieke resultaten</small>':""}
                </div>
            `;a.forEach(t=>{const r=c(t.text.hebrew,s),d=c(t.text.english,s);o+=`
                    <div class="result-item" onclick="goToVerse('${t.book.id}', '${t.book.category}', ${t.chapter}, ${t.verse})">
                        <div class="result-header">
                            <span class="result-book">${t.book.name}</span>
                            <span class="result-location">Hoofdstuk ${t.chapter}, Vers ${t.verse}</span>
                        </div>
                        <div class="result-text">
                            <div class="result-hebrew">${r}</div>
                            <div class="result-english">${d}</div>
                        </div>
                    </div>
                `}),n.innerHTML=o,n.scrollIntoView({behavior:"smooth",block:"nearest"})}document.getElementById("searchForm").addEventListener("submit",async e=>{e.preventDefault();const s=document.getElementById("searchInput").value.trim(),n=document.getElementById("searchBtn"),a=document.getElementById("searchResults");if(!s){a.innerHTML=`
                    <div class="search-message info">
                        <p>💡 Voer een zoekterm in om te beginnen met zoeken.</p>
                    </div>
                `;return}try{n.disabled=!0,n.textContent="Zoeken...",g();const o=(await h(s)).map(t=>({book:{id:t.bookId,name:t.book,category:t.category},chapter:t.chapter,verse:t.verse,text:{hebrew:t.hebrew,english:t.english}}));p(o,s)}catch(i){const o=document.getElementById("searchResults");o.innerHTML=`
                    <div class="search-message error">
                        <h3>⚠️ Er is een fout opgetreden</h3>
                        <p>${i.message}</p>
                        <p style="margin-top: 10px; font-size: 0.9rem;">Probeer het opnieuw of neem contact op als het probleem aanhoudt.</p>
                    </div>
                `}finally{n.disabled=!1,n.textContent="Zoeken"}});m();v();
