import { HDate, Location, HebrewCalendar, Event, Zmanim } from '@hebcal/core';
import { getLeyningOnDate, formatAliyahWithBook } from '@hebcal/leyning';

// Configure Amsterdam location
const AMSTERDAM = Location.lookup('Amsterdam') || new Location(
    52.3676,            // latitude
    4.9041,             // longitude
    false,              // isIsrael
    'Europe/Amsterdam', // timezone
    'Amsterdam',        // city name
    'NL',               // country code
    'nl'                // geo ID
);

/**
 * Get weekly Torah reading, Haftarah, and Rosh Chodesh info
 */
export function getWeeklyInfo(date = null) {
    try {
        const targetDate = date || new Date();
        const hd = new HDate(targetDate);

        // Get the upcoming Shabbat from the target date
        const saturday = hd.onOrAfter(6); // 6 = Saturday

        // Get events for the upcoming Shabbat
        const events = HebrewCalendar.calendar({
            start: saturday,
            end: saturday,
            sedrot: true, // Include Torah readings
            il: false,    // Diaspora calendar
        });

        let parashat = null;
        let haftarah = null;
        let roshChodesh = null;

        // Find the Torah reading event
        for (const ev of events) {
            const desc = ev.getDesc();
            const render = ev.render('en');

            // Check if it's a Torah reading event
            if (desc === 'Parashat HaShavua' || render.startsWith('Parashat ')) {
                parashat = render;

                // Get the Haftarah reading
                try {
                    const leyning = getLeyningOnDate(ev.getDate(), false); // false = diaspora
                    if (leyning && leyning.haftara) {
                        const haftaraData = leyning.haftara;
                        // Format: "Book chapter:verse-verse"
                        if (Array.isArray(haftaraData)) {
                            // Multiple haftarah readings
                            haftarah = haftaraData.map(h => {
                                const str = formatAliyahWithBook(h);
                                return typeof str === 'string' ? str : `${h.k || ''} ${h.b || ''}:${h.e || ''}`;
                            }).join(', ');
                        } else {
                            const formatted = formatAliyahWithBook(haftaraData);
                            if (typeof formatted === 'string' && formatted !== 'undefined undefined-undefined') {
                                haftarah = formatted;
                            } else {
                                // Fallback: construct from object properties
                                haftarah = `${haftaraData.k || 'Unknown'} ${haftaraData.b || ''}:${haftaraData.e || ''}`;
                            }
                        }
                    }
                } catch (leyningError) {
                    console.warn('Could not get Haftarah:', leyningError);
                }
            }
        }

        // Check for Rosh Chodesh
        const roshChodeshEvents = HebrewCalendar.calendar({
            start: targetDate,
            end: new Date(targetDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            mask: Event.ROSH_CHODESH
        });

        if (roshChodeshEvents.length > 0) {
            const nextRoshChodesh = roshChodeshEvents[0];
            roshChodesh = nextRoshChodesh.render('en') + ' - ' +
                         nextRoshChodesh.getDate().greg().toLocaleDateString('nl-NL');
        }

        return {
            parashat: parashat || 'N/A',
            haftarah: haftarah || 'N/A',
            roshChodesh: roshChodesh,
            specialShabbat: null
        };
    } catch (error) {
        console.error('Weekly info error:', error);
        return {
            parashat: 'Error',
            haftarah: 'Error',
            roshChodesh: null,
            specialShabbat: null
        };
    }
}

/**
 * Get candle lighting, havdalah, sunrise, sunset times
 */
export function getTimes(date = null) {
    try {
        const targetDate = date || new Date();
        const hd = new HDate(targetDate);

        // Get the next Shabbat from the target date
        const saturday = hd.onOrAfter(6); // 6 = Saturday
        const saturdayDate = saturday.greg();

        // Get Shabbat candle lighting and havdalah times
        const events = HebrewCalendar.calendar({
            start: saturday,
            end: saturday,
            location: AMSTERDAM,
            candlelighting: true,
            havdalah: true,
            il: false
        });

        let candleLighting = null;
        let havdalah = null;

        for (const ev of events) {
            const desc = ev.getDesc();
            if (desc === 'Candle lighting') {
                const eventTime = ev.eventTime;
                candleLighting = eventTime.toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (desc === 'Havdalah') {
                const eventTime = ev.eventTime;
                havdalah = eventTime.toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }

        // Calculate sunrise and sunset for target date
        const zmanim = new Zmanim(AMSTERDAM, targetDate, false);
        const sunrise = zmanim.sunrise();
        const sunset = zmanim.sunset();

        return {
            candleLighting: candleLighting || 'N/A',
            havdalah: havdalah || 'N/A',
            sunrise: sunrise ? sunrise.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A',
            sunset: sunset ? sunset.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A',
            location: 'Amsterdam, Nederland',
            nextShabbat: saturdayDate.toLocaleDateString('nl-NL')
        };
    } catch (error) {
        console.error('Times error:', error);
        return {
            candleLighting: 'Error',
            havdalah: 'Error',
            sunrise: 'Error',
            sunset: 'Error',
            location: 'Amsterdam, Nederland',
            nextShabbat: 'Error'
        };
    }
}

/**
 * Get Hebrew date for a specific Gregorian date
 */
export function getHebrewDate(date) {
    try {
        const hDate = new HDate(date);

        const hebrewDay = hDate.getDate();
        const hebrewMonth = hDate.getMonthName();
        const hebrewYear = hDate.getFullYear();

        // Convert Hebrew month names to transliterated versions
        const hebrewMonthTransliterated = getHebrewMonthTransliterated(hebrewMonth);

        // Hebrew numerals for day
        const hebrewNumerals = [
            '', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
            'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
            'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'
        ];

        const hebrewDayNumeral = hebrewNumerals[hebrewDay] || hebrewDay.toString();

        return {
            day: hebrewDay,
            month: hebrewMonthTransliterated,
            year: hebrewYear,
            dayNumeral: hebrewDayNumeral,
            display: `${hebrewDay} ${hebrewMonthTransliterated} ${hebrewYear}`,
            hebrewDisplay: `${hebrewDay} ${hebrewMonthTransliterated} ${hebrewYear}`
        };
    } catch (error) {
        console.error('Hebrew date error:', error);
        return {
            day: 0,
            month: 'Error',
            year: 0,
            dayNumeral: '',
            display: 'Error',
            hebrewDisplay: 'Error'
        };
    }
}

/**
 * Get calendar data for a specific month
 */
export function getCalendarData(year, month) {
    try {
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month - 1, daysInMonth);

        // Get all events for the month from Hebcal
        const monthEvents = HebrewCalendar.calendar({
            start: firstDay,
            end: lastDay,
            location: AMSTERDAM,
            candlelighting: true,
            havdalah: true,
            sedrot: true,
            il: false
        });

        const days = [];

        // Generate days for the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const hebrewDate = getHebrewDate(date);

            // Get events for this specific day
            const dayEvents = getDayEventsFromHebcal(date, monthEvents);

            days.push({
                day: day,
                date: date.toISOString().split('T')[0],
                hebrewDate: hebrewDate,
                isToday: isToday(date),
                isShabbat: date.getDay() === 6,
                events: dayEvents
            });
        }

        return {
            year: year,
            month: month,
            days: days
        };
    } catch (error) {
        console.error('Calendar data error:', error);
        return {
            year: year,
            month: month,
            days: []
        };
    }
}

/**
 * Helper: Get events for a specific day from Hebcal data
 */
function getDayEventsFromHebcal(date, allEvents) {
    const events = [];
    const dateString = date.toISOString().split('T')[0];

    for (const ev of allEvents) {
        const evDate = ev.getDate().greg();
        const evDateString = evDate.toISOString().split('T')[0];

        if (evDateString === dateString) {
            const desc = ev.getDesc();
            const render = ev.render('en');
            let eventType = 'other';

            if (desc === 'Candle lighting') {
                eventType = 'candleLighting';
            } else if (desc === 'Havdalah') {
                eventType = 'havdalah';
            } else if (desc === 'Parashat HaShavua') {
                eventType = 'parashat';
            } else if (render.includes('Rosh Chodesh')) {
                eventType = 'roshChodesh';
            } else if (date.getDay() === 6 && render === 'Shabbat') {
                eventType = 'shabbat';
            } else {
                // Check if it's a holiday by flags
                const flags = ev.getFlags();
                if (flags & Event.MAJOR_HOLIDAY || flags & Event.MINOR_HOLIDAY || flags & Event.MINOR_FAST || flags & Event.MAJOR_FAST) {
                    eventType = 'holiday';
                }
            }

            events.push({
                name: render,
                type: eventType,
                time: ev.eventTime ? ev.eventTime.toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) : null
            });
        }
    }

    // Add Shabbat if it's Saturday and not already added
    if (date.getDay() === 6 && !events.some(e => e.type === 'shabbat')) {
        events.push({
            name: 'Sjabbat',
            type: 'shabbat'
        });
    }

    return events;
}

/**
 * Helper: Convert Hebrew month names to transliterated versions
 */
function getHebrewMonthTransliterated(hebrewMonth) {
    const monthMap = {
        'Tishrei': 'Tishrei',
        'Cheshvan': 'Cheshvan',
        'Kislev': 'Kislev',
        'Tevet': 'Tevet',
        'Shevat': 'Shevat',
        'Adar': 'Adar',
        'Adar I': 'Adar Alef',
        'Adar II': 'Adar Bet',
        'Nisan': 'Nisan',
        'Iyar': 'Iyar',
        'Sivan': 'Sivan',
        'Tammuz': 'Tammuz',
        'Av': 'Av',
        'Elul': 'Elul'
    };
    return monthMap[hebrewMonth] || hebrewMonth;
}

/**
 * Helper: Check if date is today
 */
function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}
