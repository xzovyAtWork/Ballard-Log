let realmCount = main.getActionWindow().primitiveRequestRealm.realmCount;
let wbs = main.getActionWindow().primitiveRequestRealm.wbsId;
    
const headerObj = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/xml;charset=UTF-8",
    "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
}
const refUrl = `http://localhost:8080/~dbid/1651?a=properties&c=default&i=equipment&f=io_points&wbs=${wbs}&pageCount=1&lcount=0`;

//template function i.e. postReq(fans, 0); 0 is off, 1 is on
// function postReq(device, command = 0){
//     const body = `<MESSAGES channelId=\"publisher\" realmId=\"primitiveRequestRealm\"><MESSAGE messageTypeId=\"reqPrimitiveSubMessage\" consumerId=\"PrimitiveRegistrant\" messageId=\"primitiveMessageSubmit\" priority=\"1\" realmCount="${realmCount}" seqnum=\"13\"><BODY><PRIMITIVE_SUBMIT getFieldValues=\"true\" updateDeferredValues=\"true\" updateActionSet=\"true\" auditlog=\"Edit checkout for i/o points\" auditenabled=\"true\" auditdetails=\"\" cjDoCommit=\"true\" cjGetChangesFromCore=\"true\"><PRIMITIVE id="${device}"><![CDATA[${command}]]></PRIMITIVE></PRIMITIVE_SUBMIT></BODY></MESSAGE></MESSAGES>`;
//     return function(){
//         return fetch(`http://localhost:8080/_common/servlet/lvl5/msgservlet?wbs=${wbs}`, {
//             "headers": headerObj,
//             "referrer": refUrl,
//             "referrerPolicy": "strict-origin-when-cross-origin",
//             "body": body,
//             "method": "POST",
//             "mode": "cors",
//             "credentials": "include"
//         });
//     }
// };

const aContent = document.querySelector('.actionFrame').contentWindow.document.childNodes[1];
let lastPushed;

class Device{
    constructor(statusChildNode, name, commandChildNode = undefined, id =''){
        this.name = name;
        this.status = '';
        this.id = id;
        this.type = undefined
        this.checkedOut = false;
        this.active = false;
        if(!undefined){
            if(statusChildNode > 20 ){
                this.feedback = aContent.querySelector(`#bodyTable > tbody > tr:nth-child(${statusChildNode}) > td:nth-child(3)`).childNodes[0];
            } else if(!undefined) {
                this.feedback = aContent.querySelector(`#bodyTable > tbody > tr:nth-child(${statusChildNode}) > td:nth-child(3) > span.ControlNumberEdit-WidgetTextDisplay-base`)
            }
            if(commandChildNode){
                this.command = aContent.querySelector(`#bodyTable > tbody > tr:nth-child(${commandChildNode}) > td:nth-child(3)`).childNodes[0];
            }
        }
    }

    toggle(){
        if(this.command.textContent == 'Close' || this.command.textContent == 'Off'|| this.command.textContent == 'Disable'){
            this.postReq(1)
        }else if(this.command.textContent == "Open"|| this.command.textContent == 'On'|| this.command.textContent == 'Enable'){
            this.postReq(0)
        }
    }

