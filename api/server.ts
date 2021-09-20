import dotenv from "dotenv";
import { ApolloServer } from "apollo-server";
import { context } from "./context";
import { schema } from "./schema";

dotenv.config();

export const server = new ApolloServer({
  schema,
  context
});
