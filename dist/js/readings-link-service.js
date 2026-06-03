/**
 * Reading schedule link generation — category + Sefaria URL first, display text last.
 */

export const OFFLINE_TALMUD_TRACTATES = new Set([
  'berakhot', 'beitzah', 'chagigah', 'chullin', 'eruvin', 'gittin',
  'ketubot', 'kiddushin', 'megillah', 'menachot', 'moed_katan', 'nazir',
  'nedarim', 'pesachim', 'rosh_hashanah', 'shekalim', 'shabbat', 'sotah',
  'sukkah', 'taanit', 'yevamot', 'yoma', 'zevachim',
]);

export const OFFLINE_MISHNAH_TRACTATES = new Set([
  'arakhin', 'avodah_zarah', 'avot', 'bava_batra', 'bava_kamma', 'bava_metzia',
  'beitzah', 'bekhorot', 'berakhot', 'bikkurim', 'chagigah', 'challah', 'chullin',
  'demai', 'eduyot', 'eruvin', 'gittin', 'horayot', 'kelim', 'keritot', 'ketubot',
  'kiddushin', 'kilayim', 'kinnim', 'maaser_sheni', 'maasrot', 'makhshirin', 'makkot',
  'megillah', 'meilah', 'menachot', 'middot', 'mikvaot', 'moed_katan', 'nazir',
  'nedarim', 'negaim', 'niddah', 'oholot', 'orlah', 'parah', 'peah', 'pesachim',
  'rosh_hashanah', 'sanhedrin', 'shabbat', 'shekalim', 'sheviit', 'shevuot', 'sotah',
  'sukkah', 'taanit', 'tahorot', 'tamid', 'temurah', 'terumot', 'tevul_yom', 'uktzin',
  'yadayim', 'yevamot', 'yoma', 'zavim', 'zevachim',
]);

export const OFFLINE_RAMBAM_BOOKS = new Set([
  'acquisition', 'agents_and_partners', 'appraisals_and_devoted_property', 'blessings',
  'borrowing_and_deposit', 'circumcision', 'creditor_and_debtor',
  'daily_offerings_and_additional_offerings', 'damages', 'damages_to_property',
  'defilement_by_a_corpse', 'defilement_by_leprosy', 'defilement_of_foods', 'diverse_species',
  'divorce', 'eruvin', 'fasts', 'festival_offering', 'firstlings', 'forbidden_foods',
  'forbidden_intercourse', 'foreign_worship_and_customs_of_the_nations',
  'foundations_of_the_torah', 'fringes', 'gifts_to_the_poor', 'heave_offerings', 'hiring',
  'holiness', 'human_dispositions', 'immersion_pools', 'inheritances', 'judges', 'judgments',
  'kings_and_wars', 'knowledge', 'leavened_and_unleavened_bread', 'love', 'marriage',
  'mourning', 'murderer_and_the_preservation_of_life', 'nazariteship', 'neighbors', 'oaths',
  'offerings_for_those_with_incomplete_atonement', 'offerings_for_unintentional_transgressions',
  'one_who_injures_a_person_or_property', 'other_sources_of_defilement',
  'ownerless_property_and_gifts', 'paschal_offering', 'plaintiff_and_defendant',
  'prayer_and_the_priestly_blessing', 'purity', 'reading_the_shema', 'rebels', 'red_heifer',
  'repentance', 'rest_on_a_holiday', 'rest_on_the_tenth_of_tishrei', 'ritual_slaughter',
  'robbery_and_lost_property', 'sabbath', 'sabbatical_year_and_the_jubilee', 'sacrifices',
  'sacrifices_rendered_unfit', 'sales', 'sanctification_of_the_new_month',
  'scroll_of_esther_and_hanukkah', 'seeds', 'sefer_hamitzvot_negative_commandments',
  'sefer_hamitzvot_positive_commandments', 'service', 'service_on_the_day_of_atonement',
  'sheqel_dues', 'shofar,_sukkah_and_lulav', 'slaves', 'substitution',
  'tefillin,_mezuzah_and_the_torah_scroll', 'testimony', 'the_chosen_temple', 'theft',
  'the_sanhedrin_and_the_penalties_within_their_jurisdiction', 'things_forbidden_on_the_altar',
  'those_who_defile_bed_or_seat', 'times', 'tithes', 'torah_study', 'trespass', 'utterances',
  'vessels', 'virgin_maiden', 'vows', 'woman_suspected_of_infidelity', 'women',
]);

