import Attendance from "@/models/Attendance";
import BusRoute from "@/models/BusRoute";
import FeeDue from "@/models/FeeDue";
import HostelBooking, { IHostelBooking } from "@/models/HostelBooking";
import HostelRoom from "@/models/HostelRoom";
import Marks from "@/models/Marks";
import Notification from "@/models/Notification";
import StudentPermission from "@/models/StudentPermission";
import TransportBooking, { ITransportBooking } from "@/models/TransportBooking";

// Callers must have already run connectDB() before using anything in this file.

/**
 * Removes everything that belongs only to this student (`userId` is their User id), for when an
 * admin deletes them: their hostel bed and bus seat are given back, and their fee dues, attendance,
 * marks, campus exit log and notifications are deleted. Shared records — queries, messages, forum
 * posts — and the audit and login history are kept.
 */
export async function deleteStudentRecords(userId: string): Promise<void> {
  const [hostelBooking, transportBooking] = await Promise.all([
    HostelBooking.findOneAndDelete({ userId }).lean<IHostelBooking>(),
    TransportBooking.findOneAndDelete({ userId }).lean<ITransportBooking>(),
  ]);

  await Promise.all([
    hostelBooking &&
      HostelRoom.updateOne({ _id: hostelBooking.roomId, occupiedBeds: { $gt: 0 } }, { $inc: { occupiedBeds: -1 } }),
    transportBooking &&
      BusRoute.updateOne({ _id: transportBooking.routeId, bookedSeats: { $gt: 0 } }, { $inc: { bookedSeats: -1 } }),
    FeeDue.deleteMany({ userId }),
    Attendance.deleteMany({ studentId: userId }),
    Marks.deleteMany({ studentId: userId }),
    StudentPermission.deleteMany({ userId }),
    Notification.deleteMany({ recipientUserId: userId }),
  ]);
}
