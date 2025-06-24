import { EmployeeExternal, TeamExternal } from "../interfaces/externalTypes.js";

export default function employeeVerifyMessage(user: EmployeeExternal, team: TeamExternal): string {
    return `[Team information changed]
Hello ${user.name}:
TODO`;
}