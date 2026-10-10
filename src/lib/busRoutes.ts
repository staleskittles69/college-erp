import type { IBusRoute, IBusStop } from "@/models/BusRoute";
import { toIdString } from "@/lib/utils";

export function serializeRoute(route: IBusRoute) {
  return {
    id: toIdString(route._id),
    routeNumber: route.routeNumber,
    name: route.name,
    stops: route.stops.map((stop) => ({ name: stop.name, pickupTime: stop.pickupTime })),
    annualFee: route.annualFee,
    capacity: route.capacity,
    bookedSeats: route.bookedSeats,
    active: route.active,
  };
}

export function cleanStops(stops: IBusStop[]): IBusStop[] {
  return stops.map((stop) => ({ name: stop.name.trim(), pickupTime: stop.pickupTime.trim() }));
}
