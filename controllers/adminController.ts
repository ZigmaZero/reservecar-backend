import { Request, Response } from 'express';
import { AdminExternal } from '../interfaces/externalTypes.js';
import generateAccessToken from '../utils/generateAccessToken.js';
import { authAdmin, getAdminById, updateAdmin } from '../services/adminService.js';
import logger from '../logger.js';

export function adminLoginController() {
  return (req: Request, res: Response) => {
    const { name, password } = req.body;

    // Input validation
    if (typeof name !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Invalid name or password.' });
      return;
    }

    try {
      const admin = authAdmin(name, password);

      if (!admin) {
        logger.warn(`Failed login attempt for admin: ${name}`);
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
      }

      // Generate JWT token and set it as a cookie
      const token = generateAccessToken(admin);
      res.status(200).json(
        {
          message: 'Login successful',
          admin: {
            id: admin.id,
            name: admin.name
          } as AdminExternal,
          token: token
        }
      );
    } catch (error) {
      logger.error("Error during admin login:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function adminUpdateController()
{
  return (req: Request, res: Response) => {
    const adminId = parseInt(req.params.adminId, 10);
    const { name, password } = req.body;

    // Input validation
    if (typeof name !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Invalid name or password.' });
      return;
    }

    try {

      const admin = getAdminById(adminId);

      if (!admin) {
        res.status(404).json({ error: 'Admin not found.' });
        return;
      }

      const runresult = updateAdmin(adminId, name, password);

      if (!runresult || runresult.changes === 0)
      {
        res.status(404).json({ error: 'Admin not found.' });
        return;
      }

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error("Error during admin update:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}