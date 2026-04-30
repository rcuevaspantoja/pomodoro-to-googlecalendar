import { google } from "googleapis";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import type { PomodoroHistoryRecord } from "@/components/pomodoro/types";

const DRIVE_FILE_NAME = "pomodoro-sessions.json";

type PomodoroDriveDocument = {
  schemaVersion: number;
  updatedAt: string;
  records: PomodoroHistoryRecord[];
};

function getDriveClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

async function findPomodoroFileId(drive: ReturnType<typeof google.drive>) {
  const response = await drive.files.list({
    spaces: "appDataFolder",
    q: `name='${DRIVE_FILE_NAME}' and trashed=false`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  return response.data.files?.[0]?.id;
}

async function getAccessTokenFromRequest(request: NextRequest) {
  const token = await getToken({ req: request });
  const accessToken = token?.accessToken;
  return typeof accessToken === "string" && accessToken.length > 0 ? accessToken : null;
}

export async function GET(request: NextRequest) {
  const accessToken = await getAccessTokenFromRequest(request);

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drive = getDriveClient(accessToken);
    const fileId = await findPomodoroFileId(drive);

    if (!fileId) {
      return Response.json({ records: [], source: "empty" });
    }

    const fileResponse = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" },
    );

    const raw = fileResponse.data;
    const rawText = typeof raw === "string" ? raw : "";
    if (rawText.trim().length === 0) {
      return Response.json({ records: [], source: "empty" });
    }

    const parsed = JSON.parse(rawText) as PomodoroDriveDocument;
    return Response.json({ records: parsed.records ?? [], source: "drive" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pomodoros";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessTokenFromRequest(request);

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { records?: PomodoroHistoryRecord[] };
    const records = Array.isArray(body.records) ? body.records : [];

    const payload: PomodoroDriveDocument = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      records,
    };

    const mediaBody = JSON.stringify(payload, null, 2);
    const drive = getDriveClient(accessToken);
    const fileId = await findPomodoroFileId(drive);

    if (!fileId) {
      await drive.files.create({
        requestBody: {
          name: DRIVE_FILE_NAME,
          parents: ["appDataFolder"],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: mediaBody,
        },
        fields: "id",
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
    const message = error instanceof Error ? error.message : "Failed to save pomodoros";
    return Response.json({ error: message }, { status: 500 });
  }
}
