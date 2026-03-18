const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const  Client = require('./models/Client');
const Job = require('./models/Job');
const Service = require('./models/Service')

//Client Type
const ClientType = new GraphQLObjectType({
    name: 'Client',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
        jobs: { type: new GraphQLList(JobType) },
    }),
});

//Job Type
const JobType = new GraphQLObjectType({
    name: 'Job',
    fields: () => ({
        id: {type: GraphQLString},
        status: {type: GraphQLString},
        scheduledDate: {type: GraphQLString},
        street: {type: GraphQLString},
        city: {type: GraphQLString},
        state: {type: GraphQLString},
        zip: {type: GraphQLString},
        clientId: {type: GraphQLString},
    }),
});

//Service Type
const ServiceType = new GraphQLObjectType({
    name: 'Service',
    fields: () => ({
        id: { type: GraphQLString},
        name: { type: GraphQLString},
        description: { type: GraphQLString},
    }),
});

//Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        clients: {
            type: new GraphQLList(ClientType),
            resolve(parent, args) {
                return Client.findAll({ include : Job });
            },
         },
        jobs: {
            type: new GraphQLList(JobType),
            resolve(parent, args) {
                return Job.findAll();
            },
        },
        services: {
            type: new GraphQLList(ServiceType),
            resolve(parent,args) {
                return Service.findAll();
            }
        }
    },
});

//Mutations
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createQuoteRequest: {
            type: JobType,
            args: {
                clientName: { type: new GraphQLNonNull(GraphQLString) },
                clientEmail: { type: new GraphQLNonNull(GraphQLString) },
                clientPhone: { type: new GraphQLNonNull(GraphQLString) },
                //Job & address fields
                street: {type: new GraphQLNonNull(GraphQLString) },
                city: {type: new GraphQLNonNull(GraphQLString) },
                state: {type: new GraphQLNonNull(GraphQLString) },
                zip: {type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(parent, args) {
                //1. create client
                const client = await Client.create({
                    name: args.clientName,
                    email: args.clientEmail,
                    phone: args.clientPhone,
                });
                //2. create job with address
                const job = await Job.create({
                    clientId: client.id,
                    status: 'pending_quote',
                    street: args.street,
                    city: args.city,
                    state: args.state,
                    zip: args.zip,
                });

                return job;
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});