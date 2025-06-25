import express, { Router } from 'express';
import { adminLoginController, adminUpdateController } from '../controllers/adminController.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
const router: Router = express.Router();

router.post('/login', adminLoginController());

router.put('/:adminId', authenticateToken, authorizeAsAdmin, adminUpdateController());

export default router;