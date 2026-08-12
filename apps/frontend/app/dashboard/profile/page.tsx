"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { membershipApi } from "../../lib/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      membershipApi
        .getDashboard(token)
        .then((data: any) => setProfile(data.profile))
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  const fields = [
    { icon: User, label: "Full Name", value: profile?.fullName },
    { icon: Phone, label: "Mobile Number", value: profile?.mobileNumber },
    { icon: Mail, label: "Email", value: profile?.email || "Not provided" },
    {
      icon: MapPin,
      label: "Address",
      value: profile?.permanentAddress || "Not provided",
    },
    {
      icon: Shield,
      label: "KYC Status",
      value: profile?.isKycVerified ? "Verified" : "Pending",
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "—",
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white">My Profile</h1>
        <p className="text-neutral-400 text-sm mt-0.5">
          Manage your personal information
        </p>
      </div>
      <div className="bg-[#0c1425] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center gap-4 px-6 py-4">
            <field.icon size={18} className="text-neutral-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
                {field.label}
              </p>
              <p className="text-white text-sm mt-0.5 truncate">
                {field.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-neutral-600 text-xs text-center">
        To update your information, please contact ATB support at 01711-993597
      </p>
    </div>
  );
}
