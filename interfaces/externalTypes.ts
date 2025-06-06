// frontend types

import { Employee } from "./internalTypes"

export type EmployeeExternal = {
    id: number,
    lineId: string,
    name: string,
    verified: boolean,
    teamId?: number
}

export type AdminExternal = {
    id: number,
    name: string
}

export function mapEmployeeToExternal(employee: Employee): EmployeeExternal {
    return {
        id: employee.userId,
        lineId: employee.lineId,
        name: employee.name,
        verified: employee.verified,
        teamId: employee.teamId
    };
}

export function mapAdminToExternal(admin: { adminId: number, name: string }): AdminExternal {
    return {
        id: admin.adminId,
        name: admin.name
    };
}