/**
 * Created by daniel.irwin on 8/7/16.
 */
module.exports = (function(){


    var server = require('./server');


    var lastAmpl = 0;

    function derivitive(array){
        var dirv = [];
        for(var i = 0; i < array.length - 1; ++i){
            dirv.push( array[i] - array[i + 1] );
        }
        //console.log('le',array.length);
        return dirv;
    }

    function neautralize(array){
        var ret = [];
        var min = 99999999;
        for(var i = 0; i < array.length; ++i){
            if(min > array[i]) {
                min = array[i];
            }
        }
        min = Math.abs(min);
        for(var i = 0; i < array.length; ++i){
            ret[i] = array[i] + min;
        }
        return ret;
    }

    function r(str, num){
        //console.log('t', typeof num);
        if( typeof num === 'number') {
            //console.log('woot');
            return new Array(num).join(str);
        }
        return '';
    }

    function bufferExtract(data) {
        var buff = [];
        for (var i = 0; i < data.length - 1; i += 2) {

            var byte1 = data[i];
            var byte2 = data[i + 1];

            var byteMix = Math.round((( byte1 << 8) + byte2 ) / 3024);
            buff.push(byteMix);

        }
        return buff;
    }

    function displayGraphs(buff3, buff, buff22) {
        for (var i = 0; i < buff3.length; ++i) {
            //if(Math.abs(lastAmpl - buff[i]) > 9) {
            lastAmpl = buff[i];
            //}

            server.sendData(buff22[i]);

            //console.log(
            //    //r('#', lastAmpl) + '|'
            //    //+ r(' ', 66- lastAmpl )
            //    r('#', buff22[i])
            //    //+ r(' ', 80 - lastAmpl - buff22[i] + '#')
            //    //+ r('#', buff3[i])
            //);

        }
    }

    function graph(data){
        var buff = bufferExtract(data);

        var buff2 = derivitive(buff);

        var buff3 = neautralize(derivitive(neautralize(buff2)));

        var buff22 = neautralize(buff2);

        displayGraphs(buff3, buff, buff22);
    }

    return {
        graph : graph
    };
})();