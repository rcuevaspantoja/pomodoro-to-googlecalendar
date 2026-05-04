import { google } from "googleapis";
import type { NextRequest } from "next/server";
import { resolveGoogleAccessTokenFromRequest } from "@/lib/googleAccessToken";
import type { PomodoroHistoryRecord } from "@/components/pomodoro/types";

function getCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

function parseStartDateFromRecord(record: PomodoroHistoryRecord) {
  if (record.completedAtISO) {
    const parsedFromIso = new Date(record.completedAtISO);
    if (Number.isFinite(parsedFromIso.getTime())) {
      return parsedFromIso;
    }
  }

  const now = new Date();
  const text = (record.completedAt ?? "").toLowerCase();
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return now;

  let hours = Number.parseInt(timeMatch[1], 10);
  const minutes = Number.parseInt(timeMatch[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return now;

  const isPm = /(pm|p\.m|p\. m\.)/.test(text);
  const isAm = /(am|a\.m|a\. m\.)/.test(text);
  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;

  const parsed = new Date(now);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
}

export async function POST(request: NextRequest) {
  const accessToken = await resolveGoogleAccessTokenFromRequest(request);
  if (!accessToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { record?: PomodoroHistoryRecord };
    const record = body.record;
    if (!record) return Response.json({ error: "Record is required" }, { status: 400 });

    const start = parseStartDateFromRecord(record);
    const durationMinutes =
      Number.isFinite(record.durationMinutes) && record.durationMinutes > 0
        ? record.durationMinutes
        : 25;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const calendar = getCalendarClient(accessToken);

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `Pomodoro: ${record.name}`,
        description: `Preset: ${record.presetLabel}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });

    return Response.json({ eventId: response.data.id ?? null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync calendar event";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessToken = await resolveGoogleAccessTokenFromRequest(request);
  if (!accessToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { eventId?: string };
    const eventId = body.eventId?.trim();
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });

    const calendar = getCalendarClient(accessToken);
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    return Response.json({ ok: true });
  } catch (error) {
    const maybeStatus =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: unknown }).status)
        : undefined;
    const maybeCode =
      typeof error === "object" && error !== null && "code" in error
        ? Number((error as { code?: unknown }).code)
        : undefined;

    // Si el evento ya no existe en Calendar, tratamos la eliminacion como exitosa.
    if (maybeStatus === 404 || maybeStatus === 410 || maybeCode === 404 || maybeCode === 410) {
      return Response.json({ ok: true, alreadyDeleted: true });
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete calendar event";
    return Response.json({ error: message }, { status: 500 });
  }
}
