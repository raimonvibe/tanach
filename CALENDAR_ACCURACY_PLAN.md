# Calendar Data Accuracy Implementation Plan

## Current Issues

The calendar currently displays **static/mock data** for:
- ❌ Weekly Torah portion (Parashat) - always shows "Bereshit"
- ❌ Haftarah reading - always shows "Yeshayahu 42:5-43:10"
- ❌ Rosh Chodesh - always shows "N/A"
- ❌ Candle lighting times - always shows "18:30"
- ❌ Havdalah times - always shows "19:30"
- ❌ Sunrise/Sunset - always shows "07:15" / "17:45"
- ✅ Jewish date conversion - **already accurate** (uses @hebcal/core)

**Problem:** Times and readings don't change based on the actual date, month, or location.

---

## Solution Overview

Use the **@hebcal/core** library (already installed) and add **@hebcal/leyning** for accurate, dynamic data.

### Required Packages

1. **@hebcal/core** (v5.10.1) - ✅ Already installed
   - Hebrew calendar calculations
   - Holiday detection
   - Candle lighting/Havdalah times
   - Zmanim (halachic times)
   - Location-based calculations

2. **@hebcal/leyning** (v9.2.4) - ⚠️ Needs to be installed
   - Torah reading schedules (Parashat)
   - Haftarah readings
   - Holiday Torah readings
   - Aliyot (Torah portion divisions)

---

## Implementation Plan

### Phase 1: Install Dependencies ⏱️ 5 minutes

```bash
npm install @hebcal/leyning
```

Update package.json to include @hebcal/leyning (~9.2.4)

---

### Phase 2: Configure Location ⏱️ 15 minutes

**File:** `src/server.js`

#### Option A: Use Built-in City Database (Recommended)
```javascript
const { Location } = require('@hebcal/core');

// Hebcal has Amsterdam in its database
const LOCATION = Location.lookup('Amsterdam');
```

#### Option B: Use Custom Coordinates (If Amsterdam not in database)
```javascript
const { Location } = require('@hebcal/core');

// Amsterdam coordinates
const LOCATION = new Location(
  52.3676,      // latitude
  4.9041,       // longitude
  false,        // isIsrael
  'Europe/Amsterdam', // timezone
  'Amsterdam',  // city name
  'NL',         // country code
  'nl'          // geo ID
);
```

**Why Amsterdam?**
- Most users likely in Netherlands
- Can make configurable later if needed

---

### Phase 3: Fix Weekly Torah Readings ⏱️ 30 minutes

**File:** `src/server.js` - Update `/api/calendar/weekly` endpoint

**Current Code (Mock Data):**
```javascript
app.get('/api/calendar/weekly', async (req, res) => {
    try {
        const weeklyData = {
            parashat: 'Bereshit',
            haftarah: 'Yeshayahu 42:5-43:10',
            roshChodesh: null,
            specialShabbat: null
        };
        res.json(weeklyData);
    } catch (error) {
        console.error('Weekly API error:', error);
        res.status(500).json({ error: 'Kon week informatie niet laden' });
    }
});
```

**New Code (Dynamic Data):**
```javascript
const { HebrewCalendar, HDate, Location, Event } = require('@hebcal/core');
const { Leyning, formatAliyahWithBook } = require('@hebcal/leyning');

app.get('/api/calendar/weekly', async (req, res) => {
    try {
        const today = new Date();
        const hd = new HDate(today);

        // Get the upcoming Shabbat
        const saturday = hd.getSaturday();

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
            if (ev.getDesc() === 'Parashat HaShavua') {
                parashat = ev.render('en');

                // Get the Haftarah reading
                const leyning = Leyning.lookup(ev.getDate(), false); // false = diaspora
                if (leyning && leyning.haftara) {
                    haftarah = formatAliyahWithBook(leyning.haftara);
                }
            }
        }

        // Check for Rosh Chodesh
        const roshChodeshEvents = HebrewCalendar.calendar({
            start: today,
            end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            mask: Event.ROSH_CHODESH
        });

        if (roshChodeshEvents.length > 0) {
            const nextRoshChodesh = roshChodeshEvents[0];
            roshChodesh = nextRoshChodesh.render('en') + ' - ' +
                         nextRoshChodesh.getDate().greg().toLocaleDateString('nl-NL');
        }

        const weeklyData = {
            parashat: parashat || 'N/A',
            haftarah: haftarah || 'N/A',
            roshChodesh: roshChodesh,
            specialShabbat: null // Can add special Shabbat detection later
        };

        res.json(weeklyData);

    } catch (error) {
        console.error('Weekly API error:', error);
        res.status(500).json({ error: 'Kon week informatie niet laden' });
    }
});
```

