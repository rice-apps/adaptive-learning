import {createClient} from "@/lib/supabase/server";
import authDAL from "./authDal";

async function insertEducator(email: string) {
  const supabase = await createClient();
  const userId = await authDAL.getUserId();

  const {data, error} = await supabase
    .from("Educators")
    .insert([{id: userId, email: email}])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  insertEducator,
};
