import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import signupRouter from "./signupRoute.js";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/sign-up", signupRouter);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: username },
      });

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

app.get("/users", async (req, res) => {
  const result = await prisma.user.findMany();
  res.json({ result });
});

app.get("/users/:userid", async (req, res) => {
  const userId = req.params.userid;

  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  res.json(result);
});

app.get("/users/:userid/comments", async (req, res) => {
  const userId = req.params.userid;

  const result = await prisma.comment.findMany({
    where: {
      id: userId,
    },
  });

  res.json(result);
});

app.get("/posts", async (req, res) => {
  const result = await prisma.post.findMany();
  res.json({ result });
});

app.get("/posts/:postid", async (req, res) => {
  const postId = req.params.postid;

  const result = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  res.json(result);
});

app.get("/posts/:postid/comments", async (req, res) => {
  const postId = req.params.postid;

  const result = await prisma.comment.findMany({
    where: {
      id: postId,
    },
  });

  res.json(result);
});

app.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    {
      session: false,
    },
    (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        return res
          .status(401)
          .json({ message: info ? info.message : "Login failed" });
      }

      const token = jwt.sign(
        { user: user.id },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" },
      );

      return res.status(200).json({
        message: "Logged in successfully",
        user: { id: user.id, email: user.email }, // Send non-sensitive info
        token,
      });
    },
  )
  (req, res, next);
});



app.listen(5000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port 5000!");
});
