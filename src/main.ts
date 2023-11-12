const { Command } = require("commander");
const { Octokit } = require("@octokit/rest");
import { Endpoints } from "@octokit/types";

const program = new Command();

program
    .name('ghpr')
    .version('0.1.0')
    .option('-u, --user <username>')
    .option('-r, --repo <repository name>')
    .option('--repo-regexp <repository regexp>');

program.parse(process.argv);
const options = program.opts();

const main = async (user: string, repos: string, repoRegexp: string) => {
    const pat = process.env.PAT;
    const octokit = new Octokit({
        auth: pat
    });

    if (repos === undefined && repoRegexp != "") {
        type listReposiotryParameters = Endpoints["GET /users/{username}/repos"]["parameters"];
        type listReposiotryResponse = Endpoints["GET /users/{username}/repos"]["response"];
        const params: listReposiotryParameters = {
            username: user,
            type: "all",
        };
        const { data } = await octokit.request(
            "GET /users/{username}/repos",
            params
        ) as listReposiotryResponse;
        const regexp = new RegExp(repoRegexp);

        repos = data
            .filter((repo: any) => repo.name.match(regexp))
            .map((repo: any) => repo.name)
            .join(',');

        console.log(`repos: ${repos}`);
    }

    repos.split(',').forEach(async (repo: string) => {
        await describeRepository(octokit, user, repo);
    })
}

const describeRepository = async (octokit: any, user: string, repo: string) => {
    console.log(`describe repository ${user}/${repo}`);

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

main(options.user, options.repo, options.repoRegexp);
