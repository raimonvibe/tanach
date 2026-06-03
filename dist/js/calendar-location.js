import { Location } from '@hebcal/core';

const STORAGE_KEY = 'tanach-calendar-location';

/** @typedef {{ id: string, nameEn: string, nameNl: string, lookup: string, country: string, isIsrael?: boolean }} LocationPreset */

/** @type {LocationPreset[]} */
export const LOCATION_PRESETS = [
    { id: 'amsterdam', nameEn: 'Amsterdam, Netherlands', nameNl: 'Amsterdam, Nederland', lookup: 'Amsterdam', country: 'NL' },
    { id: 'rotterdam', nameEn: 'Rotterdam, Netherlands', nameNl: 'Rotterdam, Nederland', lookup: 'Rotterdam', country: 'NL' },
    { id: 'antwerp', nameEn: 'Antwerp, Belgium', nameNl: 'Antwerpen, België', lookup: 'Antwerp', country: 'BE' },
    { id: 'london', nameEn: 'London, UK', nameNl: 'Londen, VK', lookup: 'London', country: 'GB' },
    { id: 'paris', nameEn: 'Paris, France', nameNl: 'Parijs, Frankrijk', lookup: 'Paris', country: 'FR' },
    { id: 'berlin', nameEn: 'Berlin, Germany', nameNl: 'Berlijn, Duitsland', lookup: 'Berlin', country: 'DE' },
    { id: 'new_york', nameEn: 'New York, USA', nameNl: 'New York, VS', lookup: 'New York', country: 'US' },
    { id: 'los_angeles', nameEn: 'Los Angeles, USA', nameNl: 'Los Angeles, VS', lookup: 'Los Angeles', country: 'US' },
    { id: 'chicago', nameEn: 'Chicago, USA', nameNl: 'Chicago, VS', lookup: 'Chicago', country: 'US' },
    { id: 'toronto', nameEn: 'Toronto, Canada', nameNl: 'Toronto, Canada', lookup: 'Toronto', country: 'CA' },
    { id: 'jerusalem', nameEn: 'Jerusalem, Israel', nameNl: 'Jeruzalem, Israël', lookup: 'Jerusalem', country: 'IL', isIsrael: true },
    { id: 'tel_aviv', nameEn: 'Tel Aviv, Israel', nameNl: 'Tel Aviv, Israël', lookup: 'Tel Aviv', country: 'IL', isIsrael: true },
    { id: 'sydney', nameEn: 'Sydney, Australia', nameNl: 'Sydney, Australië', lookup: 'Sydney', country: 'AU' },
    { id: 'johannesburg', nameEn: 'Johannesburg, South Africa', nameNl: 'Johannesburg, Zuid-Afrika', lookup: 'Johannesburg', country: 'ZA' },
];

const TIMEZONE_DEFAULTS = {
    'Europe/Amsterdam': 'amsterdam',
    'Europe/Brussels': 'antwerp',
    'Europe/London': 'london',
    'Europe/Paris': 'paris',
    'Europe/Berlin': 'berlin',
    'America/New_York': 'new_york',
    'America/Chicago': 'chicago',
    'America/Los_Angeles': 'los_angeles',
    'America/Toronto': 'toronto',
    'Asia/Jerusalem': 'jerusalem',
    'Australia/Sydney': 'sydney',
    'Africa/Johannesburg': 'johannesburg',
};

let activePresetId = null;
/** @type {Location | null} */
let cachedHebcalLocation = null;
/** @type {{ preset: LocationPreset, location: Location } | null} */
let customGeoLocation = null;

function getBrowserTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
        return '';
    }
}

export function inferDefaultLocationId() {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('nl') || lang.startsWith('nl-')) {
        return 'amsterdam';
    }

    const tz = getBrowserTimezone();
    if (TIMEZONE_DEFAULTS[tz]) {
        return TIMEZONE_DEFAULTS[tz];
    }

    if (tz.startsWith('Europe/')) {
        return 'london';
    }
    if (tz.startsWith('America/')) {
        return 'new_york';
    }
    if (tz.startsWith('Asia/')) {
        return 'jerusalem';
    }
    if (tz.startsWith('Australia/')) {
        return 'sydney';
    }

    return 'new_york';
}

export function getLocationPreset(id) {
    return LOCATION_PRESETS.find((p) => p.id === id) || null;
}

export function getActiveLocationId() {
    if (activePresetId) return activePresetId;
    if (customGeoLocation) return 'geo';

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && (stored === 'geo' || getLocationPreset(stored))) {
            return stored;
        }
    } catch {
        /* ignore */
    }

    return inferDefaultLocationId();
}

export function setCalendarLocation(id) {
    activePresetId = id;
    cachedHebcalLocation = null;

    if (id !== 'geo') {
        customGeoLocation = null;
        try {
            localStorage.setItem(STORAGE_KEY, id);
        } catch {
            /* ignore */
        }
    }
}

export function setCustomGeoLocation(latitude, longitude, label = '') {
    const timezone = getBrowserTimezone() || 'UTC';
    const location = new Location(
        latitude,
        longitude,
        false,
        timezone,
        label || 'Your location',
        '',
        '',
    );

    customGeoLocation = {
        preset: {
            id: 'geo',
            nameEn: label || 'Your location',
            nameNl: label || 'Uw locatie',
            lookup: '',
            country: '',
        },
        location,
    };
    activePresetId = 'geo';
    cachedHebcalLocation = location;

    try {
        localStorage.setItem(STORAGE_KEY, 'geo');
        localStorage.setItem(
            `${STORAGE_KEY}-geo`,
            JSON.stringify({ latitude, longitude, label, timezone }),
        );
    } catch {
        /* ignore */
    }
}

