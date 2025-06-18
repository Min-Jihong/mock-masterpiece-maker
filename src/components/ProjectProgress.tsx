
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, ExternalLink, Github } from "lucide-react";
import { ProjectGenerationStep } from "@/services/projectGenerator";

interface ProjectProgressProps {
  steps: ProjectGenerationStep[];
  isGenerating: boolean;
  repoUrl?: string;
}

const ProjectProgress = ({ steps, isGenerating, repoUrl }: ProjectProgressProps) => {
  const getStepIcon = (status: ProjectGenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'progress':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadge = (status: ProjectGenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">완료</Badge>;
      case 'progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">진행중</Badge>;
      case 'error':
        return <Badge variant="destructive">오류</Badge>;
      default:
        return <Badge variant="secondary">대기중</Badge>;
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>프로젝트 생성 진행상황</span>
          <span className="text-sm font-normal text-gray-500">
            {completedSteps}/{totalSteps} 완료
          </span>
        </CardTitle>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
              step.status === 'progress' ? 'bg-blue-50 border-blue-200' :
              step.status === 'completed' ? 'bg-green-50 border-green-200' :
              step.status === 'error' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900">{step.title}</h3>
                {getStepBadge(step.status)}
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
              {step.details && (
                <p className="text-xs text-gray-500 mt-1">{step.details}</p>
              )}
            </div>
            
            <div className="flex-shrink-0 text-sm text-gray-400 font-mono">
              {index + 1}/{totalSteps}
            </div>
          </div>
        ))}

        {/* 완료된 경우 결과 표시 */}
        {!isGenerating && repoUrl && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">🎉 프로젝트 생성 완료!</h3>
            <p className="text-sm text-green-700 mb-4">
              웹사이트가 성공적으로 생성되어 GitHub에 푸시되었습니다.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(repoUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub에서 보기
              </Button>
              <Button 
                size="sm"
                onClick={() => window.open(`${repoUrl.replace('github.com', 'github.dev')}`, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                온라인 에디터에서 편집
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectProgress;
