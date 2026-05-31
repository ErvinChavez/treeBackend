const { 
    GraphQLNonNull, 
    GraphQLList, 
    GraphQLString, 
    GraphQLInt 
} = require("graphql");

//DB models
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");

//shared services
const { sendQuoteNotification } = require("../../utils/email");
const { isValidStatusChange } = require("../../services/jobService");

//graphql types
const JobType = require("../types/JobType");

const jobMutations = {
    createQuoteRequest: {
        type: JobType,
        args: {
            clientName: { type : new GraphQLNonNull(GraphQLString) },
            clientEmail: { type: new GraphQLNonNull(GraphQLString) },
            clientPhone: { type: new GraphQLNonNull(GraphQLString) },
            street: { type: new GraphQLNonNull(GraphQLString) },
            city: { type: new GraphQLNonNull(GraphQLString) },
            state: { type: new GraphQLNonNull(GraphQLString) },
            zip: { type: new GraphQLNonNull(GraphQLString) },
            serviceIds: { type: new GraphQLList(GraphQLInt) },
        },

        async resolve(parent, args) {
            //find existing client by email
            let client = await Client.findOne({
                where: { email: args.clientEmail.toLowerCase() },
            });

            if (!client) {
                client = await Client.create({
                    name: args.clientName,
                    email: args.clientEmail.toLowerCase(),
                    phone: args.clientPhone,
                });
            } else {
                if (args.clientName) client.name = args.clientName;
                if (args.clientPhone) client.phone = args.clientPhone;
                await client.save();
            }

            //create work request
            const job = await Job.create({
                clientId: client.id,
                status: "pending_quote",
                street: args.street,
                city: args.city,
                state: args.state,
                zip: args.zip,
            });

            //attach services
            let services = [];

            if (args.serviceIds?.length > 0) {
                services = await Service.findAll({
                    where: { id: args.serviceIds },
                });
                await job.setServices(services);
            }

            //send notification email to admin
            await sendQuoteNotification({
                clientName: args.clientName,
                clientEmail: args.clientEmail,
                clientPhone: args.clientPhone,
                street: args.street,
                city: args.city,
                state: args.state,
                zip: args.zip,
                jobId: job.id,
                services: services.map((s) => s.name)
            });

            return job;
        },
    },

    updateJobStatus: {
        type: JobType,
        args: {
            jobId: { type: new GraphQLNonNull(GraphQLInt) },
            newStatus: { type: new GraphQLNonNull(GraphQLString) },
        },
        async resolve(parent,args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const job = await Job.findByPk(args.jobId);
            if (!job) throw new Error("Job not found");

            //follow status flow rules
            if (!isValidStatusChange(job.status, args.newStatus)) {
                throw new Error(`Invalid status transition`);
            }

            job.status = args.newStatus;
            await job.save();

            return job;
        },
    },
};

module.exports = jobMutations;