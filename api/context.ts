import { db } from "./db";
import { PrismaClient, User } from "@prisma/client";
import jwt from "jsonwebtoken";

export interface Context {
  db: PrismaClient;
  currentUser: User;
}

export const context = async ({ req }) => {
  const token = req.headers.authorization ?? "";

  let payload;
  if (token) {
    payload = jwt.verify(token, process.env.JWT_SECRET as string);
  }
  return {
    db,
    currentUser: payload,
  };
};
