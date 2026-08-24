import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";

import { getGeneratorLabelMap } from "@/lib/data";
import { formatDate, formatNumber, humanize } from "@/lib/format";
import { getModuleDefinition } from "@/lib/module-definitions";
import { getReportExportSections, isReportExportType, normalizeFileName, reportExportConfigs, type ReportExportSection } from "@/lib/report-export";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TableColumn } from "@/types/app";
import type { GenericRow } from "@/types/database";

export const runtime = "nodejs";

type PdfEntry = {
  title: string;
  comment: string;
};

const margin = 48;
const teal = "#0f766e";
const slate950 = "#020617";
const slate700 = "#334155";
const slate500 = "#64748b";
const slate200 = "#e2e8f0";
const slate50 = "#f8fafc";

export function GET(request: NextRequest) {
  const redirectUrl = new URL("/reports/pdf", request.url);
  const reportType = request.nextUrl.searchParams.get("type");
  const reportId = request.nextUrl.searchParams.get("reportId");

  if (reportType) {
    redirectUrl.searchParams.set("type", reportType);
  }

  if (reportId) {
    redirectUrl.searchParams.set("reportId", reportId);
  }

  return NextResponse.redirect(redirectUrl);
}

async function requireExportSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formTextArray(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => (typeof value === "string" ? value.trim() : ""));
}

function getPdfEntries(formData: FormData) {
  const titles = formTextArray(formData, "sectionTitle");
  const comments = formTextArray(formData, "sectionComment");

  return titles
    .map((title, index) => ({
      title,
      comment: comments[index] ?? ""
    }))
    .filter((entry) => entry.title || entry.comment);
}

function createPdfBuffer(build: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin,
      bufferPages: true,
      info: {
        Title: "GOM Report",
        Author: "Generator Operations Management"
      }
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    build(doc);
    doc.end();
  });
}

function registerReportFont(doc: PDFKit.PDFDocument) {
  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansArabic.ttf");

  if (fs.existsSync(fontPath)) {
    doc.registerFont("Report", fontPath);
    doc.font("Report");
  }
}

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - margin * 2;
}

function bottomY(doc: PDFKit.PDFDocument) {
  return doc.page.height - margin;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > bottomY(doc)) {
    doc.addPage();
    registerReportFont(doc);
    doc.y = margin;
  }
}

function drawReportHeader(doc: PDFKit.PDFDocument, reportLabel: string, reportTitle: string, periodStart: string, periodEnd: string) {
  doc.rect(0, 0, doc.page.width, 112).fill(teal);
  doc.fillColor("#ffffff").fontSize(10).text("GOM", margin, 30, { width: contentWidth(doc) });
  doc.fontSize(22).text(reportTitle || reportLabel, margin, 47, { width: contentWidth(doc) });
  doc.fontSize(10).text(reportLabel, margin, 79, { width: contentWidth(doc) });

  doc.y = 136;
  doc.fillColor(slate700).fontSize(10);
  doc.text(`Period Start: ${periodStart ? formatDate(periodStart) : "Not set"}`, margin, doc.y, { continued: true });
  doc.text(`   Period End: ${periodEnd ? formatDate(periodEnd) : "Not set"}`, { continued: true });
  doc.text(`   Exported: ${formatDate(new Date().toISOString())}`);
  doc.moveDown(1.4);
}

function drawSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 36);
  doc.fillColor(slate950).fontSize(15).text(title, margin, doc.y, { width: contentWidth(doc) });
  doc.moveTo(margin, doc.y + 5).lineTo(doc.page.width - margin, doc.y + 5).strokeColor(slate200).stroke();
  doc.moveDown(1.1);
}

function drawPdfEntry(doc: PDFKit.PDFDocument, entry: PdfEntry, index: number) {
  const boxWidth = contentWidth(doc);
  const title = entry.title || `Entry ${index + 1}`;
  const comment = entry.comment || "No comment entered.";
  const titleHeight = doc.fontSize(11).heightOfString(title, { width: boxWidth - 24 });
  const commentHeight = doc.fontSize(10).heightOfString(comment, { width: boxWidth - 24 });
  const boxHeight = Math.max(74, titleHeight + commentHeight + 36);

  ensureSpace(doc, boxHeight + 10);

  const y = doc.y;
  doc.roundedRect(margin, y, boxWidth, boxHeight, 6).fillAndStroke(slate50, slate200);
  doc.fillColor(teal).fontSize(9).text(`Entry ${index + 1}`, margin + 12, y + 12, { width: boxWidth - 24 });
  doc.fillColor(slate950).fontSize(12).text(title, margin + 12, doc.y + 4, { width: boxWidth - 24 });
  doc.fillColor(slate700).fontSize(10).text(comment, margin + 12, doc.y + 8, { width: boxWidth - 24 });
  doc.y = y + boxHeight + 10;
}

