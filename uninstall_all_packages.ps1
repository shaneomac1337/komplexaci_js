# For Windows PowerShell
python -m pip freeze | Where-Object {$_ -notmatch '^-e' -and $_ -notmatch 'pip' -and $_ -notmatch 'setuptools'} | ForEach-Object {python -m pip uninstall -y $_.Split('==')[0]}