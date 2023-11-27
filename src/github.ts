import { Octokit } from "@octokit/core"
import { paginateRest, PaginateInterface } from "@octokit/plugin-paginate-rest";
import { Endpoints } from "@octokit/types";

interface MyOctokit extends Octokit {
    paginate: PaginateInterface;
}

export interface RepositoryPullRequests {
    repository: {
        owner: string;
        repo: string;
    };
    pullRequests: {
        title: string;
        html_url: string;
    }[];
}

export class GitHubAPI {
    private octokit: MyOctokit;

    constructor(pat: string | undefined) {
        const MyOctokit = Octokit.plugin(paginateRest) as (new (...args: any[]) => MyOctokit);
        this.octokit = new MyOctokit({
            auth: pat,
        });
    }

    async getAllRepos(user: string, repoRegexp: string) {
        type listReposiotryParameters = Endpoints["GET /user/repos"]["parameters"];
        const params: listReposiotryParameters = {
            type: "owner",
        };
    
        const regexp = new RegExp(repoRegexp);
    
        const repos = await this.octokit.paginate(
            "GET /user/repos",
            params
        );
    
        return repos
            .filter((repo: any) => repo.name.match(regexp))
            .map((repo: any) => repo.name);
    }
    
    async describeRepository(user: string, repo: string): Promise<RepositoryPullRequests> {
        console.log(`describe repository ${user}/${repo}`);
        const prs: RepositoryPullRequests = {
            repository: {
                owner: user,
                repo: repo,
            },
            pullRequests: [],
        }
    
        type listPullRequestParameters = Endpoints["GET /repos/{owner}/{repo}/pulls"]["parameters"];
        type listPullRequestResponse = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"];
        const params: listPullRequestParameters = {
            owner: user,
            repo: repo,
        };
        const response: listPullRequestResponse = await this.octokit.request(
            "GET /repos/{owner}/{repo}/pulls",
            params
        );
    
        const prsResponse = await Promise.all(response.data.map(async (resp: any) => {
            const html_url = resp.html_url;
            const title = resp.title;
            console.log(`  "${title}": ${html_url}`)

            return {
                title: title,
                html_url: html_url,
            };
        }));

        prs.pullRequests = prsResponse;

        return prs;
    }    
}
