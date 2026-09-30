fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'pe_admin'
description 'Porto Esmeralda - ferramentas de administração'
version '1.0.0'

dependencies { 'pe_core' }

client_scripts { '@pe_core/lib/client.lua', 'client.lua' }
server_scripts { '@pe_core/lib/server.lua', 'server.lua' }
