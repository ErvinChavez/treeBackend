const {
    GraphQLNonNull,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
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
            email: { type: GraphQLString },
            phone: { type: GraphQLString },
        },
        resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");
            
            return Employee.create(args);
        },
    },

    updateEmployee: {
        type: EmployeeType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
            name: { type: GraphQLString },
            email: { type: GraphQLString },
            phone: { type: GraphQLString },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const employee = await Employee.findByPk(args.id);
            if (!employee) throw new Error("Employee not found");

            if (args.name) employee.name = args.name;
            if (args.email) employee.email = args.email;
            if (args.phone) employee.phone = args.phone;

            await employee.save();
            return employee;
        },
    },

    deleteEmployee: {
        type: GraphQLString,
        args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const employee = await Employee.findByPk(args.id);
            if (!employee) throw new Error("Employee not found");

            const assignedJobs = await employee.getJobs();
            if (assignedJobs.length > 0) {
                employee.active = false;
                await employee.save();
                return `${employee.name} archived (still linked to ${assignedJobs.length} past job(s)). Removed from active team, job history preserved.`;
            }

            await employee.destroy();
            return "Employee deleted successfully";
        },
    },

    reactivateEmployee: {
        type: EmployeeType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const employee = await Employee.findByPk(args.id);
            if (!employee) throw new Error("Employee not found");

            employee.active = true;
            await employee.save();
            return employee;
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