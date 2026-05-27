const {
    GraphQLNonNull,
    GraphQLString,
    GraphQLList,
} = require("graphql");

//DB Models
const Employee = require("../../models/Employee");

//graphql types
const EmployeeType = require("../types/EmployeeType");
const JobType = require("../types/JobType");

const employeeMutations = {
    createEmployee: {
        type: EmployeeType,
        args: {
            name: { type: new GraphQLNonNull(GraphQLString) },
            email: { type: new GraphQLString },
            phone: { type: new GraphQLString },
        },
        resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");
            
            return Employee.create(args);
        },
    },

    assignEmployeeToJob: {
        type: JobType,
        args: {
            jobId: { type: new GraphQLNonNull(GraphQLInt) },
            employeeIds: { type: new GraphQLList(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");
            const job = await Job.findByPk(args.jobId);
        
            if (!job) throw new Error("Job not found");
            
            const employees = await Employee.findAll({
            where: { id: args.employeeIds },
            });
        
            await job.setEmployees(employees);
            return job;
        },
    }
};

module.exports = employeeMutations;