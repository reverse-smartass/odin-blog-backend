import {Router} from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.ts';
import { body, validationResult } from "express-validator";
import bcrypt from 'bcryptjs';

const signupRouter = Router();

const validateSignUp = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .escape(),
  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .escape(),
  body("email")
    .trim()
    .isEmail()
    .withMessage("email must be a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  // Custom validator to check if passwords match
  body("password_confirm").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

signupRouter.post("/", validateSignUp, async (req, res, next) => {
  console.log(JSON.stringify(req.body));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }
  const { first_name, last_name, email, password, password_confirm } = req.body;
  if (first_name && last_name && email && password && password_confirm) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: first_name + " " + last_name,
          email: email,
          password: hashedPassword,
        },
        include: {
          posts: true,
        },
      });
      console.log("Created user:", user);
      res.status(201).json({message: 'user created', user : {id: user.id, email: user.email, uname: user.name}, token});
    } catch (err) {
      return next(err);
    }
  }
});

export default signupRouter;