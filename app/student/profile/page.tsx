import StudentProfile from "@/domains/student/profile/StudentProfile";
import { redirect } from "next/navigation";

export default async function StudentProfile() {
    return (
        <StudentProfile/>
    );
}