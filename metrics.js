/**
 * Created by daniel.irwin on 9/1/16.
 */
module.exports = (function(){

    var pmx = require('pmx');
    var probe = pmx.probe();

    return probe.metric;

})();