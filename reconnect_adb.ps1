Get-Process -Name adb -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
& adb.exe start-server
Start-Sleep -Seconds 2
& adb.exe connect 192.168.1.2:5555
Start-Sleep -Seconds 3
& adb.exe devices
