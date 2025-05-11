import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'supersecret';

export interface AuthRequest extends Request {
  user?: { userId: string, role: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction):Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token){ 
    res.status(401).json({ message: 'Missing token' }); 
    return; 
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles: string[]):RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
};