    postReq(command = 0){
        if(command == 0){
            this.active = false
        }
        const body = `<MESSAGES channelId=\"publisher\" realmId=\"primitiveRequestRealm\"><MESSAGE messageTypeId=\"reqPrimitiveSubMessage\" consumerId=\"PrimitiveRegistrant\" messageId=\"primitiveMessageSubmit\" priority=\"1\" realmCount="${realmCount}" seqnum=\"13\"><BODY><PRIMITIVE_SUBMIT getFieldValues=\"true\" updateDeferredValues=\"true\" updateActionSet=\"true\" auditlog=\"Edit checkout for i/o points\" auditenabled=\"true\" auditdetails=\"\" cjDoCommit=\"true\" cjGetChangesFromCore=\"true\"><PRIMITIVE id="${this.id}"><![CDATA[${command}]]></PRIMITIVE></PRIMITIVE_SUBMIT></BODY></MESSAGE></MESSAGES>`;
        // return function(){
            return fetch(`http://localhost:8080/_common/servlet/lvl5/msgservlet?wbs=${wbs}`, {
                "headers": headerObj,
                "referrer": refUrl,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": body,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });
        // }
    };

    checkPrevious(){
        function between(num, target, range = 1.5){
            num = parseInt(num);
            target = parseInt(target);
            return num <= (target + range) && num >= (target - range) 
        }
        let validity = false;
        this.retrievedValues.forEach((e) => {
            if(between(this.feedback.textContent, e)){
                validity = true;
             }
        })
        return validity
    }
    
    getBinary(){
        this.type = 'binary';
        if(this.status !== this.feedback.textContent){
            this.status = this.feedback.textContent
            console.log(`${this.name} is ${this.status}`)
        }
    }

    getAnalog(){
        this.type = 'analog';
        function between(num, target, range = 2){
            num = parseInt(num);
            target = parseInt(target);
            return num <= (target + range) && num >= (target - range) 
        }
        if(between(this.feedback.textContent, this.command.textContent) && !this.checkPrevious()){
            this.valueChanged = true;
            setTimeout(()=>{
                this.retrievedValues.push(parseFloat(this.feedback.textContent))
                console.log(this.name,this.retrievedValues);
                lastPushed = this;
            }, 4000)
        }
    }


    retrievedValues = [];
    faulted = false;

    checkFault(){
        if(this.feedback.textContent < 0){
            console.log(`${this.name} faulted`);
            this.faulted = true;
        }
        if(this.faulted && this.feedback.textContent > 1){
            this.faulted = false;
            console.log(`${this.name} operational`)
        }
    }
    
    getStatus(){
        this.status = this.feedback.textContent;
    }
    clearRetrievedValues(){
        this.retrievedValues = [];
    }
}

let numberOfFans = 6, fanNames = [], fanObjList = [];
let floatNames = ['WOL', 'WHL', 'WLL'], floatObjList = [];

function createDevices(quantity = 1, childElement, arr, nameList){
    for(let i = 0; i < quantity; i++){
        arr[i] = new Device(childElement, nameList[i]);
        childElement++
    }
};

function populateFanStatusNames(){
    for(let i = 0; i < numberOfFans; i++){
        fanNames[i] = `SF${i + 1} status`;
    }
};
populateFanStatusNames();

createDevices(fanNames.length, 34, fanObjList, fanNames); //34
createDevices(3, 30, floatObjList, floatNames);

let faceDamper = new Device(8, 'Face Damper', 52,"prim_1975" );
let bypassDamper = new Device (9, 'Bypass Damper',53, "prim_2019");
let fillValve = new Device(27, 'Fill', 54, "prim_2061");
let drainValve = new Device(29, 'Drain', 55, "prim_2091");
let leak1 = new Device(25, 'MPDC Leak');
let leak2 = new Device(26, 'Mech. Gallery Leak Detector');
let conductivity = new Device(10, 'Conductivity');
let maTemp = new Device(11, 'M/A');
let saTemp = new Device(1, 'S/A') 
let rh1 = new Device(12, 'RH One');
let rh2 = new Device(13, 'RH Two');
let primary = new Device(42, 'UPS Primary Status')
let secondary = new Device(43, 'Secondary Status')
let vfd = new Device(16, 'VFD', 46, "prim_1709"); //speed command
let vfdHOA = new Device(40, 'VFD HOA', 58, "prim_2178"); // vfd enable
let vfdFault = new Device(41, 'VFD Fault');
let sump = new Device(33 ,'Pump Status', 57 ,"prim_2149");
let bleed = new Device(56, 'bleed',56 , "prim_2120");


let sensorList = [saTemp, maTemp, rh1, rh2, conductivity]
let binaryDeviceList = [floatObjList, fanObjList, fillValve, drainValve, leak1, leak2, primary, secondary, vfdFault, vfdHOA, sump];
let analogDeviceList = [bypassDamper, faceDamper, vfd];

(function fetchStatusOnLoad(){
    sensorList.forEach(e => {e.getStatus()})
    binaryDeviceList.slice(2).forEach(e => e.getStatus())
    faceDamper.getStatus();
    bypassDamper.getStatus();
    floatObjList.forEach((e) => {
        e.getStatus();
    })
    fanObjList.forEach((e) => {
        e.getStatus();
    })
    bypassDamper.getStatus();
    faceDamper.getStatus();
    fanObjList.forEach((e) => {
        e.getStatus();
    })
})()
let startDownload = confirm('start download?')
if(startDownload === true){
    invokeManualCommand('download');
}

let startBinaryPoll, startAnalogPoll;
clearInterval(startBinaryPoll);
clearTimeout(startAnalogPoll);

function pollSensors(){
    sensorList.forEach(e => e.checkFault())
}


function updatePreviousValue(){
    lastPushed.retrievedValues.pop();
    console.log(lastPushed.name,lastPushed.retrievedValues)
}

function pollBinary(){
    binaryDeviceList.slice(2).forEach(e => e.getBinary())
    floatObjList.forEach((e) => {
        e.getBinary();
    })
    fanObjList.forEach((e) => {
        e.getBinary();
    })
}

function pollAnalog(){
    bypassDamper.getAnalog()
    faceDamper.getAnalog()
    vfd.getAnalog()
}

startBinaryPoll = setInterval(() => {
    pollBinary();
}, 500);

startAnalogPoll = setTimeout(function analogFbks(){
    pollAnalog();
    startAnalogPoll = setTimeout(analogFbks, 6000);
}, 6000);

function showSensors(){
    sensorList.forEach(e => {e.getStatus(); console.log(e.name, e.status)});
    console.log(faceDamper.name, faceDamper.retrievedValues);
    console.log(bypassDamper.name, bypassDamper.retrievedValues);
}

function runBypass(){
    console.log("timer started at:", new Date().toLocaleString())
   return setTimeout(()=>{
        drainValve.postReq(0);
        sump.postReq(0);
        console.log("bypass test finished")
    }, 30 * 60000)
}

function setGPM(){
    bleed.postReq(1);
    sump.postReq(1);
   return setTimeout(()=>{bleed.postReq(); console.log("bleed off")}, 60000);
}

console.log('Polling Inputs...')

let stopButton = document.createElement('button');
    stopButton.textContent = 'Stop All';
    
let acceptButtonLow = document.createElement('button');
    acceptButtonLow.textContent = 'Accept';
    acceptButtonLow.style.margin = '0 1.5em';

let updatePreviousArrayButton = document.createElement('button');
    updatePreviousArrayButton.textContent = 'Update Previous Value';

stopButton.addEventListener('click', () =>{
    clearInterval(startBinaryPoll);
    clearTimeout(startAnalogPoll);
    console.log('stopped')   
})
updatePreviousArrayButton.addEventListener('click',()=>{
    updatePreviousValue();
})
acceptButtonLow.addEventListener('click', () => { handleAcceptButton()});
if(aContent.querySelector('#scrollContent > div').children.length < 2){
    aContent.querySelector("#scrollContent > div").append(stopButton);
    aContent.querySelector("#scrollContent > div").append(acceptButtonLow);
    aContent.querySelector("#scrollContent > div").append(updatePreviousArrayButton);
}
