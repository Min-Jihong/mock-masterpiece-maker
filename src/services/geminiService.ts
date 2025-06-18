import {
  GoogleGenerativeAI,
  GenerationConfig,
  Schema,
  SchemaType,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export interface ProjectAnalysis {
  projectName: string;
  description: string;
  pages: PageStructure[];
  features: string[];
  techStack: string[];
}

export interface PageStructure {
  name: string;
  path: string;
  description: string;
  components: ComponentStructure[];
  features: string[];
}

export interface ComponentStructure {
  name: string;
  type: "component" | "layout" | "page";
  description: string;
  props?: string[];
}

export interface GeneratedCode {
  filePath: string;
  content: string;
  description: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzePrompt(userPrompt: string): Promise<ProjectAnalysis> {
    console.log("Analyzing user prompt with Gemini...");

    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
사용자가 요청한 웹사이트 프롬프트를 분석하여 프로젝트 정보를 추출해주세요.

사용자 프롬프트: "${userPrompt}"

응답은 다음 JSON 형식으로 정확히 제공해주세요:
`;

    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        projectName: {
          type: SchemaType.STRING,
          description: "kebab-case로 된 프로젝트명",
        },
        description: {
          type: SchemaType.STRING,
          description: "프로젝트 설명",
        },
        pages: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "페이지명" },
              path: { type: SchemaType.STRING, description: "페이지 경로" },
              description: { type: SchemaType.STRING, description: "페이지 설명" },
              components: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING, description: "컴포넌트명" },
                    type: { type: SchemaType.STRING, description: "컴포넌트 타입" },
                    description: { type: SchemaType.STRING, description: "컴포넌트 설명" },
                    props: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: "props 목록",
                    },
                  },
                  required: ["name", "type", "description"],
                },
              },
              features: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "페이지 기능 목록",
              },
            },
            required: ["name", "path", "description", "components", "features"],
          },
        },
        features: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "전체 기능 목록",
        },
        techStack: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "기술 스택",
        },
      },
      required: ["projectName", "description", "pages", "features", "techStack"],
    };

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.3,
    };

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const response = result.response;
      const responseText = response.text();

      console.log("Gemini response:", responseText);

      return JSON.parse(responseText);
    } catch (error) {
      console.error("Error analyzing prompt:", error);

      // 기본값 반환
      return {
        projectName: `generated-website-${new Date().getTime()}`,
        description: "사용자 요청에 따라 생성된 웹사이트",
        pages: [
          {
            name: "메인 페이지",
            path: "/",
            description: "홈페이지",
            components: [
              {
                name: "HomePage",
                type: "page",
                description: "메인 페이지 컴포넌트",
              },
            ],
            features: ["기본 레이아웃", "네비게이션"],
          },
        ],
        features: ["반응형 디자인", "모던 UI"],
        techStack: ["Next.js", "Shadcn UI", "TailwindCSS"],
      };
    }
  }

  async generatePageCode(
    page: PageStructure,
    projectAnalysis: ProjectAnalysis,
    supabaseProject?: any
  ): Promise<GeneratedCode[]> {
    console.log(`Generating code for page: ${page.name}`);

    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    let supabaseInfo = "";
    if (supabaseProject) {
      supabaseInfo = `
Supabase 설정:
- 프로젝트 URL: ${supabaseProject.database_url}
- Anon Key: ${supabaseProject.anon_key}
- 인증 기능 활성화됨
`;
    }

    const prompt = `
Next.js 14, Shadcn UI, TailwindCSS를 사용하여 다음 페이지의 코드를 생성해주세요.

프로젝트 정보:
- 이름: ${projectAnalysis.projectName}
- 설명: ${projectAnalysis.description}
- 기능: ${projectAnalysis.features.join(", ")}

${supabaseInfo}

페이지 정보:
- 이름: ${page.name}
- 경로: ${page.path}
- 설명: ${page.description}
- 기능: ${page.features.join(", ")}
- 컴포넌트: ${page.components.map((c) => c.name).join(", ")}

다음 규칙을 따라주세요:
1. Next.js 14의 App Router 구조 사용 (src/app 폴더 구조)
2. Shadcn UI 컴포넌트 활용 (@/components/ui/* 경로)
3. TailwindCSS로 현대적인 디자인
4. TypeScript 사용
5. 반응형 디자인
6. 접근성 고려
7. @ alias 사용 (@/components, @/lib 등)
${supabaseProject ? "8. Supabase 클라이언트 사용시 @supabase/supabase-js 라이브러리 활용" : ""}

모든 필요한 파일을 src/ 폴더 구조로 생성해주세요.
`;

    const responseSchema: Schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          filePath: {
            type: SchemaType.STRING,
            description: "파일 경로 (예: app/page.tsx, components/Header.tsx)",
          },
          content: {
            type: SchemaType.STRING,
            description: "파일 내용",
          },
          description: {
            type: SchemaType.STRING,
            description: "파일 설명",
          },
        },
        required: ["filePath", "content", "description"],
      },
    };

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.4,
    };

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const response = result.response;
      const responseText = response.text();

      console.log("Generated page code:", responseText);

      return JSON.parse(responseText);
    } catch (error) {
      console.error("Error generating page code:", error);

      // 기본 페이지 코드 반환
      return [
        {
          filePath: page.path === "/" ? "src/app/page.tsx" : `src/app${page.path}/page.tsx`,
          content: this.getDefaultPageCode(page, supabaseProject),
          description: `${page.name} 기본 코드`,
        },
      ];
    }
  }

  async generateProjectStructure(analysis: ProjectAnalysis, supabaseProject?: any): Promise<GeneratedCode[]> {
    console.log("Generating project structure files...");

    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    let supabaseInfo = "";
    if (supabaseProject) {
      supabaseInfo = `
Supabase 프로젝트가 연동되었습니다:
- 프로젝트 URL: ${supabaseProject.database_url}
- Anon Key: ${supabaseProject.anon_key}
- Service Role Key: ${supabaseProject.service_role_key}
`;
    }

    const prompt = `
Next.js 14 + Shadcn UI 프로젝트의 완전한 구조 파일들을 생성해주세요.

프로젝트 정보:
- 이름: ${analysis.projectName}
- 설명: ${analysis.description}
- 기술 스택: ${analysis.techStack.join(", ")}

${supabaseInfo}

다음 파일들을 완전하게 생성해주세요:
1. package.json - Next.js 14, 모든 Shadcn/ui 컴포넌트와 의존성${supabaseProject ? ", @supabase/supabase-js" : ""} 포함
2. next.config.js - Next.js 설정
3. tailwind.config.ts - TailwindCSS + Shadcn 설정
4. components.json - Shadcn UI 완전한 설정 (src 폴더 구조)
5. tsconfig.json - TypeScript 설정 (src/@ alias 포함)
6. src/app/layout.tsx - 기본 레이아웃
7. src/app/globals.css - 글로벌 스타일 (Shadcn 포함)
8. src/lib/utils.ts - 유틸리티 함수
9. 모든 기본 Shadcn UI 컴포넌트들 (button, dialog, input, card, alert 등)
${supabaseProject ? "10. src/lib/supabase.ts - Supabase 클라이언트 설정\n11. .env.local.example - 환경 변수 예제" : ""}
12. .gitignore - Next.js용 gitignore

모든 파일은 src/ 폴더 구조를 사용하고 @ alias가 정상 작동해야 합니다.
Shadcn UI 컴포넌트들은 실제 CLI 명령어로 생성되는 것과 동일한 코드로 생성해주세요.
`;

    const responseSchema: Schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          filePath: {
            type: SchemaType.STRING,
            description: "파일 경로",
          },
          content: {
            type: SchemaType.STRING,
            description: "파일 내용",
          },
          description: {
            type: SchemaType.STRING,
            description: "파일 설명",
          },
        },
        required: ["filePath", "content", "description"],
      },
    };

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    };

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const response = result.response;
      const responseText = response.text();

      console.log("Generated project structure:", responseText);

      const generatedFiles = JSON.parse(responseText);

      // 기본 Shadcn UI 컴포넌트들을 추가로 생성
      const shadcnComponents = this.getShadcnComponents();

      return [...generatedFiles, ...shadcnComponents];
    } catch (error) {
      console.error("Error generating project structure:", error);
      return this.getDefaultProjectStructure(analysis, supabaseProject);
    }
  }

  private getDefaultPageCode(page: PageStructure, supabaseProject?: any): string {
    return `
export default function ${page.name.replace(/\s+/g, "")}Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          ${page.name}
        </h1>
        <p className="text-lg text-gray-600">
          ${page.description}
        </p>
        
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 기능 카드들 */}
          ${page.features
            .map(
              (feature) => `
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">${feature}</h3>
            <p className="text-gray-600">
              ${feature}에 대한 설명입니다.
            </p>
          </div>
          `
            )
            .join("")}
        </div>
      </div>
    </div>
  );
}`;
  }

  private getDefaultProjectStructure(analysis: ProjectAnalysis, supabaseProject?: any): GeneratedCode[] {
    const baseStructure = [
      {
        filePath: "package.json",
        content: JSON.stringify(
          {
            name: analysis.projectName,
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "next dev",
              build: "next build",
              start: "next start",
              lint: "next lint",
            },
            dependencies: {
              next: "^14.0.0",
              react: "^18.0.0",
              "react-dom": "^18.0.0",
              ...(supabaseProject && { "@supabase/supabase-js": "^2.39.0" }),
              "@radix-ui/react-accordion": "^1.2.0",
              "@radix-ui/react-alert-dialog": "^1.1.1",
              "@radix-ui/react-aspect-ratio": "^1.1.0",
              "@radix-ui/react-avatar": "^1.1.0",
              "@radix-ui/react-checkbox": "^1.1.1",
              "@radix-ui/react-collapsible": "^1.1.0",
              "@radix-ui/react-context-menu": "^2.2.1",
              "@radix-ui/react-dialog": "^1.1.2",
              "@radix-ui/react-dropdown-menu": "^2.1.1",
              "@radix-ui/react-hover-card": "^1.1.1",
              "@radix-ui/react-label": "^2.1.0",
              "@radix-ui/react-menubar": "^1.1.1",
              "@radix-ui/react-navigation-menu": "^1.2.0",
              "@radix-ui/react-popover": "^1.1.1",
              "@radix-ui/react-progress": "^1.1.0",
              "@radix-ui/react-radio-group": "^1.2.0",
              "@radix-ui/react-scroll-area": "^1.1.0",
              "@radix-ui/react-select": "^2.1.1",
              "@radix-ui/react-separator": "^1.1.0",
              "@radix-ui/react-slider": "^1.2.0",
              "@radix-ui/react-slot": "^1.1.0",
              "@radix-ui/react-switch": "^1.1.0",
              "@radix-ui/react-tabs": "^1.1.0",
              "@radix-ui/react-toast": "^1.2.1",
              "@radix-ui/react-toggle": "^1.1.0",
              "@radix-ui/react-toggle-group": "^1.1.0",
              "@radix-ui/react-tooltip": "^1.1.4",
              "class-variance-authority": "^0.7.0",
              clsx: "^2.0.0",
              "lucide-react": "^0.400.0",
              "tailwind-merge": "^2.0.0",
              "tailwindcss-animate": "^1.0.7",
              cmdk: "^1.0.0",
              "date-fns": "^3.6.0",
              "embla-carousel-react": "^8.3.0",
              "input-otp": "^1.2.4",
              "next-themes": "^0.3.0",
              "react-day-picker": "^8.10.1",
              "react-hook-form": "^7.53.0",
              "react-resizable-panels": "^2.1.3",
              recharts: "^2.12.7",
              sonner: "^1.5.0",
              vaul: "^0.9.3",
              zod: "^3.23.8",
            },
            devDependencies: {
              typescript: "^5.0.0",
              "@types/node": "^20.0.0",
              "@types/react": "^18.0.0",
              "@types/react-dom": "^18.0.0",
              autoprefixer: "^10.0.0",
              postcss: "^8.0.0",
              tailwindcss: "^3.0.0",
              eslint: "^8.0.0",
              "eslint-config-next": "^14.0.0",
            },
          },
          null,
          2
        ),
        description: "Complete package.json with Next.js 14 and all dependencies",
      },
      {
        filePath: "next.config.js",
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig`,
        description: "Next.js configuration",
      },
      {
        filePath: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              lib: ["dom", "dom.iterable", "es6"],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: "esnext",
              moduleResolution: "bundler",
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: "preserve",
              incremental: true,
              plugins: [
                {
                  name: "next",
                },
              ],
              baseUrl: ".",
              paths: {
                "@/*": ["./src/*"],
                "@/components/*": ["./src/components/*"],
                "@/lib/*": ["./src/lib/*"],
                "@/app/*": ["./src/app/*"],
              },
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"],
          },
          null,
          2
        ),
        description: "TypeScript configuration with @ alias support",
      },
      {
        filePath: "tailwind.config.ts",
        content: `import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;`,
        description: "Complete Tailwind CSS configuration with Shadcn support",
      },
      {
        filePath: "components.json",
        content: JSON.stringify(
          {
            $schema: "https://ui.shadcn.com/schema.json",
            style: "default",
            rsc: true,
            tsx: true,
            tailwind: {
              config: "tailwind.config.ts",
              css: "src/app/globals.css",
              baseColor: "slate",
              cssVariables: true,
              prefix: "",
            },
            aliases: {
              components: "@/components",
              utils: "@/lib/utils",
              ui: "@/components/ui",
              lib: "@/lib",
              hooks: "@/hooks",
            },
          },
          null,
          2
        ),
        description: "Shadcn UI configuration",
      },
      {
        filePath: "src/app/layout.tsx",
        content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${analysis.projectName}',
  description: '${analysis.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
        description: "Root layout with metadata",
      },
      {
        filePath: "src/app/globals.css",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`,
        description: "Global CSS with Shadcn variables",
      },
      {
        filePath: "src/lib/utils.ts",
        content: `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
        description: "Utility functions for className merging",
      },
      {
        filePath: ".gitignore",
        content: `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`,
        description: "Git ignore file for Next.js project",
      },
      {
        filePath: "postcss.config.js",
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
        description: "PostCSS configuration",
      },
    ];

    // Supabase 관련 파일 추가
    if (supabaseProject) {
      baseStructure.push(
        {
          filePath: "src/lib/supabase.ts",
          content: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${supabaseProject.database_url}'
const supabaseAnonKey = '${supabaseProject.anon_key}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase`,
          description: "Supabase client configuration",
        },
        {
          filePath: ".env.local.example",
          content: `NEXT_PUBLIC_SUPABASE_URL=${supabaseProject.database_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseProject.anon_key}
SUPABASE_SERVICE_ROLE_KEY=${supabaseProject.service_role_key}`,
          description: "Environment variables example",
        }
      );
    }

    return baseStructure;
  }

  private getShadcnComponents(): GeneratedCode[] {
    return [
      {
        filePath: "src/components/ui/button.tsx",
        content: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`,
        description: "Shadcn UI Button component",
      },
      {
        filePath: "src/components/ui/input.tsx",
        content: `import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`,
        description: "Shadcn UI Input component",
      },
      {
        filePath: "src/components/ui/textarea.tsx",
        content: `import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }`,
        description: "Shadcn UI Textarea component",
      },
      {
        filePath: "src/components/ui/card.tsx",
        content: `import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`,
        description: "Shadcn UI Card component",
      },
      {
        filePath: "src/components/ui/dialog.tsx",
        content: `import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}`,
        description: "Shadcn UI Dialog component",
      },
      {
        filePath: "src/components/ui/alert.tsx",
        content: `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }`,
        description: "Shadcn UI Alert component",
      },
      {
        filePath: "src/components/ui/label.tsx",
        content: `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }`,
        description: "Shadcn UI Label component",
      },
      {
        filePath: "src/components/ui/badge.tsx",
        content: `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }`,
        description: "Shadcn UI Badge component",
      },
      {
        filePath: "src/components/ui/toast.tsx",
        content: `import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}`,
        description: "Shadcn UI Toast component",
      },
    ];
  }
}
