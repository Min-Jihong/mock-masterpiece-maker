
export interface SupabaseProject {
  id: string;
  name: string;
  database_url: string;
  anon_key: string;
  service_role_key: string;
  created_at: string;
}

export interface SupabaseTable {
  name: string;
  columns: SupabaseColumn[];
}

export interface SupabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary_key?: boolean;
}

export class SupabaseService {
  private token: string;
  private baseUrl = 'https://api.supabase.com';

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
      throw new Error(`Supabase API Error: ${error.message}`);
    }

    return response.json();
  }

  async createProject(projectName: string, region = 'ap-southeast-1'): Promise<SupabaseProject> {
    console.log('Creating Supabase project:', projectName);
    
    const projectData = {
      name: projectName,
      organization_id: await this.getDefaultOrgId(),
      plan: 'free',
      region,
      db_pass: this.generateRandomPassword(),
    };

    return this.request('/v1/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async createTable(projectRef: string, table: SupabaseTable): Promise<void> {
    console.log('Creating Supabase table:', table.name);
    
    const columns = table.columns.map(col => ({
      name: col.name,
      type: col.type,
      primary_key: col.primary_key || false,
      nullable: col.nullable,
    }));

    const tableData = {
      name: table.name,
      columns,
    };

    return this.request(`/v1/projects/${projectRef}/database/tables`, {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  }

  async enableAuth(projectRef: string): Promise<void> {
    console.log('Enabling Supabase Auth for project:', projectRef);
    
    const authConfig = {
      site_url: 'http://localhost:3000',
      jwt_secret: this.generateJwtSecret(),
      enable_signup: true,
      enable_email_confirmations: false,
    };

    return this.request(`/v1/projects/${projectRef}/config/auth`, {
      method: 'PATCH',
      body: JSON.stringify(authConfig),
    });
  }

  private async getDefaultOrgId(): Promise<string> {
    const orgs = await this.request('/v1/organizations');
    return orgs[0]?.id || 'default';
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }

  private generateJwtSecret(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
