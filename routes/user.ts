import express, {  } from 'express';
import authorizeAsEmployee from '../middlewares/authorizeAsEmployee.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import { 
  userRegisterController, 
  userLoginController, 
  userCheckinController, 
  userCheckoutController, 
  userGetCarsController, 
  userGetReservationsController 
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', userRegisterController())

router.post('/login', userLoginController());

// Checkin
router.post('/checkin', authenticateToken, authorizeAsEmployee, userCheckinController());

// Checkout
router.post('/checkout', authenticateToken, authorizeAsEmployee, userCheckoutController());

// Get list of cars prioritized by the specified team, if any
router.get('/cars', authenticateToken, authorizeAsEmployee, userGetCarsController());

// Get list of reservations for the logged-in user
router.get('/reservations', authenticateToken, authorizeAsEmployee, userGetReservationsController());

export default router;