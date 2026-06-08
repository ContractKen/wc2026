import type { TimezoneOption } from '../lib/types'

// Curated, friendly presets. 'auto' resolves to the device's zone at runtime.
export const TIMEZONES: TimezoneOption[] = [
  { id: 'auto', abbr: 'AUTO', label: 'Auto (your device)' },
  { id: 'Asia/Kolkata', abbr: 'IST', label: 'India — IST' },
  { id: 'America/New_York', abbr: 'ET', label: 'US East — ET (EST/EDT)' },
  { id: 'America/Chicago', abbr: 'CT', label: 'US Central — CT' },
  { id: 'America/Denver', abbr: 'MT', label: 'US Mountain — MT' },
  { id: 'America/Los_Angeles', abbr: 'PT', label: 'US Pacific — PT (PST/PDT)' },
  { id: 'America/Mexico_City', abbr: 'CST', label: 'Mexico City' },
  { id: 'America/Sao_Paulo', abbr: 'BRT', label: 'Brazil — BRT' },
  { id: 'Europe/London', abbr: 'BST', label: 'UK — GMT/BST' },
  { id: 'Europe/Paris', abbr: 'CET', label: 'Central Europe — CET/CEST' },
  { id: 'Africa/Lagos', abbr: 'WAT', label: 'West Africa — WAT' },
  { id: 'Asia/Dubai', abbr: 'GST', label: 'Gulf — GST' },
  { id: 'Asia/Tokyo', abbr: 'JST', label: 'Japan/Korea — JST/KST' },
  { id: 'Australia/Sydney', abbr: 'AEST', label: 'Australia East — AEST/AEDT' },
]

export function resolveZone(id: string): string {
  if (id === 'auto') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
  return id
}
