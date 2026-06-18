const { GraphQLList, GraphQLInt } = require("graphql");

const Client = require("../../models/Client");

const ClientType = require("../types/ClientType");

const clientQueries = {
  clients: {
    type: new GraphQLList(ClientType),
    resolve() {
      return Client.findAll({ include: Job });
    },
  },

  totalClients: {
    type: GraphQLInt,
    resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");
      return Client.count();
    },
  },
};

module.exports = clientQueries;
