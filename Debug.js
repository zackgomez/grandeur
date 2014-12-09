var _ = require('underscore');

function printObject(object) {
  console.log("{");
  _.each(object, function(value, key) {
    console.log(key + " : " + value + ",");
  });
  console.log("}");
}

module.exports = {
  printObject: printObject
};
