import { EmployeeExternal, TeamExternal } from "../interfaces/externalTypes.js";

export default function teamUpdateMessage(oldTeam: TeamExternal, newTeam: TeamExternal): string {
    return `[Team information changed]
An administrator updated information for the team you're assigned to:
- Old Name: ${oldTeam.name}
+ New Name: ${newTeam.name}`;
}