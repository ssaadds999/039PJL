"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      fetchDocuments(parsedUser);
    } catch (err) {
      console.error("Invalid user data");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [mounted, router, categoryFilter, typeFilter]);

  const fetchDocuments = async (userData) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/documents?userId=${userData.userId}&role=${userData.role}&category=${categoryFilter}&documentType=${typeFilter}`
      );
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Fetch documents error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm("ต้องการลบเอกสารนี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(
        `/api/documents/${documentId}?userId=${user.userId}&role=${user.role}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      
      if (data.success) {
        alert("✅ ลบเอกสารสำเร็จ");
        fetchDocuments(user);
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ ลบเอกสารไม่สำเร็จ");
    }
  };

  const getCategoryBadge = (category) => ({
    general: { label: "ทั่วไป", color: "bg-gray-100 text-gray-700", icon: "📄" },
    purchase: { label: "จัดซื้อ/จัดจ้าง", color: "bg-blue-100 text-blue-700", icon: "🛒" },
    contract: { label: "สัญญา", color: "bg-purple-100 text-purple-700", icon: "📝" },
    financial: { label: "การเงิน", color: "bg-green-100 text-green-700", icon: "💰" },
    hr: { label: "ทรัพยากรบุคคล", color: "bg-pink-100 text-pink-700", icon: "👥" },
    other: { label: "อื่นๆ", color: "bg-orange-100 text-orange-700", icon: "📦" },
  }[category] || { label: "ทั่วไป", color: "bg-gray-100 text-gray-700", icon: "📄" });

  const getTypeBadge = (type) => ({
    personal: { label: "ส่วนตัว", color: "bg-yellow-100 text-yellow-700 border border-yellow-200", icon: "🔒" },
    shared: { label: "ส่วนรวม", color: "bg-green-100 text-green-700 border border-green-200", icon: "🌐" },
  }[type] || { label: "ส่วนรวม", color: "bg-green-100 text-green-700 border border-green-200", icon: "🌐" });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter documents by search query
  const filteredDocuments = documents.filter((doc) => {
  const searchLower = searchQuery.toLowerCase();

  return (
    doc.title?.toLowerCase().includes(searchLower) ||
    doc.documentName?.toLowerCase().includes(searchLower) || // ⭐ สำคัญ
    doc.originalName?.toLowerCase().includes(searchLower) ||
    doc.uploaderName?.toLowerCase().includes(searchLower) ||
    doc.description?.toLowerCase().includes(searchLower)
  );
});


  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 animate-ping mx-auto opacity-20" />
          </div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-2 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  จัดการเอกสาร
                </h1>
                <p className="text-xs text-gray-500 font-medium">Document Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/documents/upload")}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>อัปโหลดเอกสาร</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <h2 className="text-3xl font-bold text-gray-800">เอกสารทั้งหมด</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {filteredDocuments.length} เอกสาร
            </span>
          </div>
          <p className="text-gray-600">จัดการและค้นหาเอกสาร PDF ในระบบ</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 ค้นหา</label>
              <input
                type="text"
                placeholder="ชื่อเอกสาร, ผู้อัปโหลด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📁 หมวดหมู่</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 bg-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="general">📄 ทั่วไป</option>
                <option value="purchase">🛒 จัดซื้อ/จัดจ้าง</option>
                <option value="contract">📝 สัญญา</option>
                <option value="financial">💰 การเงิน</option>
                <option value="hr">👥 ทรัพยากรบุคคล</option>
                <option value="other">📦 อื่นๆ</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔐 ประเภท</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 bg-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="shared">🌐 ส่วนรวม</option>
                <option value="personal">🔒 ส่วนตัว</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.documentId}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Document Header */}
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">PDF</p>
                      <p className="text-white/80 text-xs">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadge(doc.documentType).color}`}>
                    {getTypeBadge(doc.documentType).icon} {getTypeBadge(doc.documentType).label}
                  </span>
                </div>

                {/* Document Body */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                    {doc.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {doc.description || "ไม่มีคำอธิบาย"}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(doc.category).color}`}>
                      {getCategoryBadge(doc.category).icon} {getCategoryBadge(doc.category).label}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mb-4">
                    <div className="flex items-center text-xs text-gray-500 space-x-2 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{doc.uploaderName}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-sm font-semibold text-center"
                    >
                      ดูเอกสาร
                    </a>
                    {(user.role === "admin" || user.role === "manager" || doc.uploadedBy === user.userId) && (
                      <button
                        onClick={() => handleDelete(doc.documentId)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 text-sm font-semibold border border-red-200"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg font-medium">ไม่พบเอกสาร</p>
            <p className="text-gray-400 text-sm mt-2 mb-4">
              {searchQuery ? "ลองค้นหาด้วยคำอื่น" : "เริ่มต้นโดยการอัปโหลดเอกสารแรก"}
            </p>
            <button
              onClick={() => router.push("/documents/upload")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 text-sm font-semibold shadow-lg inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>อัปโหลดเอกสาร</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}