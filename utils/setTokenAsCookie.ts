import { Request, Response } from 'express';

export default function setTokenAsCookie(token: string, req: Request, res: Response): void {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('token', token, {
        path: '/',
        maxAge: 1800 * 1000, // 30 minutes
        httpOnly: true, // Always secure from JavaScript
        sameSite: 'strict',
        secure: isSecure // Set 'secure' flag only if HTTPS is detected
    });
}