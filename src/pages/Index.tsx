import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ProjectGenerator } from "@/services/projectGenerator";
import ProjectProgress from "@/components/ProjectProgress";
import SettingsModal from "@/components/SettingsModal";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRepoUrl, setGeneratedRepoUrl] = useState("");
  const [steps, setSteps] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "오류",
        description: "프롬프트를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const vercelToken = import.meta.env.VITE_VERCEL_TOKEN;
    const supabaseToken = import.meta.env.VITE_SUPABASE_URL;

    if (!githubToken || !geminiApiKey) {
      toast({
        title: "API 키 필요",
        description: "GitHub Token과 Gemini API Key를 먼저 설정해주세요.",
        variant: "destructive",
      });
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedRepoUrl("");
    setSteps([]);

    try {
      const generator = new ProjectGenerator(
        geminiApiKey,
        githubToken,
        vercelToken || undefined,
        supabaseToken || undefined
      );

      const repoUrl = await generator.generateProject(prompt, (newSteps) => {
        setSteps(newSteps);
      });

      setGeneratedRepoUrl(repoUrl);

      toast({
        title: "성공!",
        description: "웹사이트가 성공적으로 생성되었습니다.",
      });
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "생성 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">웹사이트 자동 생성기</h1>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="mb-6">
        <Textarea
          placeholder="만들고 싶은 웹사이트에 대한 설명을 입력하세요."
          rows={4}
          className="w-full rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
        >
          {isGenerating ? "생성 중..." : "웹사이트 생성하기"}
        </Button>
      </div>

      {isGenerating && <ProjectProgress steps={steps} isGenerating={isGenerating} />}

      {!isGenerating && generatedRepoUrl && (
        <ProjectProgress steps={steps} isGenerating={isGenerating} repoUrl={generatedRepoUrl} />
      )}
    </div>
  );
};

export default Index;
