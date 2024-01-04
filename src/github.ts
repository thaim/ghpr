import { Octokit } from "@octokit/core";
import { paginateRest, PaginateInterface } from "@octokit/plugin-paginate-rest";
import { Endpoints } from "@octokit/types";
import { GHPRConfig } from "./config";

type listPullRequestParameters = Endpoints["GET /repos/{owner}/{repo}/pulls"]["parameters"];
type listPullRequestResponse = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"];
type listReviewCommentsParameters = Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["parameters"];
type listReviewCommentsResponse = Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"];

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
        updated_at: string;
    }[];
}

export class GitHubAPI {
    private octokit: MyOctokit;

    constructor(pat: string | undefined) {
        const MyOctokit = Octokit.plugin(paginateRest) as new (...args: any[]) => MyOctokit;
        this.octokit = new MyOctokit({
            auth: pat,
        });
    }

    async getAllRepos(user: string, repoRegexp: string, forked?: boolean): Promise<string[]> {
        type listReposiotryParameters = Endpoints["GET /user/repos"]["parameters"];
        type listReposiotryResponse = Endpoints["GET /user/repos"]["response"]["data"];
        const params: listReposiotryParameters = {
            type: "owner",
        };

        const regexp = new RegExp(repoRegexp);

        const repos: listReposiotryResponse = await this.octokit.paginate("GET /user/repos", params);

        return repos
            .filter((repo: listReposiotryResponse[0]) => repo.name.match(regexp))
            .filter((repo: listReposiotryResponse[0]) => {
                if (forked !== undefined && forked != repo.fork) {
                    return false;
                }
                return true;
            })
            .map((repo: listReposiotryResponse[0]) => repo.name);
    }

    async describeRepository(
        user: string,
        repo: string,
        query: GHPRConfig["queries"][0],
    ): Promise<RepositoryPullRequests> {
        const prs: RepositoryPullRequests = {
            repository: {
                owner: user,
                repo: repo,
            },
            pullRequests: [],
        };

        const params: listPullRequestParameters = {
            owner: user,
            repo: repo,
            sort: "updated",
        };
        const response: listPullRequestResponse = await this.octokit.request("GET /repos/{owner}/{repo}/pulls", params);

        const prsResponse = await Promise.all(
            response.data.map(async (resp: any) => {
                const comments = await this.listReviewComments(user, repo, resp.number);
                return filterPullRequests(resp, query, comments);
            }),
        );

        prs.pullRequests = prsResponse.filter((pr: any) => pr !== undefined) as RepositoryPullRequests["pullRequests"];

        return prs;
    }

    async listReviewComments(
        user: string,
        repo: string,
        prNumber: number,
    ): Promise<listReviewCommentsResponse["data"]> {
        const params: listReviewCommentsParameters = {
            owner: user,
            repo: repo,
            pull_number: prNumber,
        };
        const response: listReviewCommentsResponse = await this.octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
            params,
        );

        return response.data;
    }
}

async function filterPullRequests(
    resp: listPullRequestResponse["data"][0],
    query: GHPRConfig["queries"][0],
    comments: listReviewCommentsResponse["data"],
) {
    const html_url = resp.html_url;
    const title = resp.title;

    if (resp.user !== null && query.author !== undefined && !query.author?.includes(resp.user.login)) {
        return;
    }
    if (
        resp.user != null &&
        query["author-ignore"] !== undefined &&
        query["author-ignore"]?.includes(resp.user.login)
    ) {
        return;
    }

    if (query["involves"] !== undefined) {
        let involved = false;

        if (resp.user != null && query["involves"]?.includes(resp.user.login)) {
            involved = true;
        }

        if (!involved && resp.requested_reviewers != null) {
            resp.requested_reviewers.forEach((reviewer: any) => {
                if (query["involves"]?.includes(reviewer.login)) {
                    involved = true;
                }
            });
        }

        if (!involved && resp.assignees != null) {
            resp.assignees.forEach((assignee: any) => {
                if (query["involves"]?.includes(assignee.login)) {
                    involved = true;
                }
            });
        }

        if (!involved && comments != null) {
            comments.forEach((comment: any) => {
                if (query["involves"]?.includes(comment.user.login)) {
                    involved = true;
                }
            });
        }

        // TODO: mentions

        if (!involved) {
            return;
        }
    }

    if (query["draft"] !== undefined && query["draft"] !== resp.draft) {
        return;
    }

    if (query["reviewers"] !== undefined && resp.requested_reviewers != null) {
        let includeReviewer = false;
        resp.requested_reviewers.forEach((reviewer: any) => {
            if (query["reviewers"]?.includes(reviewer.login)) {
                includeReviewer = true;
            }
        });

        comments.forEach((comment: any) => {
            if (query["reviewers"]?.includes(comment.user.login)) {
                includeReviewer = true;
            }
        });

        if (!includeReviewer) {
            return;
        }
    }

    if (query["since"] !== undefined) {
        const sinceDate = new Date(query["since"]);
        const updatedAt = new Date(resp.updated_at);

        if (updatedAt < sinceDate) {
            return;
        }
    }

    if (query["label"] !== undefined) {
        let includeLabel = false;
        resp.labels.forEach((label: any) => {
            if (query["label"]?.includes(label.name)) {
                includeLabel = true;
            }
        });

        if (!includeLabel) {
            return;
        }
    }

    if (query["label-ignore"] !== undefined) {
        let includeLabel = false;
        resp.labels.forEach((label: any) => {
            if (query["label-ignore"]?.includes(label.name)) {
                includeLabel = true;
            }
        });

        if (includeLabel) {
            return;
        }
    }

    return {
        title: title,
        html_url: html_url,
        author: resp.user?.login,
        draft: resp.draft,
        updated_at: resp.updated_at,
    };
}
