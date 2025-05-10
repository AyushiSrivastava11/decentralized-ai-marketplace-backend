import { Request, Response } from "express";
import prisma from "../database/prismaClient";
import { hashPassword, verifyPassword, generateToken } from "./auth.utils";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) res.status(400).json({ message: "Email already in use" });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
 
  // console.log("Login request body:", req.body);
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) res.status(401).json({ message: "Invalid credentials" });

  if (user) {
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
};
