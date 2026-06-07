const { GraphQLList } = require("graphql");

const Employee = require("../../models/Employee");

const EmployeeType = require("../types/EmployeeType");

const employeeQueries = {
  employees: {
    type: new GraphQLList(EmployeeType),
    resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");
      return Employee.findAll();
    },
  },
};

module.exports = employeeQueries;
