#3C log parser version 0.0.1
from types import SimpleNamespace
import re
import time
import datetime
logFile = open("Elan-UCM_MGC_0023_12_10_09_03_Thu_file#2491.log", 'r')
rawLogList = logFile.readlines()
logFile.close()

tGENERAL = 1
tSIP = 2

reTime='[01][0-9]|2[0-3]:[0-5][0-9]:[0-5][0-9]'
ipAddrPattern = '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'

#print(rawLogList[0])

mgcNode = SimpleNamespace(host='', ipAddress='a.b.c.d', version='', ucmVersion='')

#print (mgcNode.ipAddress)

parsedValues = re.split('[=,]', rawLogList[0])

mgcNode.host = parsedValues[1]
mgcNode.ipAddress = parsedValues[3]
#print(mgcNode.ipAddress)
mgcNode.version = parsedValues[6]
mgcNode.ucmVersion = parsedValues[10]
del rawLogList[0]
del rawLogList[0]
logList=[]
logCounter=0
logRecord=''
#print (mgcNode)
ifBody = False
logRecordBody=''
sipOnlyLogList = []
for record in rawLogList: 
    #print(logCounter, record)
    if(re.search(', L\d, |, error, |, warn, ', record)):
        logList.append(logRecord)
        parsedValues= record.split('\n')[0].split(',',3)
        #print (parsedValues[3])
        logRecord = SimpleNamespace(i = logCounter, time =  parsedValues[0], logLevel= parsedValues[1], thread = parsedValues[2], message = parsedValues[3], body='', recordType='')
        if (re.search(' tx sip=| rx sip=', record)):
            logRecord.recordType = tSIP
            #print(logRecord)
            sipOnlyLogList.append(logRecord)
        else:
            logRecord.recordType = tGENERAL
        pass
        logCounter+=1
    else:
        #print(record.split('\n')[0])
        logRecord.body+=record
    pass
pass
del logList[0]


#print(sipOnlyLogList[len(sipOnlyLogList)-2].body)

sipMessagesArray = []
#item = logList[133]
counter=0
for item in sipOnlyLogList:
    sipMessage = SimpleNamespace(direction='', method='', address='', requestLine='', sipCallId='',headerBody='')
    #print(item.i)
    sipMessage.requestLine = item.message.split('sip=')[1]
    sipMessage.method = sipMessage.requestLine.split(' sip:')[0]
    if (re.search('tx sip=',item.message)): 
        sipMessage.direction = 'tx'
    else:
        sipMessage.direction = 'rx'
        try:
            sipMessage.address = re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', item.message).group(0)
        except:
            sipMessage.address='0.0.0.0'
    pass
    sipMessage.sipCallId = item.body.split('Call-ID: ')[1].split('\n\n')[0]
    sipMessage.headerBody=item.body
    #sipMessagesArray.append(sipMessage)
    #print (counter, '->', sipMessage, '\n')
    counter+=1
    sipMessagesArray.append(sipMessage)
pass
