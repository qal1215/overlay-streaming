export type DonationProvider = "sepay" | "paypal" | "stripe" | "crypto";

export type DonationEvent = {
  id: string; // Internal platform event ID
  creatorId: string;
  
  provider: DonationProvider;
  providerTransactionId: string;
  
  amount: number;
  currency: string;
  
  donorName?: string;
  message?: string;
  paymentReference?: string;
  
  occurredAt: string;
};
