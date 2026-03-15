const createUser = async () => {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "newuser",
      password: "123456",
      fullName: "ผู้ใช้งานใหม่",
      role: "user", // admin | manager | user
    }),
  });

  const data = await res.json();

  if (data.success) {
    alert("✅ เพิ่มผู้ใช้เรียบร้อย");
  } else {
    alert("❌ เพิ่มผู้ใช้ไม่สำเร็จ");
  }
};
