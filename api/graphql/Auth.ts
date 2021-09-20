import { Context } from "../context";
import { objectType, extendType, nonNull, stringArg } from "nexus";
import { UserInputError, AuthenticationError } from "apollo-server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const LoginResponse = objectType({
  name: "LoginResponse",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.field("user", {
      type: "User",
    });
  },
});
export const AuthQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("me", {
      type: "User",
      async resolve(_root, _args, { db, currentUser }: Context) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated user");
        }
        const user = await db.user.findUnique({
          where: {
            id: currentUser.id,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        return user;
      },
    });
  },
});
export const AuthMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("signup", {
      type: "User",
      args: {
        name: nonNull(stringArg()),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(_root, { name, email, password }, { db }: Context) {
        const user = await db.user.findUnique({
          where: {
            email,
          },
        });

        if (user) {
          throw new UserInputError("Account already exists", {
            email: "Email address already exists! Try another email.",
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const isAdmin =
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD;

        console.log(isAdmin);
        const createUser = await db.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            isAdmin,
          },
        });

        return createUser;
      },
    });

    t.nonNull.field("login", {
      type: "LoginResponse",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(_root, { email, password }, { db }: Context) {
        const user = await db.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          throw new UserInputError("Account not found", {
            email: "Email address is incorrect",
          });
        }

        const matchPassword = await bcrypt.compare(password, user.password);

        if (!matchPassword) {
          throw new UserInputError("Account not fount", {
            password: "Password is incorrect",
          });
        }
        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
          expiresIn: "12h",
        });

        return {
          user,
          token,
        };
      },
    });
  },
});
