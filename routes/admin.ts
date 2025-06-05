import express, { Request, Response, Router } from 'express';
import { AdminExternal } from '../interfaces/externalTypes.js';
import generateAccessToken from '../utils/generateAccessToken.js';
import setTokenAsCookie from '../utils/setTokenAsCookie.js';
import { getAdminByName } from '../services/adminService.js';
import logger from '../logger.js';
const router: Router = express.Router();

router.post('/login', (req: Request, res: Response) => {
  const { name, password } = req.body;

  // Input validation
  if (typeof name !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid name or password.' });
    return;
  }

  try {
    const admin = getAdminByName(name);

    if (!admin || admin.password !== password) {
      logger.warn(`Failed login attempt for admin: ${name}`);
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    res.status(200).json(
      { message: 'Login successful', 
        admin: {
        adminId: admin.adminId,
        name: admin.name
        } as AdminExternal
      }
    );
  } catch (error) {
    logger.error("Error during admin login:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;


