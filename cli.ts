import * as yargs from 'yargs';

let parser = yargs();
let argv = parser.parse(process.argv);

if (argv.help || argv['?']) {
  console.log('Boson command line help');
  process.exit(0);
}

process.on('SIGINT', () => {

});
