import { EmployeeExternal } from "../interfaces/externalTypes.js";

export default function employeeVerifyMessage(user: EmployeeExternal): string {
    return `[Employee verification]
Hello ${user.name}:
An administrator has verified your identity.
You may use the ReserveCar system by interacting with the rich menu.
Thank you for using the ReserveCar system.`;
}