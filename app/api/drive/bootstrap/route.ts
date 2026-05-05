import { google } from "googleapis";
import type { NextRequest } from "next/server";
import {
  httpStatusFromGoogleApiError,
  resolveGoogleAccessTokenFromRequest,
} from "@/lib/googleAccessToken";
import type { PomodoroHistoryRecord } from "@/components/pomodoro/types";

const POMODORO_FILE = "pomodoro-sessions.json";
const SETTINGS_FILE = "pomodoro-settings.json";

type PomodoroDriveDocument = {
  schemaVersion: number;
  updatedAt: string;
  records: PomodoroHistoryRecord[];
};

type AccountSettings = {
  schemaVersion: number;
  updatedAt: string;
  calendarSyncEnabled: boolean;
};

function getDriveClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

async function findFileIdByName(drive: ReturnType<typeof google.drive>, fileName: string) {
  const response = await drive.files.list({
    spaces: "appDataFolder",
    q: `name='${fileName}' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
  });
  return response.data.files?.[0]?.id;
}

/**
 * Single entry point for initial load: one OAuth refresh + both Drive reads in one request.
 * Avoids parallel /api/drive/* calls racing on the same refresh_token (invalid_grant → 401).
 */
export async function GET(request: NextRequest) {
  const accessToken = await resolveGoogleAccessTokenFromRequest(request);
  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drive = getDriveClient(accessToken);

    const [pomodoroFileId, settingsFileId] = await Promise.all([
      findFileIdByName(drive, POMODORO_FILE),
      findFileIdByName(drive, SETTINGS_FILE),
    ]);

    let records: PomodoroHistoryRecord[] = [];
    if (pomodoroFileId) {
      const fileResponse = await drive.files.get(
        { fileId: pomodoroFileId, alt: "media" },
        { responseType: "text" },
      );
      const rawText = typeof fileResponse.data === "string" ? fileResponse.data : "";
      if (rawText.trim().length > 0) {
        const parsed = JSON.parse(rawText) as PomodoroDriveDocument;
        records = parsed.records ?? [];
      }
    }

    let calendarSyncEnabled = false;
    if (settingsFileId) {
      const fileResponse = await drive.files.get(
        { fileId: settingsFileId, alt: "media" },
        { responseType: "text" },
      );
      const rawText = typeof fileResponse.data === "string" ? fileResponse.data : "";
      if (rawText.trim().length > 0) {
        const parsed = JSON.parse(rawText) as AccountSettings;
        calendarSyncEnabled = Boolean(parsed.calendarSyncEnabled);
      }
    }

    return Response.json({ records, calendarSyncEnabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load drive data";
    return Response.json({ error: message }, { status: httpStatusFromGoogleApiError(error) });
  }
}
