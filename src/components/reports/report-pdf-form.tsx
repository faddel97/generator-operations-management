"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ReportExportType } from "@/lib/report-export";

type ReportOption = {
  value: ReportExportType;
  label: string;
};

type PdfEntry = {
  id: number;
  title: string;
  comment: string;
};

export function ReportPdfForm({
  reportOptions,
  initialType,
  initialTitle,
  initialPeriodStart,
  initialPeriodEnd
}: {
  reportOptions: ReportOption[];
  initialType: ReportExportType;
  initialTitle?: string;
  initialPeriodStart?: string;
  initialPeriodEnd?: string;
}) {
  const [entries, setEntries] = useState<PdfEntry[]>([{ id: 1, title: "", comment: "" }]);

  function addEntry() {
    setEntries((current) => [...current, { id: Date.now(), title: "", comment: "" }]);
  }

  function removeEntry(id: number) {
    setEntries((current) => (current.length === 1 ? current : current.filter((entry) => entry.id !== id)));
  }

  function updateEntry(id: number, key: "title" | "comment", value: string) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)));
  }

  return (
    <form action="/reports/export/pdf" method="post" className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Report Details</h3>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Report Type</span>
            <select name="type" defaultValue={initialType} className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900">
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Report Title</span>
            <input name="reportTitle" defaultValue={initialTitle ?? ""} className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Period Start</span>
            <input type="date" name="periodStart" defaultValue={initialPeriodStart?.slice(0, 10) ?? ""} className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Period End</span>
            <input type="date" name="periodEnd" defaultValue={initialPeriodEnd?.slice(0, 10) ?? ""} className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900" />
          </label>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">PDF Entries</h3>
          <button type="button" onClick={addEntry} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-teal-700 text-teal-800 hover:bg-teal-50" title="Add entry">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {entries.map((entry, index) => (
            <div key={entry.id} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-800">Title {index + 1}</span>
                <input
                  name="sectionTitle"
                  value={entry.title}
                  onChange={(event) => updateEntry(entry.id, "title", event.target.value)}
                  className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-800">Comment {index + 1}</span>
                <textarea
                  name="sectionComment"
                  value={entry.comment}
                  onChange={(event) => updateEntry(entry.id, "comment", event.target.value)}
                  rows={2}
                  className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  disabled={entries.length === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Remove entry"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
          <FileDown className="h-4 w-4" aria-hidden="true" />
          Generate PDF
        </button>
        <Link href="/reports" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Reports
        </Link>
      </div>
    </form>
  );
}
