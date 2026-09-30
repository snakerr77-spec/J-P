-- Lógica confiável (dinheiro, itens, permissões) fica SEMPRE aqui no server.
AddEventHandler('playerJoining', function()
    print(('[jp_base] %s entrou no servidor'):format(GetPlayerName(source)))
end)

RegisterNetEvent('jp_base:requestWelcome', function()
    TriggerClientEvent('jp_base:welcome', source, Config.WelcomeMessage)
end)
