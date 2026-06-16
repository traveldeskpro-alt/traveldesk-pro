"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import {
  Building2,
  CheckCircle,
  XCircle,
  Search,
  Activity,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  Save,
  MoreVertical,
} from "lucide-react";

type PlanId = "starter" | "professional" | "enterprise";

type AgencyRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  status: "active" | "trial" | "suspended";
  created_at: string;
};

type PlanRow = {
  id: PlanId;
  name: string;
  monthly_price: number;
  user_limit: number | null;
  booking_limit: number | null;
  features: string[];
  is_active: boolean;
};

type AuditLogRow = {
  id: string;
  created_at: string;
  admin_email: string;
  action: string;
  target_agency_id: string | null;
  target_agency_name: string | null;
  notes: string | null;
};

type ModalState =
  | { type: "view"; agency: AgencyRow }
  | { type: "edit"; agency: AgencyRow }
  | { type: "changePlan"; agency: AgencyRow }
  | { type: "confirmStatus"; agency: AgencyRow; status: "suspended" }
  | { type: "delete"; agency: AgencyRow }
  | { type: "editPlan"; plan: PlanRow }
  | null;

const fallbackPlans: PlanRow[] = SUBSCRIPTION_PLANS.map((plan) => ({
  id: plan.id as PlanId,
  name: plan.name,
  monthly_price: plan.priceOmr,
  user_limit: plan.maxUsers,
  booking_limit: plan.maxBookings,
  features: plan.features,
  is_active: plan.isActive,
}));

const planColors: Record<PlanId, string> = {
  starter: "bg-slate-50",
  professional: "bg-blue-50",
  enterprise: "bg-purple-50",
};

