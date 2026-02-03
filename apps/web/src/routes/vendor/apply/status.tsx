import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, XCircle, ArrowRight } from "lucide-react";
import type { VendorApplicationStatusResponse } from "@kineDao.com/api-types/vendor";
import type { Language } from "@/lib/i18n/translations";

export const Route = createFileRoute("/vendor/apply/status")({
  component: ApplicationStatusPage,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/vendor/apply/status" },
      });
    }
    return { session };
  },
  loader: async (): Promise<{ status: VendorApplicationStatusResponse | null }> => {
    const response = await api.vendor.application.status.$get();

    if (response.ok) {
      const data = await response.json();

      // If approved, redirect to vendor dashboard
      if (data.application?.status === "approved") {
        throw redirect({
          to: "/dashboard", // TODO: Change to /vendor/dashboard when implemented
        });
      }

      // If no application, redirect to apply page
      if (!data.exists) {
        throw redirect({
          to: "/vendor/apply",
        });
      }

      return { status: data };
    }

    throw redirect({
      to: "/vendor/apply",
    });
  },
});

interface PendingLabels {
  title: string;
  description: string;
  whatNext: string;
  step1: string;
  step2: string;
  step3: string;
  timeline: string;
  shopName: string;
  submittedOn: string;
}

interface RejectedLabels {
  title: string;
  description: string;
  reason: string;
  reapply: string;
  reapplyButton: string;
}

interface CommonLabels {
  backToHome: string;
  contactSupport: string;
}

interface StatusLabels {
  pending: PendingLabels;
  rejected: RejectedLabels;
  common: CommonLabels;
}

function ApplicationStatusPage() {
  const { language } = useLanguage();
  const { status } = Route.useLoaderData();

  const application = status?.application;
  const isPending = application?.status === "pending";
  const isRejected = application?.status === "rejected";

  const t: Record<Language, StatusLabels> = {
    en: {
      pending: {
        title: "Application Under Review",
        description:
          "Thank you for applying to become a vendor on KineDao! Our team is reviewing your application.",
        whatNext: "What happens next?",
        step1: "Our team will verify your documents and business information",
        step2: "You will receive an email notification once your application is reviewed",
        step3: "If approved, you can start setting up your shop and listing products",
        timeline: "Review typically takes 2-3 business days",
        shopName: "Shop Name",
        submittedOn: "Submitted on",
      },
      rejected: {
        title: "Application Not Approved",
        description:
          "Unfortunately, your vendor application was not approved at this time.",
        reason: "Reason",
        reapply: "You can update your information and reapply",
        reapplyButton: "Update & Reapply",
      },
      common: {
        backToHome: "Back to Home",
        contactSupport: "Contact Support",
      },
    },
    bn: {
      pending: {
        title: "আবেদন পর্যালোচনাধীন",
        description:
          "কিনেদাওতে বিক্রেতা হওয়ার জন্য আবেদন করার জন্য ধন্যবাদ! আমাদের টিম আপনার আবেদন পর্যালোচনা করছে।",
        whatNext: "পরবর্তীতে কী হবে?",
        step1: "আমাদের টিম আপনার ডকুমেন্ট এবং ব্যবসার তথ্য যাচাই করবে",
        step2: "আপনার আবেদন পর্যালোচনা হলে আপনি একটি ইমেল বিজ্ঞপ্তি পাবেন",
        step3: "অনুমোদিত হলে, আপনি আপনার দোকান সেটআপ করতে এবং পণ্য তালিকাভুক্ত করতে পারবেন",
        timeline: "পর্যালোচনা সাধারণত ২-৩ কার্যদিবস সময় নেয়",
        shopName: "দোকানের নাম",
        submittedOn: "জমা দেওয়া হয়েছে",
      },
      rejected: {
        title: "আবেদন অনুমোদিত হয়নি",
        description: "দুর্ভাগ্যবশত, আপনার বিক্রেতা আবেদন এই সময়ে অনুমোদিত হয়নি।",
        reason: "কারণ",
        reapply: "আপনি আপনার তথ্য আপডেট করে পুনরায় আবেদন করতে পারেন",
        reapplyButton: "আপডেট করুন এবং পুনরায় আবেদন করুন",
      },
      common: {
        backToHome: "হোমে ফিরে যান",
        contactSupport: "সাপোর্টে যোগাযোগ করুন",
      },
    },
  };

  const labels = t[language];

  if (isPending) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl">{labels.pending.title}</CardTitle>
            <CardDescription className="text-base">{labels.pending.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Application Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{labels.pending.shopName}</span>
                <span className="text-sm font-medium">{application?.shopNameEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{labels.pending.submittedOn}</span>
                <span className="text-sm font-medium">
                  {application?.createdAt
                    ? new Date(application.createdAt).toLocaleDateString(
                        language === "bn" ? "bn-BD" : "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )
                    : "-"}
                </span>
              </div>
            </div>

            {/* What happens next */}
            <div>
              <h3 className="font-medium mb-3">{labels.pending.whatNext}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{labels.pending.step1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{labels.pending.step2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{labels.pending.step3}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">{labels.pending.timeline}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">{labels.common.backToHome}</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/contact">{labels.common.contactSupport}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">{labels.rejected.title}</CardTitle>
            <CardDescription className="text-base">{labels.rejected.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rejection reason if provided */}
            {application?.reviewNotes && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  {labels.rejected.reason}:
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">{application.reviewNotes}</p>
              </div>
            )}

            {/* Reapply info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{labels.rejected.reapply}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">{labels.common.backToHome}</Link>
              </Button>
              <Button asChild className="flex-1 gap-2">
                <Link to="/vendor/apply">
                  {labels.rejected.reapplyButton}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback - shouldn't reach here normally
  return null;
}
