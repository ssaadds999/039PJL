"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {

const router = useRouter();

const [mounted,setMounted] = useState(false);
const [user,setUser] = useState(null);
const [requests,setRequests] = useState([]);
const [activeTab,setActiveTab] = useState("overview");
const [loading,setLoading] = useState(true);

useEffect(()=>{
setMounted(true);
},[]);

useEffect(()=>{

if(!mounted) return;

const userData = localStorage.getItem("user");

if(!userData){
  router.push("/login");
  return;
}

try{

  const parsedUser = JSON.parse(userData);
  setUser(parsedUser);

  fetchDashboardData(parsedUser);

}catch{

  localStorage.removeItem("user");
  router.push("/login");

}


},[mounted,router]);

const fetchDashboardData = async(userData)=>{


try{

  setLoading(true);

  const res = await fetch(`/api/requests?role=${userData.role}&userId=${userData.userId}`);

  const data = await res.json();

  if(data.success){

    setRequests(data.requests);

  }

}catch(error){

  console.error(error);

}finally{

  setLoading(false);

}


};

const handleLogout = ()=>{


localStorage.removeItem("user");
router.push("/login");


};

const goToCreateRequest = ()=>{


router.push("/dashboard/create-request");


};

const goToRequestDetail = (id)=>{

if(!id) return;

router.push(`/dashboard/requests/${id}`);


};

const getStatusBadge = (status)=>({

pending:{
  label:"รออนุมัติ",
  color:"bg-yellow-100 text-yellow-700 border border-yellow-200"
},

approved:{
  label:"อนุมัติแล้ว",
  color:"bg-green-100 text-green-700 border border-green-200"
},

rejected:{
  label:"ปฏิเสธ",
  color:"bg-red-100 text-red-700 border border-red-200"
}


}[status] || {
label:"รออนุมัติ",
color:"bg-yellow-100 text-yellow-700 border border-yellow-200"
});

if(!mounted || loading){

return(

  <div className="min-h-screen flex items-center justify-center">

    <div className="text-center">

      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"/>

      <p>กำลังโหลดข้อมูล...</p>

    </div>

  </div>

);


}

if(!user) return null;

return(

<div className="min-h-screen bg-gray-50">

  {/* Navbar */}

  <nav className="bg-white shadow">

    <div className="max-w-7xl mx-auto px-4">

      <div className="flex justify-between items-center h-16">

        <h1 className="font-bold text-blue-600">
          PROGRESS C & E
        </h1>

        <div className="flex gap-4">

          <span>{user.fullName}</span>

          <button
            onClick={handleLogout}
            className="text-red-500"
          >
            ออกจากระบบ
          </button>

        </div>

      </div>

    </div>

  </nav>


  <div className="max-w-7xl mx-auto p-6">

    <h2 className="text-2xl font-bold mb-6">
      สวัสดี {user.fullName}
    </h2>


    {/* Tabs */}

    <div className="mb-6 flex gap-6">

      <button
        onClick={()=>setActiveTab("overview")}
        className={activeTab==="overview"?"text-blue-600 font-bold":""}
      >
        ภาพรวม
      </button>

      <button
        onClick={()=>setActiveTab("requests")}
        className={activeTab==="requests"?"text-blue-600 font-bold":""}
      >
        คำขอล่าสุด
      </button>

    </div>


    {activeTab==="overview" && (

      <div>

        {user.role==="user" && (

          <button
            onClick={goToCreateRequest}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            สร้างคำขอใหม่
          </button>

        )}

      </div>

    )}


    {activeTab==="requests" && (

      <div>

        <div className="flex justify-between mb-4">

          <h3 className="text-xl font-bold">
            คำขอล่าสุด
          </h3>

          {user.role==="user" && (

            <button
              onClick={goToCreateRequest}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              + สร้างคำขอ
            </button>

          )}

        </div>


        {requests.length>0 ?(

          <div className="overflow-x-auto">

            <table className="w-full border">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-left">รหัส</th>
                  <th className="p-3 text-left">รายการ</th>
                  <th className="p-3 text-left">จำนวนเงิน</th>
                  <th className="p-3 text-left">สถานะ</th>
                  <th className="p-3 text-left">วันที่</th>
                  <th className="p-3 text-left">การดำเนินการ</th>

                </tr>

              </thead>


              <tbody>

                {requests.map((req)=>(

                  <tr key={req.requestId} className="border-t">

                    <td className="p-3">
                      {req.requestId}
                    </td>

                    <td className="p-3">
                      {req.itemName || "-"}
                    </td>

                    <td className="p-3 font-semibold">

                      ฿{Number(req.totalAmount || 0)
                      .toLocaleString("th-TH",{
                        minimumFractionDigits:2
                      })}

                    </td>

                    <td className="p-3">

                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(req.status).color}`}>

                        {getStatusBadge(req.status).label}

                      </span>

                    </td>

                    <td className="p-3">

                      {req.created_at
                      ? new Date(req.created_at)
                      .toLocaleDateString("th-TH")
                      : "-"}

                    </td>

                    <td className="p-3">

                      <button
                        onClick={()=>goToRequestDetail(req.requestId)}
                        className="text-blue-600 hover:underline"
                      >
                        ดูรายละเอียด
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ):(

          <div className="text-center p-10 text-gray-500">

            ไม่มีคำขอ

          </div>

        )}

      </div>

    )}

  </div>

</div>


);

}
