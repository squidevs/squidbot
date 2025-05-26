@echo off
set /p project_name=Digite o nome do projeto:

echo.
echo Criando projeto Vue com Vite...
call npm create vite@latest %project_name% -- --template vue

cd %project_name%

echo.
echo Instalando dependências...
call npm install
call npm install bootstrap bootstrap-icons

echo.
echo Adicionando imports ao main.js...

REM Adiciona os imports ao topo do main.js
powershell -Command ^
  "$file = 'src\main.js';" ^
  "$lines = Get-Content $file;" ^
  "$bootstrap = 'import ''bootstrap/dist/css/bootstrap.min.css''';';" ^
  "$icons = 'import ''bootstrap-icons/font/bootstrap-icons.css''';';" ^
  "$js = 'import ''bootstrap/dist/js/bootstrap.bundle.min.js''';';" ^
  "($bootstrap, $icons, $js) + $lines | Set-Content $file"

echo.
echo Projeto %project_name% criado com sucesso!
echo Execute os comandos abaixo para rodar o projeto:
echo ----------------------------------------------
echo cd %project_name%
echo npm run dev
echo ----------------------------------------------

pause
