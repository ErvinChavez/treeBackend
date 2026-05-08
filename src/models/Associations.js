const Client = require('./Client');
const Job = require('./Job');
const Employee = require('./Employee');
const Service = require('./Service');
const Feedback = require('./Feedback');
const JobPhoto = require('./JobPhoto');
const JobService = require('./JobService');
const JobEmployee = require('./JobEmployee');

function applyAssociations() {
    //Relation: Job belongs to a single Client (many-to-one)
    Client.hasMany(Job, { foreignKey: 'clientId' });
    Job.belongsTo(Client, { foreignKey: 'clientId' });

    //Many-to-Many relationships
    Job.belongsToMany(Employee, { through: JobEmployee, foreignKey: 'jobId' });
    Employee.belongsToMany(Job, { through: JobEmployee, foreignKey: 'employeeId' });

    //Many-to-Many relationships
    Job.belongsToMany(Service, { through: JobService, foreignKey: 'jobId' });
    Service.belongsToMany(Job, { through: JobService, foreignKey: 'serviceId' });

    //Relation: Feedback belongs to Job(one-to-one)
    Job.hasOne(Feedback, { foreignKey: 'jobId' });
    Feedback.belongsTo(Job, { foreignKey: 'jobId' });

    //Relation: JobPhoto belongs to one Job
    Job.hasMany(JobPhoto, { foreignKey: 'jobId' });
    JobPhoto.belongsTo(Job, { foreignKey: 'jobId' });

}
module.exports = applyAssociations;