;~ #include "../au3/json.au3"

Func Sample($string, $num1, $num2)
	ConsoleWrite("This is a console message from AutoIt!" & @CRLF)
	
	;~ Return _JSON_Parse("{""string"":""" & $string & """,""num1"":" & $num1 & ",""num2"":" & $num2 & "}")
	Return "You passed in: " & $string & ", " & $num1 & ", " & $num2 & @CRLF & "The sum of the numbers is: " & ($num1 + $num2)
EndFunc
