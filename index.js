
const { ApolloServer } = require("apollo-server");
const neo4j = require("neo4j-driver");
const { makeAugmentedSchema } = require("neo4j-graphql-js");
require('dotenv').config()


const typeDefs = /* GraphQL */ `
type AreaOfStudy {
    title: String
    subfields: [Subfield] @relation(name: "SUBFIELD_OF", direction: IN)
}

type Subfield {
    title: String!
    topics: [Topic] @relation(name: "TOPIC_OF", direction: IN)
}

type Topic {
    # topicId: ID!
    title: String!
    sections: [Section] @relation(name: "SECTION_OF", direction: IN)
}

type Section {
    # sectionId: ID!
    title: String!
    definitions: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theorems: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositions: [Theorem] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmas: [Theorem] @relation(name: "LEMMAS_OF", direction: IN)
}

type Definition {
    # definitionId: ID!
    title: String!
    content: String
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
}

type Theorem {
    # theoremId: ID!
    title: String!
    proof: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
}

type Proposition {
    # theoremId: ID!
    title: String!
    proof: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
}

type Lemma {
    # theoremId: ID!
    title: String!
    proof: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
}

type Exercise {
    # theoremId: ID!
    title: String!
    content: String
    definitionsUsed: [Definition]
    suggestedKnowledge: [Theorem]
}
type User {
    # userId: ID!
    name: String!
    completedExercises: [Exercise]
}

type Knowledge {
    definitions: [Definition]
    theorems: [Theorem]
}


type Mutation {
    createDefinition(sec_id: ID!, title: String!, content: String, definitionsUsed: [ID!]) : Definition 
    @isAuthenticated
    @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:DEFINITION_OF] - (x :Definition {title: $title, content: $content})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    RETURN x
    """)

    deleteDefinition(def_id: ID!) : Definition 
    @cypher(
        statement: 
        """
        MATCH (d: Definition) where id(d) = toInteger($def_id)
        DETACH DELETE d
        """
    )

    createTheorem(sec_id: ID!, title: String!, proof: String, definitionsUsed: [ID!], theoremsUsed: [ID!]) : Theorem @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:THEOREM_OF] - (x :Theorem {title: $title, proof: $proof})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (t) 
    RETURN x
    """)

    createProposition(sec_id: ID!, title: String!, proof: String, definitionsUsed: [ID!], theoremsUsed: [ID!]) : Theorem @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:PROPOSITION_OF] - (x :Theorem {title: $title, proof: $proof})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (t) 
    RETURN x
    """)

    createLemma(sec_id: ID!, title: String!, proof: String, definitionsUsed: [ID!], theoremsUsed: [ID!]) : Theorem @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:LEMMA_OF] - (x :Theorem {title: $title, proof: $proof})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (t) 
    RETURN x
    """)
}`

const driver = neo4j.driver(
  "bolt://137.220.52.96:7687",
  neo4j.auth.basic(process.env.DB_USER, process.env.DB_PASS)
);

const schema = makeAugmentedSchema({
  typeDefs,
  config: {
    query: true,
    mutation: false,
    auth: {
      isAuthenticated: true,
    },
  },
});

const server = new ApolloServer({
  schema,
  context: { driver }
});

server.listen().then(({ url }) => {
  console.log(`GraphQL server ready at ${url}`);
});