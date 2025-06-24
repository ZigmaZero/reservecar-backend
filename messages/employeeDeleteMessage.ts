import { EmployeeExternal } from "../interfaces/externalTypes.js";

export default function employeeDeleteMessage(user: EmployeeExternal): string {
  return `[Employee removal notice]
Dear ${user.name}:
An administrator has removed you from the ReserveCar system.
If you believe this is in error, please contact the administrator and register to the system again.
Thank you for using Jastel ReserveCar System.`
}