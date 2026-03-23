import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.ts';

const app = express();

app.get('/users', async (req, res) => {
    
  const result = await prisma.user.findMany();
    res.json({result});
});

app.listen(5000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port 5000!");
});