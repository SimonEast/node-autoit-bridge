#include "../au3-utilities/json.au3"

ConsoleWrite(_JSON_Parse("3") & @CRLF)
ConsoleWrite(_JSON_Parse('"A"') & @CRLF)
ConsoleWrite(_JSON_Generate('A' & @CRLF & 'B') & @CRLF)

Func Sample($string, $num1, $num2)
	ConsoleWrite("This is a console message from AutoIt!" & @CRLF)
	
	;~ Return _JSON_Parse("{""string"":""" & $string & """,""num1"":" & $num1 & ",""num2"":" & $num2 & "}")
	Return "You passed in: " & $string & ", " & $num1 & ", " & $num2 & @CRLF & "The sum of the numbers is: " & ($num1 + $num2)
EndFunc

Func WrapString($string)
	Return "[[" & $string & "]]"
EndFunc

Func AddNumbers($num1, $num2)
	Return $num1 + $num2
EndFunc


;~ Local $result = WrapString(_JSON_Parse("""test 2"""))
;~ ConsoleWrite($result & @CRLF)
;~ ConsoleWrite("FUNCTION_OUTPUT_START" & _JSON_Generate($result) & "FUNCTION_OUTPUT_END")
   