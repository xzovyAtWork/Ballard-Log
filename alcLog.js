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

const start= new Date();
let testType = ''
const startTime = start.toLocaleTimeString();
const end = new Date(start.getTime()+(4* (60 * 60000)))
function elapsedTime(){
    let time = ((new Date() - start)/60000)/60;
    if(time < 1){
       return `${time * 60} minutes`
    } else {return `${time} hours`}
}

 class Device{
    constructor(name,feedbackStatus ,commandStatus = undefined, commandFeedback){
        this.name = name;
        this.status = '';
        this.id = "prim_" + commandStatus;
        this.ctrlid = "prim_" + commandStatus + '_ctrlid1';            
        this.feedback = aContent.querySelector(`[primid="prim_${feedbackStatus}"]`);
        if(commandStatus){
            this.type = 'analog'
            this.command = aContent.querySelector(`[primid="prim_${commandFeedback}"]`);
        }else{this.type = 'binary'}
        
    }
    retrievedValues = [];

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
        else if(this == faceDamper || this == bypassDamper){
            if(command == 100){context.updateWidgetTextInput(this.id, this.ctrlid, '100', '100')}
            else if (command == 50){context.updateWidgetTextInput(this.id, this.ctrlid, '50', '50')}
            else if (command == 20){context.updateWidgetTextInput(this.id, this.ctrlid, '20', '20')}
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
    logFbk = () => {
        this.retrievedValues.push(parseFloat(this.feedback.textContent))
        return this.retrievedValues;
    }
    setStatus(){
        return this.status = this.feedback.textContent;
     }
    getFbk = () => parseFloat(this.feedback.textContent)
    getBinary(){
        if(this.status !== this.feedback.textContent){
            this.status = this.feedback.textContent
            console.log(`${this.name} is ${this.status}`)
        }
    }

    getAnalog(range = 5){
        let device = this;
        return new Promise((resolve, reject) => {
            if(between(device.feedback.textContent, device.command.textContent, range) && device.checkPrevious() == false){
                device.retrievedValues.push(parseFloat(device.feedback.textContent))
                    console.log(device.name,device.retrievedValues);
                    if(device.name == 'VFD'){
                        console.log("airflow:",airflow.feedback.textContent)
                    }
                   return resolve(`${device.name} ${device.retrievedValues}`);
            } else if(device.checkPrevious() == true){
               return reject('value already recorded')
            } else if(between(device.feedback.textContent, device.command.textContent, range) === false){
               return reject('out of range')
            }
        })
    }
}

const wol = new Device("WOL", 1234);
const whl= new Device("WHL", 1263);
const wll = new Device("WLL", 1292);

const faceDamper = new Device('Face Damper', 414 ,1975, 1964);
const bypassDamper = new Device ('Bypass Damper',458, 2019, 2008);

const fill = new Device('Fill', 1147, 2061, 2052);
const drain = new Device('Drain', 1205, 2091, 2082);

const leak1 = new Device('MPDC Leak', 1089);
const leak2 = new Device('Mech. Gallery Leak Detector', 1118);

const conductivity = new Device('Conductivity', 502);

const maTemp = new Device('M/A', 546);
const saTemp = new Device('S/A', 103);
const rh1 = new Device('RH One', 590);
const rh2 = new Device('RH Two', 634);

const primary = new Device('UPS Primary Status', 1582)
const secondary = new Device('Secondary Status', 1611)

const vfd = new Device('VFD', 766, 1709, 1698); //speed command
const vfdHOA = new Device('VFD HOA', 1524, 2178, 2169); // vfd enable
const vfdFault = new Device('VFD Fault', 1553);

const sump = new Device('Pump Status', 1321 ,2149, 2140);
const bleed = new Device('bleed',undefined , 2120, 2111);

const airflow = new Device("airflow", 722)

const sf1= new Device('sf1', 1350);
const sf2= new Device('sf2', 1379);
const sf3= new Device('sf3', 1408);
const sf4= new Device('sf4', 1437);
const sf5= new Device('sf5', 1466);
const sf6= new Device('sf6', 1495);

const fanObjList = [sf1,sf2,sf3,sf4,sf5,sf6];
const floatObjList = [wol, whl, wll];
const sensorList = [saTemp, maTemp, rh1, rh2, conductivity]
const binaryDeviceList = [fill, drain, leak1, leak2, primary, secondary, vfdFault, vfdHOA, sump];
const analogDeviceList = [bypassDamper, faceDamper, vfd];

let startBinaryPoll, startAnalogPoll;
let controllerReady;

/*UI */{

    const rampfansButton = document.createElement('button');
    rampfansButton.textContent= 'Ramp Fans'
    rampfansButton.addEventListener('click', rampFans)
    aContent.querySelector("#bodyTable > tbody > tr:nth-child(58) > td.left").append(rampfansButton)
    
    const bypassDamperButton = document.createElement('button');
    bypassDamperButton.textContent= 'Run Bypass';
    bypassDamperButton.addEventListener('click', runBypass)
    aContent.querySelector("#bodyTable > tbody > tr:nth-child(57) > td.left").append(bypassDamperButton)
    
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

    aContent.querySelector("#scrollContent > div > span").style.display = 'none'

    const testDampersButton = document.createElement('button');
        testDampersButton.textContent = 'Test Dampers';
        testDampersButton.style.margin = '0 1.5em';
        testDampersButton.addEventListener('click', ()=>{testFaceAndBypass();});

    const testFillDrainButton = document.createElement('button');
        testFillDrainButton.textContent = 'Test Fill/Drain & Inputs';
        testFillDrainButton.style.margin = '0 1.5em';
        testFillDrainButton.addEventListener('click', ()=>{testFillAndDrain(); testUnitDevices();});

    const evapTankButton = document.createElement('button');
        evapTankButton.style.margin = '0 1.5em';
        evapTankButton.textContent = 'Fill Tank';
        evapTankButton.addEventListener('click',()=>{fillTank()});



    if(aContent.querySelector('#scrollContent > div').children.length < 2){
        aContent.querySelector("#scrollContent > div").append(testDampersButton);
        aContent.querySelector("#scrollContent > div").append(testFillDrainButton);
        // aContent.querySelector("#scrollContent > div").append(testUnitDevicesButton);
        aContent.querySelector("#scrollContent > div").append(evapTankButton);
    }
    
}

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
let  setUpObserver = () => {
    let acceptNode = document.querySelector("#MainBarTR > td.actionSection.fill-horz.barBg").children[1];
    let cb = () => handleAcceptButton();
    let autoAccept = new MutationObserver(cb);
    let config = { attributes: true, childList: true, subtree: true };
    autoAccept.observe(acceptNode, config)
}
setUpObserver();

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


/* functions */
(function fetchStatusOnLoad(){
    sensorList.forEach(e => {e.setStatus()})
    fill.setStatus();
    binaryDeviceList.forEach(e => e.setStatus())
    faceDamper.setStatus();
    bypassDamper.setStatus();
    floatObjList.forEach((e) => {
        e.setStatus();
    })
    fanObjList.forEach((e) => {
        e.setStatus();
    })
    bypassDamper.setStatus();
    faceDamper.setStatus();
    fanObjList.forEach((e) => {
        e.setStatus();
    })
})()

function between(num, target, range = 2){
    num = parseFloat(num);
    target = parseFloat(target);
    return num <= (target + range) && num >= (target - range) 
}
function pollSensors(){
    sensorList.forEach(e => e.checkFault())
}

function showSensors(){
    sensorList.forEach(e => {e.setStatus(); console.log(e.name,':' ,e.status)});
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
        console.log('Float switches in CORRECT orientation if tank is empty.')
    }
}
async function fillTank(){
    console.log('filling tank...')
    fill.postReq(1);
    drain.postReq(1);
    await watchFloat(wol, ()=>{console.log('tank filled')})
    return new Promise(resolve => {
        return resolve();
    })
}

