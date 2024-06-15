//add monitorWOL function 4/20
//add auto download and clear interval if they are set 4/6
//this has updated checkPrevious() method 3/14

const aContent = document.querySelector('.actionFrame').contentWindow.document.childNodes[1];
let lastPushed;
class Device{
    constructor(statusChildNode, name, commandChildNode = undefined){
        this.name = name;
        this.status = '';
        if(statusChildNode > 20){
            this.feedback = aContent.querySelector(`#bodyTable > tbody > tr:nth-child(${statusChildNode}) > td:nth-child(3)`).childNodes[0];
        } else {
            this.feedback = aContent.querySelector(`#bodyTable > tbody > tr:nth-child(${statusChildNode}) > td:nth-child(3) > span.ControlNumberEdit-WidgetTextDisplay-base`)
        }
        if(commandChildNode){
            this.command = aContent.querySelector(`#bodyTable > tbody > tr:nth-child(${commandChildNode}) > td:nth-child(3)`).childNodes[0];
        }
    }
    getBinary(){
        if(this.pollFbk){
            if(this.status !== this.feedback.textContent){
                this.status = this.feedback.textContent
                console.log(`${this.name} is ${this.status}`)
                this.pollCounter++
            }
        }
    }

    pollFbk = true;
    pollCounter = 0;

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
       //return //this.retrievedValues.includes(parseFloat(this.feedback.textContent))
       // return (Math.round(this.retrievedValues[this.retrievedValues.length - 1]) == Math.round(parseFloat(this.feedback.textContent)) || Math.ceil(this.retrievedValues[this.retrievedValues.length - 1]) == Math.ceil((parseFloat(this.feedback.textContent))))
    }
    

    getAnalog(){
        if(this.pollFbk){
        function between(num, target, range = 2){
            num = parseInt(num);
            target = parseInt(target);
            return num <= (target + range) && num >= (target - range) 
        }
        if(between(this.feedback.textContent, this.command.textContent) && !this.checkPrevious()){ //!this.checkPrevious() !between(this.feedback.textContent, this.retrievedValues[this.retrievedValues.length - 1]
            setTimeout(()=>{
                this.retrievedValues.push(parseFloat(this.feedback.textContent))
                this.pollCounter++
                console.log(this.name,this.retrievedValues);
                lastPushed = this;
            }, 4000)};
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
        // console.log(fanNames[i])
    }
};
populateFanStatusNames();

createDevices(fanNames.length, 34, fanObjList, fanNames); //34
createDevices(3, 30, floatObjList, floatNames);

let faceDamper = new Device(8, 'Face Damper', 52);
let bypassDamper = new Device (9, 'Bypass Damper',53);
let fillValve = new Device(27, 'Fill', 54);
let drainValve = new Device(29, 'Drain', 55);
let leak1 = new Device(25, 'MPDC Leak');
let leak2 = new Device(26, 'Mech. Gallery Leak Detector');
let conductivity = new Device(10, 'Conductivity');
let maTemp = new Device(11, 'M/A');
let saTemp = new Device(1, 'S/A') 
let rh1 = new Device(12, 'RH One');
let rh2 = new Device(13, 'RH Two');
let primary = new Device(42, 'UPS Primary Status')
let secondary = new Device(43, 'Secondary Status')
let vfd = new Device(16, 'VFD', 46);
let vfdHOA = new Device(40, 'VFD HOA');
let vfdFault = new Device(41, 'VFD Fault');
let sumpFault = new Device(33 ,'Pump Status');

let sensorList = [maTemp, saTemp, rh1, rh2, conductivity]
let binDeviceList = [floatObjList, fanObjList, fillValve, drainValve, leak1, leak2, primary, secondary, vfdFault, vfdHOA, sumpFault];
let analogDeviceList = [bypassDamper, faceDamper, vfd];

(function fetchStatusOnLoad(){
    binDeviceList.slice(2).forEach(e => e.getStatus())
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
    binDeviceList.slice(2).forEach(e => e.getBinary())
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

// let duration = prompt('How many minutes?',30);

// duration = parseInt(duration) * 60000;
 
// setTimeout(handleAcceptButton, duration);

// function monitorWOL() {
    
//     if(floatObjList[0].feedback.textContent !== 'Normal'){
//         handleAcceptButton();
//         return 'Low';
//     }
// }

// let watchWOL = setInterval(() => {monitorWOL();
//     if(monitorWOL() == 'Low'){
//         clearInterval(watchWOL);
//     }
// },2000);