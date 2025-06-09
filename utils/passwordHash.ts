import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
    try {
        const saltRounds = 12;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        return hash;
    } catch (err) {
        console.error("Error hashing password:", err);
        throw err;
    }
}

export function comparePassword(plainPassword: string, hashedPassword: string): boolean {
    try {
        return bcrypt.compareSync(plainPassword, hashedPassword);
    } catch (err) {
        console.error("Error comparing passwords:", err);
        return false;
    }
}