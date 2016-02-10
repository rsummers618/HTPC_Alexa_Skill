# HTPC_Alexa_Skill

This is an Alexa skill which allows you to control media on your Kodi Media Center

[Demo](https://vid.me/ZLU9)

# Supported Speech Patterns

[Please see Sample Utterances for examples](https://github.com/rsummers618/HTPC_Alexa_Skill/blob/master/Alexa/speechAssets/SampleUtterancesGenerator.txt)



# Installation

This skill is not yet published by Amazon, so you must create a developer account to enable the skill

1. Register and add a new skill to your alexa skill kit. [Link](https://developer.amazon.com/edw/home.html#/skills/list)

2. Fill Create the skill
 
      Skill Information:

        Name "Kodi"
        
        Invocation Name "cody"
        
        Endpoint: arn:aws:lambda:us-east-1:414515788753:function:PlayTV
        
      Interaction Model:
      
        Intent Schema: Copy paste from /Alexa/speechAssets/IntentSchema.json
        
        Sample Utterances: Copy paste from /Alexa/speechAssets/SampleUtterances.txt
        
      Save and You are Done!
  
3. Install My Repo to Kodi [Here](https://github.com/rsummers618/HTPC_Alexa_Skill/raw/master/Kodi/zips/repository.rsummers618/repository.rsummers618-1.0.zip)
  
3. Install Alexa Service 

4. Ask your Echo "Alexa ask kodi for my key"  (Your Key will be sent to your alexa app.)
  
5. Enter the key from your app into the Alexa.Service settings menu on Kodi

6. Restart Kodi 

Thats it.

# PreRequisites

  App currently expects ChromeLauncher and Pulsar Addons for Kodi.
  
  Will remove these dependencies and detect dynamically soon

#ToDo

Quite a bit, this is Alpha stage.

Need to Get published so this can be more user friendly to install

* (1/2 complete) Full screen on sports
* Better speech patterns
* (complete)~~Fix some nagging queue issues~~
* Create Generalized Addon navigator
* (complete) ~~Menu Navigation~~
* (complete) ~~State-ful navigation ("play Breaking Bad" -> "Which Season" -> "Season 3") etc~~
* Music
* Amazon Instant Video Streaming
* Chromecast support?
* Logitch Harmony support
* Media Location Priorities Setting

#Known Issues

* Android/Fire/OSX are untested, use at your own discretion (Boto3 and import errors sometimes)
* "There was a Problem with expected skills response" means server crash. Please notify me.
* Some shows starting with "the" launch incorrectly as Sports games
* Response is sometimes out of sync with performed action
* Users may not have up to date Schema, Can cause intent mismatches

