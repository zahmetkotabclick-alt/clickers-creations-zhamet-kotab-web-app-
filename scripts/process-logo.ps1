Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\hp\.gemini\antigravity-ide\brain\f29a1928-33d3-4aab-9478-7c0419cb86fc\.user_uploaded\media_1793105542433.jpg"
$outputPath = "e:\zahmet kotab website\Clickers-Premium\artifacts\clickers\public\logo.png"
$distOutputPath = "e:\zahmet kotab website\Clickers-Premium\artifacts\clickers\dist\logo.png"

$orig = [System.Drawing.Bitmap]::FromFile($inputPath)
$width = $orig.Width
$height = $orig.Height

Write-Output "Image loaded: ${width}x${height}"

# Create a 32-bit ARGB bitmap for transparency
$bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Lock bits for fast pixel processing
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$origBmp = New-Object System.Drawing.Bitmap($orig)
$origData = $origBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$destData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytesCount = [Math]::Abs($origData.Stride) * $height
$origBuffer = New-Object byte[] $bytesCount
$destBuffer = New-Object byte[] $bytesCount

[System.Runtime.InteropServices.Marshal]::Copy($origData.Scan0, $origBuffer, 0, $bytesCount)

# Bounding box tracking for autocrop
$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

for ($y = 0; $y -lt $height; $y++) {
    $rowStart = $y * $origData.Stride
    for ($x = 0; $x -lt $width; $x++) {
        $idx = $rowStart + ($x * 4)
        $b = [int]$origBuffer[$idx]
        $g = [int]$origBuffer[$idx + 1]
        $r = [int]$origBuffer[$idx + 2]
        
        # Check how close to pure white (background) this pixel is
        # White background in JPG has slight compression artifacts (e.g. 240-255)
        # Background is nearly neutral white: R > 235, G > 235, B > 235 and low color difference
        $minC = [Math]::Min($r, [Math]::Min($g, $b))
        $maxC = [Math]::Max($r, [Math]::Max($g, $b))
        $diff = $maxC - $minC

        # Gold logo is saturated (R > G > B, e.g. R ~ 255, G ~ 200, B ~ 30)
        # So diff > 25 even on light gold highlights!
        # Background is white/near-white: minC >= 238 and diff <= 15
        if ($minC -ge 248 -and $diff -le 10) {
            # Completely transparent
            $destBuffer[$idx] = 0
            $destBuffer[$idx + 1] = 0
            $destBuffer[$idx + 2] = 0
            $destBuffer[$idx + 3] = 0
        } elseif ($minC -ge 232 -and $diff -le 16) {
            # Antialiasing smooth fade
            $alphaRatio = (255 - $minC) / (255 - 232)
            $alpha = [byte][Math]::Max(0, [Math]::Min(255, [int](255 * $alphaRatio)))
            $destBuffer[$idx] = [byte]$b
            $destBuffer[$idx + 1] = [byte]$g
            $destBuffer[$idx + 2] = [byte]$r
            $destBuffer[$idx + 3] = $alpha

            if ($alpha -gt 30) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        } else {
            # Foreground logo pixel
            $destBuffer[$idx] = [byte]$b
            $destBuffer[$idx + 1] = [byte]$g
            $destBuffer[$idx + 2] = [byte]$r
            $destBuffer[$idx + 3] = 255

            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($destBuffer, 0, $destData.Scan0, $bytesCount)

$origBmp.UnlockBits($origData)
$bmp.UnlockBits($destData)
$orig.Dispose()
$origBmp.Dispose()

Write-Output "Logo bounding box: ($minX, $minY) to ($maxX, $maxY)"

# Crop tightly with a small 10px padding around the logo so it renders large and clear in the navbar
$pad = 12
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($height - $cropY, ($maxY - $minY) + ($pad * 2))

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$croppedBmp = $bmp.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bmp.Dispose()

# Save as transparent PNG
$croppedBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Save($distOutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Output "Transparent logo saved to: $outputPath and $distOutputPath"
