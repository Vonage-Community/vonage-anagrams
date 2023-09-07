import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import process from 'process';
import configData from '#config/config.cjs';

const basename = path.basename(import.meta.url);
const env = process.env.NODE_ENV || 'development';
const config = configData[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const files = fs
  .readdirSync(new URL('.', import.meta.url))
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-4) === '.cjs');
  })

for (const file of files) {
  const modelFunc = await import(new URL(file, import.meta.url));
  const model = modelFunc.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

await Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
