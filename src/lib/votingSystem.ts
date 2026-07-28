"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/user";
import { VotingSession, VotingType } from "@/types/voting";
import {
  addVotingSession,
  deleteVotingSession,
  finishVoting,
  startVoting,
  submitVote,
  updateVotingSession,
} from "@/utils/db/votingQueries";
import { serverCheckRoles } from "@/lib/auth";

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

/**
 * Extracts and validates VotingSession data from FormData.
 */
function extractVotingSessionData(formData: FormData): Partial<VotingSession> {
  const type = requireString(formData.get("type"), "type") as VotingType;

  const baseData: Partial<VotingSession> = {
    name: requireString(formData.get("name"), "name"),
    description: optionalString(formData.get("description")),
    type,
    startAt: optionalString(formData.get("startAt")),
    endAt: optionalString(formData.get("endAt")),
  };

  switch (type) {
    case "activity":
      return {
        ...baseData,
        activityId: requireString(formData.get("activityId"), "activityId"),
        nomineeIds: parseNomineeIds(optionalString(formData.get("activityNominees"))),
      };
    case "users":
      return {
        ...baseData,
        nomineeIds: parseNomineeIds(requireString(formData.get("customUsers"), "customUsers")),
      };
    case "custom":
      return {
        ...baseData,
        nomineeIds: parseNomineeIds(
          requireString(formData.get("customNominees"), "customNominees")
        ),
      };
    default:
      throw new Error(`Unsupported voting type: ${type}`);
  }
}

function revalidateVotingPaths() {
  revalidatePath("/voting");
  revalidatePath("/voting/manage");
  revalidatePath("/dinner");
}

export async function createVotingSessionAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const sessionData = extractVotingSessionData(formData);
  await addVotingSession(sessionData);

  revalidateVotingPaths();
  redirect("/voting/manage");
}

export async function updateVotingSessionAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  const sessionData = extractVotingSessionData(formData);

  await updateVotingSession(sessionId, sessionData);

  revalidateVotingPaths();
  redirect("/voting/manage");
}

export async function deleteVotingSessionAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  await deleteVotingSession(sessionId);
  revalidateVotingPaths();
}

export async function startVotingAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");

  await startVoting(sessionId);
  revalidateVotingPaths();
}

export async function finishVotingAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");

  await finishVoting(sessionId);
  revalidateVotingPaths();
}

export async function submitVoteAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized || !auth.user) throw new Error("Not authenticated");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  const nomineeId = requireString(formData.get("nomineeId"), "nomineeId");

  await submitVote(sessionId, auth.user.istid, nomineeId);
}
