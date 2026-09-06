import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { API_URL } from "../../../api/client";
import { Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/donate/$creatorId/payment/$donationId")({
  component: PaymentPollingPage,
});

function PaymentPollingPage() {
  const { creatorId, donationId } = Route.useParams();
  const navigate = useNavigate({
    from: "/donate/$creatorId/payment/$donationId",
  });

  const [pageInfo, setPageInfo] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [donationStatus, setDonationStatus] = useState<string>("PENDING");

  useEffect(() => {
    fetch(`${API_URL}/api/public/creators/${creatorId}/donation-page`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPageInfo(data);
      })
      .catch((e) => setError(e.message));
  }, [creatorId]);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/public/donations/${donationId}`,
        );
        const data = await res.json();

        if (data.error) throw new Error(data.error);
        setDonationStatus(data.status);
        setPayment(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDonation();
  }, [donationId]);

  useEffect(() => {
    if (donationStatus !== "PENDING" || !payment) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/public/donations/${donationId}`,
        );
        const data = await res.json();

        if (data.status === "PAID") {
          setDonationStatus("PAID");
          clearInterval(interval);
        } else if (data.status === "EXPIRED") {
          setDonationStatus("EXPIRED");
          clearInterval(interval);
        } else if (data.status === "FAILED") {
          setDonationStatus("FAILED");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000); // Poll every 3 seconds

    const timeout = setTimeout(
      () => {
        clearInterval(interval);
        if (donationStatus === "PENDING") setDonationStatus("EXPIRED");
      },
      30 * 60 * 1000,
    );

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [donationStatus, payment, donationId]);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  if (donationStatus === "PAID") {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface/80 border border-green-500/30 rounded-2xl p-8 backdrop-blur-xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Donation Sent!
            </h1>
            <p className="text-text-muted">
              Thank you for supporting{" "}
              {pageInfo?.creator?.displayName || creatorId}
            </p>
          </div>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            {payment?.amount?.toLocaleString("vi-VN")} ₫
          </div>
          <Link
            to="/donate/$creatorId"
            params={{ creatorId }}
            className="block w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all mt-4"
          >
            Donate Again
          </Link>
        </div>
      </div>
    );
  }

  if (donationStatus === "EXPIRED") {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <AlertCircle size={40} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Expired
            </h1>
            <p className="text-text-muted">
              This donation request has timed out.
            </p>
          </div>
          <Link
            to="/donate/$creatorId"
            params={{ creatorId }}
            className="block w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all mt-4"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (donationStatus === "FAILED") {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface/80 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <AlertCircle size={40} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Failed
            </h1>
            <p className="text-text-muted">
              There was an issue processing your payment.
            </p>
          </div>
          <Link
            to="/donate/$creatorId"
            params={{ creatorId }}
            className="block w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all mt-4"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (donationStatus === "PENDING" && payment?.paymentInstructions) {
    const { paymentInstructions } = payment;
    return (
      <div className="min-h-screen w-full bg-background py-12 px-4 relative overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-md mx-auto relative z-10">
          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 text-center border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                Complete Payment
              </h2>
              <p className="text-text-muted mt-1 text-sm">
                Scan with your banking app
              </p>
            </div>

            <div className="p-8 flex justify-center bg-white">
              <img
                src={paymentInstructions.qrUrl}
                alt="VietQR Code"
                className="w-64 h-64 object-contain"
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-text-muted">Amount</span>
                <span className="text-white font-bold text-lg">
                  {payment.amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-text-muted">Bank</span>
                <span className="text-white font-medium">
                  {paymentInstructions.bank}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-text-muted">Account</span>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {paymentInstructions.accountNumber}
                  </div>
                  <div className="text-xs text-text-muted uppercase">
                    {paymentInstructions.accountName}
                  </div>
                </div>
              </div>
              <div className="flex flex-col py-2 border-b border-white/5">
                <span className="text-text-muted mb-1 text-sm">
                  Transfer Description (Important)
                </span>
                <div className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-white/5">
                  <span className="text-white font-mono text-lg font-bold tracking-wider">
                    {paymentInstructions.content}
                  </span>
                  <button
                    className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                    onClick={() =>
                      navigator.clipboard.writeText(paymentInstructions.content)
                    }
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center space-x-3 text-blue-400 bg-blue-500/10 py-3 rounded-lg border border-blue-500/20">
                <Loader2 size={18} className="animate-spin" />
                <span className="font-medium">Waiting for payment...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while waiting for payment instructions
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
    </div>
  );
}
