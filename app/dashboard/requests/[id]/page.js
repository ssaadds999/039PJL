"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  /* ===== signature ===== */
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  /* ===== load user ===== */
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  /* ===== load request ===== */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/requests/${id}`);

        let data = null;
        const text = await res.text();
        if (text) data = JSON.parse(text);

        if (!res.ok || !data?.success) {
          alert("ไม่พบคำขอ");
          router.push("/dashboard");
          return;
        }

        setRequest(data.request);
        
        // Parse attached files and items
        if (data.request.attachedFilesJson) {
          try {
            const files = JSON.parse(data.request.attachedFilesJson);
            setAttachedFiles(Array.isArray(files) ? files : []);
          } catch (e) {
            setAttachedFiles([]);
          }
        }
        
        if (data.request.itemsJson) {
          try {
            const items = JSON.parse(data.request.itemsJson);
            setItemsList(Array.isArray(items) ? items : []);
          } catch (e) {
            setItemsList([]);
          }
        }
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลไม่สำเร็จ");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, router]);

  /* ===== signature draw ===== */
  const startDraw = (e) => {
    setDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e) => {
    if (!drawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  /* ===== approve / reject ===== */
  const updateStatus = async (status) => {
    const signature = canvasRef.current.toDataURL();
    const emptyCanvas = document.createElement("canvas").toDataURL();

    if (signature === emptyCanvas) {
      alert("กรุณาลงลายเซ็นก่อน");
      return;
    }

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          managerId: user.userId,
          managerSignature: signature,
        }),
      });

      let data = null;
      const text = await res.text();
      if (text) data = JSON.parse(text);

      if (!res.ok || !data?.success) {
        alert(data?.message || "อัปเดตไม่สำเร็จ");
        return;
      }

      setRequest((prev) => ({
        ...prev,
        status,
        managerSignature: signature,
      }));

      alert(status === "approved" ? "อนุมัติเรียบร้อย" : "ปฏิเสธคำขอแล้ว");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
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

  if (!request) return null;

  const statusConfig = {
    pending: {
      label: "รออนุมัติ",
      style: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200",
      icon: "⏳",
      bgGradient: "from-yellow-50 to-amber-50",
    },
    approved: {
      label: "อนุมัติแล้ว",
      style: "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200",
      icon: "✅",
      bgGradient: "from-green-50 to-emerald-50",
    },
    rejected: {
      label: "ไม่อนุมัติ",
      style: "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200",
      icon: "❌",
      bgGradient: "from-red-50 to-rose-50",
    },
  };

  const currentStatus = statusConfig[request.status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Modern Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  รายละเอียดคำขอ
                </h1>
                <p className="text-xs text-gray-500 font-medium">Request #{request.requestId}</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    {user.role === "manager" ? "👨‍💼 ผู้จัดการ" : "👤 ผู้ใช้งาน"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className={`p-4 bg-gradient-to-br ${currentStatus.bgGradient} rounded-2xl shadow-lg border border-gray-200`}>
                <div className="text-4xl">{currentStatus.icon}</div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  คำขอเลขที่ {request.requestId}
                </h1>
                <p className="text-gray-600 mt-1">รายละเอียดและสถานะการพิจารณา</p>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-xl text-sm font-bold shadow-lg ${currentStatus.style}`}>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{currentStatus.icon}</span>
                <span>{currentStatus.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Request Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <span>📋</span>
              <span>ข้อมูลคำขอ</span>
            </h3>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submitter */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">ผู้ยื่นคำขอ</p>
                  <p className="text-lg font-semibold text-gray-800">{request.submitterName}</p>
                </div>
              </div>

              {/* Request Type */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{request.requestType === "purchase" ? "🛒" : "🤝"}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">ประเภท</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {request.requestType === "purchase" ? "จัดซื้อ" : "จัดจ้าง"}
                  </p>
                </div>
              </div>

              {/* Item Name */}
              <div className="flex items-start space-x-3 md:col-span-2">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">รายการ</p>
                  <p className="text-lg font-semibold text-gray-800">{request.itemName}</p>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📦</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">จำนวน</p>
                  <p className="text-lg font-semibold text-gray-800">{request.quantity} หน่วย</p>
                </div>
              </div>

              {/* Unit Price */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💵</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">ราคาต่อหน่วย</p>
                  <p className="text-lg font-semibold text-gray-800">
                    ฿{Number(request.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="mt-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-2">จำนวนเงินรวมทั้งสิ้น</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl font-bold text-blue-600">
                      {Number(request.totalAmount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-2xl font-semibold text-blue-500">บาท</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {request.quantity} หน่วย × ฿
                    {Number(request.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-6xl">💰</div>
              </div>
            </div>

            {/* Items Table (if multiple items exist) */}
            {itemsList.length > 1 && (
              <div className="mt-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4">รายละเอียดรายการทั้งหมด</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">รายการ</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">จำนวน</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">ราคา/หน่วย</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsList.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            ฿{Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            ฿{Number(item.quantity * item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Signature */}
        {request.signature && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>✍️</span>
                <span>ลายเซ็นผู้ยื่นคำขอ</span>
              </h3>
            </div>
            <div className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-xl p-4 inline-block">
                <img
                  src={request.signature}
                  className="max-w-md rounded-lg shadow-inner bg-white border border-gray-100"
                  alt="user signature"
                />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                ลงลายเซ็นโดย: <span className="font-semibold text-gray-700">{request.submitterName}</span>
              </p>
            </div>
          </div>
        )}

        {/* Attached Files Section */}
        {attachedFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>📎</span>
                <span>ไฟล์แนบ ({attachedFiles.length})</span>
              </h3>
            </div>
            <div className="p-8">
              <div className="space-y-3">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <span className="text-3xl flex-shrink-0">
                        {file.type?.includes('pdf') ? '📄' : file.type?.includes('image') ? '🖼️' : '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    {file.data && (
                      <a
                        href={file.data}
                        download={file.name}
                        className="ml-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        ดาวน์โหลด
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manager Section */}
        {user?.role === "manager" && request.status === "pending" && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>👨‍💼</span>
                <span>การพิจารณา (ผู้จัดการ)</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">กรุณาลงลายเซ็นและเลือกการดำเนินการ</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Signature Canvas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  ลายเซ็นผู้จัดการ <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={160}
                      className="w-full cursor-crosshair"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 px-2">
                    <p className="text-xs text-gray-500 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span>เซ็นชื่อในกรอบด้านบน</span>
                    </p>
                    <button
                      onClick={clearSignature}
                      className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>ล้างลายเซ็น</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => updateStatus("approved")}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>อนุมัติคำขอ</span>
                </button>

                <button
                  onClick={() => updateStatus("rejected")}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-rose-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>ไม่อนุมัติ</span>
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนดำเนินการ การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>
        )}

        {/* Manager Signature (if approved/rejected) */}
        {request.managerSignature && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>👨‍💼</span>
                <span>ลายเซ็นผู้จัดการ</span>
              </h3>
            </div>
            <div className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 border-2 border-gray-200 rounded-xl p-4 inline-block">
                <img
                  src={request.managerSignature}
                  className="max-w-md rounded-lg shadow-inner bg-white border border-gray-100"
                  alt="manager signature"
                />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                ลงลายเซ็นโดย: <span className="font-semibold text-gray-700">ผู้จัดการ</span>
              </p>
            </div>
          </div>
        )}

        {/* PDF Download Section */}
        {request.status === "approved" && (
          <div className="bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-green-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>📄</span>
                <span>เอกสารได้รับการอนุมัติแล้ว</span>
              </h3>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    📄
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">เอกสารพร้อมใช้งาน</p>
                    <p className="text-sm text-gray-600">ดาวน์โหลดเอกสาร PDF ที่ได้รับการอนุมัติ</p>
                  </div>
                </div>
                <a
                  href={`/api/requests/${request.requestId}/pdf`}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>ดาวน์โหลด PDF</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>กลับ</span>
          </button>
        </div>
      </div>
    </div>
  );
}