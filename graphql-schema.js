import fs from 'fs'
import path from 'path'

/*
 * Check for GRAPHQL_SCHEMA environment variable to specify schema file
 * fallback to schema.graphql if GRAPHQL_SCHEMA environment variable is not set
 */

//  Readfile gets the contents of the file and then returns it
const __dirname = path.resolve();
export const typeDefs = fs
  .readFileSync(
    path.join(__dirname, 'schema.graphql')
  )
  .toString('utf-8')
