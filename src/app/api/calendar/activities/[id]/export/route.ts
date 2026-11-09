import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { verifyPermission } from "@/lib/auth";
import {
  getActivityByIdFromDb,
  getEventAttendanceRoster,
} from "@/lib/db/repositories/event.repository";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyPermission("events:read");
  if (auth.error) return auth.error;

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const rawLocale = searchParams.get("locale") || defaultLocale;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const rm = dict.activities_management.roster_modal;
  const d = dict.activities_management.details;

  try {
    const [event, roster] = await Promise.all([
      getActivityByIdFromDb(id),
      getEventAttendanceRoster(id),
    ]);

    if (!event) return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });

    const dataToExport = roster.map((item) => {
      const responsesStr = item.form_responses
        ? Object.entries(item.form_responses)
            .map(([k, v]) => `${k}: ${typeof v === "boolean" ? (v ? d.yes : d.no) : String(v)}`)
            .join(" | ")
        : "";

      return {
        [rm.col_name]: item.name,
        [rm.col_istid]: item.istid,
        [rm.col_email]: item.email || "",
        [rm.col_ticket]: item.ticket_code,
        [rm.col_signup_date]: item.signed_up_at
          ? new Date(item.signed_up_at).toLocaleString(locale === "pt" ? "pt-PT" : "en-GB")
          : "",
        [rm.col_checkin]: item.checked_in_at ? d.yes : d.no,
        [rm.col_checkin_time]: item.checked_in_at
          ? new Date(item.checked_in_at).toLocaleString(locale === "pt" ? "pt-PT" : "en-GB")
          : "",
        [rm.col_responses]: responsesStr,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [
      { wch: 30 }, // Name
      { wch: 15 }, // IST ID
      { wch: 30 }, // Email
      { wch: 15 }, // Ticket
      { wch: 22 }, // Sign-up Date
      { wch: 12 }, // Checked-in
      { wch: 22 }, // Check-in Time
      { wch: 40 }, // Responses
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, rm.title.slice(0, 31));

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const sanitizedTitle =
      event.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase() || "inscritos";

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="inscritos_${event.id}_${sanitizedTitle}.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
