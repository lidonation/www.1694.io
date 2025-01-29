export class VerifyDRepSignatureDto {
    signatures:{
        vkey: string;
        signature: string;
    }
    address: string; //can be drep or stake or payment address
}