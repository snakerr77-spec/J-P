fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'pe_core'
description 'Porto Esmeralda - núcleo: jogador, dinheiro, inventário, empregos, HUD'
version '1.0.0'

dependencies { 'pe_menu' }

shared_script 'config.lua'
client_scripts { 'lib/client.lua', 'client/main.lua', 'client/hud.lua' }
server_scripts { 'lib/server.lua', 'server/main.lua' }
