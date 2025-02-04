The Hitchhikers Guide to Testing ALC Ballard
1)	Run Windows PowerShell as Admin
a.	Windows button + R then  type in PowerShell, then ctrl + shift + enter 
b.	 Start menu -> search Powershell -> ‘Run as Administrator’
2)	Copy-pasta:  netsh interface ipv4 set address name=”Ethernet” static 169.254.1.2
a.	Hit enter. PowerShell is persistent on exiting and restarting the computer. From now on open powershell as admin hit the up arrow on your keyboard and it will cycle through your past commands. Neat!
b.	If you want to change your ip address, hit the up arrow and replace the ip address from 169.254.1.2 to whatever you like. 
3)	Go through the usual procedure at 169.254.1.1
4)	Change ip address to 192.168.168.128 from powershell. You only need manually change this once, from then on just cycle up with the up arrow key and you’ll see your previous entries. 
5)	With webCTRL server running, open your browser of choice. And login to localhost:8080 then go to the properties -> I/O points tab
6)	Open dev tools (ctrl + shift + i) and go to the ‘Console Tab’
a.	When in doubt google “how to open dev tools in Chrome” etc.
7)	Add ‘live-expressions’ (eye icon) to the dev tools console:
a.	bypassDamper.feedback.textContent
b.	faceDamper.feedback.textContent
c.	conductivity.feedback.textContent
d.	vfd.feedback.textContent
8)	Paste in your hacker code in the console. Most updated version found at: https://github.com/xzovyAtWork/Ballard-Log/blob/main/alcLog.js
a.	If its your first time, after trying to load the code in, you’ll have to type in ‘allow pasting’ then try again. 
b.	If you click on another tab for what ever reason , the code wont work and you’ll have to put it in to console again. 
i.	Note that Dev tools console is persistent as well , so in the future just go to the console and hit the up arrow to add the code again.

9)	Once loading the code the controller should automatically download the program.
10)	Buttons will be added to bottom of the ALC page
a.	Test Dampers does bypass first then face dampers , automagically getting the feedback when its in position. Just make sure to visually make sure the right damper is being controller
b.	‘Test fill/drain’ is the same idea. It commands the Fill mechanically open then close. Same for the drain afterwards. 
i.	After clicking the ‘Test Fill/Drain button you can go into the unit and check the valve is operating the right way, then manually move it all the way to the end of the rotation. Wait until the program commands it in the opposite direction then once you feel it moving , you can physical operate it back to its initial position.
c.	‘Test inputs’ watches changes to RH1 & 2, S/A temp (if installed at the time of testing), M/A temp and floats. Once all these have been completed, it will log  all the values so you can input them in the functionality.
d.	‘Accept’  is just a copy of the accept button that appears at the top. Just there for convenience.
e.	Drain tank drains the tank by opening the drain, and leaving the bleed / sump
f.	on until WLL changes, then it turns off the Bleed and sump. 

Note* you will have to change the fill status ‘inactive status’ text from closed to close by editing the program. This is done by clicking on Fill Status in the name column -> then the details tab.  
