
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
    propositions: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmas: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
    questions: [Question] @relation(name: "QUESTION_OF", direction: IN)
    notations: [Notation] @relation(name: "NOTATION_OF", direction: IN)
}

type Definition {
    # definitionId: ID!
    title: String!
    content: String
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    notationUsed: [Notation] @relation(name: "NOTATION_OF", direction: IN)
}

type Theorem {
    # theoremId: ID!
    title: String!
    proof: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositionsUsed: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmasUsed: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
    notationUsed: [Notation] @relation(name: "NOTATION_OF", direction: IN)
}

type Proposition {
    # theoremId: ID!
    title: String!
    proof: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositionsUsed: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmasUsed: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
    notationUsed: [Notation] @relation(name: "NOTATION_OF", direction: IN)
}

type Lemma {
    # theoremId: ID!
    title: String!
    proof: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositionsUsed: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmasUsed: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
    notationUsed: [Notation] @relation(name: "NOTATION_OF", direction: IN)
}

type Question {
    title: String!
    solution: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositionsUsed: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmasUsed: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
    notationUsed: [Notation] @relation(name: "NOTATION_OF", direction: IN)
}

type Notation {
    title: String!
    content: String!
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositionsUsed: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmasUsed: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
}

type User {
    # userId: ID!
    name: String!
    #completedExercises: [Exercise]
}

type Knowledge {
    definitions: [Definition]
    theorems: [Theorem]
}

type KnowledgeUsed {
    definitionsUsed: [Definition] @relation(name: "DEFINITION_OF", direction: IN)
    theoremsUsed: [Theorem] @relation(name: "THEOREM_OF", direction: IN)
    propositionsUsed: [Proposition] @relation(name: "PROPOSITION_OF", direction: IN)
    lemmasUsed: [Lemma] @relation(name: "LEMMA_OF", direction: IN)
}


type Mutation {
    createDefinition(
        sec_id: ID!, 
        title: String!, 
        content: String, 
        definitionsUsed: [ID!],
        notationUsed: [ID!]
        ) : Definition 
    @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:DEFINITION_OF] - (x :Definition {title: $title, content: $content})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    WITH x, $notationUsed as ids 
    UNWIND ids as i  
    MATCH (a) WHERE id(a) = toInteger(i)
    CREATE (x) <- [:NOTATION_OF] - (a) 
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

    createTheorem(
        sec_id: ID!, 
        title: String!, 
        proof: String, 
        definitionsUsed: [ID!], 
        theoremsUsed: [ID!],
        propositionsUsed: [ID!], 
        lemmasUsed: [ID!]
        ) : Theorem @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:THEOREM_OF] - (x :Theorem {title: $title, proof: $proof})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (t) 
    WITH x, $lemmasUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (t) 
    WITH x, $propositionsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (t) 
    RETURN x
    """)

    createProposition(
        sec_id: ID!, 
        title: String!, 
        proof: String, 
        definitionsUsed: [ID!], 
        theoremsUsed: [ID!],
        propositionsUsed: [ID!], 
        lemmasUsed: [ID!]
        ) : Theorem @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:PROPOSITION_OF] - (x :Proposition {title: $title, proof: $proof})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (t) 
    WITH x, $lemmasUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (t) 
    WITH x, $propositionsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (t) 
    RETURN x
    """)

    createLemma(
        sec_id: ID!, 
        title: String!, 
        proof: String, 
        definitionsUsed: [ID!], 
        theoremsUsed: [ID!],
        propositionsUsed: [ID!], 
        lemmasUsed: [ID!]
        ) : Theorem @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:LEMMA_OF] - (x :Lemma {title: $title, proof: $proof})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (t) 
    WITH x, $lemmasUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (t) 
    WITH x, $propositionsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (t) 
    RETURN x
    """)
    
    createQuestion(
        sec_id: ID!, 
        title: String!, 
        solution: String, 
        definitionsUsed: [ID!], 
        theoremsUsed: [ID!],
        propositionsUsed: [ID!], 
        lemmasUsed: [ID!]
        ) : Question @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:QUESTION_OF] - (x :Question {title: $title, solution: $solution})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (t) 
    WITH x, $lemmasUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (t) 
    WITH x, $propositionsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (t) 
    RETURN x
    """)

    createNotation(
        sec_id: ID!, 
        title: String!, 
        content: String, 
        definitionsUsed: [ID!], 
        theoremsUsed: [ID!],
        propositionsUsed: [ID!], 
        lemmasUsed: [ID!]
        ) : Notation @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($sec_id)
    CREATE (s) <- [:NOTATION_OF] - (x :Notation {title: $title, content: $content})  
    WITH x, $definitionsUsed as ids 
    UNWIND ids as i  
    MATCH (d) WHERE id(d) = toInteger(i)
    CREATE (x) <- [:DEFINITION_OF] - (d) 
    WITH x, $theoremsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:THEOREM_OF] - (t) 
    WITH x, $lemmasUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:LEMMA_OF] - (t) 
    WITH x, $propositionsUsed as ids 
    UNWIND ids as i  
    MATCH (t) WHERE id(t) = toInteger(i)
    CREATE (x) <- [:PROPOSITION_OF] - (t) 
    RETURN x
    """)

    createSection(top_id: ID!, title: String!) : Section @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($top_id)
    CREATE (s) <- [:SECTION_OF] - (x :Section {title: $title})  
    RETURN x
    """)

    createTopic(subfield_id: ID!, title: String!) : Topic @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($subfield_id)
    CREATE (s) <- [:TOPIC_OF] - (x : Topic {title: $title})  
    RETURN x
    """)

    createSubfield(areaofstudy_id: ID!, title: String!) : Subfield @cypher(statement: """
    MATCH (s) WHERE id(s) = toInteger($areaofstudy_id)
    CREATE (s) <- [:SUBFIELD_OF] - (x : Subfield {title: $title})  
    RETURN x
    """)




}

type Query {
    definitionsOfSection(sec_id: ID!) : [Definition] @cypher(statement: """
    MATCH (d) - [:DEFINITION_OF] -> (s) WHERE id(s) = toInteger($sec_id)
    RETURN d
    """)

    notationOfSection(sec_id: ID!) : [Notation] @cypher(statement: """
    MATCH (n) - [:NOTATION_OF] -> (s) WHERE id(s) = toInteger($sec_id)
    RETURN n
    """)
}

`

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