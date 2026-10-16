"use server";

import {
  addVotingSession,
  deleteVotingSession,
  finishVoting,
  startVoting,
  submitVote,
  setSessionShowResults,
} from "@/lib/db/repositories/voting.repository";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import {
  type CustomOptionInput,
  type VotingSession,
  type VotingType,
  VOTING_TYPES,
} from "@/types/voting";
import { requirePermission, requireUser } from "@/lib/auth";

function getImageExtension(buffer: Buffer): ".jpg" | ".png" | ".webp" | null {
  if (buffer.length < 4) return null;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return ".jpg";
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSig)) return ".png";
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("utf8") === "RIFF" &&
    buffer.subarray(8, 12).toString("utf8") === "WEBP";
  if (isWebp) return ".webp";
  return null;
}

function requireString(value: FormDataEntryValue | null, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} is required`);

  return value.trim();
}

function requireInt(value: FormDataEntryValue | null, field: string): number {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} is required`);

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid integer`);

  return parsed;
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseNomineeIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "data", "voting");

type RawOption = {
  id?: string;
  name: string;
  description?: string;
  photoPath?: string;
  descriptionPhotoPath?: string;
};
type Extractor = (_fd: FormData) => Partial<VotingSession> | Promise<Partial<VotingSession>>;

async function savePhoto(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) throw new Error("A imagem não pode ter mais de 5MB");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = getImageExtension(buffer);
  if (!ext) throw new Error("Apenas formatos JPEG, PNG e WebP são permitidos");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, safeName), buffer);
  return `/api/voting/photo/${safeName}`;
}

function parseOptions(raw: string): RawOption[] {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("Erro ao processar as opções customizadas.", { cause: err });
  }
}

async function extractCustomOptions(fd: FormData): Promise<CustomOptionInput[]> {
  const valid = parseOptions(requireString(fd.get("customOptions"), "customOptions"))
    .map((opt, i) => ({ opt, i, name: (opt.name || "").trim() }))
    .filter(({ name }) => name);

  if (valid.length < 2) throw new Error("Pelo menos duas opções devem ser configuradas.");

  return Promise.all(
    valid.map(async ({ opt, i, name }) => {
      const id = opt.id || `opt_${i + 1}_${crypto.randomUUID().slice(0, 8)}`;
      const file = fd.get(`customImage_${id}`) ?? fd.get(`customImage_${i}`);
      const descFile = fd.get(`customDescImage_${id}`) ?? fd.get(`customDescImage_${i}`);
      const photoPath =
        file instanceof File && file.size > 0
          ? await savePhoto(file)
          : opt.photoPath?.trim() || undefined;

      const descriptionPhotoPath =
        descFile instanceof File && descFile.size > 0
          ? await savePhoto(descFile)
          : opt.descriptionPhotoPath?.trim() || photoPath;

      return {
        id,
        name,
        description: opt.description?.trim() || undefined,
        photoPath,
        descriptionPhotoPath: descriptionPhotoPath || photoPath,
      };
    })
  );
}

const extractors: Record<VotingType, Extractor> = {
  [VOTING_TYPES.ACTIVITY]: (fd) => ({
    activityId: requireString(fd.get("activityId"), "activityId"),
    nomineeIds: parseNomineeIds(optionalString(fd.get("activityNominees"))),
  }),
  [VOTING_TYPES.USERS]: (fd) => ({
    nomineeIds: parseNomineeIds(requireString(fd.get("customUsers"), "customUsers")),
  }),
  [VOTING_TYPES.CUSTOM]: async (fd) => ({ customOptions: await extractCustomOptions(fd) }),
};

async function extractVotingSessionData(fd: FormData): Promise<Partial<VotingSession>> {
  const type = requireString(fd.get("type"), "type");
  if (!Object.hasOwn(extractors, type)) throw new Error(`Unsupported voting type: ${type}`);

  return {
    name: requireString(fd.get("name"), "name"),
    description: optionalString(fd.get("description")),
    type: type as VotingType,
    startAt: optionalString(fd.get("startAt")),
    endAt: optionalString(fd.get("endAt")),
    ...(await extractors[type as VotingType](fd)),
  };
}

export async function createVotingSessionAction(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePermission("voting:write");

  try {
    const sessionData = await extractVotingSessionData(formData);
    await addVotingSession(sessionData);

    return { ok: true };
  } catch (err) {
    console.error("Failed to create voting session:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao criar sessão de votação",
    };
  }
}

export async function deleteVotingSessionAction(formData: FormData): Promise<void> {
  await requirePermission("voting:write");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  await deleteVotingSession(sessionId);
}

export async function startVotingAction(formData: FormData): Promise<void> {
  await requirePermission("voting:write");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");

  await startVoting(sessionId);
}

export async function finishVotingAction(formData: FormData): Promise<void> {
  await requirePermission("voting:write");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");

  await finishVoting(sessionId);
}

export async function submitVoteAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  const nomineeId = requireString(formData.get("nomineeId"), "nomineeId");

  await submitVote(sessionId, user.istid, nomineeId);
}

export async function togglePublishResultsAction(formData: FormData): Promise<void> {
  await requirePermission("voting:write");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  const showResults = formData.get("showResults") === "true";

  await setSessionShowResults(sessionId, showResults);
}
