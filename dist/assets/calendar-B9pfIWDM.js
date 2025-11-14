import"./modulepreload-polyfill-B5Qt9EMX.js";import{g,a as w,b as M,c as p}from"./hebcal-service-Bq1V8CQV.js";class ${constructor(){this.currentDate=new Date,this.currentMonth=this.currentDate.getMonth(),this.currentYear=this.currentDate.getFullYear(),this.viewMode="month",this.calendarData={},this.init()}async init(){this.setupEventListeners(),await this.loadCalendarData(),this.renderCalendar()}setupEventListeners(){document.getElementById("prevMonth").addEventListener("click",()=>{this.navigateMonth(-1)}),document.getElementById("nextMonth").addEventListener("click",()=>{this.navigateMonth(1)}),document.getElementById("todayBtn").addEventListener("click",()=>{this.goToToday()})}async loadCalendarData(){try{const e=g(this.currentYear,this.currentMonth+1);this.calendarData[`${this.currentYear}-${this.currentMonth+1}`]=e;const t=new Date(this.currentYear,this.currentMonth,1);this.loadWeeklyInfo(t),this.loadTimesInfo(t),this.loadHebrewDateInfo(t)}catch(e){console.error("Error loading calendar data:",e),this.showError("Kon kalender data niet laden")}}loadWeeklyInfo(e){try{const t=w(e);this.renderWeeklyInfo(t)}catch(t){console.error("Error loading weekly info:",t),this.renderWeeklyInfo({parashat:"Error",haftarah:"Error",roshChodesh:null})}}loadTimesInfo(e){try{const t=M(e);this.renderTimesInfo(t)}catch(t){console.error("Error loading times info:",t),this.renderTimesInfo({candleLighting:"Error",havdalah:"Error",sunrise:"Error",sunset:"Error"})}}loadHebrewDateInfo(e){try{const t=e||new Date,s=p(t),n={gregorian:t.toLocaleDateString("nl-NL"),hebrew:s};this.renderHebrewDateInfo(n)}catch(t){console.error("Error loading Hebrew date info:",t),this.renderHebrewDateInfo({gregorian:"Error",hebrew:{display:"Error",year:"Error"}})}}renderWeeklyInfo(e){const t=document.getElementById("weeklyInfo");t.innerHTML=`
            <div class="info-item">
                <span class="info-label">Parashat:</span>
                <span class="info-value">${e.parashat||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Haftarah:</span>
                <span class="info-value">${e.haftarah||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Rosh Chodesh:</span>
                <span class="info-value">${e.roshChodesh||"N/A"}</span>
            </div>
        `}renderTimesInfo(e){const t=document.getElementById("timesInfo");t.innerHTML=`
            <div class="info-item">
                <span class="info-label">Candle Lighting:</span>
                <span class="info-value">${e.candleLighting||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Havdalah:</span>
                <span class="info-value">${e.havdalah||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Zonsopgang:</span>
                <span class="info-value">${e.sunrise||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Zonsondergang:</span>
                <span class="info-value">${e.sunset||"N/A"}</span>
            </div>
        `}renderHebrewDateInfo(e){const t=document.getElementById("hebrewDateInfo");t.innerHTML=`
            <div class="info-item">
                <span class="info-label">Gregoriaans:</span>
                <span class="info-value">${e.gregorian||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Joods (Latijns):</span>
                <span class="info-value" style="font-size: 1.1rem; font-weight: bold; color: #667eea;">${e.hebrew.display||"N/A"}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Joods Jaar:</span>
                <span class="info-value">${e.hebrew.year||"N/A"}</span>
            </div>
        `}renderCalendar(){const e=document.getElementById("calendarContent"),t=document.getElementById("calendarTitle"),s=["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"],n=this.calendarData[`${this.currentYear}-${this.currentMonth+1}`];let a="";if(n&&n.days&&n.days.length>0){const r=n.days[0];r.hebrewDate&&r.hebrewDate.month&&(a=r.hebrewDate.month)}let d="";if(n&&n.days&&n.days.length>0){const r=n.days[0];r.hebrewDate&&r.hebrewDate.year&&(d=r.hebrewDate.year)}let l="";d&&a?l=`${d} ${a} / ${s[this.currentMonth]} ${this.currentYear}`:a?l=`${a} / ${s[this.currentMonth]} ${this.currentYear}`:l=`${s[this.currentMonth]} ${this.currentYear}`,t.innerHTML=l,this.viewMode==="month"&&(e.innerHTML=this.renderMonthView())}renderMonthView(){const e=this.calendarData[`${this.currentYear}-${this.currentMonth+1}`];if(!e)return'<div class="error">Geen data beschikbaar voor deze maand</div>';const t=new Date(this.currentYear,this.currentMonth,1),s=new Date(t);s.setDate(s.getDate()-t.getDay());let n='<div class="calendar-grid">';const a=new Date(s);for(let d=0;d<6;d++)for(let l=0;l<7;l++){const r=a.getMonth()===this.currentMonth,y=a.getDate(),D=this.isToday(a),m=a.getDay()===6;let i=null;if(e&&e.days){const h=e.days.find(o=>o.day===y&&r);h&&h.hebrewDate&&(i=h.hebrewDate)}i||(i=p(a)),r||(i={display:"",hebrewDisplay:"",month:"",year:""});let c="day-cell";r||(c+=" other-month"),D&&(c+=" today"),m&&(c+=" shabbat");let f="";if(e&&e.days){const h=e.days.find(o=>o.day===y&&r);h&&h.events&&(f=h.events.map(o=>{let v="event";return o.type==="shabbat"?v+=" shabbat":o.type==="holiday"?v+=" holiday":o.type==="roshChodesh"&&(v+=" roshChodesh"),`<div class="${v}">${o.name}</div>`}).join(""))}!f&&m&&(f='<div class="event shabbat">Sjabbat</div>');const b=["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"][a.getMonth()];let u=i.display||"";u&&i.month&&(u=u.replace(i.month,"").trim()),n+=`
                    <div class="${c}" data-date="${a.toISOString().split("T")[0]}">
                        <div class="day-number">${y} ${b}</div>
                        <div class="hebrew-date">
                            <div class="hebrew-numeral">${u}</div>
                            <div class="hebrew-month">${i.month||""}</div>
                        </div>
                        <div class="day-events">
                            ${f}
                        </div>
                    </div>
                `,a.setDate(a.getDate()+1)}return n+="</div>",n}isToday(e){const t=new Date;return e.toDateString()===t.toDateString()}navigateMonth(e){this.currentMonth+=e,this.currentMonth<0?(this.currentMonth=11,this.currentYear--):this.currentMonth>11&&(this.currentMonth=0,this.currentYear++),this.loadCalendarData().then(()=>{this.renderCalendar()})}goToToday(){const e=new Date;this.currentMonth=e.getMonth(),this.currentYear=e.getFullYear(),this.loadCalendarData().then(()=>{this.renderCalendar()})}showError(e){const t=document.getElementById("calendarContent");t.innerHTML=`<div class="error">${e}</div>`}}document.addEventListener("DOMContentLoaded",()=>{new $});
