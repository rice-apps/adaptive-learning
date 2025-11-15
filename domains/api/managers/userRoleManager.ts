import userRoleDAL from "../dals/userRoleDal";
import {UserRole} from "@/domains/auth/types";

async function insertUserRole(role: UserRole) {
  return await userRoleDAL.insertUserRole(role);
}

export default {
  insertUserRole,
};
