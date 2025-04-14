import { loginUserToPdf } from "@/services/requests/loginUserToPdf";
import { saveDataInSession, utf8ToHex } from "./utils";

export async function setUpPdfJwt(stakeKey: string, wallet: any) {
  try {
    const stakeKeyHash = stakeKey;
    const messageUtf = `To proceed, please sign this data to verify your identity. This ensures that the action is secure and confirms your identity.`;
    const messageHex = utf8ToHex(messageUtf);

    const signedData = await wallet?.cip95.signData(stakeKeyHash, messageHex);

    const userResponse = await loginUserToPdf({
      identifier: stakeKeyHash,
      signedData: signedData,
    });

    if (!userResponse) return;
    saveDataInSession('pdfUserJwt', userResponse?.jwt);
  } catch (error) {
    console.error(error);
  }
}
