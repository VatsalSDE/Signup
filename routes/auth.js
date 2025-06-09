const express = require('express');
const User = require('../models/User');
const { validateRegistration } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phoneNo
 *         - createPassword
 *         - confirmPassword
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           pattern: ^[a-zA-Z\s]+$
 *           description: User's first name (letters and spaces only)
 *           example: John
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           pattern: ^[a-zA-Z\s]+$
 *           description: User's last name (letters and spaces only)
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         phoneNo:
 *           type: string
 *           pattern: ^[0-9]{10}$
 *           description: User's 10-digit phone number
 *           example: "9876543210"
 *         createPassword:
 *           type: string
 *           minLength: 6
 *           maxLength: 128
 *           description: Password with at least one uppercase, lowercase, number, and special character
 *           example: Password@123
 *         confirmPassword:
 *           type: string
 *           description: Must match the createPassword field
 *           example: Password@123
 *     
 *     UserResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60f1b2b3c4d5e6f7a8b9c0d1
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           example: john.doe@example.com
 *         phoneNo:
 *           type: string
 *           example: "9876543210"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: User registered successfully
 *         data:
 *           $ref: '#/components/schemas/UserResponse'
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Registration failed
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNo, createPassword } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phoneNo }]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
                errors: [{
                    field: existingUser.email === email ? 'email' : 'phoneNo',
                    message: existingUser.email === email 
                        ? 'Email is already registered' 
                        : 'Phone number is already registered'
                }]
            });
        }
        
        // Create new user
        const user = new User({
            firstName,
            lastName,
            email,
            phoneNo,
            password: createPassword
        });
        
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: 'User already exists',
                errors: [{
                    field: field,
                    message: `${field} is already registered`
                }]
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: [{
                field: 'server',
                message: 'Something went wrong. Please try again later.'
            }]
        });
    }
});

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all registered users (for testing purposes)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;