import { CreatePaymentInput, PaymentIntent, PaymentProvider } from "./PaymentProvider";

// For MVP, we'll use a static test account
const STATIC_BANK_ID = "970422"; // MBBank
const STATIC_ACCOUNT_NUMBER = "123456789";
const STATIC_ACCOUNT_NAME = "QAL TEST";

export class SePayProvider implements PaymentProvider {
  async createPaymentIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    // Generate VietQR string
    // Format: https://api.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.jpg?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<ACCOUNT_NAME>
    // For now, we'll return a structured object that the frontend can use to generate the QR or display info.
    const qrUrl = `https://qr.sepay.vn/img?acc=${STATIC_ACCOUNT_NUMBER}&bank=${STATIC_BANK_ID}&amount=${input.amount}&des=${input.reference}`;

    return {
      provider: "sepay",
      instructions: {
        qrUrl,
        accountNumber: STATIC_ACCOUNT_NUMBER,
        accountName: STATIC_ACCOUNT_NAME,
        bank: STATIC_BANK_ID,
        content: input.reference,
      }
    };
  }
}
