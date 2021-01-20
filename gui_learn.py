import PySimpleGUI as sg
#sg.popup('Hello world!')

#event, values = sg.Window('Get filename example', [[sg.Text('Filename')], [sg.Input(), sg.FileBrowse()],[sg.OK(), sg.Cancel()]]).read(close=True)
#print (sg)
sg.theme('Default')
layout = [  [sg.Text('Filename')],
            [sg.Input(), sg.FileBrowse()],
            [sg.OK(), sg.Cancel()]]

window = sg.Window('Get filename example', layout)

event, values = window.read()

print  (event)
window.close()


