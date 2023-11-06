const { Command } = require("commander");
const program = new Command();

program
    .name('ghpr')
    .version('0.1.0')
    .option('-u, --user <username>')
    .option('-r, --repo <repository name>');

program.parse(process.argv);
const options = program.opts();

const main = async (user: string, repo: string) => {
    const octokit = new Octokit();

    console.log(`Hello from main --user ${user} --repo ${repo}`);
}

main(options.user, options.repo);
