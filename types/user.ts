export interface User {
  id: string | number;
  phone: string;
  email?: string;
  full_name: string;
  role: "client" | "driver" | "admin";
  status: "active" | "suspended" | "pending";
  language: string;
  created_at: string;
}