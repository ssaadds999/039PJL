"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

export default function CreateUserPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "user",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ===== SweetAlert Helper Functions ===== */
  
  const showError = (title, text = '') => {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'เข้าใจแล้ว',
      customClass: {
        popup: 'rounded-2xl'
      }
    });
  };

  const showSuccess = (title, text = '') => {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'ตกลง',
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-2xl'
      }
    });
  };

  const showWarning = (title, text) => {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: text,
      confirmButtonColor: '#F59E0B',
      confirmButtonText: 'ตกลง',
      customClass: {
        popup: 'rounded-2xl'
      }
    });
  };

  /* ===== check admin ===== */
  useEffect(() => {
    if (!mounted) return;

    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const u = JSON.parse(userData);
    if (u.role !== "admin") {
      showWarning('ไม่มีสิทธิ์เข้าถึง', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้').then(() => {
        router.push("/dashboard");
      });
      return;
    }

    setUser(u);
  }, [mounted, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    // Validation
    if (!form.username || !form.password || !form.fullName) {
      showError('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบทุกช่องที่ระบุ *');
      return;
    }

    // Confirm before submit
    const result = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการเพิ่มผู้ใช้?',
      html: `
        <div class="text-left text-sm">
          <p><strong>ชื่อผู้ใช้:</strong> ${form.username}</p>
          <p><strong>ชื่อ-นามสกุล:</strong> ${form.fullName}</p>
          <p><strong>ระดับ:</strong> ${form.role === 'admin' ? '👑 ผู้ดูแลระบบ' : form.role === 'manager' ? '📊 ผู้จัดการ' : '👤 ผู้ใช้งาน'}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ใช่, เพิ่มผู้ใช้',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl'
      }
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      // Show loading
      Swal.fire({
        title: 'กำลังบันทึก...',
        text: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      Swal.close();

      if (!data.success) {
        throw new Error(data.error || "Failed to create user");
      }

      await showSuccess('เพิ่มผู้ใช้สำเร็จ', `ผู้ใช้ ${form.fullName} ถูกเพิ่มเข้าสู่ระบบแล้ว`);
      router.push("/dashboard");
      
    } catch (err) {
      console.error(err);
      Swal.close();
      showError('เพิ่มผู้ใช้ไม่สำเร็จ', err.message || "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role) => ({
    admin: "👑",
    manager: "📊",
    user: "👤",
  }[role] || "👤");

  const getRoleColor = (role) => ({
    admin: "from-purple-500 to-pink-500",
    manager: "from-blue-500 to-cyan-500",
    user: "from-green-500 to-emerald-500",
  }[role] || "from-green-500 to-emerald-500");

  if (!mounted || !user) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Modern Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  PROGRESS C & E
                </h1>
                <p className="text-xs text-gray-500 font-medium">ระบบจัดการเอกสาร</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right px-4 py-2 rounded-xl bg-purple-50 border border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                <p className="text-xs font-medium text-purple-600">
                  👑 ผู้ดูแลระบบ
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
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">ย้อนกลับ</span>
          </button>

          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">เพิ่มผู้ใช้งานใหม่</h2>
              <p className="text-gray-600">กรอกข้อมูลผู้ใช้ที่ต้องการเพิ่มเข้าสู่ระบบ</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">ข้อมูลผู้ใช้</h3>
                <p className="text-sm text-gray-600 mt-1">กรุณากรอกข้อมูลให้ครบถ้วน</p>
              </div>
              <div className={`px-4 py-2 bg-gradient-to-r ${getRoleColor(form.role)} rounded-xl text-white font-semibold shadow-lg flex items-center space-x-2`}>
                <span className="text-2xl">{getRoleIcon(form.role)}</span>
                <span className="text-sm">
                  {form.role === "admin" ? "ผู้ดูแลระบบ" : 
                   form.role === "manager" ? "ผู้จัดการ" : "ผู้ใช้งาน"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Username Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    name="username"
                    value={form.username}
                    placeholder="กรอกชื่อผู้ใช้งาน"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">ใช้สำหรับเข้าสู่ระบบ</p>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">ควรมีความปลอดภัยสูง</p>
              </div>

              {/* Full Name Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <input
                    name="fullName"
                    value={form.fullName}
                    placeholder="กรอกชื่อ - นามสกุลเต็ม"
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">ชื่อที่จะแสดงในระบบ</p>
              </div>

              {/* Role Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ระดับผู้ใช้ (Role) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-xl">{getRoleIcon(form.role)}</span>
                  </div>
                  <select
                    name="role"
                    value={form.role}
                    className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none bg-white cursor-pointer"
                    onChange={handleChange}
                  >
                    <option value="user">👤 ผู้ใช้งาน</option>
                    <option value="manager">📊 ผู้จัดการ</option>
                    <option value="admin">👑 ผู้ดูแลระบบ</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">กำหนดสิทธิ์การเข้าถึงในระบบ</p>
              </div>

              {/* Role Description */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">ข้อมูลเกี่ยวกับระดับผู้ใช้:</p>
                    <ul className="space-y-1 text-xs">
                      <li><span className="font-semibold">• ผู้ใช้งาน:</span> สามารถสร้างและดูคำขอของตนเอง</li>
                      <li><span className="font-semibold">• ผู้จัดการ:</span> สามารถอนุมัติ/ปฏิเสธคำขอได้</li>
                      <li><span className="font-semibold">• ผู้ดูแลระบบ:</span> มีสิทธิ์เต็มในการจัดการระบบ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 transform hover:scale-[1.02]"
              >
                ยกเลิก
              </button>

              <button
                disabled={submitting}
                onClick={submit}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${getRoleColor(form.role)} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>บันทึกผู้ใช้</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">คำแนะนำ</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ชื่อผู้ใช้ควรไม่ซ้ำกับผู้ใช้ที่มีอยู่แล้วในระบบ</li>
                <li>• รหัสผ่านควรมีความซับซ้อนเพื่อความปลอดภัย</li>
                <li>• ผู้ใช้สามารถเปลี่ยนรหัสผ่านได้ภายหลัง</li>
                <li>• เลือกระดับผู้ใช้ให้เหมาะสมกับหน้าที่</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}