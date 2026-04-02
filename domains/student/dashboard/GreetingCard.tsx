import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface SubjectScore {
  subject: string;
  score: number;
  maxScore: number;
}

interface GreetingCardProps {
  student: string | null;
  subjectScores?: SubjectScore[];
}

function ReadinessDial({
  subject,
  score,
  maxScore,
}: {
  subject: string;
  score: number;
  maxScore: number;
}) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const proficiency =
    pct >= 0.8
      ? "Advanced"
      : pct >= 0.6
        ? "Proficient"
        : pct >= 0.4
          ? "Developing"
          : "Beginning";

  const proficiencyColor =
    pct >= 0.8
      ? "text-emerald-600 bg-emerald-50"
      : pct >= 0.6
        ? "text-lime-700 bg-lime-50"
        : pct >= 0.4
          ? "text-amber-700 bg-amber-50"
          : "text-red-600 bg-red-50";

  const strokeColor =
    pct >= 0.8
      ? "#059669"
      : pct >= 0.6
        ? "#65a30d"
        : pct >= 0.4
          ? "#d97706"
          : "#dc2626";

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="flex flex-col items-center py-6 px-4 gap-3">
        <p className="text-base font-semibold text-gray-800 tracking-tight">
          {subject}
        </p>

        <div className="relative w-28 h-28">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 leading-none">
              {score}
            </span>
            <span className="text-xs text-gray-400">/{maxScore}</span>
          </div>
        </div>

        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${proficiencyColor}`}
        >
          {proficiency}
        </span>
      </CardContent>
    </Card>
  );
}

export default function GreetingCard({
  student,
  subjectScores = [],
}: GreetingCardProps) {
  return (
    <Card className="mb-6 sm:mb-8">
      <CardContent className="p-4 sm:p-6">
        {/* Greeting row */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="text-lg sm:text-xl">
              {student?.charAt(0).toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hello {student || "Student"}!
          </h1>
        </div>

        {/* Readiness dials */}
        {subjectScores.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {subjectScores.map((s) => (
              <ReadinessDial
                key={s.subject}
                subject={s.subject}
                score={s.score}
                maxScore={s.maxScore}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}