        /*
        prim:
        sa 103 face 414 byp 458 cond 502 ma 546 rh1 590 rh2 634 aflow 722 vfdfbk 766 mpdc 1089 mechGal 1118 fill 1147 drain 1205 wol 1234 whl 1263 wll 1292 pump 1321 sf 1-6 1350 1379 1408 1437 1466 1495  vfd hoa 1524 vfd fault 1553 prim = 1582 sec 1611 vfd speed 1698 face 1964 byp 2008 fill 2052 drain 2082 bleed 2111 sump 2140 vfden 2169
        */
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
            constructor(name, ids){
                this.name = name;
                this.loggedStatus = '';
                if(typeof ids == 'object'){
                    this.fbkValueID = `prim_${ids[0]}`;
                    this.cmdValueID = `prim_${ids[1]}`;
                    this.lockedValueID = `prim_${ids[2]}`;
                }else{
                    this.fbkValueID = 'prim_'+ids
                }
            }
            retrievedValues = [];
            faulted = false;
            getValue(prim = this.fbkValueID){
                return main.getActionWindow().allHtmlCtrls[prim + '_ctrlid1'].textContent
            }
            toggle(){
                if(this.getValue(this.cmdValueID) == 'Close' || this.getValue(this.cmdValueID) == 'Off'|| this.getValue(this.cmdValueID) == 'Disable'){
                    this.postReq(1)
                }else {
                    this.postReq(0)
                }
            }
            postReq(command = 0){
                const body = `<MESSAGES channelId=\"publisher\" realmId=\"primitiveRequestRealm\"><MESSAGE messageTypeId=\"reqPrimitiveSubMessage\" consumerId=\"PrimitiveRegistrant\" messageId=\"primitiveMessageSubmit\" priority=\"1\" realmCount="${realmCount}" seqnum=\"13\"><BODY><PRIMITIVE_SUBMIT getFieldValues=\"true\" updateDeferredValues=\"true\" updateActionSet=\"true\" auditlog=\"Edit checkout for i/o points\" auditenabled=\"true\" auditdetails=\"\" cjDoCommit=\"true\" cjGetChangesFromCore=\"true\"><PRIMITIVE id="${this.lockedValueID}"><![CDATA[${command}]]></PRIMITIVE></PRIMITIVE_SUBMIT></BODY></MESSAGE></MESSAGES>`;
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
                    if(between(this.status, e, 1.5)){
                        validity = true;
                    }
                })
                return validity;
            }

            updateRetrievedValues(delay = 0){
                if(((between(this.getValue(this.fbkValueID), this.getValue(this.cmdValueID), 2.5)) && !this.checkPrevious())){
                    setTimeout(()=>{
                        this.retrievedValues.push(parseFloat(this.getValue(this.fbkValueID)))
                        lastPushed = this;
                        console.log(this.name, this.retrievedValues)
                        if(this.name == 'VFD'){
                            console.log("airflow:",airflow.getValue())
                        };
                        return true;
                    }, delay);
                }
            }
            updateLoggedStatus(){
                this.loggedStatus = this.getValue()
            }
            

            checkFault(){
                if(this.feedback < 0){
                    console.log(`${this.name} faulted`);
                    this.faulted = true;
                }
                if(this.faulted && this.feedback > 1){
                    this.faulted = false;
                    console.log(`${this.name} operational`)
                }
            }
            clearRetrievedValues(){
                this.retrievedValues = [];
            }
            
            startPolling = (isAnalog) =>  setInterval(()=>{
                if(this.loggedStatus !== this.getValue()){   
                    this.loggedStatus = this.getValue();
                    console.log(`${this.name} is ${this.loggedStatus}`)
                }
            },1000)

            stopPolling = () => {clearInterval(this.startPolling)};
        }

        //analog IO's
        const faceDamper = new Device('Face Damper', [414, 1964, 1975] );
            faceDamper.feedback = aContent.querySelector("#bodyTable > tbody > tr:nth-child(8) > td:nth-child(3) > span.ControlNumberEdit-WidgetTextDisplay-base")
        const bypassDamper = new Device ('Bypass Damper', [458, 2008, 2019]);
            bypassDamper.feedback = aContent.querySelector("#bodyTable > tbody > tr:nth-child(9) > td:nth-child(3) > span.ControlNumberEdit-WidgetTextDisplay-base")
        const vfd = new Device('VFD', [766, 1698, 1709]); //speed command
            vfd.feedback = aContent.querySelector("#bodyTable > tbody > tr:nth-child(16) > td:nth-child(3) > span.ControlNumberEdit-WidgetTextDisplay-base")

        //analog I's
        const conductivity = new Device('Conductivity', 502);
            conductivity.feedback = aContent.querySelector("#bodyTable > tbody > tr:nth-child(10) > td:nth-child(3) > span.ControlNumberEdit-WidgetTextDisplay-base")
        const maTemp = new Device('M/A', 546);
        const saTemp = new Device('S/A', 103);
        const rh1 = new Device('RH One', 590);
        const rh2 = new Device('RH Two', 634);
        const airflow = new Device("airflow", 722)

        //binary IO's
        const fillValve = new Device('Fill', [1147, 2052, 2061]);
        const drainValve = new Device('Drain', [1205, 2082, 2091]);
        const sump = new Device('Pump Status', [1321 , 2140, 2149]);

        //binary O's
        const bleed = new Device('bleed', [undefined, 2111, 2120]);

        //binary I's
        const leak1 = new Device('MPDC Leak', 1089);
        const leak2 = new Device('Mech. Gallery Leak Detector', 1118);

        const primary = new Device('UPS Primary Status', 1582)
        const secondary = new Device('Secondary Status', 1611)

        const vfdHOA = new Device('VFD HOA', [1524, 2178]); // vfd enable
        const vfdFault = new Device('VFD Fault', 1553);


        const floatObjList = [
            new Device('WOL', 1234),
            new Device('WHL', 1263),
            new Device('WLL', 1292),    
        ]

        const fanObjList = function(len){
            let sfIds =  [1350, 1379, 1408, 1437, 1466, 1495];
            let num = 1
            let name = ''
            fans = [];
            for(let i = 0; i < len; i++){
                name = 'sf'+ num;
                fans.push(new Device(name, sfIds[i]))
                num++;
            }
            return fans
        }(6)


        const sensorList = [saTemp, maTemp, rh1, rh2, conductivity];
        const binaryDeviceList = [fillValve, drainValve, leak1, leak2, primary, secondary, vfdFault, vfdHOA, sump];
        const analogDeviceList = [bypassDamper, faceDamper, vfd];
        let controllerReady;
        if(saTemp.getValue()  == '?'){
            invokeManualCommand('download');
            controllerReady = setInterval(()=>{
                if(saTemp.feedback !== '?'){
                    console.log('Polling Inputs...');
                    clearInterval(controllerReady);
                    fillValve.postReq(0);
                    drainValve.postReq(1);
                    faceDamper.postReq(20);
                    bypassDamper.postReq(100);
                    sump.postReq(0);
                    vfdHOA.postReq(0);
                }
            },1000)
        } else {
            fetchStatusOnLoad();
        }
    {
        aContent.querySelector("#scrollContent > div > span").style.display = 'none'

        let acceptButtonLow = document.createElement('button');
            acceptButtonLow.textContent = 'Accept';
            acceptButtonLow.style.margin = '0 1.5em';
            acceptButtonLow.addEventListener('click', () => { handleAcceptButton()});
        let testDampersButton = document.createElement('button');
            testDampersButton.textContent = 'Test Dampers';
            testDampersButton.style.margin = '0 1.5em';
            testDampersButton.addEventListener('click', ()=>{testFaceAndBypass();});

        let testFillDrainButton = document.createElement('button');
            testFillDrainButton.textContent = 'Test Fill/Drain';
            testFillDrainButton.style.margin = '0 1.5em';
            testFillDrainButton.addEventListener('click', ()=>{testFillAndDrain()});

        let flushTankButton = document.createElement('button');
            flushTankButton.textContent = 'Flush Tank';
            flushTankButton.style.margin = '0 1.5em';
            flushTankButton.addEventListener('click',()=>{flushTank()});

        let testUnitDevicesButton = document.createElement('button');
            testUnitDevicesButton.textContent = 'Test Inputs';
            testUnitDevicesButton.style.margin = '0 1.5em';
            testUnitDevicesButton.addEventListener('click', ()=>{testUnitDevices()});



        if(aContent.querySelector('#scrollContent > div').children.length < 2){
            aContent.querySelector("#scrollContent > div").append(testDampersButton);
            aContent.querySelector("#scrollContent > div").append(testFillDrainButton);
            aContent.querySelector("#scrollContent > div").append(testUnitDevicesButton);
            aContent.querySelector("#scrollContent > div").append(acceptButtonLow);
            aContent.querySelector("#scrollContent > div").append(flushTankButton);
        }

    }
        /* functions */
    function fetchStatusOnLoad(){
        sensorList.forEach(e => {e.updateLoggedStatus()})
        binaryDeviceList.slice(2).forEach(e => e.updateLoggedStatus())
        faceDamper.updateLoggedStatus();
        bypassDamper.updateLoggedStatus();
        floatObjList.forEach((e) => {
            e.updateLoggedStatus();
        })
        fanObjList.forEach((e) => {
            e.updateLoggedStatus();
        })
        bypassDamper.updateLoggedStatus();
        faceDamper.updateLoggedStatus();
        fanObjList.forEach((e) => {
            e.updateLoggedStatus();
        })
    }

        function createDevices(quantity = 1, id, arr, nameList){
            for(let i = 0; i < quantity; i++){
                arr[i] = new Device(nameList[i], id);
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
        // sensorList.forEach(e => e.startPolling())
        // analogDeviceList.forEach(e => e.startPolling())
        // vfd.startPolling()
        binaryDeviceList.forEach(e => e.startPolling())
        floatObjList.forEach((e) => {
            e.startPolling();
        })
        fanObjList.forEach((e) => {
            e.startPolling();
        })
        
    function showSensors(){
        sensorList.forEach(e => {e.getValue(); console.log(e.name,':' ,e.getValue())});
        console.log(faceDamper.name, faceDamper.retrievedValues);
        console.log(bypassDamper.name, bypassDamper.retrievedValues);
    }
    function flushTank(andMedia){
        sump.postReq(1);
        bleed.postReq(1);
        drainValve.postReq(0);
        fillValve.postReq(0);

        let watchdog = setInterval(()=>{
            if(floatObjList[0].feedback == 'Low'){
                clearInterval(watchdog);
                console.log('Tank Flushed');
                setTimeout(()=>{
                    fillValve.toggle();
                    drainValve.toggle();
                }, 30000)
            }
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
    function strokeAnalogDevice(device, withOutput = false, commandValue){
        return new Promise(function(resolve, reject){
            if(withOutput){
                device.updateLoggedStatus();
                console.log(`${device.name} commanded:`, commandValue,'status:', device.loggedStatus);
                device.postReq(commandValue);
            } else{
                console.log(device.name,' status:', device.loggedStatus);
            }
            setTimeout(()=>{
                    let timer = setInterval(()=>{
                        device.getValue();
                        if(withOutput && (between(parseFloat(device.getValue()), commandValue,2) && !device.checkPrevious())){
                            clearInterval(timer);
                            setTimeout(()=>{
                                resolve('cleared');
                                console.log(`${device.name} cleared`);
                                device.updateRetrievedValues(4000);
                            },2500)
                        }else if(!withOutput && parseFloat(device.getValue()) > parseFloat(device.loggedStatus)) {
                            clearInterval(timer);
                            console.log(`${device.name} cleared`, device.getValue());
                            resolve();
                        }
                    },withOutput ? 4000 : 250)
                }, withOutput ? 3500 : 1000); 
        })
    }
    function strokeBinaryDevice(device, withOutput = false){
        return new Promise(function(resolve, reject){
        if(withOutput){
            device.toggle();
        }
        setTimeout(()=>{ 
            let loggedStatus = device.getValue()
            if(withOutput){
                console.log(`${device.name} commanded:`, device.getValue(device.cmdValueID),'status:', device.getValue()); 
            } else{
                console.log(device.name,' status:', device.getValue()); 
            }
            let timer = setInterval(()=>{
                if(loggedStatus != device.getValue()){
                    clearInterval(timer);
                    resolve('cleared');
                }
            },withOutput ? 3000 : 250)
        }, withOutput ? 3500 : 0);   
        })
    }
    let testBinaryDevice = function(device, withOutput){
        return new Promise((resolve, reject) => {
            strokeBinaryDevice(device, withOutput).then(()=>{
                strokeBinaryDevice(device, withOutput).then(()=>{console.log(`${device.name} test complete`); resolve();})
            })
        })
    }
    function testDamper(device, commandValues){
        return new Promise((resolve, reject) =>{
            let tested = resolve;
            device.updateRetrievedValues();
            strokeAnalogDevice(device, true, commandValues[0]).then(()=>{
                strokeAnalogDevice(device, true, commandValues[1]).then(()=>{
                    tested();
                    console.log(`${device.name} tested.`);
                    device.postReq(commandValues[2]);
                })
            }).catch(reject)
        })
    }
    function testFillAndDrain(){
        testBinaryDevice(fillValve, true).then(()=>{
            testBinaryDevice(drainValve, true).then(()=>{
                console.log('Fill and Drain actuators test complete')
            })
        })
    }
    function testFaceAndBypass(){
        testDamper(bypassDamper, [50, 20, 100]).then(()=>{
            testDamper(faceDamper, [50, 100, 20])
        })
    }
    let testFloats = () => {
        floatObjList.forEach(e => {e.stopPolling});
        return new Promise((resolve)=>{
            let resolved = resolve
            let whl = testBinaryDevice(floatObjList[1])
            let wol = testBinaryDevice(floatObjList[0])
            let wll = testBinaryDevice(floatObjList[2])
            Promise.all([whl,wol,wll]).then(()=>{
                console.log(`Floats Test Complete`);
                resolved();   
                floatObjList.forEach(e => {e.startPolling});             
            })
        })
    }
    function testUnitDevices(){
        // clearInterval(startBinaryPoll);
        let arr = []
        let mixedAirTemp = strokeAnalogDevice(maTemp);
        let supplyAirTemp = strokeAnalogDevice(saTemp);
        let humidityOne = strokeAnalogDevice(rh1);
        let himidityTwo = strokeAnalogDevice(rh2);
        let testAllFloats = testFloats();
        let conduct = strokeAnalogDevice(conductivity)
        arr.push(mixedAirTemp, humidityOne, himidityTwo, testAllFloats, conduct)
        if(parseFloat(saTemp.getValue()) > 0){
            arr.push(supplyAirTemp)
        }else{
            console.log('skipping S/A Temp');
        }
        Promise.all(arr).then(()=>{
            console.log('Unit inputs test complete')
            showSensors();
            startBinaryPoll();
        })
    }