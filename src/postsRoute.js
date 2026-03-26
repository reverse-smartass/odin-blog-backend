import { Router } from "express";
import prisma from "../lib/prisma.ts";
import { body, validationResult } from "express-validator";
import passport from "passport";
const postRouter = Router();

const allowedStatuses = ["PUBLISHED", "UNPUBLISHED"];

const validatePost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Post title is required")
    .escape(),
  body("text_content")
    .trim()
    .notEmpty()
    .withMessage("Post content is required")
    .escape(),
  body("published")
    .trim()
    .notEmpty()
    .withMessage("Publishing status is required")
    .escape()
    .custom((value) => {
      if (!allowedStatuses.includes(value)) {
        throw new Error("Invalid selection");
      }
      return true;
    }),
  ,
];

postRouter.post("/newpost", validatePost, passport.authenticate("jwt", { session: false }), 
  async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }

  const {title, text_content, published} = req.body;
  const publishing_status = published === 'PUBLISHED' ? true : false;

  try {

    const post = await prisma.post.create({
      data: {
        title: title,
        content: text_content,
        published: publishing_status,
        author : {
          connect: {id : req.user.id}
        }
      }
    });
    console.log("Created post:", post);
    res.status(201).json({
      message: "post created",
      user: { id: post.id, title: post.title, content: post.content},
    });
  } catch (err) {
    return next(err);
  }
  
});

postRouter.post("/:postid/edit", validatePost, passport.authenticate("jwt", { session: false }), 
  async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      errors: errors.array(),
      previousData: req.body,
    });
  }

  const postId = req.params.postid;
  const {title, text_content, published} = req.body;
  const publishing_status = published === 'PUBLISHED' ? true : false;

  try {

    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title: title,
        content: text_content,
        published: publishing_status,
      }
    });
    console.log("Updated post:", updatedPost);
    res.status(200).json({
      message: "post updated",
      updatedPost
    });
  } catch (err) {
    return next(err);
  }
  
});

postRouter.get("/", async (req, res) => {
  const result = await prisma.post.findMany();
  res.json({ result });
});

postRouter.get("/:postid", async (req, res) => {
  const postId = req.params.postid;

  const result = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  res.json(result);
});

postRouter.get("/:postid/comments", async (req, res) => {
  const postId = req.params.postid;

  const result = await prisma.comment.findMany({
    where: {
      id: postId,
    },
  });

  res.json(result);
});

export default postRouter;
