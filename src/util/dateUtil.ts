import { addMinutes, isValid as isValidDate, parse as parseDate, parseISO as parseIsoDate } from 'date-fns';
import { format as formatDate } from 'date-fns-tz';
// add to package.json if needed: "jstimezonedetect": "^1.0.7"
// import jstz from 'jstimezonedetect';

import { KibaException } from '../model';

export const JSON_DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX';

export const dateFromString = (dateString: string, format?: string): Date => {
  let parsedDate: Date | undefined;
  if (!format) {
    parsedDate = parseIsoDate(dateString);
  } else {
    try {
      parsedDate = parseDate(dateString, format, new Date());
    } catch {
      // no-op
    }
  }
  if (!parsedDate || !isValidDate(parsedDate)) {
    throw new KibaException(`Invalid date string ${dateString} passed to dateFromString`);
  }
  return parsedDate;
};

export const dateToString = (date: Date, format: string = JSON_DATE_FORMAT, convertToUtc = false): string => {
  let finalDate = date;
  if (convertToUtc) {
    finalDate = addMinutes(finalDate, finalDate.getTimezoneOffset());
  }
  const formattedDate = formatDate(finalDate, format, convertToUtc ? { timeZone: 'UTC' } : {});
  return formattedDate;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date.getTime());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const dateToRelativeString = (date: Date): string => {
  const seconds = Math.floor((new Date().valueOf() - date.valueOf()) / 1000);
  let intervalType: string;

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    intervalType = 'year';
  } else {
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      intervalType = 'month';
    } else {
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        intervalType = 'day';
      } else {
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
          intervalType = 'hour';
        } else {
          interval = Math.floor(seconds / 60);
          if (interval >= 1) {
            intervalType = 'minute';
          } else {
            interval = seconds;
            intervalType = 'second';
          }
        }
      }
    }
  }
  if (interval > 1 || interval === 0) {
    intervalType += 's';
  }
  return `${interval} ${intervalType} ago`;
};

export const dateToRelativeShortString = (date: Date): string => {
  const seconds = Math.floor((new Date().valueOf() - date.valueOf()) / 1000);
  let intervalType: string;

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    intervalType = 'y';
  } else {
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      intervalType = 'm';
    } else {
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        intervalType = 'd';
      } else {
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
          intervalType = 'h';
        } else {
          interval = Math.floor(seconds / 60);
          if (interval >= 1) {
            intervalType = 'm';
          } else {
            interval = seconds;
            intervalType = 's';
          }
        }
      }
    }
  }
  return `${interval}${intervalType} ago`;
};

// export const guessTimezone = (): string => {
//   if (Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone) {
//     return Intl.DateTimeFormat().resolvedOptions().timeZone;
//   }
//   return jstz.determine().name();
// }
