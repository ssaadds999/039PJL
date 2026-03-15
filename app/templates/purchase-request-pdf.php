<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: "TH Sarabun New";
    font-size: 16px;
    line-height: 1.4;
  }
  .title {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  td, th {
    border: 1px solid #000;
    padding: 6px;
  }
  .signature {
    margin-top: 40px;
    text-align: right;
  }
  .signature img {
    height: 80px;
  }
</style>
</head>

<body>

<div class="title">ใบคำขอจัดซื้อ / จัดจ้าง</div>

<table>
  <tr>
    <th width="30%">รหัสเอกสาร</th>
    <td><?= $doc['documentCode'] ?></td>
  </tr>
  <tr>
    <th>ผู้ยื่นคำขอ</th>
    <td><?= $doc['submitterName'] ?></td>
  </tr>
  <tr>
    <th>รายการ</th>
    <td><?= $doc['itemName'] ?></td>
  </tr>
  <tr>
    <th>จำนวน</th>
    <td><?= $doc['quantity'] ?></td>
  </tr>
  <tr>
    <th>ราคาต่อหน่วย</th>
    <td><?= number_format($doc['unitPrice'], 2) ?></td>
  </tr>
  <tr>
    <th>ยอดรวม</th>
    <td><?= number_format($doc['totalAmount'], 2) ?></td>
  </tr>
</table>

<div class="signature">
  <p>ลงชื่อผู้อนุมัติ</p>
  <?php if ($doc['managerSignature']) : ?>
    <img src="<?= $doc['managerSignature'] ?>">
  <?php endif; ?>
  <p>(<?= $doc['managerName'] ?? 'ผู้จัดการ' ?>)</p>
</div>

</body>
</html>
