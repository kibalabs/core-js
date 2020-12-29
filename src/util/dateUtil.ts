import { parseISO as parseIsoDate, parse as parseDate, isValid as isValidDate, addMinutes } from 'date-fns';
import { format as formatDate } from 'date-fns-tz'
// add to package.json if needed: "jstimezonedetect": "^1.0.7"
// import jstz from 'jstimezonedetect';

import { KibaException } from '../model';

export const JSON_DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX';

export const dateFromString = (dateString: string, format?: string): Date => {
  var parsedDate: Date | undefined;
  if (!format) {
    parsedDate = parseIsoDate(dateString);
  } else {
    try {
      parsedDate = parseDate(dateString, format, new Date());
    } catch {}
  }
  if (!parsedDate || !isValidDate(parsedDate)) {
    throw new KibaException(`Invalid date string ${dateString} passed to dateFromString`);
  }
  return parsedDate;
};

export const dateToString = (date: Date, format: string = JSON_DATE_FORMAT, convertToUtc: boolean = false): string => {
  var finalDate = date;
  if (convertToUtc) {
    finalDate = addMinutes(finalDate, finalDate.getTimezoneOffset());
  }
  const formattedDate = formatDate(finalDate, format, convertToUtc ? { timeZone: 'UTC' } : {});
  return formattedDate;
};

// export const guessTimezone = (): string => {
//   if (Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone) {
//     return Intl.DateTimeFormat().resolvedOptions().timeZone;
//   }
//   return jstz.determine().name();
// }
