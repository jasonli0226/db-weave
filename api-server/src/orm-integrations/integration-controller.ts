import { PrismaSchemaGenerator } from "./prisma-generator";
import { TypeORMGenerator } from "./typeorm-generator";
import { SequelizeGenerator } from "./sequelize-generator";
import { GraphQLGenerator } from "./graphql-generator";

export class ORMIntegrationController {
  private prismaGenerator: PrismaSchemaGenerator;
  private typeormGenerator: TypeORMGenerator;
  private sequelizeGenerator: SequelizeGenerator;
  private graphqlGenerator: GraphQLGenerator;

  constructor(dbWeaveText: string) {
    this.prismaGenerator = new PrismaSchemaGenerator(dbWeaveText);
    this.typeormGenerator = new TypeORMGenerator(dbWeaveText);
    this.sequelizeGenerator = new SequelizeGenerator(dbWeaveText);
    this.graphqlGenerator = new GraphQLGenerator(dbWeaveText);
  }

  generatePrismaSchema(): string {
    return this.prismaGenerator.generate();
  }

  generateTypeORM(): string {
    return this.typeormGenerator.generate();
  }

  generateSequelize(): string {
    return this.sequelizeGenerator.generate();
  }

  generateGraphQLSchema(): string {
    return this.graphqlGenerator.generate();
  }

  generateAll(): {
    prisma: string;
    typeorm: string;
    sequelize: string;
    graphql: string;
  } {
    return {
      prisma: this.generatePrismaSchema(),
      typeorm: this.generateTypeORM(),
      sequelize: this.generateSequelize(),
      graphql: this.generateGraphQLSchema(),
    };
  }
}
