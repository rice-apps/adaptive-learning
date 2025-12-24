import {UserRole} from "@/domains/auth/types";
import {createClient} from "@/lib/supabase/server";
import authDAL from "./authDal";

async function insertUserRole(role: UserRole) {
  const supabase = await createClient();
  const userId = await authDAL.getUserId();
  const {data, error} = await supabase
    .from("user_role")
    .insert([{user_id: userId, role: role}])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  insertUserRole,
};
