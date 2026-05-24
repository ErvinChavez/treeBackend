const { GraphQLNonNull, GraphQLInt, GraphQLString} = require("graphql");

//DB models
const Service = require("../../models/Service");

//graphQL return types
const ServiceType = require("../types/ServiceType");

const serviceMutations = {
    createService: {
        type: ServiceType,
        args: {
            name: { type: new GraphQLNonNull(GraphQLString) },
            description: { type: GraphQLString },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            return Service.create({
                name: args.name,
                description: args.description,
            });
        },
    },

    updateService: {
        type: ServiceType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
            name: { type: GraphQLString },
            description: { type: GraphQLString },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthrized");

            const service = await Service.findByPk(args.id);
            if (!service) throw new Error("Service not found");

            if (args.name) service.name = args.name;
            if (args.description) service.description = args.description;

            await service.save();
            return service;
        },
    },

    deleteService: {
        type: GraphQLString,
        args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const service = await Service.findByPk(args.id);
            if (!service) throw new Error("Service not found");

            await service.destroy();
            return "Service deleted successfully";
        },
    },
}

module.exports = serviceMutations;