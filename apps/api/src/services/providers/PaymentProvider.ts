export interface CreatePaymentInput {
  donationId: string;
  amount: number;
  currency: string;
  reference: string;
}

export interface PaymentIntent {
  provider: string;
  instructions: any; // specific to provider (e.g., VietQR details)
}

export interface PaymentProvider {
  createPaymentIntent(input: CreatePaymentInput): Promise<PaymentIntent>;
}
