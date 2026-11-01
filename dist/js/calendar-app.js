import {
    getWeeklyInfo,
    getTimes,
    getHebrewDate,
    getCalendarData,
    formatLocalDateKey,
    setCalendarLocation,
    getActiveLocationId,
    LOCATION_PRESETS,
    setCustomGeoLocation,
    getLocationDisplayName,
    getCalendarLabels,
} from './hebcal-service.js';

class JewishCalendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.viewMode = 'month';
        this.calendarData = {};
        this.labels = getCalendarLabels();

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.populateLocationSelect();
        this.renderLocationHeader();
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

        const locationSelect = document.getElementById('locationSelect');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.onLocationChange(e.target.value);
            });
        }

        const geoBtn = document.getElementById('useGeoLocation');
        if (geoBtn) {
            geoBtn.addEventListener('click', () => {
                this.requestGeoLocation();
            });
        }
    }

    onLocationChange(locationId) {
        if (locationId === 'geo') {
            this.requestGeoLocation();
            return;
        }
        setCalendarLocation(locationId);
        this.labels = getCalendarLabels();
        this.refreshAfterLocationChange();
    }

    requestGeoLocation() {
        if (!navigator.geolocation) {
            alert(this.labels.geoUnavailable);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCustomGeoLocation(
                    pos.coords.latitude,
                    pos.coords.longitude,
                );
                this.labels = getCalendarLabels();
                this.populateLocationSelect();
                this.refreshAfterLocationChange();
            },
            () => {
                alert(this.labels.geoDenied);
                this.populateLocationSelect();
            },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
        );
    }

    async refreshAfterLocationChange() {
        await this.loadCalendarData();
        this.renderCalendar();
        this.renderLocationHeader();
    }

    populateLocationSelect() {
        const select = document.getElementById('locationSelect');
        if (!select) return;

        const activeId = getActiveLocationId();
        const nl = getCalendarLabels().locationLabel === 'Locatie';

        select.innerHTML = '';

        const geoOpt = document.createElement('option');
        geoOpt.value = 'geo';
        geoOpt.textContent = nl ? '📍 Mijn locatie' : '📍 Use my location';
        select.appendChild(geoOpt);

        for (const preset of LOCATION_PRESETS) {
            const opt = document.createElement('option');
            opt.value = preset.id;
            opt.textContent = nl ? preset.nameNl : preset.nameEn;
            select.appendChild(opt);
        }

        select.value = activeId;
    }

    renderLocationHeader() {
        const title = document.getElementById('timesSidebarTitle');
        if (title) {
            title.textContent = `🕯️ ${this.labels.timesTitle}`;
        }
        const weeklyTitle = document.getElementById('weeklySidebarTitle');
        if (weeklyTitle) {
            weeklyTitle.textContent = `📚 ${this.labels.thisMonth}`;
        }
        const dateTitle = document.getElementById('dateSidebarTitle');
        if (dateTitle) {
            dateTitle.textContent = `📅 ${this.labels.dateInfo}`;
        }
        const locLabel = document.querySelector('.location-label');
        if (locLabel) {
            locLabel.textContent = this.labels.locationLabel;
        }
        const geoBtn = document.getElementById('useGeoLocation');
        if (geoBtn) {
            geoBtn.textContent = this.labels.useMyLocation;
        }
    }

    async loadCalendarData() {
        try {
            // Load current month data directly from Hebcal (no API call)
            const monthData = getCalendarData(this.currentYear, this.currentMonth + 1);
            this.calendarData[`${this.currentYear}-${this.currentMonth + 1}`] = monthData;

            // Parasha, zmanim, and "Date Info" refer to the actual current day — not day 1 of the
            // month being shown (which caused Hebrew/Gregorian to disagree with "today" in the grid).
            const today = new Date();
            this.loadWeeklyInfo(today);
            this.loadTimesInfo(today);
            this.loadHebrewDateInfo(today);

        } catch (error) {
            console.error('Error loading calendar data:', error);
            this.showError('Could not load calendar data');
        }
    }

    loadWeeklyInfo(date) {
        try {
            const data = getWeeklyInfo(date);
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

    loadTimesInfo(date) {
        try {
            const data = getTimes(date);
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

    loadHebrewDateInfo(date) {
        try {
            const targetDate = date || new Date();
            const hebrewDate = getHebrewDate(targetDate);

            const data = {
                gregorian: targetDate.toLocaleDateString(
                    getCalendarLabels().gregorian === 'Gregoriaans' ? 'nl-NL' : 'en-US',
                ),
                hebrew: hebrewDate,
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
                <span class="info-label">${this.labels.parashat}:</span>
                <span class="info-value">${data.parashat || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.haftarah}:</span>
                <span class="info-value">${data.haftarah || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.roshChodesh}:</span>
                <span class="info-value">${data.roshChodesh || 'N/A'}</span>
            </div>
        `;
    }

    renderTimesInfo(data) {
        const container = document.getElementById('timesInfo');
        const hintNl = getCalendarLabels().locationLabel === 'Locatie';
        container.innerHTML = `
            <div class="info-item location-display">
                <span class="info-label">${this.labels.locationLabel}:</span>
                <span class="info-value">${data.location || getLocationDisplayName()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.nextShabbat}:</span>
                <span class="info-value">${data.nextShabbat || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.candleLighting}:</span>
                <span class="info-value">${data.candleLighting || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.havdalah}:</span>
                <span class="info-value">${data.havdalah || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.sunrise}:</span>
                <span class="info-value">${data.sunrise || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.sunset}:</span>
                <span class="info-value">${data.sunset || 'N/A'}</span>
            </div>
            <p class="times-hint">${hintNl ? 'Tijden volgen de geselecteerde locatie (HebCal).' : 'Times are calculated for the selected location (HebCal).'}</p>
        `;
    }

    renderHebrewDateInfo(data) {
        const container = document.getElementById('hebrewDateInfo');
        const gregorian =
            data.gregorian ||
            new Date().toLocaleDateString(
                getCalendarLabels().gregorian === 'Gregoriaans' ? 'nl-NL' : 'en-US',
            );
        container.innerHTML = `
            <div class="info-item">
                <span class="info-label">${this.labels.gregorian}:</span>
                <span class="info-value">${gregorian}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.hebrewLatin}:</span>
                <span class="info-value" style="font-size: 1.1rem; font-weight: bold; color: #667eea;">${data.hebrew.display || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.labels.hebrewYear}:</span>
                <span class="info-value">${data.hebrew.year || 'N/A'}</span>
            </div>
        `;
    }

    renderCalendar() {
        const container = document.getElementById('calendarContent');
        const title = document.getElementById('calendarTitle');

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
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
            return '<div class="error">No data available for this month</div>';
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
                    dayEvents = `<div class="event shabbat">${this.labels.shabbat}</div>`;
                }

                // Get month names
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const europeanMonth = monthNames[currentDate.getMonth()];

                // Extract just the day number from hebrewDateInfo.display
                let hebrewDayOnly = hebrewDateInfo.display || '';
                if (hebrewDayOnly && hebrewDateInfo.month) {
                    hebrewDayOnly = hebrewDayOnly.replace(hebrewDateInfo.month, '').trim();
                }

                html += `
                    <div class="${cellClass}" data-date="${formatLocalDateKey(currentDate)}">
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
