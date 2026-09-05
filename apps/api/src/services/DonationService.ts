import { D1Database } from "@cloudflare/workers-types";
import { PaymentEvent, AlertEvent } from "@overlay/schema";

export class DonationService {
  constructor(private db: D1Database) {}

  async processPaymentEvent(event: PaymentEvent): Promise<AlertEvent | null> {
    // 1. Find donation
    const donation = await this.db.prepare(
      'SELECT * FROM donations WHERE payment_reference = ?'
    ).bind(event.referenceCode).first<any>();

    if (!donation) {
      console.log(`[DonationService] Donation not found for reference: ${event.referenceCode}`);
      return null;
    }

    // 2. Validate transfer type
    if (event.transferType !== 'in') {
      console.log(`[DonationService] Transfer type is not 'in'`);
      return null;
    }

    // 3. Validate amount
    if (donation.amount !== event.amount) {
      console.log(`[DonationService] Amount mismatch. Expected ${donation.amount}, got ${event.amount}`);
      return null;
    }

    // 4. Validate currency
    if (donation.currency !== event.currency) {
      console.log(`[DonationService] Currency mismatch. Expected ${donation.currency}, got ${event.currency}`);
      return null;
    }

    // 5. Atomic state change (enforce expires_at)
    const updateResult = await this.db.prepare(`
      UPDATE donations
      SET
        status = 'PAID',
        provider_transaction_id = ?,
        paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND status = 'PENDING'
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `).bind(event.transactionId, donation.id).run();

    // 6. Check affected rows (atomic transition protection)
    if (updateResult.meta.changes !== 1) {
      if (donation.status === 'PAID' && donation.provider_transaction_id === event.transactionId) {
        console.log(`[DonationService] Donation ${donation.id} already paid by this event. Emitting alert event for retry.`);
      } else {
        console.log(`[DonationService] Donation ${donation.id} transition failed (already paid, not PENDING, or expired).`);
        return null;
      }
    } else {
      console.log(`[DonationService] Successfully transitioned donation ${donation.id} to PAID.`);
    }

    // 7. Emit AlertEvent
    return {
      eventId: event.providerEventId,
      creatorId: donation.creator_id,
      source: event.provider,
      type: "donation",
      timestamp: Date.now(),
      actor: donation.donor_name ? { name: donation.donor_name } : undefined,
      donation: {
        amount: donation.amount.toString(),
        currency: donation.currency,
      },
      message: donation.message || undefined,
      metadata: {
        paymentReference: donation.payment_reference,
      }
    };
  }

  async createDonation(creatorId: string, amount: number, donorName?: string, message?: string) {
    const id = `don_${crypto.randomUUID()}`;
    const reference = `DONATE-${creatorId.substring(0,3).toUpperCase()}-${crypto.randomUUID().substring(0, 6).toUpperCase()}`;

    // Expire in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await this.db.prepare(`
      INSERT INTO donations (id, creator_id, donor_name, message, amount, currency, payment_provider, payment_reference, status, expires_at)
      VALUES (?, ?, ?, ?, ?, 'VND', 'sepay', ?, 'PENDING', ?)
    `).bind(id, creatorId, donorName || null, message || null, amount, reference, expiresAt).run();

    return {
      id,
      amount,
      currency: 'VND',
      paymentReference: reference,
      status: 'PENDING',
      expiresAt
    };
  }

  async getDonation(id: string) {
    const donation = await this.db.prepare('SELECT * FROM donations WHERE id = ?').bind(id).first<any>();
    if (!donation) return null;

    if (donation.status === 'PENDING' && donation.expires_at) {
      if (new Date() > new Date(donation.expires_at)) {
        await this.db.prepare("UPDATE donations SET status = 'EXPIRED' WHERE id = ? AND status = 'PENDING'").bind(id).run();
        donation.status = 'EXPIRED';
      }
    }
    return donation;
  }

  async getDonationByReference(reference: string) {
    return this.db.prepare('SELECT * FROM donations WHERE payment_reference = ?').bind(reference).first<any>();
  }
}
