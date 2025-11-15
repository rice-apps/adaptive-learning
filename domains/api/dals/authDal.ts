import {createClient} from "@/lib/supabase/server";
import {UserRole} from "@/domains/auth/types";

export async function signup(email: string, password: string, role: UserRole) {
  const supabase = await createClient();

  const {data, error} = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: "/auth/verify",
      data: {
        role: role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserId() {
  const supabase = await createClient();
  const {
    data: {user},
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error(error?.message || "User not found");
  }

  return user.id;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: {user},
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error(error?.message || "User not found");
  }

  return user;
}

export default {
  signup,
  getUserId,
  getUser,
};
