"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiLoader,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiUsers,
  FiTrash2,
  FiCheck,
  FiX,
  FiEye,
} from "react-icons/fi";

interface User {
  id: string | number;
  phone: string;
  email?: string;
  full_name: string;
  role: "client" | "driver" | "admin";
  status: "active" | "suspended" | "pending";
  language: string;
  created_at: string;
}

interface PaginationState {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: true });

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "all" | "client" | "driver" | "admin"
  >("client");
  const [pagination, setPagination] = useState<PaginationState>({
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [suspendingUserId, setSuspendingUserId] = useState<
    string | number | null
  >(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [selectedRole, pagination.offset]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(query) ||
        u.phone.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        false,
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoadingInitial(true);
      const data = await request<User[]>(async () => {
        return await apiClient.getUsers({
          limit: pagination.limit,
          offset: pagination.offset,
          role: selectedRole,
        });
      });
      console.log("Loaded users:", data);
      if (data) {
        setUsers(data);
        // Check if there are more results
        setPagination((prev) => ({
          ...prev,
          hasMore: data.length === prev.limit,
        }));
      }
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleSuspendClick = (user: User) => {
    setSelectedUser(user);
    setSuspendReason("");
    setShowSuspendModal(true);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedUser) return;

    if (!suspendReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    try {
      setSuspendingUserId(selectedUser.id);

      const result = await request(async () => {
        return await apiClient.suspendUser(
          selectedUser.id as string,
          suspendReason,
        );
      });

      if (result) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, status: "suspended" } : u,
          ),
        );
        setShowSuspendModal(false);
        setSuspendReason("");
        setSelectedUser(null);
        toast.success("User suspended successfully");
      }
    } catch (error: any) {
      toast.error("Failed to suspend user");
      console.error(error);
    } finally {
      setSuspendingUserId(null);
    }
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <FiCheck className="w-4 h-4" />;
      case "suspended":
        return <FiX className="w-4 h-4" />;
      case "pending":
        return <FiAlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (isLoadingInitial) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    User Management
                  </h1>
                  <p className="text-gray-600">
                    Manage and monitor platform users
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {filteredUsers.length}
                </p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isApiLoading}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(
                      e.target.value as "all" | "client" | "driver" | "admin",
                    );
                    setPagination((prev) => ({ ...prev, offset: 0 }));
                  }}
                  disabled={isApiLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="client">Clients</option>
                  <option value="driver">Drivers</option>
                  <option value="admin">Admins</option>
                  <option value="all">All Users</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Language
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.full_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {user.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.phone}
                              </p>
                              {user.email && (
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                              {user.role}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                user.status,
                              )}`}
                            >
                              {getStatusIcon(user.status)}
                              <span className="capitalize">{user.status}</span>
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600 uppercase">
                              {user.language}
                            </p>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600">
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {user.status === "active" && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleSuspendClick(user)}
                                  disabled={suspendingUserId === user.id || isApiLoading}
                                  isLoading={suspendingUserId === user.id}
                                  title="Suspend user"
                                >
                                  {suspendingUserId !== user.id && <FiTrash2 className="w-4 h-4" />}
                                  Suspend
                                </Button>
                              )}

                              {user.status === "suspended" && (
                                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg">
                                  <FiAlertCircle className="w-4 h-4 mr-1" />
                                  Suspended
                                </span>
                              )}

                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  // TODO: View user details
                                }}
                                disabled={isApiLoading}
                                title="View details"
                              >
                                <FiEye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-medium">
                      {pagination.offset + 1}-
                      {Math.min(
                        pagination.offset + pagination.limit,
                        filteredUsers.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredUsers.length}</span>{" "}
                    users
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={pagination.offset === 0 || isApiLoading}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore || isApiLoading}
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Suspend Modal */}
          {showSuspendModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                    <FiAlertCircle className="w-6 h-6 text-red-600" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                    Suspend User
                  </h3>

                  <p className="text-sm text-gray-600 text-center mb-4">
                    You are about to suspend{" "}
                    <span className="font-semibold">
                      {selectedUser.full_name}
                    </span>
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Suspension
                    </label>
                    <textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Provide a reason for suspending this user..."
                      rows={3}
                      disabled={suspendingUserId === selectedUser.id}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => {
                        setShowSuspendModal(false);
                        setSuspendReason("");
                        setSelectedUser(null);
                      }}
                      disabled={suspendingUserId === selectedUser.id}
                    >
                      Cancel
                    </Button>

                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleSuspendConfirm}
                      isLoading={suspendingUserId === selectedUser.id}
                      disabled={suspendingUserId === selectedUser.id || !suspendReason.trim()}
                    >
                      {suspendingUserId !== selectedUser.id && <FiTrash2 className="w-4 h-4" />}
                      {suspendingUserId === selectedUser.id ? 'Suspending...' : 'Suspend User'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
