import educatorDAL from "../dals/educatorDal";
import authManager from "./authManager";
import userRoleManager from "./userRoleManager";
import {UserRole} from "@/domains/auth/types";

async function addEducator() {
  const user = await authManager.getUser();
  const email = user.email;
  if (!email) {
    throw new Error("Email not found");
  }

  // Insert user role first
  await userRoleManager.insertUserRole(UserRole.INSTRUCTOR);

  // Then insert educator
  return await educatorDAL.insertEducator(email);
}

export default {
  addEducator,
};
