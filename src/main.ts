const { Command } = require("commander");
const { Octokit } = require("@octokit/rest");
import { Endpoints } from "@octokit/types";

const program = new Command();

program
    .name('ghpr')
    .version('0.1.0')
    .option('-u, --user <username>')
    .option('-r, --repo <repository name>');

program.parse(process.argv);
const options = program.opts();

const main = async (user: string, repo: string) => {
    const pat = process.env.PAT;
    const octokit = new Octokit({
        auth: pat
    });

    console.log(`Hello from main --user ${user} --repo ${repo}`);

    type listPullRequestParameters = Endpoints["GET /repos/{owner}/{repo}/pulls"]["parameters"];
    type listPullRequestResponse = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"];
    const params: listPullRequestParameters = {
        owner: user,
        repo: repo,
    };
    const response: listPullRequestResponse = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls",
        params
    );

    response.data.forEach((resp: any) => {
        const html_url = resp.html_url;
        const title = resp.title;
        console.log(`"${title}": ${html_url}`)
    });
}

main(options.user, options.repo);
