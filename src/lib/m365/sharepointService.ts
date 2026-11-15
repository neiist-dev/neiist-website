import { FileUpload, LargeFileUploadTask, ResponseType } from "@microsoft/microsoft-graph-client";
import { getGraphClient, isM365DriveConfigured } from "@/lib/m365/graph";

const SIMPLE_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024; // 4 MB

interface DriveItemSummary {
  id: string;
  name: string;
  webUrl?: string;
  createdDateTime?: string;
}

function getDriveId(): string {
  return process.env.M365_SHAREPOINT_DRIVE_ID ?? "";
}

function normalizeFolderPath(folderPath: string): string {
  return folderPath.replace(/^\/+|\/+$/g, "");
}

function encodeDrivePath(folderPath: string, fileName?: string): string {
  const cleanFolder = normalizeFolderPath(folderPath);
  const fullPath = fileName ? `${cleanFolder}/${fileName}` : cleanFolder;
  return encodeURI(fullPath);
}

function isGraphNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { statusCode?: number; code?: string };
  return e.statusCode === 404 || e.code === "itemNotFound";
}

async function listFolderChildren(folderPath: string): Promise<DriveItemSummary[]> {
  if (!isM365DriveConfigured() || !folderPath) return [];

  try {
    const client = getGraphClient();
    const driveId = getDriveId();
    const encodedFolder = encodeDrivePath(folderPath);
    const res = (await client
      .api(`/drives/${driveId}/root:/${encodedFolder}:/children`)
      .select("id,name,createdDateTime,webUrl")
      .top(999)
      .get()) as { value?: DriveItemSummary[] };

    return res.value ?? [];
  } catch (err) {
    if (isGraphNotFound(err)) return [];
    console.error("[SharePoint] Error listing folder children:", err);
    return [];
  }
}

async function findFileByName(
  folderPath: string,
  fileName: string
): Promise<DriveItemSummary | null> {
  if (!isM365DriveConfigured() || !folderPath) return null;

  try {
    const client = getGraphClient();
    const driveId = getDriveId();
    const encodedPath = encodeDrivePath(folderPath, fileName);
    const item = (await client
      .api(`/drives/${driveId}/root:/${encodedPath}`)
      .select("id,name,webUrl")
      .get()) as DriveItemSummary;
    return item?.id ? item : null;
  } catch (err) {
    if (isGraphNotFound(err)) return null;
    console.error("[SharePoint] Error finding file:", err);
    return null;
  }
}

async function deleteDriveItem(fileId: string): Promise<boolean> {
  if (!fileId || !isM365DriveConfigured()) return false;
  try {
    const client = getGraphClient();
    const driveId = getDriveId();
    await client.api(`/drives/${driveId}/items/${fileId}`).delete();
    return true;
  } catch (err) {
    if (isGraphNotFound(err)) return false;
    console.error("[SharePoint] Error deleting file:", err);
    return false;
  }
}

async function downloadDriveItem(fileId: string): Promise<Buffer | null> {
  if (!fileId || !isM365DriveConfigured()) return null;
  try {
    const client = getGraphClient();
    const driveId = getDriveId();
    const data = (await client
      .api(`/drives/${driveId}/items/${fileId}/content`)
      .responseType(ResponseType.ARRAYBUFFER)
      .get()) as ArrayBuffer;
    return Buffer.from(data);
  } catch (err) {
    console.error("[SharePoint] Error downloading file:", err);
    return null;
  }
}

