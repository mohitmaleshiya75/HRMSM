/**
 * AllEmployees.tsx — React Native (single file, real API)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  RefreshControl,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { User, UserRole } from "@/features/auth/types";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://hrmsm.com/api";
const PAGE_SIZE = 10;

interface PaginatedResponse {
  results: User[];
  count: number;
  next: string | null;
  previous: string | null;
}

interface MemberFilters {
  search?: string;
  office?: string;
  page?: number;
}

const whoCanAccessSpecialFields: string[] = ["admin", "hr", "superadmin"];
const whoCanAccessSpecialFieldsWithManager: string[] = [
  "admin",
  "hr",
  "manager",
  "Manager",
  "superadmin",
];

const formatEmployeeId = (id: string | number) =>
  `EMP-${String(id).padStart(5, "0")}`;

const avatarUrl = (first: string, last: string, imageUrl?: string) =>
  imageUrl ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    first
  )}+${encodeURIComponent(last)}&background=1e293b&color=e2e8f0&bold=true&size=128`;

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
};

const useGetEmployees = (filters: MemberFilters) => {
  const { data: currentUser } = useCurrentUser();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint =
    currentUser?.role === "Manager"
      ? "/accounts/employees/get_reportees/"
      : "/accounts/employees/";

  const fetchEmployees = useCallback(
    async (refreshing = false) => {
      refreshing ? setRefreshing(true) : setLoading(true);
      setError(null);

      try {
        const token = currentUser?.token;
        const qs = buildQueryString({
          search: filters.search,
          office: filters.office,
          page: filters.page ?? 1,
        });

        const res = await fetch(`${BASE_URL}${endpoint}${qs}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: PaginatedResponse = await res.json();
        setData({
          results: json.results || [],
          count: json.count || 0,
          next: json.next || null,
          previous: json.previous || null,
        });
      } catch (e: any) {
        setError(e?.message || "Failed to fetch employees");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters.search, filters.office, filters.page, currentUser?.role]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees: data?.results || [],
    totalCount: data?.count || 0,
    nextPage: data?.next || null,
    previousPage: data?.previous || null,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchEmployees(true),
    currentUser,
  };
};

const StatusBadge = ({
  isActive,
  isDark,
}: {
  isActive: boolean;
  isDark: boolean;
}) => {
  const bg = isActive
    ? isDark
      ? "rgba(16,185,129,0.16)"
      : "rgba(16,185,129,0.10)"
    : isDark
    ? "rgba(239,68,68,0.16)"
    : "rgba(239,68,68,0.10)";

  const fg = isActive ? "#10b981" : "#ef4444";

  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>
        {isActive ? "Active" : "Inactive"}
      </Text>
    </View>
  );
};

const RolePill = ({ role, isDark }: { role: string; isDark: boolean }) => {
  const map: Record<string, { bg: string; fg: string }> = {
    admin: isDark
      ? { bg: "rgba(124,58,237,0.18)", fg: "#c4b5fd" }
      : { bg: "#ede9fe", fg: "#7c3aed" },
    superadmin: isDark
      ? { bg: "rgba(79,70,229,0.18)", fg: "#c7d2fe" }
      : { bg: "#e0e7ff", fg: "#4f46e5" },
    Manager: isDark
      ? { bg: "rgba(29,78,216,0.18)", fg: "#bfdbfe" }
      : { bg: "#dbeafe", fg: "#1d4ed8" },
    manager: isDark
      ? { bg: "rgba(29,78,216,0.18)", fg: "#bfdbfe" }
      : { bg: "#dbeafe", fg: "#1d4ed8" },
    hr: isDark
      ? { bg: "rgba(217,119,6,0.18)", fg: "#fde68a" }
      : { bg: "#fef3c7", fg: "#d97706" },
    employee: isDark
      ? { bg: "rgba(55,65,81,0.40)", fg: "#e5e7eb" }
      : { bg: "#f3f4f6", fg: "#374151" },
  };

  const c = map[role] ?? map.employee;

  return (
    <View style={[s.rolePill, { backgroundColor: c.bg }]}>
      <Text style={[s.rolePillText, { color: c.fg }]}>{role.toUpperCase()}</Text>
    </View>
  );
};

const Divider = ({ border }: { border: string }) => (
  <View style={[s.divider, { backgroundColor: border }]} />
);

const DetailRow = ({
  label,
  value,
  fg,
  muted,
}: {
  label: string;
  value: string;
  fg: string;
  muted: string;
}) => (
  <View style={s.detailRow}>
    <Text style={[s.detailLabel, { color: muted }]}>{label}</Text>
    <Text style={[s.detailValue, { color: fg }]}>{value || "—"}</Text>
  </View>
);

const ViewDetailModal = ({
  employee,
  visible,
  onClose,
  isDark,
}: {
  employee: User | null;
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) => {
  if (!employee) return null;

  const bg = isDark ? "#0f172a" : "#f3f4f6";
  const card = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const fg = isDark ? "#ffffff" : "#111827";
  const muted = isDark ? "#94a3b8" : "#6b7280";
  const accent = "#10b981";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.modalSafe, { backgroundColor: bg }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={bg}
        />
        <View style={[s.modalHeader, { borderBottomColor: border, backgroundColor: card }]}>
          <TouchableOpacity onPress={onClose} style={s.backBtn}>
            <Text style={[s.backBtnText, { color: accent }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[s.modalHeaderTitle, { color: fg }]}>Employee Profile</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
          <View style={[s.heroCard, { backgroundColor: card, borderColor: border }]}>
            <Image
              source={{
                uri: avatarUrl(
                  employee.first_name,
                  employee.last_name,
                  employee.profile_image_url
                ),
              }}
              style={[s.heroAvatar, { borderColor: accent }]}
            />
            <Text style={[s.heroName, { color: fg }]}>
              {employee.first_name} {employee.last_name}
            </Text>
            <Text style={[s.heroPosition, { color: muted }]}>{employee.position}</Text>

            <View style={s.heroMeta}>
              <RolePill role={employee.role} isDark={isDark} />
              <View style={{ width: 8 }} />
              <StatusBadge isActive={employee.is_active} isDark={isDark} />
            </View>
          </View>

          <Text style={[s.sectionTitle, { color: muted }]}>Work Info</Text>
          <View style={[s.sectionCard, { backgroundColor: card, borderColor: border }]}>
            <DetailRow label="Employee ID" value={formatEmployeeId(employee.id)} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Department" value={employee.department_name} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Designation" value={employee.position} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Employee Type" value={employee.employee_type} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Joining Date" value={employee.date_of_joining} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Office" value={employee.office ?? "—"} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Manager" value={employee.manager_full_name} fg={fg} muted={muted} />
          </View>

          <Text style={[s.sectionTitle, { color: muted }]}>Personal Info</Text>
          <View style={[s.sectionCard, { backgroundColor: card, borderColor: border }]}>
            <DetailRow label="Email" value={employee.email} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Phone" value={employee.phone_number} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Gender" value={employee.gender} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Date of Birth" value={employee.date_of_birth ?? "—"} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Blood Group" value={employee.blood_group} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Marital Status" value={employee.marital_status} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Nationality" value={employee.nationality} fg={fg} muted={muted} />
          </View>

          <Text style={[s.sectionTitle, { color: muted }]}>Address</Text>
          <View style={[s.sectionCard, { backgroundColor: card, borderColor: border }]}>
            <DetailRow label="Current" value={employee.address} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Permanent" value={employee.permanent_address} fg={fg} muted={muted} />
          </View>

          <Text style={[s.sectionTitle, { color: muted }]}>Emergency Contact</Text>
          <View style={[s.sectionCard, { backgroundColor: card, borderColor: border }]}>
            <DetailRow label="Name" value={employee.emergency_name} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Relation" value={employee.emergency_relation} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="Phone" value={employee.emergency_number} fg={fg} muted={muted} />
          </View>

          <Text style={[s.sectionTitle, { color: muted }]}>Financial Details</Text>
          <View
            style={[
              s.sectionCard,
              { backgroundColor: card, borderColor: border, marginBottom: 40 },
            ]}
          >
            <DetailRow label="Bank Name" value={employee.bank_name} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow
              label="Account Number"
              value={employee.bank_account_number}
              fg={fg}
              muted={muted}
            />
            <Divider border={border} />
            <DetailRow label="IFSC Code" value={employee.ifsc_code} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="PAN Number" value={employee.pan_number} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="UID (Aadhaar)" value={employee.uid_number} fg={fg} muted={muted} />
            <Divider border={border} />
            <DetailRow label="ESIC Number" value={employee.esic_number} fg={fg} muted={muted} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const EditEmployeeModal = ({
  employee,
  visible,
  onClose,
  onSave,
  isSaving,
  isDark,
}: {
  employee: User | null;
  visible: boolean;
  onClose: () => void;
  onSave: (updated: User) => void;
  isSaving: boolean;
  isDark: boolean;
}) => {
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (employee) setForm({ ...employee });
  }, [employee]);

  if (!employee) return null;

  const bg = isDark ? "#0f172a" : "#f3f4f6";
  const card = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const fg = isDark ? "#ffffff" : "#111827";
  const muted = isDark ? "#94a3b8" : "#6b7280";
  const accent = "#6366f1";

  const set = (key: keyof User) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const fields: Array<{ label: string; key: keyof User }> = [
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Position", key: "position" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone_number" },
    { label: "Department", key: "department_name" },
    { label: "Address", key: "address" },
  ];

  const handleSave = () => onSave({ ...employee, ...form } as User);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.modalSafe, { backgroundColor: bg }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={bg}
        />
        <View style={[s.modalHeader, { borderBottomColor: border, backgroundColor: card }]}>
          <TouchableOpacity onPress={onClose} style={s.backBtn} disabled={isSaving}>
            <Text style={[s.backBtnText, { color: accent }]}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.modalHeaderTitle, { color: fg }]}>Edit Employee</Text>
          <TouchableOpacity onPress={handleSave} style={s.saveHeaderBtn} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Text style={[s.saveHeaderBtnText, { color: accent }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
          <View style={[s.heroCard, { backgroundColor: card, borderColor: border }]}>
            <Image
              source={{
                uri: avatarUrl(
                  employee.first_name,
                  employee.last_name,
                  employee.profile_image_url
                ),
              }}
              style={[s.heroAvatar, { borderColor: accent }]}
            />
            <Text style={[s.heroName, { color: fg }]}>
              {employee.first_name} {employee.last_name}
            </Text>
            <Text style={[s.heroPosition, { color: muted }]}>
              {formatEmployeeId(employee.id)}
            </Text>
          </View>

          <Text style={[s.sectionTitle, { color: muted }]}>Edit Details</Text>
          <View
            style={[
              s.sectionCard,
              { backgroundColor: card, borderColor: border, marginBottom: 24 },
            ]}
          >
            {fields.map((field, idx) => (
              <View key={String(field.key)}>
                {idx > 0 && <Divider border={border} />}
                <View style={s.inputRow}>
                  <Text style={[s.inputRowLabel, { color: muted }]}>{field.label}</Text>
                  <TextInput
                    style={[
                      s.inputRowField,
                      {
                        backgroundColor: isDark ? "#0f172a" : "#f9fafb",
                        color: fg,
                        borderColor: border,
                      },
                    ]}
                    value={String(form[field.key] ?? "")}
                    onChangeText={set(field.key)}
                    placeholderTextColor={muted}
                    selectionColor={accent}
                    editable={!isSaving}
                  />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.saveBigBtn, { backgroundColor: accent }, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBigBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const EmployeeCard = ({
  employee,
  currentUserRole,
  onView,
  onEdit,
  onDelete,
  isDark,
  card,
  border,
  fg,
  muted,
  accent,
  accentBg,
}: {
  employee: User;
  currentUserRole: UserRole;
  onView: (e: User) => void;
  onEdit: (e: User) => void;
  onDelete: (e: User) => void;
  isDark: boolean;
  card: string;
  border: string;
  fg: string;
  muted: string;
  accent: string;
  accentBg: string;
}) => {
  const canView = whoCanAccessSpecialFieldsWithManager.includes(currentUserRole);
  const canAction = whoCanAccessSpecialFields.includes(currentUserRole);

  return (
    <TouchableOpacity
      activeOpacity={canView ? 0.75 : 1}
      onPress={() => canView && onView(employee)}
      style={[s.card, { backgroundColor: card, borderColor: border }]}
    >
      <View style={s.cardTop}>
        <Image
          source={{
            uri: avatarUrl(
              employee.first_name,
              employee.last_name,
              employee.profile_image_url
            ),
          }}
          style={s.cardAvatar}
        />
        <View style={s.cardInfo}>
          <Text style={[s.cardName, { color: fg }]}>
            {employee.first_name} {employee.last_name}
          </Text>
          <Text style={[s.cardPosition, { color: muted }]}>{employee.position}</Text>
          <Text style={[s.cardDept, { color: muted }]}>{employee.department_name}</Text>
        </View>
        <StatusBadge isActive={employee.is_active} isDark={isDark} />
      </View>

      <View style={[s.cardMeta, { backgroundColor: accentBg }]}>
        <View style={s.cardMetaItem}>
          <Text style={[s.cardMetaLabel, { color: muted }]}>ID</Text>
          <Text style={[s.cardMetaValue, { color: fg }]}>{formatEmployeeId(employee.id)}</Text>
        </View>
        <View style={[s.cardMetaSep, { backgroundColor: border }]} />
        <View style={s.cardMetaItem}>
          <Text style={[s.cardMetaLabel, { color: muted }]}>Joined</Text>
          <Text style={[s.cardMetaValue, { color: fg }]}>{employee.date_of_joining}</Text>
        </View>
        <View style={[s.cardMetaSep, { backgroundColor: border }]} />
        <View style={s.cardMetaItem}>
          <Text style={[s.cardMetaLabel, { color: muted }]}>Role</Text>
          <RolePill role={employee.role} isDark={isDark} />
        </View>
      </View>

      {canAction && (
        <View style={s.cardActions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: accent }]}
            onPress={() => onView(employee)}
          >
            <Text style={s.actionBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: "#0f766e" }]}
            onPress={() => onEdit(employee)}
          >
            <Text style={s.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: "#b91c1c" }]}
            onPress={() => onDelete(employee)}
          >
            <Text style={s.actionBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const PaginationBar = ({
  page,
  totalPages,
  onPrev,
  onNext,
  onPage,
  isDark,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
  isDark: boolean;
}) => {
  const bg = isDark ? "#1e293b" : "#ffffff";
  const active = "#10b981";
  const border = isDark ? "#334155" : "#e5e7eb";
  const fg = isDark ? "#ffffff" : "#111827";
  const muted = isDark ? "#94a3b8" : "#6b7280";

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View style={s.pagination}>
      <TouchableOpacity
        style={[
          s.pgBtn,
          { backgroundColor: bg, borderColor: border },
          page === 1 && s.pgBtnDisabled,
        ]}
        onPress={onPrev}
        disabled={page === 1}
      >
        <Text style={[s.pgArrow, { color: fg }]}>‹</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pgScroll}>
        {pages.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              s.pgNumber,
              { backgroundColor: bg, borderColor: border },
              p === page && { backgroundColor: active },
            ]}
            onPress={() => onPage(p)}
          >
            <Text style={[s.pgNumberText, { color: muted }, p === page && { color: "#fff" }]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          s.pgBtn,
          { backgroundColor: bg, borderColor: border },
          page === totalPages && s.pgBtnDisabled,
        ]}
        onPress={onNext}
        disabled={page === totalPages}
      >
        <Text style={[s.pgArrow, { color: fg }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

interface AllEmployeesProps {
  officeId?: string;
}

const AllEmployees = ({ officeId }: AllEmployeesProps) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [viewEmployee, setViewEmployee] = useState<User | null>(null);
  const [editEmployee, setEditEmployee] = useState<User | null>(null);
  const [viewVisible, setViewVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const bg = isDark ? "#0f172a" : "#f3f4f6";
  const card = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const fg = isDark ? "#ffffff" : "#111827";
  const muted = isDark ? "#94a3b8" : "#6b7280";
  const accent = "#10b981";
  const accentBg = isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const {
    employees,
    totalCount,
    isLoading,
    isRefreshing,
    error,
    refetch,
    currentUser,
  } = useGetEmployees({
    search: debouncedSearch || undefined,
    office: officeId,
    page,
  });

  const currentUserRole = currentUser?.role;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const router = useRouter();

  const handleDelete = (emp: User) => {
    Alert.alert(
      "Delete Employee",
      `Delete ${emp.first_name} ${emp.last_name}?\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("access_token");
              const res = await fetch(`${BASE_URL}/accounts/employees/${emp.id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              Alert.alert("Deleted", `${emp.first_name} has been removed.`);
              refetch();
            } catch {
              Alert.alert("Error", "Failed to delete employee. Try again.");
            }
          },
        },
      ]
    );
  };

  const handleSave = async (updated: User) => {
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/accounts/employees/${updated.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: updated.first_name,
          last_name: updated.last_name,
          position: updated.position,
          email: updated.email,
          phone_number: updated.phone_number,
          department: updated.department,
          address: updated.address,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      Alert.alert("Saved", "Employee updated successfully.");
      setEditVisible(false);
      refetch();
    } catch {
      Alert.alert("Error", "Failed to save changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openView = (emp: User) => {
    setViewEmployee(emp);
    setViewVisible(true);
  };

  const openEdit = (emp: User) => {
    setEditEmployee(emp);
    setEditVisible(true);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      <Stack.Screen
        options={{
          title: "All Employees",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/")}
              style={{ paddingHorizontal: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#10b981" />
            </TouchableOpacity>
          ),
        }}
      />

      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bg}
      />

      <View style={s.header}>
        <View>
          <Text style={[s.headerTitle, { color: fg }]}>Employees</Text>
          <Text style={[s.headerSub, { color: muted }]}>
            {isLoading ? "Loading…" : `${totalCount} total records`}
          </Text>
        </View>
      </View>

      <View
        style={[
          s.searchBar,
          {
            backgroundColor: card,
            borderColor: border,
            paddingVertical: Platform.OS === "ios" ? 10 : 6,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={muted} style={{ marginRight: 8 }} />
        <TextInput
          style={[s.searchInput, { color: fg, fontSize: 14 }]}
          placeholder="Search name, ID, role, dept…"
          placeholderTextColor={muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close" size={16} color={muted} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>⚠ {error}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={s.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && employees.length === 0 ? (
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[s.loadingText, { color: muted }]}>Fetching employees…</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={accent}
              colors={[accent]}
            />
          }
          ListEmptyComponent={
            <View
              style={[
                s.empty,
                {
                  backgroundColor: card,
                  borderColor: border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={[s.emptyText, { color: fg }]}>No employees found.</Text>
              {search.length > 0 && (
                <Text style={[s.emptyHint, { color: muted }]}>
                  Try a different search term.
                </Text>
              )}
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                onPage={setPage}
                isDark={isDark}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              currentUserRole={currentUserRole ? currentUserRole : "Employee"}
              onView={openView}
              onEdit={openEdit}
              onDelete={handleDelete}
              isDark={isDark}
              card={card}
              border={border}
              fg={fg}
              muted={muted}
              accent={accent}
              accentBg={accentBg}
            />
          )}
        />
      )}

      <ViewDetailModal
        employee={viewEmployee}
        visible={viewVisible}
        onClose={() => setViewVisible(false)}
        isDark={isDark}
      />
      <EditEmployeeModal
        employee={editEmployee}
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSave={handleSave}
        isSaving={isSaving}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

export default AllEmployees;

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 42,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef2f2",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    flex: 1,
  },
  errorRetry: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },

  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  empty: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 32,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 6,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#d1d5db",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardPosition: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  cardDept: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },

  cardMeta: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  cardMetaItem: {
    flex: 1,
    alignItems: "center",
  },
  cardMetaLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
    fontWeight: "700",
  },
  cardMetaValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardMetaSep: {
    width: 1,
    height: 32,
  },

  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  pgBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pgBtnDisabled: {
    opacity: 0.3,
  },
  pgArrow: {
    fontSize: 22,
    lineHeight: 26,
  },
  pgScroll: {
    flexGrow: 0,
  },
  pgNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
    borderWidth: 1,
  },
  pgNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },

  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  backBtn: {
    minWidth: 70,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  saveHeaderBtn: {
    minWidth: 70,
    alignItems: "flex-end",
  },
  saveHeaderBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalBody: {
    padding: 16,
  },

  heroCard: {
    borderRadius: 20,
    alignItems: "center",
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  heroAvatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#d1d5db",
    marginBottom: 12,
    borderWidth: 3,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
  },
  heroPosition: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
    fontWeight: "500",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 2,
    textAlign: "right",
  },

  divider: {
    height: 1,
  },

  inputRow: {
    paddingVertical: 12,
  },
  inputRowLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: "800",
  },
  inputRowField: {
    fontSize: 15,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderWidth: 1,
    fontWeight: "600",
  },

  saveBigBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 40,
  },
  saveBigBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});