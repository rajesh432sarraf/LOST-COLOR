# Robust static file server for Temple of Red
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/"

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $rawUrl = $request.Url.LocalPath
            if ($rawUrl -eq "/" -or [string]::IsNullOrWhiteSpace($rawUrl)) { $rawUrl = "/index.html" }
            $cleanRelPath = $rawUrl.TrimStart('/').Replace('/', '\')
            $filePath = Join-Path $root $cleanRelPath

            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    default { "application/octet-stream" }
                }
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.LongLength
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $err = [System.Text.Encoding]::UTF8.GetBytes("File not found: $filePath")
                $response.ContentLength64 = $err.LongLength
                $response.OutputStream.Write($err, 0, $err.Length)
            }
        } catch {
            Write-Host "Error handling request: $_"
        } finally {
            $response.OutputStream.Flush()
            $response.Close()
        }
    }
} finally {
    $listener.Stop()
}
