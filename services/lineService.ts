import Database from 'better-sqlite3';
import db from '../db.js';
import axios from 'axios';

export function storeState(state: string): Database.RunResult {
    const currTime = new Date().toISOString();
    const stmt = db.prepare<[string, string], {state: string, createdAt: string}>(`INSERT INTO LineLoginState (state, createdAt) VALUES (?, ?)`);
    return stmt.run(state, currTime);
}

export function getState(state: string): {state: string, createdAt: string} | undefined {
    const stmt = db.prepare<string, {state: string, createdAt: string}>(`SELECT * FROM LineLoginState WHERE state = ?`);
    return stmt.get(state);
}

export function removeState(state: string): Database.RunResult {
    const stmt = db.prepare<string>(`DELETE FROM LineLoginState WHERE state = ?`);
    return stmt.run(state);
}

export const message = async(lineId: string, message: string): Promise<{
    success: boolean,
    message?: string,
    status?: number,
    error?: string
}> => {
    if (process.env.NODE_ENV === 'test') {
        // SHUT
        return { success: false, error: "Sending messages are disabled during testing." };
    }

    const access_token = process.env.LINE_MESSAGING_API_ACCESS_TOKEN;
    if (!access_token) {
        return { success: false, error: "Missing LINE_MESSAGING_API_ACCESS_TOKEN" };
    }
    try {
        const res = await axios.post(
            "https://api.line.me/v2/bot/message/push",
            {
                to: lineId,
                messages: [
                    {
                        type: "text",
                        text: message
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );
        return {
            success: true,
            message: "Message sent successfully",
            status: res.status
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Unknown error",
            status: error?.response?.status
        };
    }
}