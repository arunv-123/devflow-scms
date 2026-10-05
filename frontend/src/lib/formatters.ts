/**
 * DevFlow Application Localization & Formatting Utilities
 * Supports dynamic global organization currency and timezone settings.
 */
import React from 'react';

export type CurrencyConfig = {
  code: string;
  locale: string;
  symbol: string;
};

export const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', locale: 'en-IN', symbol: '₹' },
  USD: { code: 'USD', locale: 'en-US', symbol: '$' },
  EUR: { code: 'EUR', locale: 'de-DE', symbol: '€' },
  GBP: { code: 'GBP', locale: 'en-GB', symbol: '£' },
  AED: { code: 'AED', locale: 'en-AE', symbol: 'د.إ' },
  SAR: { code: 'SAR', locale: 'en-SA', symbol: '﷼' },
  AUD: { code: 'AUD', locale: 'en-AU', symbol: 'A$' },
  CAD: { code: 'CAD', locale: 'en-CA', symbol: 'C$' },
  JPY: { code: 'JPY', locale: 'ja-JP', symbol: '¥' },
  CNY: { code: 'CNY', locale: 'zh-CN', symbol: '¥' },
};

export const DEFAULT_CURRENCY = 'INR (₹) — Indian Rupee';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata (IST, UTC+05:30)';

let activeCurrencyCode = 'INR';
let activeIANAProperty = 'Asia/Kolkata';

export function parseCurrencyCode(currencyInput?: string): string {
  if (!currencyInput) return 'INR';
  const match = currencyInput.match(/([A-Z]{3})/);
  if (match && CURRENCY_MAP[match[1]]) {
    return match[1];
  }
  return 'INR';
}

export function parseIANATimezone(timezoneInput?: string): string {
  if (!timezoneInput) return 'Asia/Kolkata';
  const trimmed = timezoneInput.trim();
  const candidate = trimmed.split(' ')[0];
  try {
    Intl.DateTimeFormat(undefined, { timeZone: candidate });
    return candidate;
  } catch (e) {
    return 'Asia/Kolkata';
  }
}

// Load initial settings from localStorage if present
if (typeof window !== 'undefined') {
  const savedCurr = localStorage.getItem('devflow_app_currency');
  const savedTz = localStorage.getItem('devflow_app_timezone');
  if (savedCurr) activeCurrencyCode = parseCurrencyCode(savedCurr);
  if (savedTz) activeIANAProperty = parseIANATimezone(savedTz);
}

export function updateAppFormatting(currencySetting?: string, timezoneSetting?: string) {
  if (currencySetting) {
    activeCurrencyCode = parseCurrencyCode(currencySetting);
    if (typeof window !== 'undefined') {
      localStorage.setItem('devflow_app_currency', currencySetting);
    }
  }
  if (timezoneSetting) {
    activeIANAProperty = parseIANATimezone(timezoneSetting);
    if (typeof window !== 'undefined') {
      localStorage.setItem('devflow_app_timezone', timezoneSetting);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('devflow_formatting_updated'));
  }
}

export function getActiveCurrencyCode(): string {
  return activeCurrencyCode;
}

export function getActiveIANATimezone(): string {
  return activeIANAProperty;
}

/**
 * Format numeric monetary amounts into the active organization currency
 */
export function formatCurrency(amount: number | null | undefined, currencySetting?: string): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    const code = currencySetting ? parseCurrencyCode(currencySetting) : activeCurrencyCode;
    const config = CURRENCY_MAP[code] || CURRENCY_MAP.INR;
    return `${config.symbol}0`;
  }
  const code = currencySetting ? parseCurrencyCode(currencySetting) : activeCurrencyCode;
  const config = CURRENCY_MAP[code] || CURRENCY_MAP.INR;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Format ISO string or Date into DD-MM-YYYY in the organization's selected timezone
 */
export function formatDate(dateInput: string | Date | number | null | undefined, timezoneSetting?: string): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' && dateInput.includes('-') && dateInput.length === 10
    ? new Date(`${dateInput}T00:00:00Z`)
    : new Date(dateInput);

  if (isNaN(date.getTime())) return String(dateInput);

  const tz = timezoneSetting ? parseIANATimezone(timezoneSetting) : activeIANAProperty;

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const year = parts.find((p) => p.type === 'year')?.value || '1970';

    return `${day}-${month}-${year}`;
  } catch (e) {
    const d = date.getUTCDate().toString().padStart(2, '0');
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}-${m}-${y}`;
  }
}

/**
 * Format ISO string or Date into DD-MM-YYYY, hh:mm A in the organization's selected timezone
 */
export function formatDateTime(dateInput: string | Date | number | null | undefined, timezoneSetting?: string): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const tz = timezoneSetting ? parseIANATimezone(timezoneSetting) : activeIANAProperty;

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const year = parts.find((p) => p.type === 'year')?.value || '1970';
    let hour = parts.find((p) => p.type === 'hour')?.value || '12';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const dayPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value || 'AM').toUpperCase();

    return `${day}-${month}-${year}, ${hour}:${minute} ${dayPeriod}`;
  } catch (e) {
    return date.toISOString();
  }
}

/**
 * Format Time string or Date into hh:mm A in the organization's selected timezone
 */
export function formatTime(dateInput: string | Date | number | null | undefined, timezoneSetting?: string): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const tz = timezoneSetting ? parseIANATimezone(timezoneSetting) : activeIANAProperty;

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return formatter.format(date);
  } catch (e) {
    return date.toLocaleTimeString();
  }
}

/**
 * React hook to listen for active formatting changes and automatically re-render components
 */
export function useFormatting() {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener('devflow_formatting_updated', handleUpdate);
    return () => window.removeEventListener('devflow_formatting_updated', handleUpdate);
  }, []);

  return {
    formatCurrency,
    formatDate,
    formatDateTime,
    formatTime,
    activeCurrencyCode,
    activeIANAProperty,
  };
}
