const { GraphQLList } = require("graphql");

const JobPhoto = require("../../models/JobPhoto");
const JobPhotoType = require("../types/JobPhotoType");

const photoQueries = {
    featuredPhotos: {
        type: new GraphQLList(JobPhotoType),
        resolve() {
            return JobPhoto.findAll({
                where: { featured: true },
                order: [["createdAt", "DESC"]],
            });
        },
    },
};

module.exports = photoQueries;