const { GraphQLList, GraphQLInt, GraphQLNonNull, GraphQLString, GraphQLObjectType } = require("graphql");

const Client = require("../../models/Client");
const Job = require("../../models/Job");

const ClientJobSummaryType = new GraphQLObjectType({
  name: "ClientJobSummary",
  fields: {
    id: { type: GraphQLString },
    status: { type: GraphQLString },
    totalAmount: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  },
});

const ClientLookupType = new GraphQLObjectType({
  name: "ClientLookup",
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    phone: { type: GraphQLString },
    jobs: { type: new GraphQLList(ClientJobSummaryType) },
  },
});

const clientQueries = {
  totalClients: {
    type: GraphQLInt,
    resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");
      return Client.count();
    },
  },

  clientByEmail: {
    type: ClientLookupType,
    args: {
      email: { type: new GraphQLNonNull(GraphQLString) },
    },
    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const client = await Client.findOne({
        where: { email: args.email.toLowerCase() },
      });

      if (!client) return null;

      const jobs = await Job.findAll({
        where: { clientId: client.id },
        order: [["createdAt", "DESC"]],
      });

      return {
        id: String(client.id),
        name: client.name,
        phone: client.phone,
        jobs: jobs.map((job) => ({
          id: String(job.id),
          status: job.status,
          totalAmount: job.totalAmount != null ? String(job.totalAmount) : null,
          street: job.street,
          city: job.city,
          createdAt: String(job.createdAt),
        })),
      };
    },
  },
};

module.exports = clientQueries;