async function uploadFileToSharePoint({
  folderPath,
  fileName,
  buffer,
}: {
  folderPath: string;
  fileName: string;
  buffer: Buffer;
}): Promise<{ fileId: string; link?: string }> {
  if (!isM365DriveConfigured()) {
    throw new Error("Microsoft 365 SharePoint is not configured");
  }

  const client = getGraphClient();
  const driveId = getDriveId();
  const encodedPath = encodeDrivePath(folderPath, fileName);

  if (buffer.length < SIMPLE_UPLOAD_LIMIT_BYTES) {
    const uploaded = (await client
      .api(`/drives/${driveId}/root:/${encodedPath}:/content`)
      .put(buffer)) as DriveItemSummary;
    return {
      fileId: uploaded.id,
      link: uploaded.webUrl,
    };
  }

  const uploadSession = await LargeFileUploadTask.createUploadSession(
    client,
    `/drives/${driveId}/root:/${encodedPath}:/createUploadSession`,
    {
      item: {
        "@microsoft.graph.conflictBehavior": "replace",
        name: fileName,
      },
    }
  );

  const fileObject = new FileUpload(buffer, fileName, buffer.length);
  const uploadTask = new LargeFileUploadTask(client, fileObject, uploadSession);
  const result = await uploadTask.upload();
  const body = result.responseBody as DriveItemSummary;

  return {
    fileId: body.id,
    link: body.webUrl,
  };
}

function getCvFolderPath(): string {
  return normalizeFolderPath(process.env.M365_CV_FOLDER_PATH || "cv-bank");
}

export async function findUserCVFileId(username: string): Promise<string | null> {
  const file = await findFileByName(getCvFolderPath(), `${username}.pdf`);
  return file?.id ?? null;
}

export async function hasUserCV(username: string): Promise<boolean> {
  const fileId = await findUserCVFileId(username);
  return !!fileId;
}

export async function removeUserCV(username: string): Promise<boolean> {
  const fileId = await findUserCVFileId(username);
  if (!fileId) return false;
  return deleteDriveItem(fileId);
}

export async function downloadUserCV(username: string): Promise<Buffer | null> {
  const fileId = await findUserCVFileId(username);
  if (!fileId) return null;
  return downloadDriveItem(fileId);
}

export async function uploadUserCV(
  username: string,
  buffer: Buffer
): Promise<{ fileId: string; link?: string }> {
  await removeUserCV(username);
  return uploadFileToSharePoint({
    folderPath: getCvFolderPath(),
    fileName: `${username}.pdf`,
    buffer,
  });
}

function getSweatsFolderPath(): string {
  return normalizeFolderPath(process.env.M365_SWEATS_FOLDER_PATH || "sweats-contest");
}

export const MAX_SWEATS_SUBMISSIONS = 3;

export async function getUserSweatsSubmissions(
  username: string
): Promise<Array<{ id: string; name: string }>> {
  const prefix = `${username}_`;
  const children = await listFolderChildren(getSweatsFolderPath());
  return children
    .filter((item) => item.name.startsWith(prefix))
    .sort((a, b) => {
      const aTime = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
      const bTime = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
      return bTime - aTime;
    })
    .map(({ id, name }) => ({ id, name }));
}

export async function deleteOldestSweatsSubmission(
  submissions: Array<{ id: string; name: string }>
): Promise<void> {
  if (!submissions.length) return;
  const oldestFile = submissions[submissions.length - 1];
  if (oldestFile?.id) await deleteDriveItem(oldestFile.id);
}

export async function uploadSweatsSubmission(
  username: string,
  buffer: Buffer,
  shareName: boolean = false
): Promise<{
  fileId: string;
  link?: string;
  submissionNumber: number;
  remainingSubmissions: number;
}> {
  const existingSubmissions = await getUserSweatsSubmissions(username);
  if (existingSubmissions.length >= MAX_SWEATS_SUBMISSIONS) {
    await deleteOldestSweatsSubmission(existingSubmissions);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split(".")[0];
  const suffix = shareName ? "share" : "noshare";
  const filename = `${username}_${timestamp}_${suffix}.zip`;

  const uploadResult = await uploadFileToSharePoint({
    folderPath: getSweatsFolderPath(),
    fileName: filename,
    buffer,
  });

  return {
    ...uploadResult,
    submissionNumber: Math.min(existingSubmissions.length + 1, MAX_SWEATS_SUBMISSIONS),
    remainingSubmissions: Math.max(MAX_SWEATS_SUBMISSIONS - existingSubmissions.length - 1, 0),
  };
}
