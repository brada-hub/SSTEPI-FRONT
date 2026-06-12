<?php
header('Content-Type: text/plain');

echo "--- Diagnostic & System Log Viewer ---\n\n";

$appRoot = '/home/xpertiap/sstepi.xpertiaplus.com';

if (!file_exists($appRoot)) {
    $appRoot = __DIR__;
}

chdir($appRoot);

// 1. Display last 50 lines of stderr.log
$logFile = "$appRoot/stderr.log";
if (file_exists($logFile)) {
    echo "=== Content of stderr.log ===\n";
    $lines = file($logFile);
    $lastLines = array_slice($lines, -50);
    echo implode("", $lastLines);
    echo "=== End of stderr.log ===\n\n";
} else {
    echo "stderr.log file not found in $appRoot\n\n";
}

// 2. Touch restart.txt to force server reload
echo "Touching tmp/restart.txt to force server reload...\n";
if (!file_exists("$appRoot/tmp")) {
    mkdir("$appRoot/tmp", 0755, true);
}
touch("$appRoot/tmp/restart.txt");
echo "Done! The next page load will start a fresh Node.js process.\n";
