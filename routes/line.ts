import express, { Request, Response, Router } from 'express';
import { getState, storeState } from '../services/lineService';
import generateRandomState from '../utils/generateRandomState';

const router = express.Router();

// Gets a (freshly created) LINE Login state from the database
router.get(`/`, (req: Request, res: Response) => {
    var state = generateRandomState();
    while(getState(state))
    {
        state = generateRandomState();
    }
    storeState(state);
    res.status(200).json({state});
})

// If the state exists in the database, returns true and deletes it
// Else returns false
router.delete('/', (req: Request, res: Response) => {
    const state = req.body.state;
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