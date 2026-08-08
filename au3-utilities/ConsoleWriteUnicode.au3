; The following functions fix the issue with UTF-8 characters not outputting in console window correctly
_ConsoleSetUTF8()
Func _ConsoleSetUTF8()
    ; 65001 is the code page for UTF-8
    Local $aResult = DllCall("kernel32.dll", "bool", "SetConsoleOutputCP", "uint", 65001)
    If @error Or Not $aResult[0] Then Return False
    Return True
EndFunc

Func _ConsoleWriteUnicode($sText, $appendLineFeed = True)
    ; Converts the string to UTF-8 binary and writes it to stdout
	; Without this, Unicode characters are converted to ANSI and lost
	ConsoleWrite(StringToBinary($sText & ($appendLineFeed ? @CRLF : ""), 4))
EndFunc