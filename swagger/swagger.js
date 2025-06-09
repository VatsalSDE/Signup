const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User Registration API',
            version: '1.0.0',
            description: 'A simple Express API for user registration with MongoDB',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints'
            }
        ]
    },
    apis: ['./routes/*.js'], // Path to the API files
};

const specs = swaggerJSDoc(options);

module.exports = specs;