import PySimpleGUI as sg
import sys

#sg.theme('Black')
layout = [
    [sg.Text('Log file'), sg.InputText(), sg.FileBrowse()
     ],
#    [sg.Text('XML file'), sg.InputText(), sg.FileBrowse()
#    ],
    [sg.Output()],
    [sg.Submit(), sg.Exit()]
]
window = sg.Window('3C MGC logs parser', layout)


while True:  # Event Loop
    event, values = window.read()
    #print(event, values)
    if event == sg.WIN_CLOSED or event == 'Exit':
        break
    if event == 'Submit':
        #print(values['Browse'])
        logFile = open (values['Browse'])
        rawLogList = logFile.readlines()
        logFile.close()
        #print(rawLogList)
        for line in rawLogList:
            print(line)
        pass
        

window.close()