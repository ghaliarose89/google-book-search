const { Book, User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('thoughts')
                    .populate('friends');

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
        users: async () => {
            return User.find()
              .select('-__v -password')
              .populate('thoughts')
              .populate('friends');
          },
 
 
        },
    Mutation:{
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
          
            if (!user) {
              throw new AuthenticationError('Incorrect credentials');
            }
          
            const correctPw = await user.isCorrectPassword(password);
          
            if (!correctPw) {
              throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
            
          },
          addUser : async (parent, args)=>{
            const user = await  User.create (args);
            const token = signToken (user);
            return {user , token}
          },

          saveBook:async (parent, args,context)=>{
            if (context.user){
            const book = await Book.create ({...args,username: context.user.username  })
            await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $push: { savedBooks: book._id } },
                { new: true }
              );
              return book;
            }
            throw new AuthenticationError('You need to be logged in!');
          },
          removeBook: async (parent, args, context) => {
            
            if(context.user) {
                
                const user = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: args.bookId } }},
                    { new: true }
                );

                return user;
            }

            throw new AuthenticationError('You need to be logged in to remove a book.');
        }


    }
}


module.exports = resolvers;