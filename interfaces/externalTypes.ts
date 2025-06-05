// frontend types

export type EmployeeExternal = {
    userId: number,
    lineId: string,
    name: string,
    verified: boolean,
    teamId?: number
}

export type TeamExternal = {
    teamId: number,
    name: string
}

export type CarExternal = {
    carId: number,
    plateNumber: string,
    teamId: number
}

export type AdminExternal = {
    adminId: number,
    name: string
}

export type ReservationExternal = {
    reservationId: number,
    userId: number,
    carId: number,
    checkinTime: string, // i am NOT gonna keep this as a Date
    checkoutTime?: string // screw you
}