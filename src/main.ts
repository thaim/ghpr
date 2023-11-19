const { Command } = require("commander");
import { Octokit } from "@octokit/core"
import { paginateRest, PaginateInterface } from "@octokit/plugin-paginate-rest";
import { Endpoints } from "@octokit/types";
import { parseJsonFile, GHPRConfig } from './utils';

const program = new Command();

program
    .name('ghpr')
    .version('0.1.0')
    .option('-u, --user <username>')
    .option('-r, --repo <repository name>')
    .option('--repo-regexp <repository regexp>')
    .option('-c, --config <config file>');

program.parse(process.argv);
const options = program.opts();

const main = async (user: string, repoString: string, repoRegexp: string, configFile: string) => {
    const pat = process.env.PAT;
    const MyOctokit = Octokit.plugin(paginateRest) as (new (...args: any[]) => MyOctokit);
    const octokit = new MyOctokit({
        auth: pat
    });

    let repos;
    let config = {} as GHPRConfig;
    if (configFile !== undefined) {
        console.log(`config file: ${configFile}`);
        try {
            config = await parseJsonFile(configFile);
            console.log(config);
        } catch (error) {
            console.error(error);
        }
        repos = "";
    } else if (repoString === undefined && repoRegexp != "") {
        repos = await getAllRepos(octokit, user, repoRegexp);

        console.log(`repos: ${repos}`);
    } else {
        repos = repoString.split(",");
    }

    for (const repo of repos) {
        await describeRepository(octokit, user, repo);
    }
}

interface MyOctokit extends Octokit {
    paginate: PaginateInterface;
}

const getAllRepos = async (octokit: any, user: string, repoRegexp: string) => {
    type listReposiotryParameters = Endpoints["GET /user/repos"]["parameters"];
    const params: listReposiotryParameters = {
        type: "owner",
    };

    const regexp = new RegExp(repoRegexp);

    const repos = await octokit.paginate(
        "GET /user/repos",
        params
    );

    return repos
        .filter((repo: any) => repo.name.match(regexp))
        .map((repo: any) => repo.name);
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
        console.log(`  "${title}": ${html_url}`)
    });
}


main(options.user, options.repo, options.repoRegexp, options.config);
