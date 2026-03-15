// lib/sweetalert.js
import Swal from 'sweetalert2';

// ตั้งค่า Default สำหรับภาษาไทย
export const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'btn btn-primary',
    cancelButton: 'btn btn-secondary',
    popup: 'rounded-xl',
  },
  buttonsStyling: false,
  confirmButtonText: 'ตกลง',
  cancelButtonText: 'ยกเลิก',
});

// ฟังก์ชันแจ้งเตือนสำเร็จ
export const showSuccess = (title, text) => {
  return MySwal.fire({
    icon: 'success',
    title: title || 'สำเร็จ!',
    text: text,
    timer: 2000,
    showConfirmButton: false,
    position: 'center',
    backdrop: `
      rgba(0,0,123,0.4)
      url("/images/nyan-cat.gif")
      left top
      no-repeat
    `
  });
};

// ฟังก์ชันแจ้งเตือนผิดพลาด
export const showError = (title, text) => {
  return MySwal.fire({
    icon: 'error',
    title: title || 'ผิดพลาด!',
    text: text,
    confirmButtonColor: '#ef4444',
  });
};

// ฟังก์ชันยืนยันการทำงาน
export const showConfirm = async (title, text) => {
  const result = await MySwal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ดำเนินการ!',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
  });
  return result.isConfirmed;
};