---

### Phase 4: Fix Times (Candle Lighting, Havdalah, Sunrise, Sunset) ⏱️ 30 minutes

**File:** `src/server.js` - Update `/api/calendar/times` endpoint

**Current Code (Mock Data):**
```javascript
app.get('/api/calendar/times', async (req, res) => {
    try {
        const timesData = {
            candleLighting: '18:30',
            havdalah: '19:30',
            sunrise: '07:15',
            sunset: '17:45',
            location: 'Amsterdam, Nederland'
        };
        res.json(timesData);
    } catch (error) {
        console.error('Times API error:', error);
        res.status(500).json({ error: 'Kon tijden niet laden' });
    }
});
```

**New Code (Dynamic Calculations):**
```javascript
const { HebrewCalendar, Location, Zmanim } = require('@hebcal/core');

// Define location at the top of server.js
const AMSTERDAM = Location.lookup('Amsterdam') || new Location(
    52.3676, 4.9041, false, 'Europe/Amsterdam', 'Amsterdam', 'NL', 'nl'
);

app.get('/api/calendar/times', async (req, res) => {
    try {
        const today = new Date();
        const hd = new HDate(today);

        // Get the next Shabbat
        const saturday = hd.getSaturday();
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

        // Calculate sunrise and sunset for today
        const zmanim = new Zmanim(AMSTERDAM, today, false);
        const sunrise = zmanim.sunrise();
        const sunset = zmanim.sunset();

        const timesData = {
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

        res.json(timesData);

    } catch (error) {
        console.error('Times API error:', error);
        res.status(500).json({ error: 'Kon tijden niet laden' });
    }
});
```

---

### Phase 5: Update Calendar Month View ⏱️ 45 minutes

**File:** `src/server.js` - Update `getCalendarData()` and `getDayEvents()` functions

**Enhancements:**
1. Add actual holiday events from Hebcal
2. Include candle lighting times for each Shabbat
3. Show Torah readings on Shabbat days
4. Properly detect and display Rosh Chodesh

**Example Updates:**

```javascript
async function getCalendarData(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month - 1, daysInMonth);

    // Get all events for the month
    const monthEvents = HebrewCalendar.calendar({
        start: firstDay,
        end: lastDay,
        location: AMSTERDAM,
        candlelighting: true,
        havdalah: true,
        sedrot: true,
        il: false,
        mask: Event.MAJOR_HOLIDAY | Event.MINOR_HOLIDAY |
              Event.ROSH_CHODESH | Event.SPECIAL_SHABBAT
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
        days: days,
        monthName: firstDay.toLocaleDateString('nl-NL', { month: 'long' })
    };
}

function getDayEventsFromHebcal(date, allEvents) {
    const events = [];
    const dateString = date.toISOString().split('T')[0];

    for (const ev of allEvents) {
        const evDateString = ev.getDate().greg().toISOString().split('T')[0];

        if (evDateString === dateString) {
            const desc = ev.getDesc();
            let eventType = 'other';

            if (desc === 'Candle lighting') {
                eventType = 'candleLighting';
            } else if (desc === 'Havdalah') {
                eventType = 'havdalah';
            } else if (desc === 'Parashat HaShavua') {
                eventType = 'parashat';
            } else if (desc.includes('Rosh Chodesh')) {
                eventType = 'roshChodesh';
            } else if (ev.getFlags() & Event.MAJOR_HOLIDAY) {
                eventType = 'holiday';
            }

            events.push({
                name: ev.render('en'),
                type: eventType,
                time: ev.eventTime ? ev.eventTime.toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) : null
            });
        }
    }

    return events;
}
```

---

### Phase 6: Testing ⏱️ 30 minutes

**Test Cases:**

