
export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  state: string;
  created: number;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  link?: {
    type: string;
    repo: string;
    repoId: number;
    org?: string;
  };
}

export class VercelService {
  private token: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Vercel API Error: ${error.error?.message || error.message}`);
    }

    return response.json();
  }

  async createProjectFromGitHub(repoUrl: string, projectName: string): Promise<VercelProject> {
    console.log('Creating Vercel project from GitHub:', projectName);
    
    // GitHub 레포지토리 URL에서 정보 추출
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace('.git', '');

    const projectData = {
      name: projectName,
      gitRepository: {
        type: 'github',
        repo: `${owner}/${repoName}`,
      },
      framework: 'nextjs',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm install',
      devCommand: 'npm run dev',
    };

    return this.request('/v10/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async importGitHubRepository(githubRepoUrl: string, projectName?: string): Promise<VercelProject> {
    console.log('Importing GitHub repository to Vercel:', githubRepoUrl);
    
    // GitHub 레포지토리 URL에서 정보 추출
    const repoMatch = githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace('.git', '');
    const finalProjectName = projectName || repoName;

    // Vercel에서 GitHub 레포지토리를 가져와서 프로젝트 생성
    const importData = {
      type: 'github',
      source: `${owner}/${repoName}`,
      installCommand: 'npm install',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      framework: 'vite',
      name: finalProjectName,
    };

    return this.request('/v9/projects', {
      method: 'POST',
      body: JSON.stringify(importData),
    });
  }

  async triggerDeployment(projectId: string): Promise<VercelDeployment> {
    console.log('Triggering deployment for project:', projectId);
    
    // 프로젝트의 최신 커밋으로 배포 트리거
    const deploymentData = {
      name: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
      },
    };

    return this.request(`/v13/deployments`, {
      method: 'POST',
      body: JSON.stringify(deploymentData),
    });
  }

  async getProject(projectId: string): Promise<VercelProject> {
    return this.request(`/v9/projects/${projectId}`);
  }

  async listProjects(): Promise<{ projects: VercelProject[] }> {
    return this.request('/v9/projects');
  }

  async getDeployments(projectId: string): Promise<{ deployments: VercelDeployment[] }> {
    return this.request(`/v6/deployments?projectId=${projectId}`);
  }
}
