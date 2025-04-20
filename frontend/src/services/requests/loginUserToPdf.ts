import { urls } from "@/constants";
import axiosInstance from "../axiosInstance";

export const loginUserToPdf = async (loginData: { identifier: string; signedData: any; jwt?: any }) => {
    try {
        const { data } = await axiosInstance.post(`${urls.pdfApiUrl}/auth/local`, {
            ...loginData,
        });
        return data;
    } catch (error) {
        console.error(error);
    }
};