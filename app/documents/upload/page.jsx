"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// สร้าง instance ของ SweetAlert สำหรับ React
const MySwal = withReactContent(Swal);

export default function UploadDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    documentType: "shared",
    tags: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

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
    } catch (err) {
      console.error("Invalid user data");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [mounted, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Check file type
    if (file.type !== "application/pdf") {
      MySwal.fire({
        icon: "error",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "รองรับเฉพาะไฟล์ PDF เท่านั้น",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
        background: "#fff",
        borderRadius: "16px",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold text-gray-800",
          htmlContainer: "text-gray-600",
        },
      });
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      MySwal.fire({
        icon: "error",
        title: "ไฟล์ใหญ่เกินไป",
        text: "ขนาดไฟล์ต้องไม่เกิน 10MB",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
        background: "#fff",
        borderRadius: "16px",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold text-gray-800",
          htmlContainer: "text-gray-600",
        },
      });
      return;
    }

    setSelectedFile(file);
    
    // แสดง toast แจ้งเตือนเล็กน้อยเมื่อเลือกไฟล์สำเร็จ
    MySwal.fire({
      icon: "success",
      title: "เลือกไฟล์สำเร็จ",
      text: file.name,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
      background: "#fff",
      customClass: {
        popup: "rounded-xl",
      },
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      MySwal.fire({
        icon: "warning",
        title: "กรุณาเลือกไฟล์",
        text: "คุณยังไม่ได้เลือกไฟล์ PDF ที่ต้องการอัปโหลด",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f59e0b",
        background: "#fff",
        borderRadius: "16px",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold text-gray-800",
          htmlContainer: "text-gray-600",
        },
      });
      return;
    }

    if (!form.title || !form.category || !form.documentType) {
      MySwal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลที่จำเป็นให้ครบทุกช่อง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f59e0b",
        background: "#fff",
        borderRadius: "16px",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold text-gray-800",
          htmlContainer: "text-gray-600",
        },
      });
      return;
    }

    // แสดง confirmation dialog ก่อนอัปโหลด
    const result = await MySwal.fire({
      icon: "question",
      title: "ยืนยันการอัปโหลด?",
      html: `
        <div class="text-left space-y-2">
          <p><span class="font-semibold">ชื่อเอกสาร:</span> ${form.title}</p>
          <p><span class="font-semibold">ไฟล์:</span> ${selectedFile.name}</p>
          <p><span class="font-semibold">ขนาด:</span> ${formatFileSize(selectedFile.size)}</p>
          <p><span class="font-semibold">หมวดหมู่:</span> ${getCategoryLabel(form.category)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "อัปโหลดเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      background: "#fff",
      borderRadius: "16px",
      customClass: {
        popup: "rounded-2xl",
        title: "text-xl font-bold text-gray-800",
        htmlContainer: "text-gray-600",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("documentType", form.documentType);
      formData.append("tags", form.tags);
      formData.append("uploadedBy", user.userId);

      // แสดง loading
      MySwal.fire({
        title: "กำลังอัปโหลด...",
        html: "กรุณารอสักครู่ ระบบกำลังอัปโหลดไฟล์ของคุณ",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          MySwal.showLoading();
        },
        background: "#fff",
        borderRadius: "16px",
      });

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        await MySwal.fire({
          icon: "success",
          title: "อัปโหลดสำเร็จ!",
          text: "เอกสารของคุณถูกอัปโหลดเรียบร้อยแล้ว",
          confirmButtonText: "ไปที่หน้าเอกสาร",
          confirmButtonColor: "#10b981",
          background: "#fff",
          borderRadius: "16px",
          timer: 3000,
          timerProgressBar: true,
          customClass: {
            popup: "rounded-2xl",
            title: "text-xl font-bold text-gray-800",
            htmlContainer: "text-gray-600",
          },
        });
        router.push("/documents");
      } else {
        MySwal.fire({
          icon: "error",
          title: "อัปโหลดไม่สำเร็จ",
          text: data.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์",
          confirmButtonText: "ลองใหม่",
          confirmButtonColor: "#ef4444",
          background: "#fff",
          borderRadius: "16px",
          customClass: {
            popup: "rounded-2xl",
            title: "text-xl font-bold text-gray-800",
            htmlContainer: "text-gray-600",
          },
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      MySwal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
        background: "#fff",
        borderRadius: "16px",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold text-gray-800",
          htmlContainer: "text-gray-600",
        },
      });
    } finally {
      setUploading(false);
    }
  };

  const getCategoryIcon = (category) =>
    ({
      general: "📄",
      purchase: "🛒",
      contract: "📝",
      financial: "💰",
      hr: "👥",
      other: "📦",
    }[category] || "📄");

  const getCategoryLabel = (category) =>
    ({
      general: "ทั่วไป",
      purchase: "จัดซื้อ/จัดจ้าง",
      contract: "สัญญา",
      financial: "การเงิน",
      hr: "ทรัพยากรบุคคล",
      other: "อื่นๆ",
    }[category] || category);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // ฟังก์ชันสำหรับยืนยันก่อนเปลี่ยนไฟล์
  const handleRemoveFile = async (e) => {
    e.stopPropagation();
    
    const result = await MySwal.fire({
      icon: "question",
      title: "ต้องการเปลี่ยนไฟล์?",
      text: "คุณต้องการลบไฟล์ปัจจุบันและเลือกไฟล์ใหม่หรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ใช่, เปลี่ยนไฟล์",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: "#fff",
      borderRadius: "16px",
      customClass: {
        popup: "rounded-2xl",
        title: "text-xl font-bold text-gray-800",
        htmlContainer: "text-gray-600",
      },
    });

    if (result.isConfirmed) {
      setSelectedFile(null);
    }
  };

  // ฟังก์ชันสำหรับยืนยันก่อนออกจากหน้า
  const handleCancel = async () => {
    if (selectedFile || form.title || form.description) {
      const result = await MySwal.fire({
        icon: "warning",
        title: "ยกเลิกการอัปโหลด?",
        text: "ข้อมูลที่กรอกไว้จะหายไป คุณแน่ใจหรือไม่?",
        showCancelButton: true,
        confirmButtonText: "ใช่, ยกเลิก",
        cancelButtonText: "กลับไปแก้ไข",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        background: "#fff",
        borderRadius: "16px",
        customClass: {
          popup: "rounded-2xl",
          title: "text-xl font-bold text-gray-800",
          htmlContainer: "text-gray-600",
        },
      });

      if (result.isConfirmed) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
          </div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/documents")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="p-2 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl shadow-lg">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  อัปโหลดเอกสาร
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Upload Document
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <h2 className="text-3xl font-bold text-gray-800">
              อัปโหลดเอกสาร PDF
            </h2>
          </div>
          <p className="text-gray-600">อัปโหลดและจัดเก็บเอกสาร PDF ในระบบ</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Drag & Drop Area */}
          <div className="p-8 border-b border-gray-200">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 text-sm font-semibold border border-red-200"
                  >
                    เปลี่ยนไฟล์
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      ลากและวางไฟล์ที่นี่
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      หรือคลิกเพื่อเลือกไฟล์
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
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
                      <span>PDF เท่านั้น</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                      <span>ไม่เกิน 10MB</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อเอกสาร <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="เช่น รายงานประจำปี 2024"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="อธิบายเนื้อหาเอกสารโดยย่อ"
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none"
              />
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-2xl">
                    {getCategoryIcon(form.category)}
                  </div>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl pl-14 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="general">📄 ทั่วไป</option>
                    <option value="purchase">🛒 จัดซื้อ/จัดจ้าง</option>
                    <option value="contract">📝 สัญญา</option>
                    <option value="financial">💰 การเงิน</option>
                    <option value="hr">👥 ทรัพยากรบุคคล</option>
                    <option value="other">📦 อื่นๆ</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ประเภทเอกสาร <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl">
                    {form.documentType === "personal" ? "🔒" : "🌐"}
                  </div>
                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl pl-14 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="shared">🌐 ส่วนรวม (ทุกคนเห็น)</option>
                    <option value="personal">
                      🔒 ส่วนตัว (เฉพาะผู้จัดการและแอดมิน)
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                แท็ก (Tags)
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="คั่นด้วยเครื่องหมายจุลภาค เช่น งบประมาณ, Q1, สำคัญ"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                แท็กช่วยในการค้นหาเอกสาร
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">
                    ข้อมูลเกี่ยวกับประเภทเอกสาร:
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <span className="font-semibold">• ส่วนรวม:</span>{" "}
                      ทุกคนในระบบสามารถเห็นและดาวน์โหลดได้
                    </li>
                    <li>
                      <span className="font-semibold">• ส่วนตัว:</span>{" "}
                      มองเห็นได้เฉพาะผู้อัปโหลด, ผู้จัดการ และแอดมินเท่านั้น
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
              >
                ยกเลิก
              </button>

              <button
                disabled={uploading || !selectedFile}
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>กำลังอัปโหลด...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>อัปโหลดเอกสาร</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}