export function slugifyTractate(name) {
  return name.trim().toLowerCase().replace(/ /g, '_');
}

export function cleanDisplayText(text) {
  if (!text) return '';
  let clean = text.replace(/<[^>]+>/g, ' ');
  const textarea = document.createElement('textarea');
  textarea.innerHTML = clean;
  clean = textarea.value;
  return clean.replace(/\s+/g, ' ').trim();
}

export function cleanSefariaUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '').split('?')[0];
}

export function sefariaExternalUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://www.sefaria.org/${url}`;
}

export function sefariaFallbackLink(sefariaUrl, label = 'Read on Sefaria →') {
  const href = sefariaExternalUrl(sefariaUrl);
  if (!href) return '';
  return `<a href="${href}" class="reading-link" target="_blank" rel="noopener">${label}</a>`;
}

export function isLikelyTanakhStudyLabel(displayText) {
  return (
    /\bseder\b/i.test(displayText) ||
    /^minor prophets\b/i.test(displayText) ||
    /^major prophets\b/i.test(displayText)
  );
}

export function sefariaUrlToTanakhReference(cleanUrl) {
  if (!cleanUrl || /^(Mishnah|Mishneh|Jerusalem|Shulchan|Arukh|Tanya)/i.test(cleanUrl)) {
    return null;
  }

  const crossChapter = cleanUrl.match(/^([^./]+)\.(\d+)\.(\d+)-(\d+)\.(\d+)$/);
  if (crossChapter) {
    const book = crossChapter[1].replace(/_/g, ' ');
    return `${book} ${crossChapter[2]}:${crossChapter[3]}`;
  }

  const chapterVerse = cleanUrl.match(/^([^./]+)\.(\d+)\.(\d+)(?:-(\d+))?$/);
  if (chapterVerse) {
    const book = chapterVerse[1].replace(/_/g, ' ');
    let reference = `${book} ${chapterVerse[2]}:${chapterVerse[3]}`;
    if (chapterVerse[4]) reference += `-${chapterVerse[4]}`;
    return reference;
  }

  const chapterOnly = cleanUrl.match(/^([^./]+)\.(\d+)$/);
  if (chapterOnly) {
    const book = chapterOnly[1].replace(/_/g, ' ');
    return `${book} ${chapterOnly[2]}`;
  }

  return null;
}

function tanachLink(href) {
  return `<a href="${href}" class="reading-link">Read in our Tanach →</a>`;
}

function talmudLink(tractate, pageNum, side = 'a') {
  return `<a href="/talmud.html?tractate=${encodeURIComponent(tractate)}&page=${pageNum}${side}" class="reading-link">Read in our Talmud →</a>`;
}

function mishnahLink(tractate, chapter) {
  return `<a href="/mishnah.html?tractate=${encodeURIComponent(tractate)}&chapter=${chapter}" class="reading-link">Read in our Mishnah →</a>`;
}

function rambamLink(bookId, chapter) {
  return `<a href="/rambam.html?book=${encodeURIComponent(bookId)}&chapter=${chapter}" class="reading-link">Read in our Rambam →</a>`;
}

function rambamPageLink(bookId, page) {
  return `<a href="/rambam.html?book=${encodeURIComponent(bookId)}&page=${page}" class="reading-link">Read in our Rambam →</a>`;
}

export function getTalmudLink(displayText, sefariaUrl) {
  const cleanUrl = cleanSefariaUrl(sefariaUrl);
  if (cleanUrl && !cleanUrl.includes('Jerusalem_Talmud')) {
    const urlMatch = cleanUrl.match(/^([A-Za-z_]+)\.(\d+)([ab])?$/);
    if (urlMatch) {
      const tractate = slugifyTractate(urlMatch[1]);
      const pageNum = urlMatch[2];
      const side = urlMatch[3] || 'a';
      if (OFFLINE_TALMUD_TRACTATES.has(tractate)) {
        return talmudLink(tractate, pageNum, side);
      }
      return null;
    }
  }

  if (!isLikelyTanakhStudyLabel(displayText)) {
    const talmudMatch = displayText.match(/^([A-Za-z\s]+)\s+(\d+)([ab])?$/i);
    if (talmudMatch) {
      const tractate = slugifyTractate(talmudMatch[1]);
      if (OFFLINE_TALMUD_TRACTATES.has(tractate)) {
        return talmudLink(tractate, talmudMatch[2], talmudMatch[3] || 'a');
      }
    }
  }

  return null;
}

