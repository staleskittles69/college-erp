import mongoose from "mongoose";
import Conversation, { IConversationParticipant } from "@/models/Conversation";
import User from "@/models/User";

const STAFF_GROUP_NAME = "All Staff";

interface StaffUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: "admin" | "teacher";
}

// Finds the singleton staff group conversation, creating it on first use and reconciling
// its membership against the current admin/teacher roster on every call. This is the only
// mechanism that ever adds admins to the group — there's no admin-creation route to hook
// into (admins only exist via seed scripts) — and it also self-heals for any teacher added
// or removed through a path that bypassed the direct create/delete hooks below.
export async function getOrCreateStaffGroupConversation() {
  const staff = await User.find({ role: { $in: ["admin", "teacher"] } })
    .select("name role")
    .lean<StaffUser[]>();

  const group = await Conversation.findOne({ isStaffGroup: true });

  if (!group) {
    return Conversation.create({
      kind: "group",
      isStaffGroup: true,
      name: STAFF_GROUP_NAME,
      participants: staff.map((user) => ({
        userId: user._id,
        name: user.name ?? "Unknown",
        role: user.role,
        lastReadAt: new Date(0),
      })),
      lastMessageAt: new Date(),
    });
  }

  const existingIds = new Set(
    group.participants.map((participant: IConversationParticipant) => participant.userId.toString())
  );
  const missing = staff.filter((user) => !existingIds.has(user._id.toString()));
  if (missing.length > 0) {
    for (const user of missing) {
      group.participants.push({ userId: user._id, name: user.name ?? "Unknown", role: user.role, lastReadAt: new Date(0) });
    }
    await group.save();
  }

  return group;
}

export function buildDmParticipantKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join("_");
}

// Fast-path hook, called from teacher create. If the group doesn't exist yet (e.g. no
// admin has opened Messages since deploy), this is a harmless no-op — the reconciliation
// in getOrCreateStaffGroupConversation() above picks it up on the next read.
export async function addUserToGroupConversation(
  userId: string,
  name: string,
  role: "admin" | "teacher"
): Promise<void> {
  await Conversation.updateOne(
    { isStaffGroup: true, "participants.userId": { $ne: userId } },
    { $push: { participants: { userId, name, role, lastReadAt: new Date(0) } } }
  );
}

// Fast-path hook, called from teacher delete.
export async function removeUserFromGroupConversation(userId: string): Promise<void> {
  await Conversation.updateOne({ isStaffGroup: true }, { $pull: { participants: { userId } } });
}
