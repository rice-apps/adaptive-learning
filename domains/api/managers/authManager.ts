import authDAL from "../dals/authDal";

async function getUser() {
  return await authDAL.getUser();
}

export default {
  getUser,
};
