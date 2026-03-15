
  <?php
    require "vendor/autoload.php";
    use Dompdf\Dompdf;

    $doc = {"requestId":2,"documentCode":"","submitterId":3,"itemName":"asd","quantity":1,"unitPrice":"123.00","totalAmount":"123.00","description":null,"requestType":"purchase","urgencyLevel":1,"expectedDate":null,"signature":"","status":"approved","submittedDate":"2026-02-04T08:21:53.000Z","managerSignature":null,"managerId":null,"submitterName":"ผู้ใช้งานทั่วไป","managerName":null};

    ob_start();
    include "templates/purchase-request-pdf.php";
    $html = ob_get_clean();

    $dompdf = new Dompdf();
    $dompdf->loadHtml($html, 'UTF-8');
    $dompdf->setPaper('A4');
    $dompdf->render();
    file_put_contents("output.pdf", $dompdf->output());
  ?>
  