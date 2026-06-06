const { GraphQLList, GraphQLInt } = require("graphql");

const Client = require("../../models/Client");

const clientQueries = {
  clients: {
    type: new GraphQLList(Client),
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
