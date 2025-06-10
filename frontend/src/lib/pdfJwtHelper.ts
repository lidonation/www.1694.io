import { saveDataInSession } from './utils';

export async function setUpPdfJwt(userResponse: any) {
  try {
    if (!userResponse) {
      throw new Error('User response is undefined');
    }
    saveDataInSession('pdfUserJwt', userResponse?.jwt);
    saveDataInSession('pdfUserRefreshToken', userResponse?.refreshToken);
  } catch (error) {
    console.error(error);
  }
}
