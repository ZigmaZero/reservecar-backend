import express, { Request, Response } from 'express';
import axios from 'axios';
import { lineDeleteStateController, lineGetStateController } from '../controllers/lineController.js';

const router = express.Router();

// Gets a state and puts it in the database, then returns it
router.get(`/`, lineGetStateController());

// If the state exists in the database, returns true and deletes it
// Else returns false
router.delete('/:state', lineDeleteStateController())

// process the auth code, exchange for access token, and fetch profile in one endpoint
router.post('/auth', lineAuthController());

export default router;

function lineAuthController() {
    return async (req: Request, res: Response) => {
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
    };
}

