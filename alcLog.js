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
const aContent = document.querySelector('.actionFrame').contentWindow.document.childNodes[1];
let lastPushed;

class Device{
    constructor(statusChildNode, name, commandChildNode = undefined, id =''){
        this.name = name;
        this.status = '';
        this.id = id;
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
    retrievedValues = [];
    faulted = false;
    toggle(){
        if(this.command.textContent == 'Close' || this.command.textContent == 'Off'|| this.command.textContent == 'Disable'){
            this.postReq(1)
        }else {
            this.postReq(0)
        }
    }
    postReq(command = 0){
        const body = `<MESSAGES channelId=\"publisher\" realmId=\"primitiveRequestRealm\"><MESSAGE messageTypeId=\"reqPrimitiveSubMessage\" consumerId=\"PrimitiveRegistrant\" messageId=\"primitiveMessageSubmit\" priority=\"1\" realmCount="${realmCount}" seqnum=\"13\"><BODY><PRIMITIVE_SUBMIT getFieldValues=\"true\" updateDeferredValues=\"true\" updateActionSet=\"true\" auditlog=\"Edit checkout for i/o points\" auditenabled=\"true\" auditdetails=\"\" cjDoCommit=\"true\" cjGetChangesFromCore=\"true\"><PRIMITIVE id="${this.id}"><![CDATA[${command}]]></PRIMITIVE></PRIMITIVE_SUBMIT></BODY></MESSAGE></MESSAGES>`;
            return fetch(`http://localhost:8080/_common/servlet/lvl5/msgservlet?wbs=${wbs}`, {
                "headers": headerObj,
                "referrer": refUrl,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": body,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            });
    };
    checkPrevious(){
        let validity = false;
        this.retrievedValues.forEach((e) => {
            if(between(this.feedback.textContent, e, 1.5)){
                validity = true;
             }
        })
        return validity
    }
    getBinary(){
        if(this.status !== this.feedback.textContent){
            this.status = this.feedback.textContent
            console.log(`${this.name} is ${this.status}`)
        }
    }
    getAnalog(){
        if(between(this.feedback.textContent, this.command.textContent, 2) && !this.checkPrevious()){
            this.valueChanged = true;
            setTimeout(()=>{
                this.retrievedValues.push(parseFloat(this.feedback.textContent))
                console.log(this.name,this.retrievedValues);
                lastPushed = this;
                if(this.name == 'VFD'){
                    console.log("airflow:",airflow.feedback.textContent)
                }
            }, 4000)
            return true;
        }
        
    }
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
let airflow = new Device(15, "airflow", undefined, "prim_722")
let sensorList = [saTemp, maTemp, rh1, rh2, conductivity]
let binaryDeviceList = [fanObjList, fillValve, drainValve, leak1, leak2, primary, secondary, vfdFault, vfdHOA, sump];
let analogDeviceList = [bypassDamper, faceDamper, vfd];

let startDownload = confirm('start download?')
if(startDownload === true){
    invokeManualCommand('download');
}

let startBinaryPoll, startAnalogPoll;
clearInterval(startBinaryPoll);
clearTimeout(startAnalogPoll);

startBinaryPoll = setInterval(() => {
    pollBinary();
}, 500);

startAnalogPoll = setTimeout(function analogFbks(){
    pollAnalog();
    startAnalogPoll = setTimeout(analogFbks, 6000);
}, 6000);

let acceptButtonLow = document.createElement('button');
    acceptButtonLow.textContent = 'Accept';
    acceptButtonLow.style.margin = '0 1.5em';

let updatePreviousArrayButton = document.createElement('button');
    updatePreviousArrayButton.textContent = 'Update Previous Value';

updatePreviousArrayButton.addEventListener('click',()=>{
    updatePreviousValue();
})
acceptButtonLow.addEventListener('click', () => { handleAcceptButton()});
if(aContent.querySelector('#scrollContent > div').children.length < 2){
    aContent.querySelector("#scrollContent > div").append(acceptButtonLow);
    aContent.querySelector("#scrollContent > div").append(updatePreviousArrayButton);
}

console.log('Polling Inputs...')

/* functions */
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
function between(num, target, range = 2){
    num = parseInt(num);
    target = parseInt(target);
    return num <= (target + range) && num >= (target - range) 
}

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

function showSensors(){
    sensorList.forEach(e => {e.getStatus(); console.log(e.name,':' ,e.status)});
    console.log(faceDamper.name, faceDamper.retrievedValues);
    console.log(bypassDamper.name, bypassDamper.retrievedValues);
}

function flushTank(){
    sump.postReq(1);
    bleed.postReq(1);
    drainValve.postReq(0);
    fillValve.postReq(0);

    let watchdog = setInterval(()=>{
        if(floatObjList[0].feedback.textContent == 'Low'){
            clearInterval(watchdog);
            setTimeout(()=>{
                console.log('Tank Flushed');
                bleed.toggle();
                drainValve.toggle();
                fillValve.toggle();
            }, 60000)}
    },1000)
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
function setupAnalogDevice(device, withOutput = false, commandValue){
    return new Promise(function(resolve, reject){
        let loggedStatus = device.feedback.textContent;
        console.log(loggedStatus)
        if(withOutput){
            console.log(`${device.name} commanded:`, device.command.textContent,'status:', device.feedback.textContent); 
            device.postReq(commandValue);
        } else{
            console.log(device.name,' status:', device.feedback.textContent); 
        }
        setTimeout(()=>{
                let timer = setInterval(()=>{
                    if(between(device.feedback.textContent, device.command.textContent,1.5) && !device.checkPrevious()){
                        clearInterval(timer);
                        resolve('cleared');
                        console.log('cleared')
                    }
                },1000);
        },3000)
    })
}

function setupBinaryDevice(device, withOutput = false){
    return new Promise(function(resolve, reject){
        if(withOutput){
            device.toggle();
        }
        setTimeout(()=>{ 
            let loggedStatus = device.feedback.textContent
            if(withOutput){
                console.log(`${device.name} commanded:`, device.command.textContent,'status:', device.feedback.textContent); 
            } else{
                console.log(device.name,' status:', device.feedback.textContent); 
            }
            let timer = setInterval(()=>{
                if(loggedStatus != device.feedback.textContent){
                    clearInterval(timer);
                    resolve('cleared');
                    // console.log('cleared')
                }
            },
            withOutput ? 1000 : 250)
        }, withOutput ? 3500 : 0);   
    })
}

function testBinaryDevice(device, withOutput){
    return new Promise((resolve, reject) => {
        setupBinaryDevice(device, withOutput).then(()=>{
            setupBinaryDevice(device, withOutput).then(()=>{console.log(`${device.name} test complete`); resolve();})
        })
    })
}

function testEvapActuators(){
    testBinaryDevice(fillValve, true).then(()=>{
        testBinaryDevice(drainValve, true).then(()=>{
            console.log('Evap actuators test complete')
        })
    })
}

function testFloats(){
    let whl = testBinaryDevice(floatObjList[1])
    let wol = testBinaryDevice(floatObjList[0])
    let wll = testBinaryDevice(floatObjList[2])
    Promise.all([whl,wol,wll]).then(()=>{
        console.log(`Floats Test Complete`);                
    })
}