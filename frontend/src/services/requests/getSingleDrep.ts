import axiosInstance from "../axiosInstance";


export const getSingleDRep = async (noteid:number) => {
  const response = await axiosInstance.get(`/api/notes/${noteid}/single`);
  return response.data;
};
