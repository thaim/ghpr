import { Octokit } from "@octokit/core"
import { paginateRest, PaginateInterface } from "@octokit/plugin-paginate-rest";
import { Endpoints } from "@octokit/types";
import { GHPRConfig } from "./config";

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
        author: string;
        draft: boolean;
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
    
    async describeRepository(user: string, repo: string, query: GHPRConfig['queries'][0]): Promise<RepositoryPullRequests> {
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
            return filterPullRequests(resp, query);
        }));

        prs.pullRequests = prsResponse.filter((pr: any) => pr !== undefined) as {
            title: string;
            html_url: string;
            author: string;
            draft: boolean;
        }[];

        return prs;
    }
}

async function filterPullRequests(resp: any, query: GHPRConfig['queries'][0]) {
    const html_url = resp.html_url;
    const title = resp.title;

    if (query.author !== undefined && !query.author.includes(resp.user.login)) {
        return;
    }
    if (query['author-ignore'] !== undefined && query['author-ignore'].includes(resp.user.login)) {
        return;
    }

    if (query['draft'] !== undefined) {
        if (query['draft'] != resp.draft) {
            return;
        }
    }

    if (query['reviewers'] !== undefined) {
        let includeReviewer = false;
        resp.requested_reviewers.forEach((reviewer: any) => {
            if (query['reviewers']?.includes(reviewer.login)) {
                includeReviewer = true;
            }
        })

        if (!includeReviewer) {
            return;
        }
    }


    return {
        title: title,
        html_url: html_url,
        author: resp.user.login,
        draft: resp.draft,
    };
}