function drainTank(){
    drain.postReq(0);
    sump.postReq(0);
    bleed.postReq(0);
}

async function flushTank(){
    console.log('flushing tank')
    fill.postReq(0);
    drain.postReq(0);
    bleed.postReq(0);
    sump.postReq(0);
    // await watchFloat(wll, ()=>{
    //     toggleDevices([sump, bleed]);
    // })
    await watchFloat(wll)
    return new Promise(resolve => {
        console.log('tank flushed')
        resolve();
    })
}
async function wetMedia(withBleed = false){
    sump.postReq(1);
    fill.postReq(1);
    drain.postReq(1);
    if(withBleed){bleed.postReq(1)}
    return new Promise(resolve => resolve())
} 

 function mediaTimer(duration){
    console.log(new Date().toLocaleTimeString(), `rinsing for ${duration} minutes`)
    return new Promise(resolve => {
        setTimeout(()=>{resolve('time elapsed')}, duration * 60000)
    })
}

async function cycle(duration, withBleed = false, fanSpeed){
    await fillTank()
        .then(()=>{
            vfdHOA.postReq(1);
            vfd.postReq(fanSpeed);
        })
        .then(()=>wetMedia(withBleed))
        .then(()=>mediaTimer(duration))
        .then(flushTank);
    console.log('cycle complete');
}

