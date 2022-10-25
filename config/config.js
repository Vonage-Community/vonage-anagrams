require('dotenv').config();
module.exports = {
  "development": {
    "use_env_variable": "DB_DSN",
    "dialect": "postgres",
    logging: false,
  },
  "test": {
    "use_env_variable": "DB_DSN",
    "dialect": "postgres",
    logging: false,
  },
  "production": {
    "use_env_variable": "DB_DSN",
    "dialect": "postgres",
    logging: false,
  }
};