import { Readable } from "stream";
import { getDriveClient } from "@/lib/google/drive";

function escapeDriveQueryString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function listDriveFiles({
  folderId,
  queryFilter = "",
  orderBy = "createdTime desc",
  fields = "files(id, name, createdTime)",
}: {
  folderId: string;
  queryFilter?: string;
  orderBy?: string;
  fields?: string;
}): Promise<Array<{ id: string; name: string; createdTime?: string }>> {
  if (!folderId) return [];

  const drive = getDriveClient();
  const baseQuery = `'${folderId}' in parents and trashed=false`;
  const q = queryFilter ? `${baseQuery} and ${queryFilter}` : baseQuery;

  const res = await drive.files.list({
    q,
    fields,
    spaces: "drive",
    orderBy,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files || []) as Array<{ id: string; name: string; createdTime?: string }>;
}

async function findDriveFileByName(
  folderId: string,
  filename: string
): Promise<{ id: string; name: string } | null> {
  const safeName = escapeDriveQueryString(filename);
  const files = await listDriveFiles({
    folderId,
    queryFilter: `name='${safeName}'`,
    fields: "files(id, name)",
  });
  return files[0] ?? null;
}

async function deleteDriveFile(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (err) {
    console.error("[deleteDriveFile] Error deleting file:", err);
    return false;
  }
}

async function downloadDriveFile(fileId: string): Promise<Buffer | null> {
  if (!fileId) return null;
  try {
    const drive = getDriveClient();
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(res.data as ArrayBuffer);
  } catch (err) {
    console.error("[downloadDriveFile] Error downloading file:", err);
    return null;
  }
}

async function uploadDriveFile({
  folderId,
  filename,
  mimeType,
  buffer,
}: {
  folderId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ fileId: string; link?: string }> {
  if (!folderId) throw new Error("Missing Google Drive folder ID");

  const drive = getDriveClient();
  const bufferStream = new Readable();
  bufferStream.push(buffer);
  bufferStream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: bufferStream,
    },
    fields: "id,webViewLink",
    supportsAllDrives: true,
  });

  return {
    fileId: res.data.id!,
    link: res.data.webViewLink ?? undefined,
  };
}

const CV_FOLDER_ID = process.env.GDRIVE_CV_FOLDER_ID ?? "";

export async function findUserCVFileId(username: string): Promise<string | null> {
  const file = await findDriveFileByName(CV_FOLDER_ID, `${username}.pdf`);
  return file?.id ?? null;
}

export async function hasUserCV(username: string): Promise<boolean> {
  const fileId = await findUserCVFileId(username);
  return !!fileId;
}

export async function removeUserCV(username: string): Promise<boolean> {
  const fileId = await findUserCVFileId(username);
  if (!fileId) return false;
  return deleteDriveFile(fileId);
}

export async function downloadUserCV(username: string): Promise<Buffer | null> {
  const fileId = await findUserCVFileId(username);
  if (!fileId) return null;
  return downloadDriveFile(fileId);
}

export async function uploadUserCV(
  username: string,
  buffer: Buffer
): Promise<{ fileId: string; link?: string }> {
  await removeUserCV(username);
  return uploadDriveFile({
    folderId: CV_FOLDER_ID,
    filename: `${username}.pdf`,
    mimeType: "application/pdf",
    buffer,
  });
}

const SWEATS_FOLDER_ID = process.env.GDRIVE_SWEATS_FOLDER_ID ?? "";
export const MAX_SWEATS_SUBMISSIONS = 3;

export async function getUserSweatsSubmissions(
  username: string
): Promise<Array<{ id: string; name: string }>> {
  const safeUsername = escapeDriveQueryString(username);
  return listDriveFiles({
    folderId: SWEATS_FOLDER_ID,
    queryFilter: `name contains '${safeUsername}_'`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime desc",
  });
}

export async function deleteOldestSweatsSubmission(
  submissions: Array<{ id: string; name: string }>
): Promise<void> {
  if (!submissions.length) return;
  const oldestFile = submissions[submissions.length - 1];
  if (oldestFile?.id) await deleteDriveFile(oldestFile.id);
}

export async function uploadSweatsSubmission(
  username: string,
  buffer: Buffer
): Promise<{
  fileId: string;
  link?: string;
  submissionNumber: number;
  remainingSubmissions: number;
}> {
  const existingSubmissions = await getUserSweatsSubmissions(username);
  if (existingSubmissions.length >= MAX_SWEATS_SUBMISSIONS)
    await deleteOldestSweatsSubmission(existingSubmissions);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split(".")[0];
  const filename = `${username}_${timestamp}.zip`;

  const uploadResult = await uploadDriveFile({
    folderId: SWEATS_FOLDER_ID,
    filename,
    mimeType: "application/zip",
    buffer,
  });

  return {
    ...uploadResult,
    submissionNumber: Math.min(existingSubmissions.length + 1, MAX_SWEATS_SUBMISSIONS),
    remainingSubmissions: Math.max(MAX_SWEATS_SUBMISSIONS - existingSubmissions.length - 1, 0),
  };
}
