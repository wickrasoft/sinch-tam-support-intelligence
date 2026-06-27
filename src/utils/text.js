import { normalizeTamRegion } from './tamAvailability';

export function accountWord(count) {
  const n = Number(count) || 0;
  return n === 1 ? 'Account' : 'Accounts';
}

export function formatAccountCount(count) {
  const n = Number(count) || 0;
  return `${n} ${accountWord(n)}`;
}

export function formatTamDisplayName(name, region) {
  if (!name) return '';
  if (!region) return name;
  return `${name} (${normalizeTamRegion(region)})`;
}

const COUNTRY_FLAGS = {
  'United States': '🇺🇸',
  Canada: '🇨🇦',
  Mexico: '🇲🇽',
  Brazil: '🇧🇷',
  India: '🇮🇳',
  Singapore: '🇸🇬',
  China: '🇨🇳',
  Australia: '🇦🇺',
  Sweden: '🇸🇪',
  'United Kingdom': '🇬🇧',
  'United Arab Emirates': '🇦🇪',
};

export function countryFlag(country) {
  if (!country) return '';
  return COUNTRY_FLAGS[country] ?? '';
}
