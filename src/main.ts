const { Command } = require("commander");
const program = new Command();

program
    .name('ghpr')
    .version('0.1.0')

program.parse();

console.log("hello");