function loadStoredGeoLocation() {
    try {
        const raw = localStorage.getItem(`${STORAGE_KEY}-geo`);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
            return null;
        }
        setCustomGeoLocation(data.latitude, data.longitude, data.label || '');
        return customGeoLocation;
    } catch {
        return null;
    }
}

function buildLocationFromPreset(preset) {
    const found = Location.lookup(preset.lookup);
    if (found) return found;

    const fallbacks = {
        Amsterdam: [52.3676, 4.9041, false, 'Europe/Amsterdam', 'Amsterdam', 'NL'],
        Rotterdam: [51.9244, 4.4777, false, 'Europe/Amsterdam', 'Rotterdam', 'NL'],
        'New York': [40.7128, -74.006, false, 'America/New_York', 'New York', 'US'],
        Jerusalem: [31.7683, 35.2137, true, 'Asia/Jerusalem', 'Jerusalem', 'IL'],
    };

    const fb = fallbacks[preset.lookup];
    if (fb) {
        return new Location(...fb);
    }

    return Location.lookup('London') || new Location(51.5074, -0.1278, false, 'Europe/London', 'London', 'GB');
}

export function getActiveLocationPreset() {
    const id = getActiveLocationId();
    if (id === 'geo' && customGeoLocation) {
        return customGeoLocation.preset;
    }
    return getLocationPreset(id) || getLocationPreset(inferDefaultLocationId());
}

/**
 * Hebcal Location for zmanim / candle lighting (respects diaspora vs Israel per preset).
 */
export function getHebcalLocation() {
    if (cachedHebcalLocation) return cachedHebcalLocation;

    const id = getActiveLocationId();

    if (id === 'geo') {
        if (!customGeoLocation) {
            loadStoredGeoLocation();
        }
        if (customGeoLocation) {
            cachedHebcalLocation = customGeoLocation.location;
            return cachedHebcalLocation;
        }
    }

    const preset = getLocationPreset(id) || getLocationPreset(inferDefaultLocationId());
    cachedHebcalLocation = buildLocationFromPreset(preset);
    return cachedHebcalLocation;
}

export function useIsraelCalendar() {
    const preset = getActiveLocationPreset();
    return Boolean(preset?.isIsrael);
}

/** nl-NL for Netherlands/Belgium presets or Dutch browser; otherwise en-US */
export function getDisplayLocale() {
    const preset = getActiveLocationPreset();
    if (preset?.country === 'NL' || preset?.country === 'BE') {
        return 'nl-NL';
    }
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('nl')) {
        return 'nl-NL';
    }
    return 'en-US';
}

export function formatCalendarTime(date) {
    if (!date) return 'N/A';
    return date.toLocaleTimeString(getDisplayLocale(), {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatCalendarDate(date) {
    if (!date) return 'N/A';
    return date.toLocaleDateString(getDisplayLocale(), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export function getLocationDisplayName() {
    const preset = getActiveLocationPreset();
    if (!preset) return '';
    const nl = getDisplayLocale() === 'nl-NL';
    return nl ? preset.nameNl : preset.nameEn;
}

export function getCalendarLabels() {
    const nl = getDisplayLocale() === 'nl-NL';
    if (nl) {
        return {
            timesTitle: 'Tijden',
            locationLabel: 'Locatie',
            useMyLocation: 'Mijn locatie',
            candleLighting: 'Kaars aansteken',
            havdalah: 'Havdalah',
            sunrise: 'Zonsopgang',
            sunset: 'Zonsondergang',
            nextShabbat: 'Komende Shabbat',
            shabbat: 'Shabbat',
            parashat: 'Parashat',
            haftarah: 'Haftarah',
            roshChodesh: 'Rosh Chodesh',
            thisMonth: 'Deze maand',
            dateInfo: 'Datum',
            gregorian: 'Gregoriaans',
            hebrewLatin: 'Hebreeuws (Latijn)',
            hebrewYear: 'Hebreeuws jaar',
            geoDenied: 'Locatie geweigerd — kies een stad uit de lijst.',
            geoUnavailable: 'Locatie niet beschikbaar.',
        };
    }
    return {
        timesTitle: 'Times',
        locationLabel: 'Location',
        useMyLocation: 'Use my location',
        candleLighting: 'Candle lighting',
        havdalah: 'Havdalah',
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        nextShabbat: 'Upcoming Shabbat',
        shabbat: 'Shabbat',
        parashat: 'Parashat',
        haftarah: 'Haftarah',
        roshChodesh: 'Rosh Chodesh',
        thisMonth: 'This Month',
        dateInfo: 'Date Info',
        gregorian: 'Gregorian',
        hebrewLatin: 'Hebrew (Latin)',
        hebrewYear: 'Hebrew year',
        geoDenied: 'Location denied — choose a city from the list.',
        geoUnavailable: 'Location unavailable.',
    };
}

/** Restore persisted location on module load */
export function initCalendarLocation() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'geo') {
            loadStoredGeoLocation();
        } else if (stored && getLocationPreset(stored)) {
            activePresetId = stored;
        }
    } catch {
        /* ignore */
    }
}

initCalendarLocation();
