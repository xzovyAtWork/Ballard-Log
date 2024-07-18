
const aContent = document.querySelector("body > app-root > ng-component > div > ng-component > div > div > div.d-flex.flex-auto.fullheight-container.overflow-hidden > div.d-flex.h-100.flex-row.overflow-hidden > div > div > si-list-view > ul")
let lastPushed;
class Device{
    constructor(feedback, name, command = undefined){
        this.name = name;
        // console.log(this.name)
        if(command != undefined){
            this.command = aContent.children[command].querySelector('.ba-value');
        }
        this.feedback =aContent.children[feedback].querySelector('.ba-value');
        this.status = '';

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

let whl = new Device(7, 'WHL')
let wll = new Device(8, 'WLL')
let wol = new Device(9, 'WOL')
let faceDamper = new Device(13, 'Face Damper', 12);
let bypassDamper = new Device (3, 'Bypass Damper',2);
let fillValve = new Device(18, 'Fill', 19);
let drainValve = new Device(5, 'Drain', 6);
let leak1 = new Device(0, 'AHU Leak Detection');
// let leak2 = new Device(26, 'Mech. Gallery Leak Detector');
let conductivity = new Device(4, 'Conductivity');
let primary = new Device(16, 'Main Status')
let secondary = new Device(44, 'UPS Status')
let vfd = new Device(43, 'VFD', 42);
let sf1 = new Device(33, 'SF1');
let sf2 = new Device (34, 'SF2');
let sf3 = new Device(35, 'sf3');
let sf4 = new Device(36, 'sf4');
let sf5 = new Device(37, 'sf5');
let sf6 = new Device(38, 'sf6');
// let vfdHOA = new Device(40, 'VFD HOA');
let vfdFault = new Device(39, 'VFD Fault');
let sumpStatus = new Device( 11,'Pump Status');


// let sensorList = [maTemp, saTemp, rh1, rh2, conductivity]
let binDeviceList = [wol,whl,wll, fillValve, drainValve, leak1, primary, secondary, vfdFault, sumpStatus, sf1, sf2, sf3, sf4,sf5,sf6];
let analogDeviceList = [bypassDamper, faceDamper, vfd];

(function fetchStatusOnLoad(){
    binDeviceList.forEach(e => e.getStatus())
    faceDamper.getStatus();
    bypassDamper.getStatus();
    vfd.getStatus();
})()

// let startBinaryPoll, startAnalogPoll;
// clearInterval(startBinaryPoll);
// clearTimeout(startAnalogPoll);

// function pollSensors(){
//     sensorList.forEach(e => e.checkFault())
// }


function updatePreviousValue(){
    lastPushed.retrievedValues.pop();
    console.log(lastPushed.name,lastPushed.retrievedValues)
}

function pollBinary(){
    binDeviceList.forEach(e => e.getBinary())
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

//aContent.querySelector('.ng-valid')
//document.querySelector('si-confirmation-modal').querySelectorAll('.btn.btn-secondary')[1].click()
