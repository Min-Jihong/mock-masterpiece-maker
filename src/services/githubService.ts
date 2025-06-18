
export interface RepoInfo {
  name: string;
  description: string;
  full_name: string;
  clone_url: string;
  html_url: string;
}

export interface CreateRepoRequest {
  name: string;
  description: string;
  private: boolean;
  auto_init: boolean;
}

export class GitHubService {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`GitHub API Error: ${error.message}`);
    }

    return response.json();
  }

  async createRepository(repoData: CreateRepoRequest): Promise<RepoInfo> {
    console.log('Creating GitHub repository:', repoData);
    
    const repo = await this.request('/user/repos', {
      method: 'POST',
      body: JSON.stringify(repoData),
    });

    return {
      name: repo.name,
      description: repo.description,
      full_name: repo.full_name,
      clone_url: repo.clone_url,
      html_url: repo.html_url,
    };
  }

  async createFile(repoFullName: string, path: string, content: string, message: string) {
    console.log(`Creating file: ${path} in ${repoFullName}`);
    
    // Base64 encode the content
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    return this.request(`/repos/${repoFullName}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodedContent,
        encoding: 'base64',
      }),
    });
  }

  async createBranch(repoFullName: string, branchName: string, fromBranch = 'main') {
    console.log(`Creating branch: ${branchName} in ${repoFullName}`);
    
    // Get the SHA of the from branch
    const refResponse = await this.request(`/repos/${repoFullName}/git/refs/heads/${fromBranch}`);
    const sha = refResponse.object.sha;

    // Create new branch
    return this.request(`/repos/${repoFullName}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha,
      }),
    });
  }

  async commitMultipleFiles(
    repoFullName: string, 
    files: Array<{ path: string; content: string }>, 
    message: string,
    branch = 'main'
  ) {
    console.log(`Committing ${files.length} files to ${repoFullName}/${branch}`);
    
    try {
      // Get current commit SHA
      const branchRef = await this.request(`/repos/${repoFullName}/git/refs/heads/${branch}`);
      const currentCommitSha = branchRef.object.sha;

      // Get current tree
      const currentCommit = await this.request(`/repos/${repoFullName}/git/commits/${currentCommitSha}`);
      const currentTreeSha = currentCommit.tree.sha;

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const blob = await this.request(`/repos/${repoFullName}/git/blobs`, {
            method: 'POST',
            body: JSON.stringify({
              content: btoa(unescape(encodeURIComponent(file.content))),
              encoding: 'base64',
            }),
          });
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          };
        })
      );

      // Create new tree
      const newTree = await this.request(`/repos/${repoFullName}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({
          base_tree: currentTreeSha,
          tree: blobs,
        }),
      });

      // Create new commit
      const newCommit = await this.request(`/repos/${repoFullName}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: newTree.sha,
          parents: [currentCommitSha],
        }),
      });

      // Update branch reference
      await this.request(`/repos/${repoFullName}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sha: newCommit.sha,
        }),
      });

      return newCommit;
    } catch (error) {
      console.error('Error committing files:', error);
      throw error;
    }
  }

  async getUserInfo() {
    return this.request('/user');
  }
}
