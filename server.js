/**
 * Created by daniel.irwin on 8/18/16.
 */
const spawn = require('child_process').spawn;
const ls = spawn('npm', ['install']);

ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
    if(!code){
        require('./app');
    }
});