import { typeDefs } from './graphql-schema.js'

const { ApolloServer } = require("apollo-server");
const neo4j = require("neo4j-driver");
const { makeAugmentedSchema } = require("neo4j-graphql-js");

const schema = makeAugmentedSchema({
  typeDefs
});

const server = new ApolloServer({
  schema
});

server.listen().then(({ url }) => {
  console.log(`GraphQL server ready at ${url}`);
});