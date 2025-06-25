import express, { Router } from 'express';
import { adminLoginController, adminUpdateController } from '../controllers/adminController.js';
const router: Router = express.Router();

router.post('/login', adminLoginController());

router.put('/:adminId', adminUpdateController());

export default router;