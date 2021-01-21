'use strict';
var rawLogs;
var logFileName;
var ifFileOpened=false;
var linedLogs=[];

class LogRecords {
    constructor (id, type, time, level, message, sipMessage) {
        this.id=id;
        this.type=type;
        this.time=time;
        this.level=level;
        this.message=message;
        this.sipMessage=sipMessage;
    }
}

const mgcAddress = '10.25.11.10'; //потом надо сделать чтение из файла
var sipDialogs = new Map();

const sipMethodsRe = /REGISTER|INVITE|ACK|BYE|CANCEL|UPDATE|REFER|PRACK|SUBSCRIBE|NOTIFY|PUBLISH|MESSAGE|INFO|OPTIONS|SIP\/2.0 \d\d\d (.*)/;

var logRecordArray=[];
var sipMessagesArray = [];
document.getElementById("doParse").style.display="none";
document.getElementById("logsOutput").style.display="none";
document.getElementById("showSIPdialogs").style.display="none";
document.getElementById("sipDialogTab").style.display="none";

function sipOnlyFilterOn (){ //работает норма
    let allGeneral = document.getElementsByClassName('GEN');
    for (let item of allGeneral) {item.style.display = 'none';}
}

function sipOnlyFilterOff(){ //чета криво. после возвращения уезжает форматирование
    let allGeneral = document.getElementsByClassName('GEN');
    for (let item of allGeneral) {item.style.display = 'initial';}
}

function checkIfMgcLogs() {
    if (rawLogs.match(', MGC, version=') != null) {
        console.log(`File ${logFileName} is correct MGC log file`);
        return true;
    }
    else {
        console.log(`File ${logFileName} is not recognized as MGC log file`);
        return false;
    }
}

function getOpenFileDialog() {
    console.log('--OpenFile');
    let element = document.createElement('div');
    element.innerHTML = '<input type="file">';
    let fileInput = element.firstChild;
    
    fileInput.addEventListener('change', function() {
        let reader;
        let file = fileInput.files[0];
        logFileName = file.name;
        console.log(`Opened file: ${logFileName}`);
        reader = new FileReader();        
        reader.onload = () => {rawLogs = reader.result};
        reader.readAsText(file);    
        document.getElementById("openedFileName").textContent = logFileName;
        //ifFileOpened = checkIfMgcLogs(); //Разобраться с проверкой
        //console.log(ifFileOpened);
        makeVisible("doParse"); 
    });
    fileInput.click();
   
}

function mainMenuBrowseFileOnClick(){
    console.log('--Open gile click');
    console.log('Get open file dialog');
    getOpenFileDialog();

}

function makeVisible(itemId){
    document.getElementById(itemId).style.display = "initial";

}

function addTableData(text, id, klass, parent) {
    let item = document.createElement("TD");
    item.id = parent+id;
    item.className = klass;
    item.textContent = text;
    document.getElementById(parent).appendChild(item);
    return item.id;
}

function addTableRow(id, klass, parent) {
    let item = document.createElement("TR");
    item.id = id;
    item.className = klass;
    document.getElementById(parent).appendChild(item);
    return true;
}

function renderLogs(){
    console.log('--Rendering logs');
    for (let record of logRecordArray) {
        let id = record.id;
        let parentId = `log_${id}`;
        //addTableData(record.message,record.id,'cNum',')
        addTableRow(parentId,record.type,'logsOutput');
        addTableData(id,`${parentId}_num`,'cNum',`${parentId}`);
//        addTableData(record.type,`${parentId}_type`,'cType',`${parentId}`);
        addTableData(record.time,`${parentId}_time`,'cTime',`${parentId}`);
        addTableData(record.level,`${parentId}_level`,'cLevel',`${parentId}`);
        //let textContent = record.message;
        let textContent=`${record.message}${record.sipMessage}`.replace(/(\r\n)\1+/g,"$1");
        addTableData(textContent,`${parentId}_msg`,'cMessage',`${parentId}`);

    }
    document.getElementById("logsOutput").style.display="initial";
    document.getElementById("showSIPdialogs").style.display="initial";
    //document.getElementById("loader").style.display="none";
}

