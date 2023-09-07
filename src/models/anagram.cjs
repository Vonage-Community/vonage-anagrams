'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Anagram extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Anagram.init({
    anagram: DataTypes.STRING,
    solution: DataTypes.STRING,
    current: DataTypes.BOOLEAN,
    used: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Anagram',
  });
  return Anagram;
};