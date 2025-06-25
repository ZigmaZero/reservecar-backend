import { ReservationExternal } from "../interfaces/externalTypes.js";

export default function jobCheckinMessage(reservation: ReservationExternal): string {
    return `[Checkin]
Employee: ${reservation.user}
Car: ${reservation.car}
Description: ${reservation.description}`;
}