import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notification, { INotification } from "@/models/Notification";
import { getAuth } from "@/lib/api-auth";

function serializeNotification(notification: INotification) {
  return {
    _id: notification._id.toString(),
    type: notification.type,
    actorName: notification.actorName,
    forumId: notification.forumId?.toString(),
    forumName: notification.forumName,
    conversationId: notification.conversationId?.toString(),
    conversationName: notification.conversationName,
    messageId: notification.messageId.toString(),
    messagePreview: notification.messagePreview,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientUserId: payload.userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean<INotification[]>(),
      Notification.countDocuments({ recipientUserId: payload.userId, read: false }),
    ]);

    return NextResponse.json({
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
