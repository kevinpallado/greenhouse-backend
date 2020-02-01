'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
   return queryInterface.createTable('sensor_readings',
   {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nodePosition : Sequelize.STRING ,
    temperatureC : Sequelize.FLOAT ,
    humidity: Sequelize.FLOAT,
    soilMoisture : Sequelize.FLOAT ,
    soilRead : Sequelize.Text,
    lightIntensity : Sequelize.FLOAT ,
    lightRead: Sequelize.Text,
    dateRecorded : {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
   });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
