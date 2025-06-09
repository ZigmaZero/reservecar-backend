// API types for the application

export type EmployeeExternal = {
    id?: number,
    lineId: string,
    name: string,
    verified: boolean,
    teamId?: number,
    teamName?: string // easy lookup for UI
}

export type TeamExternal = {
    id?: number,
    name: string
}

export type CarExternal = {
    id?: number,
    plateNumber: string,
    teamId?: number,
    teamName?: string // easy lookup for UI
}

export type AdminExternal = {
    id?: number,
    name: string
}

export type ReservationExternal = {
    id?: number,
    userId: number,
    user: string, // easy lookup for UI
    carId: number,
    car: string, // easy lookup for UI
    description: string,
    checkinTime: string,
    checkoutTime?: string
}