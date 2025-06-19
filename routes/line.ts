import express, { Request, Response, Router } from 'express';
import { getState, storeState } from '../services/lineService.js';
import generateRandomState from '../utils/generateRandomState.js';
import axios from 'axios';

const router = express.Router();

function generateUniqueState(maxTries = 10): string | null {
    for (let i = 0; i < maxTries; i++) {
        const state = generateRandomState();
        if (!getState(state)) {
            return state;
        }
    }
    return null;
}

router.get(`/`, (req: Request, res: Response) => {
    const state = generateUniqueState();
    if (!state) {
        res.status(500).json({ message: "Something impossible occurred. Try again later." });
        return;
    }
    storeState(state);
    res.status(200).json({ state });
});

// If the state exists in the database, returns true and deletes it
// Else returns false
router.delete('/:state', (req: Request, res: Response) => {
    const state = req.params.state;
    if (!state) {
        res.status(400).json({ success: false, message: "State is required" });
        return;
    }

    if (getState(state)) {
        // Optionally, you might want to delete the state here if your getState does not do so
        res.status(200).json({ success: true });
        return;
    } else {
        res.status(404).json({ success: false });
        return;
    }
})

// process the auth code, exchange for access token, and fetch profile in one endpoint
router.post('/auth', async (req: Request, res: Response) => {
    const { code, redirect_uri } = req.body;
    const grant_type = "authorization_code";
    const client_id = process.env.LINE_CLIENT_ID;
    const client_secret = process.env.LINE_CLIENT_SECRET;

    if (!code || !redirect_uri) {
        res.status(400).json({ message: "No code or redirect URI" });
        return;
    }

    if (!client_id || !client_secret) {
        res.status(500).json({ message: "Missing environment variables." });
        return;
    }

    const params = new URLSearchParams({
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret
    });

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://api.line.me/oauth2/v2.1/token',
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const access_token = tokenResponse.data.access_token;

        // Fetch profile using the access token
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        // Return profile info (omit access_token if you want)
        res.status(200).json({
            profile: profileResponse.data
        });
    } catch (error: any) {
        res.status(500).json({
            message: `Token exchange/profile fetch failed`,
            error: error.response?.data || error.message
        });
    }
});

export default router;