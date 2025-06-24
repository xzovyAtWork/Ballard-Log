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
    - bypassDamper.feedback.textContent
    - faceDamper.feedback.textContent
    - conductivity.feedback.textContent
    - vfd.feedback.textContent
8) replace `content_security_policy=default-src 'self'; img-src 'self' data:; font-src 'self' data:; frame-src 'self'; media-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;` at line 274 of C:\WebCTRL8.0\webroot\microsoft_dm09_10_ETJ_8_26_19/system.properties file
9) add script tag at line 129 in C:\WebCTRL8.0\webroot\_common\lvl5\main.jsp



