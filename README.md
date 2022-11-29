# Vonage Anagrams
A deployable application for running anagram-based giveaways. It utilizes the Messages API to message attendees when anagrams change, and uses the Number Insights API to format registration numbers.

## Installation

### Requirements
* Node 16 or higher
* PostgreSQL 13 or higher

### Render.com
You can deploy this application directly to [render.com](https://render.com). Just fill in some environmental information and it will deploy the web service and database.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/vonage-community/vonage-anagrams)

### Docker
You can run the web service as a Docker container. Build the container with:

    docker build . -t anagrams

You can then copy the `.env.dist` file to `.env` and add your configuration details. 

To run the service, call the `docker` command:

    docker run -d --name anagrams -p 3000:3000 --env-file .env anagrams

You will then need to run any needed [database migrations](#running-database-migrations).

### Manually

Install all the dependencies with:

    npm ci

You can then copy the `.env.dist` file to `.env` and add your configuration details. 

You can then run the application with node:

    // For production
    node index.js

    // For development
    npm run dev

You can then run any needed [database migrations](#running-database-migrations).

### Running Database Migrations
Database migrations are handled using [Sequelize](https://sequelize.org/). Once your `.env` file is configured, you can run the migrations locally using:

    npx sequelize db:migrate

The application will also attempt to run migrations when the main `index.js` script is called, so normally no user intervention is needed outside of restarting the application. When the application deploys to render.com it will automatically run the database migrations.

### Application Configuration

If you would like to utilize the messaging features, you can assign a Vonage Application to the anagram system. In the admin interface, either select an existing Application and provide the private key, or allow the system to generate a new application for you. You can then assign a number that will be used by the Anagram system.

Vonage messaging rates will be billed to the Account ID supplied during setup.

The Anagram system currently uses the Messages API to send SMS systems, but does not currently support WhatsApp.
