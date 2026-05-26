import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';
import { validateAddress as validateAddressWithGoogle } from '../controllers/addressValidation.controller.js';

const router = express.Router();

router.get('/profile',             authenticate, userController.getProfile);
router.put('/profile',             authenticate, userController.updateProfile);
router.post('/complete-profile',   authenticate, userController.completeProfile);
router.put('/change-password',     authenticate, userController.changePassword);

import { body, validationResult } from 'express-validator';

const validateAddress = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Phone must be exactly 10 digits'),
  body('line1').notEmpty().withMessage('Address Line 1 is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    next();
  }
];

// Addresses
router.get('/addresses',           authenticate, userController.getAddresses);
router.post('/addresses',          authenticate, validateAddress, userController.addAddress);
router.put('/addresses/:id',       authenticate, validateAddress, userController.updateAddress);
router.delete('/addresses/:id',    authenticate, userController.deleteAddress);
router.patch('/addresses/:id/default', authenticate, userController.setDefaultAddress);
router.post('/addresses/validate', authenticate, validateAddressWithGoogle);

// Wishlist
router.get('/wishlist',            authenticate, userController.getWishlist);
router.post('/wishlist/:productId', authenticate, userController.addToWishlist);
router.delete('/wishlist/:productId', authenticate, userController.removeFromWishlist);

// Reviews
router.post('/reviews',            authenticate, userController.addReview);

export default router;
