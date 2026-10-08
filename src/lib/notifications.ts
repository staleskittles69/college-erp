import Notification, { INotification } from "@/models/Notification";

type GeneralNotificationType = Exclude<INotification["type"], "forum_mention" | "new_message">;

interface NotifyInput {
  recipientUserIds: string[];
  type: GeneralNotificationType;
  actorUserId: string;
  actorName: string;
  title: string;
  preview: string;
  // Portal path the bell opens when clicked, e.g. "/teachers/queries".
  link: string;
}

// Sends a bell notification to each recipient. Callers must have already run connectDB().
// A failure here must never break the action that triggered it, so errors are only logged.
export async function notifyUsers(input: NotifyInput): Promise<void> {
  const recipients = [...new Set(input.recipientUserIds)].filter((id) => id !== input.actorUserId);
  if (recipients.length === 0) return;

  try {
    await Notification.insertMany(
      recipients.map((recipientUserId) => ({
        recipientUserId,
        type: input.type,
        actorUserId: input.actorUserId,
        actorName: input.actorName,
        title: input.title.slice(0, 120),
        messagePreview: input.preview.slice(0, 160),
        link: input.link,
      }))
    );
  } catch (error) {
    console.error("Notification write failed:", error);
  }
}
