const {
    GraphQLString,
    GraphQLNonNull
} = require("graphql");

//security/utilities
const bcrypt = require("bcryptjs");

//DB models
const Admin = require("../../models/Admin");

//shared services
const { generateToken } = require("../../services/authService");

const adminMutations = {
    //admin auth
    registerAdmin: {
        type: GraphQLString,
        args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) },
        },
        async resolve(parent, args) {
            //block in production, prevent random admin creation publicly
            const isProduction = process.env.NODE_ENV === "production";
            const allowBootstrap = process.env.ALLOW_ADMIN_BOOTSTRAP === "true";

            if (isProduction && !allowBootstrap) {
                throw new Error ("Admin creation disabled in production");
            }
            //prevent duplicate admin accounts
            const existing =  await Admin.findOne({ where: { email: args.email } });
            if (existing) throw new Error("Admin already exists");

            //hash passwords before storing
            const hashedPassword = await bcrypt.hash(args.password, 10);

            await Admin.create({
                email: args.email,
                password: hashedPassword,
            });
            return "Admin registered successfully";
        },
    },

    loginAdmin: {
        type: GraphQLString,
        args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) },
        },
        async resolve(parent, args) {
            const admin = await Admin.findOne({ where: { email: args.email } });
            if (!admin) throw new Error("Invalid credentials");

            const isMatch = await bcrypt.compare(args.password, admin.password);
            if (!isMatch) throw new Error("Invalid credentials");

            return generateToken(admin);
        },
    },
};

module.exports = adminMutations;