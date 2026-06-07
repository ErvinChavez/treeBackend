//jos, totalJobs, jobsbystatus

const {
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLInputObjectType,
} = require("graphql");

const Job = require("../../models/Job");

const JobType = require("../types/JobType");

const jobQueries = {
  jobs: {
    type: new GraphQLList(JobType),
    resolve() {
      return Job.findAll();
    },
  },

  totalJobs: {
    type: GraphQLInt,
    resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");
      return Job.count();
    },
  },

  jobsByStatus: {
    type: new GraphQLList(
      new GraphQLObjectType({
        name: "JobsByStatus",
        field: {
          status: { type: GraphQLString },
          count: { type: GraphQLInt },
        },
      }),
    ),
    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      //workflow
      const statuses = [
        "pending_quote",
        "quote_scheduled",
        "scheduled",
        "in_progress",
        "completed",
        "paid",
        "cancelled",
      ];

      const result = [];

      //count jobs per status
      for (const status of statuses) {
        const count = await Job.count({ where: { status } });
        result.push({ status, count });
      }

      return result;
    },
  },
};

module.exports = jobQueries;
