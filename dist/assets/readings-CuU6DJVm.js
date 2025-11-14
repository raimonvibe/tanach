import"./modulepreload-polyfill-B5Qt9EMX.js";import{c as o,a as l}from"./hebcal-service-Bq1V8CQV.js";const c={Genesis:{id:"bereshit",category:"torah",name:"Genesis"},Exodus:{id:"shemot",category:"torah",name:"Exodus"},Leviticus:{id:"vayikra",category:"torah",name:"Leviticus"},Numbers:{id:"bamidbar",category:"torah",name:"Numbers"},Deuteronomy:{id:"devarim",category:"torah",name:"Deuteronomy"},Joshua:{id:"yehoshua",category:"neviim",name:"Joshua"},Judges:{id:"shoftim",category:"neviim",name:"Judges"},"I Samuel":{id:"shmuel1",category:"neviim",name:"I Samuel"},"II Samuel":{id:"shmuel2",category:"neviim",name:"II Samuel"},"I Kings":{id:"melachim1",category:"neviim",name:"I Kings"},"II Kings":{id:"melachim2",category:"neviim",name:"II Kings"},Isaiah:{id:"yeshayahu",category:"neviim",name:"Isaiah"},Jeremiah:{id:"yirmeyahu",category:"neviim",name:"Jeremiah"},Ezekiel:{id:"yechezkel",category:"neviim",name:"Ezekiel"},Hosea:{id:"hoshea",category:"trei_asara",name:"Hosea"},Joel:{id:"yoel",category:"trei_asara",name:"Joël"},Amos:{id:"amos",category:"trei_asara",name:"Amos"},Obadiah:{id:"ovadya",category:"trei_asara",name:"Obadja"},Jonah:{id:"yona",category:"trei_asara",name:"Jona"},Micah:{id:"michah",category:"trei_asara",name:"Micha"},Nahum:{id:"nachum",category:"trei_asara",name:"Nahum"},Habakkuk:{id:"chavakuk",category:"trei_asara",name:"Habakuk"},Zephaniah:{id:"tzefanya",category:"trei_asara",name:"Zefanja"},Haggai:{id:"chagai",category:"trei_asara",name:"Haggai"},Zechariah:{id:"zecharya",category:"trei_asara",name:"Zacharia"},Malachi:{id:"malachi",category:"trei_asara",name:"Maleachi"},Psalms:{id:"tehillim",category:"ketuvim",name:"Psalms"},Proverbs:{id:"mishlei",category:"ketuvim",name:"Proverbs"},Job:{id:"iyov",category:"ketuvim",name:"Job"},"Song of Songs":{id:"shir_hashirim",category:"ketuvim",name:"Song of Songs"},Ruth:{id:"rut",category:"ketuvim",name:"Ruth"},Lamentations:{id:"eicha",category:"ketuvim",name:"Lamentations"},Ecclesiastes:{id:"kohelet",category:"ketuvim",name:"Ecclesiastes"},Esther:{id:"esther",category:"ketuvim",name:"Esther"},Daniel:{id:"daniel",category:"ketuvim",name:"Daniel"},Ezra:{id:"ezra",category:"ketuvim",name:"Ezra"},Nehemiah:{id:"nechemya",category:"ketuvim",name:"Nehemiah"},"I Chronicles":{id:"divrei_hayamim1",category:"ketuvim",name:"I Chronicles"},"II Chronicles":{id:"divrei_hayamim2",category:"ketuvim",name:"II Chronicles"}},d={Bereshit:"Genesis",Shemot:"Exodus",Vayikra:"Leviticus",Bamidbar:"Numbers",Devarim:"Deuteronomy",Yehoshua:"Joshua",Shoftim:"Judges","Shmuel I":"I Samuel","Shmuel II":"II Samuel","Melachim I":"I Kings","Melachim II":"II Kings",Yeshayahu:"Isaiah",Yirmeyahu:"Jeremiah",Yechezkel:"Ezekiel",Hoshea:"Hosea",Yoel:"Joel",Ovadya:"Obadiah",Yona:"Jonah",Michah:"Micah",Nachum:"Nahum",Chavakuk:"Habakkuk",Tzefanya:"Zephaniah",Chagai:"Haggai",Zecharya:"Zechariah",Tehillim:"Psalms",Mishlei:"Proverbs",Iyov:"Job","Shir HaShirim":"Song of Songs",Rut:"Ruth",Eicha:"Lamentations",Kohelet:"Ecclesiastes","Divrei HaYamim I":"I Chronicles","Divrei HaYamim II":"II Chronicles",Nechemya:"Nehemiah"};function h(r){let e=r.trim();return d[e]&&(e=d[e]),c[e]||null}function m(r){if(!r)return null;r=r.trim();const e=r.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);if(!e){const a=r.match(/^(.+?)\s+(\d+)$/);return a?{book:a[1],chapter:parseInt(a[2]),verseStart:1,verseEnd:null}:null}return{book:e[1],chapter:parseInt(e[2]),verseStart:parseInt(e[3]),verseEnd:e[4]?parseInt(e[4]):null}}function s(r){const e=m(r);if(!e)return null;const a=h(e.book);if(!a)return null;let t=`/reader.html?book=${a.id}&category=${a.category}`;return e.chapter&&(t+=`&chapter=${e.chapter}`),e.verseStart&&(t+=`&verse=${e.verseStart}`),t}class g{constructor(){this.selectedDate=new Date,this.init()}async init(){this.setupEventListeners(),this.setDateInput(),await this.loadReadings()}setupEventListeners(){document.getElementById("todayBtn").addEventListener("click",()=>{this.selectedDate=new Date,this.setDateInput(),this.loadReadings()}),document.getElementById("loadReadingsBtn").addEventListener("click",()=>{const e=document.getElementById("readingDate").value;e&&(this.selectedDate=new Date(e),this.loadReadings())}),document.getElementById("readingDate").addEventListener("change",e=>{e.target.value&&(this.selectedDate=new Date(e.target.value),this.loadReadings())})}setDateInput(){const e=document.getElementById("readingDate"),a=this.selectedDate.getFullYear(),t=String(this.selectedDate.getMonth()+1).padStart(2,"0"),i=String(this.selectedDate.getDate()).padStart(2,"0");e.value=`${a}-${t}-${i}`}async loadReadings(){try{document.getElementById("readingsContainer").innerHTML=`
                        <div class="loading">
                            <div class="spinner"></div>
                            Lezingen worden geladen...
                        </div>
                    `,await this.loadHebrewDate();const[e,a]=await Promise.all([this.loadWeeklyReadings(),this.loadSefariaCalendar()]);this.renderReadings(e,a)}catch(e){console.error("Error loading readings:",e),document.getElementById("readingsContainer").innerHTML=`
                        <div class="error">
                            <strong>Fout bij het laden van lezingen:</strong><br>
                            ${e.message}
                        </div>
                    `}}async loadHebrewDate(){try{const e=o(this.selectedDate),a=this.selectedDate.toLocaleDateString("nl-NL",{weekday:"long",year:"numeric",month:"long",day:"numeric"});document.getElementById("hebrewDateDisplay").innerHTML=`
                        <h2>${e.display}</h2>
                        <p>${a}</p>
                    `}catch(e){console.error("Error loading Hebrew date:",e),document.getElementById("hebrewDateDisplay").innerHTML=`
                        <div class="error">Kon Joodse datum niet laden</div>
                    `}}async loadWeeklyReadings(){try{return l(this.selectedDate)}catch(e){return console.error("Error loading weekly readings:",e),null}}async loadSefariaCalendar(){try{const e=this.selectedDate.getFullYear(),a=String(this.selectedDate.getMonth()+1).padStart(2,"0"),t=String(this.selectedDate.getDate()).padStart(2,"0"),i=`${e}-${a}-${t}`,n=await fetch(`https://www.sefaria.org/api/calendars?date=${i}`);if(!n.ok)throw new Error(`Sefaria API error: ${n.status}`);return await n.json()}catch(e){return console.error("Error loading Sefaria calendar:",e),null}}renderReadings(e,a){let t="";e&&(t+=this.renderWeeklyCard(e)),a&&a.calendar_items&&(t+=this.renderDailyReadings(a.calendar_items)),a&&a.calendar_items&&(t+=this.renderYearlyReadings(a.calendar_items)),document.getElementById("readingsContainer").innerHTML=t||`
                    <div class="error">Geen lezingen beschikbaar voor deze datum</div>
                `}renderWeeklyCard(e){const a=e.parashat||"N/A",t=this.getTorahLink(a),i=e.haftarah||"N/A",n=this.getHaftarahLink(i);return`
                    <div class="reading-card weekly">
                        <h3>🕯️ Wekelijkse Lezingen</h3>
                        <div class="reading-item">
                            <div class="reading-label">Parashat HaShavua (Torah Portion)</div>
                            <div class="reading-text">${a}</div>
                            ${t}
                        </div>
                        <div class="reading-item">
                            <div class="reading-label">Haftarah (Prophets)</div>
                            <div class="reading-text">${i}</div>
                            ${n}
                        </div>
                        ${e.roshChodesh?`
                            <div class="reading-item">
                                <div class="reading-label">Rosh Chodesh</div>
                                <div class="reading-text">${e.roshChodesh}</div>
                            </div>
                        `:""}
                    </div>
                `}getInternalLink(e,a){const t=s(e);return t?`<a href="${t}" class="reading-link">Read in our Tanach →</a>`:a?`<a href="https://www.sefaria.org${a}" target="_blank" class="reading-link">Read on Sefaria →</a>`:""}getTorahLink(e){if(!e||e==="N/A")return"";if(e.match(/([A-Za-z]+)\s+(\d+):(\d+)/)){const t=s(e);if(t)return`<a href="${t}" class="reading-link">Read in our Tanach →</a>`}return""}getHaftarahLink(e){if(!e||e==="N/A")return"";const a=s(e);return a?`<a href="${a}" class="reading-link">Read in our Tanach →</a>`:""}renderDailyReadings(e){const a=e.filter(i=>["Daf Yomi","Daily Mishnah","Daily Rambam","Chok LeYisrael"].includes(i.title.en));if(a.length===0)return"";let t=`
                    <div class="reading-card daily">
                        <h3>📖 Dagelijkse Studie</h3>
                `;return a.forEach(i=>{const n=this.getInternalLink(i.displayValue.en,i.url);t+=`
                        <div class="reading-item">
                            <div class="reading-label">${i.title.en}</div>
                            <div class="reading-text">${i.displayValue.en}</div>
                            ${n}
                        </div>
                    `}),t+="</div>",t}renderYearlyReadings(e){const a=e.filter(i=>["929","Tanakh Yomi","Nach Yomi","Psalms","Pirkei Avot"].includes(i.title.en));if(a.length===0)return"";let t=`
                    <div class="reading-card yearly">
                        <h3>📅 Jaarlijkse Cyclussen</h3>
                `;return a.forEach(i=>{const n=this.getInternalLink(i.displayValue.en,i.url);t+=`
                        <div class="reading-item">
                            <div class="reading-label">${i.title.en}</div>
                            <div class="reading-text">${i.displayValue.en}</div>
                            ${n}
                        </div>
                    `}),t+="</div>",t}}document.addEventListener("DOMContentLoaded",()=>{new g});
