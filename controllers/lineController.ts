import { getState, storeState } from "../services/lineService.js";
import { Request, Response } from "express";
import generateRandomState from "../utils/generateRandomState.js";

function generateUniqueState(maxTries = 10): string | null {
    for (let i = 0; i < maxTries; i++) {
        const state = generateRandomState();
        if (!getState(state)) {
            return state;
        }
    }
    return null;
}

export function lineDeleteStateController() {
    return (req: Request, res: Response) => {
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
    };
}

export function lineGetStateController() {
    return (req: Request, res: Response) => {
        const state = generateUniqueState();
        if (!state) {
            res.status(500).json({ message: "Something impossible occurred. Try again later." });
            return;
        }
        storeState(state);
        res.status(200).json({ state });
    };
}
