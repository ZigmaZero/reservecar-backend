import { EmployeeExternal } from "../interfaces/externalTypes.js";

export default function employeeUpdateMessage(oldUser: EmployeeExternal, newUser: EmployeeExternal): string {
  return `[Employee information changed]
Hello ${oldUser.name}:
An administrator has changed your employee information in the ReserveCar system.
The changes are as follows:
${oldUser.name !== newUser?.name ?
      `- Old name: ${oldUser.name}
+ New name: ${newUser?.name}` : ""}${oldUser.teamId !== newUser?.teamId ?
      `- Old team: ${oldUser.teamName || "None"}
+ New team: ${newUser?.teamName || "None"}` : ""}
The changes will be applied effective immediately.
Thank you for using Jastel ReserveCar system.`;
}
