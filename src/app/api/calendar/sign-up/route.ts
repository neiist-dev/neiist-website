import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  signUpToEvent,
  removeSignUpFromEvent,
  getActivityByIdFromDb,
} from "@/lib/db/repositories/event.repository";
import { getUser } from "@/lib/db/repositories/user.repository";
import { sendEmail, sendEventTicketEmail } from "@/lib/email";
import { getEventCancelledEmailTemplate } from "@/lib/email/templates/events";
import { handleApiError } from "@/utils/apiErrorUtils";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = auth.user;

    const { eventId, signUp, formResponses } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    const activity = await getActivityByIdFromDb(eventId);
    if (!activity) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (signUp) {
      if (!activity.signupEnabled) {
        return NextResponse.json(
          { error: "As inscrições para este evento estão desativadas." },
          { status: 403 }
        );
      }

      if (activity.signupDeadline && new Date() > new Date(activity.signupDeadline)) {
        return NextResponse.json(
          { error: "O prazo limite para inscrições já terminou." },
          { status: 403 }
        );
      }

      if (activity.end && new Date() > new Date(activity.end)) {
        return NextResponse.json(
          { error: "Não é possível inscrever num evento já terminado." },
          { status: 403 }
        );
      }

      if (activity.ticketProductId) {
        return NextResponse.json(
          { error: "Este evento requer a aquisição de um bilhete na loja." },
          { status: 400 }
        );
      }

      const ticket = await signUpToEvent(eventId, user.istid, undefined, formResponses);

      // Send (Ticket pass confirmation)
      getUser(user.istid)
        .then(async (user) => {
          if (!user) return;
          const recipientEmail =
            (user.alternativeEmailVerified && user.alternativeEmail) || user.email;
          if (!recipientEmail) return;

          const start = activity.start || new Date();
          const eventEnd = activity.end || null;

          await sendEventTicketEmail({
            eventId: activity.id,
            eventTitle: activity.title,
            eventDescription: activity.description,
            eventLocation: activity.location,
            eventStart: start,
            eventEnd,
            attendeeName: user.name,
            recipientEmail,
            ticketCode: ticket?.ticket_code || "CONFIRMED",
            formResponses,
          });
        })
        .catch((err) => console.warn("[sign-up route] Email E1 dispatch failed:", err));

      revalidatePath("/activities");
      revalidatePath("/my-tickets");

      return NextResponse.json({
        success: true,
        signedUp: true,
        ticketCode: ticket?.ticket_code,
      });
    } else {
      // Cancellation
      await removeSignUpFromEvent(eventId, user.istid);

      // Send Email (Cancellation confirmation)
      getUser(user.istid)
        .then(async (user) => {
          if (!user) return;
          const recipientEmail =
            (user.alternativeEmailVerified && user.alternativeEmail) || user.email;
          if (!recipientEmail) return;

          const html = getEventCancelledEmailTemplate({
            eventTitle: activity.title,
            attendeeName: user.name,
          });

          await sendEmail({
            to: recipientEmail,
            subject: `[NEIIST] Inscrição Cancelada: ${activity.title}`,
            html,
          });
        })
        .catch((err) => console.warn("[sign-up route] Email E2 dispatch failed:", err));

      revalidatePath("/activities");
      revalidatePath("/my-tickets");

      return NextResponse.json({
        success: true,
        signedUp: false,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
