import { Octokit } from '@octokit/rest';
import { db } from './supabase';
import { Repository, GitHubRepository, GitHubCommit, GitHubIssue, GitHubPullRequest } from '@/types/database';

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  // Parse GitHub URL to extract owner and repo
  private parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', ''),
    };
  }

  // Fetch user's repositories
  async getUserRepositories(username?: string, includePrivate = false): Promise<GitHubRepository[]> {
    try {
      let repos;
      
      if (username) {
        // Get public repos for a specific user
        const response = await this.octokit.rest.repos.listForUser({
          username,
          sort: 'updated',
          per_page: 100,
        });
        repos = response.data;
      } else {
        // Get repos for the authenticated user
        const response = await this.octokit.rest.repos.listForAuthenticatedUser({
          visibility: includePrivate ? 'all' : 'public',
          sort: 'updated',
          per_page: 100,
        });
        repos = response.data;
      }

      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || undefined,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        language: repo.language || undefined,
        topics: repo.topics || [],
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error(`Failed to fetch repositories: ${error}`);
    }
  }

  // Import repositories to database
  async importRepositories(userId: string, githubUsername?: string): Promise<Repository[]> {
    try {
      const githubRepos = await this.getUserRepositories(githubUsername, true);
      const importedRepos: Repository[] = [];

      for (const githubRepo of githubRepos) {
        try {
          // Check if repo already exists
          const { data: existingRepo } = await db.getRepositories(userId);
          const exists = existingRepo?.some(r => r.github_id === githubRepo.id);
          
          if (!exists) {
            // Create new repository record
            const repoData = {
              user_id: userId,
              github_id: githubRepo.id,
              name: githubRepo.name,
              full_name: githubRepo.full_name,
              description: githubRepo.description,
              private: githubRepo.private,
              html_url: githubRepo.html_url,
              clone_url: githubRepo.clone_url,
              language: githubRepo.language,
              languages: {}, // Will be populated by analysis
              topics: githubRepo.topics,
              stars: githubRepo.stargazers_count,
              forks: githubRepo.forks_count,
              open_issues: githubRepo.open_issues_count,
              default_branch: githubRepo.default_branch,
              tech_stack: {
                frameworks: [],
                languages: [],
                databases: [],
                tools: [],
                deployment: [],
                testing: [],
                styling: [],
                apis: [],
              },
              is_active: true,
            };

            const { data: newRepo, error } = await db.createRepository(repoData);
            if (error) {
              console.error(`Error creating repository ${githubRepo.name}:`, error);
            } else if (newRepo) {
              importedRepos.push(newRepo);
            }
          }
        } catch (repoError) {
          console.error(`Error importing repository ${githubRepo.name}:`, repoError);
          continue;
        }
      }

      return importedRepos;
    } catch (error) {
      console.error('Error importing repositories:', error);
      throw new Error(`Failed to import repositories: ${error}`);
    }
  }

  // Get repository details
  async getRepositoryDetails(owner: string, repo: string): Promise<any> {
    try {
      const [repoData, languages, commits, issues, pulls, releases, contributors] = await Promise.all([
        this.octokit.rest.repos.get({ owner, repo }),
        this.octokit.rest.repos.listLanguages({ owner, repo }),
        this.octokit.rest.repos.listCommits({ owner, repo, per_page: 50 }),
        this.octokit.rest.issues.listForRepo({ owner, repo, state: 'all', per_page: 50 }),
        this.octokit.rest.pulls.list({ owner, repo, state: 'all', per_page: 30 }),
        this.octokit.rest.repos.listReleases({ owner, repo, per_page: 10 }),
        this.octokit.rest.repos.listContributors({ owner, repo, per_page: 20 }),
      ]);

      return {
        repository: repoData.data,
        languages: languages.data,
        commits: commits.data,
        issues: issues.data,
        pullRequests: pulls.data,
        releases: releases.data,
        contributors: contributors.data,
      };
    } catch (error) {
      console.error(`Error fetching repository details for ${owner}/${repo}:`, error);
      throw new Error(`Failed to fetch repository details: ${error}`);
    }
  }

  // Get repository file structure
  async getRepositoryStructure(owner: string, repo: string, path = ''): Promise<any[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      const files = Array.isArray(response.data) ? response.data : [response.data];
      const structure = [];

      for (const file of files) {
        if (file.type === 'file') {
          structure.push({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size,
            sha: file.sha,
            download_url: file.download_url,
          });
        } else if (file.type === 'dir') {
          structure.push({
            name: file.name,
            path: file.path,
            type: file.type,
            sha: file.sha,
          });
        }
      }

      return structure;
    } catch (error) {
      console.error(`Error fetching repository structure for ${owner}/${repo}:`, error);
      throw new Error(`Failed to fetch repository structure: ${error}`);
    }
  }

  // Get file content
  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(response.data) || response.data.type !== 'file') {
        return null;
      }

      if (response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf8');
      }

      return null;
    } catch (error) {
      console.error(`Error fetching file content for ${owner}/${repo}/${path}:`, error);
      return null;
    }
  }

  // Get important files content
  async getImportantFiles(owner: string, repo: string): Promise<Record<string, string>> {
    const importantFiles = [
      'README.md',
      'readme.md',
      'README.rst',
      'package.json',
      'requirements.txt',
      'Pipfile',
      'composer.json',
      'Dockerfile',
      'docker-compose.yml',
      '.env.example',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.js',
      'next.config.js',
      'tailwind.config.js',
      'LICENSE',
      'CONTRIBUTING.md',
      '.gitignore',
    ];

    const fileContents: Record<string, string> = {};

    for (const fileName of importantFiles) {
      const content = await this.getFileContent(owner, repo, fileName);
      if (content) {
        fileContents[fileName] = content;
      }
    }

    return fileContents;
  }

  // Analyze commits for a time period
  async analyzeCommits(
    owner: string, 
    repo: string, 
    since?: string, 
    until?: string
  ): Promise<{
    commits: GitHubCommit[];
    stats: {
      total: number;
      authors: Record<string, number>;
      daily: Record<string, number>;
      files_changed: number;
      additions: number;
      deletions: number;
    };
  }> {
    try {
      const params: any = { owner, repo, per_page: 100 };
      if (since) params.since = since;
      if (until) params.until = until;

      const response = await this.octokit.rest.repos.listCommits(params);
      const commits = response.data;

      const stats = {
        total: commits.length,
        authors: {} as Record<string, number>,
        daily: {} as Record<string, number>,
        files_changed: 0,
        additions: 0,
        deletions: 0,
      };

      // Analyze commits
      for (const commit of commits) {
        // Count by author
        const author = commit.author?.login || 'Unknown';
        stats.authors[author] = (stats.authors[author] || 0) + 1;

        // Count by day
        const date = commit.commit.author.date.split('T')[0];
        stats.daily[date] = (stats.daily[date] || 0) + 1;

        // Get detailed commit stats
        try {
          const detailResponse = await this.octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          });

          if (detailResponse.data.stats) {
            stats.additions += detailResponse.data.stats.additions || 0;
            stats.deletions += detailResponse.data.stats.deletions || 0;
            stats.files_changed += detailResponse.data.files?.length || 0;
          }
        } catch (detailError) {
          // Continue if we can't get detailed stats for individual commits
        }
      }

      return {
        commits: commits.map(commit => ({
          sha: commit.sha,
          commit: {
            message: commit.commit.message,
            author: {
              name: commit.commit.author.name,
              email: commit.commit.author.email,
              date: commit.commit.author.date,
            },
          },
          author: commit.author ? {
            login: commit.author.login,
            avatar_url: commit.author.avatar_url,
          } : null,
          html_url: commit.html_url,
        })),
        stats,
      };
    } catch (error) {
      console.error(`Error analyzing commits for ${owner}/${repo}:`, error);
      throw new Error(`Failed to analyze commits: ${error}`);
    }
  }

  // Get repository issues
  async getIssues(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 100,
      });

      return response.data.map(issue => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || undefined,
        state: issue.state as 'open' | 'closed',
        user: {
          login: issue.user.login,
          avatar_url: issue.user.avatar_url,
        },
        labels: issue.labels.map(label => ({
          name: typeof label === 'string' ? label : label.name,
          color: typeof label === 'string' ? '' : label.color,
        })),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
      }));
    } catch (error) {
      console.error(`Error fetching issues for ${owner}/${repo}:`, error);
      throw new Error(`Failed to fetch issues: ${error}`);
    }
  }

  // Get pull requests
  async getPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubPullRequest[]> {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state,
        per_page: 100,
      });

      return response.data.map(pr => ({
        number: pr.number,
        title: pr.title,
        body: pr.body || undefined,
        state: pr.state as 'open' | 'closed' | 'merged',
        user: {
          login: pr.user.login,
          avatar_url: pr.user.avatar_url,
        },
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        merged_at: pr.merged_at || undefined,
        html_url: pr.html_url,
      }));
    } catch (error) {
      console.error(`Error fetching pull requests for ${owner}/${repo}:`, error);
      throw new Error(`Failed to fetch pull requests: ${error}`);
    }
  }

  // Sync repository data with database
  async syncRepositoryData(repositoryId: string): Promise<void> {
    try {
      const { data: repository, error } = await db.getRepository(repositoryId);
      if (error || !repository) {
        throw new Error('Repository not found in database');
      }

      const urlParts = this.parseGitHubUrl(repository.html_url);
      if (!urlParts) {
        throw new Error('Invalid GitHub URL');
      }

      const { owner, repo } = urlParts;

      // Get fresh data from GitHub
      const details = await this.getRepositoryDetails(owner, repo);
      
      // Update repository record
      const updates = {
        description: details.repository.description,
        stars: details.repository.stargazers_count,
        forks: details.repository.forks_count,
        open_issues: details.repository.open_issues_count,
        languages: details.languages,
        last_commit_sha: details.commits[0]?.sha,
        last_commit_date: details.commits[0]?.commit.author.date,
        updated_at: new Date().toISOString(),
      };

      await db.updateRepository(repositoryId, updates);

      // Cache the detailed data
      await db.setCache(repositoryId, 'github_details', 'latest', details, 60); // 1 hour cache

      console.log(`Successfully synced repository: ${repository.full_name}`);
    } catch (error) {
      console.error(`Error syncing repository data:`, error);
      throw error;
    }
  }

  // Create a GitHub issue from a todo item
  async createIssueFromTodo(
    repositoryId: string,
    todoItem: {
      title: string;
      description?: string;
      labels?: string[];
      assignee?: string;
    }
  ): Promise<string> {
    try {
      const { data: repository } = await db.getRepository(repositoryId);
      if (!repository) throw new Error('Repository not found');

      const urlParts = this.parseGitHubUrl(repository.html_url);
      if (!urlParts) throw new Error('Invalid GitHub URL');

      const { owner, repo } = urlParts;

      const issueData: any = {
        owner,
        repo,
        title: todoItem.title,
        body: todoItem.description || '',
      };

      if (todoItem.labels && todoItem.labels.length > 0) {
        issueData.labels = todoItem.labels;
      }

      if (todoItem.assignee) {
        issueData.assignees = [todoItem.assignee];
      }

      const response = await this.octokit.rest.issues.create(issueData);
      return response.data.html_url;
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      throw new Error(`Failed to create GitHub issue: ${error}`);
    }
  }
}

