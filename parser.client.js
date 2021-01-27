'use strict';
var rawLogs;
var logFileName;
var ifFileOpened=false;
var ifCorrect = true;
var linedLogs=[];

var systemInfo = {toString : function() {
    let res=[];
    for (let key in this) {
        res.push(`${key}: ${this[key]}`);
    }
    res.shift();
    return res.join('\n');
  }};

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

var sipDialogs = new Map();


const sipMethodsRe = /REGISTER|INVITE|ACK|BYE|CANCEL|UPDATE|REFER|PRACK|SUBSCRIBE|NOTIFY|PUBLISH|MESSAGE|INFO|OPTIONS|SIP\/2.0 \d\d\d (.*)/;

var logRecordArray=[];
var sipMessagesArray = [];
document.getElementById("doParse").style.display="none";
document.getElementById("logsOutput").style.display="none";
document.getElementById("showSIPdialogs").style.display="none";
document.getElementById("sipDialogTab").style.display="none";
document.getElementById("showSystemInfo").style.display="none";

function addElement(tag, parent, ...params){
    //console.log(tag);
    //console.log(parent);
    //console.log(params);
    let item = document.createElement(tag);
    for (let i = 0; i<params.length-1; i+=2) {
        console.log(`${params[i]}: ${params[i+1]}`);
        item[params[i]]=params[i+1];
    }
    document.getElementById(parent).appendChild(item);
}

function checkIfMgcLogs(raw) {
    //console.log(raw.split('\n')[0]); 
    if (raw.match(', MGC, version=') != null) {
        let line1=raw.split('\n')[0];
        let line2=raw.split('\n')[1];
        let l2 = line2.split(' ');
        systemInfo.host = line1.split(/host=|, ip/)[1];
        systemInfo.ipAddress = line1.split(/address=|, MGC/)[1];
        systemInfo.versionMGC = line1.split(/MGC, version=|, built/)[1];
        systemInfo.versionDB = line1.split(/DB version=|, 3C/)[1];
        systemInfo.version3C = line1.split(/3C system version=|, log/)[1];
        systemInfo.logDate = `${l2[2]} ${l2[3]} ${l2[5]}`;
        console.log(systemInfo);
        document.getElementById("si").textContent=systemInfo.toString();
        document.getElementById("si").style.whiteSpace="pre-line";
        return true;
    }
    else {
        //console.log(`File ${logFileName} is not recognized as MGC log file`);
        return false;
    }
}


function destroyElement(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
    elem.remove();
}
function getOpenFileDialog() {
    if (ifFileOpened){
        logRecordArray = [];
        rawLogs = ''
        sipMessagesArray = [];
        sipDialogs = new Map();
        //localStorage.setItem('ifNextOpen', true);
        //window.location.reload(); //идея нелоха но надо кликать второй раз чтоб открыть файл.
        
        makeInvisible("showSIPdialogs");
        makeInvisible("doParse");

        //сначала удаляем все нахер:
        //destroyElement(document.getElementById('logsOutput'));
        //document.getElementById('logsOutput').innerHTML = "";
        document.getElementById('logsOutput').remove();
        document.getElementById('sipDialogTab').remove();
        document.getElementById('sipFlowTable').remove();

        rawLogs = ''; 
        linedLogs = [];
        
        ifFileOpened = false; // и сбрасываем флаг

        
        //а теперь надо руками отрисовать таблицы взад и спрятать:
        addElement('table', 'allLogRecords', 'id', 'logsOutput', 'style.width', '100%');
        addElement('tr', 'logsOutput', 'id', 'logsOutHeader');
        addElement('th', 'logsOutHeader', 'class', 'cNum','textContent', '#');
        addElement('th', 'logsOutHeader', 'class', 'cTime','textContent', 'TIME');
        addElement('th', 'logsOutHeader', 'class', 'cLevel','textContent', 'LEVEL', 'style.width', '45px');
        addElement('th', 'logsOutHeader', 'class', 'cMessage','textContent', 'MESSAGE');
        makeInvisible('logsOutput');

        addElement('table', 'sipDialogs', 'id', 'sipDialogTab');
        addElement('tr', 'sipDialogTab', 'id', 'sipDialogsHeader');
        addElement('th', 'sipDialogsHeader', 'class', 'dialogNum','textContent', '#');
        addElement('th', 'sipDialogsHeader', 'class', 'dialogTime','textContent', 'Time');
        addElement('th', 'sipDialogsHeader', 'class', 'dialogSipCallId','textContent', 'SIP Call-ID');
        addElement('th', 'sipDialogsHeader', 'class', 'dialogMethod','textContent', 'Method');
        addElement('th', 'sipDialogsHeader', 'class', 'dialogFrom','textContent', 'From');
        addElement('th', 'sipDialogsHeader', 'class', 'dialogTo','textContent', 'To');
        makeInvisible('sipDialogTab');
        

    }
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
        reader.onload = () => {
            //let check = checkIfMgcLogs(reader.result);
            //console.log(`Correct MGC log file = ${check}`);
            if (!checkIfMgcLogs(reader.result)) {
                alert('Wrong file format');
                console.log(`Wrong MGC log file format`);
                ifCorrect = false;
            } else {
                rawLogs = reader.result;
                ifFileOpened=true;
                console.log(`Correct MGC log file. Ready for parsing.`)
                makeVisible("doParse");
                makeVisible("showSystemInfo") ; 
            }
            
            //console.log('sgd');
        };
        //console.log(checkIfMgcLogs(rawLogs));
        reader.readAsText(file);    
        document.getElementById("openedFileName").textContent = logFileName;
        //ifFileOpened = checkIfMgcLogs(); //Разобраться с проверкой
        //console.log(ifFileOpened);

    });
    fileInput.click();
    //checkIfMgcLogs(rawLogs);
}

function mainMenuBrowseFileOnClick(){
    console.log('--Open gile click');
    console.log('Get open file dialog');
    getOpenFileDialog();
    //console.log(rawLogs);
    
    //checkIfMgcLogs(rawLogs);
}

function makeVisible(itemId){
    document.getElementById(itemId).style.display = "initial";

}

function makeInvisible(itemId){
    document.getElementById(itemId).style.display = "none";
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
        addTableRow(parentId,record.type,'logsOutput');
        addTableData(id,`${parentId}_num`,'cNum',`${parentId}`);
        addTableData(record.time,`${parentId}_time`,'cTime',`${parentId}`);
        addTableData(record.level,`${parentId}_level`,'cLevel',`${parentId}`);
        let textContent=`${record.message}${record.sipMessage}`.replace(/(\r\n)\1+/g,"$1");
        addTableData(textContent,`${parentId}_msg`,'cMessage',`${parentId}`);

    }
    console.log('--End of rendering logs');
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
                //console.log('Match SIP');
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
    console.log('--End of parsing');
}

function onOpenFile() {

}

function mainMenuDoParseOnClick(){
    console.log('--Parse clicked');
    //console.log(rawLogs);
    //let loader = document.getElementById("loader");
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
    mgcCell.textContent = `MGC: ${systemInfo.ipAddress}`;
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