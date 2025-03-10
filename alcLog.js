const realmCount = main.getActionWindow().primitiveRequestRealm.realmCount;
const wbs = main.getActionWindow().primitiveRequestRealm.wbsId;
const context = document.getElementsByName('actionContent')[0].contentWindow
    
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

const start= new Date();
const startTime = start.toLocaleTimeString();
const end = new Date(start.getTime()+(4* (60 * 60000)))
function elapsedTime(){
    let time = ((new Date() - start)/60000)/60;
    if(time < 1){
       return `${time * 60} minutes`
    } else {return `${time} hours`}
}

class Device{
    constructor(statusChildNode, name, commandChildNode = undefined, id =''){
        this.name = name;
        this.status = '';
        this.id = id;
        this.ctrlid = id + '_ctrlid1';
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
    tested = false;
    toggle(){
        if(this.command.textContent == 'Close' || this.command.textContent == 'Off'|| this.command.textContent == 'Disable'){
            this.postReq(1)
        }else {
            this.postReq(0)
        }
    }
    postReq(command = 0){
        if(this == fill || this == drain){
            if(command == 0){
                context.updateDroplist(this.id, this.ctrlid, '0', "Closed", false)
            }else{
                context.updateDroplist(this.id, this.ctrlid, '1', "Open", false)
            }
        }
        else if(this == sump || this == bleed){
            if(command == 0){
                context.updateDroplist(this.id, this.ctrlid, '0', "Off", false)
            }else{
                context.updateDroplist(this.id, this.ctrlid, '1', "On", false)
            }
        }
        else if(this == vfdHOA){
            if(command == 0){
                context.updateDroplist(this.id, this.ctrlid, '0', "Disable", false)
            }else{
                context.updateDroplist(this.id, this.ctrlid, '1', "Enable", false)
            }
        }
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
    getAnalog(delay = 4000, range){
        let device = this;
        return new Promise((resolve, reject) => {
            
            if(between(device.feedback.textContent, device.command.textContent, range) && device.checkPrevious() !== true){
                device.valueChanged = true;
                setTimeout(()=>{
                    device.retrievedValues.push(parseFloat(device.feedback.textContent))
                    console.log(device.name,device.retrievedValues);
                    lastPushed = device;
                    if(device.name == 'VFD'){
                        console.log("airflow:",airflow.feedback.textContent)
                    }
                    resolve(`${device.name} ${device.retrievedValues}`);
                }, delay)
            } else if(device.checkPrevious() == true){
                reject('value already recorded')
            } else if(!between(device.feedback.textContent, device.command.textContent, range)){
                reject('out of range')
            } 
        })
    }
    checkFault(){
        if(this.feedback.textContent <= 0){
            console.log(`${this.name} faulted`);
            this.faulted = true;
        }
        if(this.faulted && this.feedback.textContent > 1){
            this.faulted = false;
            console.log(`${this.name} operational`)
        }
    }
    getStatus(){
       return this.status = this.feedback.textContent;
    }
    clearRetrievedValues(){
        this.retrievedValues = [];
    }
}

const numberOfFans = 6, fanNames = [], fanObjList = [];
const floatNames = ['WOL', 'WHL', 'WLL'], floatObjList = [];
populateFanStatusNames();
createDevices(fanNames.length, 34, fanObjList, fanNames); //34
createDevices(3, 30, floatObjList, floatNames);
const wol = floatObjList[0];
const whl= floatObjList[1];
const wll = floatObjList[2]

const faceDamper = new Device(8, 'Face Damper', 52,"prim_1975" );
const bypassDamper = new Device (9, 'Bypass Damper',53, "prim_2019");
const fill = new Device(27, 'Fill', 54, "prim_2061");
const drain = new Device(29, 'Drain', 55, "prim_2091");
const leak1 = new Device(25, 'MPDC Leak');
const leak2 = new Device(26, 'Mech. Gallery Leak Detector');
const conductivity = new Device(10, 'Conductivity');
const maTemp = new Device(11, 'M/A');
const saTemp = new Device(1, 'S/A');
const rh1 = new Device(12, 'RH One');
const rh2 = new Device(13, 'RH Two');
const primary = new Device(42, 'UPS Primary Status')
const secondary = new Device(43, 'Secondary Status')
const vfd = new Device(16, 'VFD', 46, "prim_1709"); //speed command
const vfdHOA = new Device(40, 'VFD HOA', 58, "prim_2178"); // vfd enable
const vfdFault = new Device(41, 'VFD Fault');
const sump = new Device(33 ,'Pump Status', 57 ,"prim_2149");
const bleed = new Device(56, 'bleed',56 , "prim_2120");
const airflow = new Device(15, "airflow", undefined, "prim_722")
const sensorList = [saTemp, maTemp, rh1, rh2, conductivity]
const binaryDeviceList = [fill, drain, leak1, leak2, primary, secondary, vfdFault, vfdHOA, sump];
const analogDeviceList = [bypassDamper, faceDamper, vfd];
let startBinaryPoll, startAnalogPoll;
let controllerReady;

const rampfansButton = document.createElement('button');
    rampfansButton.textContent= 'Ramp Fans'
    rampfansButton.addEventListener('click', rampFans)
    aContent.querySelector("#bodyTable > tbody > tr:nth-child(58) > td.left").append(rampfansButton)

const bypassButton = document.createElement('button');
    bypassButton.textContent= 'Run Bypass';
    bypassButton.addEventListener('click', runBypass)
    aContent.querySelector("#bodyTable > tbody > tr:nth-child(57) > td.left").append(bypassButton)

const fanTimerButton = document.createElement('button');
    fanTimerButton.textContent = "Start Fan Timer"
    fanTimerButton.addEventListener('click', ()=>{
let duration = prompt('How many minutes?',30);
    duration = parseInt(duration) * 60000;
    setTimeout(()=>{
        vfdHOA.postReq(0); console.log('fans stopped at timer');
        console.log('test duration:', ((new Date() - start)/60000)/60, "hours")
    }, duration);
    let time = new Date().toLocaleTimeString();
    console.log('fan timer started at : ', time)
    
})
aContent.querySelector("#bodyTable > tbody > tr:nth-child(59) > td.left").append(fanTimerButton)

const gpmButton = document.createElement('button');
gpmButton.textContent = "Set GPM"
gpmButton.addEventListener('click', setGPM)
aContent.querySelector("#bodyTable > tbody > tr:nth-child(56) > td.left").append(gpmButton)


//init commands
if(saTemp.feedback.textContent == '?'){
    invokeManualCommand('download');
    controllerReady = setInterval(()=>{
        if(saTemp.feedback.textContent !== '?'){
            console.log('Polling Inputs...');
            clearInterval(controllerReady);
            fill.postReq(0);
            drain.postReq(1);
            faceDamper.postReq(20);
            bypassDamper.postReq(100);
            sump.postReq(0);
            vfdHOA.postReq(0);
            vfd.postReq(0);
        }
    },1000)
}   

console.log('helper functions: setGPM(), runBypass(), flushTank(), showSensors(), incrementFans()')

startBinaryPoll = setInterval(() => {
        binaryDeviceList.forEach(e => e.getBinary())
}, 1000);

starFansPoll = setInterval(() => {
    fanObjList.forEach((e) => {
        e.getBinary();
    })
}, 1000);

startFloatsPoll = setInterval(() => {
    floatObjList.forEach((e) => {
        e.getBinary();
    })
}, 1000);

aContent.querySelector("#scrollContent > div > span").style.display = 'none'

const acceptButtonLow = document.createElement('button');
    acceptButtonLow.textContent = 'Accept';
    acceptButtonLow.style.margin = '0 1.5em';
    acceptButtonLow.addEventListener('click', () => { handleAcceptButton()});

const testDampersButton = document.createElement('button');
    testDampersButton.textContent = 'Test Dampers';
    testDampersButton.style.margin = '0 1.5em';
    testDampersButton.addEventListener('click', ()=>{testFaceAndBypass();});

const testFillDrainButton = document.createElement('button');
    testFillDrainButton.textContent = 'Test Fill/Drain';
    testFillDrainButton.style.margin = '0 1.5em';
    testFillDrainButton.addEventListener('click', ()=>{testFillAndDrain()});

const evapTankButton = document.createElement('button');
    evapTankButton.style.margin = '0 1.5em';
    evapTankButton.textContent = 'Fill Tank';
    evapTankButton.addEventListener('click',()=>{fillTank()});

const testUnitDevicesButton = document.createElement('button');
    testUnitDevicesButton.textContent = 'Test Inputs';
    testUnitDevicesButton.style.margin = '0 1.5em';
    testUnitDevicesButton.addEventListener('click', ()=>{testUnitDevices()});

if(aContent.querySelector('#scrollContent > div').children.length < 2){
    aContent.querySelector("#scrollContent > div").append(testDampersButton);
    aContent.querySelector("#scrollContent > div").append(testFillDrainButton);
    aContent.querySelector("#scrollContent > div").append(testUnitDevicesButton);
    aContent.querySelector("#scrollContent > div").append(acceptButtonLow);
    aContent.querySelector("#scrollContent > div").append(evapTankButton);
}

/* functions */
(function fetchStatusOnLoad(){
    sensorList.forEach(e => {e.getStatus()})
    fill.getStatus();
    binaryDeviceList.forEach(e => e.getStatus())
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
    num = parseFloat(num);
    target = parseFloat(target);
    return num <= (target + range) && num >= (target - range) 
}
function pollSensors(){
    sensorList.forEach(e => e.checkFault())
}

function pollAnalog(){
    vfd.getAnalog()
}
function showSensors(){
    sensorList.forEach(e => {e.getStatus(); console.log(e.name,':' ,e.status)});
    console.log(faceDamper.name, faceDamper.retrievedValues);
    console.log(bypassDamper.name, bypassDamper.retrievedValues);
}

function checkFloatPolarity(){
    if(floatObjList[0].feedback.textContent == 'Normal'){
        console.log('WOL FLOAT SWITCH UPSIDE DOWN!')
    }
    if(floatObjList[1].feedback.textContent =='Alarm'){
        console.log('WHL FLOAT SWITCH UPSIDE DOWN!')
    }
    if(floatObjList[2].feedback.textContent == 'Low'){
        console.log('WLL FLOAT SWITCH UPSIDE DOWN!')
    }else{
        console.log('Float switches in correct orientation if tank is empty.')
    }
    
}
function drainTank(){
    sump.postReq(1);
    bleed.postReq(1);
    drain.postReq(0);
    console.log('Draining sump tank. Turn off main water supply');
    evapTankButton.textContent = 'Fill Tank';
    evapTankButton.addEventListener('click',()=>{fillTank()});

    let watchdog = setInterval(()=>{
        if(floatObjList[2].feedback.textContent == 'Normal'){
            clearInterval(watchdog);
                sump.postReq(0);
                bleed.postReq(0)
        }}, 1000)
}
function flushTank(){
    fill.postReq(0);
    drain.postReq(0);
    bleed.postReq(1);
    sump.postReq(1);

    let watchdog = setInterval(()=>{
        if(floatObjList[2].feedback.textContent == 'Normal'){
        clearInterval(watchdog)
        sump.toggle();
            bleed.toggle();
            drain.toggle();
            fill.toggle();
            console.log('tank refilling at: ', new Date().toLocaleTimeString())
            let watchWOL = setInterval(()=>{
                if(floatObjList[0].feedback.textContent == "Normal"){
                sump.postReq(1);
                bleed.postReq(1);
                clearInterval(watchWOL)
            }}, 1000)
        }
    }, 1000)
}
function fillTank(){
    drain.postReq(1);
    fill.postReq(1);
    console.log('filling tank...')
    evapTankButton.textContent = 'Drain Tank';
    evapTankButton.addEventListener('click',()=>{drainTank()});
}
function runBypass(){
    console.log("bypass timer started at:", new Date().toLocaleString())
    // fill.postReq(0)
return setTimeout(()=>{
        drain.postReq(0);
        sump.postReq(0);
        console.log("bypass test finished. draining tank. Turn off main water supply")
    }, 30 * 60000)
}
function setGPM(){
    bleed.postReq(1);
    sump.postReq(1);
    console.log('running bleed for 5 minutes...')
return setTimeout(()=>{bleed.postReq(); console.log("bleed off")}, 5 * 60000);
}
function strokeAnalogDevice(device, withOutput = false, commandValue){
    return new Promise(function(resolve, reject){
        let loggedStatus = parseFloat(device.feedback.textContent);
        if(withOutput){
            console.log(`${device.name} commanded:`, commandValue,'status:', device.feedback.textContent);
            device.postReq(commandValue);
        } else{
            console.log(device.name,' status:', device.feedback.textContent); 
        }
        if(loggedStatus < 0){
            return reject(`${device.name} under range`)
        }

        setTimeout(()=>{
                let timer = setInterval(()=>{
                    if(withOutput && (between(device.feedback.textContent, device.command.textContent,2) && !device.checkPrevious())){
                        clearInterval(timer);
                        setTimeout(()=>{
                            device.getAnalog(0, 5);
                            resolve('cleared');
                            console.log(`${device.name} cleared`)
                        },2500)
                    }else if(!withOutput && parseFloat(device.feedback.textContent) > loggedStatus) {
                        clearInterval(timer);
                        console.log(`${device.name} cleared`, device.feedback.textContent);
                        resolve();
                    }
                },withOutput ? 4000 : 250)
            }, withOutput ? 3500 : 1000); 
    })
}
function strokeBinaryDevice(device, withOutput = false){
    return new Promise(function(resolve, reject){
    if(withOutput && (device.feedback.textContent == device.command.textContent)){
        device.toggle();
    }else if(withOutput) {
    return reject(`${device.name} feedback and commmand not matching`)
    }
    setTimeout(()=>{ 
        let loggedStatus = device.feedback.textContent
        if(withOutput){
            console.log(`${device.name} commanded:`, device.command.textContent,'. Current status:', device.feedback.textContent); 
        } else{
            console.log(device.name,' status:', device.feedback.textContent); 
        }
        let timer = setInterval(()=>{
            if(loggedStatus != device.feedback.textContent){
                clearInterval(timer);
            return resolve('cleared');
            }
        },withOutput ? 3000 : 250)
    }, withOutput ? 3500 : 0);   
})
}
let testBinaryDevice = function(device, withOutput){
    return new Promise((resolve, reject) => {
        strokeBinaryDevice(device, withOutput).then(()=>{
            strokeBinaryDevice(device, withOutput).then(()=>{
                device.tested = true;
                console.log(`${device.name} test complete`); resolve(`${device.name}`);})
        })
    })
}
function testDamper(device, commandValues){
    return new Promise((resolve, reject) =>{
        let tested = resolve;
        device.getAnalog(0, 5); 
        if(parseInt(device.feedback.textContent) <= 0){
            return reject(`${device.name} feedback faulty`)
        }
        strokeAnalogDevice(device, true, commandValues[0]).then(()=>{
            strokeAnalogDevice(device, true, commandValues[1]).then(()=>{
                tested();
                device.tested = true;
                console.log(`${device.name} tested.`);
            })
        }).catch(reject)
    })
}
function testVFD(device, commandValues){
    device.retrievedValues = [];
    vfdHOA.postReq(1);
    return new Promise((resolve, reject) =>{
        let tested = resolve;
        device.getAnalog(0, 5);
        strokeAnalogDevice(device, true, commandValues[0]).then(()=>{
            strokeAnalogDevice(device, true, commandValues[1]).then(()=>{
                strokeAnalogDevice(device, true, commandValues[2]).then(()=>{
                    strokeAnalogDevice(device, true, commandValues[3]).then(()=>{
                        
                        tested();
                        device.tested = true;
                        console.log(`${device.name} tested.`);
                })
              }) 
            })
        }).catch(reject)
    })
}
function testFillAndDrain(){
    return new Promise((resolve, reject) =>{
    testBinaryDevice(fill, true).then(()=>{
        fill.tested = true;
        testBinaryDevice(drain, true).then(()=>{
            drain.tested = true;
            resolve('Fill and Drain actuators test complete')
        })
    })
   }
  )
}
function testFaceAndBypass(){
    faceDamper.retrievedValues = [];
    bypassDamper.retrievedValues = [];
    return new Promise((resolve, reject) =>{
    testDamper(bypassDamper, [50, 20, 100]).then(()=>{bypassDamper.tested = true
        testDamper(faceDamper, [50, 100, 20]).then(()=>{resolve(); faceDamper.postReq(20); bypassDamper.postReq(100); faceDamper.tested = true;})
    })
  })
}
function testFloats(){
    checkFloatPolarity();
    clearInterval(startFloatsPoll);
    return new Promise((resolve)=>{
        let arr = []
        let resolved = resolve
        Promise.all([
            testBinaryDevice(floatObjList[1]).then(()=>{arr.push('WHL')}), 
            testBinaryDevice(floatObjList[0]).then(()=>{arr.push('WOL')}),
            testBinaryDevice(floatObjList[2]).then(()=>{arr.push('WLL')})
            ]).then(()=>{
            console.log(`Floats Test Complete in order:`, arr);
            resolved();
            startFloatsPoll = setInterval(() => {
                floatObjList.forEach((e) => {
                    e.getBinary();
                })
            }, 1000);             
        })
    })
}
    function testUnitDevices(){

        let arr = [strokeAnalogDevice(maTemp), strokeAnalogDevice(rh1), strokeAnalogDevice(rh2), testFloats()]

        if(parseFloat(saTemp.feedback.textContent) > 0){
            arr.push(strokeAnalogDevice(saTemp));
        }else{
            console.log('skipping S/A temp')
        }
        console.log("Binary Inputs Logging Stopped...")

        Promise.all(arr).then(()=>{
            console.log('Unit inputs test complete. Logging Binary Inputs...')
            showSensors();
        })
    }

function rampFans(){
    testEnableVFD().then((r)=>{
        console.log(r);
        return setTimeout(()=>{testVFD(vfd, [25,50,75,100])}, 5000);
    })
}
function testEnableVFD(){
    return new Promise((resolve, reject)=>{
        
        vfdHOA.postReq(0);
        vfd.postReq(25);
        setTimeout(()=>{
            if (parseFloat(vfd.feedback.textContent) > 2){
               reject('VFD Enable not working')
                vfd.postReq(0);
            }else{
               resolve('VFD Enable working, Ramping Fans..');
                vfd.postReq(0);
            }
        }, 7000)
    })
}

conductivity.monitoring = false;
conductivity.maxValue = 0

function toggle(devices){
    devices.forEach(device => device.toggle());
}

function wetMedia(){
    sump.postReq(1);
    fill.postReq(1);
    drain.postReq(1);
} 

async function runWaterTest(mediaWet){
    if(conductivity.maxValue < 500 && mediaWet){
        console.log("Media Rinsed");return
    }else if(!mediaWet){
        wetMedia();
    }else{
        await watchFloat(wol)
        bleed.postReq(1)
    };
    conductivity.monitor = await watchConductivity();
    await rinseMedia(30);
    toggle([fill, drain]);
    bleed.postReq(1) //drain water
    let watchWOL = await watchFloat(floatObjList[0]);
    console.log(watchWOL);
    toggle([fill, drain, bleed]); //fill tank
    return runWaterTest(true);
}
function rinseMedia(duration){
    console.log(new Date().toLocaleTimeString(), `rinsing for ${duration} minutes`)
    return new Promise(resolve => {
        setTimeout(()=>{resolve('time elapsed')}, duration * 60000)
    })
}

function watchConductivity(){
    conductivity.maxValue = parseInt(conductivity.feedback.textContent);
    return new Promise((resolve) => {
        function checkConductivity(){
        if(parseInt(conductivity.feedback.textContent) > conductivity.maxValue){
            conductivity.maxValue = parseInt(conductivity.feedback.textContent);
        } else {
            clearInterval(watchdog);
            conductivity.monitoring = false;
            return resolve(`conductivity max: ${conductivity.maxValue}`);
        }
    }
    let watchdog = setInterval(checkConductivity, 5 * 60000);
    conductivity.monitoring = true;
    })
}

function watchFloat(float, callback){
    let stat = float.getStatus();
    function checkFloat(float, cb){
        if(float.feedback.textContent !== stat){
            console.log(true)
            return cb();
        }
    }
    return new Promise((resolve) => {
        let watchdog = setInterval(
            ()=>{checkFloat(
                float, 
                ()=>{
                    if(callback){callback()};
                    clearInterval(watchdog);
                    resolve(`${float.name} changed`);
                })
            }, 1000)
    })
}