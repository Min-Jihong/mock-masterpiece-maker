
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Lightbulb } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
}

const PromptInput = ({ onSubmit }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    try {
      await onSubmit(prompt);
    } finally {
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    "개인 포트폴리오 웹사이트를 만들어주세요. 프로젝트 소개, 경력, 연락처 페이지가 필요합니다.",
    "온라인 쇼핑몰을 만들어주세요. 상품 목록, 상품 상세, 장바구니, 결제 페이지가 필요합니다.",
    "블로그 웹사이트를 만들어주세요. 글 목록, 글 상세보기, 카테고리, 검색 기능이 필요합니다.",
    "회사 소개 웹사이트를 만들어주세요. 메인 페이지, 서비스 소개, 팀 소개, 연락처가 필요합니다."
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          placeholder="어떤 웹사이트를 만들고 싶은지 자세히 설명해주세요. 예: '개인 포트폴리오 사이트를 만들어주세요. 프로젝트 소개, 경력, 연락처 페이지가 필요하고 다크모드도 지원했으면 좋겠어요.'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-32 resize-none text-base"
          disabled={isLoading}
        />
        
        <Button 
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              생성 중...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              웹사이트 생성하기
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          예시 프롬프트
        </div>
        <div className="grid gap-2">
          {examplePrompts.map((example, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setPrompt(example)}
            >
              <CardContent className="p-3">
                <p className="text-sm text-gray-600">{example}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
