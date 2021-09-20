import { AuthenticationError, UserInputError } from "apollo-server";
import { objectType, extendType, nonNull, stringArg, intArg } from "nexus";
import { Context } from "../context";
import bcrypt from "bcrypt";

export const User = objectType({
  name: "User",
  definition(t) {
    t.int("id");
    t.string("email");
    t.string("password");
    t.string("name");
    t.boolean("isAdmin");
    t.date("createdAt");
    t.date("updatedAt");
    t.nonNull.list.field("posts", {
      type: "Post",
      resolve() {
        return [];
      },
    });
  },
});

export const UserMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("updateProfile", {
      type: "User",
      args: {
        id: nonNull(intArg()),
        email: nonNull(stringArg()),
        name: nonNull(stringArg()),
      },
      async resolve(_root, { id, email, name }, { db, currentUser }: Context) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated", {
            updateProfile: "Login first! to update profile",
          });
        }

        if (currentUser.id !== id) {
          throw new AuthenticationError("Unauthorized", {
            removePost:
              "You are not the owner of this profile! You can`t update this profile",
          });
        }

        const findUser = await db.user.findUnique({
          where: {
            id,
          },
        });

        if (!findUser) {
          throw new UserInputError("Not Found", {
            updateProfile: "User not exits",
          });
        }

        const user = await db.user.update({
          where: {
            id,
          },
          data: {
            name,
            email,
          },
        });

        return user;
      },
    });

    t.nonNull.field("removeProfile", {
      type: "String",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(_root, { id }, { db, currentUser }: Context) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated", {
            removeProfile: "Login first! to delete profile",
          });
        }

        if (currentUser.id !== id) {
          throw new AuthenticationError("Unauthorized", {
            removeProfile:
              "You are not the owner of this profile! You can`t delete this profile",
          });
        }

        const findUser = await db.user.findUnique({
          where: {
            id,
          },
        });

        if (!findUser) {
          throw new UserInputError("Not Found", {
            removeProfile: "User not exits",
          });
        }

        await db.user.delete({
          where: {
            id,
          },
        });

        return "Profile removed successfully!!";
      },
    });

    t.nonNull.field("changePassword", {
      type: "User",
      args: {
        id: nonNull(intArg()),
        oldPassword: nonNull(stringArg()),
        newPassword: nonNull(stringArg()),
      },
      async resolve(
        _root,
        { id, oldPassword, newPassword },
        { db, currentUser }: Context
      ) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated", {
            changePassword: "Login first! to change password",
          });
        }

        if (currentUser.id !== id) {
          throw new AuthenticationError("Unauthorized", {
            changePassword:
              "You are not the owner of this profile! You can`t change password",
          });
        }

        const findUser = await db.user.findUnique({
          where: {
            id,
          },
        });

        if (!findUser) {
          throw new UserInputError("Not Found", {
            changePassword: "User not exits",
          });
        }

        const matchOldPassword = await bcrypt.compare(
          oldPassword,
          findUser.password
        );
        if (!matchOldPassword) {
          throw new UserInputError("Incorrect Password", {
            changePassword: "You have provided incorrect old password",
          });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await db.user.update({
          where: {
            id,
          },
          data: {
            password: hashedPassword,
          },
        });

        return user;
      },
    });
  },
});
