import { CreatePaymentInput, PaymentIntent, PaymentProvider } from "./PaymentProvider";

export class SePayProvider implements PaymentProvider {
  async createPaymentIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    const { bank, accountNumber, accountName } = input.paymentAccount;
    
    // Generate VietQR string
    const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bank}&amount=${input.amount}&des=${input.reference}`;

    return {
      provider: "sepay",
      instructions: {
        qrUrl,
        accountNumber,
        accountName: accountName || "",
        bank,
        content: input.reference,
      }
    };
  }
}
