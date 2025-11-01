import {UserRole} from "@/domains/auth/types";
import {createClient} from "@/lib/supabase/server";
import {getUserId} from "./authDal";

export async function insertRole(role: UserRole) {
  const supabase = await createClient();
  const userId = await getUserId();
  const {data, error} = await supabase
    .from("user_role")
    .insert([{userid: userId, role: role, onboarded: false}])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return "Role inserted successfully";
}
