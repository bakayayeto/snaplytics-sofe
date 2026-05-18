$env:JAVA_HOME='C:\Progra~1\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Set-Location 'C:\Users\Admin\Desktop\sofe-snaplytics\HeigenKiosk\android'
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "java.exe version:"
& "$env:JAVA_HOME\bin\java.exe" -version
Write-Host "Starting Gradle build..."
.\gradlew.bat clean assembleRelease --stacktrace