function renderSipDialogs(){
    console.log('--Rendering SIP dialogs');
    let sdIndex = 0;
    for(let key of sipDialogs.keys()){
        let id = key;
        addTableRow(id, 'SD', 'sipDialogTab');
        let currentRow = document.getElementById(id);
        currentRow.style.cursor = "pointer"
        /*document.getElementById(id)*/
        currentRow.onclick = function () {
            renderFlow(`${id}`);
        }
        addTableData(sdIndex,`${id}_num`,'dialogNum',`${id}`);
        addTableData(sipDialogs.get(key)[0].time,`${id}_time`,'dialogTime', `${id}`);
        addTableData(key,`${id}_sipCallId`,'dialogSipCallId', `${id}`);
        addTableData(sipDialogs.get(key)[0].method,`${id}_dialogMethod`,'dialogMethod', `${id}`);
        addTableData(sipDialogs.get(key)[0].from,`${id}_dialogFrom`,'dialogFrom', `${id}`);
        addTableData(sipDialogs.get(key)[0].to,`${id}_dialogTo`,'dialogTo', `${id}`);
        sdIndex++;
    }
    document.getElementById("sipDialogTab").style.display="initial";
}

var globalTemp;

function doParse(){
    console.log('--Parsing logs');
    

    linedLogs = rawLogs.split('\n'); //разбиваем большую строку на много маленьких
    linedLogs.shift();
    linedLogs.shift(); //некрасиво удаляем первые две строки (там инфа о системе)
    console.log(linedLogs.length);
    let counter=0;
    let logRecord;

    //console.log('Start parsing. Phase 1...');
    //let logRecord = new LogRecords(counter,'GEN');
    for (let line of linedLogs) { //парсим   
        //console.log(line);
        if (line.match(/, L\d, |, error, |, warn, /)!=null) {
            logRecord = new LogRecords(counter,'GEN', '', '', '', '');
            logRecordArray.push(logRecord);
            let parsedLine = line.split(', ');
            logRecord.time = parsedLine[0];
            logRecord.level = parsedLine[1];
            //console.log(parsedLine.slice(3).join(', '));
            logRecord.message = parsedLine.slice(3).join(', '); 
            //logRecord.sipMessage ='';
            if ((parsedLine[1]=='L2') &(line.match(/ tx sip=| rx sip=/)!=null)) {
            //if ((parsedLine[1]=='L2') & (line.includes(/ tx sip=| rx sip=/))) {
                console.log('Match SIP');
                logRecord.type='SIP';
            }
            counter++;
        }
        else {
            //console.log(line);
            logRecord.sipMessage+=`${line}\n`;
            logRecord.sipMessage.replace(/(\n)\1+/g,"$1");
        }
    }
    
}

function onOpenFile() {

}

function mainMenuDoParseOnClick(){
    console.log('--Parse clicked');
    let loader = document.getElementById("loader");
    //loader.style.display="block";
    doParse();
    renderLogs();
    document.getElementById("doParse").style.display = "none";
 }

 function filterLogsBy() {
     for (let item of logRecordArray){}
 }


class SipMessages  {
    constructor (id, type, method, time, direction, address, requestLine, from, to, sipCallId, sphereCallId, body){
        this.id = id;
        this.type = type;
        this.method = method;
        this.time = time;
        this.direction = direction;
        this.address = address;
        this.requestLine = requestLine;
        this.from = from;
        this.to = to;
        this.sipCallId = sipCallId;
        this.sphereCallId = sphereCallId;
        this.body = body;
    }
}

class SipDialog {
    constructor (method, time, sipCallId, sipMessage){
        this.method = method;
        this.time = time;
        this.sipCallId = sipCallId;
        this.sipMessage = sipMessage;
    }
}


