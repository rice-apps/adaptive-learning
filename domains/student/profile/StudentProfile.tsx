// "use client";

// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Label } from "@/components/ui/label";
// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";


// export default function StudentProfileClient() {
//   // Hard-coded student data
//   const [formData, setFormData] = useState({
//     firstname: "",
//     lastname: "",
//     plan: "",
//     grade_reading: "",
//     grade_math: "",
//     current_level: "",
//     career_interests: "",
//     goals: "",
//   });
//   useEffect(() => {
//     async function loadProfile() {
//         const res = await fetch("/api/student/onboarding", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//           },
//         });
//         if (!res.ok) return;

//         const data = await res.json();
//         setFormData({
//           firstname: data.firstname || "",
//           lastname: data.lastname || "",
//           plan: data.plan || "",
//           grade_reading: data.grade_reading || "",
//           grade_math: data.grade_math || "",
//           current_level: data.current_level || "",
//           career_interests: data.career_interests || "",
//           goals: data.goals || "",
//         });
//       }
//       loadProfile();
//       console.log("completed fetch");
//     }, []);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await fetch("/api/student/onboarding", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to create profile");
//       }

//       // Redirect to dashboard
//       router.push(data.redirectTo || "/student/dashboard");
//       router.refresh(); // Refresh to update any server components
//     } catch (error) {
//       console.error("Error:", error);
//       setError(error instanceof Error ? error.message : "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-6">
//       <h2 className="text-xl font-bold">Your Profile</h2>
//       <Button onSubmit={handleSubmit}></Button>

//       <div className="space-y-6">
//         {/* Profile photo */}
//         <div className="flex flex-col items-center gap-3">
//           <Label className="text-base font-semibold">
//             Profile Photo <span className="text-gray-400">(optional)</span>
//           </Label>

//           <div className="relative">
//             {/* Avatar */}
//             <Avatar className="h-32 w-32 bg-gray-200 text-3xl">
//               {/* add uploaded image here */}
//               {/* <AvatarImage src={photoUrl} /> */}

//               <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold">
//                 {formData.firstname || formData.lastname
//                   ? `${formData.firstname?.[0]?.toUpperCase() ?? ""}${
//                       formData.lastname?.[0]?.toUpperCase() ?? ""
//                     }`
//                   : "?"}
//               </AvatarFallback>
//             </Avatar>

//             {/* Camera badge */}
//             <button
//               type="button"
//               onClick={() => document.getElementById("photo-upload")?.click()}
//               className="
//                 absolute
//                 bottom-1
//                 right-1
//                 h-10
//                 w-10
//                 rounded-full
//                 bg-lime-300
//                 flex
//                 items-center
//                 justify-center
//                 shadow
//                 hover:bg-lime-400
//                 transition
//               "
//             >
//               <Image
//                 src="/camera.png"
//                 alt="upload"
//                 width={18}
//                 height={18}
//                 className="object-contain"
//               />
//             </button>

//             {/* File input */}
//             <input
//               id="photo-upload"
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={(e) => {
//                 const file = e.target.files?.[0];
//                 if (file) {
//                   // TODO: handle upload later
//                   console.log(file);
//                 }
//               }}
//             />
//           </div>

//           <p className="text-sm text-gray-400">Help instructors recognize you.</p>
//         </div>

//         <Input
//           placeholder="First name"
//           value={formData.firstname}
//           onChange={(e) =>
//             setFormData({ ...formData, firstname: e.target.value })
//           }
//           required
//         />

//         <Input
//           placeholder="Last name"
//           value={formData.lastname}
//           onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
//           required
//         />
//       </div>

//       <div className="space-y-6">
//         <h3 className="text-xl font-bold">What are your career interests?</h3>
//         <p className="text-gray-500">
//           Select areas you’re curious about or want to explore.
//         </p>

//         <Textarea
//           placeholder="Tell us more about your interests..."
//           className="min-h-[150px]"
//           value={formData.career_interests}
//           onChange={(e) =>
//             setFormData({ ...formData, career_interests: e.target.value })
//           }
//         />
//       </div>

//       <div className="space-y-6">
//         <h3 className="text-xl font-bold">What are your goals?</h3>
//         <p className="text-gray-500">
//           What do you hope to achieve with Eight Million Stories?
//         </p>

//         <div className="bg-lime-100 border border-lime-300 rounded-lg p-4 text-sm">
//           <p className="font-medium mb-2">Think about:</p>
//           <ul className="list-disc list-inside">
//             <li>Education milestones</li>
//             <li>Skills you want to learn</li>
//             <li>Jobs you’re interested in</li>
//           </ul>
//         </div>

//         <Textarea
//           placeholder="e.g. I want to earn my GED, improve my writing..."
//           className="min-h-[180px]"
//           value={formData.goals}
//           onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
//           required
//         />
//       </div>
//     </div>
//   );
// }


"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StudentProfileClient() {
  const [formData, setFormData] = useState<{
    firstname: string;
    lastname: string;
    plan: string;
    grade_reading: string;
    grade_math: string;
    current_level: string;
    career_interests: string;
    goals: string;
  } | null>(null); // start as null to indicate "not loaded yet"

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/student/onboarding", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();

        // ensure all fields are defined
        setFormData({
          firstname: data.firstname || "a",
          lastname: data.lastname || "a",
          plan: data.plan || "a",
          grade_reading: data.grade_reading || "a",
          grade_math: data.grade_math || "a",
          current_level: data.current_level || "a",
          career_interests: data.career_interests || "a",
          goals: data.goals || "a",
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return; // safety check

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to save profile");

      router.push(data.redirectTo || "/student/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading or error before rendering the form
  if (!formData) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold">Your Profile</h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Profile photo */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-base font-semibold">
              Profile Photo <span className="text-gray-400">(optional)</span>
            </Label>

            <div className="relative">
              <Avatar className="h-32 w-32 bg-gray-200 text-3xl">
                <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold">
                  {formData.firstname?.[0].toUpperCase() || ""}{formData.lastname?.[0].toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => document.getElementById("photo-upload")?.click()}
                className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-lime-300 flex items-center justify-center shadow hover:bg-lime-400 transition"
              >
                <Image src="/camera.png" alt="upload" width={18} height={18} className="object-contain" />
              </button>

              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) console.log(file);
                }}
              />
            </div>

            <p className="text-sm text-gray-400">Help instructors recognize you.</p>
          </div>

          <Input
            placeholder="First name"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            required
          />

          <Input
            placeholder="Last name"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            required
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">What are your career interests?</h3>
          <Textarea
            placeholder="Tell us more about your interests..."
            className="min-h-[150px]"
            value={formData.career_interests}
            onChange={(e) => setFormData({ ...formData, career_interests: e.target.value })}
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">What are your goals?</h3>
          <Textarea
            placeholder="e.g. I want to earn my GED, improve my writing..."
            className="min-h-[180px]"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
