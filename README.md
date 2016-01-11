# HTPC_Alexa_Skill
Control Kodi Netflix and Chrome with your Amazon Echo

# Installation

This assumes you have an AWS and alexa custom skills setup as per https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/getting-started-guide

1. npm install the required Node libraries for the Lambda Skill

  npm install snoocore,request,cheerio,googleapis to the skill directory(whatever else you need)
  
  I used https://github.com/Tim-B/grunt-aws-lambda To make sure that the lambda function was running correctly locally
  
2. Create Google developer account.  Create a custom search engine with a CX and API key. (its free up to 100 searches per day) 

3. Add your search API key and CX to HTPC/Lambda/lookup.js

4. Change the SERVER_URL and SERVER_PORT of HTPCLAMBDA/index.js to the IP address of your HTPC, and the port the server will run on (default 9250)
    
    You'll probably need a static IP or atleast a dynamic DNS to reliably use this.

5. Zip up HTPCLambda and upload to your Lambda Skill to AWS

6. Add IntentSchema to you Intent Schema of your alexa skill

7. Make the invocation name of your alexa skill (I used "cody", "Kodi" gave me inconsistent results)

8. Copy the sample utterances to the sample utterances of your skill.

9. On your HTPC, run pip install xbmcjson,pyautogui (and perhaps whatever else you need)

10. Run Server.py on your HTPC.  The default port is set to 9250, but you can change it.

11. Port forward the server port on your router to the HTPC.

(12) optional.  Set up an apache/nginx server to better secure your server.


# ToDo List

Priority HIGH

 * Security: Current implementation opens server port to open internet.  Need to create authentication scheme.
 
 * Get Fullscreen to work on webbrowser.
 
 * Selection of specific episode of TV show.

Priority Low

 * New services.  Perhaps have the ability to scan KODI to find what addons exist, and dynamically populate them into the skill
 
 * Music through HTPC (alexa gets confused because of the duplicate functionality sometimes)
 
 * Use some web service (pushbullet) for easy deployment without need to have static IP address.  Maybe integrate DDNS into server?
 
 * Find alternative to google search, If I Plan on hosting this, API calls are going to get expensive.


# Known Issues

 * Alexa ignores you if you say a movie with a really long name.

