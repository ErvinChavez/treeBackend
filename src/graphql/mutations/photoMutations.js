const { GraphQLNonNull, GraphQLInt } = require("graphql");

const JobPhoto = require("../../models/JobPhoto");
const JobPhotoType = require("../types/JobPhotoType");

const photoMutations = {
    toggleFeaturedPhoto: {
        type: JobPhotoType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const photo = await JobPhoto.findByPk(args.id);
            if (!photo) throw new Error("Photo not found");

            photo.featured = !photo.featured;
            await photo.save();
            return photo;
        },
    },
};

module.exports = photoMutations;