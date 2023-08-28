import { LocalTimeUnit, getTimeUnitParts } from 'vega-lite/build/src/timeunit';

export function isISODateTimeString(input: string): boolean {
  const isoDateTimeRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/;

  return isoDateTimeRegex.test(input);
}

export function isIntegerTimestamp(
  input: number,
  isMultiplied = false
): boolean {
  const newInteger = isMultiplied ? input * 1000 : input;

  const date = new Date(newInteger);

  return date instanceof Date && !isNaN(date.getTime());
}

export function getFieldNameAndTimeUnit(timedFieldName: string): {
  fieldName: string;
  timeunit: LocalTimeUnit[];
} {
  const arr = timedFieldName.split('_');
  const fieldName = arr.slice(1).join('_');
  const timeunit = arr[0];

  let parts = getTimeUnitParts(timeunit as any);

  if (parts.includes('day')) {
    // Make sure it has only parts as well
    const replaced = timeunit.replace('dayofyear', '----');
    if (!replaced.includes('day')) {
      parts = parts.filter(p => p !== 'day');
    }
  }

  if (parts.includes('seconds')) {
    // Make sure it has only parts as well
    const replaced = timeunit.replace('milliseconds', '----');
    if (!replaced.includes('seconds')) {
      parts = parts.filter(p => p !== 'seconds');
    }
  }

  return {
    fieldName,
    timeunit: parts
  };
}
