import xml.etree.ElementTree as ET
import os

supported_xml = os.path.join(os.path.dirname(__file__), 'resources','supported.xml')
english_strings_file = os.path.join(os.path.dirname(__file__), 'resources','language','English','strings.po')
settings_xml_file = os.path.join(os.path.dirname(__file__), 'resources','settings.xml')

addon_ids = {
	'series':32100,
	'movies':32200,
	'music':32300,
	'live':32400,
	'sports':32500
}

def get_tree():
	tree = ET.parse(supported_xml)
	return tree.getroot()

def get_addons(tree):
	return

def write_settings():

	settings_xml ='<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n'
	settings_xml +='<settings>\n'

	english_strings = 'msgid ""\nmsgstr ""\n\n'

	stringid = 32001
	settings_xml += '\t<category label=\"' + str(stringid) + '\">\n'
	english_strings +='msgctxt \"#' +str(stringid)+ '\"\n' + 'msgid \"Alexa Skill\"\n' + 'msgstr \"\"\n\n'
	stringid += 1
	settings_xml += '\t\t<setting type="text"    id="authcode"           default=""      label="' +str(stringid)+ '"/>\n'
	english_strings +='msgctxt \"#' +str(stringid)+ '\"\n' + 'msgid \"Auth Code\"\n' + 'msgstr \"\"\n\n'
	stringid += 1
	settings_xml += '\t\t<setting type="text"    id="socket_url"         default="http://ec2-54-191-98-39.us-west-2.compute.amazonaws.com" label="' +str(stringid)+ '"/>\n'
	english_strings +='msgctxt \"#' +str(stringid)+ '\"\n' + 'msgid \"Remote URL\"\n' + 'msgstr \"\"\n\n'
	stringid += 1
	settings_xml += '\t\t<setting type="text"    id="socket_port"        default="3000"  label="' +str(stringid)+ '"/>\n'
	english_strings +='msgctxt \"#' +str(stringid)+ '\"\n' + 'msgid \"Remote Port\"\n' + 'msgstr \"\"\n\n'
	stringid += 1
	settings_xml += '\t\t<setting type="bool"    id="debug"              default="false" label="' +str(stringid)+ '"/>\n'
	english_strings +='msgctxt \"#' +str(stringid)+ '\"\n' + 'msgid \"Debug Log To File\"\n' + 'msgstr \"\"\n\n'
	stringid += 1
	settings_xml += '\t\t<setting type="text"    id="debug_loc"          default=""      subsetting="true" label="' +str(stringid)+ '"   visible="eq(-1,true)"/>\n'
	english_strings +='msgctxt \"#' +str(stringid)+ '\"\n' + 'msgid \"Filepath\"\n' + 'msgstr \"\"\n\n'
	stringid += 1
	settings_xml += '\t</category>\n'

	tree =get_tree()
	for category in tree:
		#print (category.attrib['type'])

		stringid = addon_ids[category.attrib['type']]
		settings_xml += '\t<category label=\"' + str(stringid) + '\">\n'
		english_strings += 'msgctxt \"#' +str(stringid)+ '\"\n'
		english_strings += 'msgid \"' +category.attrib['type']+ '\"\n'
		english_strings += 'msgstr \"\"\n\n'
		stringid += 1

		for addon in category:
			#print(addon.attrib['name'])
			if addon.attrib['type'] == 'plugin':
				addon_string = addon.attrib['type']+'.' +addon.attrib['prefix']+'.'+addon.attrib['name']
			elif addon.attrib['type'] == 'website':
				addon_string = 'plugin.program.chrome.launcher'

			settings_xml += '\t\t<setting type=\"bool\" id=\"'+category.attrib['type']+ "_" + addon.attrib['name'] + '\" label=\"' +str(stringid)+ '\" default=\"true\" visible=\"System.HasAddon('+addon_string+')\" />\n'
			english_strings += 'msgctxt \"#' +str(stringid)+ '\"\n'
			english_strings += 'msgid \"' +addon.attrib['name']+ '\"\n'
			english_strings += 'msgstr \"\"\n\n'
			stringid += 1
		settings_xml += '\t</category>\n'
	settings_xml += '</settings>'


	settings_fd = open (settings_xml_file, 'w')
	settings_fd.write(settings_xml)
	settings_fd.close()

	strings_fd = open(english_strings_file, 'w')
	strings_fd.write(english_strings)
	strings_fd.close()



write_settings()