function runBypass(){
    testType="bypass";
    console.log("bypassDamper timer started at:", new Date().toLocaleString())
    // fill.postReq(0)
    return setTimeout(()=>{
        drain.postReq(0);
        sump.postReq(0);
        console.log("bypassDamper test finished. draining tank. Turn off main water supply")
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
            return resolve();
        }
        if(loggedStatus < 0){
            return reject(`${device.name} under range`)
        }

        setTimeout(()=>{
                let timer = setInterval(()=>{
                    if(withOutput && (between(device.feedback.textContent, device.command.textContent,2) && !device.checkPrevious())){
                        clearInterval(timer);
                        setTimeout(()=>{
                            device.getAnalog(5);
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

 
 function testFloats(){
    checkFloatPolarity();
    clearInterval(startFloatsPoll);
    return new Promise((resolve)=>{
        let arr = []
        let resolved = resolve
        Promise.all([
            testBinaryDevice(whl).then(()=>{arr.push('WHL')}), 
            testBinaryDevice(wol).then(()=>{arr.push('WOL')}),
            testBinaryDevice(wll).then(()=>{arr.push('WLL')})
            ]).then(()=>{
            console.log(`Floats tested in this order:`, arr);
            resolved();
            startFloatsPoll = setInterval(() => {
                floatObjList.forEach((e) => {
                    e.getBinary();
                })
            }, 1000);             
        })
    })
}

async function testAnalogIO(device, commandValueArr){
    device.retrievedValues = [];
    for(let i = 0; i < commandValueArr.length; i++){
        await strokeAnalogDevice(device, true, commandValueArr[i])
    }
}

function testFaceAndBypass(){
    testAnalogIO(bypassDamper, [50,20,100]).then(()=>testAnalogIO(faceDamper, [50,100,20]))
}

async function testVFD(){
    vfd.postReq(0);
    vfdHOA.postReq(1)
    testAnalogIO(vfd, [0, 25,50,75,100]);
}

function testUnitDevices(){

    let arr = [strokeAnalogDevice(maTemp), strokeAnalogDevice(rh1), strokeAnalogDevice(rh2), testFloats()]

    if(parseFloat(saTemp.feedback.textContent) > 0){
        arr.push(strokeAnalogDevice(saTemp));
    }else{
        console.log('skipping S/A temp')
    }

    Promise.all(arr).then(()=>{
        console.log('Unit inputs test complete. Logging Binary Inputs...')
        showSensors();
    })
}

function rampFans(){
    testVfdEnable().then((r)=>{
        console.log(r);
    }).then(()=>vfd.postReq(0)).then(testVFD)
}
 function testVfdEnable(){
    return new Promise((resolve, reject)=>{
        vfdHOA.postReq(0);
        vfd.postReq(25);
        setTimeout(()=>{
            if (parseFloat(vfd.feedback.textContent) > 2){
               reject('VFD Enable not working')
            }else{
               resolve('VFD Enable working, Ramping Fans..');
            }
        }, 7000)
    })
}

conductivity.monitoring = false;
conductivity.maxValue = 0
let fullWaterStartTime;
let cycleCount = 0

 function toggleDevices(devices){
    devices.forEach(device => device.toggle());
}


function watchFloat(float, callback){
    let stat = float.setStatus();
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
