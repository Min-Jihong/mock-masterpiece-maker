import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, ExternalLink, Key } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [githubToken, setGithubToken] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [supabaseToken, setSupabaseToken] = useState("");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [showSupabaseToken, setShowSupabaseToken] = useState(false);

  useEffect(() => {
    // 저장된 값들 불러오기
    setGithubToken(localStorage.getItem('GITHUB_TOKEN') || '');
    setGeminiApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
    setVercelToken(localStorage.getItem('VERCEL_TOKEN') || '');
    setSupabaseToken(localStorage.getItem('SUPABASE_TOKEN') || '');
  }, [isOpen]);

  const handleSave = () => {
    // 환경 변수 저장
    if (githubToken) localStorage.setItem('GITHUB_TOKEN', githubToken);
    if (geminiApiKey) localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    if (vercelToken) localStorage.setItem('VERCEL_TOKEN', vercelToken);
    if (supabaseToken) localStorage.setItem('SUPABASE_TOKEN', supabaseToken);

    toast({
      title: "설정 저장됨",
      description: "API 키가 성공적으로 저장되었습니다.",
    });

    onClose();
  };

  const apiKeyGuides = [
    {
      name: "GitHub Token",
      description: "GitHub 레포지토리 생성 및 코드 푸시를 위해 필요합니다.",
      link: "https://github.com/settings/tokens",
      linkText: "GitHub에서 토큰 생성하기",
      required: true
    },
    {
      name: "Gemini API Key",
      description: "AI 코드 생성을 위해 필요합니다.",
      link: "https://aistudio.google.com/app/apikey",
      linkText: "Google AI Studio에서 키 생성하기",
      required: true
    },
    {
      name: "Vercel Token",
      description: "자동 배포를 위해 필요합니다. (선택사항)",
      link: "https://vercel.com/account/tokens",
      linkText: "Vercel에서 토큰 생성하기",
      required: false
    },
    {
      name: "Supabase Token",
      description: "백엔드 기능 자동 설정을 위해 필요합니다. (선택사항)",
      link: "https://supabase.com/dashboard/account/tokens",
      linkText: "Supabase에서 토큰 생성하기",
      required: false
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API 설정
          </DialogTitle>
          <DialogDescription>
            웹사이트 생성을 위해 필요한 API 키들을 설정해주세요. 
            모든 키는 브라우저에만 저장되며 외부로 전송되지 않습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* API 키 가이드 */}
          <div className="grid gap-4">
            {apiKeyGuides.map((guide) => (
              <Card key={guide.name} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium flex items-center gap-2">
                      {guide.name}
                      {guide.required && <span className="text-red-500 text-sm">*</span>}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(guide.link, '_blank')}
                    className="ml-4"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {guide.linkText}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* GitHub Token */}
          <div className="space-y-2">
            <Label htmlFor="github-token" className="flex items-center gap-2">
              GitHub Token <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="github-token"
                type={showGithubToken ? "text" : "password"}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowGithubToken(!showGithubToken)}
              >
                {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <Label htmlFor="gemini-key" className="flex items-center gap-2">
              Gemini API Key <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showGeminiKey ? "text" : "password"}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
              >
                {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Vercel Token */}
          <div className="space-y-2">
            <Label htmlFor="vercel-token">Vercel Token (선택사항)</Label>
            <div className="relative">
              <Input
                id="vercel-token"
                type={showVercelToken ? "text" : "password"}
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowVercelToken(!showVercelToken)}
              >
                {showVercelToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Supabase Token */}
          <div className="space-y-2">
            <Label htmlFor="supabase-token">Supabase Token (선택사항)</Label>
            <div className="relative">
              <Input
                id="supabase-token"
                type={showSupabaseToken ? "text" : "password"}
                value={supabaseToken}
                onChange={(e) => setSupabaseToken(e.target.value)}
                placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSupabaseToken(!showSupabaseToken)}
              >
                {showSupabaseToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!githubToken || !geminiApiKey}
            >
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