1. **Torah Reading Accuracy:**
   - Check current week's parashat matches official Jewish calendar
   - Verify Haftarah reading is correct
   - Test different times of year (check website: https://www.hebcal.com/sedrot/)

2. **Times Accuracy:**
   - Compare candle lighting time with Chabad Amsterdam: https://chabadamsterdamcenter.com/en/jewish-zmanim/
   - Verify sunrise/sunset matches astronomical calculations
   - Check Havdalah time (should be ~42-72 minutes after sunset depending on custom)

3. **Holiday Detection:**
   - Test during major holidays (Rosh Hashanah, Yom Kippur, Pesach, etc.)
   - Verify Rosh Chodesh detection
   - Check special Shabbat names

4. **Month Navigation:**
   - Test different months throughout the year
   - Verify events show on correct dates
   - Check leap years (Adar I and Adar II)

---

## Optional Enhancements (Future)

### 1. User Location Selection
Allow users to select their city/location:
- Add location selector dropdown
- Store preference in localStorage
- Support multiple cities

### 2. Candle Lighting Time Customization
Allow users to customize:
- Minutes before sunset for candle lighting (default: 18 minutes)
- Havdalah calculation method (42 min, 50 min, 72 min, or 3 stars)

### 3. Calendar Customization
- Toggle Israel vs. Diaspora calendar
- Show/hide different event types
- Export to Google Calendar/iCal

### 4. Additional Zmanim
Display more halachic times:
- Earliest Tallit time (Misheyakir)
- Latest Shema time
- Latest Shacharit time
- Mincha Gedola/Ketana
- Plag HaMincha

### 5. Triennial Torah Reading Cycle
Add support for triennial readings:
```bash
npm install @hebcal/triennial
```

---

## Time Estimates

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Install @hebcal/leyning | 5 minutes |
| 2 | Configure location | 15 minutes |
| 3 | Fix Torah readings | 30 minutes |
| 4 | Fix times (candle/havdalah/sunrise/sunset) | 30 minutes |
| 5 | Update calendar month view | 45 minutes |
| 6 | Testing | 30 minutes |
| **Total** | | **~2.5 hours** |

---

## Resources

### Documentation
- [@hebcal/core API](https://hebcal.github.io/api/core/)
- [@hebcal/leyning API](https://hebcal.github.io/api/leyning/)
- [Hebcal.com](https://www.hebcal.com/)
- [Location specification guide](https://www.hebcal.com/home/4912/specifying-a-location-for-jewish-calendar-apis)

### Reference Sites for Testing
- [Hebcal Shabbat Times](https://www.hebcal.com/shabbat/)
- [Chabad Amsterdam Zmanim](https://chabadamsterdamcenter.com/en/jewish-zmanim/)
- [Weekly Torah Portions](https://www.hebcal.com/sedrot/)

### Amsterdam Information
- **Coordinates:** 52.3676° N, 4.9041° E
- **Timezone:** Europe/Amsterdam (CET/CEST)
- **Elevation:** ~2 meters below sea level

---

## Implementation Checklist

- [ ] Phase 1: Install @hebcal/leyning package
- [ ] Phase 2: Configure Amsterdam location
- [ ] Phase 3: Implement dynamic Torah readings endpoint
- [ ] Phase 4: Implement dynamic times endpoint
- [ ] Phase 5: Update calendar month view with real events
- [ ] Phase 6: Test all functionality
- [ ] Update frontend to handle new data format (if needed)
- [ ] Document any configuration options
- [ ] Add error handling for API failures
- [ ] Consider caching strategy for performance

---

## Expected Results

After implementation, the calendar will show:

✅ **Accurate weekly Torah portion** (changes each week)
✅ **Correct Haftarah reading** (matches the parashat)
✅ **Real Rosh Chodesh dates** (1st of each Hebrew month)
✅ **Dynamic candle lighting times** (18 min before sunset on Friday)
✅ **Accurate Havdalah times** (after nightfall on Saturday)
✅ **Actual sunrise times** (changes daily based on Amsterdam location)
✅ **Actual sunset times** (changes daily based on Amsterdam location)
✅ **Jewish holidays** (Rosh Hashanah, Yom Kippur, Chanukah, Pesach, etc.)

All data will automatically update based on:
- Current date
- Amsterdam location
- Diaspora calendar rules
- Accurate astronomical calculations