// Helper function for backward compatibility and easier usage
export const getGitHubData = async (repoFullName: string) => {
  const service = new GitHubService();
  const [owner, repo] = repoFullName.split('/');

  return {
    async getRepository() {
      const response = await service.getRepositoryDetails(owner, repo);
      return response.repository;
    },

    async getCommits(options: { since?: string; until?: string } = {}) {
      const result = await service.analyzeCommits(owner, repo, options.since, options.until);
      return result.commits;
    },

    async getCommit(sha: string) {
      // Use the octokit instance from the service
      const octokit = new (require('@octokit/rest').Octokit)({
        auth: process.env.GITHUB_TOKEN,
      });
      const { data } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });
      return data;
    },

    async getLanguages() {
      const details = await service.getRepositoryDetails(owner, repo);
      return details.languages;
    },

    async getContributors() {
      const details = await service.getRepositoryDetails(owner, repo);
      return details.contributors;
    },

    async getIssues(options: { state?: 'open' | 'closed' | 'all'; since?: string } = {}) {
      return await service.getIssues(owner, repo, options.state);
    },

    async getPullRequests(options: { state?: 'open' | 'closed' | 'all' } = {}) {
      return await service.getPullRequests(owner, repo, options.state);
    },

    async getBranches() {
      // Use the octokit instance to get branches
      const octokit = new (require('@octokit/rest').Octokit)({
        auth: process.env.GITHUB_TOKEN,
      });
      const { data } = await octokit.rest.repos.listBranches({
        owner,
        repo,
      });
      return data;
    },
  };
};

// Export singleton instance
export const githubService = new GitHubService();

// Export class for custom instances
export default GitHubService;
