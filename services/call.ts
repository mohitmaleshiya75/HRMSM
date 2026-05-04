// callApi.ts – Employee Hierarchy API + types for React Native calling

import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useEffect, useRef, useState } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE: string = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  "",
);

// ─── Employee Type ─────────────────────────────────────────────────────────────
export type Employee = {
  id: number;
  employee_id?: number;
  user_id?: number;
  pk?: number;

  full_name: string;
  name?: string;
  employee_name?: string;
  first_name?: string;
  last_name?: string;

  designation?: string;
  role?: string;
  position?: string;
  job_title?: string;

  department_name?: string;
  department?: string;

  avatar?: string;
  profile_picture?: string;
  profile_image?: string;
  profile_image_url?: string;

  online_status?: {
    is_online?: boolean;
    last_seen?: string;
    last_seen_human?: string;
  };

  user?: {
    id?: number;
    full_name?: string;
    username?: string;
    name?: string;
  };

  [key: string]: unknown;
};

// ─── Normalise: ensure id & full_name always exist ───────────────────────────
export function normaliseEmployee(raw: Record<string, unknown>): Employee {
  const id = Number(raw.id ?? raw.employee_id ?? raw.user_id ?? raw.pk ?? 0);
  const full_name =
    (raw.full_name as string) ??
    (raw.name as string) ??
    (raw.employee_name as string) ??
    `${raw.first_name ?? ""} ${raw.last_name ?? ""}`.trim() ??
    (raw.user as { full_name?: string } | undefined)?.full_name ??
    "Unknown";

  return { ...(raw as Employee), id, full_name };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
export async function fetchEmployeeHierarchy(token: string): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}/accounts/employee-hierarchy/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[callApi] ${res.status}: ${text}`);
  }
  const json = await res.json();
  const arr: Record<string, unknown>[] = Array.isArray(json) ? json : [];
  return arr.map(normaliseEmployee);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEmployeeHierarchy() {
  const { data: currentUser } = useCurrentUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const token: string | undefined =
      ((currentUser as Record<string, unknown> | undefined)?.token as
        | string
        | undefined) ??
      ((currentUser as Record<string, unknown> | undefined)?.access as
        | string
        | undefined);

    if (!token) return;

    setIsLoading(true);
    setError(null);

    fetchEmployeeHierarchy(token)
      .then((data) => {
        if (!mountedRef.current) return;
        setEmployees(data);
      })
      .catch((err: Error) => {
        if (!mountedRef.current) return;
        setError(err.message);
      })
      .finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });
  }, [currentUser]);

  return { employees, isLoading, error, currentUser };
}
