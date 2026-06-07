const { GraphQLList } = require("graphql");

const Service = require("../../models/Service");

const ServiceType = require("../types/ServiceType");

const serviceQueries = {
  services: {
    type: new GraphQLList(ServiceType),
    resolve() {
      return Service.findAll();
    },
  },
};

module.exports = serviceQueries;
