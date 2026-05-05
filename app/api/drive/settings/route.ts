import { google } from "googleapis";
import type { NextRequest } from "next/server";
import {
  httpStatusFromGoogleApiError,
  resolveGoogleAccessTokenFromRequest,
} from "@/lib/googleAccessToken";

const SETTINGS_FILE_NAME = "pomodoro-settings.json";

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

async function findSettingsFileId(drive: ReturnType<typeof google.drive>) {
  const response = await drive.files.list({
    spaces: "appDataFolder",
    q: `name='${SETTINGS_FILE_NAME}' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  return response.data.files?.[0]?.id;
}

export async function GET(request: NextRequest) {
  const accessToken = await resolveGoogleAccessTokenFromRequest(request);
  if (!accessToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const drive = getDriveClient(accessToken);
    const fileId = await findSettingsFileId(drive);
    if (!fileId) return Response.json({ calendarSyncEnabled: false, source: "default" });

    const fileResponse = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" },
    );

    const rawText = typeof fileResponse.data === "string" ? fileResponse.data : "";
    if (!rawText.trim()) return Response.json({ calendarSyncEnabled: false, source: "default" });

    const parsed = JSON.parse(rawText) as AccountSettings;
    return Response.json({
      calendarSyncEnabled: Boolean(parsed.calendarSyncEnabled),
      source: "drive",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return Response.json({ error: message }, { status: httpStatusFromGoogleApiError(error) });
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await resolveGoogleAccessTokenFromRequest(request);
  if (!accessToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { calendarSyncEnabled?: boolean };
    const payload: AccountSettings = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      calendarSyncEnabled: Boolean(body.calendarSyncEnabled),
    };

    const drive = getDriveClient(accessToken);
    const fileId = await findSettingsFileId(drive);
    const mediaBody = JSON.stringify(payload, null, 2);

    if (!fileId) {
      await drive.files.create({
        requestBody: {
          name: SETTINGS_FILE_NAME,
          parents: ["appDataFolder"],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: mediaBody,
        },
      });
    } else {
      await drive.files.update({
        fileId,
        media: {
          mimeType: "application/json",
          body: mediaBody,
        },
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings";
    return Response.json({ error: message }, { status: httpStatusFromGoogleApiError(error) });
  }
}
