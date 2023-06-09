package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"

	tm "github.com/buger/goterm"
)

/*
type SipMessageCoordinates struct {
	start int
	end   int
}
*/

type SipMessage struct {
	message   string
	direction string
	address   string
	sipCallId string
	start     int
	end       int
	//coordinate SipMessageCoordinates
}

var sipMessages []SipMessage

//var sipMessageMap[][][]int

var sipMessagesCount int

type SipDialog struct {
	sipCallId     string
	messagesIndex []int
}

func (data *SipDialog) appendSipDialogMessageIndex(index int) {
	data.messagesIndex = append(data.messagesIndex, index)
}

func (data *SipDialog) setDialogId(callId string) {
	data.sipCallId = callId
}

var sipDialogs map[string]SipDialog

func extractSysInfo(line string) []string {
	var sysInfo []string
	separators := regexp.MustCompile("[=,]")
	res := separators.Split(line, -1)
	//fmt.Printf("%q\n", res)
	if len(res) < 5 {
		return nil
	}
	if res[4] != " MGC" {
		return nil
	} else {

		sysInfo = append(sysInfo, res[1])  // hostname
		sysInfo = append(sysInfo, res[3])  // IP address
		sysInfo = append(sysInfo, res[4])  // loged process
		sysInfo = append(sysInfo, res[10]) // version
		return sysInfo

	}
}

func getLineType(line string) int {
	sipLogPattern := "^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9]).([0-9][0-9][0-9])(.*)(x sip=)"
	regLogPattern := "^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9]).([0-9][0-9][0-9])"
	sysInfoPattern := "(host=)|(Opened )"

	found, _ := regexp.MatchString(sipLogPattern, line) //check if SIP log line
	if found {
		return 2
	}
	found, _ = regexp.MatchString(regLogPattern, line) //check if regular log line
	if found {
		return 1
	}
	found, _ = regexp.MatchString(sysInfoPattern, line) //check if system info line
	if found {
		return 0
	}
	return 3
}

func getMessagParams(line string) (string, string, string) {
	ipAddrPattern := regexp.MustCompile(`[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}`)
	directionPattern := regexp.MustCompile(`[rt]x`)
	delimeters := regexp.MustCompile("(x sip=)|(sip:)|(SIP/2.0)")
	tempResult := delimeters.Split(line, -1)
	var ipAddre string
	if len(ipAddrPattern.FindAllString(line, -1)) > 0 {
		ipAddre = ipAddrPattern.FindAllString(line, -1)[0]
	} else {
		ipAddre = ""
	}
	//fmt.Println(len(ipAddrPattern.FindAllString(line, -1)))
	if len(tempResult[1]) > 0 {
		return tempResult[1], ipAddre, directionPattern.FindAllString(line, -1)[0]
	} else {
		return tempResult[2], ipAddre, directionPattern.FindAllString(line, -1)[0]
	}

}

func getSipCallID(line string) (bool, string) {
	temRes := strings.Split(line, "Call-ID: ")
	if len(temRes) == 2 {
		return true, temRes[1]
	} else {
		return false, ""
	}
}

func buildSipDialogs() {
	//fmt.Printf("\\nSIP DIALOGS START:\n")
	for ind, mes := range sipMessages {
		_, exists := sipDialogs[mes.sipCallId]
		if exists {

			tempDialog := sipDialogs[mes.sipCallId]
			tempDialog.appendSipDialogMessageIndex(ind)
			sipDialogs[mes.sipCallId] = tempDialog

		} else {
			var tempDialog SipDialog
			tempDialog.setDialogId(mes.sipCallId)
			tempDialog.appendSipDialogMessageIndex(ind)
			sipDialogs[mes.sipCallId] = tempDialog
		}
	}
}

func readLogFile(filename string) (int, []string, []int) {
	//fmt.Println(filename)
	readFile, err := os.Open(filename)
	if err != nil {
		fmt.Println(err)
		return -1, nil, nil
	}
	fileScanner := bufio.NewScanner(readFile)
	fileScanner.Split(bufio.ScanLines)
	var logLines []string
	var lineTypes []int
	var line string
	var systemInfo []string
	currentLineNum := 0
	currentLineType := 0
	//previouseLineType := 0
	sipMessagesCount = 0
	sipFound := false
	//currentMessageStart := -1
	//currentMessageEnd := -1
	currentSipMessage := SipMessage{"", "", "", "", -1, -1}
	for fileScanner.Scan() {
		line = fileScanner.Text()

		//fmt.Println(currentLineNum, "+++", line)

		if len(line) > 0 {
			currentLineNum++ // moved from the end of if scope

			if currentLineNum == 0 {

				//fmt.Println(extractSysInfo(line))
				systemInfo = extractSysInfo(line)
				if systemInfo == nil {
					fmt.Println("Not an MGC log.")
					os.Exit(100)
				}
			}
			//fmt.Printf("%d === %s\n", currentLineNum, line)
			logLines = append(logLines, line)
			currentLineType = getLineType(line)
			lineTypes = append(lineTypes, currentLineType)

			switch currentLineType {
			case 1:
				//				fmt.Println(1)
				if sipFound {
					sipFound = false
					//currentMessageEnd = currentLineNum - 2     //take previouse line number. -2
					currentSipMessage.end = currentLineNum - 2 //take previouse line number. -2
					sipMessages = append(sipMessages, currentSipMessage)
				}
			case 2:
				//				fmt.Println(2)
				if sipFound {
					currentSipMessage.end = currentLineNum - 2 //take previouse line number. -2
					sipMessages = append(sipMessages, currentSipMessage)
					currentSipMessage.start = currentLineNum - 1
				} else {
					sipFound = true
					currentSipMessage.start = currentLineNum - 1
					currentSipMessage.message, currentSipMessage.address, currentSipMessage.direction = getMessagParams(line)
				}
			case 3:
				//				fmt.Println(3)
				//check if CallId
				ifCallID, callId := getSipCallID(line)
				if ifCallID {
					currentSipMessage.sipCallId = callId
				}
			}
			//fmt.Print
			//previouseLineType = currentLineType

			//fmt.Println(getLineType(line))

		}

	}

	return len(logLines), logLines, lineTypes
}

func printlnStrings(strings []string) {
	for _, v := range strings {
		fmt.Println(v)
	}
}

/*
	func getSipDialogs(lines []string, lineMap []int) {
		for i, v := range lineMap {
			//if
		}
	}
*/
func main() {
	var logLineAmount int
	var rawLogLines []string
	var logLineTypes []int
	tm.Clear()
	fmt.Println("3C log viewer CLI app. \nVersion BANANA")

	if len(os.Args) < 2 {
		fmt.Println("File name expecting: 3clv <log file name>")
	} else {
		fmt.Println("Parsing... ")
		logLineAmount, rawLogLines, logLineTypes = readLogFile(os.Args[1])
	}

	for i := 0; i < logLineAmount; i++ {
		tm.Clear()
		tm.MoveCursor(1, 1)
		fmt.Printf("%d: %d -> %s\n", i, logLineTypes[i], rawLogLines[i])
	}

	for i, v := range sipMessages {
		fmt.Println(i, " :> ", v)
	}
	sipDialogs = make(map[string]SipDialog)
	buildSipDialogs()

	for key, dialog := range sipDialogs {
		fmt.Println(key, ":")
		for _, messIndex := range dialog.messagesIndex {
			for i := sipMessages[messIndex].start; i <= sipMessages[messIndex].end; i++ {
				fmt.Println(rawLogLines[i])
			}
		}
	}
}
