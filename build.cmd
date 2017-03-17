@echo off

echo Building src
call tsc -p "%~dp0src"

echo Building test
call tsc -p "%~dp0test"
