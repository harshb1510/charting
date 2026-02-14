import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const IST = "Asia/Kolkata";

export const FORMAT_TIME = "HH:mm";
export const FORMAT_TIME_SECONDS = "HH:mm:ss";
export const FORMAT_DATETIME = "DD MMM YYYY, HH:mm:ss";

export function nowIST(): dayjs.Dayjs {
  return dayjs().tz(IST);
}

export function formatTimeIST(utcSeconds: number): string {
  return dayjs.unix(utcSeconds).utc().tz(IST).format(FORMAT_TIME);
}

export function formatDateTimeIST(utcSeconds: number): string {
  return dayjs.unix(utcSeconds).utc().tz(IST).format(FORMAT_DATETIME);
}

export function formatLiveTimeIST(): string {
  return dayjs().tz(IST).format(FORMAT_TIME_SECONDS);
}

/** Convert chart Time (UTCTimestamp or BusinessDay) to dayjs in IST */
function timeToDayjsIST(time: number | { year: number; month: number; day: number } | string): dayjs.Dayjs {
  if (typeof time === "number") {
    return dayjs.unix(time).utc().tz(IST);
  }
  if (typeof time === "object" && time !== null && "year" in time && "month" in time && "day" in time) {
    const ms = Date.UTC(time.year, time.month - 1, time.day);
    return dayjs.unix(ms / 1000).tz(IST);
  }
  return dayjs(time as string).tz(IST);
}

/**
 * Format time axis tick mark in IST. Use as tickMarkFormatter in chart timeScale.
 */
export function formatTickMarkIST(
  time: number | { year: number; month: number; day: number } | string,
  tickMarkType: number
): string {
  const d = timeToDayjsIST(time);
  switch (tickMarkType) {
    case 0:
      return d.format("YYYY");
    case 1:
      return d.format("MMM");
    case 2:
      return d.format("D");
    case 3:
      return d.format("HH:mm");
    case 4:
      return d.format("HH:mm:ss");
    default:
      return d.format(FORMAT_TIME);
  }
}
