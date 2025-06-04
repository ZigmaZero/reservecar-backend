// backend types.

export type Employee = {
    userId: number,
    lineId: string,
    name: string,
    verified: boolean,
    teamId?: number,
    createdAt: string,
    updatedAt: string,
    deletedAt?: string
}

export type Team = {
    teamId: number,
    name: string
}

export type Car = {
    carId: number,
    plateNumber: string,
    teamId: number
}

export type Admin = {
    adminId: number,
    name: string,
    password: string,
    createdAt: string,
    updatedAt: string,
    deletedAt?: string
}

export type Reservation = {
    reservationId: number,
    userId: number,
    carId: number,
    checkinTime: string,
    checkoutTime?: string
}