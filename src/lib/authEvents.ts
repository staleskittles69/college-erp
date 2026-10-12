import { NextRequest } from "next/server";
import AuthEvent, { AuthEventType } from "@/models/AuthEvent";
import User from "@/models/User";
import { clientIp } from "@/lib/rateLimit";

interface AuthEventInput {
  type: AuthEventType;
  userId?: string;
  userName?: string;
  role?: "admin" | "student" | "teacher";
  identifier?: string;
  detail?: string;
}

// Records login activity for the admin "Login activity" log. Callers must have run
// connectDB(). Never throws — a logging failure must not break logging in.
export async function logAuthEvent(request: NextRequest, event: AuthEventInput): Promise<void> {
  try {
    let userName = event.userName;
    if (!userName && event.userId) {
      userName = (await User.findById(event.userId).select("name").lean<{ name?: string }>())?.name;
    }
    await AuthEvent.create({
      ...event,
      userName,
      identifier: event.identifier?.slice(0, 120),
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? undefined,
    });
  } catch (error) {
    console.error("Auth event log write failed:", error);
  }
}
