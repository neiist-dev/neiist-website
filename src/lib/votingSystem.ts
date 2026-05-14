"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { UserRole } from "@/types/user";
import {
  clearVotingSync,
  createVotingSession,
  finishVoting,
  getVotingSync,
  startVoting,
  submitVote,
} from "@/utils/dbUtils";

function requireString(value: FormDataEntryValue | null, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function requireInt(value: FormDataEntryValue | null, field: string): number {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid integer`);
  return parsed;
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function revalidateVotingPaths() {
  revalidatePath("/voting");
  revalidatePath("/voting/manage");
  revalidatePath("/dinner");
}

export async function createVotingSessionAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const name = requireString(formData.get("name"), "name");
  const activityId = requireString(formData.get("activityId"), "activityId");
  const description = optionalString(formData.get("description"));

  await createVotingSession(name, activityId, description);
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

export async function clearVotingSyncAction(): Promise<void> {
  const auth = await serverCheckRoles([UserRole._ADMIN]);
  if (!auth.isAuthorized) throw new Error("Insufficient permissions");

  const sync = await getVotingSync();
  if (sync?.sessionStatus === "voting") {
    throw new Error("Cannot clear active session while voting is in progress");
  }

  await clearVotingSync();
  revalidateVotingPaths();
}

export async function submitVoteAction(formData: FormData): Promise<void> {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized || !auth.user) throw new Error("Not authenticated");

  const sessionId = requireInt(formData.get("sessionId"), "sessionId");
  const nomineeIstid = requireString(formData.get("nomineeIstid"), "nomineeIstid");

  await submitVote(sessionId, auth.user.istid, nomineeIstid);
  revalidateVotingPaths();
  redirect("/voting");
}