export default function AdminPage() {
  const { user, agency } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("agencies");
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>(fallbackPlans);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuAgencyId, setOpenMenuAgencyId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [agencyForm, setAgencyForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active" as AgencyRow["status"],
  });
  const [agencyPlan, setAgencyPlan] = useState<PlanId>("starter");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [planForm, setPlanForm] = useState({
    name: "",
    monthlyPrice: "",
    userLimit: "",
    bookingLimit: "",
    features: "",
  });

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (user && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [isSuperAdmin, router, user]);

  const loadAdminData = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      setAuditLoading(false);
      setPlansLoading(false);
      return;
    }

    setLoading(true);
    setAuditLoading(true);
    setPlansLoading(true);
    setLoadError(null);

    if (!supabase) {
      setAgencies(agency ? [{
        id: agency.id,
        name: agency.name,
        email: agency.email,
        phone: agency.phone,
        plan: agency.plan as PlanId,
        status: agency.status as AgencyRow["status"],
        created_at: agency.createdAt,
      }] : []);
      setPlans(fallbackPlans);
      setAuditLogs([]);
      setLoading(false);
      setAuditLoading(false);
      setPlansLoading(false);
      return;
    }

    const [agenciesResult, plansResult, auditResult] = await Promise.all([
      supabase
        .from("agencies")
        .select("id,name,email,phone,plan,status,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("subscription_plans")
        .select("id,name,monthly_price,user_limit,booking_limit,features,is_active")
        .order("monthly_price", { ascending: true }),
      supabase
        .from("audit_logs")
        .select("id,created_at,admin_email,action,target_agency_id,target_agency_name,notes")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const errors = [agenciesResult.error, plansResult.error, auditResult.error]
      .filter(Boolean)
      .map((error) => error?.message);

    if (errors.length) setLoadError(errors.join(" "));
    setAgencies(agenciesResult.error ? [] : (agenciesResult.data || []) as AgencyRow[]);
    setPlans(plansResult.error ? fallbackPlans : (plansResult.data || []) as PlanRow[]);
    setAuditLogs(auditResult.error ? [] : (auditResult.data || []) as AuditLogRow[]);
    setLoading(false);
    setAuditLoading(false);
    setPlansLoading(false);
  }, [agency, isSuperAdmin]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-navy">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const filtered = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalAgencies = filtered.length;
  const activeAgencies = filtered.filter((a) => a.status === "active").length;
  const trialAgencies = filtered.filter((a) => a.status === "trial").length;
  const suspendedAgencies = filtered.filter((a) => a.status === "suspended").length;

  const closeModal = () => {
    setModal(null);
    setActionError(null);
    setDeleteConfirmation("");
  };

  const openModal = (nextModal: ModalState) => {
    setOpenMenuAgencyId(null);
    setActionError(null);
    setDeleteConfirmation("");
    setModal(nextModal);
  };

  const getActionErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (err && typeof err === "object") {
      const record = err as Record<string, unknown>;
      const parts = [record.message, record.details, record.hint, record.code]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
      if (parts.length) return parts.join(" ");
    }
    return "Admin action failed.";
  };

  const runAdminAction = async (action: () => Promise<void>, success: string) => {
    setActionError(null);
    setActionMessage(null);
    if (!isSuperAdmin || !supabase) {
      setActionError("SaaS Admin actions require a super_admin session and Supabase connection.");
      return;
    }

    setActionLoading(true);
    try {
      await action();
      await loadAdminData();
      setActionMessage(success);
      setTimeout(() => setActionMessage(null), 2500);
      closeModal();
    } catch (err) {
      setActionError(getActionErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditAgency = (selected: AgencyRow) => {
    setAgencyForm({
      name: selected.name,
      email: selected.email,
      phone: selected.phone || "",
      status: selected.status,
    });
    openModal({ type: "edit", agency: selected });
  };

  const openChangePlan = (selected: AgencyRow) => {
    setAgencyPlan(selected.plan);
    openModal({ type: "changePlan", agency: selected });
  };

  const openEditPlan = (selected: PlanRow) => {
    setPlanForm({
      name: selected.name,
      monthlyPrice: String(selected.monthly_price),
      userLimit: selected.user_limit === null ? "" : String(selected.user_limit),
      bookingLimit: selected.booking_limit === null ? "" : String(selected.booking_limit),
      features: selected.features.join("\n"),
    });
    openModal({ type: "editPlan", plan: selected });
  };

  const parseLimit = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("Limits must be blank or a non-negative number.");
    }
    return Math.floor(parsed);
  };

  const updateAgency = async () => {
    if (modal?.type !== "edit") return;
    await runAdminAction(async () => {
      const { error } = await supabase!.rpc("saas_admin_update_agency", {
        p_agency_id: modal.agency.id,
        p_name: agencyForm.name,
        p_email: agencyForm.email,
        p_phone: agencyForm.phone,
        p_status: agencyForm.status,
        p_notes: "Updated agency details from SaaS Admin",
      });
      if (error) throw error;
    }, "Agency updated.");
  };

  const changePlan = async () => {
    if (modal?.type !== "changePlan") return;
    const nextPlan = plans.find((plan) => plan.id === agencyPlan);
    await runAdminAction(async () => {
      const { error } = await supabase!.rpc("saas_admin_change_agency_plan", {
        p_agency_id: modal.agency.id,
        p_plan_id: agencyPlan,
        p_notes: `Changed agency plan to ${nextPlan?.name || agencyPlan}`,
      });
      if (error) throw error;
    }, "Agency plan changed.");
  };

  const updateAgencyStatus = async (selected: AgencyRow, status: "active" | "suspended") => {
    setOpenMenuAgencyId(null);
    await runAdminAction(async () => {
      const rpcName = status === "active" ? "saas_admin_activate_agency" : "saas_admin_suspend_agency";
      const { error } = await supabase!.rpc(rpcName, {
        p_agency_id: selected.id,
        p_notes: `${status === "active" ? "Activated" : "Suspended"} from SaaS Admin`,
      });
      if (error) throw error;
    }, status === "active" ? "Agency activated." : "Agency suspended.");
  };

  const deleteAgency = async () => {
    if (modal?.type !== "delete") return;
    await runAdminAction(async () => {
      const { error } = await supabase!.rpc("saas_admin_delete_agency", {
        p_agency_id: modal.agency.id,
        p_notes: "Deleted from SaaS Admin after confirmation",
      });
      if (error) throw error;
    }, "Agency deleted.");
  };

  const updatePlan = async () => {
    if (modal?.type !== "editPlan") return;
    await runAdminAction(async () => {
      const price = Number(planForm.monthlyPrice);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Monthly price must be a non-negative number.");
      }
      const features = planForm.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean);
      const { error } = await supabase!.rpc("saas_admin_update_subscription_plan", {
        p_plan_id: modal.plan.id,
        p_name: planForm.name,
        p_monthly_price: price,
        p_user_limit: parseLimit(planForm.userLimit),
        p_booking_limit: parseLimit(planForm.bookingLimit),
        p_features: features,
        p_notes: `Edited ${planForm.name} plan`,
      });
      if (error) throw error;
    }, "Plan saved.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("admin")}</h1>
        <p className="text-slate-500 text-sm mt-1">Manage all agencies and platform settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Agencies</p><p className="text-xl font-bold text-navy">{totalAgencies}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Active</p><p className="text-xl font-bold text-navy">{activeAgencies}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Trial</p><p className="text-xl font-bold text-navy">{trialAgencies}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center"><XCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500">Suspended</p><p className="text-xl font-bold text-navy">{suspendedAgencies}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab("agencies")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "agencies" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Agencies
            </button>
            <button onClick={() => setActiveTab("audit")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "audit" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Audit Logs
            </button>
            <button onClick={() => setActiveTab("plans")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "plans" ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              Plans
            </button>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agencies..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
        </div>

        {!modal && (actionError || actionMessage) && (
          <div className={`mx-4 mt-4 rounded-lg border p-3 text-sm ${
            actionError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}>
            {actionError || actionMessage}
          </div>
        )}

        {activeTab === "agencies" && (
          <div className="overflow-x-auto pb-20">
            {loadError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Could not load agencies: {loadError}
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Agency</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-deep-blue text-white flex items-center justify-center text-xs font-bold">{getInitials(a.name)}</div>
                        <div>
                          <div className="font-medium text-slate-900">{a.name}</div>
                          <div className="text-xs text-slate-500">{a.id} · {a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                        a.plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        a.plan === "professional" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        {a.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.phone || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        a.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        a.status === "trial" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {a.status === "active" ? <CheckCircle className="w-3 h-3" /> : a.status === "suspended" ? <XCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          aria-label={`Open actions for ${a.name}`}
                          onClick={() => setOpenMenuAgencyId((current) => current === a.id ? null : a.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuAgencyId === a.id && (
                          <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                            <button onClick={() => openModal({ type: "view", agency: a })} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                              View
                            </button>
                            <button onClick={() => openEditAgency(a)} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                              Edit
                            </button>
                            <button onClick={() => openChangePlan(a)} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                              Change Plan
                            </button>
                            {a.status === "suspended" ? (
                              <button disabled={actionLoading} onClick={() => updateAgencyStatus(a, "active")} className="block w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                                Activate
                              </button>
                            ) : (
                              <button disabled={actionLoading} onClick={() => openModal({ type: "confirmStatus", agency: a, status: "suspended" })} className="block w-full px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                                Suspend
                              </button>
                            )}
                            <div className="my-1 border-t border-slate-100" />
                            <button onClick={() => openModal({ type: "delete", agency: a })} className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No agencies found.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Loading agencies...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Admin Email</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Target Agency</th>
                  <th className="px-4 py-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3 text-slate-700">{log.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.target_agency_name || log.target_agency_id || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{log.notes || "-"}</td>
                  </tr>
                ))}
                {!auditLoading && auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No audit logs found.</td>
                  </tr>
                )}
                {auditLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Loading audit logs...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`rounded-xl border border-slate-200 p-5 ${planColors[plan.id]}`}>
                <h3 className="font-bold text-navy">{plan.name}</h3>
                <p className="text-2xl font-bold text-brand mt-2">{plan.monthly_price} <span className="text-sm font-normal text-slate-500">OMR/mo</span></p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between"><span>Users</span><span className="font-medium">{plan.user_limit || "Unlimited"}</span></div>
                  <div className="flex items-center justify-between"><span>Bookings</span><span className="font-medium">{plan.booking_limit ? `${plan.booking_limit}/mo` : "Unlimited"}</span></div>
                </div>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-brand mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openEditPlan(plan)} className="w-full mt-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Edit Plan
                </button>
              </div>
            ))}
            {plansLoading && (
              <div className="md:col-span-3 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Loading plans...
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Showing {filtered.length} agencies</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative z-[10000] w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl">
            {actionError && (
              <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}
            {modal.type === "view" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-brand" />
                  <div>
                    <h2 className="font-bold text-navy">Agency Details</h2>
                    <p className="text-xs text-slate-500">{modal.agency.id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-500">Name</p><p className="font-medium text-slate-900">{modal.agency.name}</p></div>
                  <div><p className="text-slate-500">Email</p><p className="font-medium text-slate-900">{modal.agency.email}</p></div>
                  <div><p className="text-slate-500">Phone</p><p className="font-medium text-slate-900">{modal.agency.phone || "-"}</p></div>
                  <div><p className="text-slate-500">Plan</p><p className="font-medium capitalize text-slate-900">{modal.agency.plan}</p></div>
                  <div><p className="text-slate-500">Status</p><p className="font-medium capitalize text-slate-900">{modal.agency.status}</p></div>
                  <div><p className="text-slate-500">Created</p><p className="font-medium text-slate-900">{formatDate(modal.agency.created_at)}</p></div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
                </div>
              </div>
            )}

            {modal.type === "edit" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-5 h-5 text-brand" />
                  <h2 className="font-bold text-navy">Edit Agency</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                    <input value={agencyForm.name} onChange={(e) => setAgencyForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input value={agencyForm.email} onChange={(e) => setAgencyForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input value={agencyForm.phone} onChange={(e) => setAgencyForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={agencyForm.status} onChange={(e) => setAgencyForm((prev) => ({ ...prev, status: e.target.value as AgencyRow["status"] }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={updateAgency} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-deep-blue disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {actionLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {modal.type === "changePlan" && (
              <div className="p-5 space-y-4">
                <h2 className="font-bold text-navy">Change Plan</h2>
                <p className="text-sm text-slate-500">Select a new plan for {modal.agency.name}.</p>
                <select value={agencyPlan} onChange={(e) => setAgencyPlan(e.target.value as PlanId)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                  {plans.filter((plan) => plan.is_active).map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} - {plan.monthly_price} OMR/mo</option>
                  ))}
                </select>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={changePlan} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-deep-blue disabled:opacity-50">
                    {actionLoading ? "Saving..." : "Change Plan"}
                  </button>
                </div>
              </div>
            )}

            {modal.type === "confirmStatus" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-amber-600" />
                  <h2 className="font-bold text-navy">Suspend Agency</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Suspend {modal.agency.name}? This sets the agency to suspended and deactivates its users.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Agency users will lose access until the agency is activated again.
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={() => updateAgencyStatus(modal.agency, modal.status)} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                    {actionLoading ? "Suspending..." : "Suspend Agency"}
                  </button>
                </div>
              </div>
            )}

            {modal.type === "delete" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <h2 className="font-bold text-navy">Delete Agency</h2>
                </div>
                <p className="text-sm text-slate-600">
                  This will permanently delete {modal.agency.name} and its agency-scoped data. This action cannot delete a super_admin account.
                </p>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Type DELETE to confirm this permanent deletion.
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmation</label>
                  <input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE"
                    autoComplete="off"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                  />
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={deleteAgency} disabled={actionLoading || deleteConfirmation !== "DELETE"} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading ? "Deleting..." : "Delete Agency"}
                  </button>
                </div>
              </div>
            )}

            {modal.type === "editPlan" && (
              <div className="p-5 space-y-4">
                <h2 className="font-bold text-navy">Edit Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                    <input value={planForm.name} onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Price</label>
                    <input type="number" min="0" value={planForm.monthlyPrice} onChange={(e) => setPlanForm((prev) => ({ ...prev, monthlyPrice: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">User Limit</label>
                    <input type="number" min="0" placeholder="Blank for unlimited" value={planForm.userLimit} onChange={(e) => setPlanForm((prev) => ({ ...prev, userLimit: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Booking Limit</label>
                    <input type="number" min="0" placeholder="Blank for unlimited" value={planForm.bookingLimit} onChange={(e) => setPlanForm((prev) => ({ ...prev, bookingLimit: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Features</label>
                    <textarea rows={5} value={planForm.features} onChange={(e) => setPlanForm((prev) => ({ ...prev, features: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
                    <p className="mt-1 text-xs text-slate-500">One feature per line.</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={updatePlan} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-deep-blue disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {actionLoading ? "Saving..." : "Save Plan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
