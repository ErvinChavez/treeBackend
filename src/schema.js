const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInt
} = require('graphql');

const  Client = require('./models/Client');
const Job = require('./models/Job');
const Service = require('./models/Service')
const Feedback = require('./models/Feedback');
const { isValidStatusChange } = require('./services/jobService');


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
        
        services: {
        type: new GraphQLList(ServiceType),
        async resolve(parent, args) {
            return parent.getServices(); //sequelize relation
            }
        },

        feedback: {
            type: FeedbackType,
            async resolve(parent, args) {
                return Feedback.findOne({ where: { jobId: parent.id } });
            }
        },
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

//Feedback Type
const FeedbackType = new GraphQLObjectType({
    name: 'Feedback',
    fields: () => ({
        id: { type: GraphQLString },
        rating: { type: GraphQLInt },
        comment: { type: GraphQLString },
        jobId: { type: GraphQLString },
        googleReviewLink: { type: GraphQLString }, 
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
                serviceIds: { type: new GraphQLList(GraphQLInt) },//array of service IDs
            },
            
            async resolve(parent, args) {
                //Check if client already exists by email
                let client = await Client.findOne({ where: {email: args.clientEmail.toLowerCase() } });

                if (!client) {
                //1. create client if not found
                client = await Client.create({
                    name: args.clientName,
                    email: args.clientEmail.toLowerCase(),
                    phone: args.clientPhone,
                });
            } else {
                //client exists so update only if args are provided
                if (args.clientName) client.name = args.clientName;
                if (args.clientPhone) client.phone = args.clientPhone;
                await client.save();
            }

            //safety check
            if(!client) {
                throw new Error('Client creation failed');
            }

            //2. create job
            const job = await Job.create({
                clientId: client.id,
                status: 'pending_quote',
                street: args.street,
                city: args.city,
                state: args.state,
                zip: args.zip,
            });

            //3. attach services (many-to-many)
            if (args.serviceIds && args.serviceIds.length > 0) {
                const services = await Service.findAll({
                    where: { id: args.serviceIds }
                });

                await job.addServices(services); //sequelize magic method
            }

            return job;
        }
    },

        updateJobStatus: {
            type: JobType,
            args: {
                jobId: { type: new GraphQLNonNull(GraphQLInt) },
                newStatus: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(parent, args) {
                const job = await Job.findByPk(args.jobId);

                if (!job) {
                    throw new Error('Job not found');
                }

                //validate transition
                if (!isValidStatusChange(job.status, args.newStatus)) {
                    throw new Error(`Invalid status transition from ${job.status} to ${args.newStatus}`);
                }

                //update status
                job.status = args.newStatus;
                await job.save();

                //If job completed, create feedback record
                if (args.newStatus === 'completed') {
                    const existingFeedback = await Feedback.findOne({
                        where: { jobId: job.id }            
                    });

                    //prevent duplicate feedback records
                    if (!existingFeedback) {
                        await Feedback.create({
                            jobId: job.id,
                            rating: 0, //placeholder until user submits
                            comment: '',
                        });
                    }
                }

                return job;
            }
        },

        submitFeedback: {
            type: FeedbackType,
            args: {
                jobId: { type: new GraphQLNonNull(GraphQLInt) },
                rating: { type: new GraphQLNonNull(GraphQLInt) }, //1-5
                comment: { type: GraphQLString },
            },
            async resolve(parent, args) {
                const job = await Job.findByPk(args.jobId);

                if (!job) throw new Error('Job not found');

                const feedback = await Feedback.findOne({ where: { jobId: job.id } });
                if (!feedback) throw new Error('Feedback record not found');

                //update feedback record
                feedback.rating = args.rating;
                feedback.comment = args.comment || '';
                await feedback.save();

                //business logic routing
                if (args.rating >= 4) {
                    //return google review link(frontend can redirect)
                    feedback.googleReviewLink = 'https://g.page/r/CeBcAA5Lxo0aEBM/review'
                } else {
                    //internal: just stored in db
                    feedback.googleReviewLink = null;
                }

                return feedback;
            }
        },
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});