import { AlertCircle, CheckCircle, FileText, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { WordRule } from '../lib/defaultWordList';
import { parseWhatsAppFile, parseWhatsAppText } from '../lib/whatsappParser';
import { ParsedWhatsAppResult, TimeEntry } from '../types/tracker';

interface WhatsAppImporterProps {
  wordRules: WordRule[];
  onAddWordRule: (rule: Omit<WordRule, 'id'>) => void;
  onDeleteWordRule: (id: string) => void;
  onCommitImport: (result: ParsedWhatsAppResult) => Promise<void>;
  existingHashes: Set<string>;
}

export const WhatsAppImporter: React.FC<WhatsAppImporterProps> = ({
  wordRules,
  onAddWordRule,
  onDeleteWordRule,
  onCommitImport,
  existingHashes,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedWhatsAppResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New word rule inputs
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('desk_off');
  const [newCategory, setNewCategory] = useState<'study' | 'break' | 'music' | 'content' | 'day_boundary' | 'desk'>('desk');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const res = await parseWhatsAppFile(file, wordRules, existingHashes);
      setParseResult(res);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse WhatsApp log.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadDemoChat = () => {
    setIsParsing(true);
    setSaveSuccess(false);
    // Realistic sample log starting 13 October 2026 as per requirements
    const sampleChat = `
13/10/2026, 08:30 - Manav: login
13/10/2026, 08:35 - Manav: on desk
13/10/2026, 08:45 - Manav: S on Compiler Design
13/10/2026, 11:45 - Manav: S off
13/10/2026, 11:50 - Manav: bon
13/10/2026, 12:35 - Manav: boff
13/10/2026, 12:45 - Manav: 450
13/10/2026, 13:00 - Manav: S on Operating Systems
13/10/2026, 15:30 - Manav: S off
13/10/2026, 16:00 - Manav: riyaz
13/10/2026, 16:45 - Manav: S on Computer Networks
13/10/2026, 18:45 - Manav: S off
13/10/2026, 19:15 - Manav: ₹1200 groceries
13/10/2026, 20:00 - Manav: bon
13/10/2026, 20:40 - Manav: Luck off
13/10/2026, 21:00 - Manav: S on Distributed Systems
14/10/2026, 09:00 - Manav: login
14/10/2026, 09:15 - Manav: S on Algorithms
14/10/2026, 12:45 - Manav: S off
14/10/2026, 13:00 - Manav: lunch
14/10/2026, 13:45 - Manav: boff
14/10/2026, 14:00 - Manav: riyaz
14/10/2026, 14:45 - Manav: S on Database Engines
14/10/2026, 17:45 - Manav: S off
14/10/2026, 18:30 - Manav: logout
    `.trim();

    const res = parseWhatsAppText(sampleChat, wordRules, existingHashes);
    setParseResult(res);
    setIsParsing(false);
  };

  const handleCommit = async () => {
    if (!parseResult) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onCommitImport(parseResult);
      setSaveSuccess(true);
      setParseResult(null);
    } catch (e) {
      console.error(e);
      setErrorMessage(e instanceof Error ? e.message : 'Error committing import to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger.trim()) return;
    onAddWordRule({
      triggerWord: newTrigger.trim(),
      mappedAction: newAction,
      category: newCategory,
      description: `Custom mapping for ${newTrigger}`,
    });
    setNewTrigger('');
  };

  return (
    <div className="space-y-6">
      {/* 1. File Upload Dropzone */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Upload className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-base font-semibold tracking-tight text-white">
              WhatsApp Chat Importer (.zip or .txt)
            </h3>
          </div>
          <button
            onClick={handleLoadDemoChat}
            className="px-3 py-1 text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-md hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            Load Sample Chat (13 Oct 2026)
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          Export your WhatsApp chat without media. History starting from 13 October 2026 will be parsed. Messy terms are matched via your editable Word List, numbers and amounts go to the Review List, and duplicates are automatically prevented.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive ? 'border-emerald-400 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-950/40'
          }`}
        >
          <FileText className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-xs font-medium text-zinc-200 mb-1">
            Drag and drop your exported WhatsApp chat (.txt or .zip) here
          </p>
          <span className="text-[11px] text-zinc-500 block mb-3">or choose file from disk</span>
          <label className="inline-block px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer">
            Browse File
            <input
              type="file"
              accept=".txt,.zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {isParsing && (
          <div className="mt-4 text-xs font-mono text-zinc-400 animate-pulse text-center">
            Reading chat timestamps, checking word list, and analyzing gaps...
          </div>
        )}

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Chat log successfully imported and saved to your local offline ledger!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/70 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Live Import Preview (Assumption: Before saving, you see what was understood) */}
      {parseResult && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-white">
                Import Preview & Verification
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review what was understood before saving to your permanent desk ledger.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">
                {parseResult.validEntries.length} valid events · {parseResult.duplicateCount} duplicates skipped
              </span>
              <button
                onClick={handleCommit}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Confirm & Save to Desk'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Valid Sessions */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
              <span className="label-scandi text-zinc-400 block mb-1">
                Valid Events Understood
              </span>
              <div className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                {parseResult.validEntries.length}
              </div>
            </div>

            {/* Review List (Numbers, Amounts, Non-time notes) */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
              <span className="label-scandi text-zinc-400 block mb-1">
                Review List (Numbers & Amounts)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {parseResult.reviewItems.length}
              </div>
              <span className="text-[10px] text-zinc-500">Never guessed; sent to review queue</span>
            </div>

            {/* To Fill Gaps */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
              <span className="label-scandi text-zinc-400 block mb-1">
                "To Fill" List (Missing Off/On)
              </span>
              <div className="text-2xl font-bold font-mono text-zinc-300 tabular-nums">
                {parseResult.toFillGaps.length}
              </div>
              <span className="text-[10px] text-zinc-500">Collected for manual completion</span>
            </div>
          </div>

          {/* Table of Parsed Events */}
          <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/90 text-zinc-400 sticky top-0 border-b border-zinc-800">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Topic / Action</th>
                  <th className="py-2 px-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {parseResult.validEntries.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/30">
                    <td className="py-1.5 px-3 whitespace-nowrap text-zinc-400">
                      {new Date(item.startTime).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-1.5 px-3 uppercase text-[10px] font-bold text-zinc-400">
                      {item.type}
                    </td>
                    <td className="py-1.5 px-3">{item.topic || item.action}</td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {item.durationMinutes ? `${item.durationMinutes}m` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Editable Word List Manager */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800/80">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base font-semibold tracking-tight text-white">
            Word List & Messy Phrasing Rules
          </h3>
          <span className="label-scandi text-zinc-500">{wordRules.length} rules active</span>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Customize how messy or shortened terms like "OTD", "bon", "Luck off", or "out" are translated into system events.
        </p>

        {/* Add new rule form */}
        <form onSubmit={handleCreateRule} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-4">
          <input
            type="text"
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            placeholder='Trigger word (e.g. "Luck off")'
            className="px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
          />

          <select
            value={newCategory}
            onChange={(e) =>
              setNewCategory(e.target.value as 'study' | 'break' | 'music' | 'content' | 'day_boundary' | 'desk')
            }
            className="px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-400"
          >
            <option value="desk">Desk Status</option>
            <option value="break">Break Bank</option>
            <option value="study">Study</option>
            <option value="music">Music (Riyaz)</option>
            <option value="day_boundary">Day Boundary</option>
          </select>

          <input
            type="text"
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Mapped action (e.g. desk_off)"
            className="px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
          />

          <button
            type="submit"
            className="flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </form>

        {/* Word rules grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
          {wordRules.map((rule) => (
            <div
              key={rule.id}
              className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg flex items-center justify-between text-xs font-mono"
            >
              <div>
                <span className="text-zinc-100 font-semibold">"{rule.triggerWord}"</span>
                <span className="text-zinc-500 mx-1.5">→</span>
                <span className="text-zinc-400">{rule.mappedAction}</span>
              </div>
              <button
                onClick={() => onDeleteWordRule(rule.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
