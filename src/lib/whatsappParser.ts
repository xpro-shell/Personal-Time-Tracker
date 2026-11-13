import JSZip from 'jszip';
import { ParsedWhatsAppResult, TimeEntry } from '../types/tracker';
import { WordRule } from './defaultWordList';

// Helper to generate a unique source hash to prevent duplicates
export function generateMessageHash(timestamp: string, rawText: string): string {
  let hash = 0;
  const str = `${timestamp.trim()}::${rawText.trim().toLowerCase()}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `wa_${Math.abs(hash).toString(16)}`;
}

// Check if message is a pure number, currency, or non-time note
export function isNumberOrAmountNote(text: string): boolean {
  const clean = text.trim();
  // Pure digits or decimal e.g. "450", "98.5"
  if (/^\d+(\.\d+)?$/.test(clean)) return true;
  // Currency or money amount e.g. "₹450", "$120", "rs 500", "450 bucks"
  if (/^([₹$€£]|rs\.?|inr)\s*\d+/i.test(clean) || /\d+\s*([₹$€£]|rs\.?|inr|bucks)/i.test(clean)) return true;
  // Phone numbers or isolated IDs
  if (/^\+?\d{8,15}$/.test(clean.replace(/\s+/g, ''))) return true;
  return false;
}

// Regex to capture WhatsApp line timestamps
// Examples:
// 13/10/26, 9:30 AM - Manav: S on Compiler
// [13/10/2026, 09:30:15] Manav: bon
// 10/13/2026, 2:15:30 PM: Manav: boff
// 13/10/2026, 14:30 - Manav: riyaz
const LINE_REGEX = /^(?:\[?(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]?(?:\s*-\s*|:\s*))([^:]+):\s*(.*)$/;

export async function parseWhatsAppFile(
  file: File,
  wordRules: WordRule[],
  existingHashes: Set<string>
): Promise<ParsedWhatsAppResult> {
  let text = '';

  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    // Find the first .txt file in the zip
    const txtFileName = Object.keys(zip.files).find((name) => name.endsWith('.txt'));
    if (!txtFileName) {
      throw new Error('No .txt chat export file found inside the .zip archive.');
    }
    text = await zip.files[txtFileName].async('string');
  } else {
    text = await file.text();
  }

  return parseWhatsAppText(text, wordRules, existingHashes);
}

export function parseWhatsAppText(
  text: string,
  wordRules: WordRule[],
  existingHashes: Set<string>
): ParsedWhatsAppResult {
  const lines = text.split(/\r?\n/);
  const rawEvents: Array<{
    dateStr: string;
    timeStr: string;
    isoTimestamp: string;
    sender: string;
    message: string;
    sourceHash: string;
  }> = [];

  const reviewItems: ParsedWhatsAppResult['reviewItems'] = [];
  let duplicateCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(LINE_REGEX);
    if (!match) continue;

    const [, datePart, timePart, sender, messageText] = match;
    const cleanMsg = messageText.trim();
    if (!cleanMsg) continue;

    // Convert to ISO timestamp
    const isoTimestamp = parseDateTimeToISO(datePart, timePart);
    if (!isoTimestamp) continue;

    const sourceHash = generateMessageHash(isoTimestamp, cleanMsg);

    // Duplicate check
    if (existingHashes.has(sourceHash)) {
      duplicateCount++;
      continue;
    }

    // Check if it's an arbitrary number, amount, or non-time note
    if (isNumberOrAmountNote(cleanMsg)) {
      reviewItems.push({
        rawMessage: cleanMsg,
        timestamp: isoTimestamp,
        reason: 'Detected numeric amount or note (never guessed)',
      });
      continue;
    }

    rawEvents.push({
      dateStr: datePart,
      timeStr: timePart,
      isoTimestamp,
      sender: sender.trim(),
      message: cleanMsg,
      sourceHash,
    });
  }

  // Sort raw events chronologically
  rawEvents.sort((a, b) => new Date(a.isoTimestamp).getTime() - new Date(b.isoTimestamp).getTime());

  const validEntries: ParsedWhatsAppResult['validEntries'] = [];
  const toFillGaps: ParsedWhatsAppResult['toFillGaps'] = [];

  // Match messages against word list
  let openStudy: { startTime: string; topic: string; sourceHash: string } | null = null;
  let openBreak: { startTime: string; topic: string; sourceHash: string } | null = null;

  for (let i = 0; i < rawEvents.length; i++) {
    const evt = rawEvents[i];
    const lower = evt.message.toLowerCase();

    // Check custom Word Rules first
    const matchedRule = wordRules.find((rule) => {
      const trig = rule.triggerWord.toLowerCase();
      return lower === trig || lower.startsWith(trig + ' ') || lower.endsWith(' ' + trig);
    });

    // Special handling for "S on [Topic]" or study starts with topic
    if (lower.startsWith('s on ') || lower.startsWith('study on ')) {
      const topic = evt.message.slice(evt.message.indexOf('on ') + 3).trim() || 'General Study';
      if (openStudy) {
        // Flag previous open study as missing off
        toFillGaps.push({
          timestamp: openStudy.startTime,
          description: `Study on "${openStudy.topic}" was started but no stop entry was found before next session.`,
          suspectedType: 'missing_off',
        });
      }
      openStudy = { startTime: evt.isoTimestamp, topic, sourceHash: evt.sourceHash };
      continue;
    }

    // Study off
    if (lower === 's off' || lower === 'study off') {
      if (openStudy) {
        const start = new Date(openStudy.startTime).getTime();
        const end = new Date(evt.isoTimestamp).getTime();
        const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

        validEntries.push({
          type: 'study',
          action: 'stop',
          topic: openStudy.topic,
          startTime: openStudy.startTime,
          endTime: evt.isoTimestamp,
          durationMinutes,
          source: 'whatsapp_import',
          sourceHash: openStudy.sourceHash,
        });
        openStudy = null;
      } else {
        toFillGaps.push({
          timestamp: evt.isoTimestamp,
          description: 'Logged "S off" with no matching start entry.',
          suspectedType: 'missing_on',
        });
      }
      continue;
    }

    // Break on / off
    if (matchedRule && matchedRule.category === 'break') {
      if (matchedRule.mappedAction === 'break_start' || matchedRule.mappedAction === 'break_meal') {
        if (openBreak) {
          toFillGaps.push({
            timestamp: openBreak.startTime,
            description: 'Break was started but no "break off" was found before another break.',
            suspectedType: 'missing_off',
          });
        }
        openBreak = { startTime: evt.isoTimestamp, topic: matchedRule.triggerWord, sourceHash: evt.sourceHash };
      } else if (matchedRule.mappedAction === 'break_stop') {
        if (openBreak) {
          const start = new Date(openBreak.startTime).getTime();
          const end = new Date(evt.isoTimestamp).getTime();
          const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

          validEntries.push({
            type: 'break',
            action: 'stop',
            topic: 'Break',
            startTime: openBreak.startTime,
            endTime: evt.isoTimestamp,
            durationMinutes,
            source: 'whatsapp_import',
            sourceHash: openBreak.sourceHash,
          });
          openBreak = null;
        } else {
          toFillGaps.push({
            timestamp: evt.isoTimestamp,
            description: 'Break off logged without an active break start.',
            suspectedType: 'missing_on',
          });
        }
      }
      continue;
    }

    // Music / Riyaz
    if (matchedRule && matchedRule.category === 'music') {
      validEntries.push({
        type: 'music',
        action: 'tick',
        topic: 'Riyaz',
        startTime: evt.isoTimestamp,
        endTime: evt.isoTimestamp,
        durationMinutes: 30, // standard default session credit if not timed
        source: 'whatsapp_import',
        sourceHash: evt.sourceHash,
      });
      continue;
    }

    // Day Login / Logout
    if (matchedRule && matchedRule.category === 'day_boundary') {
      validEntries.push({
        type: 'day_boundary',
        action: matchedRule.mappedAction === 'day_start' ? 'start' : 'stop',
        topic: matchedRule.mappedAction === 'day_start' ? 'Desk Login' : 'Desk Logout',
        startTime: evt.isoTimestamp,
        endTime: evt.isoTimestamp,
        durationMinutes: 0,
        source: 'whatsapp_import',
        sourceHash: evt.sourceHash,
      });
      continue;
    }

    // Desk on / off
    if (matchedRule && matchedRule.category === 'desk') {
      validEntries.push({
        type: 'day_boundary',
        action: matchedRule.mappedAction === 'desk_on' ? 'start' : 'stop',
        topic: matchedRule.mappedAction === 'desk_on' ? 'On Desk' : 'Off Desk',
        startTime: evt.isoTimestamp,
        endTime: evt.isoTimestamp,
        durationMinutes: 0,
        source: 'whatsapp_import',
        sourceHash: evt.sourceHash,
      });
      continue;
    }

    // Unmatched messages are placed into the Review List
    reviewItems.push({
      rawMessage: evt.message,
      timestamp: evt.isoTimestamp,
      reason: 'Unmatched phrase (customize in Word List to map)',
    });
  }

  // Any leftover open study or break gets flagged for "To Fill"
  if (openStudy) {
    toFillGaps.push({
      timestamp: openStudy.startTime,
      description: `Study on "${openStudy.topic}" was left open with no off timestamp.`,
      suspectedType: 'missing_off',
    });
  }
  if (openBreak) {
    toFillGaps.push({
      timestamp: openBreak.startTime,
      description: 'Break session was left open with no off timestamp.',
      suspectedType: 'missing_off',
    });
  }

  return {
    validEntries,
    reviewItems,
    toFillGaps,
    duplicateCount,
    totalParsed: rawEvents.length + reviewItems.length,
  };
}

// Convert various WhatsApp date string formats to ISO 8601
function parseDateTimeToISO(dateStr: string, timeStr: string): string | null {
  try {
    const parts = dateStr.split(/[/.-]/);
    if (parts.length !== 3) return null;

    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // If month > 12, it might be MM/DD/YYYY
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    if (year < 100) year += 2000;

    // Parse time
    const timeMatch = timeStr.trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([APap][Mm]))?/);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const ampm = timeMatch[4]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const d = new Date(year, month - 1, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}