function extractSipMessages(){
    console.log('--Sip message extracting')
    //let sipMessage = new SipMessages()
    for (let record of logRecordArray) {
        if (record.type == 'SIP'){
            let sipMessage = new SipMessages(record.id);
            sipMessage.direction = record.message.match(/tx sip=|rx sip=/)[0].split(' ')[0];
            //if (sipMessage.direction == 'tx'){
            sipMessage.address = record.message.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)[0];
            //}            else{}
            sipMessage.method = record.message.match(sipMethodsRe)[0];
            sipMessage.time = record.time;
            sipMessage.sipCallId = record.sipMessage.match(/Call-ID: (.*)/)[0].split('Call-ID: ')[1];
            sipMessage.requestLine = record.message.split(/x sip=|\n|undefined/)[1];
            sipMessage.from = record.sipMessage.split(/From: /)[1].split(/\n/)[0];
            sipMessage.to = record.sipMessage.split(/To: /)[1].split(/\n/)[0];
            sipMessage.body = record.sipMessage;
            sipMessage.sphereCallId = 'not_yet'
            sipMessagesArray.push(sipMessage);
        }
    }
    console.log('SIP messages extracted');
}

function createSipDialogs(){
    console.log('--Forming SIP dialogs');
    for (let message of sipMessagesArray) {
        if (sipDialogs.has(message.sipCallId)){
            sipDialogs.get(message.sipCallId).push(message);
        }
        else {
            sipDialogs.set(message.sipCallId, [message]);
        }
    }
    console.log('SIP dialogs created');
}

function mainMenuShowSipDialog(){
    console.log('--Show SIP clicked');
    extractSipMessages();
    createSipDialogs();
    renderSipDialogs();
}

function renderFlow(key) {
    console.log('--Rendering SIP Flows');
    try {
        document.getElementById('sipFlowTable').remove();
    }
    catch{
        console.log('Can\'t remove SipFlow.');
    }
    console.log (`Dialog selected: ${key}`);
    let selectedDialog = sipDialogs.get(key);
    let count={};
    console.log(selectedDialog);
    //selectedDialog.forEach(function(i) {count[i.address] = (count[i.address]||0) + 1;});
    selectedDialog.forEach(function(i) {count[i.address] = (count[i.address]||0) + 1;});
    let pointsNum = Object.keys(count).length;
    console.log(`Render flow for ${pointsNum} points`);
    let sipFlowArea = document.getElementById("sipFlowArea");

    //добоавляем таблицу
    let sipFlowTable = document.createElement("TABLE");
    sipFlowTable.id = "sipFlowTable";
    sipFlowArea.appendChild(sipFlowTable);
    
    //рисуем верхнюю строку 
    let sipFlowTableHeader = document.createElement("TR");
    sipFlowTable.appendChild(sipFlowTableHeader);
    let mgcCell = document.createElement("TH");
    mgcCell.textContent = `MGC: ${mgcAddress}`;
    let messageCell = document.createElement('TH');
    messageCell.textContent = 'Message';
    sipFlowTableHeader.appendChild(mgcCell);
    sipFlowTableHeader.appendChild(messageCell);

    let drownPoints=[];
    for (let item of selectedDialog) {
        let sipFlowTableLine = document.createElement("TR");
        sipFlowTableLine.id=`glid_${item.id}`;
        sipFlowTableLine.style.cursor = "pointer";
        //sipFlowTableLine.onclick = "sipFlowTableLineClick(this.getAttribute('id'))";
        sipFlowTableLine.onclick = function() {
            document.getElementById(`log_${item.id}`).scrollIntoView();
        }
        sipFlowTable.appendChild(sipFlowTableLine);
        if (!drownPoints.includes(item.address)) {
            let pointCell = document.createElement('TH');
            pointCell.textContent = item.address;
            sipFlowTableHeader.appendChild(pointCell);
            drownPoints.push(item.address);            
        }
        let mgcCell = document.createElement("TD");
        mgcCell.textContent = `|`;
        sipFlowTableLine.appendChild(mgcCell);
        let messageCell = document.createElement("TD");
        if (item.direction=='tx') { 
            messageCell.textContent = `>-----  ${item.method}  ----->`;
        }
        else {
            messageCell.textContent = `<-----  ${item.method}  -----<`;
        }        
        sipFlowTableLine.appendChild(messageCell);

//
        let pCell = document.createElement("TD");
        pCell.textContent = '|';
        sipFlowTableLine.appendChild(pCell);

    }

    sipFlowArea.appendChild(sipFlowTable);
    console.log(count); 
    //count.forEach (item => {
//        console.log(item.key, item.get(item.key));
  //  })
}

function sipFlowTableLineClick(id) {
    console.log('##SIP flow line clicked');
    document.getElementById(`log_${id}`).scrollIntoView();
}