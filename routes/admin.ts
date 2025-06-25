import express, { Router } from 'express';
import adminLoginController from '../controllers/adminController.js';
const router: Router = express.Router();

router.post('/login', adminLoginController());

export default router;