export function getMishnahLink(displayText, sefariaUrl) {
  const cleanUrl = cleanSefariaUrl(sefariaUrl);
  if (cleanUrl.includes('Mishnah_')) {
    const match = cleanUrl.match(/Mishnah_([A-Za-z_]+)\.(\d+)\.(\d+)(?:-\d+)?/);
    if (match) {
      const tractate = match[1].toLowerCase();
      const chapter = match[2];
      if (OFFLINE_MISHNAH_TRACTATES.has(tractate)) {
        return mishnahLink(tractate, chapter);
      }
      return null;
    }
  }

  const mishnahText = displayText.replace(/^Mishnah?\s+/i, '');
  const mishnahMatch = mishnahText.match(/^([A-Za-z\s]+)\s+(\d+):(\d+)(?:-\d+)?$/i);
  if (mishnahMatch) {
    const tractate = slugifyTractate(mishnahMatch[1]);
    if (OFFLINE_MISHNAH_TRACTATES.has(tractate)) {
      return mishnahLink(tractate, mishnahMatch[2]);
    }
  }

  return null;
}

export function getRambamLink(displayText, sefariaUrl) {
  const cleanUrl = cleanSefariaUrl(sefariaUrl);

  if (
    cleanUrl.includes('Sefer_HaMitzvot') ||
    cleanUrl.includes('Positive_Commandments') ||
    cleanUrl.includes('Negative_Commandments')
  ) {
    const match = cleanUrl.match(
      /Sefer_HaMitzvot[,_\s]+(Positive|Negative)[_\s]+Commandments?\.(\d+)/i,
    );
    if (match) {
      const type = match[1].toLowerCase();
      const bookId = `sefer_hamitzvot_${type}_commandments`;
      const page = Math.ceil(parseInt(match[2], 10) / 50);
      if (OFFLINE_RAMBAM_BOOKS.has(bookId)) return rambamPageLink(bookId, page);
    }
    return null;
  }

  if (cleanUrl.includes('Mishneh_Torah')) {
    const match = cleanUrl.match(/Mishneh_Torah,_([A-Za-z_,]+)\.(\d+)/);
    if (match) {
      const book = match[1].toLowerCase();
      const chapter = match[2];
      if (OFFLINE_RAMBAM_BOOKS.has(book)) return rambamLink(book, chapter);
      return null;
    }
  }

  if (
    displayText.includes('Positive Mitzvot') ||
    displayText.includes('Negative Mitzvot') ||
    displayText.includes('Sefer HaMitzvot')
  ) {
    const mitzvahMatch = displayText.match(/(Positive|Negative)\s+Mitzvot\s+(\d+)/i);
    if (mitzvahMatch) {
      const bookId = `sefer_hamitzvot_${mitzvahMatch[1].toLowerCase()}_commandments`;
      const page = Math.ceil(parseInt(mitzvahMatch[2], 10) / 50);
      if (OFFLINE_RAMBAM_BOOKS.has(bookId)) return rambamPageLink(bookId, page);
    }
    return null;
  }

  if (
    (displayText.includes('Torah') || displayText.includes('Mishneh')) &&
    !displayText.includes('Positive Mitzvot') &&
    !displayText.includes('Negative Mitzvot')
  ) {
    const rambamMatch = displayText.match(/^(.+?)\s+(\d+)(?::\d+)?(?:-\d+)?$/);
    if (rambamMatch) {
      const bookId = rambamMatch[1]
        .trim()
        .replace(/^Mishneh Torah,?\s*/i, '')
        .toLowerCase()
        .replace(/ /g, '_')
        .replace(/'/g, '')
        .replace(/,/g, '');
      if (OFFLINE_RAMBAM_BOOKS.has(bookId)) return rambamLink(bookId, rambamMatch[2]);
    }
  }

  return null;
}

export async function getTanakhLink(displayText, sefariaUrl, generateReaderLink) {
  const cleanText = cleanDisplayText(displayText);

  let internalUrl = await generateReaderLink(cleanText);
  if (internalUrl) return tanachLink(internalUrl);

  const cleanUrl = cleanSefariaUrl(sefariaUrl);
  if (cleanUrl) {
    const tanakhRef = sefariaUrlToTanakhReference(cleanUrl);
    if (tanakhRef) {
      internalUrl = await generateReaderLink(tanakhRef);
      if (internalUrl) return tanachLink(internalUrl);
    }

    const urlMatch = cleanUrl.match(/^([^./]+)\.(\d+)(?:\.(\d+)(?:-(?:(\d+)\.)?(\d+))?)?$/);
    if (urlMatch) {
      let book = urlMatch[1].replace(/_/g, ' ');
      book = book.replace(/\b([IVX]+)_([A-Z])/g, '$1 $2');
      const chapter = urlMatch[2];
      const verse = urlMatch[3];
      const endVerse = urlMatch[5];
      const chapterNum = parseInt(chapter, 10);
      if (chapterNum >= 1) {
        let reference = `${book} ${chapter}`;
        if (verse) {
          reference += `:${verse}`;
          if (endVerse && !urlMatch[4]) reference += `-${endVerse}`;
        }
        internalUrl = await generateReaderLink(reference);
        if (internalUrl) return tanachLink(internalUrl);
      }
    }
  }

  return '';
}

export async function getTorahLink(parashatText, generateReaderLink, getParashatInfo, getBookInfo) {
  if (!parashatText || parashatText === 'N/A') return '';

  const directUrl = await generateReaderLink(parashatText);
  if (directUrl) return tanachLink(directUrl);

  const parashatInfo = getParashatInfo(parashatText);
  if (parashatInfo) {
    const bookInfo = getBookInfo(parashatInfo.book);
    if (bookInfo) {
      const url = `/reader.html?book=${bookInfo.id}&category=${bookInfo.category}&chapter=${parashatInfo.chapter}`;
      return tanachLink(url);
    }
  }

  return '';
}

export async function getHaftarahLink(haftarahText, sefariaUrl, generateReaderLink) {
  if (!haftarahText || haftarahText === 'N/A') return '';

  const link = await getTanakhLink(haftarahText, sefariaUrl, generateReaderLink);
  if (link) return link;

  return sefariaFallbackLink(sefariaUrl);
}

function isTalmudItem(title, category) {
  return category === 'Talmud' || title === 'Daf Yomi' || title === 'Daf a Week';
}

function isMishnahItem(title, category) {
  return category === 'Mishnah' || title === 'Daily Mishnah' || title === 'Pirkei Avot';
}

function isRambamItem(title, category) {
  return (
    category === 'Halakhah' ||
    title === 'Daily Rambam' ||
    title === 'Daily Rambam (3 Chapters)' ||
    /mitzvot/i.test(title)
  );
}

function isTanakhItem(title, category) {
  return (
    category === 'Tanakh' ||
    title === '929' ||
    title === 'Tanakh Yomi' ||
    title === 'Nach Yomi' ||
    title === 'Psalms' ||
    title === 'Parashat Hashavua' ||
    title === 'Haftarah'
  );
}

/**
 * Main entry: use Sefaria category + URL before display-text guessing.
 */
export async function getReadingLink(item, deps) {
  const { generateReaderLink, getBookInfo, getParashatInfo } = deps;
  const title = item.title?.en || item.title || '';
  const displayText = cleanDisplayText(item.displayValue?.en || item.displayValue || '');
  const sefariaUrl = item.url || '';
  const category = item.category || '';

  if (title === 'Chok LeYisrael') {
    return getTorahLink(displayText, generateReaderLink, getParashatInfo, getBookInfo);
  }

  if (isTalmudItem(title, category)) {
    return getTalmudLink(displayText, sefariaUrl) || sefariaFallbackLink(sefariaUrl);
  }

  if (isMishnahItem(title, category)) {
    return getMishnahLink(displayText, sefariaUrl) || sefariaFallbackLink(sefariaUrl);
  }

  if (isRambamItem(title, category)) {
    return getRambamLink(displayText, sefariaUrl) || sefariaFallbackLink(sefariaUrl);
  }

  if (isTanakhItem(title, category)) {
    const link = await getTanakhLink(displayText, sefariaUrl, generateReaderLink);
    return link || sefariaFallbackLink(sefariaUrl);
  }

  const tanakhLinkResult = await getTanakhLink(displayText, sefariaUrl, generateReaderLink);
  if (tanakhLinkResult) return tanakhLinkResult;

  return (
    getTalmudLink(displayText, sefariaUrl) ||
    getMishnahLink(displayText, sefariaUrl) ||
    getRambamLink(displayText, sefariaUrl) ||
    sefariaFallbackLink(sefariaUrl)
  );
}
