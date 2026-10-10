import type { IHostelRoom } from "@/models/HostelRoom";
import { toIdString } from "@/lib/utils";

export function serializeRoom(room: IHostelRoom) {
  return {
    id: toIdString(room._id),
    block: room.block,
    roomNumber: room.roomNumber,
    gender: room.gender,
    sharing: room.sharing,
    ac: room.ac,
    occupiedBeds: room.occupiedBeds,
    active: room.active,
  };
}
