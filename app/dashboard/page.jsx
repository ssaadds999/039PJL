"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDashboardData(parsedUser);
    } catch (err) {
      console.error("Invalid user data");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [mounted, router]);

  const fetchDashboardData = async (userData) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/requests?role=${userData.role}&userId=${userData.userId}`
      );
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests);
        calculateStats(data.requests, userData.role);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requestsData, role) => {
    const stats = {
      pending: requestsData.filter(r => r.status === 'pending').length,
      approved: requestsData.filter(r => r.status === 'approved').length,
      rejected: requestsData.filter(r => r.status === 'rejected').length,
      myRequests: requestsData.length,
      draft: requestsData.filter(r => r.status === 'draft').length,
      today: requestsData.filter(r => {
        const today = new Date().toDateString();
        const reqDate = new Date(r.created_at || r.createdAt || r.createdat).toDateString();
        return today === reqDate;
      }).length,
      totalRequests: requestsData.length
    };
    setStats(stats);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const goToCreateRequest = () => {
    router.push("/dashboard/create-request");
  };

  const goToCreateUser = () => {
    router.push("/admin/users/create");
  };

  const goToDocuments = () => {
    router.push("/documents");
  };

  const goToBucketManagement = () => {
    router.push("/admin/management/bucket-management");
  };

  // Helper: ดึง field ที่อาจมีชื่อต่างกัน
  const getField = (req, ...keys) => {
    for (const key of keys) {
      if (req[key] !== undefined && req[key] !== null && req[key] !== "") {
        return req[key];
      }
    }
    return null;
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 animate-ping mx-auto opacity-20" />
          </div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
          <p className="text-gray-400 text-sm mt-1">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getStatsCards = () => {
    if (!stats) return [];
    if (user.role === "admin") {
      return [
        { label: "คำขอทั้งหมด", value: stats.totalRequests, icon: "📄", color: "from-green-500 to-green-600", bgLight: "bg-green-50" },
        { label: "รออนุมัติ", value: stats.pending, icon: "⏳", color: "from-yellow-500 to-yellow-600", bgLight: "bg-yellow-50" },
        { label: "อนุมัติแล้ว", value: stats.approved, icon: "✅", color: "from-purple-500 to-purple-600", bgLight: "bg-purple-50" },
        { label: "ปฏิเสธ", value: stats.rejected, icon: "❌", color: "from-red-500 to-red-600", bgLight: "bg-red-50" },
      ];
    }
    if (user.role === "manager") {
      return [
        { label: "รอการอนุมัติ", value: stats.pending, icon: "⏳", color: "from-yellow-500 to-yellow-600", bgLight: "bg-yellow-50" },
        { label: "อนุมัติแล้ว", value: stats.approved, icon: "✅", color: "from-green-500 to-green-600", bgLight: "bg-green-50" },
        { label: "ปฏิเสธ", value: stats.rejected, icon: "❌", color: "from-red-500 to-red-600", bgLight: "bg-red-50" },
        { label: "วันนี้", value: stats.today, icon: "📅", color: "from-blue-500 to-blue-600", bgLight: "bg-blue-50" },
      ];
    }
    return [
      { label: "คำขอของฉัน", value: stats.myRequests, icon: "📝", color: "from-blue-500 to-blue-600", bgLight: "bg-blue-50" },
      { label: "รออนุมัติ", value: stats.pending, icon: "⏳", color: "from-yellow-500 to-yellow-600", bgLight: "bg-yellow-50" },
      { label: "อนุมัติแล้ว", value: stats.approved, icon: "✅", color: "from-green-500 to-green-600", bgLight: "bg-green-50" },
      { label: "แบบร่าง", value: stats.draft, icon: "📋", color: "from-gray-500 to-gray-600", bgLight: "bg-gray-50" },
    ];
  };

  const getStatusBadge = (status) =>
    ({
      pending: {
        label: "รออนุมัติ",
        color: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200",
      },
      approved: {
        label: "อนุมัติแล้ว",
        color: "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200",
      },
      rejected: {
        label: "ปฏิเสธ",
        color: "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200",
      },
    }[status] || {
      label: "รออนุมัติ",
      color: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200",
    });

  const getRoleDisplay = (role) =>
    ({
      admin: {
        label: "ผู้ดูแลระบบ",
        icon: "👑",
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      manager: {
        label: "ผู้จัดการ",
        icon: "📊",
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      user: {
        label: "ผู้ใช้งาน",
        icon: "👤",
        color: "text-green-600",
        bg: "bg-green-50",
      },
    }[role]);

  // Format date helper
  const formatDate = (req) => {
    const raw = getField(req, "created_at", "createdAt", "createdat", "date", "createdDate");
    if (!raw) return "-";
    try {
      return new Date(raw).toLocaleDateString("th-TH");
    } catch {
      return "-";
    }
  };

  // Format request ID helper
  const formatRequestId = (req) => {
    return getField(req, "requestId", "request_id", "id", "requestID") || "-";
  };

  // Format item name helper
  const formatItemName = (req) => {
    return getField(req, "itemName", "item_name", "title", "name") || "-";
  };

  // Format total amount helper
  const formatAmount = (req) => {
    const val = getField(req, "totalAmount", "total_amount", "amount");
    return Number(val || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Modern Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  PROGRESS C & E
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  ระบบจัดการเอกสาร
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`text-right px-4 py-2 rounded-xl ${getRoleDisplay(user.role).bg} border border-gray-100`}
              >
                <p className="text-sm font-semibold text-gray-800">
                  {user.fullName}
                </p>
                <p
                  className={`text-xs font-medium ${getRoleDisplay(user.role).color}`}
                >
                  {getRoleDisplay(user.role).icon}{" "}
                  {getRoleDisplay(user.role).label}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-100 hover:border-red-200 hover:shadow-md"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <h2 className="text-3xl font-bold text-gray-800">
              สวัสดี, {user.fullName}
            </h2>
            <span className="text-3xl animate-wave inline-block">👋</span>
          </div>
          <p className="text-gray-600 text-lg">
            ยินดีต้อนรับสู่ระบบจัดการเอกสารและการจัดซื้อ/จัดจ้าง
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStatsCards().map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-2 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-bold text-gray-800 group-hover:scale-110 transition-transform duration-200">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`bg-gradient-to-br ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}
                >
                  {stat.icon}
                </div>
              </div>
              <div
                className={`mt-4 h-1 ${stat.bgLight} rounded-full overflow-hidden`}
              >
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} w-3/4 rounded-full animate-pulse`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all duration-200 ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600 border-b-2"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>ภาพรวม</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all duration-200 ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600 border-b-2"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>📋</span>
                  <span>คำขอล่าสุด</span>
                </span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                  <span>📈</span>
                  <span>สรุปภาพรวมระบบ</span>
                </h3>
                <div className="space-y-4">
                  {user.role === "user" && (
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                          ➕
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-lg">
                            สร้างคำขอใหม่
                          </p>
                          <p className="text-sm text-gray-600">
                            ยื่นคำขอจัดซื้อหรือจัดจ้างใหม่
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={goToCreateRequest}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        สร้างคำขอ
                      </button>
                    </div>
                  )}

                  {/* เมนูจัดการเอกสาร - แสดงให้ทุก Role */}
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📁
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">
                          จัดการเอกสาร
                        </p>
                        <p className="text-sm text-gray-600">
                          อัปโหลดและจัดเก็บเอกสาร PDF
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={goToDocuments}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      เปิดหน้าเอกสาร
                    </button>
                  </div>

                  {/* เมนูสำหรับ Admin */}
                  {user.role === "admin" && (
                    <>
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                            🗂️
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">
                              จัดการ Bucket
                            </p>
                            <p className="text-sm text-gray-600">
                              จัดการรายการสินค้า/บริการในระบบ
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={goToBucketManagement}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          จัดการ Bucket
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                            👤
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">
                              จัดการผู้ใช้
                            </p>
                            <p className="text-sm text-gray-600">
                              เพิ่มผู้ใช้ใหม่ในระบบ
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={goToCreateUser}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          + เพิ่มผู้ใช้
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "requests" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <span>📋</span>
                    <span>
                      {user.role === "manager"
                        ? "คำขอที่รอการอนุมัติ"
                        : "คำขอล่าสุด"}
                    </span>
                  </h3>

                  {user.role === "user" && (
                    <button
                      onClick={goToCreateRequest}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      + สร้างคำขอใหม่
                    </button>
                  )}
                </div>

                {requests.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              รหัส
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              รายการ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              จำนวนเงิน
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              สถานะ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              วันที่
                            </th>
                          </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                          {requests.map((req, index) => (
                            <tr
                              key={formatRequestId(req) !== "-" ? formatRequestId(req) : index}
                              className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 transition-all duration-200"
                            >
                              {/* รหัส */}
                              <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                                {formatRequestId(req)}
                              </td>

                              {/* รายการ */}
                              <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                {formatItemName(req)}
                              </td>

                              {/* จำนวนเงิน */}
                              <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                ฿{formatAmount(req)}
                              </td>

                              {/* สถานะ */}
                              <td className="px-6 py-4">
                                <span
                                  className={`px-4 py-2 rounded-full text-xs font-semibold ${getStatusBadge(req.status).color} inline-block`}
                                >
                                  {getStatusBadge(req.status).label}
                                </span>
                              </td>

                              {/* วันที่ */}
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {formatDate(req)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-500 text-lg font-medium">
                      ไม่มีคำขอในขณะนี้
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      คำขอของคุณจะแสดงที่นี่
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(20deg);
          }
          75% {
            transform: rotate(-20deg);
          }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}