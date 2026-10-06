<?php
// setup.php — activar la clave de Google Gemini del asistente UNA sola vez, desde el navegador.
// La clave se valida con Google y se guarda en el servidor (fuera de public_html si es posible).
// Nunca se muestra ni se registra. Borra este archivo cuando termines.

$G_OUT = __DIR__ . '/../gemini_api_key.php';
$G_IN  = __DIR__ . '/secret_config.php';

function read_key($out, $in) {
  $k = '';
  if (is_file($out)) { $v = @include $out; if (is_string($v)) $k = trim($v); }
  if ($k === '' && is_file($in)) { $v = @include $in; if (is_string($v)) $k = trim($v); }
  return $k;
}
function write_key($out, $in, $key) {
  $content = "<?php return '" . str_replace("'", "\'", $key) . "';\n";
  if (@file_put_contents($out, $content) !== false) return true;
  return (@file_put_contents($in, $content) !== false);
}
function validate_gemini($key) {
  if (!function_exists('curl_init')) return false;
  $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models?key=' . urlencode($key));
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
  $r = curl_exec($ch); $c = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ($r !== false && $c === 200);
}

$gkey = read_key($G_OUT, $G_IN);
$gSet = ($gkey !== '' && $gkey !== 'TU_CLAVE_AQUI');
$msg = ''; $tone = 'info';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  if ($gSet) { $msg = 'La clave ya estaba configurada. Por seguridad no se puede cambiar desde aquí.'; }
  else {
    $k = trim((string) ($_POST['gemini_key'] ?? ''));
    if ($k === '' || (strpos($k, 'AIza') !== 0 && strpos($k, 'AQ.') !== 0) || strlen($k) > 200) { $msg = 'La clave debe empezar por «AIza» o «AQ.». Revísala.'; $tone = 'warn'; }
    elseif (!validate_gemini($k)) { $msg = 'No he podido validar la clave con Google. Revisa que esté bien copiada.'; $tone = 'warn'; }
    elseif (write_key($G_OUT, $G_IN, $k)) { $gSet = true; $msg = '¡Clave activada! El asistente ya responde con IA.'; $tone = 'ok'; }
    else { $msg = 'La clave es válida pero no se pudo guardar (permisos del servidor).'; $tone = 'warn'; }
  }
}
?><!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Configurar asistente · KEHO</title>
<style>
  :root{--bg:#030507;--ink:#eef4ff;--mut:#8794ab;--c:#18b6ff;--brd:rgba(255,255,255,.12)}
  *{box-sizing:border-box;margin:0}
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:
    radial-gradient(45% 45% at 15% 12%,rgba(36,87,255,.3),transparent 60%),
    radial-gradient(45% 45% at 85% 80%,rgba(25,230,166,.18),transparent 62%),var(--bg);
    color:var(--ink);min-height:100vh;display:grid;place-items:center;padding:24px;line-height:1.6}
  .box{width:100%;max-width:460px;background:rgba(255,255,255,.04);border:1px solid var(--brd);border-radius:22px;padding:30px;backdrop-filter:blur(18px)}
  h1{font-size:1.4rem;margin-bottom:6px}
  .sub{color:var(--mut);font-size:.94rem;margin-bottom:18px}
  .sub a{color:var(--c)}
  input{width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--brd);background:rgba(3,5,7,.6);color:var(--ink);font:inherit}
  input:focus{outline:none;border-color:var(--c)}
  button{width:100%;margin-top:10px;padding:12px;border:0;border-radius:999px;cursor:pointer;font-weight:700;color:#00121c;background:linear-gradient(115deg,#2457ff,#18b6ff,#19e6a6)}
  .msg{margin-top:14px;padding:11px 13px;border-radius:11px;font-size:.9rem;border:1px solid var(--brd)}
  .ok{background:rgba(25,230,166,.12);border-color:rgba(25,230,166,.4)}
  .warn{background:rgba(255,180,80,.12);border-color:rgba(255,180,80,.35)}
  .info{color:var(--mut)}
</style>
</head>
<body>
  <main class="box">
    <h1>Asistente KEHO · Configuración</h1>
    <?php if (!$gSet): ?>
      <p class="sub">Pega aquí tu clave gratuita de Google Gemini (empieza por <b>AIza…</b> o <b>AQ.…</b>). La consigues en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>. Se guarda en el servidor y nunca se muestra a los visitantes.</p>
      <form method="post" autocomplete="off">
        <input name="gemini_key" type="password" placeholder="AIza..." required>
        <button type="submit">Activar asistente</button>
      </form>
    <?php else: ?>
      <div class="msg ok">✅ El asistente ya está configurado. Puedes borrar <b>setup.php</b> del servidor.</div>
    <?php endif; ?>
    <?php if ($msg): ?><div class="msg <?php echo $tone; ?>"><?php echo htmlspecialchars($msg, ENT_QUOTES, 'UTF-8'); ?></div><?php endif; ?>
  </main>
</body>
</html>
