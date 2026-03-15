<?php
require __DIR__ . '/../../vendor/autoload.php';

use Mpdf\Mpdf;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;

/* ===== args ===== */
$id = $argv[1] ?? null;
$output = $argv[2] ?? null;
if (!$id || !$output) exit("Missing args");

/* ===== Supabase Config ===== */
$supabaseUrl = getenv('NEXT_PUBLIC_SUPABASE_URL') ?: 'https://your-project.supabase.co';
$supabaseKey = getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?: 'your-anon-key';

/* ===== data ===== */
function supabaseQuery($table, $params = []) {
    global $supabaseUrl, $supabaseKey;
    $url = $supabaseUrl . '/rest/v1/' . $table . '?' . http_build_query($params);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json'
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

$data = supabaseQuery('purchase_requests', [
    'requestId' => 'eq.' . $id,
    'select' => '*,users!submitterId(fullName)'
]);

if (!$data || count($data) === 0) exit("Not found");

$r = $data[0];

/* ===== parse items ===== */
$items = [];
if (!empty($r['itemsJson'])) {
    $decoded = json_decode($r['itemsJson'], true);
    $items = is_array($decoded) ? $decoded : [];
}
if (empty($items)) {
    // fallback: create single item from legacy columns
    $items = [[
        'name' => $r['itemName'],
        'quantity' => (int)$r['quantity'],
        'unitPrice' => (float)$r['unitPrice']
    ]];
}

/* ===== prefix ===== */
$prefix = $r['requestType'] === 'purchase' ? 'ซื้อ' : 'จ้าง';

/* ===== base64 → JPG (ตัด alpha) ===== */
function saveSignJpg($b64, $name) {
    if (!$b64) return null;

    if (!preg_match('/base64,/', $b64)) {
        return null;
    }

    $raw = base64_decode(substr($b64, strpos($b64, ',') + 1));
    if (!$raw) return null;

    $im = imagecreatefromstring($raw);
    if (!$im) return null;

    $w = imagesx($im);
    $h = imagesy($im);

    // พื้นหลังขาว
    $bg = imagecreatetruecolor($w, $h);
    $white = imagecolorallocate($bg, 255, 255, 255);
    imagefill($bg, 0, 0, $white);
    imagecopy($bg, $im, 0, 0, 0, 0, $w, $h);

    $path = sys_get_temp_dir() . "/{$name}.jpg";
    imagejpeg($bg, $path, 90);

    imagedestroy($im);
    imagedestroy($bg);

    return str_replace('\\', '/', $path);
}

$userSignPath    = saveSignJpg($r['signature'], "user_sign_$id");
$managerSignPath = saveSignJpg($r['managerSignature'], "mgr_sign_$id");

/* ===== mPDF ===== */
$defaultConfig = (new ConfigVariables())->getDefaults();
$fontDirs = $defaultConfig['fontDir'];
$fontData = (new FontVariables())->getDefaults()['fontdata'];

$mpdf = new Mpdf([
    'fontDir' => array_merge($fontDirs, [__DIR__ . '/fonts']),
    'fontdata' => $fontData + [
        'thsarabun' => [
            'R'  => 'THSarabunNew.ttf',
            'B'  => 'THSarabunNew-Bold.ttf',
            'I'  => 'THSarabunNew-Italic.ttf',
            'BI' => 'THSarabunNew-BoldItalic.ttf',

/* ===== parse items ===== */
$items = [];
if (!empty($r['itemsJson'])) {
    $decoded = json_decode($r['itemsJson'], true);
    $items = is_array($decoded) ? $decoded : [];
}
if (empty($items)) {
    // fallback: create single item from legacy columns
    $items = [[
        'name' => $r['itemName'],
        'quantity' => (int)$r['quantity'],
        'unitPrice' => (float)$r['unitPrice']
    ]];
}

/* ===== prefix ===== */
$prefix = $r['requestType'] === 'purchase' ? 'ซื้อ' : 'จ้าง';

/* ===== base64 → JPG (ตัด alpha) ===== */
function saveSignJpg($b64, $name) {
    if (!$b64) return null;

    if (!preg_match('/base64,/', $b64)) {
        return null;
    }

    $raw = base64_decode(substr($b64, strpos($b64, ',') + 1));
    if (!$raw) return null;

    $im = imagecreatefromstring($raw);
    if (!$im) return null;

    $w = imagesx($im);
    $h = imagesy($im);

    // พื้นหลังขาว
    $bg = imagecreatetruecolor($w, $h);
    $white = imagecolorallocate($bg, 255, 255, 255);
    imagefill($bg, 0, 0, $white);
    imagecopy($bg, $im, 0, 0, 0, 0, $w, $h);

    $path = sys_get_temp_dir() . "/{$name}.jpg";
    imagejpeg($bg, $path, 90);

    imagedestroy($im);
    imagedestroy($bg);

    return str_replace('\\', '/', $path);
}

$userSignPath    = saveSignJpg($r['signature'], "user_sign_$id");
$managerSignPath = saveSignJpg($r['managerSignature'], "mgr_sign_$id");

/* ===== mPDF ===== */
$defaultConfig = (new ConfigVariables())->getDefaults();
$fontDirs = $defaultConfig['fontDir'];
$fontData = (new FontVariables())->getDefaults()['fontdata'];

$mpdf = new Mpdf([
    'fontDir' => array_merge($fontDirs, [__DIR__ . '/fonts']),
    'fontdata' => $fontData + [
        'thsarabun' => [
            'R'  => 'THSarabunNew.ttf',
            'B'  => 'THSarabunNew-Bold.ttf',
            'I'  => 'THSarabunNew-Italic.ttf',
            'BI' => 'THSarabunNew-BoldItalic.ttf',
        ]
    ],
    'default_font' => 'thsarabun',
    'format' => 'A4',
]);

/* ===== HTML ===== */
$html = "
<style>
body { font-size:16pt; }
table { width:100%; border-collapse:collapse; }
th,td { padding:6px; }
.border th,.border td { border:1px solid #000; }
.center { text-align:center; }
.right { text-align:right; }
.title { font-size:22pt; font-weight:bold; }
</style>

<div class='center title'>แบบฟอร์มคำขอ{$prefix}</div><br>

<table>
<tr><td></td><td class='right'><b>เลขที่คำขอ:</b> {$r['requestId']}</td></tr>
<tr><td></td><td class='right'><b>ผู้ยื่นคำขอ:</b> {$r['submitterName']}</td></tr>
<tr><td></td><td class='right'><b>วันที่ยื่น:</b> {$r['submittedDate']}</td></tr>
</table>

<br>

<table class='border'>
<tr class='center'>
  <th width='5%'>#</th>
  <th width='45%'>รายการ</th>
  <th width='10%'>จำนวน</th>
  <th width='20%'>ราคาต่อหน่วย</th>
  <th width='20%'>รวม</th>
</tr>
";

$rowNum = 1;
$totalSum = 0;
foreach ($items as $item) {
    $itemQty = is_array($item) ? ($item['quantity'] ?? 1) : 1;
    $itemPrice = is_array($item) ? ($item['unitPrice'] ?? 0) : 0;
    $itemName = is_array($item) ? ($item['name'] ?? '') : $item;
    $itemSubtotal = $itemQty * $itemPrice;
    $totalSum += $itemSubtotal;
    
    $html .= "<tr>
    <td class='center'>{$rowNum}</td>
    <td>{$prefix} {$itemName}</td>
    <td class='center'>{$itemQty}</td>
    <td class='right'>".number_format($itemPrice, 2)."</td>
    <td class='right'>".number_format($itemSubtotal, 2)."</td>
  </tr>
  ";
    $rowNum++;
}

$html .= "<tr>
  <td colspan='4' class='right'><b>ยอดรวมทั้งสิ้น</b></td>
  <td class='right'><b>".number_format($totalSum, 2)."</b></td>
</tr>
</table>

<br><br>

<table width='100%'>
<tr>
  <td class='center'>
    ".($userSignPath ? "<img src='file:///$userSignPath' width='160'><br>" : "")."
    _______________________<br>ผู้ยื่นคำขอ
  </td>
  <td class='center'>
    ".($managerSignPath ? "<img src='file:///$managerSignPath' width='160'><br>" : "")."
    _______________________<br>ผู้อนุมัติ
  </td>
</tr>
<tr>
  <td></td>
  <td class='right'><b>วันที่อนุมัติ:</b> {$r['approvedAt']}</td>
</tr>
</table>
";

$mpdf->WriteHTML($html);
$mpdf->Output($output, 'F');

/* ===== cleanup ===== */
if ($userSignPath) unlink($userSignPath);
if ($managerSignPath) unlink($managerSignPath);
