import bcrypt from 'bcryptjs';

export default async function hashPassword (password) {
    try {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (err) {
        console.error("Error hashing password:", err);
    }
};