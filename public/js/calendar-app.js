import { getWeeklyInfo, getTimes, getHebrewDate, getCalendarData } from './hebcal-service.js';

class JewishCalendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.viewMode = 'month';
        this.calendarData = {};

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadCalendarData();
        this.renderCalendar();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.navigateMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.navigateMonth(1);
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.goToToday();
        });
    }

    async loadCalendarData() {
        try {
            // Load current month data directly from Hebcal (no API call)
            const monthData = getCalendarData(this.currentYear, this.currentMonth + 1);
            this.calendarData[`${this.currentYear}-${this.currentMonth + 1}`] = monthData;

            // Load weekly info
            this.loadWeeklyInfo();

            // Load times info
            this.loadTimesInfo();

            // Load Hebrew date info
            this.loadHebrewDateInfo();

        } catch (error) {
            console.error('Error loading calendar data:', error);
            this.showError('Kon kalender data niet laden');
        }
    }

    loadWeeklyInfo() {
        try {
            const data = getWeeklyInfo();
            this.renderWeeklyInfo(data);
        } catch (error) {
            console.error('Error loading weekly info:', error);
            this.renderWeeklyInfo({
                parashat: 'Error',
                haftarah: 'Error',
                roshChodesh: null
            });
        }
    }

    loadTimesInfo() {
        try {
            const data = getTimes();
            this.renderTimesInfo(data);
        } catch (error) {
            console.error('Error loading times info:', error);
            this.renderTimesInfo({
                candleLighting: 'Error',
                havdalah: 'Error',
                sunrise: 'Error',
                sunset: 'Error'
            });
        }
    }

    loadHebrewDateInfo() {
        try {
            const today = new Date();
            const hebrewDate = getHebrewDate(today);

            const data = {
                gregorian: today.toLocaleDateString('nl-NL'),
                hebrew: hebrewDate
            };

            this.renderHebrewDateInfo(data);
        } catch (error) {
            console.error('Error loading Hebrew date info:', error);
            this.renderHebrewDateInfo({
                gregorian: 'Error',
                hebrew: {
                    display: 'Error',
                    year: 'Error'
                }
            });
        }
    }

    renderWeeklyInfo(data) {
        const container = document.getElementById('weeklyInfo');
        container.innerHTML = `
            <div class="info-item">
                <span class="info-label">Parashat:</span>
                <span class="info-value">${data.parashat || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Haftarah:</span>
                <span class="info-value">${data.haftarah || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Rosh Chodesh:</span>
                <span class="info-value">${data.roshChodesh || 'N/A'}</span>
            </div>
        `;
    }

    renderTimesInfo(data) {
        const container = document.getElementById('timesInfo');
        container.innerHTML = `
            <div class="info-item">
                <span class="info-label">Candle Lighting:</span>
                <span class="info-value">${data.candleLighting || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Havdalah:</span>
                <span class="info-value">${data.havdalah || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Zonsopgang:</span>
                <span class="info-value">${data.sunrise || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Zonsondergang:</span>
                <span class="info-value">${data.sunset || 'N/A'}</span>
            </div>
        `;
    }

    renderHebrewDateInfo(data) {
        const container = document.getElementById('hebrewDateInfo');
        container.innerHTML = `
            <div class="info-item">
                <span class="info-label">Gregoriaans:</span>
                <span class="info-value">${data.gregorian || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Joods (Latijns):</span>
                <span class="info-value" style="font-size: 1.1rem; font-weight: bold; color: #667eea;">${data.hebrew.display || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Joods Jaar:</span>
                <span class="info-value">${data.hebrew.year || 'N/A'}</span>
            </div>
        `;
    }

    renderCalendar() {
        const container = document.getElementById('calendarContent');
        const title = document.getElementById('calendarTitle');

        const monthNames = [
            'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
            'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
        ];

        // Get Hebrew month name if available
        const monthData = this.calendarData[`${this.currentYear}-${this.currentMonth + 1}`];
        let hebrewMonthName = '';
        if (monthData && monthData.days && monthData.days.length > 0) {
            const firstDay = monthData.days[0];
            if (firstDay.hebrewDate && firstDay.hebrewDate.month) {
                hebrewMonthName = firstDay.hebrewDate.month;
            }
        }

        // Get Hebrew year if available
        let hebrewYear = '';
        if (monthData && monthData.days && monthData.days.length > 0) {
            const firstDay = monthData.days[0];
            if (firstDay.hebrewDate && firstDay.hebrewDate.year) {
                hebrewYear = firstDay.hebrewDate.year;
            }
        }

        // Build title: Jewish year, Jewish month / European month and year
        let titleText = '';
        if (hebrewYear && hebrewMonthName) {
            titleText = `${hebrewYear} ${hebrewMonthName} / ${monthNames[this.currentMonth]} ${this.currentYear}`;
        } else if (hebrewMonthName) {
            titleText = `${hebrewMonthName} / ${monthNames[this.currentMonth]} ${this.currentYear}`;
        } else {
            titleText = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        }

        title.innerHTML = titleText;

        if (this.viewMode === 'month') {
            container.innerHTML = this.renderMonthView();
        }
    }

    renderMonthView() {
        const monthData = this.calendarData[`${this.currentYear}-${this.currentMonth + 1}`];
        if (!monthData) {
            return '<div class="error">Geen data beschikbaar voor deze maand</div>';
        }

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '<div class="calendar-grid">';

        // Calendar days
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
                const dayNumber = currentDate.getDate();
                const isToday = this.isToday(currentDate);
                const isShabbat = currentDate.getDay() === 6;

                // Get Hebrew date from data if available
                let hebrewDateInfo = null;
                if (monthData && monthData.days) {
                    const dayData = monthData.days.find(d => d.day === dayNumber && isCurrentMonth);
                    if (dayData && dayData.hebrewDate) {
                        hebrewDateInfo = dayData.hebrewDate;
                    }
                }

                // Fallback for dates
                if (!hebrewDateInfo) {
                    hebrewDateInfo = getHebrewDate(currentDate);
                }

                // For other months, show no Hebrew date
                if (!isCurrentMonth) {
                    hebrewDateInfo = {
                        display: '',
                        hebrewDisplay: '',
                        month: '',
                        year: ''
                    };
                }

                let cellClass = 'day-cell';
                if (!isCurrentMonth) cellClass += ' other-month';
                if (isToday) cellClass += ' today';
                if (isShabbat) cellClass += ' shabbat';

                // Get events for this day
                let dayEvents = '';
                if (monthData && monthData.days) {
                    const dayData = monthData.days.find(d => d.day === dayNumber && isCurrentMonth);
                    if (dayData && dayData.events) {
                        dayEvents = dayData.events.map(event => {
                            let eventClass = 'event';
                            if (event.type === 'shabbat') eventClass += ' shabbat';
                            else if (event.type === 'holiday') eventClass += ' holiday';
                            else if (event.type === 'roshChodesh') eventClass += ' roshChodesh';

                            return `<div class="${eventClass}">${event.name}</div>`;
                        }).join('');
                    }
                }

                // Fallback for Shabbat if no data
                if (!dayEvents && isShabbat) {
                    dayEvents = '<div class="event shabbat">Sjabbat</div>';
                }

                // Get month names
                const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                const europeanMonth = monthNames[currentDate.getMonth()];

                // Extract just the day number from hebrewDateInfo.display
                let hebrewDayOnly = hebrewDateInfo.display || '';
                if (hebrewDayOnly && hebrewDateInfo.month) {
                    hebrewDayOnly = hebrewDayOnly.replace(hebrewDateInfo.month, '').trim();
                }

                html += `
                    <div class="${cellClass}" data-date="${currentDate.toISOString().split('T')[0]}">
                        <div class="day-number">${dayNumber} ${europeanMonth}</div>
                        <div class="hebrew-date">
                            <div class="hebrew-numeral">${hebrewDayOnly}</div>
                            <div class="hebrew-month">${hebrewDateInfo.month || ''}</div>
                        </div>
                        <div class="day-events">
                            ${dayEvents}
                        </div>
                    </div>
                `;

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        html += '</div>';
        return html;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    navigateMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }

        this.loadCalendarData().then(() => {
            this.renderCalendar();
        });
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();

        this.loadCalendarData().then(() => {
            this.renderCalendar();
        });
    }

    showError(message) {
        const container = document.getElementById('calendarContent');
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', () => {
    new JewishCalendar();
});
