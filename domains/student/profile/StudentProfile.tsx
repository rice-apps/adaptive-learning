// import { Card, CardContent } from "@/components/ui/card";

// export default function StudentProfileClient() {
//     return (
//         <div>
//             <Card>
//                 <CardContent>
//                     <p>Your name</p>
//                 </CardContent>
//             </Card>
//             <Card>
//                 <CardContent>
//                     <p>Your career interests</p>
//                 </CardContent>
//             </Card>
//             <Card>
//                 <CardContent>
//                     <p>Your goals</p>
//                 </CardContent>
//             </Card>
//             <Card>
//                 <CardContent>
//                     <p>Topics of interest</p>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }


"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function StudentProfileClient() {
  // Hard-coded student data
  const student = {
    name: "Joohye Lee",
    goals: "Improve programming skills and build full-stack projects",
    subjectsOfInterest: ["Computer Science", "Art", "Mathematics"],
    careerInterests: ["Software Engineering", "Data Science", "Creative Coding"],
    profilePic: "https://github.com/shadcn.png", // placeholder image
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Card className="mb-6">
          <CardContent>
            <div>
              <h2 className="text-xl font-bold">Your Profile</h2>
            </div>
          </CardContent>
        </Card>
      {/* Profile header with avatar */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={student.profilePic} />
          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">{student.name}</h1>
      </div>

      {/* Goals card */}
      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{student.goals}</p>
        </CardContent>
      </Card>

      {/* Subjects of Interest */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects of Interest</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            {student.subjectsOfInterest.map((subject) => (
              <li key={subject}>{subject}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Career Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Career Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            {student.careerInterests.map((career) => (
              <li key={career}>{career}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
