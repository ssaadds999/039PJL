"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function BucketManagementPage() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [bucketItems, setBucketItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultPrice: "",
    category: "",
    unit: ""
  });

  const swalConfig = {
    confirmButtonColor: "#8b5cf6",
    cancelButtonColor: "#6b7280",
    background: "#ffffff",
    borderRadius: "16px",
    customClass: {
      popup: "rounded-2xl shadow-2xl",
      title: "text-xl font-bold text-gray-900",
      htmlContainer: "text-gray-700 text-base",
      confirmButton: "px-6 py-3 rounded-xl font-semibold text-base",
      cancelButton: "px-6 py-3 rounded-xl font-semibold text-base",
    },
    buttonsStyling: false,
  };

  const API_BASE = "/api/bucket-items";

  // Helper function สำหรับ fetch
  const safeFetch = async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', res.status, text.substring(0, 200));
        
        if (text.trim().startsWith('<')) {
          throw new Error(`API ไม่พบ (Status: ${res.status}) - ตรวจสอบว่ามีไฟล์ ${url}`);
        }
        
        throw new Error(`Response ไม่ใช่ JSON: ${contentType}`);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        throw new Error('ได้รับ HTML แทน JSON - API ไม่พบหรือมีปัญหา');
      }
      throw error;
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      MySwal.fire({
        ...swalConfig,
        icon: "error",
        title: "ไม่มีสิทธิ์เข้าถึง",
        text: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ต้องเป็น Admin เท่านั้น",
        confirmButtonText: "กลับไปหน้าหลัก",
        confirmButtonColor: "#ef4444",
      }).then(() => {
        router.push("/dashboard");
      });
      return;
    }
    
    setUser(parsedUser);
    fetchBucketItems();
  }, [router]);

  const fetchBucketItems = async () => {
    try {
      setLoading(true);
      
      const data = await safeFetch(API_BASE);
      
      if (data && data.success) {
        const normalized = (data.items || []).map((it) => ({
          id: it.itemId ?? it.id ?? Date.now() + Math.random(),
          itemId: it.itemId ?? it.id,
          itemName: it.itemName ?? it.name ?? '',
          name: it.itemName ?? it.name ?? '',
          unitPrice: it.unitPrice ?? it.defaultPrice ?? 0,
          defaultPrice: it.unitPrice ?? it.defaultPrice ?? 0,
          description: it.description ?? '',
          category: it.category ?? it.categoryName ?? '',
          unit: it.unit ?? it.unitName ?? '',
          isActive: typeof it.isActive === 'boolean' ? it.isActive : (it.active ?? true),
          createdAt: it.createdAt ?? it.created_at ?? null,
        }));

        setBucketItems(normalized);
      } else {
        throw new Error(data?.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error("Error fetching bucket items:", err);
      MySwal.fire({
        ...swalConfig,
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        html: `<div class="text-left">
          <p class="mb-2 text-red-600">${err.message}</p>
          <p class="text-sm text-gray-500">ตรวจสอบไฟล์: app/api/bucket-items/route.js</p>
        </div>`,
        confirmButtonText: "ลองใหม่",
        showCancelButton: true,
        cancelButtonText: "กลับหน้าหลัก",
      }).then((result) => {
        if (result.isConfirmed) {
          fetchBucketItems();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          router.push("/dashboard");
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.defaultPrice) {
      MySwal.fire({
        ...swalConfig,
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกชื่อรายการและราคาให้ครบถ้วน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      const isEditing = !!editingItem;
      
      // ใช้ POST อย่างเดียว ส่ง _action บอกว่าต้องการทำอะไร
      const payload = {
        _action: isEditing ? 'update' : 'create',
        itemName: formData.name,
        unitPrice: Number(formData.defaultPrice),
        description: formData.description || "",
        category: formData.category || "",
        unit: formData.unit || "",
        ...(isEditing && { id: editingItem.id })
      };

      MySwal.fire({
        ...swalConfig,
        title: isEditing ? "กำลังบันทึก..." : "กำลังเพิ่มรายการ...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      // ใช้ POST ไปที่ /api/bucket-items อย่างเดียว
      const data = await safeFetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      if (data.success) {
        await MySwal.fire({
          ...swalConfig,
          icon: "success",
          title: isEditing ? "แก้ไขสำเร็จ!" : "เพิ่มรายการสำเร็จ!",
          text: isEditing ? "ข้อมูลถูกอัปเดตเรียบร้อยแล้ว" : "รายการใหม่ถูกเพิ่มเข้าระบบแล้ว",
          confirmButtonText: "ตกลง",
          timer: 2000,
          timerProgressBar: true,
        });
        
        setShowAddModal(false);
        setEditingItem(null);
        resetForm();
        fetchBucketItems();
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error("Error saving item:", err);
      MySwal.fire({
        ...swalConfig,
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถบันทึกข้อมูลได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.itemName ?? item.name ?? "",
      description: item.description ?? "",
      defaultPrice: item.unitPrice != null ? String(item.unitPrice) : (item.defaultPrice != null ? String(item.defaultPrice) : ""),
      category: item.category ?? "",
      unit: item.unit ?? ""
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      ...swalConfig,
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      MySwal.fire({
        ...swalConfig,
        title: "กำลังลบ...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      // ใช้ POST ส่ง _action: 'delete'
      const data = await safeFetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify({ 
          _action: 'delete',
          id: id 
        }),
      });
      
      if (data.success) {
        await MySwal.fire({
          ...swalConfig,
          icon: "success",
          title: "ลบสำเร็จ!",
          text: "รายการถูกลบออกจากระบบแล้ว",
          confirmButtonText: "ตกลง",
          timer: 1500,
          timerProgressBar: true,
        });
        fetchBucketItems();
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      MySwal.fire({
        ...swalConfig,
        icon: "error",
        title: "ลบไม่สำเร็จ",
        text: err.message || "ไม่สามารถลบรายการได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const closeModal = () => {
    if (formData.name || formData.description || formData.defaultPrice) {
      MySwal.fire({
        ...swalConfig,
        icon: "question",
        title: "ยกเลิกการแก้ไข?",
        text: "ข้อมูลที่กรอกจะหายไป คุณแน่ใจหรือไม่?",
        showCancelButton: true,
        confirmButtonText: "ใช่, ยกเลิก",
        cancelButtonText: "กลับไปแก้ไขต่อ",
        confirmButtonColor: "#ef4444",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          setShowAddModal(false);
          setEditingItem(null);
          resetForm();
        }
      });
    } else {
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      defaultPrice: "",
      category: "",
      unit: ""
    });
  };

  const filteredItems = bucketItems.filter(item => {
    const itemName = item.itemName || item.name || "";
    const itemDesc = item.description || "";
    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         itemDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(bucketItems.map(item => item.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4" />
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-fuchsia-400 animate-ping mx-auto opacity-20" />
          </div>
          <p className="text-gray-800 font-semibold text-lg">กำลังโหลดข้อมูล...</p>
          <p className="text-gray-600 text-sm mt-1">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-purple-100/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2.5 hover:bg-purple-50 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-gray-700 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                    จัดการ Bucket Items
                  </h1>
                  <p className="text-xs text-gray-600 font-medium">Item Bucket Management System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200/50 shadow-sm">
                <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
                <p className="text-xs text-purple-700 font-semibold flex items-center justify-end space-x-1">
                  <span>👑</span>
                  <span>Admin</span>
                </p>
              </div>
              <button
                onClick={() => {
                  MySwal.fire({
                    ...swalConfig,
                    icon: "question",
                    title: "ออกจากระบบ?",
                    text: "คุณต้องการออกจากระบบใช่หรือไม่?",
                    showCancelButton: true,
                    confirmButtonText: "ใช่, ออกจากระบบ",
                    cancelButtonText: "ยกเลิก",
                    confirmButtonColor: "#ef4444",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      localStorage.removeItem("user");
                      router.push("/login");
                    }
                  });
                }}
                className="px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-md"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800 font-mono mb-1">API: {API_BASE} (POST only)</p>
            <p className="text-xs text-yellow-600">ใช้ _action: create|update|delete</p>
          </div>
        )}

        {/* Hero Header */}
        <div className="mb-8 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 shadow-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2 text-white">จัดการรายการใน Bucket</h2>
                <p className="text-purple-100 text-lg">เพิ่ม แก้ไข และจัดการรายการสินค้า/บริการในระบบ</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 bg-white text-purple-700 rounded-2xl hover:bg-purple-50 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มรายการใหม่</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm mb-2 font-semibold">รายการทั้งหมด</p>
                <p className="text-5xl font-bold text-gray-900">
                  {bucketItems.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                📦
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm mb-2 font-semibold">หมวดหมู่</p>
                <p className="text-5xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                🏷️
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm mb-2 font-semibold">รายการที่แสดง</p>
                <p className="text-5xl font-bold text-gray-900">
                  {filteredItems.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-fuchsia-500 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                👁️
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหารายการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none font-medium text-gray-900 placeholder-gray-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none font-medium text-gray-900"
            >
              <option value="">🏷️ ทุกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 px-6 py-5 border-b border-purple-100">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <span className="text-3xl">📋</span>
              <span>รายการทั้งหมด</span>
              <span className="text-purple-700">({filteredItems.length})</span>
            </h3>
          </div>

          <div className="p-6">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div key={item.id || item.itemId} className="bg-white rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-bold text-xl text-gray-900 group-hover:text-purple-700 transition-colors flex-1 leading-tight">
                        {item.itemName || item.name}
                      </h4>
                      <span className="text-4xl ml-3 transform group-hover:scale-110 transition-transform duration-200">📦</span>
                    </div>

                    {item.category && (
                      <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-4 shadow-sm">
                        🏷️ {item.category}
                      </div>
                    )}

                    <p className="text-sm text-gray-700 mb-5 line-clamp-2 min-h-[40px]">
                      {item.description || <span className="text-gray-500 italic">ไม่มีรายละเอียด</span>}
                    </p>

                    <div className="flex items-center justify-between mb-5 pb-5 border-b-2 border-gray-100">
                      <span className="text-sm text-gray-700 font-semibold">ราคาอ้างอิง</span>
                      <span className="text-2xl font-bold text-purple-700">
                        ฿{Number(item.unitPrice || item.defaultPrice || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                      </span>
                    </div>

                    {item.unit && (
                      <div className="flex items-center justify-between mb-5 bg-purple-50 rounded-lg p-3">
                        <span className="text-sm text-gray-700 font-semibold">หน่วย</span>
                        <span className="text-sm font-bold text-purple-700">📏 {item.unit}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id || item.itemId)}
                        className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-bold text-sm flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl border-2 border-dashed border-purple-300">
                <div className="text-8xl mb-6 animate-bounce">📭</div>
                <p className="text-gray-800 text-2xl font-bold mb-2">
                  {searchTerm || filterCategory ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการใน Bucket'}
                </p>
                <p className="text-gray-600 text-lg mb-8">
                  {searchTerm || filterCategory ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นสร้างรายการแรกของคุณ'}
                </p>
                {!searchTerm && !filterCategory && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-8 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    + เพิ่มรายการแรก
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-8 py-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                <span className="text-3xl">{editingItem ? '✏️' : '➕'}</span>
                <span>{editingItem ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 transform hover:scale-110"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <span>📝</span>
                    <span>ชื่อรายการ <span className="text-red-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-semibold text-lg text-gray-900 placeholder-gray-500"
                    placeholder="เช่น กระดาษ A4, ปากกา, บริการทำความสะอาด"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <span>📄</span>
                    <span>รายละเอียด</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-base text-gray-900 placeholder-gray-500"
                    placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                      <span>💰</span>
                      <span>ราคาอ้างอิง (บาท) <span className="text-red-600">*</span></span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.defaultPrice}
                      onChange={(e) => setFormData({...formData, defaultPrice: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-bold text-lg text-gray-900 placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                      <span>📏</span>
                      <span>หน่วย</span>
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg text-gray-900 placeholder-gray-500"
                      placeholder="เช่น แพ็ค, ชิ้น, ครั้ง"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <span>🏷️</span>
                    <span>หมวดหมู่</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg font-semibold text-gray-900 bg-white"
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    <option value="เครื่องเขียน">📝 เครื่องเขียน</option>
                    <option value="อุปกรณ์สำนักงาน">💼 อุปกรณ์สำนักงาน</option>
                    <option value="บริการ">🛠️ บริการ</option>
                    <option value="วัสดุก่อสร้าง">🏗️ วัสดุก่อสร้าง</option>
                    <option value="อุปกรณ์ไฟฟ้า">⚡ อุปกรณ์ไฟฟ้า</option>
                    <option value="อื่นๆ">📦 อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-8 py-5 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all duration-200 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105"
                >
                  {editingItem ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มรายการ'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-5 bg-gray-200 text-gray-800 rounded-2xl hover:bg-gray-300 transition-all duration-200 font-bold text-lg"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}