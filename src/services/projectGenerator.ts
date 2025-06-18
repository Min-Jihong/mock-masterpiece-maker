import { GeminiService, GeneratedCode } from "./geminiService";
import { GitHubService } from "./githubService";
import { VercelService } from "./vercelService";
import { SupabaseService } from "./supabaseService";

export interface ProjectGenerationStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "progress" | "completed" | "error";
  details?: string;
}

export class ProjectGenerator {
  private geminiService: GeminiService;
  private githubService: GitHubService;
  private vercelService?: VercelService;
  private supabaseService?: SupabaseService;

  constructor(geminiApiKey: string, githubToken: string, vercelToken?: string, supabaseToken?: string) {
    this.geminiService = new GeminiService(geminiApiKey);
    this.githubService = new GitHubService(githubToken);
    if (vercelToken) {
      this.vercelService = new VercelService(vercelToken);
    }
    if (supabaseToken) {
      this.supabaseService = new SupabaseService(supabaseToken);
    }
  }

  async generateProject(userPrompt: string, onStepUpdate: (steps: ProjectGenerationStep[]) => void): Promise<string> {
    const steps: ProjectGenerationStep[] = [
      {
        id: "analyze",
        title: "AI 분석",
        description: "Gemini AI가 프롬프트를 분석하고 있습니다",
        status: "progress",
      },
      {
        id: "repo",
        title: "GitHub 레포지토리 생성",
        description: "새로운 레포지토리를 생성하고 있습니다",
        status: "pending",
      },
      {
        id: "structure",
        title: "프로젝트 구조 설계",
        description: "필요한 페이지와 컴포넌트를 계획하고 있습니다",
        status: "pending",
      },
      {
        id: "generate",
        title: "코드 생성",
        description: "각 페이지별로 코드를 생성하고 있습니다",
        status: "pending",
      },
      {
        id: "deploy",
        title: "GitHub 배포",
        description: "GitHub에 코드를 푸시하고 있습니다",
        status: "pending",
      },
    ];

    // Vercel 배포 단계 추가 (선택적)
    if (this.vercelService) {
      steps.push({
        id: "vercel",
        title: "Vercel 배포",
        description: "GitHub 레포지토리를 Vercel에 연동하고 배포합니다",
        status: "pending",
      });
    }

    onStepUpdate([...steps]);

    try {
      // Step 1: AI 분석
      console.log("Step 1: Analyzing prompt...");
      const analysis = await this.geminiService.analyzePrompt(userPrompt);

      steps[0].status = "completed";
      steps[0].details = `프로젝트명: ${analysis.projectName}`;
      steps[1].status = "progress";
      onStepUpdate([...steps]);

      // Step 2: GitHub 레포지토리 생성
      console.log("Step 2: Creating GitHub repository...");
      const repoInfo = await this.githubService.createRepository({
        name: analysis.projectName,
        description: analysis.description,
        private: false,
        auto_init: true,
      });

      steps[1].status = "completed";
      steps[1].details = `레포지토리: ${repoInfo.name}`;

      let currentStepIndex = 2;

      // Step 2.5: Supabase 설정 (필요한 경우)
      let supabaseProject;
      if (this.detectBackendNeeds(userPrompt) && this.supabaseService) {
        steps[currentStepIndex].status = "progress";
        onStepUpdate([...steps]);

        console.log("Step 2.5: Setting up Supabase...");
        supabaseProject = await this.supabaseService.createProject(analysis.projectName);

        // 인증 활성화
        await this.supabaseService.enableAuth(supabaseProject.id);

        steps[currentStepIndex].status = "completed";
        steps[currentStepIndex].details = `Supabase 프로젝트: ${supabaseProject.name}`;
        currentStepIndex++;
      }

      // Step 3: 프로젝트 구조 생성
      steps[currentStepIndex].status = "progress";
      onStepUpdate([...steps]);

      console.log("Step 3: Generating project structure...");
      const structureFiles = await this.geminiService.generateProjectStructure(analysis, supabaseProject);

      steps[currentStepIndex].status = "completed";
      steps[currentStepIndex].details = `${structureFiles.length}개 구조 파일 생성`;
      currentStepIndex++;

      // Step 4: 페이지별 코드 생성
      steps[currentStepIndex].status = "progress";
      onStepUpdate([...steps]);

      console.log("Step 4: Generating page codes...");
      const allFiles: GeneratedCode[] = [...structureFiles];

      for (const page of analysis.pages) {
        const pageFiles = await this.geminiService.generatePageCode(page, analysis, supabaseProject);
        allFiles.push(...pageFiles);
      }

      steps[currentStepIndex].status = "completed";
      steps[currentStepIndex].details = `총 ${allFiles.length}개 파일 생성`;
      currentStepIndex++;

      // Step 5: GitHub에 커밋
      steps[currentStepIndex].status = "progress";
      onStepUpdate([...steps]);

      console.log("Step 5: Committing to GitHub...");
      const filesToCommit = allFiles.map((file) => ({
        path: file.filePath,
        content: file.content,
      }));

      await this.githubService.commitMultipleFiles(
        repoInfo.full_name,
        filesToCommit,
        `Initial project setup: ${analysis.description}`
      );

      steps[currentStepIndex].status = "completed";
      steps[currentStepIndex].details = "프로젝트 배포 완료";
      currentStepIndex++;

      // Step 6: Vercel 배포 (선택적)
      if (this.vercelService) {
        const vercelStepIndex = steps.findIndex(step => step.id === "vercel");
        steps[vercelStepIndex].status = "progress";
        onStepUpdate([...steps]);

        console.log("Step 6: Importing GitHub repository to Vercel...");
        
        // GitHub 레포지토리를 Vercel로 가져오기
        const vercelProject = await this.vercelService.importGitHubRepository(
          repoInfo.html_url, 
          analysis.projectName
        );
        
        // 배포 트리거
        const deployment = await this.vercelService.triggerDeployment(vercelProject.id);

        steps[vercelStepIndex].status = "completed";
        steps[vercelStepIndex].details = `배포 URL: https://${vercelProject.name}.vercel.app`;
      }

      onStepUpdate([...steps]);
      return repoInfo.html_url;
    } catch (error) {
      console.error("Project generation failed:", error);

      // 현재 진행 중인 스텝을 에러로 표시
      const currentStepIndex = steps.findIndex((step) => step.status === "progress");
      if (currentStepIndex !== -1) {
        steps[currentStepIndex].status = "error";
        steps[currentStepIndex].details = error instanceof Error ? error.message : "알 수 없는 오류";
        onStepUpdate([...steps]);
      }

      throw error;
    }
  }

  private detectBackendNeeds(prompt: string): boolean {
    const backendKeywords = [
      "로그인",
      "login",
      "auth",
      "인증",
      "authentication",
      "회원가입",
      "signup",
      "register",
      "등록",
      "데이터베이스",
      "database",
      "db",
      "저장",
      "사용자",
      "user",
      "계정",
      "account",
      "게시판",
      "board",
      "댓글",
      "comment",
      "채팅",
      "chat",
      "메시지",
      "message",
      "결제",
      "payment",
      "주문",
      "order",
      "파일 업로드",
      "upload",
      "이미지 업로드",
    ];

    return backendKeywords.some((keyword) => prompt.toLowerCase().includes(keyword.toLowerCase()));
  }
}
