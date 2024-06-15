let duration = prompt('How many minutes?',30);

duration = parseInt(duration) * 60000;
 
setTimeout(handleAcceptButton, duration);

function monitorWOL() {
    
    if(floatObjList[0].feedback.textContent !== 'Normal'){
        handleAcceptButton();
        return 'Low';
    }
}

let watchWOL = setInterval(() => {monitorWOL();
    if(monitorWOL() == 'Low'){
        clearInterval(watchWOL);
    }
},2000);
