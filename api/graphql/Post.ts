import { AuthenticationError, UserInputError } from "apollo-server";
import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { Context } from "../context";

export const Post = objectType({
  name: "Post",
  definition(t) {
    t.int("id");
    t.string("title");
    t.string("body");
    t.string("image");
    t.date("createdAt");
    t.date("updatedAt");
    t.nonNull.field("author", {
      type: "User",
      resolve() {
        return {};
      },
    });
  },
});

export const PostQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("posts", {
      type: Post,
      async resolve(_root, _args, { db }: Context) {
        const posts = await db.post.findMany();
        return posts;
      },
    });

    t.nonNull.field("post", {
      type: "Post",
      args: {
        postId: nonNull(intArg()),
      },
      async resolve(_root, { postId }, { db, currentUser }: Context) {
        const post = await db.post.findUnique({
          where: {
            id: postId,
          },
        });

        if (!post) {
          throw new UserInputError("Post not found", {
            post: "Post not found",
          });
        }

        return post;
      },
    });
  },
});

export const PostMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("createPost", {
      type: "Post",
      args: {
        title: nonNull(stringArg()),
        body: nonNull(stringArg()),
        image: nonNull(stringArg()),
      },
      async resolve(
        _root,
        { title, body, image },
        { db, currentUser }: Context
      ) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated", {
            createPost: "Login first! to create new post",
          });
        }

        const newPost = await db.post.create({
          data: {
            body,
            image,
            title,
            author: {
              connect: {
                id: currentUser.id,
              },
            },
          },
        });

        return newPost;
      },
    });

    t.nonNull.field("updatePost", {
      type: "Post",
      args: {
        postId: nonNull(intArg()),
        title: nonNull(stringArg()),
        body: nonNull(stringArg()),
        image: nonNull(stringArg()),
      },
      async resolve(
        _root,
        { postId, body, image, title },
        { db, currentUser }: Context
      ) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated", {
            updatePost: "Login first! to update post",
          });
        }

        const post = await db.post.findUnique({
          where: {
            id: postId,
          },
        });

        if (!post) {
          throw new UserInputError("Not Found", {
            updatePost: "Post not exists",
          });
        }

        if (currentUser.id !== post.authorId) {
          throw new AuthenticationError("Unauthorized", {
            updatePost:
              "You are not the author of this post! You can`t update this post",
          });
        }

        const updatedPost = await db.post.update({
          where: {
            id: postId,
          },
          data: {
            title,
            body,
            image,
          },
        });

        return updatedPost;
      },
    });

    t.nonNull.field("removePost", {
      type: "String",
      args: {
        postId: nonNull(intArg()),
      },
      async resolve(_root, { postId }, { db, currentUser }: Context) {
        if (!currentUser) {
          throw new AuthenticationError("Unauthenticated", {
            removePost: "Login first! to delete post",
          });
        }

        const post = await db.post.findUnique({
          where: {
            id: postId,
          },
        });

        if (!post) {
          throw new UserInputError("Not Found", {
            updatePost: "Post not exists",
          });
        }

        if (currentUser.id !== post.authorId) {
          throw new AuthenticationError("Unauthorized", {
            updatePost:
              "You are not the author of this post! You can`t delete this post",
          });
        }

        await db.post.delete({
          where: {
            id: postId,
          },
        });

        return "Post removed successfully!!";
      },
    });
  },
});
