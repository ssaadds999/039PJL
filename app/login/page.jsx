"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        // ❌ แจ้งเตือนเมื่อ login ไม่สำเร็จ
        await Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          confirmButtonText: "ลองใหม่",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      // ✅ แจ้งเตือนเมื่อ login สำเร็จ
      await Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ!",
        text: `ยินดีต้อนรับ ${data.user?.fullName || data.user?.username}`,
        timer: 1500,
        showConfirmButton: false,
        willClose: () => {
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push("/dashboard");
        },
      });

    } catch {
      // ❌ แจ้งเตือนเมื่อเชื่อมต่อเซิร์ฟเวอร์ไม่ได้
      await Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          เข้าสู่ระบบ
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-800">
              ชื่อผู้ใช้
            </label>
            <input
              name="username"
              type="text"
              placeholder="กรอกชื่อผู้ใช้"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800">
              รหัสผ่าน
            </label>
            <input
              name="password"
              type="password"
              placeholder="กรอกรหัสผ่าน"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition
              ${
                loading
                  ? "bg-blue-400 cursor-not-allowed opacity-70"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}