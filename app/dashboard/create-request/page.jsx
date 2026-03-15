"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Create a SweetAlert instance with React content support
const MySwal = withReactContent(Swal);

export default function CreateRequestPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState("purchase");
  const [bucketItems, setBucketItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unitPrice: "",
    category: "",
    unit: ""
  });

  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [bucketCategory, setBucketCategory] = useState("");
  const [addingToApi, setAddingToApi] = useState(false);

  const totalAmount = selectedItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  /* ===== Helper Functions for SweetAlert ===== */
  
  // Success Alert
  const showSuccess = (title, text = '') => {
    return MySwal.fire({
      icon: 'success',
      title: title,
      text: text,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'ตกลง',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      customClass: {
        popup: 'colored-toast'
      }
    });
  };

  // Error Alert
  const showError = (title, text = '') => {
    return MySwal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'ตกลง',
      confirmButtonText: 'เข้าใจแล้ว'
    });
  };

  // Warning/Confirmation Alert
  const showWarning = (title, text, confirmCallback) => {
    return MySwal.fire({
      icon: 'warning',
      title: title,
      text: text,
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ใช่, ดำเนินการ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed && confirmCallback) {
        confirmCallback();
      }
    });
  };

  // Info Alert
  const showInfo = (title, text = '') => {
    return MySwal.fire({
      icon: 'info',
      title: title,
      text: text,
      confirmButtonColor: '#3B82F6',
      confirmButtonText: 'ตกลง'
    });
  };

  /* ===== load user ===== */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) router.push("/login");
    else setUser(JSON.parse(userData));
  }, [router]);

  /* ===== load bucket items ===== */
  useEffect(() => {
    if (!user) return;
    fetchBucketItems();
  }, [user]);

  useEffect(() => {
    if (showBucketModal) {
      fetchBucketItems();
    }
  }, [showBucketModal]);

  const fetchBucketItems = async () => {
    try {
      const res = await fetch('/api/bucket-items');
      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (res.ok && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Unexpected response from /api/bucket-items:', res.status, text);
        throw new Error('Invalid response from server');
      }

      if (data && data.success) {
        const normalized = (data.items || []).map((it) => ({
          id: it.itemId ?? it.id ?? Date.now() + Math.random(),
          name: it.itemName ?? it.name ?? '',
          defaultPrice: it.unitPrice ?? it.defaultPrice ?? 0,
          description: it.description ?? '',
          category: it.category ?? '',
          unit: it.unit ?? '',
          isActive: it.isActive ?? true,
        }));

        setBucketItems(normalized);
      }
    } catch (err) {
      console.error("Error loading bucket items:", err);
      showError('โหลดข้อมูลล้มเหลว', 'ไม่สามารถโหลดรายการจาก Bucket ได้');
    }
  };

  /* ===== load signature of user ===== */
  useEffect(() => {
    if (!user || !canvasRef.current) return;

    fetch(`/api/user/signature?userId=${user.userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.signature) return;

        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          ctx.drawImage(img, 0, 0);
        };
        img.src = data.signature;
      });
  }, [user]);

  /* ===== canvas ===== */
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0];
    return {
      x: (t ? t.clientX : e.clientX) - rect.left,
      y: (t ? t.clientY : e.clientY) - rect.top,
    };
  };

  const startDraw = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = async () => {
    setIsDrawing(false);
    if (!user) return;

    const signature = canvasRef.current.toDataURL("image/png");
    if (signature.length < 1000) return;

    await fetch("/api/user/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        signature,
      }),
    });
  };

  const clearSignature = async () => {
    // Use SweetAlert for confirmation instead of native confirm
    showWarning(
      'ล้างลายเซ็น?',
      'คุณต้องการล้างลายเซ็นที่วาดไว้ใช่หรือไม่?',
      async () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        if (!user) return;

        await fetch("/api/user/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.userId,
            signature: null,
          }),
        });
        
        showSuccess('ล้างลายเซ็นแล้ว', 'ลายเซ็นถูกล้างเรียบร้อย');
      }
    );
  };

  /* ===== จัดการรายการ ===== */
  const addItemFromBucket = (bucketItem) => {
    const newSelectedItem = {
      id: Date.now(),
      name: bucketItem.name,
      quantity: 1,
      unitPrice: bucketItem.defaultPrice || 0,
      fromBucket: true
    };
    setSelectedItems([...selectedItems, newSelectedItem]);
    setShowBucketModal(false);
    
    // Show success toast
    MySwal.fire({
      icon: 'success',
      title: 'เพิ่มรายการแล้ว',
      text: `${bucketItem.name} ถูกเพิ่มเข้ารายการ`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  };

  const addNewItemToList = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.unitPrice) {
      return showError('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลรายการให้ครบ');
    }

    try {
      setAddingToApi(true);
      
      // Show loading
      MySwal.fire({
        title: 'กำลังบันทึก...',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      const res = await fetch("/api/bucket-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: newItem.name,
          unitPrice: Number(newItem.unitPrice),
          description: "",
          category: newItem.category,
          unit: newItem.unit
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error("ไม่สามารถบันทึกรายการลงใน Bucket");

      const bucketItem = {
        id: data.itemId,
        name: newItem.name,
        defaultPrice: Number(newItem.unitPrice),
        description: "",
        category: newItem.category,
        unit: newItem.unit,
        isActive: true
      };
      setBucketItems([...bucketItems, bucketItem]);

      const item = {
        id: Date.now(),
        name: newItem.name,
        quantity: Number(newItem.quantity),
        unitPrice: Number(newItem.unitPrice),
        fromBucket: true
      };
      setSelectedItems([...selectedItems, item]);
      setNewItem({ name: "", quantity: 1, unitPrice: "", category: "", unit: "" });
      setShowNewItemForm(false);
      
      MySwal.close();
      showSuccess('สำเร็จ', 'เพิ่มรายการไปยัง Bucket และการขอสำเร็จ');
    } catch (err) {
      console.error(err);
      MySwal.close();
      showError('เกิดข้อผิดพลาด', err.message || "เพิ่มรายการไม่สำเร็จ");
    } finally {
      setAddingToApi(false);
    }
  };

  const removeItem = (id) => {
    const itemToRemove = selectedItems.find(item => item.id === id);
    
    showWarning(
      'ลบรายการ?',
      `คุณต้องการลบ "${itemToRemove?.name}" ออกจากรายการใช่หรือไม่?`,
      () => {
        setSelectedItems(selectedItems.filter(item => item.id !== id));
        showSuccess('ลบรายการแล้ว');
      }
    );
  };

  const updateItemQuantity = (id, quantity) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, quantity: Number(quantity) } : item
    ));
  };

  const updateItemPrice = (id, price) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, unitPrice: Number(price) } : item
    ));
  };

  /* ===== จัดการไฟล์แนบ ===== */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024;
      
      if (!validTypes.includes(file.type)) {
        showError('ไฟล์ไม่รองรับ', `ไฟล์ ${file.name} ไม่รองรับ (รองรับเฉพาะ PNG, JPG, PDF)`);
        return false;
      }
      if (file.size > maxSize) {
        showError('ไฟล์ใหญ่เกินไป', `ไฟล์ ${file.name} มีขนาดใหญ่เกิน 10MB`);
        return false;
      }
      return true;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFiles(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        }]);
        
        // Show success for each file
        MySwal.fire({
          icon: 'success',
          title: 'อัพโหลดไฟล์แล้ว',
          text: file.name,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id) => {
    const fileToRemove = attachedFiles.find(file => file.id === id);
    
    showWarning(
      'ลบไฟล์แนบ?',
      `คุณต้องการลบไฟล์ "${fileToRemove?.name}" ใช่หรือไม่?`,
      () => {
        setAttachedFiles(attachedFiles.filter(file => file.id !== id));
        showSuccess('ลบไฟล์แล้ว');
      }
    );
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  /* ===== submit request ===== */
  const submitRequest = async () => {
    if (selectedItems.length === 0) {
      return showError('ไม่มีรายการ', 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
    }

    const signature = canvasRef.current.toDataURL("image/png");
    if (signature.length < 1000) {
      return showError('ไม่มีลายเซ็น', 'กรุณาเซ็นลายเซ็นก่อนส่งคำขอ');
    }

    // Confirmation before submit
    const result = await MySwal.fire({
      icon: 'question',
      title: 'ยืนยันการส่งคำขอ?',
      html: `
        <div class="text-left">
          <p><strong>ประเภท:</strong> ${type === 'purchase' ? 'จัดซื้อ' : 'จัดจ้าง'}</p>
          <p><strong>จำนวนรายการ:</strong> ${selectedItems.length} รายการ</p>
          <p><strong>ยอดรวม:</strong> ฿${totalAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ใช่, ส่งคำขอ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      
      // Show loading
      MySwal.fire({
        title: 'กำลังส่งคำขอ...',
        text: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: type,
          userId: user.userId,
          signature,
          items: selectedItems,
          attachedFiles: attachedFiles,
          totalAmount: totalAmount
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      MySwal.close();
      await showSuccess('ส่งคำขอสำเร็จ', 'คำขอถูกส่งไปยังผู้จัดการเรียบร้อยแล้ว');
      router.push("/dashboard");
    } catch {
      MySwal.close();
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 animate-ping mx-auto opacity-20" />
          </div>
          <p className="text-gray-600 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Navbar and rest of the JSX remains the same... */}
      {/* Copy the rest of your original JSX here */}
      
      {/* ===== Modern Navbar ===== */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/dashboard")}
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
                  PROGRESS C & E
                </h1>
                <p className="text-xs text-gray-500 font-medium">ระบบจัดซื้อ / จัดจ้าง</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                <p className="text-xs text-blue-600 font-medium">👤 ผู้ยื่นคำขอ</p>
              </div>
              <button
                onClick={() => {
                  showWarning(
                    'ออกจากระบบ?',
                    'คุณต้องการออกจากระบบใช่หรือไม่?',
                    () => {
                      localStorage.removeItem("user");
                      router.push("/login");
                    }
                  );
                }}
                className="px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-100 hover:border-red-200 hover:shadow-md"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== Content ===== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">ยื่นคำขอจัดซื้อ / จัดจ้าง</h2>
              <p className="text-gray-600">กรุณาเพิ่มรายการและกรอกข้อมูลให้ครบถ้วนเพื่อดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type Selection Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <span>📝</span>
                  <span>ประเภทคำขอ</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setType("purchase")}
                    className={`relative flex items-center justify-center space-x-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                      type === "purchase"
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      type === "purchase" ? "bg-blue-500" : "bg-gray-200"
                    }`}>
                      🛒
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">จัดซื้อ</p>
                      <p className="text-xs text-gray-500">Purchase Order</p>
                    </div>
                    {type === "purchase" && (
                      <div className="absolute top-3 right-3">
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setType("hire")}
                    className={`relative flex items-center justify-center space-x-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                      type === "hire"
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      type === "hire" ? "bg-blue-500" : "bg-gray-200"
                    }`}>
                      🤝
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">จัดจ้าง</p>
                      <p className="text-xs text-gray-500">Service Order</p>
                    </div>
                    {type === "hire" && (
                      <div className="absolute top-3 right-3">
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Items Management Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <span>🛍️</span>
                    <span>รายการสินค้า/บริการ</span>
                  </h3>
                  <span className="text-sm text-gray-600">
                    {selectedItems.length} รายการ
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBucketModal(true)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>🗂️</span>
                    <span>เลือกจาก Bucket</span>
                  </button>
                  <button
                    onClick={() => setShowNewItemForm(!showNewItemForm)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>➕</span>
                    <span>เพิ่มรายการใหม่</span>
                  </button>
                </div>

                {/* New Item Form */}
                {showNewItemForm && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                      <span>✏️</span>
                      <span>เพิ่มรายการใหม่ (บันทึกไปยัง Bucket โดยอัตโนมัติ)</span>
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อรายการ</label>
                      <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                        placeholder="ระบุชื่อสินค้า/บริการ..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                        <input
                          type="text"
                          value={newItem.category}
                          onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                          placeholder="เช่น วัสดุ, อุปกรณ์"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หน่วย</label>
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                          placeholder="เช่น ชุด, กระป๋อง, เมตร"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน</label>
                        <input
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ราคาต่อหน่วย</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.unitPrice}
                          onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={addNewItemToList}
                        disabled={addingToApi}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {addingToApi && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                        {addingToApi ? "กำลังบันทึก..." : "เพิ่มรายการ"}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewItemForm(false);
                          setNewItem({ name: "", quantity: 1, unitPrice: "", category: "", unit: "" });
                        }}
                        disabled={addingToApi}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Items List */}
                {selectedItems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                      <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-gray-800">{index + 1}.</span>
                              <span className="font-semibold text-gray-800">{item.name}</span>
                              {item.fromBucket && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                  📦 จาก Bucket
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">จำนวน</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">ราคา/หน่วย</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(item.id, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">รวม</label>
                            <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm font-semibold text-gray-800">
                              ฿{(item.quantity * item.unitPrice).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-gray-500 font-medium">ยังไม่มีรายการ</p>
                    <p className="text-gray-400 text-sm mt-1">เริ่มเพิ่มรายการสินค้า/บริการ</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Attachment Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <span>📎</span>
                  <span>ไฟล์แนบ</span>
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>เลือกไฟล์แนบ (PNG, JPG, PDF)</span>
                </button>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-2xl">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors ml-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Signature Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <span>✍️</span>
                  <span>ลายเซ็น</span>
                </h3>
              </div>

              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 hover:border-blue-400 transition-colors duration-200">
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={520}
                      height={160}
                      className="w-full cursor-crosshair"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 px-2">
                    <p className="text-xs text-gray-500 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>เซ็นชื่อในกรอบด้านบน</span>
                    </p>
                    <button
                      onClick={clearSignature}
                      className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>ล้างลายเซ็น</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Total Amount Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>💰</span>
                    <span>สรุปยอดรวม</span>
                  </h3>
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 mb-2">จำนวนเงินทั้งหมด</p>
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      ฿{totalAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedItems.length} รายการ
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    {selectedItems.map((item, index) => (
                      <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-600 truncate flex-1">
                          {index + 1}. {item.name}
                        </span>
                        <span className="font-semibold text-gray-800 ml-2">
                          ฿{(item.quantity * item.unitPrice).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={submitting || selectedItems.length === 0}
                    onClick={submitRequest}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform ${
                      submitting || selectedItems.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                        <span>กำลังส่งคำขอ...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>ยืนยันส่งคำขอ</span>
                      </span>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-3">
                    กดยืนยันเพื่อส่งคำขอไปยังผู้จัดการ
                  </p>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <span>💡</span>
                  <span>ข้อมูลเพิ่มเติม</span>
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>สามารถเพิ่มหลายรายการได้</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>แนบไฟล์ได้สูงสุด 10MB/ไฟล์</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>ต้องมีลายเซ็นก่อนส่งคำขอ</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bucket Modal */}
      {showBucketModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>🗂️</span>
                <span>เลือกรายการจาก Bucket</span>
              </h3>
              <button
                onClick={() => setShowBucketModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">กรองตามหมวดหมู่</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setBucketCategory("")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    bucketCategory === ""
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  ทั้งหมด
                </button>
                {[...new Set(bucketItems.map(i => i.category).filter(Boolean))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setBucketCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      bucketCategory === cat
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {bucketItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bucketItems
                    .filter(item => bucketCategory === "" || item.category === bucketCategory)
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => addItemFromBucket(item)}
                        className="text-left bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-2xl">📦</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{item.description || 'ไม่มีรายละเอียด'}</p>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">ราคาอ้างอิง</span>
                            <p className="font-bold text-blue-600">
                              ฿{Number(item.defaultPrice || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                            </p>
                          </div>
                          <div className="text-right">
                            {item.category && (
                              <p className="text-xs text-gray-600 font-medium">{item.category}</p>
                            )}
                            {item.unit && (
                              <p className="text-xs text-gray-500">{item.unit}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 font-medium text-lg">ยังไม่มีรายการใน Bucket</p>
                  <p className="text-gray-400 text-sm mt-2">ติดต่อผู้ดูแลระบบเพื่อเพิ่มรายการ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}