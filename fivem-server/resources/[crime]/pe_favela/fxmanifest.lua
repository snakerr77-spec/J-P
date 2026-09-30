fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'pe_favela'
description 'Porto Esmeralda - Morro do Corvo: tráfico, mercado negro, desmanche, lavagem e assalto ao carro-forte'
version '1.0.0'

dependencies { 'pe_core', 'pe_menu', 'pe_police', 'pe_garage' }

shared_script 'config.lua'
client_scripts { '@pe_core/lib/client.lua', 'client/main.lua' }
server_scripts { '@pe_core/lib/server.lua', 'server/main.lua' }