function formatCellValue(value: unknown, column: TableColumn, generatorMap: Map<string, string>) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (column.type === "date") {
    return formatDate(value);
  }

  if (column.type === "number") {
    return formatNumber(value);
  }

  if (column.type === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" && generatorMap.has(value)) {
    return generatorMap.get(value) ?? value;
  }

  if (typeof value === "object") {
    return "Recorded";
  }

  return humanize(String(value));
}

function drawRecord(doc: PDFKit.PDFDocument, row: GenericRow, columns: TableColumn[], generatorMap: Map<string, string>, index: number) {
  const boxWidth = contentWidth(doc);
  const lines = columns.map((column) => `${column.label}: ${formatCellValue(row[column.key], column, generatorMap)}`);
  const body = lines.join("\n");
  const height = Math.max(58, doc.fontSize(9).heightOfString(body, { width: boxWidth - 24 }) + 34);

  ensureSpace(doc, height + 8);

  const y = doc.y;
  doc.roundedRect(margin, y, boxWidth, height, 5).strokeColor(slate200).stroke();
  doc.fillColor(slate500).fontSize(8).text(`Record ${index + 1}`, margin + 12, y + 10, { width: boxWidth - 24 });
  doc.fillColor(slate700).fontSize(9).text(body, margin + 12, doc.y + 5, { width: boxWidth - 24 });
  doc.y = y + height + 8;
}

function drawDataSection(doc: PDFKit.PDFDocument, section: ReportExportSection, generatorMap: Map<string, string>) {
  const definition = getModuleDefinition(section.moduleKey);
  drawSectionHeading(doc, definition.title);

  if (section.rows.length === 0) {
    doc.fillColor(slate500).fontSize(10).text("No records found for this report period.", margin, doc.y, { width: contentWidth(doc) });
    doc.moveDown(1.2);
    return;
  }

  const rows = section.rows.slice(0, 40);
  rows.forEach((row, index) => drawRecord(doc, row, definition.columns, generatorMap, index));

  if (section.rows.length > rows.length) {
    doc.fillColor(slate500).fontSize(9).text(`${section.rows.length - rows.length} additional records are available in the CSV export.`, margin, doc.y, { width: contentWidth(doc) });
    doc.moveDown(1.1);
  }
}

function addPageFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();

  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    registerReportFont(doc);
    doc.fillColor(slate500).fontSize(8).text(`Page ${pageIndex + 1} of ${range.count}`, margin, doc.page.height - 32, { align: "right", width: contentWidth(doc) });
  }
}

async function buildReportPdf({
  reportLabel,
  reportTitle,
  periodStart,
  periodEnd,
  entries,
  sections
}: {
  reportLabel: string;
  reportTitle: string;
  periodStart: string;
  periodEnd: string;
  entries: PdfEntry[];
  sections: ReportExportSection[];
}) {
  const generatorMap = await getGeneratorLabelMap();

  return createPdfBuffer((doc) => {
    registerReportFont(doc);
    drawReportHeader(doc, reportLabel, reportTitle, periodStart, periodEnd);
    drawSectionHeading(doc, "Entered Information");

    if (entries.length === 0) {
      doc.fillColor(slate500).fontSize(10).text("No entered information.", margin, doc.y, { width: contentWidth(doc) });
      doc.moveDown(1.2);
    } else {
      entries.forEach((entry, index) => drawPdfEntry(doc, entry, index));
    }

    for (const section of sections) {
      drawDataSection(doc, section, generatorMap);
    }

    addPageFooters(doc);
  });
}

export async function POST(request: NextRequest) {
  const user = await requireExportSession();

  if (isSupabaseConfigured() && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const reportType = formText(formData, "type");

  if (!isReportExportType(reportType)) {
    return new NextResponse("Unknown report export type.", { status: 400 });
  }

  const config = reportExportConfigs[reportType];
  const reportTitle = formText(formData, "reportTitle") || config.label;
  const periodStart = formText(formData, "periodStart");
  const periodEnd = formText(formData, "periodEnd");
  const entries = getPdfEntries(formData);
  const sections = await getReportExportSections({ reportType, periodStart, periodEnd });
  const pdfBuffer = await buildReportPdf({
    reportLabel: config.label,
    reportTitle,
    periodStart,
    periodEnd,
    entries,
    sections
  });
  const fileNameBase = normalizeFileName(reportTitle) || normalizeFileName(config.label);
  const fileName = `gom-${fileNameBase || "report"}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/pdf"
    }
  });
}
