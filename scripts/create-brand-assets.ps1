Add-Type -AssemblyName System.Drawing
function Write-Card([int]$width,[int]$height,[string]$path,[bool]$share) {
  $bitmap=[System.Drawing.Bitmap]::new($width,$height)
  $g=[System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode='AntiAlias'
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#221b35'))
  $gold=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#ffcd78'))
  $cream=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#fff0d6'))
  $clay=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#c87c52'))
  $x=if($share){880}else{$width/2};$y=$height*.57;$r=if($share){135}else{$width*.31}
  $g.FillEllipse($clay,[single]($x-$r),[single]$y,[single]($r*2),[single]($r*.72))
  $g.FillEllipse($gold,[single]($x-$r),[single]($y-$r*.12),[single]($r*2),[single]($r*.32))
  $g.FillEllipse($cream,[single]($x-$r*.18),[single]($y-$r*1.1),[single]($r*.36),[single]($r*.95))
  if($share){
    $font=[System.Drawing.Font]::new('Georgia',62)
    $small=[System.Drawing.Font]::new('Segoe UI',23)
    $g.DrawString('Little Lights',$font,$cream,65,170)
    $g.DrawString('Your Diwali Adventure',$small,$gold,70,285)
    $g.DrawString('A little wonder. A lot of joy.',$small,$cream,70,355)
    $font.Dispose();$small.Dispose()
  }
  $bitmap.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$bitmap.Dispose();$gold.Dispose();$cream.Dispose();$clay.Dispose()
}
Write-Card 1200 630 "$PWD/public/share-card.png" $true
Write-Card 180 180 "$PWD/public/apple-touch-icon.png" $false
Write-Card 192 192 "$PWD/public/icon-192.png" $false
Write-Card 512 512 "$PWD/public/icon-512.png" $false
