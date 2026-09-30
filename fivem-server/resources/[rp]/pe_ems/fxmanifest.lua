fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'pe_ems'
description 'Porto Esmeralda - hospital e paramédicos'
version '1.0.0'

dependencies { 'pe_core', 'pe_menu' }

shared_script 'config.lua'
client_scripts { '@pe_core/lib/client.lua', 'client/main.lua' }
server_scripts { '@pe_core/lib/server.lua', 'server/main.lua' }
