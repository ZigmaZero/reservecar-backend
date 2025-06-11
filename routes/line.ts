import express, { Request, Response, Router } from 'express';
import { getState, storeState } from '../services/lineService';
import generateRandomState from '../utils/generateRandomState';

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

export default router;