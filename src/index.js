'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {

    const socketIO = require('socket.io');

    // Initialize socket.io server
    const io = socketIO(strapi.server.httpServer, {
      cors: {
        origin: ["http://localhost:3000", "https://ayna-test.onrender.com"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      },
    });    
    
    // Handle a new connection
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle incoming messages from client
      socket.on('sendMessage', async (messageDetails) => {

        const { content, timestamp, userId } = messageDetails

        try {
          // Save the user message to Strapi
          const savedMessage = await strapi.service('api::message.message').create({
            data: {
              content,
              timestamp,
              userId
            }
          });

          // Echo the message back to the client
          socket.emit('receiveMessage', savedMessage);

        } catch (error) {
          console.error('Failed to send message:: =>', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle fetch message history
      socket.on('getHistory', async (userId) => {
        try {
          const messages = await strapi.service('api::message.message').find({
            filters: { userId } // Filter messages by userId
          });

          // Send message history to the client
          socket.emit('messageHistory', messages);
        } catch (error) {
          console.error('Error fetching chat histor:: =>', error);
          socket.emit('error', { message: 'Failed to retrieve chat history' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    strapi.io = io;

  },
};
