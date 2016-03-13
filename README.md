# HTPC_Alexa_Skill

This is an Alexa skill which allows you to control media on your Kodi Media Center


# Supported Speech Patterns

[Please see Sample Utterances for examples](https://github.com/rsummers618/HTPC_Alexa_Skill/blob/master/Alexa/speechAssets/SampleUtterancesGenerator.txt)

# Supported Features

* Local Movie Playback
* Local TV show playback
* Movie Playback via installed addons
* TV show Playback via installed addons
* Sports playback through installed addons
* Netflix Playback via Chrome

Experimental Features that are not throughouly tested or supported, but in the works
* Sports Playback through Chrome (ESPN, FOX, NBC, ABC etc)
* Pandora
* Amazon Prime Instant Video via Chrome
* HDHomerun


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
        
        Custom Slots Type: Create A custom slot for each file named in /Alexa/speechAssets/CustomSlots and copy/paste its contents
        
        Sample Utterances: Copy paste from /Alexa/speechAssets/SampleUtterances.txt
        
      Save and You are Done!
  
3. Install My Repo to Kodi [Here](https://github.com/rsummers618/HTPC_Alexa_Skill/raw/master/Kodi/zips/repository.rsummers618/repository.rsummers618-1.0.zip)
  
3. Install Alexa Service 

4. Ask your Echo "Alexa ask kodi for my key"  (Your Key will be sent to your alexa app.)
  
5. Enter the key from your app into the Alexa.Service settings menu on Kodi

6. Restart Kodi 

7. Run your configuration, to enable/disable addons you do or don't want

Thats it.

#ToDo

Currently in Beta Stage

Need to Get published so this can be more user friendly to install

* (1/2 done) Create Generalized Addon navigator
* Music (Difficult as there is no unified database or naming scheme)
* Chromecast support?
* Logitch Harmony support
* Media Location Priorities Setting


