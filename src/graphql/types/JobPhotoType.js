const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLBoolean,
} = require('graphql');

const JobPhotoType = new GraphQLObjectType({
    name: 'JobPhoto',
    fields: () => ({
        id: { type: GraphQLInt },
        url: { type: GraphQLString },
        featured: { type: GraphQLBoolean },
    }),
});

module.exports = JobPhotoType;