'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AppConfig extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AppConfig.init({
    configKey: DataTypes.STRING,
    configValue: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AppConfig',
  });
  return AppConfig;
};