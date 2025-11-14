import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as i,a as d}from"./hebcal-service-Bq1V8CQV.js";class s{constructor(){this.selectedDate=new Date,this.init()}async init(){this.setupEventListeners(),this.setDateInput(),await this.loadReadings()}setupEventListeners(){document.getElementById("todayBtn").addEventListener("click",()=>{this.selectedDate=new Date,this.setDateInput(),this.loadReadings()}),document.getElementById("loadReadingsBtn").addEventListener("click",()=>{const e=document.getElementById("readingDate").value;e&&(this.selectedDate=new Date(e),this.loadReadings())}),document.getElementById("readingDate").addEventListener("change",e=>{e.target.value&&(this.selectedDate=new Date(e.target.value),this.loadReadings())})}setDateInput(){const e=document.getElementById("readingDate"),a=this.selectedDate.getFullYear(),n=String(this.selectedDate.getMonth()+1).padStart(2,"0"),t=String(this.selectedDate.getDate()).padStart(2,"0");e.value=`${a}-${n}-${t}`}async loadReadings(){try{document.getElementById("readingsContainer").innerHTML=`
                        <div class="loading">
                            <div class="spinner"></div>
                            Lezingen worden geladen...
                        </div>
                    `,await this.loadHebrewDate();const[e,a]=await Promise.all([this.loadWeeklyReadings(),this.loadSefariaCalendar()]);this.renderReadings(e,a)}catch(e){console.error("Error loading readings:",e),document.getElementById("readingsContainer").innerHTML=`
                        <div class="error">
                            <strong>Fout bij het laden van lezingen:</strong><br>
                            ${e.message}
                        </div>
                    `}}async loadHebrewDate(){try{const e=i(this.selectedDate),a=this.selectedDate.toLocaleDateString("nl-NL",{weekday:"long",year:"numeric",month:"long",day:"numeric"});document.getElementById("hebrewDateDisplay").innerHTML=`
                        <h2>${e.display}</h2>
                        <p>${a}</p>
                    `}catch(e){console.error("Error loading Hebrew date:",e),document.getElementById("hebrewDateDisplay").innerHTML=`
                        <div class="error">Kon Joodse datum niet laden</div>
                    `}}async loadWeeklyReadings(){try{return d(this.selectedDate)}catch(e){return console.error("Error loading weekly readings:",e),null}}async loadSefariaCalendar(){try{const e=this.selectedDate.getFullYear(),a=String(this.selectedDate.getMonth()+1).padStart(2,"0"),n=String(this.selectedDate.getDate()).padStart(2,"0"),t=`${e}-${a}-${n}`,r=await fetch(`https://www.sefaria.org/api/calendars?date=${t}`);if(!r.ok)throw new Error(`Sefaria API error: ${r.status}`);return await r.json()}catch(e){return console.error("Error loading Sefaria calendar:",e),null}}renderReadings(e,a){let n="";e&&(n+=this.renderWeeklyCard(e)),a&&a.calendar_items&&(n+=this.renderDailyReadings(a.calendar_items)),a&&a.calendar_items&&(n+=this.renderYearlyReadings(a.calendar_items)),document.getElementById("readingsContainer").innerHTML=n||`
                    <div class="error">Geen lezingen beschikbaar voor deze datum</div>
                `}renderWeeklyCard(e){return`
                    <div class="reading-card weekly">
                        <h3>🕯️ Wekelijkse Lezingen</h3>
                        <div class="reading-item">
                            <div class="reading-label">Parashat HaShavua (Thora Portie)</div>
                            <div class="reading-text">${e.parashat||"N/A"}</div>
                        </div>
                        <div class="reading-item">
                            <div class="reading-label">Haftarah (Profeten)</div>
                            <div class="reading-text">${e.haftarah||"N/A"}</div>
                        </div>
                        ${e.roshChodesh?`
                            <div class="reading-item">
                                <div class="reading-label">Rosh Chodesh</div>
                                <div class="reading-text">${e.roshChodesh}</div>
                            </div>
                        `:""}
                    </div>
                `}renderDailyReadings(e){const a=e.filter(t=>["Daf Yomi","Daily Mishnah","Daily Rambam","Chok LeYisrael"].includes(t.title.en));if(a.length===0)return"";let n=`
                    <div class="reading-card daily">
                        <h3>📖 Dagelijkse Studie</h3>
                `;return a.forEach(t=>{n+=`
                        <div class="reading-item">
                            <div class="reading-label">${t.title.en}</div>
                            <div class="reading-text">${t.displayValue.en}</div>
                            ${t.url?`<a href="https://www.sefaria.org${t.url}" target="_blank" class="reading-link">Lees op Sefaria →</a>`:""}
                        </div>
                    `}),n+="</div>",n}renderYearlyReadings(e){const a=e.filter(t=>["929","Tanakh Yomi","Nach Yomi","Psalms","Pirkei Avot"].includes(t.title.en));if(a.length===0)return"";let n=`
                    <div class="reading-card yearly">
                        <h3>📅 Jaarlijkse Cyclussen</h3>
                `;return a.forEach(t=>{n+=`
                        <div class="reading-item">
                            <div class="reading-label">${t.title.en}</div>
                            <div class="reading-text">${t.displayValue.en}</div>
                            ${t.url?`<a href="https://www.sefaria.org${t.url}" target="_blank" class="reading-link">Lees op Sefaria →</a>`:""}
                        </div>
                    `}),n+="</div>",n}}document.addEventListener("DOMContentLoaded",()=>{new s});
