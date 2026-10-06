<?php
// lead.php — captura de contactos de la calculadora de ROI de KEHO.
// Guarda cada contacto FUERA de public_html si se puede (../keho_leads.csv y .jsonl);
// si no, en datos/ (protegido con .htaccess). Avisa por email a KEHO y envía el
// reporte al visitante (best-effort con mail() del hosting).

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$OWNER_EMAIL = 'contacto.keho@gmail.com';
$PER_MIN = 5;
$PER_DAY = 40;

function out($arr) { echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function s($v, $max = 120) { return mb_substr(trim(is_scalar($v) ? (string) $v : ''), 0, $max); }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); out(['ok' => false, 'reason' => 'method']); }

// Guard de mismo origen
$host = strtolower($_SERVER['HTTP_HOST'] ?? '');
$srcv = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($srcv !== '') {
  $srcHost = strtolower((string) parse_url($srcv, PHP_URL_HOST));
  if ($srcHost === '' || $srcHost !== $host) { http_response_code(403); out(['ok' => false, 'reason' => 'origin']); }
}

// Límite por IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$now = time();
$rlFile = sys_get_temp_dir() . '/keho_lead_' . md5($ip) . '.json';
$stamps = is_file($rlFile) ? json_decode(@file_get_contents($rlFile), true) : [];
if (!is_array($stamps)) $stamps = [];
if (count(array_filter($stamps, function ($t) use ($now) { return $t > $now - 60; })) >= $PER_MIN) out(['ok' => false, 'reason' => 'rate']);
if (count(array_filter($stamps, function ($t) use ($now) { return $t > $now - 86400; })) >= $PER_DAY) out(['ok' => false, 'reason' => 'rate']);

// Entrada
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) $in = [];
$nombre = s($in['nombre'] ?? '', 80);
$email = s($in['email'] ?? '', 160);
$whatsapp = mb_substr(preg_replace('/[^0-9+\s\-()]/', '', (string) ($in['whatsapp'] ?? '')), 0, 24);
if ($nombre === '') out(['ok' => false, 'reason' => 'nombre']);
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) out(['ok' => false, 'reason' => 'email']);
if (empty($in['consent'])) out(['ok' => false, 'reason' => 'consent']);
$calc = is_array($in['calc'] ?? null) ? $in['calc'] : [];

$row = [
  'fecha'            => date('c'),
  'nombre'           => $nombre,
  'email'            => $email,
  'whatsapp'         => $whatsapp,
  'origen'           => s($in['origen'] ?? 'web', 40),
  'sector'           => s($calc['sector'] ?? '', 60),
  'horas_semana'     => isset($calc['horasSemana']) ? (float) $calc['horasSemana'] : null,
  'personas'         => isset($calc['personas']) ? (int) $calc['personas'] : null,
  'costo_hora_usd'   => isset($calc['costoHora']) ? (float) $calc['costoHora'] : null,
  'perdida_mes_usd'  => isset($calc['perdidaMes']) ? round((float) $calc['perdidaMes']) : null,
  'horas_total_sem'  => isset($calc['horasSemanaTotal']) ? (float) $calc['horasSemanaTotal'] : null,
  'min_con_keho_sem' => isset($calc['minutosConKeho']) ? (int) $calc['minutosConKeho'] : null,
  'ip'               => $ip,
];

// Guardar (fuera de public_html si se puede)
$stored = false;
foreach ([__DIR__ . '/..', __DIR__ . '/datos'] as $dir) {
  if (!is_dir($dir) || !is_writable($dir)) continue;
  $ok1 = @file_put_contents($dir . '/keho_leads.jsonl', json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;
  $csv = $dir . '/keho_leads.csv';
  $new = !is_file($csv);
  $fh = @fopen($csv, 'a');
  if ($fh) {
    if (flock($fh, LOCK_EX)) { if ($new) fputcsv($fh, array_keys($row)); fputcsv($fh, array_values($row)); flock($fh, LOCK_UN); }
    fclose($fh);
  }
  if ($ok1) { $stored = true; break; }
}

$stamps[] = $now;
@file_put_contents($rlFile, json_encode(array_slice(array_values($stamps), -200)), LOCK_EX);

// Emails (best-effort)
if (function_exists('mail')) {
  $from = 'no-reply@' . preg_replace('/^www\./', '', $host ?: 'keho.local');
  $headers = "From: KEHO <$from>\r\nReply-To: $OWNER_EMAIL\r\nContent-Type: text/plain; charset=utf-8";
  $perdida = $row['perdida_mes_usd'] !== null ? number_format($row['perdida_mes_usd'], 0, ',', '.') : '—';

  $aviso = "Nuevo contacto desde la calculadora de ROI:\n\n";
  foreach ($row as $k => $v) { $aviso .= str_pad($k, 18) . ': ' . ($v === null || $v === '' ? '—' : $v) . "\n"; }
  @mail($OWNER_EMAIL, '=?UTF-8?B?' . base64_encode('Nuevo lead KEHO — ' . $nombre) . '?=', $aviso, "From: KEHO Web <$from>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=utf-8");

  $reporte = "Hola $nombre,\n\nGracias por usar la calculadora de eficiencia de KEHO. Este es tu resumen:\n\n"
    . "- Sector: " . ($row['sector'] ?: '—') . "\n"
    . "- Horas semanales en tareas manuales (equipo): " . ($row['horas_total_sem'] ?? '—') . " h\n"
    . "- Pérdida estimada: $" . $perdida . " al mes\n"
    . "- Con KEHO, ese trabajo tomaría aprox.: " . ($row['min_con_keho_sem'] ?? '—') . " minutos por semana\n\n"
    . "Es una estimación orientativa. En una auditoría gratuita de 30 minutos revisamos tus procesos y te mostramos el ahorro real.\n\n"
    . "Agenda por WhatsApp: https://wa.me/584247006292\n\nEquipo KEHO\nIdeas que se convierten en soluciones.\n";
  @mail($email, '=?UTF-8?B?' . base64_encode('Tu reporte de eficiencia · KEHO') . '?=', $reporte, $headers);
}

out(['ok' => $stored]);
