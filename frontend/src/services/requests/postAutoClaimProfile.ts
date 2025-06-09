import axiosInstance from "../axiosInstance";

interface AutoClaimRequest {
    stakeKey: string;
    signature: string;
    signatureKey: string;
}

interface AutoClaimResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: any;
}
export const postAutoClaimProfile = async (claimDto: AutoClaimRequest): Promise<AutoClaimResponse> => {
    try {
        const response = await axiosInstance.post<AutoClaimResponse>(`dreps/${claimDto.stakeKey}/claim-profile`, {
            signature: claimDto.signature,
            signatureKey: claimDto.signatureKey,
        });
        return response.data;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            error: errorMessage,
            message: "Failed to auto-claim profile",
        };
    }
};